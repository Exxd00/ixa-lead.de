import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { siteConfig } from "@/data/site";

export type PersonalCheckDecisionFinding = Readonly<{
  title: string;
  observation: string;
  implication: string;
  sourceLabel: string;
  verifiedAt: string;
}>;

export type PersonalCheckDecisionTest = Readonly<{
  title: string;
  description: string;
}>;

type PersonalCheckDecisionPreviewProps = {
  companyLabel: string;
  findings: readonly [
    PersonalCheckDecisionFinding,
    PersonalCheckDecisionFinding,
  ];
  firstTest: PersonalCheckDecisionTest;
  primaryRequestText: string;
  meetingRequestText: string;
  previewReference: string;
};

const deeperCheckItems = [
  "3–5 priorisierte Hinweise von der Suchnachfrage bis zur Anfragequalität",
  "Eine klare Reihenfolge: was zuerst geprüft wird und was warten kann",
  "Einen realistischen, messbaren ersten Test ohne unnötigen Umbau",
];

const responsePath = [
  {
    step: "01",
    title: "Persönlicher Brief",
    description: "Sie erhalten zwei nachvollziehbare Beobachtungen und Ihren persönlichen QR-Code.",
  },
  {
    step: "02",
    title: "QR-Seite",
    description: "Sie prüfen die Hinweise in Ruhe und entscheiden selbst, ob Sie mehr erfahren möchten.",
  },
  {
    step: "03",
    title: "Sie starten WhatsApp",
    description: "Erst Ihre selbst gesendete Nachricht bittet IXA um den vertieften Check oder ein Gespräch.",
  },
] as const;

