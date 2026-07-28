"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, ExternalLink, Instagram } from "lucide-react";
import type { CaseStudy } from "@/data/site";
import { siteConfig } from "@/data/site";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import TiltedCard from "@/components/TiltedCard";
import { CaseStudyFallbackVisual } from "./CaseStudyFallbackVisual";

export function ShareableCaseStudyCard({ study }: { study: CaseStudy }) {
  const [copied, setCopied] = useState(false);
  const instagramUrl = siteConfig.linkHub.instagram;

  async function handleCopy() {
    await navigator.clipboard.writeText(study.igCaption);
    track("case_study_share_copy_click", { id: study.id });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="card-soft flex flex-col overflow-hidden">
      <div className="relative overflow-hidden rounded-t-2xl">
        {study.websiteUrl ? (
          <div className="aspect-square w-full bg-stone-100">
            {/* Versuch einer Live-Vorschau der echten Kundenseite. Viele Seiten
                blockieren das Einbetten per X-Frame-Options/CSP — dann bleibt
                dieser Bereich leer. Deshalb immer zusätzlich den Link unten
                sichtbar lassen (kein Fehler-Erkennungs-Trick, einfach robust). */}
            <iframe
              src={study.websiteUrl}
              title={`Live-Vorschau: ${study.business}`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="size-full border-0"
            />
            <a
              href={study.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("case_study_share_view_click", { id: study.id })}
              className="focus-ring absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-navy/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-navy"
            >
              <ExternalLink className="size-3" />
              Website öffnen
            </a>
          </div>
        ) : study.image ? (
          <div className="aspect-square w-full">
            <TiltedCard
              imageSrc={study.image}
              altText={`${study.business} – Projektfoto`}
              captionText={study.business}
              containerHeight="100%"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
            />
          </div>
        ) : (
          <CaseStudyFallbackVisual study={study} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="whitespace-pre-line rounded-xl bg-stone-50 p-3 text-sm leading-relaxed text-stone-600">
          {study.igCaption}
        </p>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-2.5">
          <a
            href={`/#ergebnis-${study.id}`}
            onClick={() => track("case_study_share_view_click", { id: study.id })}
            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-stone-50"
          >
            Vorschau auf der Website ansehen
            <ArrowUpRight className="size-4" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors",
              copied ? "bg-success-600" : "bg-primary hover:bg-primary/90",
            )}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Für Instagram kopieren
              </>
            )}
          </button>

          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("link_hub_click", { label: "Instagram (case study)" })}
              className="focus-ring inline-flex items-center justify-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stamp"
            >
              <Instagram className="size-3.5" />
              Auf Instagram ansehen
            </a>
          ) : (
            <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-stone-300">
              <Instagram className="size-3.5" />
              Instagram – bald verfügbar
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
