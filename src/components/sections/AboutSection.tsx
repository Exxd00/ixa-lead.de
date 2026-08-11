import { BrandMark } from "@/components/BrandMark";
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
import Image from "next/image";

const promises = [
  "Sie sprechen von der Analyse bis zur Optimierung direkt mit mir.",
  "Strategie und Umsetzung werden nach dem Verkauf nicht weitergereicht.",
  "Messung, Entscheidungen und nächste Schritte bleiben transparent.",
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
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="relative aspect-[4/5] w-24 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-lg sm:w-28">
                    <Image
                      src="/people/emad-alzaim.webp"
                      alt="Emad Alzaim, persönlicher Ansprechpartner bei IXA-Leads"
                      fill
                      sizes="(max-width: 639px) 96px, 112px"
                      className="object-cover object-center"
                    />
                  </div>
                  <BrandMark
                    className="absolute -bottom-3 -right-3 size-10 rounded-xl border border-white/15 shadow-lg"
                    alt="Markenzeichen von IXA-Leads"
                    sizes="40px"
                  />
                </div>

                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-success-300 sm:text-xs sm:tracking-[0.14em]">
                  Ihr Ansprechpartner
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {siteConfig.owner}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-white/55">
                  {siteConfig.name} · {siteConfig.role}
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
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
            IXA baut messbare Anfrage-Systeme für lokale
            Dienstleistungsbetriebe in Nürnberg und Franken. Ich begleite Sie
            persönlich von der ersten Analyse bis zur Auswertung und
            Verbesserung anhand echter Daten.
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
