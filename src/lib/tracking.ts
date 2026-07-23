/* =====================================================================
   أدوات القياس (Tracking)
   كل الأحداث تُدفع إلى dataLayer ليمكن ربطها لاحقًا بـ GTM / GA4 / Google Ads.
   لا توجد معرّفات وهمية تعمل فعليًا — راجع src/data/site.ts لإضافة القيم الحقيقية.
   ===================================================================== */

import { siteConfig } from "@/data/site";

export type TrackingEvent =
  | "hero_cta_click"
  | "service_cta_click"
  | "package_cta_click"
  | "check_cta_click"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "form_start"
  | "form_submit_success"
  | "form_submit_error";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** يدفع حدثًا إلى dataLayer (آمن على الخادم وفي المتصفح). */
export function track(event: TrackingEvent, params: DataLayerObject = {}): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
    timestamp: Date.now(),
  });

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

  const { enabled, adsConversionId, adsConversionLabel } = siteConfig.tracking;
  if (!enabled || !window.gtag) return;

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
