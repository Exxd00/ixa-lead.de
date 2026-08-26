import type { Metadata } from "next";
import { PersonalCheckView } from "@/components/personal-check/PersonalCheckView";

export const metadata: Metadata = {
  title: "Vorschau: Persönlicher IXA Check",
  description: "Interne Vorschau einer persönlichen IXA-Check-Seite.",
  robots: {
    index: false,
    follow: false,
  },
};

const company = "Musterbetrieb Hofmann";
const reference = "IXAP-DEMO-001";

export default function PersonalCheckPreviewPage() {
  return (
    <PersonalCheckView
      companyLabel={company}
      preview
      previewReference={reference}
    />
  );
}
