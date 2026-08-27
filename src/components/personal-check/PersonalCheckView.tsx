import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { ImpressumDialog } from "@/components/ImpressumDialog";
import { siteConfig } from "@/data/site";

type PersonalCheckViewProps = {
  companyLabel: string;
  preview?: boolean;
  previewReference?: string;
  whatsappHref?: string;
};

export function PersonalCheckView({
  companyLabel,
  preview = false,
  previewReference,
  whatsappHref,
}: PersonalCheckViewProps) {
  const year = new Date().getFullYear();

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        {preview && (
          <div className="border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-semibold text-amber-950 dark:border-amber-700/50 dark:bg-amber-950 dark:text-amber-100">
            Interne Vorschau · kein Kundenbesuch · WhatsApp deaktiviert
          </div>
        )}

        <header className="border-b border-border bg-background/95 text-foreground backdrop-blur-xl">
          <div className="container-lp flex h-[72px] items-center justify-between gap-4">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-3 rounded-lg"
              aria-label="Zur IXA-Leads Startseite"
            >
              <BrandMark className="size-10 shadow-soft" priority />
              <span className="leading-none">
                <span className="block text-[15px] font-extrabold tracking-tight text-foreground">
                  IXA Leads
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Persönlicher Check
                </span>
              </span>
            </Link>

            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Zur IXA Website</span>
              <span className="sm:hidden">Website</span>
            </Link>
          </div>
        </header>

        <section className="hero-wash border-b border-primary/15 py-14 sm:py-20">
          <div className="container-lp grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                <Eye className="size-4" />
                Persönlich für {companyLabel}
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
                Ein kurzer Blick von außen auf Ihren digitalen Anfrageweg.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Wir haben für {companyLabel} eine kompakte Ersteinschätzung
                vorbereitet. Keine allgemeine Werbepräsentation, sondern
                konkrete Ansatzpunkte, die wir Ihnen persönlich zeigen.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {preview ? (
                  <button
                    type="button"
                    disabled
                    className="focus-ring inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                    aria-describedby="preview-note"
                  >
                    <MessageCircle className="size-5" />
                    IXA Check per WhatsApp anfordern
                    <ArrowRight className="size-4" />
                  </button>
                ) : whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="focus-ring inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="size-5" />
                    IXA Check per WhatsApp anfordern
                    <ArrowRight className="size-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-describedby="whatsapp-unavailable-note"
                    className="focus-ring inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <MessageCircle className="size-5" />
                    IXA Check per WhatsApp anfordern
                    <ArrowRight className="size-4" />
                  </button>
                )}

                <Link
                  href="/"
                  className="focus-ring inline-flex min-h-14 items-center justify-center rounded-2xl border border-border bg-card px-6 py-3.5 text-base font-bold text-card-foreground transition-colors hover:border-primary/60 hover:bg-muted"
                >
                  Erst IXA kennenlernen
                </Link>
              </div>

              {preview && (
                <p
                  id="preview-note"
                  className="mt-3 text-xs text-muted-foreground"
                >
                  In der Vorschau wird keine WhatsApp-Nachricht geöffnet oder
                  gesendet.
                </p>
              )}
              {!preview && !whatsappHref && (
                <p
                  id="whatsapp-unavailable-note"
                  className="mt-3 text-xs text-muted-foreground"
                >
                  WhatsApp ist derzeit nicht verfügbar.
                </p>
              )}
            </div>

            <aside className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Ihr IXA Check
              </p>
              <h2 className="mt-3 text-2xl font-bold text-card-foreground">
                Was Sie erhalten
              </h2>

              <ul className="mt-6 space-y-4">
                {[
                  "Einordnung Ihres aktuellen digitalen Auftritts",
                  "Konkrete Stellen, an denen Anfragen verloren gehen können",
                  "Ein sinnvoller nächster Schritt ohne Verkaufsdruck",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-navy-700 dark:text-primary" />
                    <span className="leading-relaxed text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-2xl bg-muted p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-navy-700 dark:text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Persönlich erstellt und nur über Ihren individuellen Link
                    erreichbar.
                    {previewReference && (
                      <>
                        {" "}
                        Referenz{" "}
                        <span className="font-mono">{previewReference}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="container-lp py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-navy-700 dark:text-primary">
              Klarer nächster Schritt
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              Erst ansehen. Dann entscheiden, ob ein Gespräch sinnvoll ist.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Eine kurze Antwort genügt. Danach erhalten Sie den Check
              persönlich, ohne automatische Terminbuchung und ohne
              Verpflichtung.
            </p>
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
                Persönlicher Check · vertraulich bereitgestellt
              </p>
            </div>
          </div>

          <nav
            aria-label="Rechtliche Informationen"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
          >
            <Link
              href="/datenschutz"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Datenschutz
            </Link>
            <Link
              href="/datenloeschung"
              className="focus-ring rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              Datenlöschung
            </Link>
            <ImpressumDialog className="text-muted-foreground hover:text-foreground" />
          </nav>

          <p className="text-xs text-muted-foreground">
            © {year} {siteConfig.name}
          </p>
        </div>
      </footer>
    </>
  );
}
