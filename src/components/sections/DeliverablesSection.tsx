import { Info } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { getIcon } from "@/lib/icons";
import { deliverables } from "@/data/site";

export function DeliverablesSection() {
  return (
    <section className="section-alt border-y border-slate-200/70 py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading eyebrow="Umfang" title="Was Sie erhalten" />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <Reveal key={item.text} delay={(i % 3) * 60}>
                <div className="flex h-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/30">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[15px] font-medium text-navy">
                    {item.text}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-center text-sm text-slate-500 shadow-sm">
            <Info className="size-4 shrink-0 text-primary" />
            Der genaue Umfang wird vor Projektbeginn klar definiert.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
