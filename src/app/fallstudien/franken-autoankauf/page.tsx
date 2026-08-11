import { MobileCtaBar } from "@/components/MobileCtaBar";
import { StructuredData } from "@/components/StructuredData";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { FrankenEvidencePost } from "@/components/case-studies/FrankenEvidencePost";
import { CtaButton } from "@/components/cta";
import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";
import { documentedCases } from "@/data/evidence";
import { freeCheckServiceId, siteConfig } from "@/data/site";
import { ArrowRight, CalendarDays, Check, FileSpreadsheet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const canonicalPath = "/fallstudien/franken-autoankauf";
const title = "211 Kontaktaktionen für Franken Autoankauf 24 | IXA";
const headline =
  "211 dokumentierte Kontaktaktionen für Franken Autoankauf 24";
const description =
  "Fallstudie mit anonymisiertem Originalnachweis: 211 dokumentierte Kontaktaktionen für Franken Autoankauf 24 – 135 Formulare, 40 Telefon und 36 WhatsApp.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "article",
    url: canonicalPath,
    title,
    description,
    publishedTime: "2026-08-11",
    modifiedTime: "2026-08-11",
    images: [
      {
        url: "/evidence/franken-lead-sheet-safe.jpg",
        width: 860,
        height: 720,
        alt: "Anonymisierter Originalnachweis der dokumentierten Kontaktaktionen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/evidence/franken-lead-sheet-safe.jpg"],
  },
};

const study =
  documentedCases.find((item) => item.id === "frankenautoankauf24") ??
  documentedCases[0];

const pageUrl = `${siteConfig.seo.url}${canonicalPath}`;
const webpageId = `${pageUrl}/#webpage`;
const articleId = `${pageUrl}/#article`;
const breadcrumbId = `${pageUrl}/#breadcrumb`;
const articleSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { "@id": `${siteConfig.seo.url}/#website` },
      breadcrumb: { "@id": breadcrumbId },
      mainEntity: { "@id": articleId },
      inLanguage: "de-DE",
    },
    {
      "@type": "Article",
      "@id": articleId,
      headline,
      description:
        "Dokumentierte Kontaktaktionen über Formular, Telefon und WhatsApp mit anonymisiertem Originalnachweis.",
      mainEntityOfPage: { "@id": webpageId },
      image: {
        "@type": "ImageObject",
        url: `${siteConfig.seo.url}/evidence/franken-lead-sheet-safe.jpg`,
        width: 860,
        height: 720,
      },
      datePublished: "2026-08-11",
      dateModified: "2026-08-11",
      inLanguage: "de-DE",
      author: {
        "@type": "Person",
        "@id": `${siteConfig.seo.url}/#emad-alzaim`,
        name: siteConfig.owner,
        url: `${siteConfig.seo.url}/#about`,
      },
      publisher: {
        "@type": ["Organization", "LocalBusiness"],
        "@id": `${siteConfig.seo.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.seo.url,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.seo.url}/brand/ixa-logo.png`,
          width: 608,
          height: 608,
        },
      },
      about: {
        "@type": "Thing",
        name: "Kontaktmessung für lokalen Fahrzeugankauf",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Startseite",
          item: siteConfig.seo.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: headline,
          item: pageUrl,
        },
      ],
    },
  ],
};

export default function FrankenAutoankaufCaseStudyPage() {
  return (
    <>
      <StructuredData data={articleSchema} />
      <Navbar />
      <main>
        <section className="hero-wash pb-16 pt-28 text-white sm:pb-20 sm:pt-32">
          <div className="container-lp">
            <nav aria-label="Breadcrumb" className="text-xs text-white/50">
              <Link href="/" className="hover:text-white">
                Startseite
              </Link>{" "}
              <span aria-hidden="true">/</span> Fallstudien
            </nav>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-success-300">
              Fallstudie · Franken Autoankauf 24
            </p>
            <h1 className="mt-4 max-w-5xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              211 dokumentierte Kontaktaktionen für Franken Autoankauf 24
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
              Dokumentiert wurden 135 Formulare, 40 Telefonkontakte und 36
              WhatsApp-Kontakte. Kontaktaktionen sind keine abgeschlossenen
              Fahrzeugankäufe oder Umsätze.
            </p>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white py-14 sm:py-16">
          <div className="container-lp grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-navy/10 bg-[#fbfaf7] p-5">
              <h2 className="text-xl font-bold text-navy">Ausgangslage</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Für den lokalen Fahrzeugankauf sollte sichtbar werden, über
                welchen Kontaktweg Interessenten tatsächlich anfragen.
              </p>
            </article>
            <article className="rounded-2xl border border-navy/10 bg-[#fbfaf7] p-5">
              <h2 className="text-xl font-bold text-navy">Umsetzung</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Website, Formular, Telefon und WhatsApp wurden als gemeinsamer
                Kontaktweg aufgebaut. Eingänge wurden im Lead-Sheet getrennt
                dokumentiert.
              </p>
            </article>
            <article className="rounded-2xl border border-navy/10 bg-[#fbfaf7] p-5">
              <h2 className="text-xl font-bold text-navy">Messzeitraum</h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-stone-600">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                Lead-Sheet: {study.period}. Separat ausgewiesene GA4-Daten
                werden nicht zu den 211 Kontaktaktionen addiert.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-[#f3f1eb] py-14 sm:py-16">
          <div className="container-lp">
            <div className="mb-8 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
                  Originalnachweis
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy">
                  Dokumentierte Kontaktaktionen
                </h2>
              </div>
            </div>
            <FrankenEvidencePost study={study} />
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="container-lp grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy">
                Kontaktaktionen ≠ qualifizierte Anfragen ≠ Aufträge.
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  "Eine Kontaktaktion ist ein dokumentierter Eingang.",
                  "Die Qualifizierung hängt von Leistung, Region und Bedarf ab.",
                  "Ein Auftrag entsteht erst nach der Entscheidung des Interessenten.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <CtaButton
              event="check_cta_click"
              location="case_franken_autoankauf"
              service={freeCheckServiceId}
              size="xl"
              icon={<ArrowRight className="order-last" />}
              className="h-auto min-h-14 whitespace-normal px-5 py-3 text-center"
            >
              Anfrage-Potenzial prüfen
            </CtaButton>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsappFloat />
      <MobileCtaBar />
    </>
  );
}
