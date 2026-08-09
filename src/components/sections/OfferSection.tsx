import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { freeCheckServiceId } from "@/data/site";
import { ArrowRight, Check, Clock3 } from "lucide-react";

const outcomes = [
  "Ausgangslage und Suchnachfrage prüfen",
  "den passenden Weg zur Kontaktanfrage aufbauen",
  "Kampagne und Kontaktmessung kontrolliert starten",
  "mit realen Such-, Kontakt- und Kundenfeedback-Daten verbessern",
  "nach 90 Tagen gemeinsam und transparent auswerten",
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
                <p className="mt-5 text-base leading-relaxed text-white/65">
                  In den ersten 90 Tagen wird das Anfrage-System analysiert,
                  aufgebaut, gestartet, mit realen Daten ausgewertet und gezielt
                  verbessert.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  Entscheidend sind ein nachvollziehbarer Prozess und eine
                  ehrliche Datengrundlage.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-sm font-bold text-white">
                Was in den 90 Tagen erreicht werden soll
              </p>
              <ul className="mt-5 space-y-3">
                {outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-300/15 text-success-300">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-white/70">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
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
