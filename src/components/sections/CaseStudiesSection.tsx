import { Check, Briefcase } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { caseStudies } from "@/data/site";

export function CaseStudiesSection() {
  return (
    <section id="results" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Beispiele"
          title="Projekte aus der Praxis"
          description="Ehrliche Einblicke in echte Projekte – vom Problem über die Umsetzung bis zum aktuellen Stand. Ohne aufgeblähte Zahlen."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {caseStudies.map((cs, i) => (
            <Reveal key={cs.business} delay={i * 90} className="flex">
              <article className="card-soft flex w-full flex-col p-6 sm:p-7">
                {/* Kopf: Unternehmen + Branche */}
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-white">
                    <Briefcase className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-navy">
                      {cs.business}
                    </h3>
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-primary">
                      {cs.category}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Problem
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {cs.problem}
                  </p>
                </div>

                <div className="mt-4 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Umgesetzt
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {cs.actions.map((action) => (
                      <li
                        key={action}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-success-600"
                          strokeWidth={3}
                        />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-xl border border-success-200 bg-success-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-success-700">
                    Ergebnis
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {cs.result}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
