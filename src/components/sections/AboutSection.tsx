import { Reveal } from "@/components/Reveal";
import { CtaButton, WhatsappLink } from "@/components/cta";
import { freeCheckServiceId, siteConfig } from "@/data/site";
import {
  Check,
  Languages,
  MapPin,
  MessageCircle,
  UserRound,
} from "lucide-react";

const promises = [
  "Sie sprechen direkt mit demjenigen, der Strategie und Umsetzung verantwortet.",
  "Ich trenne Kontaktaktionen, qualifizierte Leads und Aufträge klar voneinander.",
  "Ich verspreche keine feste Kundenzahl – ich baue die Grundlage, um ehrlich zu messen und zu verbessern.",
];

export function AboutSection() {
  return (
    <section
      id="about"
      className="border-y border-navy/10 bg-[#f3f1eb] py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-navy p-7 text-white shadow-card sm:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/25 blur-[90px]"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 size-64 rounded-full bg-stamp-400/15 blur-[90px]"
            />

            <div className="relative">
              <span className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/10 font-display text-xl font-bold tracking-tight">
                EA
              </span>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-success-300">
                Ihr Ansprechpartner
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                {siteConfig.owner}
              </h2>
              <p className="mt-2 text-white/55">
                {siteConfig.name} · {siteConfig.role}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <MapPin className="size-5 text-success-300" />
                  <p className="mt-3 text-sm font-bold">Vor Ort verwurzelt</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Nürnberg & Franken
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Languages className="size-5 text-success-300" />
                  <p className="mt-3 text-sm font-bold">
                    Zweisprachig erreichbar
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Deutsch & Arabisch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <UserRound className="size-4" />
            Persönlich statt Agentur-Karussell
          </span>
          <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight text-navy sm:text-4xl">
            Ihr Projekt wird nicht nach dem Verkauf weitergereicht.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">
            Ich begleite lokale Dienstleister von der ersten Analyse bis zur
            Auswertung. Dabei zählt nicht, wie viele Seiten oder Klicks ein
            System produziert, sondern ob Kontakte nachvollziehbar sind und
            welche davon später zu Angeboten und Aufträgen werden.
          </p>

          <ul className="mt-7 space-y-4">
            {promises.map((promise) => (
              <li key={promise} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-100 text-success-700">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-stone-700 sm:text-[15px]">
                  {promise}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton
              event="check_cta_click"
              location="about"
              service={freeCheckServiceId}
              size="lg"
              className="h-auto min-h-12 whitespace-normal px-4 py-3 text-center text-sm leading-tight sm:h-12 sm:whitespace-nowrap sm:px-7 sm:py-0 sm:text-base"
            >
              Anfrage-Potenzial kostenlos prüfen
            </CtaButton>
            <WhatsappLink
              location="about"
              variant="outline"
              size="lg"
              showIcon={false}
              className="gap-2"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </WhatsappLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
