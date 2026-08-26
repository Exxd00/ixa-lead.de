import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const HEX_SHA256 = /^[0-9a-f]{64}$/i;
const PRINTED_REFERENCE = /\bIXAP[0-9]{9,20}\b/gi;
const TRACKING_TOKEN_URL = /ixa-leads\.de\/r\/([A-Za-z0-9_-]{16,80})/gi;

export const whatsappWebhookSchemaVersion = 1 as const;
export const maxWhatsAppWebhookBytes = 256 * 1024;
export const maxWhatsAppMessagesPerWebhook = 50;

type UnknownRecord = Record<string, unknown>;

export type ParsedWhatsAppMessage = {
  messageId: string;
  phoneE164: string;
  receivedAt: string;
  messageType: string;
  messageText: string;
  referenceHashes: string[];
};

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown, maxLength = 4000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && HEX_SHA256.test(value);
}

export function normalizeWhatsAppPhone(value: unknown): string {
  let digits = text(value, 40).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return /^[1-9][0-9]{7,14}$/.test(digits) ? `+${digits}` : "";
}

export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  const suppliedHex = signatureHeader?.match(/^sha256=([0-9a-f]{64})$/i)?.[1];
  if (!suppliedHex || !appSecret) return false;

  const expected = Buffer.from(
    createHmac("sha256", appSecret).update(rawBody).digest("hex"),
    "hex",
  );
  const supplied = Buffer.from(suppliedHex, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function extractReferenceHashes(messageText: string): string[] {
  const candidates = new Set<string>();

  for (const match of messageText.matchAll(PRINTED_REFERENCE)) {
    candidates.add(match[0].toUpperCase());
  }
  for (const match of messageText.matchAll(TRACKING_TOKEN_URL)) {
    if (match[1]) candidates.add(match[1]);
  }

  return Array.from(candidates, (candidate) => sha256Hex(candidate)).slice(0, 8);
}

function extractInteractiveText(message: UnknownRecord): string {
  const interactive = record(message.interactive);
  if (!interactive) return "";

  const buttonReply = record(interactive.button_reply);
  if (buttonReply) {
    return text(buttonReply.title) || text(buttonReply.id);
  }

  const listReply = record(interactive.list_reply);
  if (listReply) {
    return [text(listReply.title), text(listReply.description), text(listReply.id)]
      .filter(Boolean)
      .join(" · ");
  }

  return "";
}

function extractMessageText(message: UnknownRecord, messageType: string): string {
  if (messageType === "text") {
    return text(record(message.text)?.body);
  }
  if (messageType === "button") {
    const button = record(message.button);
    return text(button?.text) || text(button?.payload) || "[button]";
  }
  if (messageType === "interactive") {
    return extractInteractiveText(message) || "[interactive]";
  }

  if (["image", "video", "document"].includes(messageType)) {
    const media = record(message[messageType]);
    const caption = text(media?.caption);
    return caption ? `[${messageType}] ${caption}` : `[${messageType}]`;
  }

  if (
    ["audio", "sticker", "location", "contacts", "reaction"].includes(
      messageType,
    )
  ) {
    return `[${messageType}]`;
  }

  return `[${messageType || "unknown"}]`;
}

function timestampToIso(value: unknown): string {
  const seconds = Number(text(value, 20));
  if (!Number.isFinite(seconds) || seconds <= 0) return new Date().toISOString();

  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

/**
 * Extracts only inbound messages. Delivery/read status notifications are
 * intentionally ignored because they are not customer messages.
 */
export function extractWhatsAppMessages(
  payload: unknown,
  expectedBusinessAccountId: string,
  expectedPhoneNumberId: string,
): ParsedWhatsAppMessage[] {
  const root = record(payload);
  if (!root || root.object !== "whatsapp_business_account") return [];

  const parsed: ParsedWhatsAppMessage[] = [];

  for (const entryValue of array(root.entry)) {
    const entry = record(entryValue);
    if (text(entry?.id, 100) !== expectedBusinessAccountId) continue;

    for (const changeValue of array(entry?.changes)) {
      const change = record(changeValue);
      if (change?.field !== "messages") continue;

      const value = record(change?.value);
      const metadata = record(value?.metadata);
      if (text(metadata?.phone_number_id, 100) !== expectedPhoneNumberId) {
        continue;
      }

      for (const messageValue of array(value?.messages)) {
        const message = record(messageValue);
        if (!message) continue;

        const messageId = text(message.id, 255);
        const phoneE164 = normalizeWhatsAppPhone(message.from);
        const messageType = text(message.type, 40).toLowerCase() || "unknown";
        if (!messageId || !phoneE164) continue;

        const messageText = extractMessageText(message, messageType).slice(0, 4000);
        parsed.push({
          messageId,
          phoneE164,
          receivedAt: timestampToIso(message.timestamp),
          messageType,
          messageText,
          referenceHashes: extractReferenceHashes(messageText),
        });
      }
    }
  }

  return parsed.slice(0, maxWhatsAppMessagesPerWebhook);
}
