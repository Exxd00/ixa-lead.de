import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { DiagnosisSection } from "@/components/sections/DiagnosisSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { ChecksSection } from "@/components/sections/ChecksSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { DeliverablesSection } from "@/components/sections/DeliverablesSection";
import { BeforeBudgetSection } from "@/components/sections/BeforeBudgetSection";
import { ServiceFitSection } from "@/components/sections/ServiceFitSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { MethodologySection } from "@/components/sections/MethodologySection";
import { TransparencySection } from "@/components/sections/TransparencySection";
import { FaqSection } from "@/components/sections/FaqSection";
import { MainCtaSection } from "@/components/sections/MainCtaSection";
import { ContactForm } from "@/components/sections/ContactForm";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { Footer } from "@/components/sections/Footer";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { MobileCtaBar } from "@/components/MobileCtaBar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Einstieg & Problem */}
        <Hero />
        <TrustBar />
        <ProblemSection />
        <DiagnosisSection />

        {/* Angebot: Leistungen, Pakete, Checks */}
        <ServicesSection />
        <PackagesSection />
        <ChecksSection />

        {/* Ablauf & Umfang */}
        <ProcessSection />
        <DeliverablesSection />
        <BeforeBudgetSection />

        {/* Vertrauen: Passung, Beispiele, Über mich */}
        <ServiceFitSection />
        <CaseStudiesSection />
        <AboutSection />
        <MethodologySection />
        <TransparencySection />

        {/* Abschluss */}
        <FaqSection />
        <MainCtaSection />
        <ContactForm />
        <FinalCtaSection />
      </main>
      <Footer />

      {/* عناصر عائمة */}
      <WhatsappFloat />
      <MobileCtaBar />

      {/* مساحة سفلية حتى لا يغطي شريط الموبايل محتوى التذييل */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </>
  );
}
