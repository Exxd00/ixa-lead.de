import { Reveal } from "@/components/Reveal";
import { Check, Search, X } from "lucide-react";

const fitPoints = [
  "Kunden suchen aktiv bei Google nach Ihrer Leistung.",
  "Ein zusätzlicher Auftrag besitzt einen relevanten wirtschaftlichen Wert.",
  "Ihr Betrieb kann zusätzliche Aufträge übernehmen.",
  "Telefon, WhatsApp oder Formulare werden zuverlässig beantwortet.",
  "Sie möchten nachvollziehen, welche Maßnahmen tatsächlich Kontaktanfragen erzeugen.",
];

export function FitSection() {
  return (
    <section
      aria-labelledby="fit-heading"
      className="border-b border-navy/10 bg-[#f3f1eb] py-14 sm:py-16 lg:py-20"
    >
      <div className="container-lp">
        <Reveal>
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Klare Voraussetzungen
              </p>
              <h2
                id="fit-heading"
                className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-tight text-navy sm:text-4xl"
              >
                Passt IXA zu Ihrem Betrieb?
              </h2>
            </div>

            <div className="mx-auto mt-8 max-w-5xl">
              <section className="rounded-[1.5rem] border border-success-700/15 bg-white p-5 shadow-soft sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-success-100 text-success-700">
                    <Search className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-navy">
                    Gute Voraussetzungen
                  </h3>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {fitPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-100 text-success-700">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed text-stone-700">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="mt-4 flex items-start gap-3 rounded-2xl border border-stone-200 bg-[#fbfaf7] p-4 text-sm leading-relaxed text-stone-600 sm:px-5">
                <X className="mt-0.5 size-4 shrink-0 text-stamp" />
                Nicht ideal, wenn Sie ausschließlich ein günstiges
                Website-Projekt suchen, aktuell keine Kapazität besitzen oder
                eine garantierte Kundenzahl erwarten.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
