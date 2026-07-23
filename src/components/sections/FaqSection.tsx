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
  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading eyebrow="FAQ" title="Häufige Fragen" />

        <Reveal delay={80} className="mx-auto mt-10 max-w-3xl">
          <div className="card-soft px-5 sm:px-7">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${i}`}
                  className="border-slate-100 last:border-0"
                >
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-relaxed text-slate-600">
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
