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
    <div className="ixa-page-v4 min-h-screen bg-white text-[#163230]">
      {preview ? (
        <div className="border-b border-[#b9ded8] bg-[#eaf8f5] px-4 py-2 text-center text-xs font-medium text-[#365954]">
          Interne V4-Vorschau · keine Aktion und kein Tracking
        </div>
      ) : null}

      <header className="border-b border-[#d9ebe8]">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2.5 px-5 py-3 sm:px-8">
          <BrandMark className="size-8 shrink-0" priority />
          <p className="text-sm font-bold">IXA Leads</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-6 pt-6 sm:px-8 sm:pt-9">
        <div className="mb-5">
          <h1 className="text-[1.875rem] font-bold leading-tight tracking-tight sm:text-4xl">
            Ihr Website-Check
          </h1>
          <p className="mt-2 break-words text-base text-[#58736f]">
            Zwei Hinweise für <span className="font-semibold text-[#08766d]">{companyLabel}</span>
          </p>
        </div>

        <section aria-label="Zwei Beobachtungen" className="grid gap-3 sm:grid-cols-2">
          {findings.map((finding, index) => (
            <article key={`${index}-${finding.title}`} className="min-w-0 rounded-xl border border-[#d1e7e3] p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f7f4] text-xs font-bold text-[#08766d]">
                  {index + 1}
                </span>
                <h2 className="text-base font-bold leading-6">{finding.title}</h2>
              </div>
              <p className="mt-2.5 text-base leading-6">{finding.observation}</p>
              <p className="mt-3 text-xs leading-5 text-[#58736f]">
                {finding.sourceLabel} · geprüft am {finding.verifiedAt}
              </p>
            </article>
          ))}
        </section>

        <section aria-labelledby="next-step" className="mt-5 rounded-xl bg-[#eff8f6] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div>
            <h2 id="next-step" className="text-lg font-bold">Was würden wir zuerst ändern?</h2>
            <p className="mt-1 text-sm leading-5 text-[#58736f]">Fragen Sie nach unserer Lösungsskizze.</p>
          </div>
          <div className="mt-3 sm:mt-0 sm:w-72 sm:shrink-0">
            {preview ? (
              <button type="button" disabled aria-label="Lösungsskizze per WhatsApp anfordern" className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#61d8cc] px-4 py-3 text-center text-sm font-bold text-[#102f2c]">
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Lösungsskizze anfordern
              </button>
            ) : (
              <a href={primaryRequest.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label="Lösungsskizze per WhatsApp anfordern" className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#61d8cc] px-4 py-3 text-center text-sm font-bold text-[#102f2c] transition-colors hover:bg-[#72e2d6]">
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Lösungsskizze anfordern
              </a>
            )}
          </div>
        </section>
        <p className="mt-2.5 text-xs leading-5 text-[#58736f]">
          WhatsApp öffnet einen Entwurf. Sie entscheiden, ob Sie ihn senden.
        </p>

        <details className="mt-5 border-y border-[#d9ebe8]">
          <summary className="focus-ring cursor-pointer rounded-sm py-3 text-sm font-semibold text-[#365954]">
            Einordnung und erster Test
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
          </div>
        </details>
      </main>

      <footer className="mx-auto w-full max-w-4xl px-5 pb-6 sm:px-8">
        <p className="text-xs leading-5 text-[#58736f]">
          Keine Werbe-Analytics. Widerspruch jederzeit an {siteConfig.contact.emailDisplay}.
        </p>
        <nav aria-label="Rechtliche Informationen" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#365954]">
          <Link href="/datenschutz" className="focus-ring rounded-sm py-2 underline-offset-4 hover:underline">Datenschutz</Link>
          <Link href="/datenloeschung" className="focus-ring rounded-sm py-2 underline-offset-4 hover:underline">Datenlöschung</Link>
          <ImpressumDialog className="py-2 text-[#365954]" />
        </nav>
        {preview ? <p className="mt-2 text-xs text-[#58736f]">Vorschau ohne Tracking · Referenz {previewReference}</p> : null}
      </footer>
    </div>
  );
}
