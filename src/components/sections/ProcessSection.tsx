import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { Activity, Compass, Wrench } from "lucide-react";

const steps = [
  {
    icon: Compass,
    title: "Ausgangslage verstehen",
    text: "Angebot, Region, Wettbewerb, bestehende Daten und der echte Weg Ihrer Kunden.",
  },
  {
    icon: Wrench,
    title: "Anfrage-System aufbauen",
    text: "Website, Botschaft, lokale Seiten und Kontaktwege werden als ein System umgesetzt.",
  },
  {
    icon: Activity,
    title: "Messen und verbessern",
    text: "Formular, Telefon und WhatsApp werden getrennt erfasst. Wir verbessern auf Basis echter Kontakte.",
  },
];

export function ProcessSection() {
  return (
    <section
      id="process"
      className="border-y border-navy/10 bg-[#f3f1eb] py-14 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Zusammenarbeit"
          title="Drei klare Schritte. Ein direkter Ansprechpartner."
          description="Sie wissen jederzeit, was als Nächstes passiert."
        />

        <ol className="mt-9 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 70} as="li">
                <article className="flex h-full items-start gap-4 rounded-[1.25rem] border border-navy/10 bg-white p-4 shadow-soft lg:block lg:p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white">
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 lg:mt-4">
                    <p className="font-mono text-[11px] font-bold text-primary">
                      0{index + 1}
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-navy lg:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600 lg:text-sm">
                      {step.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
