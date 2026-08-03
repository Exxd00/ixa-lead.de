"use client";

import { siteConfig } from "@/data/site";
import { ArrowLeft, CheckCircle2, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SubmissionReceipt = {
  createdAt: number;
  serviceId: string;
  auditType: string;
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

    setReceipt(storedReceipt);
    setChecked(true);
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

  const isWrittenAnalysis =
    receipt.serviceId === "website-check" && receipt.auditType === "written";
  const isOnsiteAnalysis =
    receipt.serviceId === "website-check" && receipt.auditType === "onsite";

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
          Danke für Ihre Anfrage.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70">
          {isWrittenAnalysis
            ? "Ich prüfe Leistung, Region und Kontaktweg. Ihre kurze schriftliche Einschätzung erhalten Sie in weniger als 24 Stunden."
            : isOnsiteAnalysis
              ? "Ich prüfe Ihre Angaben und melde mich persönlich, um den Termin in Nürnberg zu bestätigen."
              : "Ich prüfe Ihre Angaben und melde mich persönlich, um den passenden nächsten Schritt zu klären."}
        </p>

        <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <Clock3 className="size-5 text-success-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-white">
              Persönlich geprüft
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Ihre Angaben landen direkt bei mir und werden nicht automatisch
              bewertet.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <MapPin className="size-5 text-success-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-white">
              Direkt aus Nürnberg
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Persönlich bearbeitet von {siteConfig.owner}.
            </p>
          </div>
        </div>

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
