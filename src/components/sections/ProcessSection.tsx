import { Activity, Compass, Rocket, Wrench } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  {
    icon: Compass,
    title: "Analyse",
    text: "Angebot, Region, Wettbewerb, bestehende Daten und der echte Weg Ihrer Kunden.",
  },
  {
    icon: Wrench,
    title: "Aufbau",
    text: "Website, Botschaft, lokale Seiten und Kontaktwege werden als ein System umgesetzt.",
  },
  {
    icon: Activity,
    title: "Messung",
    text: "Formular, Telefon und WhatsApp erhalten getrennte Events und eine saubere Lead-Erfassung.",
  },
  {
    icon: Rocket,
    title: "Optimierung",
    text: "Wir verbessern auf Basis echter Kontakte – nicht aufgrund von Bauchgefühl oder Klickzahlen.",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="border-y border-navy/10 bg-[#f3f1eb] py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Zusammenarbeit"
          title="Vier klare Schritte. Ein direkter Ansprechpartner."
          description="Sie wissen vor dem Start, was gebaut, gemessen und als Nächstes verbessert wird."
        />

        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-navy/12 lg:block"
          />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal
                  key={step.title}
                  delay={index * 70}
                  as="li"
                  className="relative"
                >
                  <article className="h-full rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="relative z-10 grid size-12 place-items-center rounded-2xl bg-navy text-white">
                        <Icon className="size-5" />
                      </span>
                      <span className="font-mono text-sm font-bold text-primary">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-navy">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {step.text}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
