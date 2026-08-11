import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import type { Metadata } from "next";

const title = "Google Ads für lokale Dienstleister in Nürnberg | IXA";
const description =
  "Google Ads in Nürnberg als messbares Anfrage-System: Suchnachfrage prüfen, Landingpage und Kontaktwege aufbauen und Kontaktaktionen nachvollziehbar messen.";
const canonicalPath = "/google-ads-nuernberg";

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
        alt: "IXA Anfrage-System für lokale Dienstleister in Nürnberg",
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

export default function GoogleAdsNuernbergPage() {
  return (
    <SeoLandingPage
      canonicalPath={canonicalPath}
      eyebrow="Google Ads · Nürnberg"
      h1="Google Ads für lokale Dienstleister in Nürnberg"
      intro="IXA verbindet vorhandene Google-Suchnachfrage mit einer passenden Website oder Landingpage und sauberer Kontaktmessung. Ziel ist kein isolierter Anzeigenstart, sondern ein nachvollziehbarer Weg bis zur Kontaktanfrage."
      audienceTitle="Wann Google Ads in Nürnberg sinnvoll sein können"
      audienceText="Entscheidend ist nicht nur das Klickbudget. Suchnachfrage, Auftragswert, freie Kapazität und ein klarer Kontaktweg bestimmen, ob zusätzliche Sichtbarkeit wirtschaftlich sinnvoll genutzt werden kann."
      points={[
        "Menschen suchen bereits konkret nach Ihrer Leistung in Nürnberg oder der Zielregion.",
        "Ein zusätzlicher Auftrag besitzt einen wirtschaftlich relevanten Wert.",
        "Ihr Betrieb kann zusätzliche Aufträge zuverlässig übernehmen.",
        "Telefon, WhatsApp oder Formular werden zeitnah beantwortet.",
      ]}
      questions={[
        {
          question: "Wann lohnt sich Google Ads für einen lokalen Betrieb?",
          answer:
            "Wenn relevante Suchnachfrage vorhanden ist, Aufträge wirtschaftlichen Wert besitzen und der Betrieb freie Kapazität hat. IXA prüft diese Punkte vor dem Start.",
        },
        {
          question: "Brauche ich dafür eine neue Website?",
          answer:
            "Nicht automatisch. Eine geeignete vorhandene Website kann verbessert werden. Nur wenn der Kontaktweg nicht ausreichend funktioniert, wird eine fokussierte Seite oder Landingpage aufgebaut.",
        },
        {
          question: "Warum ist Kontaktmessung notwendig?",
          answer:
            "Sie zeigt, ob Besucher über Telefon, WhatsApp oder Formular Kontakt aufnehmen und welche Suchbegriffe oder Anzeigen daran beteiligt waren.",
        },
        {
          question: "Sind gemessene Kontakte bereits Aufträge?",
          answer:
            "Nein. Eine Kontaktaktion ist zunächst ein Anruf, eine WhatsApp-Nachricht oder ein Formular. Ein Auftrag entsteht erst nach Qualifizierung und Entscheidung des Interessenten.",
        },
      ]}
    />
  );
}
