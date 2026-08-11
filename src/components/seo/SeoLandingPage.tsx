import { MobileCtaBar } from "@/components/MobileCtaBar";
import { StructuredData } from "@/components/StructuredData";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { CtaButton } from "@/components/cta";
import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";
import { freeCheckServiceId, siteConfig } from "@/data/site";
import {
  ArrowRight,
  BarChart3,
  Check,
  MapPin,
  Search,
  Target,
} from "lucide-react";
import Link from "next/link";

type Question = { question: string; answer: string };

type SeoLandingPageProps = {
  canonicalPath: string;
  eyebrow: string;
  h1: string;
  intro: string;
  audienceTitle: string;
  audienceText: string;
  points: string[];
  questions: Question[];
};

export function SeoLandingPage({
  canonicalPath,
  eyebrow,
  h1,
  intro,
  audienceTitle,
  audienceText,
  points,
  questions,
}: SeoLandingPageProps) {
  const pageUrl = `${siteConfig.seo.url}${canonicalPath}`;
  const webpageId = `${pageUrl}/#webpage`;
  const breadcrumbId = `${pageUrl}/#breadcrumb`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: h1,
        description: intro,
        inLanguage: "de-DE",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteConfig.seo.url}/#website`,
          name: siteConfig.name,
          url: siteConfig.seo.url,
        },
        publisher: { "@id": `${siteConfig.seo.url}/#organization` },
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": `${pageUrl}/#service` },
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}/#service`,
        name: h1,
        description:
          "Google Ads, passende Website oder Landingpage und Kontaktmessung als gemeinsames Anfrage-System für lokale Dienstleistungsbetriebe.",
        serviceType:
          "Google Ads und Kontaktmessung für lokale Dienstleistungsbetriebe",
        url: pageUrl,
        mainEntityOfPage: { "@id": webpageId },
        provider: {
          "@type": ["Organization", "LocalBusiness"],
          "@id": `${siteConfig.seo.url}/#organization`,
          name: siteConfig.name,
          url: siteConfig.seo.url,
          email: siteConfig.contact.emailDisplay,
          telephone: siteConfig.contact.phoneHref.replace("tel:", ""),
          address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.contact.address.street,
            postalCode: siteConfig.contact.address.postalCode,
            addressLocality: siteConfig.contact.address.city,
            addressCountry: siteConfig.contact.address.countryCode,
          },
        },
        areaServed: { "@type": "City", name: "Nürnberg" },
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
            name: h1,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}/#faq`,
        url: `${pageUrl}/#faq`,
        isPartOf: { "@id": webpageId },
        inLanguage: "de-DE",
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <StructuredData data={schema} />
      <Navbar />
      <main>
        <section className="hero-wash relative isolate overflow-hidden pb-16 pt-28 text-white sm:pb-20 sm:pt-32">
          <div className="container-lp">
            <nav aria-label="Breadcrumb" className="text-xs text-white/50">
              <Link href="/" className="hover:text-white">
                Startseite
              </Link>{" "}
              <span aria-hidden="true">/</span>{" "}
              <span>{eyebrow}</span>
            </nav>
            <p className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-success-300">
              <MapPin className="size-4" aria-hidden="true" />
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {h1}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
              {intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaButton
                event="check_cta_click"
                location={canonicalPath.slice(1)}
                service={freeCheckServiceId}
                size="xl"
                icon={<ArrowRight className="order-last" />}
                className="h-auto min-h-14 whitespace-normal px-5 py-3 text-center"
              >
                Anfrage-Potenzial prüfen
              </CtaButton>
              <a
                href="/fallstudien/franken-autoankauf"
                className="focus-ring inline-flex min-h-14 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 text-sm font-bold text-white hover:bg-white/15"
              >
                Ergebnis mit Nachweis ansehen
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white py-14 sm:py-16">
          <div className="container-lp grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Voraussetzungen vor dem Start
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
                {audienceTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                {audienceText}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-[#fbfaf7] p-4"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success-700"
                    strokeWidth={3}
                  />
                  <span className="text-sm leading-relaxed text-stone-700">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#f3f1eb] py-14 sm:py-16">
          <div className="container-lp">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Ein System statt einzelner Maßnahmen
              </p>
              <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
                Suchnachfrage, Seite und Messung müssen zusammenpassen.
              </h2>
            </div>
            <ol className="mx-auto mt-8 grid max-w-6xl gap-3 md:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Nachfrage prüfen",
                  text: "Ohne relevante Suchanfragen kann eine Kampagne keine passende Nachfrage erzeugen.",
                },
                {
                  icon: Target,
                  title: "Kontaktweg aufbauen",
                  text: "Website oder Landingpage, Anzeigen und Angebot führen zu Telefon, WhatsApp oder Formular.",
                },
                {
                  icon: BarChart3,
                  title: "Kontakte messen",
                  text: "Kontaktaktionen werden getrennt erfasst und nicht automatisch als Aufträge dargestellt.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-navy/10 bg-white p-5"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-navy text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-4 font-mono text-xs font-bold text-primary">
                      0{index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-navy">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {item.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="container-lp grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Direkte Antworten
              </p>
              <h2 className="mt-3 text-3xl font-bold text-navy">
                Wichtige Fragen vor Google Ads
              </h2>
            </div>
            <dl className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-[#fbfaf7] px-5 sm:px-7">
              {questions.map((item) => (
                <div key={item.question} className="py-5">
                  <dt className="font-bold text-navy">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="hero-wash py-14 text-white sm:py-16">
          <div className="container-lp text-center">
            <h2 className="text-3xl font-bold text-white">
              Erst prüfen. Dann investieren.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              IXA prüft Suchnachfrage, Auftragswert, Kapazität und bestehende
              Kontaktwege, bevor ein Kampagnenstart empfohlen wird.
            </p>
            <CtaButton
              event="check_cta_click"
              location={`${canonicalPath.slice(1)}_closing`}
              service={freeCheckServiceId}
              size="xl"
              className="mt-7 h-auto min-h-14 whitespace-normal px-5 py-3 text-center"
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
