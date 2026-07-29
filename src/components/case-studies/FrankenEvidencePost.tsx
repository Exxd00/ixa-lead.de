"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  Maximize2,
  MessageCircle,
  Phone,
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

const slides = [
  { id: "result", label: "Ergebnis" },
  { id: "channels", label: "Kontaktwege" },
  { id: "sheet", label: "Lead-Sheet" },
  { id: "analytics", label: "Google Analytics" },
  { id: "method", label: "Einordnung" },
] as const;

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
    color: "bg-primary",
    iconClass: "bg-primary/10 text-primary",
  },
  phone: {
    Icon: Phone,
    color: "bg-success-600",
    iconClass: "bg-success-100 text-success-700",
  },
  whatsapp: {
    Icon: MessageCircle,
    color: "bg-stamp",
    iconClass: "bg-stamp-50 text-stamp",
  },
} as const;

function EvidenceButton({
  evidence,
  className,
  onOpen,
  tabIndex,
}: {
  evidence: EvidenceImage;
  className?: string;
  onOpen: (evidence: EvidenceImage) => void;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(evidence)}
      tabIndex={tabIndex}
      aria-label={`${evidence.title} vergrößern`}
      className={cn(
        "focus-ring group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm",
        className,
      )}
    >
      <Image
        src={evidence.src}
        alt={evidence.alt}
        fill
        sizes="(max-width: 1024px) 100vw, 620px"
        className="object-contain"
      />
      <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-navy/85 text-white shadow-soft backdrop-blur transition-transform group-hover:scale-105">
        <Maximize2 className="size-4" aria-hidden="true" />
      </span>
    </button>
  );
}

