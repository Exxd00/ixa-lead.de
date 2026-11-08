import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { ImpressumDialog } from "@/components/ImpressumDialog";
import { siteConfig } from "@/data/site";
import type { PersonalPageFinding, PersonalPageFirstTest, PersonalWhatsAppRequest } from "@/lib/personal-outreach";

type Props = {
  companyLabel: string;
  findings: readonly [PersonalPageFinding, PersonalPageFinding];
  firstTest: PersonalPageFirstTest;
  primaryRequest?: PersonalWhatsAppRequest;
  previewMessage?: string;
  previewReference?: string;
};

export function PersonalCheckExperience({ companyLabel, findings, firstTest, primaryRequest, previewMessage, previewReference }: Props) {
  const preview = !primaryRequest;
  const message = primaryRequest?.message || previewMessage || "";

  return (
    <div className="ixa-page-v4 min-h-screen bg-[#e9e8e1] text-[#163230]">
      {preview ? (
        <div className="border-b border-[#c7d6cb] bg-[#e0ebe3] px-4 py-2 text-center text-xs font-medium text-[#365954]">
          Interne V4-Vorschau · keine Aktion und kein Tracking
        </div>
      ) : null}

      <header className="border-b border-[#d2d9d1]">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2.5 px-5 py-3 sm:px-8">
          <BrandMark className="size-8 shrink-0" priority />
          <p className="text-sm font-bold">IXA Leads</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-6 pt-6 sm:px-8 sm:pt-9">
        <div className="mb-5">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            Ihr Website-Check
          </h1>
          <p className="mt-2 break-words text-base text-[#4b6460]">
            Zwei Hinweise für <span className="font-semibold text-[#06665e]">{companyLabel}</span>
          </p>
        </div>

        <section aria-label="Zwei Beobachtungen" className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {findings.map((finding, index) => (
            <article key={`${index}-${finding.title}`} className="min-w-0 rounded-xl border border-[#d1d8ce] bg-[#f0f0e9] p-3 sm:p-5">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:gap-2.5">
                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dceae3] text-xs font-bold text-[#06665e]">
                  {index + 1}
                </span>
                <h2 className="min-w-0 break-words hyphens-auto text-sm font-semibold leading-5 sm:text-base sm:leading-6">{finding.title}</h2>
              </div>
              <p className="mt-2.5 break-words hyphens-auto text-sm leading-[1.6] sm:text-base sm:leading-6">{finding.observation}</p>
              <p className="mt-3 break-words text-xs leading-5 text-[#4b6460]">
                {finding.sourceLabel} · geprüft am {finding.verifiedAt}
              </p>
            </article>
          ))}
        </section>

        <details className="mt-4">
          <summary className="focus-ring cursor-pointer rounded-sm py-2 text-sm font-medium text-[#365954]">
            Hintergrund und erster Test
          </summary>
          <div className="space-y-4 pb-5 text-sm leading-6 text-[#365954]">
            {findings.map((finding, index) => (
              <div key={`detail-${index}`}>
                <h3 className="font-semibold text-[#163230]">{finding.title}</h3>
                <p className="mt-1">{finding.implication}</p>
              </div>
            ))}
            <div>
              <h3 className="font-semibold text-[#163230]">{firstTest.title}</h3>
              <p className="mt-1">{firstTest.description}</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#163230]">Ihre vorbereitete WhatsApp-Nachricht</h3>
              <blockquote className="mt-1 whitespace-pre-line">„{message}“</blockquote>
            </div>
            <p className="text-xs leading-5 text-[#4b6460]">Die persönliche Seite verwendet keine Werbe-Analytics.</p>
            {preview ? <p className="text-xs text-[#4b6460]">Vorschau ohne Tracking · Referenz {previewReference}</p> : null}
          </div>
        </details>

        <section aria-labelledby="next-step" className="mt-5 rounded-2xl border border-[#cbd9ce] bg-[#e0e7de] p-5 sm:grid sm:grid-cols-[1fr_auto] sm:items-start sm:gap-x-6 sm:p-6">
          <div>
            <h2 id="next-step" className="text-xl font-semibold leading-snug">Wie könnte eine Lösung aussehen?</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#4b6460]">Eine konkrete Skizze für den nächsten sinnvollen Schritt in Ihrem Betrieb.</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-72">
            {preview ? (
              <button type="button" disabled aria-label="Lösungsskizze per WhatsApp anfordern" className="ixa-glass-cta inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 px-4 py-3 text-center text-sm font-bold text-[#102f2c]">
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Lösungsskizze anfordern
              </button>
            ) : (
              <a href={primaryRequest.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label="Lösungsskizze per WhatsApp anfordern" className="ixa-glass-cta inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-center text-sm font-bold text-[#102f2c]">
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Lösungsskizze anfordern
              </a>
            )}
            <p className="mt-2 text-center text-xs leading-5 text-[#4b6460]">An {siteConfig.owner} · IXA Leads</p>
          </div>
          <p className="mt-4 border-t border-[#cbd9ce] pt-3 text-xs leading-5 text-[#4b6460] sm:col-span-2">
            WhatsApp öffnet einen Entwurf. Sie entscheiden, ob Sie ihn senden.
          </p>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-4xl px-5 pb-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-[#d2d9d1] pt-3 text-xs text-[#4b6460]">
          <nav aria-label="Rechtliche Informationen" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/datenschutz" className="focus-ring rounded-sm py-2 underline-offset-4 hover:underline">Datenschutz</Link>
            <Link href="/datenloeschung" className="focus-ring rounded-sm py-2 underline-offset-4 hover:underline">Datenlöschung</Link>
            <ImpressumDialog className="py-2 text-[#4b6460]" />
          </nav>
          <p className="break-words leading-5">Kontakt &amp; Widerspruch: {siteConfig.contact.emailDisplay}</p>
        </div>
      </footer>
    </div>
  );
}
