import type { Metadata } from "next";
import { DankeContent } from "./DankeContent";

export const metadata: Metadata = {
  title: "Danke für Ihre Anfrage | IXA-Leads",
  description: "Bestätigung Ihrer Anfrage bei IXA-Leads.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DankePage() {
  return <DankeContent />;
}
