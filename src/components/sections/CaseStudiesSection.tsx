import { FrankenEvidencePost } from "@/components/case-studies/FrankenEvidencePost";
import {
  type ContactMethodKey,
  type DocumentedCaseEvidence,
  documentedCases,
  portfolioEvidence,
  projectLinks,
} from "@/data/evidence";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Phone,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("de-DE");

const methodVisuals = {
  form: {
    Icon: FileText,
    iconClass: "bg-primary/10 text-primary",
  },
  phone: {
    Icon: Phone,
    iconClass: "bg-success-100 text-success-700",
  },
  whatsapp: {
    Icon: MessageCircle,
    iconClass: "bg-success-100 text-success-700",
  },
} satisfies Record<
  ContactMethodKey,
  {
    Icon: LucideIcon;
    iconClass: string;
  }
>;

function SupportingCase({ study }: { study: DocumentedCaseEvidence }) {
  return (
    <article
      id={`ergebnis-${study.id}`}
      className="scroll-mt-28 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {study.category}
          </p>
          <h4 className="mt-1.5 text-lg font-bold leading-snug text-navy">
            {study.business}
          </h4>
        </div>
        <a
          href={study.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${study.business} in einem neuen Tab öffnen`}
          className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl border border-stone-200 text-navy transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-4xl font-bold tracking-[-0.06em] text-navy">
            {numberFormatter.format(study.documentedActions)}
          </p>
          <p className="text-xs font-semibold text-success-800">
            dokumentierte Kontaktaktionen
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <CalendarDays
            className="size-3.5 text-stone-400"
            aria-hidden="true"
          />
          {study.period}
        </p>
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-2"
        aria-label="Aufteilung nach Kontaktweg"
      >
        {study.methods.map((method) => {
          const visual = methodVisuals[method.key];
          const Icon = visual.Icon;

          return (
            <li
              key={method.key}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2 text-[11px] font-semibold text-stone-600"
            >
              <span
                className={`grid size-6 place-items-center rounded-lg ${visual.iconClass}`}
              >
                <Icon className="size-3" aria-hidden="true" />
              </span>
              <span className="font-mono font-bold text-navy">
                {numberFormatter.format(method.value)}
              </span>
              {method.label}
            </li>
          );
        })}
      </ul>

      {study.acquisitionSources && (
        <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
          Größte dokumentierte Herkunft:{" "}
          <strong className="font-semibold text-navy">
            {study.acquisitionSources[0].label} ·{" "}
            {study.acquisitionSources[0].value}
          </strong>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-stone-100 pt-4">
        <p className="rounded-xl bg-primary/[0.035] p-3 text-[11px] text-stone-500">
          GA4-Sitzungen
          <strong className="mt-1 block font-mono text-xl text-navy">
            {numberFormatter.format(study.ga4.sessions)}
          </strong>
        </p>
        <p className="rounded-xl bg-primary/[0.035] p-3 text-[11px] text-stone-500">
          GA4 Key Events
          <strong className="mt-1 block font-mono text-xl text-navy">
            {numberFormatter.format(study.ga4.keyEvents)}
          </strong>
        </p>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-stone-400">
        {study.ga4.period}; nicht mit dem Lead-Sheet verrechnet.
      </p>
    </article>
  );
}

function PortfolioSummary() {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              Portfolio-Summe · sekundärer Nachweis
            </span>
            <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <strong className="font-mono text-3xl tracking-[-0.05em] text-navy">
                {numberFormatter.format(portfolioEvidence.documentedActions)}
              </strong>
              <span className="text-xs font-semibold text-navy">
                dokumentierte Kontaktaktionen
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="border-t border-stone-200 bg-stone-50 p-4 sm:p-5">
        <dl className="grid grid-cols-3 gap-2">
          {portfolioEvidence.methods.map((method) => {
            const visual = methodVisuals[method.key];
            const Icon = visual.Icon;
            const percentage = Math.round(
              (method.value / portfolioEvidence.documentedActions) * 100,
            );

            return (
              <div
                key={method.key}
                className="rounded-xl border border-stone-200 bg-white p-3"
              >
                <span
                  className={`grid size-7 place-items-center rounded-lg ${visual.iconClass}`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <dt className="mt-2 truncate text-[10px] text-stone-500 sm:text-xs">
                  {method.label}
                </dt>
                <dd className="mt-0.5 font-mono text-xl font-bold text-navy sm:text-2xl">
                  {numberFormatter.format(method.value)}
                </dd>
                <span className="text-[10px] text-stone-400">
                  {percentage} %
                </span>
              </div>
            );
          })}
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          Vier Projekte zusammen; Franken Autoankauf 24 ist bereits enthalten.
          Grundlage sind {portfolioEvidence.caseCount} getrennte Lead-Sheets.
        </p>
      </div>
    </section>
  );
}

export function CaseStudiesSection() {
  const featuredCase =
    documentedCases.find((study) => study.featured) ?? documentedCases[0];
  const supportingCases = documentedCases.filter(
    (study) => study.id !== featuredCase.id && study.id !== "keller-montage",
  );
  const highlightedDomains = new Set([
    "frankenautoankauf24.de",
    "rohrreinigung-kraft.de",
    "mobelmontage-nurnberg.de",
  ]);
  const additionalProjects = projectLinks.filter(
    (project) => !highlightedDomains.has(project.domain),
  );

  return (
    <section id="results" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">
            Ergebnis aus einem echten Projekt
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
            Nachvollziehbar statt nur versprochen
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Bei Franken Autoankauf 24 wurden Formular, Telefon und WhatsApp
            zusammengeführt und getrennt dokumentiert. Belegt sind eingegangene
            Kontaktaktionen – nicht behauptete Aufträge oder Umsätze. Der
            anonymisierte Originalauszug steht direkt hier.
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <FrankenEvidencePost study={featuredCase} />
        </div>

        <details className="group mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:content-none sm:p-5 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                Optional vertiefen
              </p>
              <h3 className="mt-1 text-lg font-bold text-navy sm:text-xl">
                Weitere Nachweise &amp; Projekte
              </h3>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-primary">
              <span className="hidden sm:inline">Details öffnen</span>
              <ChevronDown
                className="size-5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          </summary>

          <div className="border-t border-stone-200 bg-stone-50 p-4 sm:p-5">
            <PortfolioSummary />
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {supportingCases.map((study) => (
                <SupportingCase key={study.id} study={study} />
              ))}
            </div>
            <div className="mt-5 border-t border-stone-200 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                Weitere Live-Websites
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {additionalProjects.map((project) => (
                  <li key={project.url}>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring group/link flex h-full items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-navy">
                          {project.label}
                        </span>
                        <span className="mt-1 block truncate font-mono text-xs text-stone-400">
                          {project.domain}
                        </span>
                        {"note" in project && project.note && (
                          <span className="mt-1.5 block text-[11px] leading-snug text-stone-400">
                            {project.note}
                          </span>
                        )}
                      </span>
                      <ExternalLink
                        className="size-4 shrink-0 text-stone-300 transition-colors group-hover/link:text-primary"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
