import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Vorschau: Persönlicher IXA Check",
  description: "Interne Vorschau einer persönlichen IXA-Check-Seite.",
  robots: {
    index: false,
    follow: false,
  },
};

const company = "WH Werner Hofmann";
const reference = "IXAP260826001";

export default function PersonalCheckPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f7fcfb] text-navy">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-950">
        Vorschau – dieser Besuch wird nicht als Kundenbesuch gezählt
      </div>

      <header className="border-b border-navy/10 bg-white/85 backdrop-blur-xl">
        <div className="container-lp flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-3 rounded-lg"
            aria-label="Zur IXA-Leads Startseite"
          >
            <BrandMark className="size-10 shadow-soft" priority />
            <span className="leading-none">
              <span className="block text-[15px] font-extrabold tracking-tight">
                IXA Leads
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Persönlicher Check
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 transition-colors hover:bg-white hover:text-navy"
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
            <div className="live-badge">
              <Eye className="size-4" />
              Persönlich für {company}
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Ein kurzer Blick von außen auf Ihren digitalen Anfrageweg.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 sm:text-xl">
              Wir haben für {company} eine kompakte Ersteinschätzung vorbereitet.
              Keine allgemeine Werbepräsentation, sondern konkrete Ansatzpunkte,
              die wir Ihnen persönlich zeigen.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#111414] px-6 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                aria-describedby="preview-note"
              >
                <MessageCircle className="size-5 text-primary" />
                IXA Check per WhatsApp anfordern
                <ArrowRight className="size-4" />
              </button>

              <Link
                href="/"
                className="focus-ring inline-flex min-h-14 items-center justify-center rounded-2xl border border-navy/15 bg-white px-6 py-3.5 text-base font-bold text-navy transition-colors hover:border-primary/50"
              >
                Erst IXA kennenlernen
              </Link>
            </div>

            <p id="preview-note" className="mt-3 text-xs text-stone-500">
              In der Vorschau wird keine WhatsApp-Nachricht geöffnet oder gesendet.
            </p>
          </div>

          <aside className="rounded-3xl border border-primary/25 bg-white p-6 shadow-soft sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
              Ihr IXA Check
            </p>
            <h2 className="mt-3 text-2xl font-bold">Was Sie erhalten</h2>

            <ul className="mt-6 space-y-4">
              {[
                "Einordnung Ihres aktuellen digitalen Auftritts",
                "Konkrete Stellen, an denen Anfragen verloren gehen können",
                "Ein sinnvoller nächster Schritt ohne Verkaufsdruck",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-stone-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-2xl bg-muted p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-stone-600">
                  Persönlich erstellt und nur über Ihren individuellen Link
                  erreichbar. Referenz <span className="font-mono">{reference}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="container-lp py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Klarer nächster Schritt
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Erst ansehen. Dann entscheiden, ob ein Gespräch sinnvoll ist.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">
            Eine kurze Antwort mit Ihrer Referenz genügt. Danach erhalten Sie
            den Check persönlich, ohne automatische Terminbuchung und ohne
            Verpflichtung.
          </p>
        </div>
      </section>
    </main>
  );
}
