/* =====================================================================
   Zentrale Datendatei — IXA-Leads
   Passen Sie hier alle Texte, Kontaktdaten und Tracking-IDs an.
   ===================================================================== */

export const siteConfig = {
  /* Markenname (Text-Logo) */
  name: "IXA-Leads",
  /* Person hinter der Marke – erscheint im Abschnitt „Über mich" und im Impressum */
  owner: "Emad Alzaim",
  role: "Digitale Kundengewinnung",

  /* Kontaktdaten */
  contact: {
    /* Es gibt aktuell keine separate Festnetznummer — die mobile Nummer
       dient für Anruf und WhatsApp gleichermaßen. */
    phoneDisplay: "+49 162 9155408",
    phoneHref: "tel:+491629155408",
    whatsappNumber: "491629155408", // internationale Nummer ohne +
    whatsappMessage:
      "Hallo IXA-Leads, ich interessiere mich für eine kostenlose Erstanalyse für mein lokales Unternehmen.",
    emailDisplay: "info@ixa-leads.de",
    emailHref: "mailto:info@ixa-leads.de",
    location: "Nürnberg & Franken",
  },

  /* Link-Hub-Seite (/link): Marken-Buttons & Profile.
     Leer lassen = Button erscheint als "bald verfügbar". Echten Link eintragen,
     um den Button sofort zu aktivieren. */
  linkHub: {
    smmUrl: "", // IXA-SMM – Link eintragen, sobald die Seite/das Profil steht
    instagram: "https://www.instagram.com/ixa_agency/",
    linkedin: "", // LinkedIn-Profil-Link hier eintragen
    googleMaps: "", // Link zum Google-Business-Profil
  },

  /* Tracking-IDs — echte Werte eintragen, dann enabled = true */
  tracking: {
    enabled: false,
    gtmId: "GTM-XXXXXXX", // Google Tag Manager ID
    ga4Id: "G-XXXXXXXXXX", // GA4 Measurement ID
    adsConversionId: "AW-XXXXXXXXX", // Google Ads Conversion ID
    adsConversionLabel: "XXXXXXXXXXXXXXXX", // Google Ads Conversion Label
  },

  /* Formular-Anbindung — echter Endpoint (Next.js API-Route, Webhook-fähig).
     Für externe Dienste hier stattdessen eine Formspree-/API-URL eintragen. */
  form: {
    endpoint: "/api/contact",
  },

  /* SEO */
  seo: {
    title:
      "IXA-Leads | Digitale Kundengewinnung für lokale Unternehmen in Nürnberg",
    description:
      "IXA-Leads baut komplette Kundengewinnungs-Systeme für lokale Unternehmen in Nürnberg und Franken: Website, Google Ads, Tracking und Automation aus einer Hand.",
    url: "https://ixa-leads.de",
  },
};

export const navLinks = [
  { label: "Leistungen", href: "#services" },
  { label: "Pakete", href: "#packages" },
  { label: "Ablauf", href: "#process" },
  { label: "Beispiele", href: "#results" },
  { label: "FAQ", href: "#faq" },
  { label: "Über mich", href: "#about" },
];

/* Vertrauensleiste: die fünf Säulen des Systems */
export const trustTools = [
  "Website & Conversion",
  "Google Ads",
  "GA4 & Tracking",
  "Local SEO",
  "Automation",
];

/* Vertrauenspunkte unter den Hero-Buttons */
export const heroTrustPoints = [
  "Klare Systeme statt leerer Versprechen.",
  "Fokus auf mobile Nutzer und Ladezeit.",
  "Nur echte Anfragen zählen als Conversion.",
];

/* Karten der Reise in der Hero-Visualisierung */
export const heroJourney = [
  { label: "Suche & Anzeige", note: "Lokale Sichtbarkeit" },
  { label: "Website", note: "Klarheit & Vertrauen" },
  { label: "Anruf, WhatsApp oder Formular", note: "Kontaktschritt" },
  { label: "Messbare Anfrage", note: "Automatisch erfasst" },
];

