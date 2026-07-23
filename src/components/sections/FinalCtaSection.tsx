import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";

export function FinalCtaSection() {
  return (
    <section className="section-alt border-t border-slate-200/70 py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-2xl font-bold leading-snug text-navy sm:text-3xl md:text-[2.1rem]">
            Bauen Sie ein System, das aus Interesse messbare Anfragen macht
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Fordern Sie Ihre kostenlose Erstanalyse an – ich zeige Ihnen die
            wichtigsten Hebel für mehr Sichtbarkeit und mehr Kontakt.
          </p>
          <div className="mt-8">
            <CtaButton
              event="hero_cta_click"
              location="final_cta"
              size="xl"
              icon={<ArrowRight className="order-last" />}
            >
              Jetzt Erstanalyse anfordern
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
