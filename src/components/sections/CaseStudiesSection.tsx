"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Briefcase, TrendingUp, CalendarDays, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";
import { caseStudies, type CaseStudy } from "@/data/site";

function CaseStudyCard({ study, id }: { study: CaseStudy; id?: string }) {
  return (
    <article
      id={id}
      className="card-soft relative flex h-full w-full scroll-mt-24 flex-col p-6 sm:p-7"
    >
      {study.badge && (
        <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-success-600 px-4 py-1.5 text-xs font-bold text-white shadow-cta">
          <TrendingUp className="size-3.5" strokeWidth={2.5} />
          {study.badge}
        </span>
      )}

      {/* Kopf: Unternehmen + Branche */}
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-white">
          <Briefcase className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-navy">
            {study.business}
          </h3>
          <p className="text-xs font-medium uppercase leading-snug tracking-wide text-stamp">
            {study.category}
          </p>
        </div>
      </div>

      {/* Große Kennzahl */}
      <div className="mt-5 rounded-xl border border-success-200 bg-success-50/60 p-4">
        <p className="text-lg font-bold leading-snug text-navy sm:text-xl">
          {study.headline}
        </p>
        {study.stats && study.stats.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {study.stats.map((stat) => (
              <span
                key={stat}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-success-700 shadow-sm"
              >
                {stat}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
          Ausgangslage
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
          {study.ausgangslage}
        </p>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
          Umsetzung
        </p>
        <ul className="mt-2 space-y-1.5">
          {study.umsetzung.map((action) => (
            <li
              key={action}
              className="flex items-start gap-2 text-sm text-stone-600"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-success-600"
                strokeWidth={3}
              />
              {action}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
          Ergebnis
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
          {study.ergebnis}
        </p>
      </div>

      {study.zeitraum && (
        <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-500">
          <CalendarDays className="size-3.5" />
          Zeitraum: {study.zeitraum}
        </div>
      )}

      <p className="mt-4 text-[11px] italic text-stone-400">
        Quelle: {study.quelle}
      </p>

      {study.websiteUrl && (
        <a
          href={study.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-stamp hover:underline"
        >
          Website besuchen
          <ArrowUpRight className="size-3.5" />
        </a>
      )}
    </article>
  );
}

export function CaseStudiesSection() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [barVisible, setBarVisible] = useState(false);

  // Verfolgt, welche Karte im mobilen Karussell gerade am sichtbarsten ist
  useEffect(() => {
    const scrollNode = scrollRef.current;
    if (!scrollNode) return;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        cardRefs.current.forEach((node, i) => {
          if (!node) return;
          const ratio = ratios.get(node) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = i;
          }
        });
        setActiveIndex(bestIndex);
      },
      { root: scrollNode, threshold: [0.25, 0.5, 0.75, 1] },
    );

    for (const node of cardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  // Springt beim Laden (und bei reinen Hash-Wechseln ohne Neuladen) mit #ergebnis-<id>
  // zur jeweils sichtbaren Karte (Mobil-Karussell/Desktop-Grid tragen wegen der
  // responsiven Dopplung unterschiedliche IDs).
  useEffect(() => {
    const scrollToHashTarget = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#ergebnis-")) return;
      const baseId = hash.slice(1);

      if (window.matchMedia("(min-width: 768px)").matches) {
        document
          .getElementById(baseId)
          ?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
        return;
      }

      // Mobil: Die Karte liegt in einem horizontalen Scroll-Snap-Container.
      // scrollIntoView() dort direkt aufzurufen kollidiert mit scroll-snap
      // (der vertikale Sprung zur Sektion bleibt sonst wirkungslos) — daher
      // Seiten- und Karussell-Scroll getrennt behandeln.
      const studyId = baseId.replace(/^ergebnis-/, "");
      const index = caseStudies.findIndex((study) => study.id === studyId);
      if (index === -1) return;

      sectionRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant" as ScrollBehavior,
      });
      const card = cardRefs.current[index];
      const scroller = scrollRef.current;
      if (card && scroller) {
        scroller.scrollLeft = card.offsetLeft - scroller.offsetLeft;
      }
    };

    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => window.removeEventListener("hashchange", scrollToHashTarget);
  }, []);

  // Blendet die mobile Indikator-Leiste ein, solange der Abschnitt im Viewport ist
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="results" ref={sectionRef} className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Erfolgsgeschichten"
          title="Case Studies aus echten Projekten"
          description="Dokumentierte Anfragen, Zeiträume und Quellen offen einsehbar – vom Problem über die Umsetzung bis zum Ergebnis. Ohne aufgeblähte Zahlen."
        />

        {/* Mobil: horizontales Karussell */}
        <div
          ref={scrollRef}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden"
        >
          {caseStudies.map((study, i) => (
            <div
              key={study.id}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              className="w-[85%] shrink-0 snap-center sm:w-[70%]"
            >
              <Reveal delay={i * 90} className="h-full">
                <CaseStudyCard study={study} id={`ergebnis-${study.id}-m`} />
              </Reveal>
            </div>
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-4">
          {caseStudies.map((study, i) => (
            <Reveal key={study.id} delay={i * 90} className="flex">
              <CaseStudyCard study={study} id={`ergebnis-${study.id}`} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Mobile Indikator-Leiste: zeigt aktive Karte, ein-/ausblendend über der Bottom-Bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-[76px] z-30 flex justify-center transition-all duration-300 lg:hidden",
          barVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!barVisible}
      >
        <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-3 py-1.5 shadow-soft backdrop-blur-md">
          {caseStudies.map((study, i) => (
            <span
              key={study.id}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === activeIndex ? "bg-primary" : "bg-stone-300",
              )}
            />
          ))}
          <span className="ml-1 text-[11px] font-semibold text-stone-500">
            {activeIndex + 1} / {caseStudies.length}
          </span>
        </div>
      </div>
    </section>
  );
}
