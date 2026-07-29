import {
  ArrowRight,
  BarChart3,
  CircleHelp,
  Link2Off,
  PhoneOff,
  Search,
  ShieldCheck,
} from "lucide-react";
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

const journey = [
  {
    icon: Search,
    title: "Gefunden werden",
  },
  {
    icon: ShieldCheck,
    title: "Vertrauen aufbauen",
  },
  {
    icon: BarChart3,
    title: "Anfrage messen",
  },
];

export function FitSection() {
  return (
    <section
      aria-labelledby="fit-heading"
      className="border-b border-navy/10 bg-[#f3f1eb] py-12 sm:py-16"
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
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stamp-50 text-stamp-500">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-navy">
                      {symptom.text}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 rounded-[1.35rem] border border-navy/10 bg-navy px-4 py-5 shadow-card sm:px-7">
              <p className="text-center text-xs font-bold uppercase tracking-[0.13em] text-white/50">
                Ein klarer Weg statt einzelner Maßnahmen
              </p>

              <ol className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-1 sm:gap-4">
                {journey.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="contents">
                      <div className="flex min-w-0 flex-col items-center text-center">
                        <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-success-300 sm:size-11">
                          <Icon
                            className="size-[18px] sm:size-5"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="mt-2 text-[11px] font-bold leading-tight text-white sm:text-sm">
                          {step.title}
                        </span>
                      </div>

                      {index < journey.length - 1 && (
                        <ArrowRight
                          className="mt-3 size-4 text-white/25 sm:mt-3.5 sm:size-5"
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
