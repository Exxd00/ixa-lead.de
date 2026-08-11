"use client";

import { siteConfig } from "@/data/site";
import {
  analyticsConsentChangeEvent,
  hasAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/consent";
import { recordMainConversion } from "@/lib/conversion-tracking";
import { conversionEvents } from "@/lib/tracking";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SubmissionReceipt = {
  createdAt: number;
  serviceId: string;
  auditType: string;
  submissionId?: string;
  thankYouTracked?: boolean;
};

const receiptLifetime = 15 * 60 * 1_000;

function readReceipt(): SubmissionReceipt | null {
  try {
    const raw = window.sessionStorage.getItem("ixa_form_success");
    if (!raw) return null;

    const receipt = JSON.parse(raw) as Partial<SubmissionReceipt>;
    if (
      typeof receipt.createdAt !== "number" ||
      typeof receipt.serviceId !== "string" ||
      typeof receipt.auditType !== "string" ||
      Date.now() - receipt.createdAt > receiptLifetime
    ) {
      return null;
    }

    return receipt as SubmissionReceipt;
  } catch {
    return null;
  }
}

export function DankeContent() {
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const storedReceipt = readReceipt();
    if (!storedReceipt) {
      window.location.replace("/#contact");
      return;
    }

    let trackingTimer: number | undefined;
    let trackingAttempts = 0;

    const trackThankYouPage = () => {
      if (storedReceipt.thankYouTracked || !hasAnalyticsConsent()) return;

      if (!window.gtag) {
        trackingAttempts += 1;
        if (trackingAttempts > 20) return;
        trackingTimer = window.setTimeout(trackThankYouPage, 100);
        return;
      }

      recordMainConversion(conversionEvents.thankYou, {
        service: storedReceipt.serviceId,
        submissionId: storedReceipt.submissionId,
        entryPoint: "thank_you_page",
      });
      storedReceipt.thankYouTracked = true;

      try {
        window.sessionStorage.setItem(
          "ixa_form_success",
          JSON.stringify(storedReceipt),
        );
      } catch {
        // Tracking still succeeded if session storage is unavailable.
      }
    };

    const onConsentChange = (event: Event) => {
      if ((event as CustomEvent<AnalyticsConsent>).detail === "granted") {
        trackThankYouPage();
      }
    };

    window.addEventListener(analyticsConsentChangeEvent, onConsentChange);
    trackThankYouPage();
    setReceipt(storedReceipt);
    setChecked(true);

    return () => {
      window.removeEventListener(analyticsConsentChangeEvent, onConsentChange);
      if (trackingTimer) window.clearTimeout(trackingTimer);
    };
  }, []);

  if (!checked || !receipt) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f1eb] px-5 text-center">
        <p className="text-sm font-semibold text-stone-500">
          Anfrage wird bestätigt …
        </p>
      </main>
    );
  }

  return (
    <main className="hero-wash relative isolate grid min-h-screen place-items-center overflow-hidden px-5 py-12 text-white">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-16 -z-10 size-72 rounded-full bg-primary/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-8 -z-10 size-80 rounded-full bg-success-400/10 blur-[120px]"
      />

      <section className="w-full max-w-xl rounded-[1.75rem] border border-white/12 bg-white/[0.08] p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-300/15 text-success-300">
          <CheckCircle2 className="size-9" aria-hidden="true" />
        </span>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-success-300">
          Erfolgreich übermittelt
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Danke. Jetzt prüfen wir zuerst, ob ein Anfrage-System sinnvoll ist.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70">
          Wir schauen uns Ihre Leistung, Zielregion, aktuelle Ausgangslage und
          freie Kapazität an.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-black/15 p-5 text-left">
          <p className="text-sm font-bold text-white">
            Die persönliche Einschätzung kann zum Beispiel lauten:
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "Ein Anfrage-System ist aktuell sinnvoll.",
              "Zuerst sollte ein anderer Engpass gelöst werden.",
              "Zusätzliche Werbung ist momentan nicht die wirtschaftlich sinnvollste nächste Maßnahme.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success-300"
                  strokeWidth={3}
                />
                <span className="text-sm leading-relaxed text-white/65">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mx-auto mt-5 max-w-md text-sm font-semibold leading-relaxed text-white/70">
          Wir empfehlen keinen Kampagnenstart nur deshalb, weil jemand Werbung
          buchen möchte. Ihre Angaben werden persönlich von {siteConfig.owner}
          geprüft.
        </p>

        <Link
          href="/"
          className="focus-ring mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-navy transition-colors hover:bg-white/90"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Zurück zur Startseite
        </Link>
      </section>
    </main>
  );
}
