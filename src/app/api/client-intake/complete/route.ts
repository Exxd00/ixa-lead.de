import { NextRequest, NextResponse } from "next/server";
import {
  INTAKE_RECEIPT_COOKIE,
  verifyIntakeReceipt,
} from "@/lib/client-intake-receipt";
import { writeIntakeSheet } from "@/lib/client-intake-sheet";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(request.url).origin,
    "https://ixa-leads.de",
    "https://www.ixa-leads.de",
  ]);
  const receipt = verifyIntakeReceipt(
    request.cookies.get(INTAKE_RECEIPT_COOKIE)?.value,
  );
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };
  if (
    !receipt ||
    !origin ||
    !allowed.has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    request.headers.get("x-ixa-statistics") !== "granted"
  )
    return NextResponse.json({ ok: false }, { status: 403, headers });
  const result = await writeIntakeSheet({
    operation: "claim_tracking",
    submissionId: receipt.id,
  });
  if (!result)
    return NextResponse.json({ ok: false }, { status: 503, headers });
  return NextResponse.json(
    { ok: true, sendEvent: result.sendEvent === true },
    { headers },
  );
}