export const heroChips = [
  "Website",
  "Local SEO",
  "Google Ads",
  "GA4",
  "Automation",
];

/* Problem-Abschnitt: 9 Karten (Website + Sichtbarkeit + Automation) */
export const problems = [
  {
    icon: "eye-off",
    title: "Unklares Angebot",
    text: "Besucher verstehen nicht sofort, was Sie anbieten und warum es zu ihnen passt.",
  },
  {
    icon: "smartphone",
    title: "Schwache mobile Erfahrung",
    text: "Die Seite ist langsam oder umständlich – gerade auf dem Gerät, von dem die meisten Besucher kommen.",
  },
  {
    icon: "map-pin",
    title: "Keine lokale Sichtbarkeit",
    text: "In der lokalen Google-Suche tauchen Sie kaum auf – Kunden finden zuerst die Konkurrenz.",
  },
  {
    icon: "building",
    title: "Unvollständiges Google-Profil",
    text: "Ihr Google-Unternehmensprofil ist leer oder veraltet – ein wichtiger Vertrauens- und Sichtbarkeitspunkt fehlt.",
  },
  {
    icon: "mouse-pointer-click",
    title: "Unklare Handlungsaufforderung",
    text: "Der Besucher weiß nicht, ob er anrufen, ein Formular senden oder weiterklicken soll.",
  },
  {
    icon: "workflow",
    title: "Anfragen ohne Nachverfolgung",
    text: "Das Formular ist mit keinem System verbunden – Anfragen landen im Postfach und gehen unter oder werden zu spät bearbeitet.",
  },
  {
    icon: "unlink",
    title: "Anzeige und Seite passen nicht",
    text: "Der Besucher klickt auf ein Versprechen und findet danach eine andere Botschaft.",
  },
  {
    icon: "clipboard-x",
    title: "Formular mit Absprüngen",
    text: "Zu viele Felder – oder das Formular funktioniert nicht zuverlässig.",
  },
  {
    icon: "line-chart",
    title: "Irreführende Conversions",
    text: "In Google Ads erscheinen Zahlen, die oft nur Klicks abbilden – keine echten Anfragen.",
  },
];

/* Abschnitt Schnellprüfung */
export const diagnosisItems = [
  "Sie erhalten Klicks oder Besuche, aber nur wenige Anfragen.",
  "Sie wissen nicht, ob die erfassten Conversions echt sind.",
  "In der lokalen Suche sind Sie schwer zu finden.",
  "Ihr Google-Unternehmensprofil ist unvollständig oder veraltet.",
  "Die mobile Nutzung Ihrer Seite ist schwach.",
  "Anzeige und Seite passen nicht klar zusammen.",
  "Anfragen werden nirgendwo automatisch erfasst oder weitergeleitet.",
  "Sie denken über mehr Budget nach, sind beim System aber unsicher.",
];

/* =====================================================================
   Leistungen — 8 Leistungen in 5 Gruppen (End-to-End-System)
   ===================================================================== */
