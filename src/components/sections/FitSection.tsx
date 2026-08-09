import { Reveal } from "@/components/Reveal";
import { Check, Search, X } from "lucide-react";

const fitPoints = [
  "Kunden suchen aktiv bei Google nach Ihrer Leistung.",
  "Ein zusätzlicher Auftrag hat einen nachvollziehbaren wirtschaftlichen Wert.",
  "Telefon, WhatsApp oder Formular sind wichtige Kontaktwege.",
  "Ihr Betrieb besitzt aktuell Kapazität für zusätzliche Aufträge.",
  "Eingehende Anfragen können zeitnah beantwortet werden.",
  "Sie können zurückmelden, welche Anfragen relevant oder irrelevant waren.",
];

const noStartPoints = [
  "Praktisch keine aktive Google-Suchnachfrage vorhanden",
  "Aktuell keine Kapazität für zusätzliche Aufträge",
  "Bestehende Anfragen werden regelmäßig nicht beantwortet",
  "Ausschließlich ein neues Design wird gesucht",
  "Eine feste oder garantierte Zahl neuer Kunden wird erwartet",
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
                Erst prüfen, dann aufbauen
              </p>
              <h2
                id="fit-heading"
                className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-tight text-navy sm:text-4xl"
              >
                Wann ein IXA Anfrage-System sinnvoll ist
              </h2>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
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

              <section className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-stamp/10 text-stamp">
                    <X className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-navy">
                    Wann wir eher nicht starten
                  </h3>
                </div>
                <ul className="mt-5 space-y-3">
                  {noStartPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <X className="mt-1 size-4 shrink-0 text-stamp" />
                      <span className="text-sm leading-relaxed text-stone-600">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <p className="mx-auto mt-6 max-w-4xl text-center text-sm leading-relaxed text-stone-600 sm:text-base">
              Mehr Anfragen helfen wenig, wenn der eigentliche Engpass an einer
              anderen Stelle liegt. Deshalb prüfen wir zuerst, ob zusätzliche
              Nachfrage für Ihren Betrieb aktuell sinnvoll ist.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
