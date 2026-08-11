import {
  callbackService,
  freeCheckServiceId,
  leadServiceOptions,
} from "@/data/site";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SCHEMA_VERSION = 1 as const;
const SOURCE = "ixa-leads.de";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()./-]*$/;

const payloadKeys = [
  "submissionId",
  "submissionType",
  "entryPoint",
  "name",
  "contact",
  "url",
  "company",
  "serviceFocus",
  "serviceArea",
  "adService",
  "neededService",
  "problem",
  "budget",
  "serviceId",
  "auditType",
  "contactMethod",
  "visitLocation",
  "visitWindow",
  "projectDetail",
  "branch",
  "capacity",
  "orderValueRange",
  "adBudgetReadiness",
  "startTiming",
  "landingPath",
  "referrerHost",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "gclid",
] as const;

type PayloadKey = (typeof payloadKeys)[number];
type Payload = Partial<Record<PayloadKey, string>>;

type Lead = Payload & {
  submissionId: string;
  submissionType: "callback" | "lead_form";
  schemaVersion: typeof SCHEMA_VERSION;
  source: typeof SOURCE;
  receivedAt: string;
};

type SheetResponse = {
  ok: true;
  duplicate: boolean;
  submissionId: string;
};

type SheetRejectionCode =
  | "unauthorized"
  | "invalid_payload"
  | "invalid_record_type"
  | "busy"
  | "receiver_error";

type SheetFailureReason =
  | SheetRejectionCode
  | "receiver_http_error"
  | "receiver_invalid_json"
  | "receiver_invalid_acknowledgement"
  | "receiver_request_failed";

type SheetForwardResult =
  | { ok: true }
  | { ok: false; reason: SheetFailureReason };

const sheetErrorCodes = new Set<string>([
  "unauthorized",
  "invalid_payload",
  "invalid_record_type",
  "busy",
  "receiver_error",
]);

const fieldLimits: Partial<Record<PayloadKey, number>> = {
  submissionId: 36,
  submissionType: 32,
  entryPoint: 160,
  name: 160,
  contact: 320,
  url: 2_000,
  company: 240,
  serviceFocus: 500,
  serviceArea: 500,
  adService: 500,
  neededService: 500,
  problem: 2_000,
  budget: 500,
  serviceId: 100,
  auditType: 40,
  contactMethod: 40,
  visitLocation: 500,
  visitWindow: 500,
  projectDetail: 2_000,
  branch: 240,
  capacity: 500,
  orderValueRange: 500,
  adBudgetReadiness: 500,
  startTiming: 500,
  landingPath: 1_000,
  referrerHost: 255,
  utmSource: 500,
  utmMedium: 500,
  utmCampaign: 500,
  utmTerm: 500,
  utmContent: 500,
  gclid: 500,
};

function normalizeWebsite(value: string): string | null {
  const candidate = value.trim();
  if (!candidate || /\s/.test(candidate)) return null;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      !parsed.hostname.includes(".")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    value.length <= 50 &&
    PHONE_PATTERN.test(value) &&
    digits.length >= 6 &&
    digits.length <= 20
  );
}

function isContact(value: string): boolean {
  return isEmail(value) || isPhone(value);
}

function isSheetResponse(
  value: unknown,
  submissionId: string,
): value is SheetResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return (
    response.ok === true &&
    typeof response.duplicate === "boolean" &&
    response.submissionId === submissionId
  );
}

function sheetErrorCode(value: unknown): SheetRejectionCode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const response = value as Record<string, unknown>;
  return response.ok === false &&
    typeof response.error === "string" &&
    sheetErrorCodes.has(response.error)
    ? (response.error as SheetRejectionCode)
    : null;
}

function safeErrorLog(event: string, detail?: string | number) {
  // Intentionally never log the lead, webhook URL, response body, or secrets.
  if (detail === undefined) {
    console.error(`[contact] ${event}`);
    return;
  }
  console.error(`[contact] ${event}`, detail);
}

async function forwardToSheet(
  webhookUrl: string,
  webhookSecret: string,
  lead: Lead,
): Promise<SheetForwardResult> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...lead, _secret: webhookSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      safeErrorLog("sheet_http_error", response.status);
      return { ok: false, reason: "receiver_http_error" };
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      safeErrorLog("sheet_invalid_json");
      return { ok: false, reason: "receiver_invalid_json" };
    }

    const rejectionCode = sheetErrorCode(result);
    if (rejectionCode) {
      // Only log the receiver's fixed, non-sensitive error code. Never include
      // the response body because it may change independently of this route.
      safeErrorLog("sheet_rejected", rejectionCode);
      return { ok: false, reason: rejectionCode };
    }

    if (!isSheetResponse(result, lead.submissionId)) {
      safeErrorLog("sheet_invalid_acknowledgement");
      return { ok: false, reason: "receiver_invalid_acknowledgement" };
    }

    // Both a newly written row and an acknowledged duplicate are successful.
    return { ok: true };
  } catch {
    safeErrorLog("sheet_request_failed");
    return { ok: false, reason: "receiver_request_failed" };
  }
}

