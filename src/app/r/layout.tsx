import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Persönlicher IXA Check",
  description: "Persönlich bereitgestellte IXA-Ersteinschätzung.",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PersonalPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
