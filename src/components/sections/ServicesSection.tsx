import { ArrowRight, BarChart3, MousePointerClick, Search } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";

const stages = [
  {
    number: "01",
    icon: Search,
    title: "Gefunden werden",
    text: "Local SEO, Google Business und Google Ads bringen Sie vor Menschen, die Ihre Leistung in Ihrer Region bereits suchen.",
    points: ["Lokale Suchintention", "Google Ads", "Service- & Standortseiten"],
    note: "Bei Möbelmontage (13 von 31) und Keller Montage (6 von 11) war Organisch die größte dokumentierte Quelle.",
    service: "Local SEO & Sichtbarkeit",
  },
  {
    number: "02",
    icon: MousePointerClick,
    title: "Vertrauen & Kontakt",
    text: "Eine schnelle mobile Website beantwortet die wichtigsten Fragen und bietet den passenden Kontaktweg ohne Umwege.",
    points: [
      "Mobile Conversion",
      "Echte Beweise",
      "Anruf, WhatsApp & Formular",
    ],
    note: "49 % der dokumentierten Kontakte kamen per Telefon oder WhatsApp – nicht über ein Formular.",
    service: "Website / Landingpage",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Messen & nachfassen",
    text: "GA4, Call- und Klick-Tracking sowie Google Sheets zeigen, welcher Kanal echte Kontaktaktionen auslöst.",
    points: ["GA4 & GTM", "Lead-Sheets", "Webhook-Automation"],
    note: "So werden Werbeklicks, Kontaktaktionen und später auch qualifizierte Aufträge sauber getrennt.",
    service: "GA4 & Conversion-Tracking",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Das IXA-System"
          title="Vom Suchmoment bis zur nachverfolgbaren Anfrage"
          description="Kein Sammelsurium aus Einzelleistungen. Drei klar verbundene Stufen, die für lokale Dienstleister gemeinsam arbeiten."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Reveal key={stage.title} delay={index * 80}>
                <article className="group flex h-full flex-col rounded-[1.5rem] border border-navy/10 bg-[#fbfaf7] p-6 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-card sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-navy text-white">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-sm font-bold text-stone-300">
                      {stage.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-navy">
                    {stage.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-stone-600">
                    {stage.text}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {stage.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2.5 text-sm font-semibold text-navy"
                      >
                        <span className="size-1.5 rounded-full bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 flex-1 rounded-xl border border-navy/10 bg-white px-4 py-3 text-xs leading-relaxed text-stone-500">
                    {stage.note}
                  </p>

                  <CtaButton
                    event="service_cta_click"
                    location={`service_stage_${index + 1}`}
                    service={stage.service}
                    variant="ghost"
                    size="default"
                    icon={<ArrowRight className="order-last size-4" />}
                    className="mt-4 w-full justify-between px-1 hover:bg-transparent hover:text-primary"
                  >
                    Kostenlose Erstanalyse
                  </CtaButton>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
