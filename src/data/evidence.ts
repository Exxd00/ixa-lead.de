export type ContactMethodKey = "form" | "phone" | "whatsapp";

export type ContactMethodEvidence = {
  key: ContactMethodKey;
  label: string;
  value: number;
};

export type AcquisitionSourceEvidence = {
  label: string;
  value: number;
};

export type Ga4Snapshot = {
  period: string;
  sessions: number;
  keyEvents: number;
};

export type DocumentedCaseEvidence = {
  id: string;
  business: string;
  category: string;
  url: string;
  documentedActions: number;
  period: string;
  methods: ContactMethodEvidence[];
  acquisitionSources?: AcquisitionSourceEvidence[];
  ga4: Ga4Snapshot;
  featured?: boolean;
};

export const portfolioEvidence = {
  documentedActions: 308,
  caseCount: 4,
  source: "Vier getrennte Lead-Sheets",
  methods: [
    { key: "form", label: "Formular", value: 158 },
    { key: "phone", label: "Telefon", value: 102 },
    { key: "whatsapp", label: "WhatsApp", value: 48 },
  ] satisfies ContactMethodEvidence[],
};

export const documentedCases: DocumentedCaseEvidence[] = [
  {
    id: "frankenautoankauf24",
    business: "Franken Autoankauf 24",
    category: "Fahrzeugankauf · Nürnberg & Franken",
    url: "https://frankenautoankauf24.de/",
    documentedActions: 211,
    period: "16. Apr.–8. Juni 2026",
    methods: [
      { key: "form", label: "Formular", value: 135 },
      { key: "phone", label: "Telefon", value: 40 },
      { key: "whatsapp", label: "WhatsApp", value: 36 },
    ],
    ga4: {
      period: "Separater GA4-Snapshot · 30. Apr.–28. Juli 2026",
      sessions: 792,
      keyEvents: 112,
    },
    featured: true,
  },
  {
    id: "rohrreinigung-kraft",
    business: "Rohrreinigung Kraft",
    category: "Handwerk · 24/7-Notdienst",
    url: "https://rohrreinigung-kraft.de/",
    documentedActions: 55,
    period: "27. Apr.–28. Juli 2026",
    methods: [
      { key: "phone", label: "Telefon", value: 49 },
      { key: "form", label: "Formular", value: 6 },
    ],
    ga4: {
      period: "Separater GA4-Snapshot · 30. Apr.–28. Juli 2026",
      sessions: 929,
      keyEvents: 31,
    },
  },
  {
    id: "moebelmontage-nuernberg",
    business: "Möbelmontage Nürnberg",
    category: "Montage · Nürnberg",
    url: "https://mobelmontage-nurnberg.de/",
    documentedActions: 31,
    period: "22. Mai–24. Juli 2026",
    methods: [
      { key: "form", label: "Formular", value: 14 },
      { key: "whatsapp", label: "WhatsApp", value: 9 },
      { key: "phone", label: "Telefon", value: 8 },
    ],
    acquisitionSources: [
      { label: "Organisch", value: 13 },
      { label: "Google Ads", value: 10 },
      { label: "Direkt", value: 6 },
      { label: "Referral", value: 1 },
      { label: "ChatGPT", value: 1 },
    ],
    ga4: {
      period: "Separater GA4-Snapshot · 30. Apr.–28. Juli 2026",
      sessions: 391,
      keyEvents: 65,
    },
  },
  {
    id: "keller-montage",
    business: "Keller Montage",
    category: "Küchen- & Möbelmontage",
    url: "https://keller-montage.de/",
    documentedActions: 11,
    period: "27. Apr.–26. Juli 2026",
    methods: [
      { key: "phone", label: "Telefon", value: 5 },
      { key: "form", label: "Formular", value: 3 },
      { key: "whatsapp", label: "WhatsApp", value: 3 },
    ],
    acquisitionSources: [
      { label: "Organisch", value: 6 },
      { label: "Direkt", value: 3 },
      { label: "Google Ads", value: 2 },
    ],
    ga4: {
      period: "Separater GA4-Snapshot · 30. Apr.–28. Juli 2026",
      sessions: 168,
      keyEvents: 8,
    },
  },
];

export const felicityGa4Note = {
  business: "Felicity Solar Syria",
  category: "International · Solarenergie · Syrien",
  url: "https://felicity-solar-syria.com/",
  period: "30. Apr.–28. Juli 2026",
  sessions: 717,
  newLeadMetric: 98,
  keyEvents: 123,
  mobileShare: 80,
  source: "Google Analytics 4",
  caveat:
    "GA4-only: Die Kennzahl „Neue Leads“ ist nicht durch ein CRM oder Lead-Sheet verifiziert und wird deshalb nicht zu den 308 dokumentierten Kontaktaktionen addiert.",
};

export const projectLinks = [
  {
    label: "Franken Autoankauf 24",
    domain: "frankenautoankauf24.de",
    url: "https://frankenautoankauf24.de/",
  },
  {
    label: "Rohrreinigung Kraft",
    domain: "rohrreinigung-kraft.de",
    url: "https://rohrreinigung-kraft.de/",
    note: "rohrreinigungkraft.de leitet hierhin weiter",
  },
  {
    label: "Versicherung Kompass",
    domain: "versicherungkompass.de",
    url: "https://versicherungkompass.de/",
  },
  {
    label: "Yazan Khoulani",
    domain: "yazan-khoulani.com",
    url: "https://yazan-khoulani.com/",
  },
  {
    label: "Keller Montage",
    domain: "keller-montage.de",
    url: "https://keller-montage.de/",
  },
  {
    label: "Möbelmontage Nürnberg",
    domain: "mobelmontage-nurnberg.de",
    url: "https://mobelmontage-nurnberg.de/",
  },
  {
    label: "RD Frankenbau",
    domain: "rd-frankenbau.de",
    url: "https://rd-frankenbau.de/",
  },
  {
    label: "Heisslounge",
    domain: "heisslounge.com",
    url: "https://heisslounge.com/",
  },
  {
    label: "Felicity Solar Syria",
    domain: "felicity-solar-syria.com",
    url: "https://felicity-solar-syria.com/",
  },
];
