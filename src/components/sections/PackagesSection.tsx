import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { cn } from "@/lib/utils";
import { packages } from "@/data/site";

export function PackagesSection() {
  return (
    <section id="packages" className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Investition"
          title="Der sinnvolle Einstieg hängt von Ihrem Engpass ab"
          description="Die Pakete sind Orientierung. Nach der kostenlosen Analyse erhalten Sie einen klaren Umfang – ohne versteckte Bausteine."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 80}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-[1.5rem] border p-6 sm:p-7",
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
                    "mt-8 w-full",
                    pkg.highlighted &&
                      "bg-white text-navy shadow-none hover:bg-white/90",
                  )}
                >
                  {pkg.cta}
                </CtaButton>
              </article>
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
