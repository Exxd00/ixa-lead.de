import { Check, Info, Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import SpotlightCard from "@/components/SpotlightCard";
import BorderGlow from "@/components/BorderGlow";
import { cn } from "@/lib/utils";
import { packages, packagesNote } from "@/data/site";

export function PackagesSection() {
  return (
    <section
      id="packages"
      className="section-alt border-y border-stone-200/70 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Pakete"
          title="Systeme, die zu Ihrem Wachstum passen"
          description="Drei aufeinander aufbauende Systeme – vom sauberen Auftritt bis zum kontinuierlichen, automatisierten Wachstum."
        />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {packages.map((pkg, i) => {
            const cardBody = (
              <>
                {/* Hervorhebungs-Badge */}
                {pkg.badge && (
                  <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-cta">
                    <Star className="size-3.5 fill-current" />
                    {pkg.badge}
                  </span>
                )}

                <h3 className="text-xl font-bold text-navy">{pkg.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                  {pkg.tagline}
                </p>

                {/* Preis */}
                <div className="mt-5 border-b border-stone-100 pb-5">
                  <p className="text-3xl font-bold text-navy">{pkg.price}</p>
                  {pkg.retainer && (
                    <p className="mt-1 text-sm font-medium text-stamp">
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
                            ? "bg-primary/10 text-stamp"
                            : "bg-success-100 text-success-700",
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-stone-700">
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
              </>
            );

            return (
              <Reveal key={pkg.id} delay={i * 100} className="flex">
                {pkg.highlighted ? (
                  <BorderGlow
                    backgroundColor="#ffffff"
                    colors={["#5B8CFF", "#FF7043", "#1D2430"]}
                    glowColor="224 90 58"
                    borderRadius={24}
                    animated
                    className="relative flex w-full flex-col p-7 lg:-my-3 lg:scale-[1.02] sm:p-8"
                  >
                    {cardBody}
                  </BorderGlow>
                ) : (
                  <SpotlightCard
                    spotlightColor="rgba(91, 140, 255, 0.15)"
                    className="relative flex w-full flex-col rounded-3xl border border-stone-200 bg-white p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card sm:p-8"
                  >
                    {cardBody}
                  </SpotlightCard>
                )}
              </Reveal>
            );
          })}
        </div>

        {/* Empfehlung */}
        <Reveal delay={120}>
          <p className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2.5 rounded-2xl border border-primary/15 bg-primary/[0.04] px-5 py-4 text-center text-[15px] leading-relaxed text-navy">
            <Info className="size-5 shrink-0 text-stamp" />
            {packagesNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