export function FrankenEvidencePost({
  study,
}: {
  study: DocumentedCaseEvidence;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [zoomedEvidence, setZoomedEvidence] =
    useState<EvidenceImage | null>(null);
  const touchStartX = useRef<number | null>(null);

  const showSlide = (index: number) => {
    setActiveSlide((index + slides.length) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 48) return;
    showSlide(activeSlide + (distance < 0 ? 1 : -1));
  };

  return (
    <>
      <article
        id={`ergebnis-${study.id}`}
        aria-labelledby="franken-post-title"
        className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-navy/10 bg-white shadow-card"
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

        <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(330px,.88fr)]">
          <div
            className="relative overflow-hidden bg-navy"
            data-floating-cta-avoid
          >
            <div
              className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/11] lg:aspect-auto lg:min-h-[620px]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              role="region"
              aria-roledescription="Karussell"
              aria-label="Datennachweis für Franken Autoankauf 24"
            >
              <p className="sr-only" aria-live="polite">
                Folie {activeSlide + 1} von {slides.length}:{" "}
                {slides[activeSlide].label}
              </p>
              <div
                className="flex size-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                <div
                  className="relative flex h-full w-full shrink-0 flex-col justify-between overflow-hidden bg-navy p-7 pb-16 text-white sm:p-10 sm:pb-16"
                  role="group"
                  aria-label="Folie 1 von 5: Ergebnis"
                  aria-hidden={activeSlide !== 0}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/40 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-white/70">
                      Größter dokumentierter Datensatz
                    </span>
                    <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-success-300">
                      frankenautoankauf24.de
                    </p>
                  </div>
                  <div className="relative">
                    <p className="font-mono text-[5.4rem] font-bold leading-none tracking-[-0.08em] text-white sm:text-[7rem]">
                      211
                    </p>
                    <p className="mt-3 max-w-sm text-xl font-semibold leading-snug text-white/80 sm:text-2xl">
                      dokumentierte Kontaktaktionen
                    </p>
                  </div>
                  <div className="relative flex items-center gap-2 border-t border-white/10 pt-5 text-sm text-white/55">
                    <CalendarDays className="size-4 text-success-300" />
                    16. Apr.–8. Juni 2026
                  </div>
                </div>

                <div
                  className="flex h-full w-full shrink-0 flex-col bg-[#f4f7ff] p-7 pb-16 sm:p-10 sm:pb-16"
                  role="group"
                  aria-label="Folie 2 von 5: Kontaktwege"
                  aria-hidden={activeSlide !== 1}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Kontaktwege
                  </p>
                  <h4 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-navy sm:text-3xl">
                    Drei Wege. Ein nachvollziehbarer Datensatz.
                  </h4>
                  <div className="mt-8 flex flex-1 flex-col justify-center gap-5">
                    {study.methods.map((method) => {
                      const visual = methodVisuals[method.key];
                      const Icon = visual.Icon;
                      const percentage = Math.round(
                        (method.value / study.documentedActions) * 100,
                      );

                      return (
                        <div
                          key={method.key}
                          className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-3 text-sm font-bold text-navy sm:text-base">
                              <span
                                className={cn(
                                  "grid size-10 place-items-center rounded-xl",
                                  visual.iconClass,
                                )}
                              >
                                <Icon className="size-5" aria-hidden="true" />
                              </span>
                              {method.label}
                            </span>
                            <span className="text-right">
                              <span className="block font-mono text-2xl font-bold text-navy">
                                {method.value}
                              </span>
                              <span className="text-xs font-semibold text-stone-400">
                                {percentage} %
                              </span>
                            </span>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                visual.color,
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-5 text-xs leading-relaxed text-stone-500">
                    Die Summe basiert auf Einträgen im projektbezogenen
                    Lead-Sheet.
                  </p>
                </div>

                <div
                  className="flex h-full w-full shrink-0 flex-col bg-[#eef1f5] p-5 pb-16 sm:p-7 sm:pb-16"
                  role="group"
                  aria-label="Folie 3 von 5: Anonymisierter Lead-Sheet-Auszug"
                  aria-hidden={activeSlide !== 2}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-700">
                        Quelldokument
                      </p>
                      <h4 className="mt-1 text-lg font-bold text-navy">
                        Anonymisierter Lead-Sheet-Auszug
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
                    tabIndex={activeSlide === 2 ? 0 : -1}
                    className="min-h-0 flex-1"
                  />
                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-success-700"
                      aria-hidden="true"
                    />
                    Sichtbar sind nur Datum, Status und Kontaktart. Personenbezogene
                    Daten wurden vollständig entfernt.
                  </p>
                </div>

                <div
                  className="flex h-full w-full shrink-0 flex-col bg-[#f4f6fa] p-5 pb-16 sm:p-7 sm:pb-16"
                  role="group"
                  aria-label="Folie 4 von 5: Google-Analytics-Nachweis"
                  aria-hidden={activeSlide !== 3}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Separater Analysezeitraum
                      </p>
                      <h4 className="mt-1 text-lg font-bold text-navy">
                        Google Analytics 4
                      </h4>
                    </div>
                    <BarChart3
                      className="size-6 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="grid min-h-0 flex-1 grid-rows-2 gap-3">
                    {analyticsEvidence.map((evidence) => (
                      <EvidenceButton
                        key={evidence.src}
                        evidence={evidence}
                        onOpen={setZoomedEvidence}
                        tabIndex={activeSlide === 3 ? 0 : -1}
                        className="min-h-0"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-stone-500">
                    792 Sitzungen · 112 Key Events · 30. Apr.–28. Juli 2026
                  </p>
                </div>

                <div
                  className="relative flex h-full w-full shrink-0 flex-col overflow-hidden bg-navy p-7 pb-16 text-white sm:p-10 sm:pb-16"
                  role="group"
                  aria-label="Folie 5 von 5: Einordnung der Daten"
                  aria-hidden={activeSlide !== 4}
                >
                  <div
                    className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-success-500/20 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-300">
                      So sind die Zahlen zu lesen
                    </p>
                    <h4 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Transparenz statt größerer Versprechen.
                    </h4>
                  </div>
                  <ul className="relative mt-8 space-y-4">
                    {[
                      "211 Kontaktaktionen stammen aus dem projektbezogenen Lead-Sheet.",
                      "792 Sitzungen und 112 Key Events stammen aus einem separaten GA4-Zeitraum.",
                      "GA4-Werte werden nicht zu den Kontaktaktionen addiert.",
                      "Kontaktaktionen sind keine abgeschlossenen Fahrzeugankäufe und keine Umsatzzahl.",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-relaxed text-white/70"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-success-300"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="relative mt-auto flex items-start gap-2 pt-6 text-xs leading-relaxed text-white/45">
                    <Info
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Der interne Sheet-Name lautet „frankenautoankauf.de“ und
                    gehört zum Projekt frankenautoankauf24.de.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showSlide(activeSlide - 1)}
              aria-label="Vorherige Folie"
              className="focus-ring absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-navy/75 text-white shadow-soft backdrop-blur transition-colors hover:bg-navy"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => showSlide(activeSlide + 1)}
              aria-label="Nächste Folie"
              className="focus-ring absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-navy/75 text-white shadow-soft backdrop-blur transition-colors hover:bg-navy"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>

            <div
              className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-navy/75 px-3 py-2 backdrop-blur"
              aria-label="Folienauswahl"
            >
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => showSlide(index)}
                  aria-label={`Folie ${index + 1}: ${slide.label}`}
                  aria-current={activeSlide === index ? "true" : undefined}
                  className={cn(
                    "focus-ring h-2 rounded-full transition-all",
                    activeSlide === index
                      ? "w-6 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/65",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-8 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
              {study.category}
            </p>
            <p className="mt-5 font-mono text-6xl font-bold tracking-[-0.07em] text-navy">
              211
            </p>
            <p className="mt-2 text-lg font-bold leading-snug text-navy">
              dokumentierte Kontaktaktionen
            </p>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              Ein projektbezogenes Lead-Sheet dokumentiert Formular-, Telefon-
              und WhatsApp-Kontakte. Die Screenshots zeigen die Datengrundlage,
              ohne personenbezogene Inhalte offenzulegen.
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-2">
              {study.methods.map((method) => (
                <div
                  key={method.key}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <dt className="text-[11px] font-semibold text-stone-500">
                    {method.label}
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-bold text-navy">
                    {method.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-xs text-stone-500">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-stamp" aria-hidden="true" />
                Lead-Sheet: {study.period}
              </p>
              <p className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" aria-hidden="true" />
                GA4 separat: 30. Apr.–28. Juli 2026
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck
                  className="size-4 text-success-700"
                  aria-hidden="true"
                />
                Datenauszug vom 29. Juli 2026
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs leading-relaxed text-amber-900">
                Kontaktaktionen sind dokumentierte Eingänge. Sie belegen keine
                abgeschlossenen Ankäufe, keinen Umsatz und keine garantierte
                Erfolgsquote.
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
              >
                Website ansehen
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
              <a
                href="#contact"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                Ähnliches Projekt besprechen
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
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
