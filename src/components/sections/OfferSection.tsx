import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { freeCheckServiceId } from "@/data/site";
import { ArrowRight, Clock3 } from "lucide-react";

const phases = [
  {
    title: "Analyse",
    text: "Leistung, Zielregion, Suchnachfrage, Wettbewerb und aktuelle Ausgangslage prüfen.",
  },
  {
    title: "Aufbau",
    text: "Bestehende Website verbessern oder bei Bedarf eine fokussierte Website beziehungsweise Landingpage aufbauen, Google Ads vorbereiten und Kontaktmessung einrichten.",
  },
  {
    title: "Start & Optimierung",
    text: "Kampagne starten, echte Suchbegriffe auswerten, irrelevante Suchanfragen ausschließen, Anzeigen und Landingpage verbessern und Kundenfeedback berücksichtigen.",
  },
  {
    title: "Auswertung",
    text: "Nach 90 Tagen gemeinsam prüfen, welche Quellen Kontaktaktionen erzeugten, welche Suchbegriffe sinnvoll waren und welche nächsten Schritte wirtschaftlich sinnvoll sind.",
  },
];

export function OfferSection() {
  return (
    <section id="offer" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <Reveal>
          <article
            data-floating-cta-avoid
            className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-navy/10 bg-navy text-white shadow-card lg:grid-cols-[.9fr_1.1fr]"
          >
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div
                aria-hidden="true"
                className="absolute -left-20 -top-24 size-64 rounded-full bg-primary/25 blur-[100px]"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-success-300/20 bg-success-300/10 px-3 py-1.5 text-xs font-bold text-success-300">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Analyse · Aufbau · Start · Optimierung
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  IXA Anfrage-System – 90 Tage
                </h2>
                <p className="mt-3 text-lg font-bold text-success-300">
                  Aufbauen. Starten. Messen. Verbessern.
                </p>
                <p className="mt-5 text-base leading-relaxed text-white/65">
                  Ein klarer Weg von vorhandener Google-Suchnachfrage bis zur
                  messbaren Kontaktanfrage – angepasst an die tatsächliche
                  Ausgangslage Ihres Betriebs.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  Entscheidend sind ein nachvollziehbarer Prozess und eine
                  ehrliche Datengrundlage.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <ol className="space-y-4">
                {phases.map((phase, index) => (
                  <li key={phase.title} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-300/15 text-success-300">
                      <span className="font-mono text-[10px] font-bold">
                        0{index + 1}
                      </span>
                    </span>
                    <span>
                      <strong className="block text-sm text-white">
                        {phase.title}
                      </strong>
                      <span className="mt-1 block text-sm leading-relaxed text-white/60">
                        {phase.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <CtaButton
                event="check_cta_click"
                location="offer_90_days"
                service={freeCheckServiceId}
                icon={<ArrowRight className="order-last size-4" />}
                className="mt-7 h-auto min-h-12 w-full whitespace-normal bg-white px-4 py-3 text-center text-sm leading-tight text-navy shadow-none hover:bg-white/90 sm:text-base"
              >
                Anfrage-Potenzial kostenlos prüfen
              </CtaButton>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
