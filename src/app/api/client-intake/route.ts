import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { parseIntake, isIntakeEmail } from "@/lib/client-intake";
import { intakeEmail } from "@/lib/client-intake-email";
import { siteConfig } from "@/data/site";
import {
  createIntakeReceipt,
  INTAKE_RECEIPT_COOKIE,
} from "@/lib/client-intake-receipt";
import {
  intakeReceiverConfig,
  intakeSheetHeaders,
  intakeSheetValues,
  intakeRecordUrl,
  writeIntakeSheet,
} from "@/lib/client-intake-sheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 32_768;
// An additional, bounded warm-instance guard. This is not a distributed quota.
const attempts = new Map<string, { count: number; expiresAt: number }>();

function reply(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function limitedJson(request: Request): Promise<unknown> {
  if (
    Number(request.headers.get("content-length")) > MAX_BYTES ||
    !request.body
  )
    throw new Error("size");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("size");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(request.url).origin,
    siteConfig.seo.url,
    "https://www.ixa-leads.de",
  ]);
  if (
    !origin ||
    !allowed.has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return reply({ ok: false, error: "invalid_origin" }, 403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return reply({ ok: false, error: "invalid_content_type" }, 415);

  const now = Date.now();
  for (const [key, item] of attempts)
    if (item.expiresAt <= now) attempts.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    const key = createHash("sha256").update(ip).digest("hex");
    const bucket = attempts.get(key) ?? {
      count: 0,
      expiresAt: now + 15 * 60_000,
    };
    if (bucket.count >= 10)
      return reply({ ok: false, error: "too_many_requests" }, 429);
    if (attempts.size >= 1000 && !attempts.has(key))
      return reply({ ok: false, error: "too_many_requests" }, 429);
    bucket.count++;
    attempts.set(key, bucket);
  }

  let raw: unknown;
  try {
    raw = await limitedJson(request);
  } catch (error) {
    return reply(
      { ok: false, error: "invalid_payload" },
      error instanceof Error && error.message === "size" ? 413 : 400,
    );
  }
  const parsed = parseIntake(raw);
  if (!parsed.ok)
    return reply({ ok: false, error: parsed.code, fields: parsed.errors }, 422);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to =
    process.env.CLIENT_INTAKE_NOTIFICATION_EMAIL?.trim() ||
    siteConfig.contact.emailDisplay;
  if (!apiKey || !from || !isIntakeEmail(to) || !intakeReceiverConfig())
    return reply({ ok: false, error: "temporarily_unavailable" }, 503);

  // Same answers + submission ID produce exactly the same request on retry,
  // including after a response is lost. No changing timestamp in the payload.
  const digest = createHash("sha256")
    .update(JSON.stringify(parsed.answers))
    .digest("hex")
    .slice(0, 32);
  const saved = await writeIntakeSheet({
    operation: "save",
    submissionId: parsed.submissionId,
    digest,
    headers: intakeSheetHeaders,
    values: intakeSheetValues(parsed.answers, parsed.submissionId, digest),
  });
  if (!saved) return reply({ ok: false, error: "storage_failed" }, 502);
  const content = intakeEmail(
    parsed.answers,
    parsed.submissionId,
    intakeRecordUrl(Number(saved.rowNumber)),
  );
  const success = () => {
    const response = reply({
      ok: true,
      submissionId: parsed.submissionId,
      redirect: "/info/danke",
    });
    response.cookies.set(
      INTAKE_RECEIPT_COOKIE,
      createIntakeReceipt(parsed.submissionId),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 1800,
      },
    );
    return response;
  };
  if (saved.emailAccepted === true) return success();
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `client-intake/${parsed.submissionId}/${digest}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        ...content,
        ...(isIntakeEmail(parsed.answers.email)
          ? { reply_to: parsed.answers.email }
          : {}),
        tags: [{ name: "source", value: "client-intake" }],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const result: unknown = await response.json().catch(() => null);
    if (
      !response.ok ||
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      !result.id
    ) {
      console.error("[client-intake] email_not_accepted", response.status);
      return reply({ ok: false, error: "delivery_failed" }, 502);
    }
    const updated = await writeIntakeSheet({
      operation: "email_accepted",
      submissionId: parsed.submissionId,
      digest,
      emailId: result.id,
    });
    // A saved row and an accepted email are the two required outcomes. Status
    // sync may be retried by the same idempotent submission after an interruption.
    if (!updated) console.error("[client-intake] email_status_sync_failed");
    return success();
  } catch {
    console.error("[client-intake] email_request_failed");
    return reply({ ok: false, error: "delivery_failed" }, 502);
  }
}
