import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { cn } from "@/lib/utils";
import { packages } from "@/data/site";

type Package = (typeof packages)[number];

function PackageCard({ pkg, index }: { pkg: Package; index: number }) {
  return (
    <article
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
          {pkg.highlighted ? "Für die meisten Betriebe" : `Paket 0${index + 1}`}
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
          <p className="mt-1 text-xs font-semibold text-success-800">
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

      <CtaButton
        event="package_cta_click"
        location={`package_${pkg.id}`}
        service={pkg.formValue}
        variant={pkg.highlighted ? "default" : "outline"}
        size="lg"
        icon={<ArrowRight className="order-last size-4" />}
        className={cn(
          "mt-8 w-full px-3 text-sm sm:px-5 sm:text-base",
          pkg.highlighted && "bg-white text-navy shadow-none hover:bg-white/90",
        )}
      >
        {pkg.cta}
      </CtaButton>
    </article>
  );
}

export function PackagesSection() {
  const recommendedPackage = packages.find((pkg) => pkg.highlighted);
  const alternativePackages = packages.filter((pkg) => !pkg.highlighted);

  return (
    <section id="packages" className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Investition"
          title="Der sinnvolle Einstieg hängt von Ihrem Engpass ab"
          description="Die Pakete sind Orientierung. Nach der kostenlosen Analyse erhalten Sie einen klaren Umfang – ohne versteckte Bausteine."
        />

        {recommendedPackage && (
          <div className="mt-10 lg:hidden">
            <Reveal>
              <PackageCard
                pkg={recommendedPackage}
                index={packages.indexOf(recommendedPackage)}
              />
            </Reveal>

            <details className="group mt-5 rounded-[1.25rem] border border-navy/10 bg-[#fbfaf7]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.25rem] px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-sm font-bold text-navy">
                    Starter &amp; Growth vergleichen
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    Zwei weitere Pakete anzeigen
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
                  <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                </span>
              </summary>

              <div className="grid gap-5 border-t border-navy/10 p-3 sm:p-5">
                {alternativePackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    index={packages.indexOf(pkg)}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        <div className="mt-12 hidden gap-5 lg:grid lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 80} className="min-w-0">
              <PackageCard pkg={pkg} index={index} />
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-relaxed text-stone-500">
          Alle Preise verstehen sich als Ausgangspunkt und werden erst nach
          Prüfung von Umfang, Technik und vorhandenen Inhalten verbindlich.
          Werbebudget ist nicht enthalten.
        </p>
      </div>
    </section>
  );
}
