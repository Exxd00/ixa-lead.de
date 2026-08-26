import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { siteConfig } from "@/data/site";

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-700">
      <header className="border-b border-stone-200 bg-white">
        <div className="container-lp flex items-center justify-between gap-4 py-5">
          <Link
            href="/"
            className="focus-ring flex items-center gap-3 rounded-lg text-navy"
            aria-label={`${siteConfig.name} Startseite`}
          >
            <BrandMark className="size-10" />
            <span className="font-display text-lg font-bold">
              {siteConfig.name}
            </span>
          </Link>
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-navy"
          >
            <ArrowLeft className="size-4" />
            Zur Startseite
          </Link>
        </div>
      </header>

      <article className="container-lp py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            {intro}
          </p>

          <div className="mt-10 space-y-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy [&_li]:leading-7 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>

          <nav
            aria-label="Rechtliche Seiten"
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-600"
          >
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/datenloeschung">Datenlöschung</Link>
            <a href={`mailto:${siteConfig.contact.emailDisplay}`}>Kontakt</a>
          </nav>
        </div>
      </article>
    </main>
  );
}
