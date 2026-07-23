import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";
import { siteConfig } from "@/data/site";

/* Fließtext: klar, professionell, gut lesbar */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/* Überschriften: geometrisch, präzise, technisch */
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [
    "Landingpage",
    "Google Ads",
    "Conversion-Tracking",
    "GA4",
    "Google Tag Manager",
    "Conversion-Optimierung",
    "Webentwickler",
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
    "Digitale Kundengewinnung: Websites, Google Ads, GA4- und Conversion-Tracking, Local SEO und Lead-Automation",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { enabled, gtmId, ga4Id } = siteConfig.tracking;

  return (
    <html lang="de" dir="ltr" className={`${jakarta.variable} ${sora.variable}`}>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-grab/dist/index.global.js"
        />
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />

        {/* بيانات Schema المنظمة */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        {/* =================================================================
            Google Tag Manager — يُحمّل فقط بعد تفعيل التتبع وإضافة معرّف حقيقي
            ================================================================= */}
        {enabled && gtmId && !gtmId.includes("XXXX") && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}

        {/* =================================================================
            Google Analytics 4 — يُحمّل فقط بعد تفعيل التتبع وإضافة معرّف حقيقي
            ================================================================= */}
        {enabled && ga4Id && !ga4Id.includes("XXXX") && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');`}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* GTM noscript — يظهر فقط بعد التفعيل */}
        {enabled && gtmId && !gtmId.includes("XXXX") && (
          <noscript>
            <iframe
              title="gtm"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
