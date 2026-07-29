import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudies } from "@/data/site";
import { ShareableCaseStudyCard } from "@/components/case-studies/ShareableCaseStudyCard";

export const metadata: Metadata = {
  title: "IXA | Erfolgsgeschichten – Social Media Vorlagen",
  description: "Interne Vorschau der Erfolgsgeschichten als teilbare Karten.",
  robots: { index: false, follow: false },
};

export default function ErfolgsgeschichtenPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-wide text-stamp">
          Intern
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">
          Erfolgsgeschichten als Social-Vorlage
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Interne Vorschau zum Erstellen der Social-Posts – Bild, Copy-Text
          und Link je Fallstudie. Nicht für Besucher gedacht.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {caseStudies.map((study) => (
            <ShareableCaseStudyCard study={study} key={study.id} />
          ))}
        </div>
      </div>
    </main>
  );
}
