import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { getIcon } from "@/lib/icons";
import { checks } from "@/data/site";

export function ChecksSection() {
  return (
    <section id="checks" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Kostenlose Checks"
          title="Noch nicht bereit für ein komplettes System? Starten Sie mit einem Check."
          description="Ein niedrigschwelliger Einstieg: Sie erhalten eine klare Einschätzung zu genau einem Bereich – unverbindlich."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {checks.map((check, i) => {
            const Icon = getIcon(check.icon);
            return (
              <Reveal key={check.id} delay={i * 90} className="flex">
                <article className="card-soft group flex w-full flex-col p-6 sm:p-7">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-navy">
                    {check.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">
                    {check.text}
                  </p>
                  <div className="mt-6">
                    <CtaButton
                      event="check_cta_click"
                      location={`check_${check.id}`}
                      service={check.formValue}
                      variant="outline"
                      size="default"
                      icon={<ArrowRight className="order-last size-4" />}
                      className="w-full justify-between"
                    >
                      Kostenlosen Check anfragen
                    </CtaButton>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
