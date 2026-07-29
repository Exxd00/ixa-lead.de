export const siteConfig = {
  name: "IXA-Leads",
  owner: "Emad Alzaim",
  role: "Digitale Kundengewinnung",
  contact: {
    phoneDisplay: "+49 162 9155408",
    phoneHref: "tel:+491629155408",
    whatsappNumber: "491629155408",
    whatsappMessage:
      "Hallo IXA-Leads, ich interessiere mich für eine kostenlose Erstanalyse für mein lokales Unternehmen.",
    emailDisplay: "info@ixa-leads.de",
    emailHref: "mailto:info@ixa-leads.de",
    location: "Nürnberg & Franken",
  },
  tracking: {
    enabled: false,
    gtmId: "GTM-XXXXXXX",
    ga4Id: "G-XXXXXXXXXX",
    adsConversionId: "AW-XXXXXXXXX",
    adsConversionLabel: "XXXXXXXXXXXXXXXX",
  },
  form: {
    endpoint: "/api/contact",
  },
  seo: {
    title: "IXA Leads | Messbare Anfragen für lokale Unternehmen in Nürnberg",
    description:
      "Website, Local SEO, Google Ads und Tracking als ein System: IXA Leads macht Formular-, Telefon- und WhatsApp-Kontakte für lokale Dienstleister in Nürnberg und Franken nachvollziehbar.",
    url: "https://ixa-leads.de",
  },
};

export const packages = [
  {
    id: "starter",
    name: "Starter",
    price: "ab 1.490 €",
    retainer: "",
    tagline: "Für einen sauberen, schnellen digitalen Auftritt.",
    highlighted: false,
    badge: "",
    features: [
      "Conversion-orientierte Website",
      "Google Business Profile (Grundeinrichtung)",
      "Mobil-optimiert und schnell",
      "Klare Kontaktwege: Anruf, WhatsApp, Formular",
      "Optional: digitale Speisekarte für Gastronomie",
    ],
    cta: "Kostenlose Erstanalyse",
    formValue: "Komplettes System – Starter",
  },
  {
    id: "performance",
    name: "Performance System",
    price: "ab 2.490 €",
    retainer: "",
    tagline: "Das komplette System vom Suchmoment bis zur messbaren Anfrage.",
    highlighted: true,
    badge: "Am beliebtesten",
    features: [
      "Alles aus Starter",
      "Local SEO und Service-/Städteseiten",
      "GA4 und Google Tag Manager",
      "Vollständiges Conversion-Tracking",
      "Formulare, Anrufe und WhatsApp messbar",
    ],
    cta: "Kostenlose Erstanalyse",
    formValue: "Komplettes System – Performance",
  },
  {
    id: "growth",
    name: "Growth System",
    price: "ab 3.490 €",
    retainer: "+ monatlicher Retainer 699–999 €",
    tagline: "Für kontinuierliches, messbares Wachstum.",
    highlighted: false,
    badge: "",
    features: [
      "Alles aus dem Performance System",
      "Google Ads Setup und laufende Verwaltung",
      "Lead-Automation und Webhooks",
      "Anbindung an Google Sheets",
      "Laufende Auswertung und Optimierung",
    ],
    cta: "Kostenlose Erstanalyse",
    formValue: "Komplettes System – Growth",
  },
];

export const faqs = [
  {
    q: "Schalten Sie Google-Ads-Kampagnen?",
    a: "Ja. Ich richte Google Ads ein und verwalte Kampagnen laufend – enthalten im Growth System oder als Zusatzleistung. Mein Ansatz: Anzeige, Website und Tracking greifen ineinander, damit das Budget nicht in Klicks verpufft, sondern messbare Anfragen bringt.",
  },
  {
    q: "Garantieren Sie eine bestimmte Zahl an Kunden?",
    a: "Nein. Eine feste Zahl lässt sich nicht seriös garantieren, weil das Ergebnis von Kampagne, Angebot, Markt, Wettbewerb, Reaktionszeit und weiteren Faktoren abhängt. Ich verpflichte mich zur vereinbarten Umsetzung, zu besserer Nutzererfahrung, zu getesteten Formularen und Buttons und zu sauber eingerichtetem Tracking – auf dieser Basis lässt sich ehrlich optimieren.",
  },
  {
    q: "Brauche ich eine komplette Website oder reicht eine einzelne Seite?",
    a: "Das hängt von Ihrem Ziel ab. Wer für eine konkrete Leistung wirbt, fährt oft mit einer einzelnen Landingpage besser. Wer mehrere Leistungen oder Orte abdecken will, braucht eine strukturierte Website mit Service- und Städteseiten. Ich empfehle die Lösung nach Bedarf – nicht nach Projektgröße.",
  },
  {
    q: "Kann meine bestehende Website verbessert werden, statt neu zu bauen?",
    a: "Oft ja. Wenn die vorhandene Struktur und Technik tragfähig sind, verbessere ich gezielt Geschwindigkeit, Struktur, Kontaktwege und Tracking. Ist die Basis zu schwach, ist ein Neuaufbau meist der schnellere und günstigere Weg. Ein kostenloser Check klärt das vorab.",
  },
  {
    q: "Mit welchen Branchen arbeiten Sie?",
    a: "Am besten passe ich zu lokalen Unternehmen, die über Anrufe, Formulare oder Buchungen Anfragen gewinnen – etwa Handwerk und Sanierung, Fahrzeug- und Ankaufdienste, Versicherungen und Finanzberatung, Gastronomie sowie weitere lokale Dienstleister in Nürnberg und Franken.",
  },
  {
    q: "Verbinden Sie das Formular mit meinen Systemen?",
    a: "Ja. Auf Wunsch laufen Anfragen per Webhook automatisch in Google Sheets und weitere Tools. So geht keine Anfrage im E-Mail-Postfach unter und Sie können schneller reagieren.",
  },
  {
    q: "Wie lange dauert ein Projekt?",
    a: "Das hängt von Umfang, Zahl der Seiten, Bereitschaft der Inhalte und den Tracking- und Automations-Anforderungen ab. Umfang, Schritte und Dauer werden vor Beginn klar festgelegt.",
  },
  {
    q: "Testen Sie das Tracking vor dem Launch?",
    a: "Ja. Events, Formulare und Kontakt-Buttons werden vor dem Launch so weit wie möglich getestet, damit die wichtigsten Conversions wie vereinbart funktionieren.",
  },
];

export const footerLinks = [
  { label: "Leistungen", href: "#services" },
  { label: "Pakete", href: "#packages" },
  { label: "Ablauf", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontakt", href: "#contact" },
];
