import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import type { Metadata } from "next";

const title = "Google Ads für Handwerksbetriebe in Nürnberg | IXA";
const description =
  "Google Ads für Handwerker in Nürnberg: relevante Suchnachfrage, klare Landingpage und messbare Kontaktwege als gemeinsames Anfrage-System.";
const canonicalPath = "/google-ads-handwerker-nuernberg";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    url: canonicalPath,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "IXA Anfrage-System für Handwerksbetriebe in Nürnberg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function GoogleAdsHandwerkerNuernbergPage() {
  return (
    <SeoLandingPage
      canonicalPath={canonicalPath}
      eyebrow="Google Ads · Handwerk · Nürnberg"
      h1="Google Ads für Handwerksbetriebe in Nürnberg"
      intro="IXA baut für Handwerksbetriebe einen klaren Weg von der konkreten Google-Suche bis zur messbaren Kontaktanfrage. Website oder Landingpage, Anzeigen und Kontaktmessung werden dabei als ein System betrachtet."
      audienceTitle="Wann bezahlte Suche für einen Handwerksbetrieb passt"
      audienceText="Bei lokalen Handwerksleistungen zählt nicht nur Reichweite. Die gesuchte Leistung, das Einsatzgebiet, der wirtschaftliche Wert eines Auftrags und die schnelle Erreichbarkeit des Betriebs müssen zusammenpassen."
      points={[
        "Ihre Leistung wird in Nürnberg und Umgebung aktiv bei Google gesucht.",
        "Der Auftragswert trägt Werbebudget und Systemkosten wirtschaftlich mit.",
        "Sie besitzen Kapazität für zusätzliche passende Aufträge.",
        "Anrufe, WhatsApp-Nachrichten und Formulare werden zuverlässig bearbeitet.",
      ]}
      questions={[
        {
          question: "Welche Handwerksbetriebe können Google Ads nutzen?",
          answer:
            "Grundsätzlich Betriebe mit konkret gesuchten Leistungen und klarer Zielregion. Ob der Start sinnvoll ist, hängt zusätzlich von Wettbewerb, Auftragswert, Kapazität und Erreichbarkeit ab.",
        },
        {
          question: "Warum reicht eine Website allein nicht aus?",
          answer:
            "Eine Website schafft Information, Vertrauen und einen Kontaktweg. Neue Besucher entstehen dadurch nicht automatisch. Google Ads können vorhandene Suchnachfrage gezielt zur passenden Seite führen.",
        },
        {
          question: "Was wird bei Telefon und WhatsApp gemessen?",
          answer:
            "IXA erfasst die genutzten Kontaktwege getrennt. So bleibt sichtbar, ob ein Besucher anruft, WhatsApp öffnet oder ein Formular absendet.",
        },
        {
          question: "Garantiert IXA neue Aufträge?",
          answer:
            "Nein. IXA verspricht keine feste Zahl von Kunden oder Aufträgen. Gemessen werden Kontaktaktionen; ihre Qualität und der spätere Abschluss hängen auch vom Angebot und vom Betrieb ab.",
        },
      ]}
    />
  );
}
