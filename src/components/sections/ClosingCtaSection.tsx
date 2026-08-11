import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { freeCheckServiceId } from "@/data/site";
import { ArrowRight } from "lucide-react";

export function ClosingCtaSection() {
  return (
    <section className="hero-wash relative isolate overflow-hidden py-16 text-white sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-0 -z-10 size-72 rounded-full bg-primary/25 blur-[110px]"
      />
      <div className="container-lp">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-300">
              Der sinnvolle nächste Schritt
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-5xl">
              Ist IXA der richtige nächste Schritt für Ihren Betrieb?
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
              Nicht jeder lokale Betrieb braucht automatisch mehr Werbung. Wir
              prüfen zuerst, ob für Ihre Leistung relevante Google-Suchnachfrage
              vorhanden ist, ob zusätzliche Aufträge aktuell wirtschaftlich
              sinnvoll sind und ob Ihr Betrieb die notwendige Kapazität besitzt.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
              Wenn die Voraussetzungen passen, zeigen wir Ihnen, wie ein
              nachvollziehbares Anfrage-System aussehen kann.
            </p>
            <CtaButton
              event="check_cta_click"
              location="closing_cta"
              service={freeCheckServiceId}
              size="xl"
              icon={<ArrowRight className="order-last size-5" />}
              className="mt-8 h-auto min-h-14 w-full whitespace-normal px-4 py-3 text-center text-sm leading-tight sm:w-auto sm:px-8 sm:text-base"
            >
              Anfrage-Potenzial kostenlos prüfen
            </CtaButton>
            <p className="mt-3 text-xs font-semibold text-white/50">
              Kostenlose persönliche Ersteinschätzung · keine feste Kundenzahl
              versprochen
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