export function PersonalCheckDecisionPreview({
  companyLabel,
  findings,
  firstTest,
  primaryRequestText,
  meetingRequestText,
  previewReference,
}: PersonalCheckDecisionPreviewProps) {
  const year = new Date().getFullYear();

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-semibold text-amber-950 dark:border-amber-700/50 dark:bg-amber-950 dark:text-amber-100">
          Interne V3-Vorschau · Page-Version v3.0 · synthetische
          Beispieldaten · alle Aktionen deaktiviert
        </div>

        <header className="border-b border-border bg-background/95 text-foreground backdrop-blur-xl">
          <div className="container-lp flex h-[72px] items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-lg">
              <BrandMark className="size-10 shadow-soft" priority />
              <span className="leading-none">
                <span className="block text-[15px] font-extrabold tracking-tight text-foreground">
                  IXA Leads
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Persönlicher Anfrageweg-Check
                </span>
              </span>
            </div>

            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              Nicht öffentlich gelistet
            </span>
          </div>
        </header>

        <section className="hero-wash border-b border-primary/15 py-14 sm:py-20">
          <div className="container-lp">
            <div className="max-w-4xl">
              <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-foreground">
                <FileCheck2 className="size-4 shrink-0" aria-hidden="true" />
                <span className="uppercase tracking-wide">
                  Kurz geprüft für
                </span>
                <span className="break-words font-bold">{companyLabel}</span>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
                Zwei konkrete Punkte, die Ihren digitalen Anfrageweg unnötig
                bremsen könnten.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Wir haben ausschließlich öffentlich sichtbare Bereiche Ihres
                Anfragewegs betrachtet. Hier sind zwei Beobachtungen und ein
                sinnvoller erster Test – kompakt, nachvollziehbar und ohne
                Verkaufspräsentation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2">
                  <ShieldCheck
                    className="size-4 text-navy-700 dark:text-primary"
                    aria-hidden="true"
                  />
                  Nur öffentlich sichtbare Inhalte
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2">
                  <FileCheck2
                    className="size-4 text-navy-700 dark:text-primary"
                    aria-hidden="true"
                  />
                  Zwei konkrete Beobachtungen
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b border-border bg-muted/35 py-10 sm:py-12"
          aria-labelledby="postal-response-path-title"
        >
          <div className="container-lp">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-navy-700 dark:text-primary">
                Sie entscheiden über den Kontakt
              </p>
              <h2
                id="postal-response-path-title"
                className="mt-3 text-3xl font-bold text-foreground"
              >
                Vom persönlichen Brief zu Ihrer eigenen WhatsApp-Anfrage
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Der Brief und diese Seite geben Ihnen zuerst den vollständigen
                Kontext. IXA schreibt Sie darüber nicht ungefragt per WhatsApp
                an. Erst wenn Sie selbst eine vorbereitete Nachricht senden,
                bitten Sie um den nächsten Schritt.
              </p>
            </div>

            <ol className="mt-8 grid gap-4 lg:grid-cols-3">
              {responsePath.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-soft"
                >
                  <p className="font-mono text-xs font-bold text-navy-700 dark:text-primary">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-card-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="container-lp py-14 sm:py-20"
          aria-labelledby="decision-findings-title"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-navy-700 dark:text-primary">
              Ersteinschätzung
            </p>
            <h2
              id="decision-findings-title"
              className="mt-3 text-3xl font-bold text-foreground sm:text-4xl"
            >
              Was uns im Anfrageweg aufgefallen ist
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground sm:text-lg">
              Die mögliche Wirkung ist bewusst vorsichtig formuliert. Ob und wie
              stark sie sich zeigt, sollte anschließend gemessen werden.
            </p>
          </div>

          <div className="mt-9 grid gap-6 lg:grid-cols-2">
            {findings.map((finding, index) => (
              <article
                key={finding.title}
                className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Beobachtung {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-card-foreground">
                      {finding.title}
                    </h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted font-mono text-sm font-bold text-foreground">
                    {index + 1}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy-700 dark:text-primary">
                    Beobachtung
                  </p>
                  <p className="mt-2 leading-relaxed text-card-foreground">
                    {finding.observation}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy-700 dark:text-primary">
                    Warum das relevant sein könnte
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {finding.implication}
                  </p>
                </div>

                <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck
                    className="size-4 shrink-0 text-navy-700 dark:text-primary"
                    aria-hidden="true"
                  />
                  {finding.sourceLabel} · geprüft am {finding.verifiedAt}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/45 py-14 sm:py-16">
          <div className="container-lp">
            <div className="grid items-start gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 lg:grid-cols-[auto_1fr]">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <FlaskConical className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-navy-700 dark:text-primary">
                  Erster sinnvoller Test
                </p>
                <h2 className="mt-3 text-3xl font-bold text-card-foreground">
                  {firstTest.title}
                </h2>
                <p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {firstTest.description}
                </p>
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-4xl text-center text-xs leading-relaxed text-muted-foreground">
              Diese Seite ist eine erste Einordnung des öffentlich sichtbaren
              Anfragewegs, kein vollständiges technisches oder rechtliches
              Audit.
            </p>
          </div>
        </section>

        <section className="container-lp py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-navy-950 p-6 text-white shadow-card sm:p-9 lg:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
            />

            <div className="relative grid gap-9 lg:grid-cols-[1fr_.82fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                  Nächster Schritt
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Was der vertiefte IXA Check ergänzt
                </h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-white/70 sm:text-lg">
                  Aus den ersten Beobachtungen entsteht eine kurze, priorisierte
                  Einordnung: Was zuerst geprüft werden sollte, was warten kann
                  und welcher Test realistisch umsetzbar ist.
                </p>

                <div className="mt-6 rounded-2xl border border-white/15 bg-black/15 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                    Der vollständige Anfrageweg
                  </p>
                  <p className="mt-2 font-semibold leading-relaxed text-white">
                    Google-Suche → passende Seite → Kontakt → qualifizierte
                    Anfrage → Angebot/Auftrag → messbares Ergebnis
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    Ziel sind nicht einfach mehr Klicks, sondern passendere
                    Anfragen und Klarheit darüber, welcher Weg zu wirtschaftlich
                    relevanten Aufträgen beitragen kann. Ergebnisse werden nicht
                    versprochen, sondern anhand eines klar begrenzten Tests
                    geprüft.
                  </p>
                </div>

                <ul className="mt-7 space-y-3">
                  {deeperCheckItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed text-white/80">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur sm:p-6">
                <button
                  type="button"
                  disabled
                  aria-describedby="primary-request-explanation decision-preview-note"
                  className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-bold text-primary-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <MessageCircle className="size-5" aria-hidden="true" />
                  Vertieften Check per WhatsApp anfordern
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>

                <div
                  id="primary-request-explanation"
                  className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                    Vorbereitete Nachricht
                  </p>
                  <blockquote className="mt-2 text-sm leading-relaxed text-white/80">
                    „{primaryRequestText}“
                  </blockquote>
                  <p className="mt-3 text-xs leading-relaxed text-white/55">
                    Im echten persönlichen Link öffnet sich WhatsApp nur mit
                    diesem Text. Gesendet wird er erst, wenn Sie dort selbst auf
                    „Senden“ tippen. Damit bitten Sie IXA ausdrücklich um eine
                    Antwort per WhatsApp.
                  </p>
                </div>

                <div className="my-5 flex items-center gap-3 text-xs text-white/45">
                  <span className="h-px flex-1 bg-white/15" />
                  oder
                  <span className="h-px flex-1 bg-white/15" />
                </div>

                <button
                  type="button"
                  disabled
                  aria-describedby="meeting-request-explanation decision-preview-note"
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/75 underline decoration-white/30 underline-offset-4 disabled:cursor-not-allowed"
                >
                  <CalendarClock className="size-4" aria-hidden="true" />
                  15-Minuten-Gespräch per WhatsApp anfragen
                </button>

                <div
                  id="meeting-request-explanation"
                  className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3.5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                    Alternative Nachricht
                  </p>
                  <blockquote className="mt-2 text-xs leading-relaxed text-white/65">
                    „{meetingRequestText}“
                  </blockquote>
                </div>

                <p
                  id="decision-preview-note"
                  className="mt-5 text-center text-xs leading-relaxed text-white/55"
                >
                  Vorschau: Es wird keine Nachricht geöffnet, kein Termin
                  gebucht und nichts gesendet. Referenz {previewReference}.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-t border-border bg-muted/35 py-12 sm:py-14"
          aria-labelledby="decision-transparency-title"
        >
          <div className="container-lp">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-navy-700 dark:text-primary">
                Transparenz und Widerspruch
              </p>
              <h2
                id="decision-transparency-title"
                className="mt-3 text-3xl font-bold text-foreground"
              >
                Sie behalten die Kontrolle über Daten und Kontakt
              </h2>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
                <h3 className="font-bold text-card-foreground">
                  Warum Sie diese Seite sehen
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Die Seite gehört zum persönlichen Brief an {companyLabel}.
                  Die zwei Hinweise beruhen ausschließlich auf den jeweils
                  genannten öffentlich sichtbaren Quellen und Prüfdaten.
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
                <h3 className="font-bold text-card-foreground">
                  Keine Werbe- oder Reichweitenmessung
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Diese Vorschau erfasst weder einen Seitenbesuch noch eine
                  Kontaktaktion. Auf einer späteren persönlichen Seite bleiben
                  Google Analytics, Google Ads und Vercel Analytics deaktiviert.
                  Dort wird einmalig nur vermerkt, dass die Seite geöffnet wurde;
                  IP-Adresse, User-Agent, Referrer und der vollständige
                  Linkschlüssel werden nicht in die Kontaktübersicht übernommen.
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
                <h3 className="font-bold text-card-foreground">
                  Kein Interesse genügt
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Eine kurze Nachricht „Nein“ genügt; dann erfolgt keine weitere
                  Ansprache zu diesem Check. Ein Widerspruch oder eine
                  Löschanfrage ist auch über {siteConfig.contact.emailDisplay}
                  möglich.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Datenschutz: ixa-leads.de/datenschutz · Datenlöschung:
                  ixa-leads.de/datenloeschung
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card text-card-foreground">
        <div className="container-lp flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="size-9" />
            <div>
              <p className="text-sm font-bold text-card-foreground">
                {siteConfig.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nicht öffentlich gelistet · individueller Link
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Datenschutz · Datenlöschung · Impressum auf ixa-leads.de
          </p>

          <p className="text-xs text-muted-foreground">
            © {year} {siteConfig.name}
          </p>
        </div>
      </footer>
    </>
  );
}