export const serviceGroups = [
  {
    id: "website",
    icon: "layout-template",
    label: "Website & Conversion",
    formValue: "Website / Landingpage",
    services: [
      {
        title: "Conversion-Websites",
        text: "Schnelle, klare Websites, die Besucher zur passenden Leistung führen und den Kontakt leicht machen.",
      },
      {
        title: "Landingpages für Kampagnen",
        text: "Eine Seite, ein Angebot, ein Ziel – abgestimmt auf Anzeige und Suchintention.",
      },
    ],
  },
  {
    id: "werbung",
    icon: "megaphone",
    label: "Werbung",
    formValue: "Google Ads",
    services: [
      {
        title: "Google Ads Setup & Verwaltung",
        text: "Sauberes Kampagnen-Setup und laufende monatliche Betreuung – abgestimmt auf Seite und Tracking.",
      },
    ],
  },
  {
    id: "tracking",
    icon: "activity",
    label: "Tracking",
    formValue: "GA4 & Conversion-Tracking",
    services: [
      {
        title: "GA4, GTM & Conversion-Tracking",
        text: "Google Analytics 4 und Google Tag Manager mit echtem Conversion-Tracking: Formulare, Anrufe, WhatsApp und Buchungen.",
      },
    ],
  },
  {
    id: "sichtbarkeit",
    icon: "map-pinned",
    label: "Sichtbarkeit",
    formValue: "Local SEO & Sichtbarkeit",
    services: [
      {
        title: "Local SEO & Service-/Städteseiten",
        text: "Gezielte Seiten je Leistung und Ort, damit Sie lokal gefunden werden.",
      },
      {
        title: "SEO/AEO-Content-Struktur",
        text: "Inhalte so strukturiert, dass sie in Suche und KI-Antworten verständlich sind.",
      },
      {
        title: "Google Business Profile",
        text: "Vollständiges, gepflegtes Unternehmensprofil als Vertrauens- und Sichtbarkeitsanker.",
      },
    ],
  },
  {
    id: "automation",
    icon: "workflow",
    label: "Automation",
    formValue: "Lead-Automation & Google Sheets",
    services: [
      {
        title: "Lead-Automation & Google Sheets",
        text: "Formular-Anfragen laufen per Webhook automatisch in Google Sheets und Ihre Systeme – nichts geht mehr unter.",
      },
    ],
  },
];

/* Social Media wird bewusst nur als optionale Zusatzleistung genannt – keine eigene Säule. */
export const smmNote =
  "Social-Media-Betreuung biete ich auf Wunsch als optionale Zusatzleistung an – kein Schwerpunkt, aber möglich, wenn es zu Ihrem System passt.";

/* =====================================================================
   Pakete — 3 Systeme, aufsteigend (mittleres hervorgehoben)
   ===================================================================== */
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
    cta: "Starter anfragen",
    formValue: "Komplettes System – Starter",
  },
  {
    id: "performance",
    name: "Performance System",
    price: "ab 2.490 €",
    retainer: "",
    tagline: "Das komplette System vom Klick bis zum Kunden.",
    highlighted: true,
    badge: "Am beliebtesten",
    features: [
      "Alles aus Starter",
      "Local SEO und Service-/Städteseiten",
      "GA4 und Google Tag Manager",
      "Vollständiges Conversion-Tracking",
      "Formulare, Anrufe und WhatsApp messbar",
    ],
    cta: "Performance System anfragen",
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
    cta: "Growth System anfragen",
    formValue: "Komplettes System – Growth",
  },
];

export const packagesNote =
  "Unsicher, welches System passt? Die meisten lokalen Unternehmen starten mit dem Performance System.";

/* =====================================================================
   Einzel-Checks — niedrigschwelliger Einstieg
   ===================================================================== */
export const checks = [
  {
    id: "website-check",
    icon: "gauge",
    title: "Website-Check",
    text: "Ladezeit, mobile Darstellung und Struktur Ihrer aktuellen Seite.",
    formValue: "Website-Check",
  },
  {
    id: "ads-check",
    icon: "megaphone",
    title: "Google-Ads-Check",
    text: "Wird Ihr Budget richtig eingesetzt – oder verpufft ein Teil davon?",
    formValue: "Google-Ads-Check",
  },
  {
    id: "tracking-check",
    icon: "activity",
    title: "Tracking-Check",
    text: "Sind Ihre Conversions echt – oder zählen Sie in Wahrheit nur Klicks?",
    formValue: "Tracking-Check",
  },
];

/* Abschnitt vor mehr Budget */
export const budgetChecklist = [
  "Die Anzeige führt zur passenden Seite.",
  "Die Seite trifft die Suchintention.",
  "Das Angebot ist in Sekunden klar.",
  "Sie sind lokal überhaupt sichtbar.",
  "Kontakt-Buttons funktionieren.",
  "Das Tracking erfasst die richtigen Conversions.",
  "Anfragen werden automatisch erfasst und nachverfolgt.",
];

