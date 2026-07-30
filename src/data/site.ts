export const siteConfig = {
  name: "IXA-Leads",
  owner: "Emad Alzaim",
  role: "Digitale Kundengewinnung",
  contact: {
    phoneDisplay: "+49 162 9155408",
    phoneHref: "tel:+491629155408",
    whatsappNumber: "491629155408",
    whatsappMessage:
      "Hallo IXA-Leads, ich interessiere mich für den kostenlosen Website-Check für mein Unternehmen.",
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

export const leadServiceOptions = [
  {
    id: "website-check",
    label: "Kostenloser Website-Check",
  },
  {
    id: "website-system",
    label: "IXA Website-System – 1.000 € einmalig",
  },
  {
    id: "startklar",
    label: "Startklar-Kombi – 1.500 € einmalig",
  },
  {
    id: "google-ads-setup",
    label: "Google Ads Start – 500 € einmalig",
  },
  {
    id: "betreuung",
    label: "Betreuung & Optimierung – 500 € pro Monat",
  },
  {
    id: "single-update",
    label: "Einzelne Anpassung – 50–100 €",
  },
] as const;

export type LeadServiceId = (typeof leadServiceOptions)[number]["id"];

export const freeCheckServiceId: LeadServiceId = "website-check";

export const packages = [
  {
    id: "website-system",
    eyebrow: "Einmaliger Aufbau",
    name: "IXA Website-System",
    price: "1.000 €",
    retainer: "einmalig",
    tagline:
      "Eine komplette Website inklusive Kontaktwegen, Tracking und Messung – nicht nur schönes Design.",
    highlighted: false,
    badge: "",
    features: [
      "Individuelle, mobil optimierte Website",
      "Anruf, WhatsApp und Formular klar eingebunden",
      "Tracking und Messung von Anfang an inklusive",
      "Kontaktwege übersichtlich dokumentiert",
      "Technische Veröffentlichung und Übergabe",
    ],
    cta: "Website-System anfragen",
  },
  {
    id: "startklar",
    eyebrow: "Website + Google Ads",
    name: "Startklar-Kombi",
    price: "1.500 €",
    retainer: "einmalig",
    tagline:
      "Website-System und eine startbereite Google-Ads-Kampagne aus einer Hand.",
    highlighted: true,
    badge: "Empfohlener Start",
    features: [
      "Alles aus dem IXA Website-System",
      "Eine Google-Ads-Kampagne vollständig eingerichtet",
      "Region, Suchbegriffe und Anzeigen abgestimmt",
      "Werbung mit der Kontaktmessung verbunden",
      "Startbereit übergeben; Werbebudget separat",
    ],
    cta: "Komplett starten",
  },
  {
    id: "betreuung",
    eyebrow: "Laufende Begleitung",
    name: "Betreuung & Optimierung",
    price: "500 €",
    retainer: "pro Monat",
    tagline:
      "Für Betriebe, die Website und Anzeigen nicht selbst pflegen möchten.",
    highlighted: false,
    badge: "",
    features: [
      "Website laufend pflegen",
      "Kleinere Anpassungen im vereinbarten Rahmen",
      "Google Ads regelmäßig prüfen und optimieren",
      "Kontaktwege und Messung kontrollieren",
      "Ein direkter Ansprechpartner",
    ],
    cta: "Betreuung besprechen",
  },
];

export const pricingExtras = [
  {
    id: "google-ads-setup",
    eyebrow: "Auch einzeln buchbar",
    name: "Google Ads Start",
    price: "500 € einmalig",
    description:
      "Eine Kampagne wird vollständig eingerichtet, mit der Kontaktmessung verbunden und startklar übergeben.",
    note: "Werbebudget nicht enthalten.",
    cta: "Google Ads anfragen",
  },
  {
    id: "single-update",
    eyebrow: "Flexibel nach dem Start",
    name: "Einzelne Anpassung",
    price: "50–100 € je Auftrag",
    description:
      "Für kleine Änderungen an der Website oder an Google Ads. Den genauen Preis nenne ich vor der Umsetzung.",
    note: "Sie beauftragen nur, was Sie wirklich brauchen.",
    cta: "Anpassung anfragen",
  },
];

export const faqs = [
  {
    q: "Schalten Sie Google-Ads-Kampagnen?",
    a: "Ja. Die einmalige Einrichtung kostet 500 € und ist auch in der Startklar-Kombi enthalten. Wenn ich Website und Anzeigen anschließend laufend pflegen und optimieren soll, ist das über die monatliche Betreuung möglich. Das Werbebudget zahlen Sie separat direkt an Google.",
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
