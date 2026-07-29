import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/site";

export function FaqSection() {
  const primaryFaqs = faqs.slice(0, 5);

  return (
    <section id="faq" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Klartext"
          title="Die wichtigsten Fragen vor dem Start"
          description="Keine künstlichen Garantien und keine unnötig große Lösung. Wir klären, was für Ihr Ziel tatsächlich nötig ist."
        />

        <Reveal delay={80} className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-[1.5rem] border border-navy/10 bg-[#fbfaf7] px-5 sm:px-8">
            <Accordion type="single" collapsible className="w-full">
              {primaryFaqs.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${i}`}
                  className="border-navy/10 last:border-0"
                >
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-relaxed text-stone-600">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
