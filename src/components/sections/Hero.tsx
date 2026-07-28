"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import ShinyText from "@/components/ShinyText";
import SplitText from "@/components/SplitText";
import Aurora from "@/components/Aurora";
import TargetCursor from "@/components/TargetCursor";
import { heroTrustPoints, heroChips } from "@/data/site";

/* Positionen der 4 Signalpunkte entlang des Trace-Pfads (in % relativ zum
   220x220-Zeichenbereich) und kurze Labels, damit nichts über den Kartenrand
   hinausläuft — heroJourney.label bleibt der ausführliche Text an anderer Stelle. */
const points = [
  { x: 8, y: 78, label: "Suche", align: "left" as const },
  { x: 36, y: 56, label: "Website", align: "center" as const },
  { x: 64, y: 38, label: "Kontakt", align: "center" as const },
  { x: 92, y: 14, label: "Anfrage", align: "right" as const },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [cursorActive, setCursorActive] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  // TargetCursor ist ein globaler Cursor-Ersatz — wird nur montiert, solange
  // der Hero im Viewport ist, damit der Rest der Seite (Formular, Fließtext)
  // den normalen Mauszeiger behält. TargetCursor schaltet sich auf Touch-
  // Geräten selbst ab, aber diese Prüfung verlässt sich auf Touch-/UA-
  // Erkennung — als zusätzliche Absicherung wird hier zusätzlich explizit
  // die Breakpoint-Breite (wie überall sonst auf der Seite: ab lg) geprüft.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopViewport(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCursorActive(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-wash relative overflow-hidden"
    >
      {cursorActive && isDesktopViewport && (
        <TargetCursor
          targetSelector=".cursor-target"
          cursorColor="#5B8CFF"
          spinDuration={3}
        />
      )}

      {/* Aurora-Hintergrund — nur Desktop, WebGL kostet auf Mobil Akku/Leistung */}
      <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
        <Aurora colorStops={["#1D2430", "#5B8CFF", "#FF7043"]} amplitude={0.8} blend={0.55} speed={0.6} />
      </div>

      {/* dezentes Raster */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="container-lp relative grid items-center gap-10 pb-16 pt-24 sm:gap-14 sm:pb-24 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-32 lg:pt-36">
        {/* Textspalte */}
        <div className="flex flex-col items-start">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
              <span className="relative inline-flex size-2 rounded-full bg-primary">
                <span className="absolute inset-0 animate-signal-ping rounded-full bg-primary" />
              </span>
              Digitale Kundengewinnung · Nürnberg & Franken
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-5 text-[1.9rem] font-bold leading-[1.12] text-white sm:mt-6 sm:text-[2.7rem] lg:text-[3.25rem] lg:leading-[1.06]">
              <SplitText
                text="Website. Werbung. Tracking."
                tag="span"
                className="block"
                textAlign="left"
                splitType="words"
                delay={60}
                duration={0.7}
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
              />
              <span className="relative mt-2 block whitespace-nowrap">
                <ShinyText
                  text="Live gemessen."
                  color="#5B8CFF"
                  shineColor="#ffffff"
                  speed={2.4}
                  className="text-[1.9rem] font-bold sm:text-[2.7rem] lg:text-[3.25rem]"
                />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-primary/40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 Q 100 2 198 8"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
              Ich baue digitale Kundengewinnungs-Systeme für lokale Unternehmen
              in Nürnberg und Franken – von der Suche bis zur messbaren Anfrage.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton
                event="hero_cta_click"
                location="hero_primary"
                size="xl"
                icon={<ArrowRight className="order-last" />}
                className="cursor-target w-full sm:w-auto"
              >
                Kostenlose Erstanalyse anfordern
              </CtaButton>
              <a
                href="#packages"
                className="cursor-target focus-ring inline-flex h-14 w-full items-center justify-center rounded-xl border border-white/20 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Pakete ansehen
              </a>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {heroTrustPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-white/60">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-success-400">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Signatur-Visualisierung: eine live gezeichnete Tracking-Linie statt
            einer statischen Karte — zeigt den Kern des Angebots (messbare
            Anfragen) direkt als Bewegung, nicht als Text in einer Box. */}
        <Reveal delay={200} className="relative">
          <div className="relative aspect-[5/4] w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Ihr System · live
            </p>

            <div className="relative mt-4 h-[calc(100%-2.5rem)] w-full">
              <svg
                aria-hidden="true"
                viewBox="0 0 220 220"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full overflow-visible text-primary"
              >
                <path
                  d={`M ${points.map((p) => `${p.x * 2.2},${p.y * 2.2}`).join(" L ")}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={700}
                  className="animate-draw-line"
                  style={{ ["--line-length" as string]: 700 }}
                />
              </svg>

              {points.map((p, i) => {
                const isLast = i === points.length - 1;
                const labelAlign =
                  p.align === "left"
                    ? "left-0"
                    : p.align === "right"
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";
                return (
                  <div
                    key={p.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2 opacity-0 animate-fade-up"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      animationDelay: `${0.35 + i * 0.4}s`,
                    }}
                  >
                    <span
                      className={`relative grid size-3 place-items-center rounded-full ${isLast ? "bg-success-400" : "bg-primary"}`}
                    >
                      <span
                        className={`absolute inset-0 rounded-full ${isLast ? "bg-success-400" : "bg-primary"} animate-signal-ping`}
                      />
                    </span>
                    <span
                      className={`absolute top-full mt-1.5 whitespace-nowrap rounded-md bg-navy-950/80 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur ${labelAlign}`}
                    >
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-5 flex items-center gap-2 rounded-xl border border-success-400/30 bg-success-400/10 px-3.5 py-2.5 opacity-0 animate-fade-up"
              style={{ animationDelay: "1.9s" }}
            >
              <Check className="size-4 shrink-0 text-success-400" strokeWidth={3} />
              <p className="text-xs font-semibold text-success-300">
                Anfrage automatisch erfasst und getrackt
              </p>
            </div>
          </div>

          {/* Tool-Chips */}
          <div
            className="mt-4 flex flex-wrap gap-2 opacity-0 animate-fade-up"
            style={{ animationDelay: "2.1s" }}
          >
            {heroChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/60"
              >
                <span className="size-1.5 rounded-full bg-primary/70" />
                {chip}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
