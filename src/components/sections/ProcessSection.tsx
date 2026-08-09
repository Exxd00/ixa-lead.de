import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import {
  BarChart3,
  Check,
  ChevronDown,
  Rocket,
  Search,
  Wrench,
} from "lucide-react";

const phases = [
  {
    icon: Search,
    title: "Analyse",
    intro:
      "Zuerst klären wir, ob zusätzliche Nachfrage wirtschaftlich sinnvoll genutzt werden kann.",
    items: [
      "Suchnachfrage prüfen",
      "Leistung und Suchintention verstehen",
      "Zielregion definieren",
      "Wettbewerb prüfen",
      "bestehende Website und Kontaktwege analysieren",
      "wirtschaftliche Ausgangslage und freie Kapazität einordnen",
    ],
  },
  {
    icon: Wrench,
    title: "Aufbau",
    intro:
      "Je nach Ausgangslage nutzen, verbessern oder bauen wir nur das, was das System tatsächlich braucht.",
    items: [
      "fokussierte Website oder Landingpage aufbauen beziehungsweise verbessern",
      "Angebot klar darstellen und mobil optimieren",
      "Telefon, WhatsApp und Formular integrieren",
      "Kontaktmessung einrichten",
      "Google-Ads-Struktur, relevante Keywords und Anzeigen vorbereiten",
      "offensichtlich irrelevante Suchbegriffe früh ausschließen",
    ],
  },
  {
    icon: Rocket,
    title: "Start & Optimierung",
    intro: "Nach dem Start ersetzen echte Daten Vermutungen.",
    items: [
      "Kampagne kontrolliert starten",
      "tatsächliche Suchbegriffe auswerten",
      "irrelevante Suchanfragen ausschließen",
      "Anzeigen und Landingpage verbessern",
      "Kontaktquellen und Tracking kontrollieren",
      "Kundenfeedback zur Qualität der Anfragen berücksichtigen",
    ],
  },
  {
    icon: BarChart3,
    title: "Abschlussauswertung",
    intro:
      "Nach den ersten 90 Tagen prüfen wir gemeinsam, was dokumentiert wurde und welcher nächste Schritt sinnvoll ist.",
    items: [
      "welche Quellen Kontaktaktionen erzeugt haben",
      "welche Suchbegriffe sinnvoll waren",
      "welche Kontaktwege genutzt wurden",
      "welche Anfragen laut Kundenfeedback relevant waren",
      "wo weiterer Optimierungsbedarf besteht",
      "ob laufende Betreuung sinnvoll ist",
    ],
  },
];

export function ProcessSection() {
  return (
    <section
      id="process"
      className="border-y border-navy/10 bg-[#f3f1eb] py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Die ersten 90 Tage"
          title="Vier klare Projektphasen statt einer einmaligen Übergabe."
          description="Jede Phase hat eine eigene Aufgabe. Auf dem Smartphone lassen sich die Details einzeln öffnen."
        />

        <div className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-2">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <Reveal key={phase.title} delay={index * 65}>
                <details
                  open={index === 0}
                  className="group h-full rounded-[1.5rem] border border-navy/10 bg-white shadow-soft"
                >
                  <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-[1.5rem] p-5 marker:content-none sm:p-6 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-start gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-white">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                          Phase {index + 1}
                        </span>
                        <span className="mt-1 block text-lg font-bold text-navy sm:text-xl">
                          {phase.title}
                        </span>
                      </span>
                    </span>
                    <ChevronDown className="mt-2 size-5 shrink-0 text-stone-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-stone-200 px-5 pb-6 pt-5 sm:px-6">
                    <p className="text-sm leading-relaxed text-stone-600">
                      {phase.intro}
                    </p>
                    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-success-700"
                            strokeWidth={3}
                          />
                          <span className="text-sm leading-relaxed text-stone-700">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
