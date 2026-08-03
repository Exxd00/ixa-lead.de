import { MobileCtaBar } from "@/components/MobileCtaBar";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { AboutSection } from "@/components/sections/AboutSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { ContactForm } from "@/components/sections/ContactForm";
import { FaqSection } from "@/components/sections/FaqSection";
import { FitSection } from "@/components/sections/FitSection";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Navbar } from "@/components/sections/Navbar";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ServicesSection } from "@/components/sections/ServicesSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FitSection />
        <CaseStudiesSection />
        <ServicesSection />
        <PackagesSection />
        <ProcessSection />
        <AboutSection />
        <FaqSection />
        <ContactForm />
      </main>
      <Footer />
      <WhatsappFloat />
      <MobileCtaBar />
    </>
  );
}
