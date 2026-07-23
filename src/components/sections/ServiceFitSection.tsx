import { Check, Minus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { serviceFit } from "@/data/site";

export function ServiceFitSection() {
  return (
    <section
      id="fit"
      className="section-alt border-y border-slate-200/70 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Passung"
          title="Für wen ich arbeite"
          description="Ehrlich, aber offen: Diese Beispiele zeigen, wo ich den größten Unterschied mache – und wo nicht."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Gute Passung */}
          <Reveal>
            <article className="h-full rounded-3xl border border-success-200 bg-success-50/50 p-7 shadow-soft sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-success-500 text-white">
                  <Check className="size-6" strokeWidth={3} />
                </span>
                <h3 className="text-xl font-bold text-navy sm:text-2xl">
                  Passt gut
                </h3>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
                {serviceFit.goodIntro}
              </p>
              <ul className="mt-5 space-y-3">
                {serviceFit.good.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-100 text-success-700">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>

          {/* Keine Passung */}
          <Reveal delay={100}>
            <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
                  <Minus className="size-6" strokeWidth={3} />
                </span>
                <h3 className="text-xl font-bold text-navy sm:text-2xl">
                  Eher nicht
                </h3>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
                {serviceFit.badIntro}
              </p>
              <ul className="mt-5 space-y-3">
                {serviceFit.bad.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <Minus className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-slate-600">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
