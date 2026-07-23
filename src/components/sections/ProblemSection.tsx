import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { getIcon } from "@/lib/icons";
import { problems } from "@/data/site";

export function ProblemSection() {
  return (
    <section id="problem" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Wo Anfragen verloren gehen"
          title="Sie investieren in Marketing – aber die Anfragen bleiben aus?"
        />

        <Reveal
          delay={80}
          className="mx-auto mt-6 max-w-3xl space-y-4 text-center text-base leading-relaxed text-slate-600 sm:text-lg"
        >
          <p>
            Meist liegt es nicht an einer einzelnen Stellschraube, sondern an
            Lücken im Zusammenspiel: Sichtbarkeit, Website, Tracking und
            Nachverfolgung greifen nicht ineinander.
          </p>
          <p className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-navy">
            Deshalb beginne ich nicht mit der Frage »Wie wird die Seite schöner?«,
            <br className="hidden sm:block" />
            sondern mit der wichtigeren:{" "}
            <span className="font-bold text-primary">
              Wo geht auf dem Weg zur Anfrage der Kontakt verloren?
            </span>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, i) => {
            const Icon = getIcon(problem.icon);
            return (
              <Reveal key={problem.title} delay={i * 60}>
                <article className="group card-soft h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-navy">{problem.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                        {problem.text}
                      </p>
                    </div>
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
