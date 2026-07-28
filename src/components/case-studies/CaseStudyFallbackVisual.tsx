import { Briefcase } from "lucide-react";
import type { CaseStudy } from "@/data/site";

/**
 * Markengerechte Ersatz-Kachel für Fallstudien ohne echtes Foto.
 * Rein datengetrieben, damit sie für jede Fallstudie ohne Zusatzinhalt funktioniert.
 */
export function CaseStudyFallbackVisual({ study }: { study: CaseStudy }) {
  return (
    <div className="relative flex aspect-square w-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col justify-center gap-3 bg-navy px-6 py-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
          <Briefcase className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold leading-snug text-white">
            {study.business}
          </h3>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/60">
            {study.category}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2.5 bg-success-50 px-6 py-5">
        <p className="text-lg font-bold leading-snug text-navy">
          {study.headline}
        </p>
        {study.stats && study.stats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {study.stats.map((stat) => (
              <span
                key={stat}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-success-700 shadow-sm"
              >
                {stat}
              </span>
            ))}
          </div>
        )}
      </div>

      <span className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/30 bg-navy-900/80 text-xs font-bold tracking-tight text-white backdrop-blur">
        IX
      </span>
    </div>
  );
}
