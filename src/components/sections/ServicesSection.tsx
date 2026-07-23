import { ArrowRight, Plus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { CtaButton } from "@/components/cta";
import { getIcon } from "@/lib/icons";
import { serviceGroups, smmNote } from "@/data/site";

export function ServicesSection() {
  return (
    <section id="services" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Leistungen"
          title="Ein System – fünf Bausteine"
          description="Website, Werbung, Tracking, Sichtbarkeit und Automation aus einer Hand. Sie wählen einzelne Bausteine oder das komplette System."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceGroups.map((group, i) => {
            const Icon = getIcon(group.icon);
            const wide = group.services.length >= 3;
            return (
              <Reveal
                key={group.id}
                delay={(i % 3) * 80}
                className={wide ? "md:col-span-2 lg:col-span-1" : ""}
              >
                <article className="card-soft group flex h-full flex-col p-6 sm:p-7">
                  {/* Gruppen-Kopf */}
                  <div className="flex items-center gap-3.5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-white shadow-soft transition-colors group-hover:bg-primary">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                        {`0${i + 1}`}
                      </span>
                      <h3 className="text-lg font-bold leading-tight text-navy">
                        {group.label}
                      </h3>
                    </div>
                  </div>

                  {/* Leistungen der Gruppe */}
                  <ul className="mt-6 flex-1 space-y-4">
                    {group.services.map((service) => (
                      <li
                        key={service.title}
                        className="border-l-2 border-slate-100 pl-4 transition-colors group-hover:border-primary/40"
                      >
                        <p className="text-[15px] font-semibold text-navy">
                          {service.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {service.text}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <CtaButton
                      event="service_cta_click"
                      location={`service_${group.id}`}
                      service={group.formValue}
                      variant="outline"
                      size="default"
                      icon={<ArrowRight className="order-last size-4" />}
                      className="w-full justify-between"
                    >
                      Anfragen
                    </CtaButton>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Social Media — nur als optionale Zusatzleistung, keine eigene Säule */}
        <Reveal delay={120}>
          <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-center text-sm text-slate-600">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Plus className="size-3.5" strokeWidth={3} />
            </span>
            {smmNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
