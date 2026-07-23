import { ArrowRight, Check, TrendingDown, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { budgetChecklist, budgetCompare } from "@/data/site";

export function BeforeBudgetSection() {
  return (
    <section className="section-alt border-y border-slate-200/70 py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* العمود النصي + قائمة التحقق */}
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Vor mehr Budget
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight text-navy sm:text-3xl">
              Bevor Sie Ihr Anzeigenbudget erhöhen
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Mehr Budget löst das Problem nicht immer. Ist die Seite unklar,
              langsam oder wenig vertrauenswürdig, bedeutet mehr Budget oft nur mehr
              Klicks – nicht mehr Kunden.
            </p>

            <ul className="mt-7 space-y-3">
              {budgetChecklist.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-success-100 text-success-700">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* المقارنة البصرية */}
          <Reveal delay={120} className="space-y-5">
            {/* قبل */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <TrendingDown className="size-5" />
                </span>
                <h3 className="text-base font-bold text-navy">
                  {budgetCompare.before.title}
                </h3>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                {budgetCompare.before.steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                      {step}
                    </span>
                    {i < budgetCompare.before.steps.length - 1 && (
                      <ArrowRight className="hidden size-4 shrink-0 text-amber-400 sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* بعد */}
            <div className="rounded-2xl border border-success-200 bg-success-50/70 p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-success-100 text-success-700">
                  <TrendingUp className="size-5" />
                </span>
                <h3 className="text-base font-bold text-navy">
                  {budgetCompare.after.title}
                </h3>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                {budgetCompare.after.steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-lg border border-success-200 bg-white px-3 py-2 text-sm font-semibold text-navy">
                      {step}
                    </span>
                    {i < budgetCompare.after.steps.length - 1 && (
                      <ArrowRight className="hidden size-4 shrink-0 text-success-500 sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
