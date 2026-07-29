"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Maximize2,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocumentedCaseEvidence } from "@/data/evidence";
import { cn } from "@/lib/utils";

type EvidenceImage = {
  src: string;
  alt: string;
  title: string;
  description: string;
};

const sheetEvidence: EvidenceImage = {
  src: "/evidence/franken-lead-sheet-safe.jpg",
  alt: "Anonymisierter Ausschnitt aus dem Lead-Sheet von Franken Autoankauf mit Datum, Status und Kontaktart",
  title: "Anonymisierter Lead-Sheet-Auszug",
  description:
    "Zu sehen sind ausschließlich Datum, Status und Kontaktart. Namen, Telefonnummern, E-Mail-Adressen und Nachrichten werden nicht dargestellt.",
};

const analyticsEvidence: EvidenceImage[] = [
  {
    src: "/evidence/franken-ga4-sessions.jpg",
    alt: "Google-Analytics-Bericht von Franken Autoankauf mit 792 Sitzungen",
    title: "GA4: 792 Sitzungen",
    description:
      "Traffic-Acquisition-Bericht für frankenautoankauf24.de, Zeitraum 30. April bis 28. Juli 2026.",
  },
  {
    src: "/evidence/franken-ga4-key-events.jpg",
    alt: "Google-Analytics-Bericht von Franken Autoankauf mit 112 Key Events",
    title: "GA4: 112 Key Events",
    description:
      "Derselbe GA4-Bericht mit der separat ausgewiesenen Kennzahl Key Events.",
  },
];

function EvidenceButton({
  evidence,
  className,
  onOpen,
}: {
  evidence: EvidenceImage;
  className?: string;
  onOpen: (evidence: EvidenceImage) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(evidence)}
      aria-label={`${evidence.title} vergrößern`}
      className={cn(
        "focus-ring group relative block w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm",
        className,
      )}
    >
      <Image
        src={evidence.src}
        alt={evidence.alt}
        fill
        sizes="(max-width: 1024px) 94vw, 700px"
        className="object-contain"
      />
      <span className="absolute right-3 top-3 inline-flex h-9 items-center gap-2 rounded-full bg-navy/90 px-3 text-xs font-semibold text-white shadow-soft backdrop-blur transition-transform group-hover:scale-105">
        <Maximize2 className="size-3.5" aria-hidden="true" />
        Vergrößern
      </span>
    </button>
  );
}

