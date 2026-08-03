import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { SectionHeading } from "@/components/section-heading";
import { packages, pricingExtras } from "@/data/site";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  ChevronDown,
  Megaphone,
  Wrench,
} from "lucide-react";

type Package = (typeof packages)[number];
type PricingExtra = (typeof pricingExtras)[number];

function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <article
      data-floating-cta-avoid
      className={cn(
        "relative flex h-full min-w-0 flex-col rounded-[1.5rem] border p-6 sm:p-7",
        pkg.highlighted
          ? "border-primary/35 bg-navy text-white shadow-card"
          : "border-navy/10 bg-[#fbfaf7]",
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-3">
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.13em]",
            pkg.highlighted ? "text-success-300" : "text-primary",
          )}
        >
          {pkg.eyebrow}
        </p>
        {pkg.badge && (
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
            {pkg.badge}
          </span>
        )}
      </div>

      <h3
        className={cn(
          "mt-5 text-2xl font-bold",
          pkg.highlighted ? "text-white" : "text-navy",
        )}
      >
        {pkg.name}
      </h3>
      <p
        className={cn(
          "mt-2 min-h-12 text-sm leading-relaxed",
          pkg.highlighted ? "text-white/60" : "text-stone-500",
        )}
      >
        {pkg.tagline}
      </p>

      <div
        className={cn(
          "mt-6 border-y py-5",
          pkg.highlighted ? "border-white/10" : "border-navy/10",
        )}
      >
        <p
          className={cn(
            "font-mono text-3xl font-bold tracking-[-0.04em]",
            pkg.highlighted ? "text-white" : "text-navy",
          )}
        >
          {pkg.price}
        </p>
        {pkg.retainer && (
          <p
            className={cn(
              "mt-1 text-xs font-semibold",
              pkg.highlighted ? "text-success-300" : "text-stone-500",
            )}
          >
            {pkg.retainer}
          </p>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {pkg.features.map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-3 text-sm leading-relaxed",
              pkg.highlighted ? "text-white/75" : "text-stone-700",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                pkg.highlighted
                  ? "bg-success-300/15 text-success-300"
                  : "bg-success-100 text-success-700",
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div>
        <CtaButton
          event="package_cta_click"
          location={`package_${pkg.id}`}
          service={pkg.id}
          variant={pkg.highlighted ? "default" : "outline"}
          size="lg"
          icon={<ArrowRight className="order-last size-4" />}
          className={cn(
            "mt-8 w-full px-3 text-sm sm:px-5 sm:text-base",
            pkg.highlighted &&
              "bg-white text-navy shadow-none hover:bg-white/90",
          )}
        >
          {pkg.cta}
        </CtaButton>
      </div>
    </article>
  );
}

function PricingExtraCard({
  extra,
  index,
}: {
  extra: PricingExtra;
  index: number;
}) {
  const Icon = index === 0 ? Megaphone : Wrench;

  return (
    <article
      data-floating-cta-avoid
      className="flex h-full items-start gap-4 rounded-[1.25rem] border border-navy/10 bg-[#fbfaf7] p-5 sm:p-6"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-primary">
          {extra.eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-lg font-bold text-navy">{extra.name}</h3>
          <p className="font-mono text-sm font-bold text-navy">{extra.price}</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {extra.description}
        </p>
        <p className="mt-2 text-xs font-semibold text-success-800">
          {extra.note}
        </p>
        <div>
          <CtaButton
            event="package_cta_click"
            location={`package_${extra.id}`}
            service={extra.id}
            variant="outline"
            size="default"
            icon={<ArrowRight className="order-last size-4" />}
            className="mt-5 h-auto min-h-11 self-start whitespace-normal px-4 py-2.5 text-left text-sm leading-tight"
          >
            {extra.cta}
          </CtaButton>
        </div>
      </div>
    </article>
  );
}

export function PackagesSection() {
  const recommendedPackage =
    packages.find((pkg) => pkg.highlighted) ?? packages[0];
  const alternativePackages = packages.filter(
    (pkg) => pkg.id !== recommendedPackage.id,
  );

  return (
    <section id="packages" className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Klare Preise"
          title="Ein klarer Systemstart. Danach nur, was Ihr Betrieb wirklich braucht."
          description="Das Website-System kostet 1.000 € einmalig. Mit Google-Ads-Start kostet das komplette Anfrage-System 1.500 € einmalig. Laufende Betreuung ist optional."
        />

        <Reveal className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-start gap-4 rounded-[1.25rem] border border-primary/15 bg-primary/[0.04] p-4 sm:items-center sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
              <CalendarCheck2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">
                Persönliche Umsetzung statt Massenabfertigung
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                Neue Projektstarts vergebe ich nach verfügbarer Kapazität. Den
                nächsten freien Starttermin klären wir in der kostenlosen
                Potenzialanalyse.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 lg:hidden">
          <Reveal>
            <PackageCard pkg={recommendedPackage} />
          </Reveal>

          <details className="group mt-5 rounded-[1.25rem] border border-navy/10 bg-[#fbfaf7]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.25rem] px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-bold text-navy">
                  Website-System &amp; Betreuung ansehen
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  Zwei weitere Möglichkeiten anzeigen
                </span>
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
                <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
              </span>
            </summary>

            <div className="grid gap-5 border-t border-navy/10 p-3 sm:p-5">
              {alternativePackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </details>
        </div>

        <div className="mt-12 hidden gap-5 lg:grid lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 80} className="min-w-0">
              <PackageCard pkg={pkg} />
            </Reveal>
          ))}
        </div>

        <details className="group mx-auto mt-5 max-w-5xl rounded-[1.25rem] border border-navy/10 bg-[#fbfaf7] md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.25rem] px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-bold text-navy">
                Einzelne Leistungen &amp; Anpassungen
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Google Ads oder kleine Änderungen separat ansehen
              </span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </summary>
          <div className="grid gap-4 border-t border-navy/10 p-3">
            {pricingExtras.map((extra, index) => (
              <PricingExtraCard key={extra.id} extra={extra} index={index} />
            ))}
          </div>
        </details>

        <div className="mx-auto mt-8 hidden max-w-5xl gap-4 md:grid md:grid-cols-2">
          {pricingExtras.map((extra, index) => (
            <Reveal key={extra.id} delay={index * 60}>
              <PricingExtraCard extra={extra} index={index} />
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-relaxed text-stone-500">
          Alle Preise sind Endpreise. Aufgrund der Kleinunternehmerregelung
          gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Die genannten
          Festpreise gelten für den beschriebenen Umfang; Zusatzwünsche werden
          vorab vereinbart. Das Werbebudget ist nicht enthalten und wird direkt
          an Google bezahlt.
        </p>
      </div>
    </section>
  );
}
