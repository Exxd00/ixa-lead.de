import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { MeasurementConsent } from "@/components/MeasurementConsent";
import { siteConfig } from "@/data/site";
import ClientBody from "./ClientBody";

/* Fließtext: klar, professionell, gut lesbar */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/* Überschriften: moderne, leicht technische Grotesk mit eigenem Charakter —
   Teil der "Live Signal"-Bildsprache (Tracking/Messung als Designidee). */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/* Zahlen/Kennzahlen: Mono-Ziffern wie auf einem Mess-/Analytics-Display —
   macht jede Kennzahl bewusst wie einen live abgelesenen Wert. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [
    "Website für lokale Dienstleister",
    "Webdesign Nürnberg",
    "Google Ads Nürnberg",
    "Conversion-Tracking",
    "Kontaktmessung",
    "Lokale Kundengewinnung",
  ],
  alternates: {
    canonical: siteConfig.seo.url,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteConfig.seo.url,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* Schema من نوع ProfessionalService — بيانات مؤقتة قابلة للتعديل، بدون تقييمات أو مراجعات. */
const schema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteConfig.name,
  description: siteConfig.seo.description,
  url: siteConfig.seo.url,
  email: siteConfig.contact.emailDisplay,
  telephone: siteConfig.contact.phoneHref.replace("tel:", ""),
  founder: siteConfig.owner,
  areaServed: ["Nürnberg", "Franken", "Bayern"],
  serviceType:
    "Anfrage-Systeme für lokale Dienstleister: Websites, Google Ads und Kontaktmessung",
  knowsAbout: [
    "Website & Conversion",
    "Google Ads",
    "Google Analytics 4",
    "Google Tag Manager",
    "Conversion Tracking",
    "Local SEO",
    "Google Business Profile",
    "Lead Automation",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Leistungen und Preise",
    itemListElement: [
      {
        "@type": "Offer",
        price: "1000",
        priceCurrency: "EUR",
        itemOffered: {
          "@type": "Service",
          name: "IXA Website-System inklusive Kontaktmessung",
        },
      },
      {
        "@type": "Offer",
        price: "1500",
        priceCurrency: "EUR",
        itemOffered: {
          "@type": "Service",
          name: "IXA Anfrage-System mit Website und Google-Ads-Start",
        },
      },
      {
        "@type": "Offer",
        price: "500",
        priceCurrency: "EUR",
        itemOffered: {
          "@type": "Service",
          name: "Google Ads Start",
        },
      },
      {
        "@type": "Offer",
        price: "500",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "500",
          priceCurrency: "EUR",
          unitText: "MONAT",
        },
        itemOffered: {
          "@type": "Service",
          name: "Laufende Betreuung und Optimierung",
        },
      },
    ],
  },
};

const schemaJson = JSON.stringify(schema).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      dir="ltr"
      className={`${jakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* بيانات Schema المنظمة */}
        <script type="application/ld+json">{schemaJson}</script>
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* Feines Papierkorn über der gesamten Seite — Teil der warmen Bildsprache */}
        <div
          aria-hidden="true"
          className="grain-overlay pointer-events-none fixed inset-0 z-[999]"
        />
        <ClientBody>{children}</ClientBody>
        <MeasurementConsent />
      </body>
    </html>
  );
}
