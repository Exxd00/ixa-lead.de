import { Activity, Megaphone, Table2, MapPin } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CtaButton } from "@/components/cta";
import { siteConfig } from "@/data/site";

const systems = [
  { icon: Activity, label: "GA4 & Tracking" },
  { icon: Megaphone, label: "Google Ads" },
  { icon: Table2, label: "Sheets & Automation" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Marken-/Personen-Karte */}
          <Reveal className="order-1">
            <div className="relative mx-auto max-w-sm">
              <div
                aria-hidden="true"
                className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/10 via-transparent to-success-200/20 blur-2xl"
              />
              <div className="card-soft flex flex-col items-center rounded-[1.75rem] p-8 text-center">
                <span className="grid size-24 place-items-center rounded-3xl bg-navy text-3xl font-bold text-white shadow-soft">
                  {initials(siteConfig.owner)}
                </span>
                <p className="mt-5 text-lg font-bold text-navy">
                  {siteConfig.owner}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {siteConfig.name} · {siteConfig.role}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="size-4 text-primary" />
                  {siteConfig.contact.location}
                </p>

                <div className="mt-6 w-full space-y-2.5 border-t border-slate-100 pt-6">
                  {systems.map((system) => {
                    const Icon = system.icon;
                    return (
                      <div
                        key={system.label}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-2.5 text-left"
                      >
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="text-sm font-semibold text-navy">
                          {system.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Textspalte */}
          <Reveal delay={100} className="order-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Über mich
            </span>
            <h2 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">
              Über mich
            </h2>

            <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                Hinter {siteConfig.name} steht {siteConfig.owner}, mit Fokus auf
                digitale Kundengewinnung für lokale Unternehmen in Nürnberg und
                Franken.
              </p>
              <p>
                Ich bin kein großes Agentur-Team, sondern Ihr direkter
                Ansprechpartner. Statt mit Firmengröße zu werben, arbeite ich mit
                echten, laufenden Systemen: GA4 und Conversion-Tracking, Google
                Ads sowie Lead-Automation mit Google Sheets und Webhooks.
              </p>
              <p>
                Ich sehe eine Website nicht getrennt vom Marketing. Sie ist Teil
                eines Systems: von der lokalen Sichtbarkeit über die
                Nutzererfahrung bis zur messbaren, automatisch erfassten Anfrage.
              </p>
              <p className="font-semibold text-navy">
                Mein Ziel ist ein System, das Ihrem Geschäft dient – nicht nur
                eine Seite, die im Portfolio gut aussieht.
              </p>
            </div>

            <div className="mt-7">
              <CtaButton event="hero_cta_click" location="about" size="lg">
                Kontakt aufnehmen
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
