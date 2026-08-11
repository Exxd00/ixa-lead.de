export const siteConfig = {
  name: "IXA-Leads",
  owner: "Emad Alzaim",
  role: "Messbare Anfrage-Systeme",
  contact: {
    phoneDisplay: "+49 162 9155408",
    phoneHref: "tel:+491629155408",
    whatsappNumber: "491629155408",
    whatsappMessage:
      "Hallo IXA-Leads, ich möchte das Anfrage-Potenzial meines Unternehmens kostenlos prüfen lassen.",
    emailDisplay: "info@ixa-leads.de",
    emailHref: "mailto:info@ixa-leads.de",
    location: "Nürnberg & Franken",
    address: {
      street: "Einsteinring 12",
      postalCode: "90453",
      city: "Nürnberg",
      countryCode: "DE",
      display: "Einsteinring 12, 90453 Nürnberg",
      type: "Homeoffice",
      appointmentNote: "Termine vor Ort nur nach vorheriger Vereinbarung.",
    },
  },
  tracking: {
    enabled: Boolean(process.env.NEXT_PUBLIC_GA4_ID),
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID?.trim() ?? "",
    adsEnabled: false,
    adsConversionId: "",
    adsConversionLabel: "",
  },
  form: {
    endpoint: "/api/contact",
  },
  seo: {
    title: "IXA Anfrage-System für lokale Dienstleister | Nürnberg",
    description:
      "IXA baut messbare Anfrage-Systeme für lokale Dienstleistungsbetriebe in Nürnberg und Franken – mit Google Ads, passender Landingpage und sauberer Kontaktmessung.",
    url: "https://ixa-leads.de",
  },
};

export const leadServiceOptions = [
  {
    id: "website-check",
    label: "Kostenlose Anfrage-Potenzialanalyse",
  },
  {
    id: "startklar",
    label: "IXA Anfrage-System – 90 Tage",
  },
  {
    id: "website-system",
    label: "Website-System als digitale Grundlage",
  },
  {
    id: "betreuung",
    label: "IXA Anfrage-Optimierung – optional nach 90 Tagen",
  },
] as const;

export type LeadServiceId = (typeof leadServiceOptions)[number]["id"];

export const freeCheckServiceId: LeadServiceId = "website-check";

export const callbackService = {
  id: "callback",
  label: "Rückrufwunsch",
} as const;

export const faqs = [
  {
    q: "Wann lohnt sich Google Ads für einen lokalen Betrieb?",
    a: "Google Ads können sinnvoll sein, wenn Menschen bereits aktiv nach der angebotenen Leistung suchen, zusätzliche Aufträge einen wirtschaftlich relevanten Wert besitzen und der Betrieb freie Kapazität hat. Vor dem Start prüft IXA deshalb Suchnachfrage, Region, Wettbewerb, Website und Kontaktwege.",
  },
  {
    q: "Was kostet das IXA Anfrage-System?",
    a: "Das IXA Anfrage-System für die ersten 90 Tage kostet insgesamt 3.000 €. Das Google-Werbebudget ist nicht enthalten und wird separat direkt an Google bezahlt. Eine Zahlung nach klar vereinbarten Projektphasen ist möglich.",
  },
  {
    q: "Garantiert IXA neue Kunden?",
    a: "Nein. Eine feste Zahl neuer Kunden, Aufträge oder Umsätze lässt sich seriös nicht garantieren. IXA misst Kontaktaktionen und verbessert das Anfrage-System anhand echter Such-, Kontakt- und Kundenfeedback-Daten.",
  },
  {
    q: "Was ist der Unterschied zwischen Kontaktaktion, qualifizierter Anfrage und Auftrag?",
    a: "Eine Kontaktaktion ist zunächst ein Anruf, eine WhatsApp-Nachricht oder ein Formular. Eine qualifizierte Anfrage liegt vor, wenn Bedarf, angebotene Leistung und Region grundsätzlich passen. Ein Auftrag entsteht erst, wenn sich der Interessent tatsächlich für den Betrieb entscheidet.",
  },
  {
    q: "Warum umfasst das IXA Anfrage-System 90 Tage?",
    a: "Der Start einer Website oder Google-Ads-Kampagne ist nur der Anfang. Erst reale Suchbegriffe, Kontaktaktionen und Rückmeldungen zeigen, was verbessert werden sollte. Deshalb gehören Analyse, Aufbau, Start, Optimierung und eine gemeinsame Auswertung zum 90-Tage-System.",
  },
];

export const footerLinks = [
  { label: "Anfrage-System", href: "/#services" },
  { label: "90 Tage", href: "/#offer" },
  { label: "Google Ads Nürnberg", href: "/google-ads-nuernberg" },
  {
    label: "Google Ads für Handwerker",
    href: "/google-ads-handwerker-nuernberg",
  },
  {
    label: "Fallstudie Autoankauf",
    href: "/fallstudien/franken-autoankauf",
  },
  { label: "Kontakt", href: "/#contact" },
];
