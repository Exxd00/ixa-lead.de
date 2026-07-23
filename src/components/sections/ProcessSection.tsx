import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { getIcon } from "@/lib/icons";
import { processSteps } from "@/data/site";

export function ProcessSection() {
  return (
    <section id="process" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading eyebrow="Ablauf" title="So arbeite ich" />

        {/* الخط الزمني الأفقي — الكمبيوتر */}
        <div className="relative mt-14 hidden lg:block">
          <div
            className="absolute right-0 left-0 top-6 h-0.5 bg-gradient-to-l from-slate-200 via-slate-200 to-slate-200"
            aria-hidden="true"
          />
          <ol className="grid grid-cols-6 gap-4">
            {processSteps.map((step, i) => {
              const Icon = getIcon(step.icon);
              return (
                <Reveal key={step.title} delay={i * 90} as="li" className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 grid size-12 place-items-center rounded-full border-4 border-background bg-navy text-sm font-bold text-white shadow-soft">
                    {i + 1}
                  </span>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-3 text-[15px] font-bold text-navy">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                      {step.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>

        {/* الخط الزمني الرأسي — الهاتف */}
        <ol className="mt-12 flex flex-col lg:hidden">
          {processSteps.map((step, i) => {
            const Icon = getIcon(step.icon);
            const isLast = i === processSteps.length - 1;
            return (
              <Reveal key={step.title} delay={i * 60} as="li" className="relative flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white shadow-soft">
                    {i + 1}
                  </span>
                  {!isLast && <span className="mt-1 w-0.5 flex-1 bg-slate-200" />}
                </div>
                <div className="card-soft mb-1 flex-1 p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-base font-bold text-navy">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