export const budgetCompare = {
  before: {
    title: "Vorher",
    steps: ["Viele Klicks", "Unklare Daten", "Wenige Anfragen"],
  },
  after: {
    title: "Mit vorbereitetem System",
    steps: ["Sichtbar & klar", "Passende Seite", "Messbarer Kontakt"],
  },
};

/* Abschnitt Ablauf: 6 Schritte (End-to-End) */
export const processSteps = [
  {
    icon: "target",
    title: "Ziele & Geschäft verstehen",
    text: "Ich lerne Leistung, Zielgruppe und Region kennen – und was Kunden vor der Anfrage suchen.",
  },
  {
    icon: "route",
    title: "System planen",
    text: "Website, Sichtbarkeit, Werbung und Tracking werden als ein zusammenhängender Weg geplant.",
  },
  {
    icon: "wrench",
    title: "Website & Seiten bauen",
    text: "Ich baue eine schnelle, klare Website oder Landingpage mit einfachen Kontaktwegen.",
  },
  {
    icon: "search",
    title: "Sichtbarkeit aufsetzen",
    text: "Local SEO, Service-/Städteseiten und Google Business Profile machen Sie lokal auffindbar.",
  },
  {
    icon: "activity",
    title: "Tracking & Automation",
    text: "GA4, Conversion-Tracking und Lead-Automation verbinden jede Anfrage mit Ihren Systemen.",
  },
  {
    icon: "refresh-cw",
    title: "Auswerten & optimieren",
    text: "Mit echten Daten sehen wir, was funktioniert, und leiten die nächsten Schritte ab.",
  },
];

/* Abschnitt Leistungsumfang */
export const deliverables = [
  { icon: "layout-template", text: "Conversion-Website oder Landingpage" },
  { icon: "smartphone", text: "Mobil-optimiert und schnell" },
  { icon: "map-pinned", text: "Local SEO und Städteseiten" },
  { icon: "building", text: "Google Business Profile" },
  { icon: "activity", text: "GA4-Einrichtung" },
  { icon: "tag", text: "Google Tag Manager" },
  { icon: "link", text: "Conversion-Tracking (Formular, Anruf, WhatsApp)" },
  { icon: "megaphone", text: "Google Ads (optional / Growth)" },
  { icon: "workflow", text: "Lead-Automation und Webhooks" },
  { icon: "table", text: "Anbindung an Google Sheets" },
  { icon: "phone-call", text: "Klare Anruf- und WhatsApp-Buttons" },
  { icon: "trending-up", text: "Auswertung und Empfehlungen" },
];

/* =====================================================================
   Beispiele — echte Projekte, ehrliche Formulierung.
   Ergebnisse basieren auf frühen/aufbauenden Daten und werden bewusst nicht
   überhöht. Exakte Zahlen werden später manuell ergänzt.
   ===================================================================== */
export const caseStudies = [
  {
    business: "Franken Autoankauf",
    category: "Fahrzeugankauf",
    problem:
      "Anfragen kamen unregelmäßig, und es war nicht nachvollziehbar, welcher Kanal sie ausgelöst hat.",
    actions: [
      "Conversion-orientierte Website aufgebaut",
      "Anruf- und WhatsApp-Buttons klar platziert",
      "GA4 und Conversion-Tracking eingerichtet",
      "Herkunft der Anfragen messbar gemacht",
    ],
    result:
      "Erste messbare Anfragen über einen klaren, nachvollziehbaren Kanal. Noch in der Aufbauphase – die Zahlen werden laufend dokumentiert.",
  },
  {
    business: "Rohrreinigung Kraft",
    category: "Handwerk / Notdienst",
    problem:
      "Die alte Seite war auf dem Handy langsam und der Weg zum Anruf war unklar – gerade im Notdienst entscheidend.",
    actions: [
      "Schnelle, mobil-optimierte Landingpage",
      "Notdienst-Angebot in den Vordergrund gestellt",
      "Ein-Klick-Anruf prominent eingebaut",
      "Local SEO für die Region strukturiert",
      "Anruf-Tracking eingerichtet",
    ],
    result:
      "Deutlich klarerer Weg zum Anruf auf dem Handy. Frühe Ergebnisse sind vielversprechend und werden ehrlich weiter beobachtet.",
  },
  {
    business: "Keller Montage",
    category: "Montage & Renovierung",
    problem:
      "Viele Klicks, aber kaum verwertbare Anfragen – und keine Verbindung zwischen Formular und Nachverfolgung.",
    actions: [
      "Angebot und Leistungen klar strukturiert",
      "Formular vereinfacht und mit Google Sheets verbunden",
      "Lead-Automation per Webhook aufgesetzt",
      "GA4 und Conversion-Tracking eingerichtet",
    ],
    result:
      "Anfragen landen jetzt automatisch und nachvollziehbar im System – ein früher, aber solider Startpunkt für weiteres Wachstum.",
  },
];

