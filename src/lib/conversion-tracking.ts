"use client";

import { hasAnalyticsConsent } from "@/lib/consent";
import {
  conversionEvents,
  track,
  type TrackingEvent,
} from "@/lib/tracking";

export type MainConversionEvent =
  (typeof conversionEvents)[keyof typeof conversionEvents];

export type ConversionAttribution = {
  landingPath: string;
  referrerHost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
};

type ConversionRecordParams = {
  entryPoint?: string;
  service?: string;
  submissionId?: string;
  attribution?: ConversionAttribution;
};

const attributionStorageKey = "ixa_conversion_attribution_v1";
const conversionStoragePrefix = "ixa_conversion_sheet_v1";
const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const inFlightEvents = new Set<string>();

const emptyAttribution: ConversionAttribution = {
  landingPath: "",
  referrerHost: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  gclid: "",
};

function readStoredAttribution(): ConversionAttribution | null {
  try {
    const raw = window.sessionStorage.getItem(attributionStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConversionAttribution>;

    return {
      landingPath:
        typeof parsed.landingPath === "string" ? parsed.landingPath : "",
      referrerHost:
        typeof parsed.referrerHost === "string" ? parsed.referrerHost : "",
      utmSource: typeof parsed.utmSource === "string" ? parsed.utmSource : "",
      utmMedium: typeof parsed.utmMedium === "string" ? parsed.utmMedium : "",
      utmCampaign:
        typeof parsed.utmCampaign === "string" ? parsed.utmCampaign : "",
      utmTerm: typeof parsed.utmTerm === "string" ? parsed.utmTerm : "",
      utmContent:
        typeof parsed.utmContent === "string" ? parsed.utmContent : "",
      gclid: typeof parsed.gclid === "string" ? parsed.gclid : "",
    };
  } catch {
    return null;
  }
}

/** Keeps first-touch campaign data available after internal navigation. */
export function captureConversionAttribution(): ConversionAttribution {
  if (typeof window === "undefined") return emptyAttribution;

  const stored = readStoredAttribution();
  const searchParams = new URLSearchParams(window.location.search);
  let referrerHost = stored?.referrerHost ?? "";

  if (!referrerHost && document.referrer) {
    try {
      referrerHost = new URL(document.referrer).hostname;
    } catch {
      // Browser-filtered or malformed referrer.
    }
  }

  const current: ConversionAttribution = {
    landingPath: stored?.landingPath || window.location.pathname,
    referrerHost,
    utmSource:
      stored?.utmSource || searchParams.get("utm_source")?.trim() || "",
    utmMedium:
      stored?.utmMedium || searchParams.get("utm_medium")?.trim() || "",
    utmCampaign:
      stored?.utmCampaign || searchParams.get("utm_campaign")?.trim() || "",
    utmTerm: stored?.utmTerm || searchParams.get("utm_term")?.trim() || "",
    utmContent:
      stored?.utmContent || searchParams.get("utm_content")?.trim() || "",
    gclid: stored?.gclid || searchParams.get("gclid")?.trim() || "",
  };

  try {
    window.sessionStorage.setItem(
      attributionStorageKey,
      JSON.stringify(current),
    );
  } catch {
    // Attribution remains available for the current action in memory.
  }

  return current;
}

function readOrCreateEventId(
  event: MainConversionEvent,
  submissionId?: string,
): string {
  if (submissionId && uuidV4Pattern.test(submissionId)) return submissionId;

  const storageKey = `${conversionStoragePrefix}:id:${event}`;
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored && uuidV4Pattern.test(stored)) return stored;

    const eventId = window.crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, eventId);
    return eventId;
  } catch {
    return window.crypto.randomUUID();
  }
}

function wasRecorded(eventId: string): boolean {
  try {
    return (
      window.sessionStorage.getItem(
        `${conversionStoragePrefix}:sent:${eventId}`,
      ) === "1"
    );
  } catch {
    return false;
  }
}

function markRecorded(eventId: string): void {
  try {
    window.sessionStorage.setItem(
      `${conversionStoragePrefix}:sent:${eventId}`,
      "1",
    );
  } catch {
    // Apps Script still performs server-side idempotency with the event ID.
  }
}

async function persistConversion(
  event: MainConversionEvent,
  params: ConversionRecordParams,
): Promise<void> {
  const eventId = readOrCreateEventId(event, params.submissionId);
  if (wasRecorded(eventId) || inFlightEvents.has(eventId)) return;

  inFlightEvents.add(eventId);
  const attribution = params.attribution ?? captureConversionAttribution();

  try {
    const response = await fetch("/api/conversion", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        eventName: event,
        entryPoint: params.entryPoint ?? "",
        serviceId: params.service ?? "",
        submissionId: params.submissionId ?? "",
        ...attribution,
      }),
      cache: "no-store",
      keepalive: true,
    });

    if (!response.ok) return;
    const result = (await response.json()) as Record<string, unknown>;
    if (result.ok === true && result.eventId === eventId) {
      markRecorded(eventId);
    }
  } catch {
    // Conversion logging is best-effort and must never block contact actions.
  } finally {
    inFlightEvents.delete(eventId);
  }
}

/**
 * Sends the event to GA4 and the consented conversion log in Google Sheets.
 * No name, phone number, email address or message is included.
 */
export function recordMainConversion(
  event: MainConversionEvent,
  params: ConversionRecordParams = {},
): void {
  const analyticsParams: Record<string, string> = {};
  if (params.entryPoint) analyticsParams.location = params.entryPoint;
  if (params.service) analyticsParams.service = params.service;
  if (params.submissionId) {
    analyticsParams.transaction_id = params.submissionId;
  }

  track(event as TrackingEvent, analyticsParams);
  if (!hasAnalyticsConsent()) return;
  void persistConversion(event, params);
}
