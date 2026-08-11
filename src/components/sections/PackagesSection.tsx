import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { SectionHeading } from "@/components/section-heading";
import { ArrowRight, Check, CreditCard, Gauge } from "lucide-react";

const paymentPhases = [
  ["Projektstart", "1.500 €"],
  ["nach 30 Tagen", "500 €"],
  ["nach 60 Tagen", "500 €"],
  ["nach 90 Tagen", "500 €"],
] as const;

const optimizationServices = [
  "Suchbegriffe auswerten",
  "Anzeigen optimieren",
  "irrelevante Suchanfragen ausschließen",
  "Landingpage verbessern",
  "Kontaktmessung kontrollieren",
  "Kundenfeedback berücksichtigen",
];

export function PackagesSection() {
  return (
    <section id="packages" className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Transparente Investition"
          title="3.000 € Gesamtinvestition"
          description="Für Analyse, Aufbau, Start, erste Optimierung und gemeinsame Auswertung nach 90 Tagen. Das Google-Werbebudget ist nicht enthalten."
        />

        <Reveal className="mx-auto mt-9 max-w-6xl">
          <article
            data-floating-cta-avoid
            className="overflow-hidden rounded-[2rem] border border-primary/30 bg-navy text-white shadow-card"
          >
            <div className="grid lg:grid-cols-[.88fr_1.12fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-success-300">
                  IXA Anfrage-System – 90 Tage
                </p>
                <p className="mt-5 font-mono text-5xl font-bold tracking-[-0.06em] text-white sm:text-6xl">
                  3.000 €
                </p>
                <p className="mt-2 text-sm font-bold text-success-300">
                  zzgl. Google-Werbebudget
                </p>
                <p className="mt-6 text-sm font-semibold leading-relaxed text-white/70">
                  Das System ist für Betriebe gedacht, bei denen zusätzliche
                  Aufträge wirtschaftlich relevant sind – nicht für möglichst
                  günstige Website-Projekte.
                </p>
                <CtaButton
                  event="package_cta_click"
                  location="package_startklar"
                  service="startklar"
                  icon={<ArrowRight className="order-last size-4" />}
                  className="mt-7 h-auto min-h-12 w-full whitespace-normal bg-white px-4 py-3 text-center text-sm leading-tight text-navy shadow-none hover:bg-white/90 sm:text-base"
                >
                  Anfrage-Potenzial prüfen
                </CtaButton>
              </div>

              <div className="border-t border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-success-300/15 text-success-300">
                    <CreditCard className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Zahlung nach Projektphasen möglich
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      Gesamtpreis und Termine werden vorab vereinbart
                    </p>
                  </div>
                </div>
                <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">
                  {paymentPhases.map(([label, price], index) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 px-4 py-3.5"
                    >
                      <dt className="flex items-center gap-3 text-sm text-white/65">
                        <span className="font-mono text-xs font-bold text-success-300">
                          0{index + 1}
                        </span>
                        {label}
                      </dt>
                      <dd className="font-mono text-sm font-bold text-white">
                        {price}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-white/55">
                  Google-Werbebudget wird separat direkt an Google gezahlt.
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal className="mx-auto mt-5 max-w-6xl">
          <article className="grid gap-5 rounded-[1.5rem] border border-navy/10 bg-[#fbfaf7] p-5 sm:p-7 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-success-100 text-success-700">
                <Gauge className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-primary">
                Optional nach den ersten 90 Tagen
              </p>
              <h3 className="mt-2 text-2xl font-bold text-navy">
                IXA Anfrage-Optimierung
              </h3>
              <p className="mt-1 font-mono text-base font-bold text-navy">
                500 € / Monat
              </p>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {optimizationServices.map((service) => (
                <li key={service} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success-700"
                    strokeWidth={3}
                  />
                  <span className="text-sm leading-relaxed text-stone-700">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>

        <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-relaxed text-stone-500">
          Alle Preise sind Endpreise. Aufgrund der Kleinunternehmerregelung
          gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Leistungsumfang und
          Zahlungstermine werden vor Projektstart transparent vereinbart.
        </p>
      </div>
    </section>
  );
}
