import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImpressumDialog } from "@/components/ImpressumDialog";
import { ClientIntakeForm } from "@/components/client-intake/ClientIntakeForm";
import styles from "@/components/client-intake/client-intake.module.css";

export const metadata: Metadata = {
  title: "Website-Fragebogen | IXA Leads",
  description:
    "Neun kurze Fragen zur Vorbereitung Ihrer Website. Einfach ausfüllen und direkt an IXA senden.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: "https://ixa-leads.de/kundenfragebogen" },
  openGraph: {
    title: "Ihr Website-Fragebogen | IXA Leads",
    description: "Neun kurze Fragen für den Start Ihrer Website.",
    url: "https://ixa-leads.de/kundenfragebogen",
  },
};

export default function KundenfragebogenPage() {
  return (
    <div className={styles.page}>
      <a href="#fragebogen" className="sr-only focus:not-sr-only">
        Zum Fragebogen
      </a>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="IXA Leads - Startseite"
        >
          <BrandMark className="size-12 shrink-0" priority />
          <span>
            <span className={styles.brandName}>IXA Leads</span>
            <span className={styles.brandSub}>Ihr Website-Projekt</span>
          </span>
        </Link>
        <div className={styles.headerActions}>
          <Link className={styles.back} href="/">
            Zur Website
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="fragebogen" className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Kundenfragebogen</p>
          <h1>Ihre Website beginnt hier.</h1>
          <p className={styles.introText}>
            Erzählen Sie uns kurz von Ihrem Unternehmen und Ihren Wünschen. So
            können wir Ihre Website passend vorbereiten.
          </p>
          <span className={styles.badge}>
            <Check size={14} aria-hidden="true" /> 9 kurze Fragen · Fehlendes
            können wir gemeinsam ergänzen
          </span>
        </div>
        <ClientIntakeForm />
      </main>
      <footer className={styles.footer}>
        <a href="https://ixa-leads.de">IXA Leads · ixa-leads.de</a>
        <div className={styles.footerLinks}>
          <a href="mailto:info@ixa-leads.de">info@ixa-leads.de</a>
          <Link href="/datenschutz">Datenschutz</Link>
          <ImpressumDialog className="min-h-11" />
        </div>
      </footer>
    </div>
  );
}
