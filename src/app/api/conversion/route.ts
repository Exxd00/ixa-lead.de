import { NextResponse } from "next/server";

import { isNoTrackPath } from "@/lib/privacy-routes";

export const dynamic = "force-dynamic";

const SCHEMA_VERSION = 1 as const;
const SOURCE = "ixa-leads.de";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedEvents = new Set<string>([
  "ixa_conversion_thank_you",
  "ixa_conversion_phone_call",
  "ixa_conversion_callback",
  "ixa_conversion_whatsapp",
] as const);

const payloadKeys = [
  "eventId",
  "eventName",
  "entryPoint",
  "serviceId",
  "submissionId",
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
type Payload = Record<PayloadKey, string>;

const fieldLimits: Record<PayloadKey, number> = {
  eventId: 36,
  eventName: 80,
  entryPoint: 160,
  serviceId: 100,
  submissionId: 36,
  landingPath: 1_000,
  referrerHost: 255,
  utmSource: 500,
  utmMedium: 500,
  utmCampaign: 500,
  utmTerm: 500,
  utmContent: 500,
  gclid: 500,
};

type SheetResponse = {
  ok: true;
  duplicate: boolean;
  eventId: string;
};

type SheetRejectionCode =
  | "unauthorized"
  | "invalid_payload"
  | "invalid_record_type"
  | "invalid_conversion_event"
  | "busy"
  | "receiver_error";

type SheetFailureReason =
  | SheetRejectionCode
  | "receiver_http_error"
  | "receiver_invalid_json"
  | "receiver_invalid_acknowledgement"
  | "receiver_request_failed";

type SheetForwardResult =
  | { ok: true; response: SheetResponse }
  | { ok: false; reason: SheetFailureReason };

const sheetErrorCodes = new Set<string>([
  "unauthorized",
  "invalid_payload",
  "invalid_record_type",
  "invalid_conversion_event",
  "busy",
  "receiver_error",
]);

function safeErrorLog(event: string, detail?: string | number) {
  // Never log attribution values, webhook details or secrets.
  if (detail === undefined) {
    console.error(`[conversion] ${event}`);
    return;
  }
  console.error(`[conversion] ${event}`, detail);
}

function parsePayload(value: unknown): Payload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !payloadKeys.includes(key as PayloadKey))) {
    return null;
  }

  const payload = Object.fromEntries(
    payloadKeys.map((key) => {
      const value = record[key];
      return [key, typeof value === "string" ? value.trim() : ""];
    }),
  ) as Payload;

  if (
    payloadKeys.some((key) => payload[key].length > fieldLimits[key]) ||
    !UUID_V4_PATTERN.test(payload.eventId) ||
    !allowedEvents.has(payload.eventName) ||
    (payload.submissionId && !UUID_V4_PATTERN.test(payload.submissionId)) ||
    (payload.landingPath && !payload.landingPath.startsWith("/"))
  ) {
    return null;
  }

  return payload;
}

function isSheetResponse(
  value: unknown,
  eventId: string,
): value is SheetResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return (
    response.ok === true &&
    typeof response.duplicate === "boolean" &&
    response.eventId === eventId
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

async function forwardToSheet(
  webhookUrl: string,
  webhookSecret: string,
  payload: Payload,
): Promise<SheetForwardResult> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        recordType: "conversion_event",
        schemaVersion: SCHEMA_VERSION,
        source: SOURCE,
        occurredAt: new Date().toISOString(),
        _secret: webhookSecret,
      }),
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
      // Only expose a fixed, non-sensitive receiver code. Attribution values,
      // the webhook URL, the response body and the secret stay server-only.
      safeErrorLog("sheet_rejected", rejectionCode);
      return { ok: false, reason: rejectionCode };
    }

    if (!isSheetResponse(result, payload.eventId)) {
      safeErrorLog("sheet_invalid_acknowledgement");
      return { ok: false, reason: "receiver_invalid_acknowledgement" };
    }

    return { ok: true, response: result };
  } catch {
    safeErrorLog("sheet_request_failed");
    return { ok: false, reason: "receiver_request_failed" };
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 12_000) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return NextResponse.json(
      { ok: false, error: "cross_site_request" },
      { status: 403 },
    );
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const payload = parsePayload(rawPayload);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 422 },
    );
  }

  let referrerPath = "";
  const referrer = request.headers.get("referer");
  if (referrer) {
    try {
      referrerPath = new URL(referrer).pathname;
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_referrer" },
        { status: 400 },
      );
    }
  }

  if (
    isNoTrackPath(payload.landingPath || "/") ||
    (referrerPath && isNoTrackPath(referrerPath))
  ) {
    return NextResponse.json(
      { ok: false, error: "measurement_disabled" },
      { status: 403 },
    );
  }

  const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.LEAD_WEBHOOK_SECRET?.trim();
  if (!webhookUrl || !webhookSecret) {
    safeErrorLog("sheet_not_configured");
    return NextResponse.json(
      { ok: false, error: "conversion_log_not_configured" },
      { status: 503 },
    );
  }

  const result = await forwardToSheet(webhookUrl, webhookSecret, payload);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "forwarding_failed", reason: result.reason },
      { status: 502 },
    );
  }

  return NextResponse.json(result.response);
}
