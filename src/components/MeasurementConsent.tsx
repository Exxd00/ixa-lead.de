"use client";

import {
  analyticsConsentChangeEvent,
  analyticsConsentSettingsEvent,
  analyticsConsentStorageKey,
  type AnalyticsConsent,
  readAnalyticsConsent,
  saveAnalyticsConsent,
} from "@/lib/consent";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

type ConsentModeValue = "granted" | "denied";

type ConsentModeSettings = {
  ad_personalization: ConsentModeValue;
  ad_storage: ConsentModeValue;
  ad_user_data: ConsentModeValue;
  analytics_storage: ConsentModeValue;
  functionality_storage: ConsentModeValue;
  personalization_storage: ConsentModeValue;
  security_storage: ConsentModeValue;
  wait_for_update?: number;
};

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA4_ID?.trim() ?? "";
const validGoogleAnalyticsId = /^G-[A-Z0-9]+$/i.test(googleAnalyticsId);

function ensureGoogleConsentDefaults(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      // Google Consent Mode expects the native array-like `arguments` object.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

  const deniedByDefault: ConsentModeSettings = {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  };

  window.gtag("consent", "default", deniedByDefault);
  window.gtag("set", "ads_data_redaction", true);
  window.gtag("set", "url_passthrough", false);
}

function clearGoogleAnalyticsCookies(): void {
  const hostParts = window.location.hostname.split(".");
  const parentDomain =
    hostParts.length > 1 ? `.${hostParts.slice(-2).join(".")}` : null;

  document.cookie.split(";").forEach((cookie) => {
    const cookieName = cookie.split("=")[0]?.trim();
    if (!cookieName || !/^_(ga|gid|gat)/.test(cookieName)) return;

    document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax`;
    if (parentDomain) {
      document.cookie = `${cookieName}=; Max-Age=0; Path=/; Domain=${parentDomain}; SameSite=Lax`;
    }
  });
}

function updateGoogleConsent(consent: AnalyticsConsent): void {
  window.gtag?.("consent", "update", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: consent,
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
  } satisfies ConsentModeSettings);

  if (consent === "denied") clearGoogleAnalyticsCookies();
}

function ConsentBanner({
  currentConsent,
  onSelect,
}: {
  currentConsent: AnalyticsConsent | null;
  onSelect: (consent: AnalyticsConsent) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <aside
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:bottom-5 sm:p-5"
      data-nosnippet
      role="region"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p
            className="text-base font-bold text-navy"
            id="analytics-consent-title"
          >
            Dürfen wir die Nutzung statistisch messen?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
            Notwendige Funktionen laufen immer. Google Analytics sowie Vercel
            Web Analytics und Speed Insights starten erst, wenn Sie Statistik
            erlauben.
          </p>
          {showDetails && (
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              Ihre Auswahl wird nur auf diesem Gerät gespeichert. Sie können sie
              jederzeit unter „Datenschutz“ ändern. Kontaktdaten aus dem
              Formular werden nicht an diese Messdienste gesendet.
            </p>
          )}
          <button
            className="focus-ring mt-2 rounded-md text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            onClick={() => setShowDetails((visible) => !visible)}
            type="button"
          >
            {showDetails ? "Details ausblenden" : "Details anzeigen"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row-reverse">
          <button
            className="focus-ring min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            onClick={() => onSelect("granted")}
            type="button"
          >
            Statistik erlauben
          </button>
          <button
            className="focus-ring min-h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-navy/90"
            onClick={() => onSelect("denied")}
            type="button"
          >
            Nur notwendige
          </button>
        </div>
      </div>

      {currentConsent && (
        <p className="sr-only" aria-live="polite">
          Aktuelle Auswahl:{" "}
          {currentConsent === "granted"
            ? "Statistik erlaubt"
            : "nur notwendige Funktionen"}
          .
        </p>
      )}
    </aside>
  );
}

export function MeasurementConsent() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    ensureGoogleConsentDefaults();

    const storedConsent = readAnalyticsConsent();
    setConsent(storedConsent);
    setShowBanner(storedConsent === null);

    if (storedConsent) updateGoogleConsent(storedConsent);

    const onConsentChange = (event: Event) => {
      const nextConsent = (event as CustomEvent<AnalyticsConsent>).detail;
      if (nextConsent !== "granted" && nextConsent !== "denied") return;

      setConsent(nextConsent);
      setShowBanner(false);
      updateGoogleConsent(nextConsent);
    };
    const onOpenSettings = () => setShowBanner(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== analyticsConsentStorageKey) return;
      const nextConsent = readAnalyticsConsent();
      setConsent(nextConsent);
      setShowBanner(nextConsent === null);
      updateGoogleConsent(nextConsent ?? "denied");
    };

    window.addEventListener(analyticsConsentChangeEvent, onConsentChange);
    window.addEventListener(analyticsConsentSettingsEvent, onOpenSettings);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(analyticsConsentChangeEvent, onConsentChange);
      window.removeEventListener(analyticsConsentSettingsEvent, onOpenSettings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const selectConsent = useCallback((nextConsent: AnalyticsConsent) => {
    const previousConsent = readAnalyticsConsent();
    saveAnalyticsConsent(nextConsent);

    // Vercel's browser scripts cannot be reliably unloaded after they have
    // started. A reload guarantees that revoking consent leaves no optional
    // measurement runtime active on the page.
    if (previousConsent === "granted" && nextConsent === "denied") {
      window.location.reload();
    }
  }, []);

  const configureGoogleAnalytics = useCallback(() => {
    if (!validGoogleAnalyticsId || consent !== "granted") return;

    window.gtag?.("js", new Date());
    window.gtag?.("config", googleAnalyticsId, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      anonymize_ip: true,
      send_page_view: true,
    });
  }, [consent]);

  const analyticsAllowed = consent === "granted";

  return (
    <>
      {analyticsAllowed && validGoogleAnalyticsId && (
        <Script
          id="ixa-google-analytics"
          onReady={configureGoogleAnalytics}
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
      )}

      {analyticsAllowed && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}

      {showBanner && (
        <ConsentBanner currentConsent={consent} onSelect={selectConsent} />
      )}
    </>
  );
}
