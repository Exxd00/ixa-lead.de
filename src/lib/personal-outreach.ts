import { createHash, createHmac } from "node:crypto";

import { siteConfig } from "@/data/site";

const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{16,80}$/;
const VISIT_TICKET = /^[A-Za-z0-9_-]{24,2048}\.[0-9a-f]{64}$/i;
const MAX_RECEIVER_RESPONSE_BYTES = 16 * 1024;

export const outreachReceiverSchemaVersion = 2 as const;

export type PersonalPageResolution = {
  publicPageLabel: string | null;
  visitTicket: string;
};

type ReceiverResolution = {
  ok?: unknown;
  allowed?: unknown;
  publicPageLabel?: unknown;
  visitTicket?: unknown;
};

export function isValidPublicToken(value: unknown): value is string {
  return typeof value === "string" && PUBLIC_TOKEN.test(value);
}

export function isValidVisitTicket(value: unknown): value is string {
  return typeof value === "string" && VISIT_TICKET.test(value);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function publicTokenProof(token: string, secret: string): string {
  return hmacSha256Hex(secret, sha256Hex(token));
}

export function trustedOutreachReceiverUrl(value: string): string {
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

function receiverConfiguration() {
  return {
    url: trustedOutreachReceiverUrl(
      process.env.OUTREACH_SHEET_WEBHOOK_URL?.trim() ||
        process.env.WHATSAPP_SHEET_WEBHOOK_URL?.trim() ||
        "",
    ),
    secret:
      process.env.OUTREACH_SHEET_WEBHOOK_SECRET?.trim() ||
      process.env.WHATSAPP_SHEET_WEBHOOK_SECRET?.trim() ||
      "",
  };
}

async function postToReceiver(
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const { url, secret } = receiverConfiguration();
  if (!url || secret.length < 32) return null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        _secret: secret,
        schemaVersion: outreachReceiverSchemaVersion,
      }),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;

    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_RECEIVER_RESPONSE_BYTES) {
      return null;
    }
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function curatedPublicLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.trim();
  return label && label.length <= 120 ? label : null;
}

export async function resolvePersonalPage(
  token: string,
): Promise<PersonalPageResolution | null> {
  if (!isValidPublicToken(token)) return null;
  const { secret } = receiverConfiguration();
  if (secret.length < 32) return null;

  const response = (await postToReceiver({
    recordType: "personal_page_resolve",
    tokenProof: publicTokenProof(token, secret),
  })) as ReceiverResolution | null;

  if (
    response?.ok !== true ||
    response.allowed !== true ||
    !isValidVisitTicket(response.visitTicket)
  ) {
    return null;
  }

  return {
    publicPageLabel: curatedPublicLabel(response.publicPageLabel),
    visitTicket: response.visitTicket,
  };
}

export async function recordPersonalPageVisit(ticket: string): Promise<boolean> {
  if (!isValidVisitTicket(ticket)) return false;
  const response = await postToReceiver({
    recordType: "personal_page_visit",
    visitTicket: ticket,
  });
  return response?.ok === true;
}

export function personalPageUrl(token: string): string {
  if (!isValidPublicToken(token)) throw new Error("invalid_public_token");
  const configured = process.env.OUTREACH_PUBLIC_BASE_URL?.trim() || "";
  let origin = "https://ixa-leads.de";
  try {
    const url = new URL(configured);
    if (url.protocol === "https:" && !url.username && !url.password) {
      origin = url.origin;
    }
  } catch {
    // The canonical production origin is the safe fallback.
  }
  return `${origin}/r/${token}`;
}

export function personalWhatsAppHref(token: string): string {
  const pageUrl = personalPageUrl(token);
  const message = [
    "Hallo Emad, ich habe meinen persönlichen IXA Check geöffnet:",
    pageUrl,
    "",
    "Bitte senden Sie mir die kurze Ersteinschätzung.",
  ].join("\n");
  const configuredNumber =
    process.env.OUTREACH_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    siteConfig.contact.whatsappNumber.replace(/\D/g, "");
  const recipient = /^[1-9][0-9]{7,14}$/.test(configuredNumber)
    ? configuredNumber
    : "";
  if (!recipient) throw new Error("missing_outreach_whatsapp_number");
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}
