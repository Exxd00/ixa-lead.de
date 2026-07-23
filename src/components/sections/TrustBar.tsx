import { Reveal } from "@/components/Reveal";
import { trustTools } from "@/data/site";

export function TrustBar() {
  return (
    <section className="border-y border-slate-200/70 bg-white/60">
      <div className="container-lp py-10 sm:py-12">
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Ein System – von der Suche bis zur messbaren Anfrage
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {trustTools.map((tool) => (
              <li key={tool}>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm">
                  <span className="size-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                  {tool}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
