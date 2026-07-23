import { Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { diagnosisItems } from "@/data/site";

export function DiagnosisSection() {
  return (
    <section className="section-alt border-y border-slate-200/70 py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Schnelle Selbstprüfung"
          title="Kommt Ihnen eine dieser Situationen bekannt vor?"
        />

        <div className="mx-auto mt-12 max-w-4xl">
          <ul className="grid gap-3 sm:grid-cols-2">
            {diagnosisItems.map((item, i) => (
              <Reveal key={item} delay={i * 40}>
                <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-success-100 text-success-700">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] leading-relaxed text-slate-700">
                    {item}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-col items-center gap-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 text-center sm:p-8">
              <p className="max-w-2xl text-base leading-relaxed text-navy sm:text-lg">
                Trifft einer oder mehrere Punkte zu, liegt das Problem oft nicht an
                der Zahl der Besucher – sondern am Zusammenspiel von Sichtbarkeit,
                Website und Nachverfolgung.
              </p>
              <CtaButton event="hero_cta_click" location="diagnosis" size="lg">
                Kostenlose Erstanalyse anfordern
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
