import { MobileCtaBar } from "@/components/MobileCtaBar";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { AboutSection } from "@/components/sections/AboutSection";
import {
  CaseStudiesSection,
  FeaturedProofSection,
} from "@/components/sections/CaseStudiesSection";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { ContactLifecycleSection } from "@/components/sections/ContactLifecycleSection";
import { ContactForm } from "@/components/sections/ContactForm";
import { FaqSection } from "@/components/sections/FaqSection";
import { FitSection } from "@/components/sections/FitSection";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Navbar } from "@/components/sections/Navbar";
import { OfferSection } from "@/components/sections/OfferSection";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ServicesSection } from "@/components/sections/ServicesSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedProofSection />
        <FitSection />
        <ServicesSection />
        <CaseStudiesSection />
        <ContactLifecycleSection />
        <OfferSection />
        <ProcessSection />
        <PackagesSection />
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
