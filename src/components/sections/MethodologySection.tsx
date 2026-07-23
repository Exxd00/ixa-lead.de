import { HelpCircle, Plus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { methodologyQuestions, methodologyEquation } from "@/data/site";

export function MethodologySection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Methodik"
          title="Warum ich eine Website nicht nur als Design sehe"
        />

        <div className="mx-auto mt-10 max-w-3xl">
          <Reveal>
            <p className="text-center text-base leading-relaxed text-slate-600 sm:text-lg">
              Weil Besucher nicht aus dem Nichts kommen. Sie sehen eine Anzeige,
              bilden eine Erwartung und entscheiden dann in kurzer Zeit:
            </p>
          </Reveal>

          <Reveal delay={80}>
            <ul className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              {methodologyQuestions.map((q) => (
                <li
                  key={q}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <HelpCircle className="size-5 shrink-0 text-primary" />
                  <span className="text-[15px] text-navy">{q}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* المعادلة البصرية */}
        <Reveal delay={120}>
          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-primary/15 bg-primary/[0.04] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {methodologyEquation.map((el, i) => (
                <div key={el} className="flex items-center gap-2.5 sm:gap-3">
                  <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-navy shadow-sm sm:text-base">
                    {el}
                  </span>
                  {i < methodologyEquation.length - 1 && (
                    <Plus className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-7 text-center text-base leading-relaxed text-slate-700 sm:text-lg">
              Wenn diese Elemente zusammenspielen, werden die Daten klarer – und
              Optimierung wird möglich.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
