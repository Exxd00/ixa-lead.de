import { CircleHelp, Link2Off, PhoneOff } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const symptoms = [
  {
    icon: PhoneOff,
    text: "Besucher kommen – aber das Telefon bleibt still.",
  },
  {
    icon: CircleHelp,
    text: "Anfragen kommen – doch Sie wissen nicht, woher.",
  },
  {
    icon: Link2Off,
    text: "Website, Werbung und Auswertung laufen getrennt.",
  },
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
                Kommt Ihnen das bekannt vor?
              </p>
              <h2
                id="fit-heading"
                className="mx-auto mt-3 max-w-2xl text-2xl font-bold leading-tight text-navy sm:text-3xl"
              >
                Wenn Marketing da ist, aber der Weg zur Anfrage fehlt.
              </h2>
            </div>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
              {symptoms.map((symptom) => {
                const Icon = symptom.icon;
                return (
                  <li
                    key={symptom.text}
                    className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3.5 shadow-soft"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-navy">
                      {symptom.text}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-stone-600">
              Genau dort setzt IXA an: eine klare Website, sichtbare Kontaktwege
              und eine Auswertung, die Sie verstehen.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