const notificationFields: Array<[keyof Lead, string]> = [
  ["neededService", "Gewünschte Leistung"],
  ["company", "Unternehmen"],
  ["name", "Ansprechpartner"],
  ["contact", "Telefon / E-Mail"],
  ["url", "Website"],
  ["serviceFocus", "Hauptleistung"],
  ["serviceArea", "Zielregion"],
  ["projectDetail", "Aktuelle Ausgangslage"],
  ["capacity", "Freie Kapazität"],
  ["orderValueRange", "Typischer Auftragswert"],
  ["problem", "Größtes Problem"],
  ["gclid", "Google Click ID (GCLID)"],
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function notificationContent(lead: Lead) {
  const receivedAt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(lead.receivedAt));
  const fields = notificationFields.flatMap(([key, label]) => {
    const value = lead[key];
    return typeof value === "string" && value
      ? [[key, label, value] as const]
      : [];
  });
  const text = [
    "Neue Anfrage über ixa-leads.de",
    `Eingegangen: ${receivedAt} Uhr`,
    "",
    ...fields.map(([, label, value]) => `${label}: ${value}`),
  ].join("\n");
  const rows = fields
    .map(([key, label, value]) => {
      const escapedValue = escapeHtml(value);
      const linkedValue =
        key === "contact"
          ? `<a href="${value.includes("@") ? `mailto:${escapedValue}` : `tel:${escapedValue}`}" style="color:#3157d5;font-weight:700;text-decoration:none">${escapedValue}</a>`
          : key === "url"
            ? `<a href="${escapedValue}" style="color:#3157d5;font-weight:700;text-decoration:none">${escapedValue}</a>`
            : escapedValue;

      return `<tr><th align="left" valign="top" style="width:34%;padding:14px 12px;border-bottom:1px solid #e7e5e4;color:#78716c;font-size:12px;line-height:1.5;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(label)}</th><td valign="top" style="padding:14px 12px;border-bottom:1px solid #e7e5e4;color:#172033;font-size:15px;line-height:1.55;font-weight:600;white-space:pre-wrap;word-break:break-word">${linkedValue}</td></tr>`;
    })
    .join("");

  return {
    text,
    html: `<!doctype html><html><body style="margin:0;padding:0;background:#f3f1eb;font-family:Arial,Helvetica,sans-serif;color:#172033"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1eb"><tr><td align="center" style="padding:20px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e5e4;border-radius:22px;overflow:hidden"><tr><td style="padding:28px 24px;background:#172033"><div style="font-size:12px;line-height:1.4;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7dd3a7">IXA LEADS · NEUE ANFRAGE</div><h1 style="margin:10px 0 0;font-size:25px;line-height:1.2;color:#ffffff">${escapeHtml(lead.company || lead.name || "Neue Kontaktanfrage")}</h1><p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#cbd5e1">Eingegangen am ${escapeHtml(receivedAt)} Uhr</p></td></tr><tr><td style="padding:12px 16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table><div style="margin-top:20px;padding:15px 16px;border-radius:14px;background:#eef2ff;color:#172033;font-size:13px;line-height:1.55"><strong>Persönlich bearbeiten:</strong> Bitte Kontakt aufnehmen und die Qualität der Anfrage später im Sheet dokumentieren.</div></td></tr><tr><td style="padding:16px 24px;background:#fafaf9;color:#78716c;font-size:11px;line-height:1.5;text-align:center">ixa-leads.de · Nürnberg &amp; Franken</td></tr></table></td></tr></table></body></html>`,
  };
}

