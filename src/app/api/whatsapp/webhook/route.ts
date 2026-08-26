import { NextResponse } from "next/server";

import {
  extractWhatsAppMessages,
  hmacSha256Hex,
  maxWhatsAppWebhookBytes,
  sha256Hex,
  verifyMetaSignature,
  whatsappWebhookSchemaVersion,
  type ParsedWhatsAppMessage,
} from "@/lib/whatsapp-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AllowlistMatch = {
  requestKey?: string;
  ok?: boolean;
  allowed?: boolean;
  companyId?: string;
  contactId?: string;
  printedRef?: string;
  matchMethod?: string;
  matchConfidence?: number;
};

type AllowlistBatchResult = {
  ok?: boolean;
  results?: AllowlistMatch[];
};

type SaveBatchResult = {
  ok?: boolean;
  sourceMessageIds?: unknown;
};

function privateJson(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function configuration() {
  return {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim() ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "",
    businessAccountId:
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ?? "",
    sheetWebhookUrl: trustedSheetWebhookUrl(
      process.env.WHATSAPP_SHEET_WEBHOOK_URL?.trim() ?? "",
    ),
    sheetWebhookSecret:
      process.env.WHATSAPP_SHEET_WEBHOOK_SECRET?.trim() ?? "",
  };
}

function trustedSheetWebhookUrl(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)
    ) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

async function postToSheet<T>(
  url: string,
  secret: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      _secret: secret,
      schemaVersion: whatsappWebhookSchemaVersion,
    }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error("sheet_receiver_http_error");
  return (await response.json()) as T;
}

async function processMessages(
  messages: ParsedWhatsAppMessage[],
  sheetWebhookUrl: string,
  sheetWebhookSecret: string,
): Promise<void> {
  if (!messages.length) return;

  const prepared = messages.map((message) => ({
    message,
    requestKey: sha256Hex(message.messageId),
    phoneProof: hmacSha256Hex(
      sheetWebhookSecret,
      message.phoneE164.replace(/\D/g, ""),
    ),
    referenceProofs: message.referenceHashes.map((hash) =>
      hmacSha256Hex(sheetWebhookSecret, hash),
    ),
  }));

  // Privacy gate: only hashes are sent for the first check. The message text
  // is never forwarded when the sender is not an allowlisted prospect and
  // does not supply a valid saved reference.
  const allowlist = await postToSheet<AllowlistBatchResult>(
    sheetWebhookUrl,
    sheetWebhookSecret,
    {
      recordType: "whatsapp_allowlist_batch",
      items: prepared.map(({ requestKey, phoneProof, referenceProofs }) => ({
        requestKey,
        phoneProof,
        referenceProofs,
      })),
    },
  );

  if (allowlist.ok !== true || !Array.isArray(allowlist.results)) {
    throw new Error("allowlist_check_failed");
  }

  const allowedKeys = new Set(
    allowlist.results
      .filter(
        (result) =>
          result &&
          result.allowed === true &&
          typeof result.requestKey === "string" &&
          prepared.some(({ requestKey }) => requestKey === result.requestKey),
      )
      .map((result) => result.requestKey as string),
  );
  const accepted = prepared.filter(({ requestKey }) =>
    allowedKeys.has(requestKey),
  );
  if (!accepted.length) return;

  const saved = await postToSheet<SaveBatchResult>(
    sheetWebhookUrl,
    sheetWebhookSecret,
    {
      recordType: "whatsapp_inbound_batch",
      items: accepted.map(
        ({ message, requestKey, phoneProof, referenceProofs }) => ({
          requestKey,
          phoneProof,
          referenceProofs,
          sourceMessageId: message.messageId,
          receivedAt: message.receivedAt,
          phoneE164: message.phoneE164,
          messageType: message.messageType,
          messageText: message.messageText,
        }),
      ),
    },
  );

  const savedIds = Array.isArray(saved.sourceMessageIds)
    ? new Set(saved.sourceMessageIds.filter((id): id is string => typeof id === "string"))
    : new Set<string>();
  if (
    saved.ok !== true ||
    accepted.some(({ message }) => !savedIds.has(message.messageId))
  ) {
    throw new Error("inbound_save_failed");
  }
}

async function readLimitedBody(request: Request): Promise<Buffer | null> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxWhatsAppWebhookBytes) {
    return null;
  }

  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxWhatsAppWebhookBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function GET(request: Request) {
  const { verifyToken } = configuration();
  if (!verifyToken) return privateJson({ ok: false }, 503);

  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || token !== verifyToken || !challenge) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  const {
    appSecret,
    phoneNumberId,
    businessAccountId,
    sheetWebhookUrl,
    sheetWebhookSecret,
  } = configuration();
  if (
    !appSecret ||
    !phoneNumberId ||
    !businessAccountId ||
    !sheetWebhookUrl ||
    !sheetWebhookSecret
  ) {
    return privateJson({ received: false }, 503);
  }

  const rawBody = await readLimitedBody(request);
  if (!rawBody) {
    return privateJson({ received: false }, 413);
  }

  if (
    !verifyMetaSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      appSecret,
    )
  ) {
    return privateJson({ received: false }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return privateJson({ received: false }, 400);
  }

  try {
    await processMessages(
      extractWhatsAppMessages(
      payload,
      businessAccountId,
      phoneNumberId,
      ),
      sheetWebhookUrl,
      sheetWebhookSecret,
    );
    return privateJson({ received: true });
  } catch {
    // Meta can safely retry. The Sheet receiver deduplicates by message ID.
    return privateJson({ received: false }, 503);
  }
}
