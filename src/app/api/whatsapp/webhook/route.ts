import { NextResponse } from "next/server";

import {
  extractWhatsAppMessages,
  hmacSha256Hex,
  maxWhatsAppWebhookBytes,
  sha256Hex,
  verifyMetaSignature,
  WhatsAppMessageLimitError,
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
  allowlistTicket?: string;
};

type AllowlistBatchResult = {
  ok?: boolean;
  results?: AllowlistMatch[];
};

type SaveBatchResult = {
  ok?: boolean;
  sourceMessageIds?: unknown;
};

const maxSheetWebhookBytes = 256 * 1024;

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
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ?? "",
    sheetWebhookUrl: trustedSheetWebhookUrl(
      process.env.WHATSAPP_SHEET_WEBHOOK_URL?.trim() ?? "",
    ),
    sheetWebhookSecret: process.env.WHATSAPP_SHEET_WEBHOOK_SECRET?.trim() ?? "",
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
  const serializedBody = JSON.stringify({
    ...body,
    _secret: secret,
    schemaVersion: whatsappWebhookSchemaVersion,
  });
  if (Buffer.byteLength(serializedBody, "utf8") > maxSheetWebhookBytes) {
    throw new Error("sheet_receiver_payload_too_large");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: serializedBody,
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error("sheet_receiver_http_error");
  return (await response.json()) as T;
}

function chunkSheetItems(
  recordType: string,
  items: Record<string, unknown>[],
  secret: string,
): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = [];
  let current: Record<string, unknown>[] = [];

  for (const item of items) {
    const candidate = [...current, item];
    const serialized = JSON.stringify({
      recordType,
      items: candidate,
      _secret: secret,
      schemaVersion: whatsappWebhookSchemaVersion,
    });
    if (Buffer.byteLength(serialized, "utf8") <= maxSheetWebhookBytes) {
      current = candidate;
      continue;
    }
    if (!current.length) throw new Error("sheet_receiver_item_too_large");
    chunks.push(current);
    current = [item];
  }

  if (current.length) chunks.push(current);
  return chunks;
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

  const preparedKeys = new Set(prepared.map(({ requestKey }) => requestKey));
  const allowedTickets = new Map<string, string>();
  for (const result of allowlist.results) {
    if (
      result &&
      result.allowed === true &&
      typeof result.requestKey === "string" &&
      preparedKeys.has(result.requestKey) &&
      typeof result.allowlistTicket === "string" &&
      result.allowlistTicket.length >= 64 &&
      result.allowlistTicket.length <= 4096
    ) {
      allowedTickets.set(result.requestKey, result.allowlistTicket);
    }
  }
  const accepted = prepared.flatMap((item) => {
    const allowlistTicket = allowedTickets.get(item.requestKey);
    return allowlistTicket ? [{ ...item, allowlistTicket }] : [];
  });
  if (!accepted.length) return;

  const saveItems = accepted.map(
    ({
      message,
      requestKey,
      phoneProof,
      referenceProofs,
      allowlistTicket,
    }) => ({
      requestKey,
      phoneProof,
      referenceProofs,
      allowlistTicket,
      sourceMessageId: message.messageId,
      receivedAt: message.receivedAt,
      phoneE164: message.phoneE164,
      messageType: message.messageType,
      messageText: message.messageText,
    }),
  );
  for (const items of chunkSheetItems(
    "whatsapp_inbound_batch",
    saveItems,
    sheetWebhookSecret,
  )) {
    const saved = await postToSheet<SaveBatchResult>(
      sheetWebhookUrl,
      sheetWebhookSecret,
      { recordType: "whatsapp_inbound_batch", items },
    );
    const savedIds = Array.isArray(saved.sourceMessageIds)
      ? new Set(
          saved.sourceMessageIds.filter(
            (id): id is string => typeof id === "string",
          ),
        )
      : new Set<string>();
    if (
      saved.ok !== true ||
      items.some(
        ({ sourceMessageId }) =>
          typeof sourceMessageId !== "string" || !savedIds.has(sourceMessageId),
      )
    ) {
      throw new Error("inbound_save_failed");
    }
  }
}

async function readLimitedBody(request: Request): Promise<Buffer | null> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > maxWhatsAppWebhookBytes
  ) {
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

  let messages: ParsedWhatsAppMessage[];
  try {
    messages = extractWhatsAppMessages(
      payload,
      businessAccountId,
      phoneNumberId,
    );
  } catch (error) {
    if (error instanceof WhatsAppMessageLimitError) {
      return privateJson({ received: false }, 413);
    }
    return privateJson({ received: false }, 400);
  }

  try {
    await processMessages(messages, sheetWebhookUrl, sheetWebhookSecret);
    return privateJson({ received: true });
  } catch {
    // Meta can safely retry. The Sheet receiver deduplicates by message ID.
    return privateJson({ received: false }, 503);
  }
}
