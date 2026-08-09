export const siteConfig = {
  name: "IXA-Leads",
  owner: "Emad Alzaim",
  role: "Digitale Kundengewinnung",
  contact: {
    phoneDisplay: "+49 162 9155408",
    phoneHref: "tel:+491629155408",
    whatsappNumber: "491629155408",
    whatsappMessage:
      "Hallo IXA-Leads, ich möchte das Anfrage-Potenzial meines Unternehmens kostenlos prüfen lassen.",
    emailDisplay: "info@ixa-leads.de",
    emailHref: "mailto:info@ixa-leads.de",
    location: "Nürnberg & Franken",
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
    title: "IXA Leads | Nachvollziehbare Anfragen für lokale Dienstleister",
    description:
      "IXA prüft, baut und optimiert messbare Anfrage-Systeme für lokale Dienstleister in Nürnberg und Franken, deren Kunden bereits aktiv bei Google suchen.",
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
    q: "Warum umfasst das IXA Anfrage-System 90 Tage?",
    a: "Die Veröffentlichung einer Website oder der Start einer Google-Ads-Kampagne ist nur der Anfang. Erst mit realen Such-, Klick-, Kontakt- und Kundenfeedback-Daten lässt sich besser beurteilen, welche Suchbegriffe, Anzeigen und Kontaktwege funktionieren. Deshalb umfasst das IXA Anfrage-System neben Analyse und Aufbau auch eine erste Optimierungsphase.",
  },
  {
    q: "Brauche ich zuerst eine Website?",
    a: "Wenn noch keine geeignete Website oder Landingpage vorhanden ist, kann sie Teil des Anfrage-Systems sein. Ist bereits eine passende Seite vorhanden, wird nicht unnötig neu gebaut. Eine Website schafft Vertrauen und ermöglicht Kontakt, erzeugt aber nicht automatisch neue Besucher.",
  },
  {
    q: "Muss ich direkt mit Google Ads starten?",
    a: "Nein. Wir prüfen zuerst die Ausgangslage. Wenn Website, Angebot, Kapazität oder Messung noch nicht bereit sind, kann es sinnvoll sein, diese Punkte zuerst zu verbessern.",
  },
  {
    q: "Was ist der Unterschied zwischen Kontaktaktion, qualifizierter Anfrage und Auftrag?",
    a: "Eine Kontaktaktion ist zunächst ein Anruf, eine WhatsApp-Nachricht oder ein Formular. Eine qualifizierte Anfrage liegt vor, wenn Bedarf, angebotene Leistung und Region grundsätzlich passen. Ein Auftrag entsteht erst, wenn sich der Interessent tatsächlich für den Betrieb entscheidet.",
  },
  {
    q: "Was passiert, wenn mein Betrieb bereits genug Anfragen erhält?",
    a: "Dann prüfen wir zuerst, ob zusätzliche Werbung überhaupt der richtige Hebel ist. Wenn bereits ausreichend Nachfrage vorhanden ist, aber zu wenige Aufträge entstehen, kann der Engpass beispielsweise bei Erreichbarkeit, Qualifizierung, Angebot, Preis oder Abschluss liegen.",
  },
  {
    q: "Wie werden Honorar und Google-Werbebudget bezahlt?",
    a: "Die Gesamtinvestition kann wie auf der Seite gezeigt auf klar definierte Projektphasen verteilt werden. Das Google-Werbebudget ist vom IXA-Honorar getrennt und wird direkt an Google bezahlt. Leistungsumfang, Gesamtpreis und Zahlungstermine werden vor Projektbeginn transparent festgelegt.",
  },
];

export const footerLinks = [
  { label: "Anfrage-System", href: "#services" },
  { label: "90 Tage", href: "#offer" },
  { label: "Investition", href: "#packages" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontakt", href: "#contact" },
];
