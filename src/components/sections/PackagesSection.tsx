import { Check, Info, Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { cn } from "@/lib/utils";
import { packages, packagesNote } from "@/data/site";

export function PackagesSection() {
  return (
    <section
      id="packages"
      className="section-alt border-y border-slate-200/70 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Pakete"
          title="Systeme, die zu Ihrem Wachstum passen"
          description="Drei aufeinander aufbauende Systeme – vom sauberen Auftritt bis zum kontinuierlichen, automatisierten Wachstum."
        />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 100} className="flex">
              <article
                className={cn(
                  "relative flex w-full flex-col rounded-3xl border bg-white p-7 transition-all sm:p-8",
                  pkg.highlighted
                    ? "border-primary/40 shadow-card lg:-my-3 lg:scale-[1.02]"
                    : "border-slate-200 shadow-soft hover:-translate-y-1 hover:shadow-card",
                )}
              >
                {/* Hervorhebungs-Badge */}
                {pkg.badge && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-cta">
                    <Star className="size-3.5 fill-current" />
                    {pkg.badge}
                  </span>
                )}

                <h3 className="text-xl font-bold text-navy">{pkg.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {pkg.tagline}
                </p>

                {/* Preis */}
                <div className="mt-5 border-b border-slate-100 pb-5">
                  <p className="text-3xl font-bold text-navy">{pkg.price}</p>
                  {pkg.retainer && (
                    <p className="mt-1 text-sm font-medium text-primary">
                      {pkg.retainer}
                    </p>
                  )}
                </div>

                {/* Leistungen */}
                <ul className="mt-6 flex-1 space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                          pkg.highlighted
                            ? "bg-primary/10 text-primary"
                            : "bg-success-100 text-success-700",
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-slate-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <CtaButton
                    event="package_cta_click"
                    location={`package_${pkg.id}`}
                    service={pkg.formValue}
                    variant={pkg.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {pkg.cta}
                  </CtaButton>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Empfehlung */}
        <Reveal delay={120}>
          <p className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2.5 rounded-2xl border border-primary/15 bg-primary/[0.04] px-5 py-4 text-center text-[15px] leading-relaxed text-navy">
            <Info className="size-5 shrink-0 text-primary" />
            {packagesNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
