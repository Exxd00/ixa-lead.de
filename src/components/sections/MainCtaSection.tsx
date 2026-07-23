import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";

const reviewPoints = [
  "Lokale Sichtbarkeit",
  "Die Website",
  "Die Botschaft",
  "Mobile Erfahrung & Ladezeit",
  "Tracking",
  "Lead-Automation",
  "Kontaktwege",
  "oder ein anderer Punkt",
];

export function MainCtaSection() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-lp">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-navy px-6 py-12 shadow-card sm:px-10 sm:py-14 lg:px-14">
            {/* توهج خفيف */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 left-0 size-72 rounded-full bg-success-500/10 blur-3xl"
            />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h2 className="text-2xl font-bold leading-snug text-white sm:text-3xl">
                  Bevor Sie das Budget erhöhen: Ist Ihr System bereit dafür?
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                  Erzählen Sie mir kurz von Ihrem Unternehmen und Ihrem Ziel – mit
                  oder ohne bestehende Website. Ich verschaffe mir einen Überblick
                  und helfe einzuordnen, wo der größte Hebel liegt:
                </p>
                <div className="mt-8">
                  <CtaButton
                    event="hero_cta_click"
                    location="main_cta"
                    variant="light"
                    size="xl"
                    icon={<ArrowRight className="order-last" />}
                  >
                    Erstanalyse anfordern
                  </CtaButton>
                </div>
              </div>

              <ul className="grid grid-cols-1 gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:grid-cols-2 sm:p-6">
                {reviewPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2.5 text-[15px] text-slate-200"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
