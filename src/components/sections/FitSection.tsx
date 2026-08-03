import { Reveal } from "@/components/Reveal";
import { Check, Search, X } from "lucide-react";

const fitPoints = [
  "Ihre Kunden suchen bereits konkret nach Ihrer Leistung.",
  "Neue Aufträge beginnen meist per Telefon, WhatsApp oder Formular.",
  "Sie können neue Aufträge annehmen und Rückmeldung zum Ergebnis geben.",
];

export function FitSection() {
  return (
    <section
      aria-labelledby="fit-heading"
      className="border-b border-navy/10 bg-[#f3f1eb] py-10 sm:py-14"
    >
      <div className="container-lp">
        <Reveal>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Für wen IXA am meisten bewirkt
              </p>
              <h2
                id="fit-heading"
                className="mx-auto mt-3 max-w-2xl text-2xl font-bold leading-tight text-navy sm:text-3xl"
              >
                Für Betriebe mit echter Nachfrage – nicht für Design um des
                Designs willen.
              </h2>
            </div>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
              {fitPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3.5 shadow-soft"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success-100 text-success-700">
                    <Check
                      className="size-[18px]"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-navy">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-2 text-center text-sm leading-relaxed text-stone-600 sm:flex-row sm:gap-3">
              <span className="inline-flex items-center gap-2 font-semibold text-navy">
                <Search className="size-4 text-primary" aria-hidden="true" />
                Gute Grundlage: konkrete lokale Suchnachfrage.
              </span>
              <span
                className="hidden text-stone-300 sm:inline"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="inline-flex items-center gap-2">
                <X className="size-4 text-stamp" aria-hidden="true" />
                Nicht passend bei reiner Optik oder gewünschter Kundengarantie.
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