/* Abschnitt Transparenz */
export const transparencyFactors = [
  "Qualität der Kampagne",
  "Keywords und Suchintention",
  "Angebot und Preis",
  "Wettbewerb vor Ort",
  "Ruf des Unternehmens",
  "Reaktionsgeschwindigkeit",
  "Können des Vertriebs",
  "Qualität der Leistung selbst",
];

/* =====================================================================
   Für wen ich arbeite — offen formuliert (Beispiele, keine feste Liste)
   ===================================================================== */
export const serviceFit = {
  goodIntro:
    "Lokale Dienstleister und Handwerksbetriebe, die messbare Anfragen brauchen – zum Beispiel:",
  good: [
    "Handwerk & Sanierung (Rohrreinigung, Montage, Renovierung)",
    "Fahrzeug- und Ankaufdienste",
    "Versicherungen & Finanzberatung",
    "Gastronomie (Website & digitale Speisekarte)",
    "weitere lokale Dienstleistungen mit Terminen oder Anfragen",
  ],
  badIntro: "Nicht die richtige Wahl, wenn Sie suchen:",
  bad: [
    "einen großen Online-Shop oder eine bundesweite Verkaufsplattform",
    "rein künstlerisches Branding ohne klares Geschäftsziel",
  ],
};

/* Abschnitt Methodik: Fragen des Besuchers */
export const methodologyQuestions = [
  "Passt diese Leistung zu mir?",
  "Kann ich diesem Unternehmen vertrauen?",
  "Ist das Angebot klar?",
  "Ist der Kontakt einfach?",
  "Bleibe ich – oder gehe ich zurück zur Suche?",
];

export const methodologyEquation = [
  "Sichtbarkeit",
  "Website",
  "Botschaft",
  "Mobile Erfahrung",
  "Tracking",
  "Automation",
];

/* =====================================================================
   FAQ — vollständige, ehrliche Antworten
   ===================================================================== */
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
    q: "Kann mein bestehendes Website verbessert werden, statt neu zu bauen?",
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

/* Formular-Optionen — müssen zu den formValue-Werten oben passen */
export const serviceOptions = [
  "Komplettes System – Starter",
  "Komplettes System – Performance",
  "Komplettes System – Growth",
  "Website / Landingpage",
  "Google Ads",
  "GA4 & Conversion-Tracking",
  "Local SEO & Sichtbarkeit",
  "Lead-Automation & Google Sheets",
  "Website-Check",
  "Google-Ads-Check",
  "Tracking-Check",
  "Unsicher – ich brauche eine Empfehlung",
];

export const budgetOptions = [
  "Unter 1.500 €",
  "1.500 – 2.500 €",
  "2.500 – 3.500 €",
  "Über 3.500 € (mit laufender Betreuung)",
  "Ich möchte zuerst eine Empfehlung",
];

export const footerLinks = [
  { label: "Leistungen", href: "#services" },
  { label: "Pakete", href: "#packages" },
  { label: "Ablauf", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontakt", href: "#contact" },
];
