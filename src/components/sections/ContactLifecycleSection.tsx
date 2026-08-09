import { Reveal } from "@/components/Reveal";
import {
  ArrowRight,
  BriefcaseBusiness,
  MessageCircle,
  UserCheck,
} from "lucide-react";

const stages = [
  {
    icon: MessageCircle,
    title: "Kontaktaktion",
    text: "Anruf, WhatsApp-Nachricht oder Formular",
  },
  {
    icon: UserCheck,
    title: "Qualifizierte Anfrage",
    text: "Leistung, Region und Bedarf passen grundsätzlich",
  },
  {
    icon: BriefcaseBusiness,
    title: "Auftrag",
    text: "Der Interessent entscheidet sich tatsächlich für den Betrieb",
  },
];

export function ContactLifecycleSection() {
  return (
    <section className="bg-navy py-14 text-white sm:py-16 lg:py-20">
      <div className="container-lp">
        <Reveal>
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-300">
              Ehrliche Auswertung
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Ein Kontakt ist noch kein Auftrag.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/65">
              Ein Anruf, eine WhatsApp-Nachricht oder ein Formular ist zunächst
              eine Kontaktaktion. IXA trennt die folgenden Stufen bewusst, damit
              aus Klicks oder Kontakten keine künstlichen Kundenzahlen werden.
            </p>

            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <li
                    key={stage.title}
                    className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-success-300/15 text-success-300">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      {index < stages.length - 1 && (
                        <ArrowRight
                          className="size-4 text-white/25"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      {stage.text}
                    </p>
                  </li>
                );
              })}
            </ol>

            <p className="mt-6 max-w-4xl text-sm leading-relaxed text-white/60">
              Wie weit die Nachverfolgung bis zum Auftrag möglich ist, hängt
              auch davon ab, welche Rückmeldungen der Betrieb zu seinen
              eingegangenen Anfragen dokumentiert.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
