import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { SectionHeading } from "@/components/section-heading";
import {
  ArrowRight,
  Check,
  CreditCard,
  Gauge,
  Globe2,
  Info,
} from "lucide-react";

const paymentPhases = [
  ["Projektstart", "1.500 €"],
  ["nach 30 Tagen", "500 €"],
  ["nach 60 Tagen", "500 €"],
  ["nach 90 Tagen", "500 €"],
] as const;

const optimizationServices = [
  "Suchbegriffe und Kampagnenqualität auswerten",
  "irrelevante Suchanfragen ausschließen",
  "Anzeigen und Landingpage bei Bedarf verbessern",
  "Kontaktmessung und Kontaktquellen kontrollieren",
  "Kundenfeedback berücksichtigen",
  "konkrete nächste Optimierungsschritte ableiten",
  "kleinere technische Pflege im vereinbarten Rahmen",
];

export function PackagesSection() {
  return (
    <section id="packages" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Transparente Investition"
          title="Ein messbares Anfrage-System für die ersten 90 Tage."
          description="Der Preis deckt Analyse, Aufbau, Start, erste Optimierung und Abschlussauswertung ab. Das Google-Werbebudget bleibt separat und transparent."
        />

        <Reveal className="mx-auto mt-10 max-w-6xl">
          <article
            data-floating-cta-avoid
            className="overflow-hidden rounded-[2rem] border border-primary/30 bg-navy text-white shadow-card"
          >
            <div className="grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-success-300">
                  Hauptangebot
                </p>
                <h3 className="mt-3 text-3xl font-bold text-white">
                  IXA Anfrage-System – 90 Tage
                </h3>
                <div className="mt-7 border-y border-white/10 py-6">
                  <p className="font-mono text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
                    3.000 €
                  </p>
                  <p className="mt-2 text-sm font-semibold text-success-300">
                    Gesamtinvestition · Google-Werbebudget separat
                  </p>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-white/60">
                  Leistungsumfang, Gesamtpreis und Zahlungstermine werden vor
                  Projektstart transparent vereinbart. Es wird keine feste Zahl
                  von Kunden, Leads, Aufträgen oder Umsatz versprochen.
                </p>
                <CtaButton
                  event="package_cta_click"
                  location="package_startklar"
                  service="startklar"
                  icon={<ArrowRight className="order-last size-4" />}
                  className="mt-7 h-auto min-h-12 w-full whitespace-normal bg-white px-4 py-3 text-center text-sm leading-tight text-navy shadow-none hover:bg-white/90 sm:text-base"
                >
                  Anfrage-System besprechen
                </CtaButton>
              </div>

              <div className="border-t border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-success-300/15 text-success-300">
                    <CreditCard className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Zahlung nach Projektphasen
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      klar definiert und vorab vereinbart
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
                <p className="mt-5 text-xs leading-relaxed text-white/50">
                  Flexible Zahlung nach klar definierten Projektphasen möglich.
                  Das Werbebudget wird direkt an Google bezahlt und ist nicht im
                  IXA-Honorar enthalten.
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        <div className="mx-auto mt-6 grid max-w-6xl gap-5 lg:grid-cols-2">
          <Reveal>
            <article
              data-floating-cta-avoid
              className="h-full rounded-[1.5rem] border border-navy/10 bg-[#fbfaf7] p-6 sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Globe2 className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-primary">
                Sekundäres Angebot
              </p>
              <h3 className="mt-2 text-2xl font-bold text-navy">
                Website-System
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Geeignet, wenn zunächst die digitale Grundlage benötigt wird und
                ein vollständiger Kampagnenstart aktuell noch nicht sinnvoll
                ist.
              </p>
              <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-relaxed text-stone-600">
                Eine professionelle Website schafft Vertrauen und ermöglicht
                Kontakt. Sie erzeugt jedoch nicht automatisch neue Besucher.
              </p>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-navy">
                Ist bereits eine geeignete Website oder Landingpage vorhanden,
                wird nicht unnötig neu gebaut.
              </p>
              <CtaButton
                event="package_cta_click"
                location="package_website_system"
                service="website-system"
                variant="outline"
                className="mt-6 w-full"
              >
                Digitale Grundlage besprechen
              </CtaButton>
            </article>
          </Reveal>

          <Reveal delay={70}>
            <article
              data-floating-cta-avoid
              className="h-full rounded-[1.5rem] border border-navy/10 bg-[#fbfaf7] p-6 sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-success-100 text-success-700">
                <Gauge className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-primary">
                Optional nach den ersten 90 Tagen
              </p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl font-bold text-navy">
                  IXA Anfrage-Optimierung
                </h3>
                <p className="font-mono text-base font-bold text-navy">
                  500 € / Monat
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Ziel ist, anhand echter Such-, Kontakt- und Kundenfeedback-Daten
                kontinuierlich zu verbessern, welche Anfragen über das System
                entstehen.
              </p>
              <ul className="mt-5 space-y-2.5">
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
              <CtaButton
                event="package_cta_click"
                location="package_optimization"
                service="betreuung"
                variant="outline"
                className="mt-6 w-full"
              >
                Optimierung besprechen
              </CtaButton>
            </article>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-5 max-w-6xl">
          <div className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-[#fbfaf7] p-4 text-sm leading-relaxed text-stone-600">
            <Info
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              Ein einzelner Google-Ads-Start ist nur sekundär sinnvoll, wenn
              bereits eine geeignete Landingpage und verlässliche Messstruktur
              vorhanden sind. Kleinere Anpassungen für Bestandskunden erfolgen
              nach Aufwand.
            </p>
          </div>
        </Reveal>

        <p className="mx-auto mt-7 max-w-4xl text-center text-xs leading-relaxed text-stone-500">
          Alle Preise sind Endpreise. Aufgrund der Kleinunternehmerregelung
          gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Zusatzwünsche
          werden vorab vereinbart. Das Google-Werbebudget ist nicht enthalten.
          Mögliche Interessenkonflikte prüfen und besprechen wir vor
          Projektstart transparent.
        </p>
      </div>
    </section>
  );
}
