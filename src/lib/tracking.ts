/* =====================================================================
   Consent-aware measurement. Optional events go directly to GA4 only after
   the visitor has allowed statistics; form/contact values are filtered out.
   ===================================================================== */

import { siteConfig } from "@/data/site";
import { hasAnalyticsConsent } from "@/lib/consent";
import { isNoTrackPath } from "@/lib/privacy-routes";

export type TrackingEvent =
  | "hero_cta_click"
  | "service_cta_click"
  | "package_cta_click"
  | "check_cta_click"
  | "ixa_conversion_thank_you"
  | "ixa_conversion_phone_call"
  | "ixa_conversion_callback"
  | "ixa_conversion_whatsapp"
  | "callback_open"
  | "callback_submit_error"
  | "email_click"
  | "form_start"
  | "form_service_select"
  | "form_option_select"
  | "form_submit_success"
  | "form_submit_error"
  | "link_hub_click"
  | "case_study_share_view_click"
  | "case_study_share_copy_click";

/** Einheitliche Namen für die vier wichtigsten GA4-Ereignisse. */
export const conversionEvents = {
  thankYou: "ixa_conversion_thank_you",
  phoneCall: "ixa_conversion_phone_call",
  callback: "ixa_conversion_callback",
  whatsapp: "ixa_conversion_whatsapp",
} as const satisfies Record<string, TrackingEvent>;

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const privateParameterPattern =
  /(email|e-mail|phone|telefon|name|message|nachricht|contact|kontakt|website|url)/i;

function analyticsSafeParams(params: DataLayerObject): DataLayerObject {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) =>
        !privateParameterPattern.test(key) &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"),
    ),
  );
}

/** Sends an event only after the visitor has allowed optional statistics. */
export function track(
  event: TrackingEvent,
  params: DataLayerObject = {},
): void {
  if (typeof window === "undefined") return;
  if (isNoTrackPath(window.location.pathname)) return;

  if (!hasAnalyticsConsent()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[tracking:consent-required] ${event}`, params);
    }
    return;
  }

  window.gtag?.("event", event, analyticsSafeParams(params));

  // تسجيل مساعد أثناء التطوير عندما تكون معرّفات القياس غير مفعّلة
  if (!siteConfig.tracking.enabled && process.env.NODE_ENV !== "production") {
    console.info(`[tracking] ${event}`, params);
  }
}

/**
 * إرسال تحويل Google Ads.
 * يعمل فقط بعد إضافة معرّف التحويل والتسمية وتفعيل التتبع في site.ts
 */
export function reportAdsConversion(extra: DataLayerObject = {}): void {
  if (typeof window === "undefined") return;
  if (isNoTrackPath(window.location.pathname)) return;

  const { adsEnabled, adsConversionId, adsConversionLabel } =
    siteConfig.tracking;
  if (
    !adsEnabled ||
    !hasAnalyticsConsent() ||
    !adsConversionId ||
    !adsConversionLabel ||
    !window.gtag
  ) {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: `${adsConversionId}/${adsConversionLabel}`,
    ...extra,
  });
}

/** يبني رابط واتساب من الرقم والرسالة الجاهزة في ملف البيانات. */
export function buildWhatsappUrl(): string {
  const { whatsappNumber, whatsappMessage } = siteConfig.contact;
  const text = encodeURIComponent(whatsappMessage);
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
