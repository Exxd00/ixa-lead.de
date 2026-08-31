import type { Metadata } from "next";
import {
  PersonalCheckDecisionPreview,
  type PersonalCheckDecisionFinding,
  type PersonalCheckDecisionTest,
} from "@/components/personal-check/PersonalCheckDecisionPreview";

export const metadata: Metadata = {
  title: "V3-Vorschau: Persönlicher IXA Anfrageweg-Check",
  description:
    "Interne V3-Vorschau (Page-Version v3.0) mit zwei synthetischen Beobachtungen und einer klaren nächsten Entscheidung.",
  openGraph: {
    title: "V3-Vorschau: Persönlicher IXA Anfrageweg-Check",
    description:
      "Interne V3-Vorschau (Page-Version v3.0) mit zwei synthetischen Beobachtungen und einer klaren nächsten Entscheidung.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "V3-Vorschau: Persönlicher IXA Anfrageweg-Check",
    description:
      "Interne V3-Vorschau (Page-Version v3.0) mit zwei synthetischen Beobachtungen und einer klaren nächsten Entscheidung.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const company = "Musterbetrieb Hofmann";
const reference = "IXAP-DEMO-001";
const primaryRequestText =
  "Hallo Emad, ich habe den persönlichen IXA Anfrageweg-Check zur Referenz IXAP-DEMO-001 gelesen. Bitte senden Sie mir den vertieften Check per WhatsApp.";
const meetingRequestText =
  "Hallo Emad, ich möchte ein unverbindliches 15-Minuten-Gespräch zum IXA Anfrageweg-Check (Referenz IXAP-DEMO-001) anfragen.";
const findings: readonly [
  PersonalCheckDecisionFinding,
  PersonalCheckDecisionFinding,
] = [
  {
    title: "Mobiler Kontaktweg",
    observation:
      "Der wichtigste Kontaktweg ist auf dem Smartphone erst nach längerem Scrollen sichtbar.",
    implication:
      "Besucher mit konkreter Absicht müssen zunächst suchen. Das könnte schnelle Kontaktaufnahmen unnötig bremsen.",
    sourceLabel: "Öffentlich sichtbare Website",
    verifiedAt: "27.08.2026",
  },
  {
    title: "Anfragequalifizierung",
    observation:
      "Der Anfrageweg fragt weder nach Projektart noch nach gewünschtem Zeitraum.",
    implication:
      "Erstanfragen kommen dadurch mit wenig Kontext an und können zusätzliche Rückfragen erfordern.",
    sourceLabel: "Öffentlich sichtbare Website",
    verifiedAt: "27.08.2026",
  },
];

const firstTest: PersonalCheckDecisionTest = {
  title: "Kontaktweg im ersten Mobilbereich testen",
  description:
    "Die bestehende Kontaktoption 14 Tage lang zusätzlich im ersten sichtbaren Mobilbereich platzieren. Alle anderen Inhalte bleiben unverändert; anschließend wird nur verglichen, ob mehr qualifizierte Kontaktstarts entstehen.",
};

export default function PersonalCheckPreviewPage() {
  return (
    <PersonalCheckDecisionPreview
      companyLabel={company}
      findings={findings}
      firstTest={firstTest}
      primaryRequestText={primaryRequestText}
      meetingRequestText={meetingRequestText}
      previewReference={reference}
    />
  );
}
