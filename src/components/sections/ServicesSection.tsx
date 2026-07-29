import { ArrowRight, BarChart3, MousePointerClick, Search } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";

const stages = [
  {
    number: "01",
    icon: Search,
    title: "Gefunden werden",
    text: "Ihr Angebot erscheint dort, wo Menschen in Ihrer Region bereits nach Ihrer Leistung suchen.",
  },
  {
    number: "02",
    icon: MousePointerClick,
    title: "Vertrauen & Kontakt",
    text: "Eine klare mobile Website führt ohne Umwege zu Anruf, WhatsApp oder Formular.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Verstehen, was funktioniert",
    text: "Anrufe, WhatsApp und Formulare werden getrennt erfasst. So sehen Sie, welcher Weg Anfragen bringt.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-14 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Das IXA-System"
          title="Vom Suchmoment bis zur nachverfolgbaren Anfrage"
          description="Drei einfache Stufen, die gemeinsam arbeiten – ohne technischen Umweg für Sie."
        />

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Reveal key={stage.title} delay={index * 80}>
                <article className="group flex h-full items-start gap-4 rounded-[1.35rem] border border-navy/10 bg-[#fbfaf7] p-5 transition-all hover:border-primary/25 hover:shadow-card lg:block lg:p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-white">
                      <Icon className="size-5" />
                    </span>
                    <span className="hidden font-mono text-sm font-bold text-stone-300 lg:block">
                      {stage.number}
                    </span>
                  </div>

                  <div className="min-w-0 lg:mt-5">
                    <h3 className="text-lg font-bold text-navy lg:text-xl">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600 lg:text-[15px]">
                      {stage.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <CtaButton
            event="service_cta_click"
            location="services"
            service="Komplettes IXA-System"
            icon={<ArrowRight className="order-last size-4" />}
          >
            Kostenlose Erstanalyse
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
