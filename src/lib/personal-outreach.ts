import { createHash, createHmac } from "node:crypto";

import { siteConfig } from "@/data/site";

const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{16,80}$/;
const VISIT_TICKET = /^[A-Za-z0-9_-]{24,2048}\.[0-9a-f]{64}$/i;
const MAX_RECEIVER_RESPONSE_BYTES = 16 * 1024;

export const outreachReceiverSchemaVersion = 2 as const;

export type PersonalPageFinding = Readonly<{
  title: string;
  observation: string;
  implication: string;
  sourceLabel: string;
  verifiedAt: string;
}>;

export type PersonalPageFirstTest = Readonly<{
  title: string;
  description: string;
}>;

export type PersonalPageResolution = {
  publicPageLabel: string;
  findings: readonly [PersonalPageFinding, PersonalPageFinding];
  firstTest: PersonalPageFirstTest;
  visitTicket: string;
};

type ReceiverResolution = {
  ok?: unknown;
  allowed?: unknown;
  publicPageLabel?: unknown;
  findings?: unknown;
  firstTest?: unknown;
  visitTicket?: unknown;
};

export type PersonalWhatsAppChoice = "deeper_check" | "meeting_15_min";

export type PersonalWhatsAppRequest = Readonly<{
  href: string;
  message: string;
}>;

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

function curatedPublicText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    return null;
  }
  const text = value.replace(/\s+/g, " ").trim();
  return text && text.length <= maxLength ? text : null;
}

function curatedVerifiedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  if (date.toISOString().slice(0, 10) !== value.trim()) return null;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function curatedFinding(value: unknown): PersonalPageFinding | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = curatedPublicText(record.title, 120);
  const observation = curatedPublicText(record.observation, 900);
  const implication = curatedPublicText(record.implication, 900);
  const sourceLabel = curatedPublicText(record.sourceLabel, 160);
  const verifiedAt = curatedVerifiedAt(record.verifiedAt);
  if (!title || !observation || !implication || !sourceLabel || !verifiedAt) {
    return null;
  }
  return { title, observation, implication, sourceLabel, verifiedAt };
}

function curatedFindings(
  value: unknown,
): readonly [PersonalPageFinding, PersonalPageFinding] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const first = curatedFinding(value[0]);
  const second = curatedFinding(value[1]);
  return first && second ? [first, second] : null;
}

function curatedFirstTest(value: unknown): PersonalPageFirstTest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = curatedPublicText(record.title, 160);
  const description = curatedPublicText(record.description, 1200);
  return title && description ? { title, description } : null;
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

  const publicPageLabel = curatedPublicText(response.publicPageLabel, 120);
  const findings = curatedFindings(response.findings);
  const firstTest = curatedFirstTest(response.firstTest);
  if (!publicPageLabel || !findings || !firstTest) return null;

  return {
    publicPageLabel,
    findings,
    firstTest,
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

export function personalWhatsAppRequest(
  token: string,
  choice: PersonalWhatsAppChoice,
): PersonalWhatsAppRequest {
  const pageUrl = personalPageUrl(token);
  const request =
    choice === "meeting_15_min"
      ? "Ich möchte ein unverbindliches 15-Minuten-Gespräch dazu anfragen."
      : "Bitte senden Sie mir den vertieften Check per WhatsApp.";
  const message = [
    "Hallo Emad, ich habe meinen persönlichen IXA Anfrageweg-Check geöffnet:",
    pageUrl,
    "",
    request,
  ].join("\n");
  const configuredNumber =
    process.env.OUTREACH_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    siteConfig.contact.whatsappNumber.replace(/\D/g, "");
  const recipient = /^[1-9][0-9]{7,14}$/.test(configuredNumber)
    ? configuredNumber
    : "";
  if (!recipient) throw new Error("missing_outreach_whatsapp_number");
  return {
    href: `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`,
    message,
  };
}

export function personalWhatsAppHref(
  token: string,
  choice: PersonalWhatsAppChoice = "deeper_check",
): string {
  return personalWhatsAppRequest(token, choice).href;
}
