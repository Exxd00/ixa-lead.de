export type AnalyticsConsent = "granted" | "denied";

export const analyticsConsentStorageKey = "ixa_analytics_consent_v1";
export const analyticsConsentChangeEvent = "ixa:analytics-consent-change";
export const analyticsConsentSettingsEvent = "ixa:open-consent-settings";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(analyticsConsentStorageKey);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readAnalyticsConsent() === "granted";
}

export function saveAnalyticsConsent(consent: AnalyticsConsent): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(analyticsConsentStorageKey, consent);
  } catch {
    // The current page still respects the selection if storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent<AnalyticsConsent>(analyticsConsentChangeEvent, {
      detail: consent,
    }),
  );
}

export function openAnalyticsConsentSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(analyticsConsentSettingsEvent));
}
