"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CtaButton } from "@/components/cta";
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

const methodVisuals = {
  form: {
    Icon: FileText,
    iconClass: "bg-primary/10 text-primary",
  },
  phone: {
    Icon: Phone,
    iconClass: "bg-success-100 text-success-700",
  },
  whatsapp: {
    Icon: MessageCircle,
    iconClass: "bg-stamp-50 text-stamp",
  },
} as const;

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
        className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-navy/10 bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-card sm:pb-0"
      >
        <header className="flex items-center justify-between gap-4 border-b border-navy/10 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy font-mono text-sm font-bold text-white">
              FA
            </span>
            <div className="min-w-0">
              <h3
                id="franken-post-title"
                className="text-sm font-bold leading-tight text-navy sm:text-base"
              >
                Franken Autoankauf 24
              </h3>
              <p className="mt-0.5 text-[11px] leading-tight text-stone-500 sm:text-xs">
                Fallstudie · Nürnberg & Franken
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-success-800">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            <span className="sm:hidden">Belegt</span>
            <span className="hidden sm:inline">Dokumentiert</span>
          </span>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(350px,.92fr)]">
          <section
            aria-labelledby="sheet-evidence-title"
            className="bg-[#eef1f5] p-4 sm:p-6 lg:p-7"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-700">
                  Echter Quellenblick
                </p>
                <h4
                  id="sheet-evidence-title"
                  className="mt-1 text-lg font-bold text-navy"
                >
                  Lead-Sheet direkt sichtbar
                </h4>
              </div>
              <FileSpreadsheet
                className="size-6 shrink-0 text-success-700"
                aria-hidden="true"
              />
            </div>

            <EvidenceButton
              evidence={sheetEvidence}
              onOpen={setZoomedEvidence}
              className="aspect-[16/10] sm:aspect-[16/9] lg:min-h-[420px]"
            />

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-success-700"
                aria-hidden="true"
              />
              Sichtbar sind nur Datum, Status und Kontaktart. Personenbezogene
              Daten wurden vollständig entfernt.
            </p>
          </section>

          <div className="flex flex-col p-5 sm:p-7 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
              {study.category}
            </p>

            <ol className="mt-5 space-y-3" aria-label="Projektverlauf">
              <li className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white font-mono text-xs font-bold text-stamp shadow-sm">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-navy">
                      Ausgangslage
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">
                      Interessenten sollten ohne Umwege per Formular, Telefon
                      oder WhatsApp anfragen können – und jeder Weg sollte
                      getrennt sichtbar werden.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-sm">
                    <Wrench className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-navy">
                      IXA-Umsetzung
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">
                      Website und Kontaktwege wurden als ein System aufgebaut
                      und im projektbezogenen Lead-Sheet getrennt dokumentiert;
                      GA4 blieb ein separater Analysekanal.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-2xl bg-navy p-4 text-white">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 font-mono text-xs font-bold text-success-300">
                    3
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold">Ergebnis & Beleg</h4>
                    <p className="mt-2 font-mono text-5xl font-bold leading-none tracking-[-0.06em]">
                      {study.documentedActions}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/75">
                      dokumentierte Kontaktaktionen
                    </p>
                  </div>
                </div>
              </li>
            </ol>

            <ul
              className="mt-4 grid grid-cols-3 gap-2"
              aria-label="Aufteilung nach Kontaktweg"
            >
              {study.methods.map((method) => {
                const visual = methodVisuals[method.key];
                const Icon = visual.Icon;

                return (
                  <li
                    key={method.key}
                    className="rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-lg",
                        visual.iconClass,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="mt-2 block font-mono text-xl font-bold text-navy">
                      {method.value}
                    </span>
                    <span className="block truncate text-[10px] font-semibold text-stone-500 sm:text-[11px]">
                      {method.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200 pt-4 text-[11px] text-stone-500">
              <p className="flex items-center gap-1.5">
                <CalendarDays
                  className="size-3.5 text-stamp"
                  aria-hidden="true"
                />
                Lead-Sheet: {study.period}
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck
                  className="size-3.5 text-success-700"
                  aria-hidden="true"
                />
                Datenauszug vom 29. Juli 2026
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
              >
                Website ansehen
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
              <CtaButton
                location="franken_case_study"
                service="Ähnliches Projekt"
                variant="outline"
                size="lg"
                icon={
                  <ArrowUpRight
                    className="order-last size-4"
                    aria-hidden="true"
                  />
                }
                className="h-12 w-full border-primary/20 bg-primary/5 text-primary shadow-none hover:bg-primary/10"
              >
                Kostenlose Erstanalyse
              </CtaButton>
            </div>
          </div>
        </div>

        <section
          aria-labelledby="ga4-evidence-title"
          className="border-t border-stone-200 bg-[#f7f8fa] p-5 sm:p-7"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                <BarChart3 className="size-4" aria-hidden="true" />
                Separater Analysezeitraum
              </p>
              <h4
                id="ga4-evidence-title"
                className="mt-2 text-lg font-bold text-navy"
              >
                Google Analytics 4
              </h4>
            </div>
            <p className="text-xs text-stone-500">
              792 Sitzungen · 112 Key Events · 30. Apr.–28. Juli 2026
            </p>
          </div>

          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
            {analyticsEvidence.map((evidence) => (
              <EvidenceButton
                key={evidence.src}
                evidence={evidence}
                onOpen={setZoomedEvidence}
                className="aspect-[16/8] min-w-[84%] snap-center sm:min-w-0"
              />
            ))}
          </div>

          <div className="mt-4 grid gap-2 text-[11px] leading-relaxed sm:grid-cols-2">
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Kontaktaktionen sind dokumentierte Eingänge. Sie belegen keine
              abgeschlossenen Ankäufe, keinen Umsatz und keine garantierte
              Erfolgsquote.
            </p>
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-stone-500">
              <p>
                792 Sitzungen und 112 Key Events stammen aus einem separaten
                GA4-Zeitraum und werden nicht zu den Kontaktaktionen addiert.
              </p>
              <p>
                Der interne Sheet-Name lautet „frankenautoankauf.de“ und gehört
                zum Projekt frankenautoankauf24.de.
              </p>
            </div>
          </div>
        </section>
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
