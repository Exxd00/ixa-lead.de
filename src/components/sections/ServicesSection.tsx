import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { SectionHeading } from "@/components/section-heading";
import { freeCheckServiceId } from "@/data/site";
import { ArrowRight, BarChart3, Gauge, Search, Target } from "lucide-react";

const stages = [
  {
    icon: Search,
    title: "Nachfrage verstehen",
    text: "Leistung, Region, Suchintention und Wettbewerb prüfen.",
  },
  {
    icon: Target,
    title: "Aufbau",
    text: "Den passenden Weg von der Google-Suche über eine fokussierte Seite bis zu Telefon, WhatsApp oder Formular aufbauen.",
  },
  {
    icon: BarChart3,
    title: "Messung",
    text: "Kontaktaktionen getrennt erfassen, damit sichtbar wird, welche Suchanfragen und Kontaktwege genutzt werden.",
  },
  {
    icon: Gauge,
    title: "Optimierung",
    text: "Suchbegriffe, Anzeigen, Landingpage und Kontaktwege anhand realer Daten und Kundenfeedback optimieren.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Das IXA Anfrage-System"
          title="Vom Suchmoment bis zur nachvollziehbaren Kontaktanfrage."
          description="Nicht einzelne Tools stehen im Mittelpunkt, sondern ein klarer Prozess von der vorhandenen Nachfrage bis zur messbaren Kontaktaktion."
        />

        <ol className="mx-auto mt-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Reveal key={stage.title} delay={index * 55} as="li">
                <article className="flex h-full items-start gap-4 rounded-[1.35rem] border border-navy/10 bg-[#fbfaf7] p-5 transition-all hover:border-primary/25 hover:shadow-card">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold text-primary">
                      0{index + 1}
                    </p>
                    <h3 className="mt-0.5 text-lg font-bold text-navy">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {stage.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ol>

        <Reveal className="mx-auto mt-6 max-w-4xl">
          <p className="rounded-2xl border border-primary/15 bg-primary/[0.04] px-5 py-4 text-center text-sm font-semibold leading-relaxed text-navy sm:text-base">
            Website, Google Ads und Kontaktmessung sind keine drei getrennten
            Hauptprodukte. Sie erfüllen unterschiedliche Aufgaben innerhalb
            desselben Anfrage-Systems.
          </p>
        </Reveal>

        <div className="mt-8 text-center">
          <CtaButton
            event="check_cta_click"
            location="services"
            service={freeCheckServiceId}
            icon={<ArrowRight className="order-last size-4" />}
            className="h-auto min-h-12 whitespace-normal px-4 py-3 text-center text-sm leading-tight sm:h-12 sm:whitespace-nowrap sm:px-7 sm:py-0 sm:text-base"
          >
            Anfrage-Potenzial kostenlos prüfen
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
