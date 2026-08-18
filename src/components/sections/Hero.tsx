import { CtaButton } from "@/components/cta";
import { documentedCases } from "@/data/evidence";
import { freeCheckServiceId } from "@/data/site";
import { ArrowRight, MapPin } from "lucide-react";

const featuredCase =
  documentedCases.find((study) => study.featured) ?? documentedCases[0];

export function Hero() {
  return (
    <section
      id="home"
      className="hero-wash relative isolate overflow-hidden pb-14 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-36"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-28 -z-10 size-72 rounded-full bg-primary/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 -z-10 size-80 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="container-lp grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-white/75 backdrop-blur">
            <MapPin
              className="size-3.5 text-success-300"
              aria-hidden="true"
            />
            Für lokale Dienstleister in Nürnberg & Franken
          </span>

          <h1 className="mt-6 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.045em] text-white sm:text-[3.3rem] lg:text-[4.25rem]">
            Aus Google-Suchen werden Kontaktanfragen.
            <span className="mt-1 block text-white/50">
              Und Sie sehen, woher sie kommen.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            IXA baut für lokale Dienstleistungsbetriebe in Nürnberg &amp;
            Franken einen klaren Weg von der Google-Suche bis zur messbaren
            Kontaktanfrage – mit passender Website oder Landingpage, Google Ads
            und sauberer Kontaktmessung.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton
              event="check_cta_click"
              location="hero_primary"
              service={freeCheckServiceId}
              size="xl"
              icon={<ArrowRight className="order-last" />}
              className="liquid-cta h-auto min-h-14 w-full whitespace-normal px-4 py-3 text-center text-sm leading-tight sm:h-14 sm:w-auto sm:whitespace-nowrap sm:px-8 sm:py-0 sm:text-base"
            >
              Anfrage-Potenzial kostenlos prüfen
            </CtaButton>
            <a
              href="#results"
              className="focus-ring inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-7 text-sm font-bold text-white transition-colors hover:bg-white/15 sm:w-auto sm:text-base"
            >
              Ergebnisse ansehen
            </a>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/55 sm:text-sm">
            Kostenlose persönliche Ersteinschätzung · keine feste Kundenzahl
            versprochen
          </p>

          <p className="mt-5 max-w-xl text-sm font-semibold leading-relaxed text-white/70">
            Geeignet für Betriebe mit vorhandener Suchnachfrage, freien
            Kapazitäten und wirtschaftlich relevanten Aufträgen.
          </p>

          <div className="mt-6 lg:hidden">
            <a
              href="#ergebnis-frankenautoankauf24"
              className="focus-ring flex flex-col items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-4"
            >
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.12em] text-success-300">
                  Franken Autoankauf 24
                </span>
                <span className="mt-1 block text-sm font-semibold text-white/75">
                  <strong className="mr-1.5 font-mono text-xl text-white">
                    {featuredCase.documentedActions}
                  </strong>
                  dokumentierte Kontakte
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-success-300">
                Originalauszug ansehen
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/20 blur-3xl" />
            <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-300">
                    Stärkste dokumentierte Fallstudie
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tracking-[-0.06em] text-white sm:text-6xl">
                    {featuredCase.documentedActions}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    dokumentierte Kontaktaktionen
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-success-300/20 bg-success-300/10 px-3 py-1.5 text-xs font-bold text-success-200">
                  <span className="size-2 rounded-full bg-success-300" />
                  mit Nachweisen
                </span>
              </div>

              <p className="mt-5 text-base font-bold text-white">
                Franken Autoankauf 24
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                Der anonymisierte Originalauszug zeigt Datum, Status und
                Kontaktart direkt im nächsten Abschnitt.
              </p>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs leading-relaxed text-white/60">
                  Quelle: projektbezogenes Lead-Sheet, 16. Apr.–8. Juni 2026.
                  Kontaktaktionen sind keine abgeschlossenen Fahrzeugankäufe
                  oder Umsatzzahl.
                </p>
                <a
                  href="#ergebnis-frankenautoankauf24"
                  className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg text-xs font-bold text-success-300 hover:text-success-200"
                >
                  Originalauszug ansehen
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
