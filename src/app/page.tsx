import { MobileCtaBar } from "@/components/MobileCtaBar";
import { StructuredData } from "@/components/StructuredData";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { AboutSection } from "@/components/sections/AboutSection";
import {
  CaseStudiesSection,
  FeaturedProofSection,
} from "@/components/sections/CaseStudiesSection";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { ContactForm } from "@/components/sections/ContactForm";
import { FaqSection } from "@/components/sections/FaqSection";
import { FitSection } from "@/components/sections/FitSection";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Navbar } from "@/components/sections/Navbar";
import { OfferSection } from "@/components/sections/OfferSection";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { faqs, siteConfig } from "@/data/site";

const organizationId = `${siteConfig.seo.url}/#organization`;
const websiteId = `${siteConfig.seo.url}/#website`;
const homepageId = `${siteConfig.seo.url}/#webpage`;
const serviceId = `${siteConfig.seo.url}/#ixa-anfrage-system`;
const offerId = `${siteConfig.seo.url}/#offer-90-tage`;
const founderId = `${siteConfig.seo.url}/#emad-alzaim`;
const businessAddress = {
  "@type": "PostalAddress",
  streetAddress: siteConfig.contact.address.street,
  postalCode: siteConfig.contact.address.postalCode,
  addressLocality: siteConfig.contact.address.city,
  addressCountry: siteConfig.contact.address.countryCode,
};

const homepageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness"],
      "@id": organizationId,
      name: siteConfig.name,
      url: siteConfig.seo.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.seo.url}/brand/ixa-logo.png`,
        width: 608,
        height: 608,
      },
      email: siteConfig.contact.emailDisplay,
      telephone: siteConfig.contact.phoneHref.replace("tel:", ""),
      address: businessAddress,
      areaServed: [
        { "@type": "City", name: "Nürnberg" },
        { "@type": "AdministrativeArea", name: "Franken" },
      ],
      founder: { "@id": founderId },
    },
    {
      "@type": "Person",
      "@id": founderId,
      name: siteConfig.owner,
      image: `${siteConfig.seo.url}/people/emad-alzaim-new.png`,
      url: `${siteConfig.seo.url}/#about`,
      worksFor: { "@id": organizationId },
    },
    {
      "@type": "Service",
      "@id": serviceId,
      name: "IXA Anfrage-System – 90 Tage",
      description:
        "Messbares Anfrage-System für lokale Dienstleistungsbetriebe mit vorhandener Google-Suchnachfrage.",
      serviceType: "Messbares Anfrage-System für lokale Dienstleistungsbetriebe",
      provider: { "@id": organizationId },
      areaServed: [
        { "@type": "City", name: "Nürnberg" },
        { "@type": "AdministrativeArea", name: "Franken" },
      ],
      offers: { "@id": offerId },
      mainEntityOfPage: { "@id": homepageId },
    },
    {
      "@type": "Offer",
      "@id": offerId,
      name: "IXA Anfrage-System – 90 Tage",
      price: "3000",
      priceCurrency: "EUR",
      url: `${siteConfig.seo.url}/#offer`,
      description:
        "Gesamtinvestition für das IXA Anfrage-System. Das Google-Werbebudget ist nicht enthalten und wird separat direkt an Google gezahlt.",
      itemOffered: { "@id": serviceId },
      seller: { "@id": organizationId },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteConfig.name,
      url: siteConfig.seo.url,
      publisher: { "@id": organizationId },
      inLanguage: "de-DE",
    },
    {
      "@type": "WebPage",
      "@id": homepageId,
      url: siteConfig.seo.url,
      name: siteConfig.seo.title,
      description: siteConfig.seo.description,
      isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
      mainEntity: { "@id": serviceId },
      inLanguage: "de-DE",
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.seo.url}/#faq`,
      url: `${siteConfig.seo.url}/#faq`,
      isPartOf: { "@id": homepageId },
      inLanguage: "de-DE",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <StructuredData data={homepageSchema} />
      <Navbar />
      <main>
        <Hero />
        <FeaturedProofSection />
        <FitSection />
        <OfferSection />
        <PackagesSection />
        <ServicesSection />
        <CaseStudiesSection />
        <AboutSection />
        <ContactForm />
        <FaqSection />
        <ClosingCtaSection />
      </main>
      <Footer />
      <WhatsappFloat />
      <MobileCtaBar />
    </>
  );
}
