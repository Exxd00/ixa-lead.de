import {
  ArrowRight,
  Check,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton, WhatsappLink } from "@/components/cta";

const contactMix = [
  {
    label: "Formular",
    value: 158,
    percent: 51,
    icon: FileText,
    color: "bg-primary",
  },
  {
    label: "Telefon",
    value: 102,
    percent: 33,
    icon: Phone,
    color: "bg-success-500",
  },
  {
    label: "WhatsApp",
    value: 48,
    percent: 16,
    icon: MessageCircle,
    color: "bg-stamp-400",
  },
];

export function Hero() {
  return (
    <section
      id="home"
      className="hero-wash relative isolate overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-28 lg:pt-40"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-28 -z-10 size-72 rounded-full bg-primary/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 -z-10 size-80 rounded-full bg-stamp-400/15 blur-[120px]"
      />

      <div className="container-lp grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div>
          <Reveal immediate>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-white/75 backdrop-blur">
              <MapPin className="size-3.5 text-success-300" />
              Kundengewinnung für Nürnberg & Franken
            </span>
          </Reveal>

          <Reveal immediate>
            <h1 className="mt-6 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.045em] text-white sm:text-[3.3rem] lg:text-[4.25rem]">
              Mehr messbare Anfragen.
              <span className="mt-1 block text-white/50">
                Weniger digitales Rätselraten.
              </span>
            </h1>
          </Reveal>

          <Reveal immediate>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Ich verbinde Website, lokale Sichtbarkeit, Werbung und Tracking zu
              einem System, das Anrufe, WhatsApp und Formulare wirklich
              nachvollziehbar macht.
            </p>
          </Reveal>

          <Reveal immediate>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaButton
                location="hero_primary"
                size="xl"
                icon={<ArrowRight className="order-last" />}
                className="w-full sm:w-auto"
              >
                Kostenlose Potenzialanalyse
              </CtaButton>
              <WhatsappLink
                location="hero_secondary"
                variant="light"
                size="xl"
                className="w-full border border-white/10 bg-white/10 text-white shadow-none hover:bg-white/15 sm:w-auto"
              >
                Direkt per WhatsApp
              </WhatsappLink>
            </div>
          </Reveal>

          <Reveal immediate>
            <ul className="mt-8 grid gap-3 text-sm text-white/65 sm:grid-cols-3">
              {[
                "Direkter Ansprechpartner",
                "Mobile zuerst gedacht",
                "Ehrlich dokumentierte Daten",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-400/15 text-success-300">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal immediate>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/20 blur-3xl" />
            <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-success-300">
                    Aus echten Lead-Sheets
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tracking-[-0.06em] text-white sm:text-6xl">
                    308
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    dokumentierte Kontaktaktionen
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-success-300/20 bg-success-300/10 px-3 py-1.5 text-xs font-bold text-success-200">
                  <span className="size-2 rounded-full bg-success-300" />
                  geprüft
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {contactMix.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
                          <Icon className="size-4 text-white/45" />
                          {item.label}
                        </span>
                        <span className="font-mono text-sm font-bold text-white">
                          {item.value}
                          <span className="ml-2 text-xs font-normal text-white/40">
                            {item.percent}%
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-navy-950/35 p-4">
                <p className="text-xs leading-relaxed text-white/48">
                  Quelle: vier Kunden-Lead-Sheets, Zeiträume April–Juli 2026.
                  Kontaktaktionen sind keine abgeschlossenen Aufträge und können
                  wiederholte Kontakte enthalten.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