export function FrankenEvidencePost({
  study,
}: {
  study: DocumentedCaseEvidence;
}) {
  const [zoomedEvidence, setZoomedEvidence] = useState<EvidenceImage | null>(
    null,
  );

  return (
    <>
      <article
        id={`ergebnis-${study.id}`}
        aria-labelledby="franken-post-title"
        className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-navy/10 bg-white shadow-card"
      >
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-7">
          <div>
            <h3
              id="franken-post-title"
              className="text-base font-bold text-navy sm:text-lg"
            >
              Franken Autoankauf 24
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Fahrzeugankauf in Nürnberg & Franken
            </p>
          </div>
          <a
            href={study.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website von Franken Autoankauf 24 öffnen"
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-stone-600 transition-colors hover:text-primary sm:px-3"
          >
            <span className="hidden sm:inline">Website ansehen</span>
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </header>

        <div className="grid lg:grid-cols-[minmax(310px,.78fr)_minmax(0,1.22fr)]">
          <div className="flex flex-col p-5 sm:p-7 lg:p-8">
            <p className="text-sm font-semibold text-stone-600">
              Dokumentiertes Ergebnis
            </p>
            <p className="mt-2 font-mono text-7xl font-bold leading-none tracking-[-0.08em] text-navy sm:text-8xl">
              {study.documentedActions}
            </p>
            <p className="mt-3 max-w-sm text-base font-semibold leading-snug text-navy">
              Kontaktaktionen über Formular, Telefon und WhatsApp
            </p>

            <ul
              className="mt-6 grid grid-cols-3 divide-x divide-stone-200 rounded-2xl border border-stone-200"
              aria-label="Aufteilung nach Kontaktweg"
            >
              {study.methods.map((method) => (
                <li key={method.key} className="min-w-0 px-2 py-3 text-center">
                  <span className="block font-mono text-xl font-bold text-navy sm:text-2xl">
                    {method.value}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-stone-500 sm:text-xs">
                    {method.label}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-center gap-2 text-xs text-stone-500">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              Erfasst im Lead-Sheet · {study.period}
            </p>

            <p className="mt-5 text-sm leading-relaxed text-stone-600">
              Die Website bündelt drei einfache Kontaktwege. Jeder Eingang wird
              getrennt dokumentiert, damit sichtbar bleibt, was tatsächlich
              ankommt.
            </p>
          </div>

          <section
            aria-labelledby="sheet-evidence-title"
            className="border-t border-stone-200 bg-stone-50 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-7"
          >
            <div className="mb-4">
              <h4
                id="sheet-evidence-title"
                className="text-base font-bold text-navy sm:text-lg"
              >
                Anonymisierter Originalauszug
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Der Nachweis ist direkt sichtbar und lässt sich vergrößern.
              </p>
            </div>

            <EvidenceButton
              evidence={sheetEvidence}
              onOpen={setZoomedEvidence}
              className="aspect-[16/10] sm:aspect-[16/9] lg:min-h-[390px]"
            />

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              Personenbezogene Daten wurden entfernt. Die Zahl zeigt
              Kontaktaktionen, nicht abgeschlossene Aufträge. Den vollständigen
              anonymisierten Nachweis zeigen wir gern im Erstgespräch.
            </p>
          </section>
        </div>

        <details className="group border-t border-stone-200">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-7 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-semibold text-navy">
                Zusätzliche Messdaten
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Google Analytics separat ansehen
              </span>
            </span>
            <ChevronDown
              className="size-5 shrink-0 text-stone-500 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <section
            aria-labelledby="ga4-evidence-title"
            className="border-t border-stone-200 bg-stone-50 p-5 sm:p-7"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-stone-500" aria-hidden="true" />
              <h4
                id="ga4-evidence-title"
                className="text-base font-bold text-navy"
              >
                Separater GA4-Zeitraum
              </h4>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {analyticsEvidence.map((evidence) => (
                <EvidenceButton
                  key={evidence.src}
                  evidence={evidence}
                  onOpen={setZoomedEvidence}
                  className="aspect-[16/9]"
                />
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs leading-relaxed text-stone-500">
              <p>
                792 Sitzungen und 112 Key Events stammen aus dem Zeitraum 30.
                April bis 28. Juli 2026. Sie werden nicht zu den 211
                Kontaktaktionen addiert.
              </p>
              <p>
                Der interne Sheet-Name „frankenautoankauf.de“ gehört zum Projekt
                frankenautoankauf24.de.
              </p>
            </div>
          </section>
        </details>
      </article>

      <Dialog
        open={Boolean(zoomedEvidence)}
        onOpenChange={(open) => {
          if (!open) setZoomedEvidence(null);
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-[96vw] gap-3 overflow-hidden border-white/10 bg-[#f7f8fa] p-4 sm:max-w-6xl sm:p-6">
          <DialogTitle className="pr-10 text-base text-navy sm:text-lg">
            {zoomedEvidence?.title}
          </DialogTitle>
          <DialogDescription className="pr-10 text-xs leading-relaxed sm:text-sm">
            {zoomedEvidence?.description}
          </DialogDescription>
          {zoomedEvidence && (
            <div className="relative min-h-[55vh] w-full overflow-hidden rounded-xl border border-stone-200 bg-white sm:min-h-[72vh]">
              <Image
                src={zoomedEvidence.src}
                alt={zoomedEvidence.alt}
                fill
                sizes="96vw"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
