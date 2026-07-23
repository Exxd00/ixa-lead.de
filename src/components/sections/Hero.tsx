import {
  ArrowRight,
  Check,
  Search,
  LayoutTemplate,
  MessageSquare,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { Button } from "@/components/ui/button";
import { heroTrustPoints, heroChips } from "@/data/site";

const funnel = [
  {
    icon: Search,
    label: "Suche & Anzeige",
    note: "Lokale Sichtbarkeit",
    status: "Sichtbar",
    tone: "blue",
  },
  {
    icon: LayoutTemplate,
    label: "Website",
    note: "Klarheit & Vertrauen",
    status: "Optimiert",
    tone: "navy",
  },
  {
    icon: MessageSquare,
    label: "Anruf, WhatsApp, Formular",
    note: "Kontaktschritt",
    status: "Getracktes Event",
    tone: "blue",
  },
  {
    icon: UserCheck,
    label: "Messbare Anfrage",
    note: "Automatisch erfasst",
    status: "Messbar",
    tone: "green",
  },
] as const;

const toneStyles: Record<string, { chip: string; icon: string }> = {
  blue: { chip: "bg-primary/10 text-primary", icon: "bg-primary/10 text-primary" },
  navy: { chip: "bg-navy/10 text-navy", icon: "bg-navy/10 text-navy" },
  green: {
    chip: "bg-success-50 text-success-700",
    icon: "bg-success-50 text-success-600",
  },
};

export function Hero() {
  return (
    <section id="home" className="hero-wash relative overflow-hidden">
      {/* dezentes Raster */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,46,86,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,46,86,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="container-lp relative grid items-center gap-8 pb-14 pt-24 sm:gap-12 sm:pb-20 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-36">
        {/* Textspalte */}
        <div className="flex flex-col items-start">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Digitale Kundengewinnung · Nürnberg & Franken
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-5 text-[1.9rem] font-bold leading-[1.14] text-navy sm:mt-6 sm:text-[2.6rem] lg:text-[3.1rem] lg:leading-[1.08]">
              <span className="block text-navy">
                Website. Werbung. Tracking.
              </span>
              <span className="relative mt-2 block whitespace-nowrap text-primary">
                Mehr messbare Anfragen.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-primary/30"
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
            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>
                Ich baue digitale Kundengewinnungs-Systeme für lokale Unternehmen
                in Nürnberg und Franken – von der Suche bis zur messbaren Anfrage.
              </p>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton
                event="hero_cta_click"
                location="hero_primary"
                size="xl"
                icon={<ArrowRight className="order-last" />}
                className="w-full sm:w-auto"
              >
                Kostenlose Erstanalyse anfordern
              </CtaButton>
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <a href="#packages">Pakete ansehen</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-navy">
              <ShieldCheck className="size-4 text-primary" />
              Ihr Partner in Nürnberg und Franken für digitale Kundengewinnung.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {heroTrustPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-100 text-success-700">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Visualisierung: Reise vom Klick zur Anfrage */}
        <Reveal delay={200} className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/10 via-transparent to-success-200/20 blur-2xl"
          />

          <div className="card-soft relative rounded-[1.75rem] p-5 sm:p-6">
            {/* Kopf */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-navy text-white">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-navy">Ihr System</p>
                  <p className="text-xs text-slate-500">
                    Von der Suche zur messbaren Anfrage
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
                <span className="size-1.5 animate-pulse-soft rounded-full bg-success-500" />
                Bereit
              </span>
            </div>

            {/* Schritte */}
            <ol className="mt-5">
              {funnel.map((step, i) => {
                const Icon = step.icon;
                const tone = toneStyles[step.tone];
                const isLast = i === funnel.length - 1;
                return (
                  <li key={step.label}>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone.icon}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">
                          {step.label}
                        </p>
                        <p className="truncate text-xs text-slate-500">{step.note}</p>
                      </div>
                      <span
                        className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-block ${tone.chip}`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {!isLast && (
                      <div className="relative ml-[34px] h-6 w-0.5 overflow-hidden bg-slate-200">
                        <span className="absolute inset-x-0 top-0 h-2 animate-flow-down bg-primary/70" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Tool-Chips */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {heroChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  <span className="size-1.5 rounded-full bg-primary/60" />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* schwebende Karte für Tiefe */}
          <div className="absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-card backdrop-blur sm:flex">
            <span className="grid size-9 place-items-center rounded-xl bg-success-50 text-success-600">
              <Check className="size-5" strokeWidth={3} />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-navy">Lead-Automation</p>
              <p className="text-[11px] text-slate-500">
                Anfragen automatisch erfasst
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