async function sendLeadNotification(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.LEAD_NOTIFICATION_EMAIL?.trim();

  if (!apiKey || !from || !to) {
    safeErrorLog("resend_not_configured");
    return;
  }

  const content = notificationContent(lead);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `lead-notification/${lead.submissionId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Neue Anfrage · ${lead.company || lead.name || "ixa-leads.de"}`,
        text: content.text,
        html: content.html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      safeErrorLog("resend_http_error", response.status);
    }
  } catch {
    // The lead is already stored. Notification errors must not fail the form.
    safeErrorLog("resend_request_failed");
  }
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const raw = parsed as Record<string, unknown>;
  if (
    payloadKeys.some(
      (key) => raw[key] !== undefined && typeof raw[key] !== "string",
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_field_type" },
      { status: 400 },
    );
  }

  const data = Object.fromEntries(
    payloadKeys
      .filter((key) => typeof raw[key] === "string")
      .map((key) => [key, (raw[key] as string).trim()]),
  ) as Payload;

  const oversizedField = payloadKeys.some((key) => {
    const value = data[key];
    const limit = fieldLimits[key] ?? 2_000;
    return value !== undefined && value.length > limit;
  });
  if (oversizedField) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  if (!data.submissionId || !UUID_V4_PATTERN.test(data.submissionId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_submission_id" },
      { status: 422 },
    );
  }

  const isCallback = data.serviceId === callbackService.id;
  const selectedService = isCallback
    ? callbackService
    : leadServiceOptions.find((service) => service.id === data.serviceId);
  if (!selectedService) {
    return NextResponse.json(
      { ok: false, error: "invalid_service" },
      { status: 422 },
    );
  }

  if (!data.contact || (!isCallback && !data.name)) {
    return NextResponse.json(
      { ok: false, error: "missing_contact_fields" },
      { status: 422 },
    );
  }

  if (data.url) {
    const website = normalizeWebsite(data.url);
    if (!website) {
      return NextResponse.json(
        { ok: false, error: "invalid_website" },
        { status: 422 },
      );
    }
    data.url = website;
  }

  const isFreeCheck = data.serviceId === freeCheckServiceId;
  if (isCallback) {
    if (!isPhone(data.contact)) {
      return NextResponse.json(
        { ok: false, error: "invalid_phone" },
        { status: 422 },
      );
    }

    data.submissionType = "callback";
    data.entryPoint ||= "callback";
    data.url = "";
    data.company = "";
    data.serviceFocus = "";
    data.serviceArea = "";
    data.adService = "";
    data.problem = "";
    data.budget = "";
    data.auditType = "";
    data.contactMethod = "phone";
    data.visitLocation = "";
    data.visitWindow = "";
    data.projectDetail = "";
    data.branch = "";
    data.capacity = "";
    data.orderValueRange = "";
    data.adBudgetReadiness = "";
    data.startTiming = "";
  } else if (!data.serviceFocus || !data.serviceArea) {
    return NextResponse.json(
      { ok: false, error: "missing_business_scope" },
      { status: 422 },
    );
  } else if (isFreeCheck) {
    data.submissionType = "lead_form";
    data.entryPoint ||= "contact_form";

    if (data.auditType !== "written" && data.auditType !== "onsite") {
      return NextResponse.json(
        { ok: false, error: "invalid_audit_type" },
        { status: 422 },
      );
    }

    if (data.auditType === "written") {
      if (
        data.contactMethod !== "whatsapp" &&
        data.contactMethod !== "email" &&
        data.contactMethod !== "phone"
      ) {
        return NextResponse.json(
          { ok: false, error: "invalid_contact_method" },
          { status: 422 },
        );
      }
      if (
        (data.contactMethod === "email" && !isEmail(data.contact)) ||
        ((data.contactMethod === "whatsapp" ||
          data.contactMethod === "phone") &&
          !isPhone(data.contact))
      ) {
        return NextResponse.json(
          { ok: false, error: "invalid_contact" },
          { status: 422 },
        );
      }

      if (!data.company || !data.projectDetail || !data.capacity) {
        return NextResponse.json(
          { ok: false, error: "missing_qualification_details" },
          { status: 422 },
        );
      }

      data.adService = "";
      data.visitLocation = "";
      data.visitWindow = "";
    } else {
      if (
        !data.company ||
        !data.visitLocation ||
        !data.visitWindow ||
        !data.problem
      ) {
        return NextResponse.json(
          { ok: false, error: "missing_visit_details" },
          { status: 422 },
        );
      }
      if (!isPhone(data.contact)) {
        return NextResponse.json(
          { ok: false, error: "invalid_phone" },
          { status: 422 },
        );
      }

      data.contactMethod = "phone";
      data.projectDetail = "";
    }
  } else {
    data.submissionType = "lead_form";
    data.entryPoint ||= "contact_form";

    if (!isContact(data.contact)) {
      return NextResponse.json(
        { ok: false, error: "invalid_contact" },
        { status: 422 },
      );
    }
    if (!data.company || !data.projectDetail || !data.capacity) {
      return NextResponse.json(
        { ok: false, error: "missing_project_details" },
        { status: 422 },
      );
    }

    data.auditType = "";
    data.contactMethod = "";
    data.visitLocation = "";
    data.visitWindow = "";
  }

  data.neededService = selectedService.label;

  const lead: Lead = {
    ...data,
    submissionId: data.submissionId,
    submissionType: isCallback ? "callback" : "lead_form",
    schemaVersion: SCHEMA_VERSION,
    source: SOURCE,
    receivedAt: new Date().toISOString(),
  };

  const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.LEAD_WEBHOOK_SECRET?.trim();
  if (!webhookUrl || !webhookSecret) {
    safeErrorLog("sheet_not_configured");
    return NextResponse.json(
      { ok: false, error: "form_not_configured" },
      { status: 503 },
    );
  }

  const sheetResult = await forwardToSheet(webhookUrl, webhookSecret, lead);
  if (!sheetResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "forwarding_failed",
        reason: sheetResult.reason,
      },
      { status: 502 },
    );
  }

  await sendLeadNotification(lead);

  return NextResponse.json({ ok: true, submissionId: lead.submissionId });
}
