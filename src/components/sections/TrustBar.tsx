import { BarChart3, MapPinned, UserRound } from "lucide-react";

const signals = [
  {
    icon: MapPinned,
    title: "Lokal spezialisiert",
    text: "Nürnberg, Fürth, Erlangen & Franken",
  },
  {
    icon: BarChart3,
    title: "Mehr als Formular-Tracking",
    text: "Telefon, WhatsApp und Formulare getrennt messbar",
  },
  {
    icon: UserRound,
    title: "Direkte Zusammenarbeit",
    text: "Ein Ansprechpartner von Strategie bis Auswertung",
  },
];

export function TrustBar() {
  return (
    <section className="border-b border-navy/10 bg-white" aria-label="Arbeitsweise">
      <div className="container-lp grid divide-y divide-navy/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        {signals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div
              key={signal.title}
              className="flex items-start gap-4 py-6 md:px-6 md:first:pl-0 md:last:pr-0 lg:py-7"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{signal.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-500 sm:text-sm">
                  {signal.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
