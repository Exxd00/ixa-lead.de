import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe2,
  Info,
  MessageCircle,
  Phone,
  Smartphone,
} from "lucide-react";
import { FrankenEvidencePost } from "@/components/case-studies/FrankenEvidencePost";
import {
  documentedCases,
  felicityGa4Note,
  portfolioEvidence,
  projectLinks,
  type ContactMethodKey,
  type DocumentedCaseEvidence,
} from "@/data/evidence";

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
    iconClass: "bg-stamp-50 text-stamp",
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
      className="card-soft flex h-full scroll-mt-28 flex-col overflow-hidden p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-stamp">
            {study.category}
          </p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-navy">
            {study.business}
          </h3>
        </div>
        <a
          href={study.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${study.business} in einem neuen Tab öffnen`}
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-navy transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-6">
        <p className="font-mono text-5xl font-bold tracking-[-0.06em] text-navy">
          {numberFormatter.format(study.documentedActions)}
        </p>
        <p className="mt-1 text-sm font-semibold text-success-800">
          dokumentierte Kontaktaktionen
        </p>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-stone-500">
        <CalendarDays className="size-3.5 text-stamp" aria-hidden="true" />
        {study.period}
      </p>

      <ul
        className="mt-5 flex flex-wrap gap-2"
        aria-label="Aufteilung nach Kontaktweg"
      >
        {study.methods.map((method) => {
          const visual = methodVisuals[method.key];
          const Icon = visual.Icon;

          return (
            <li
              key={method.key}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600"
            >
              <span
                className={`grid size-7 place-items-center rounded-lg ${visual.iconClass}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
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
        <p className="mt-5 border-t border-stone-100 pt-4 text-xs leading-relaxed text-stone-500">
          Größte dokumentierte Herkunft:{" "}
          <strong className="font-semibold text-navy">
            {study.acquisitionSources[0].label} ·{" "}
            {study.acquisitionSources[0].value}
          </strong>
        </p>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <div className="rounded-xl border border-primary/10 bg-primary/[0.035] p-3">
          <dt className="text-[11px] text-stone-500">GA4-Sitzungen</dt>
          <dd className="mt-1 font-mono text-xl font-bold text-navy">
            {numberFormatter.format(study.ga4.sessions)}
          </dd>
        </div>
        <div className="rounded-xl border border-primary/10 bg-primary/[0.035] p-3">
          <dt className="text-[11px] text-stone-500">GA4 Key Events</dt>
          <dd className="mt-1 font-mono text-xl font-bold text-navy">
            {numberFormatter.format(study.ga4.keyEvents)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] leading-relaxed text-stone-400">
        Separater GA4-Zeitraum; nicht mit dem Lead-Sheet verrechnet.
      </p>
    </article>
  );
}

function FelicityGa4OnlyCard() {
  return (
    <aside className="card-soft relative flex h-full flex-col overflow-hidden border-primary/20 bg-primary/[0.035] p-6">
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            <Globe2 className="size-3.5" aria-hidden="true" />
            GA4-only · International
          </p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-navy">
            {felicityGa4Note.business}
          </h3>
        </div>
        <a
          href={felicityGa4Note.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${felicityGa4Note.business} in einem neuen Tab öffnen`}
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-white text-primary transition-colors hover:border-primary/35"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div className="relative mt-6">
        <p className="font-mono text-5xl font-bold tracking-[-0.06em] text-navy">
          {numberFormatter.format(felicityGa4Note.sessions)}
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">GA4-Sitzungen</p>
      </div>

      <p className="relative mt-4 flex items-center gap-2 text-xs text-stone-500">
        <CalendarDays className="size-3.5 text-stamp" aria-hidden="true" />
        {felicityGa4Note.period}
      </p>

      <dl className="relative mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-[10px] leading-snug text-stone-500">
            GA4 „Neue Leads“
          </dt>
          <dd className="mt-1 font-mono text-lg font-bold text-navy">
            {numberFormatter.format(felicityGa4Note.newLeadMetric)}
          </dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="text-[10px] leading-snug text-stone-500">Key Events</dt>
          <dd className="mt-1 font-mono text-lg font-bold text-navy">
            {numberFormatter.format(felicityGa4Note.keyEvents)}
          </dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <dt className="flex items-center gap-1 text-[10px] leading-snug text-stone-500">
            <Smartphone className="size-3" aria-hidden="true" />
            Mobil
          </dt>
          <dd className="mt-1 font-mono text-lg font-bold text-navy">
            {felicityGa4Note.mobileShare} %
          </dd>
        </div>
      </dl>

      <div className="relative mt-auto flex gap-2 border-t border-amber-200/70 pt-5">
        <Info
          className="mt-0.5 size-4 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <p className="text-[11px] leading-relaxed text-amber-900">
          Nicht Teil der 308 dokumentierten Kontakte. Die GA4-Kennzahl ist nicht
          durch ein Lead-Sheet verifiziert.
        </p>
      </div>
    </aside>
  );
}

function PortfolioSummary() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-soft">
      <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
        <div className="flex flex-col justify-center bg-stone-50 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
            Portfolio-Summe · sekundärer Nachweis
          </p>
          <p className="mt-3 font-mono text-5xl font-bold tracking-[-0.06em] text-navy sm:text-6xl">
            {numberFormatter.format(portfolioEvidence.documentedActions)}
          </p>
          <p className="mt-2 text-sm font-semibold text-navy">
            dokumentierte Kontaktaktionen
          </p>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            {portfolioEvidence.caseCount} getrennte Lead-Sheets. Darin enthalten:
            11 Kontaktaktionen aus Keller Montage; das Projekt steht unten unter
            „Weitere Projekte“.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-px bg-stone-200">
          {portfolioEvidence.methods.map((method) => {
            const visual = methodVisuals[method.key];
            const Icon = visual.Icon;
            const percentage = Math.round(
              (method.value / portfolioEvidence.documentedActions) * 100,
            );

            return (
              <div
                key={method.key}
                className="flex min-w-0 flex-col justify-center bg-white p-4 sm:p-6"
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl ${visual.iconClass}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <dt className="mt-3 truncate text-[11px] font-semibold text-stone-500 sm:text-xs">
                  {method.label}
                </dt>
                <dd className="mt-1 font-mono text-2xl font-bold text-navy sm:text-3xl">
                  {numberFormatter.format(method.value)}
                </dd>
                <span className="mt-1 text-[10px] text-stone-400">
                  {percentage} %
                </span>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}

export function CaseStudiesSection() {
  const featuredCase =
    documentedCases.find((study) => study.featured) ?? documentedCases[0];
  const supportingCases = documentedCases.filter(
    (study) =>
      study.id !== featuredCase.id && study.id !== "keller-montage",
  );
  const highlightedDomains = new Set([
    "frankenautoankauf24.de",
    "rohrreinigung-kraft.de",
    "mobelmontage-nurnberg.de",
    "felicity-solar-syria.com",
  ]);
  const additionalProjects = projectLinks.filter(
    (project) => !highlightedDomains.has(project.domain),
  );

  return (
    <section id="results" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-success-800">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Dokumentierte Fallstudie
            </span>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Der stärkste Datensatz – mit sichtbarer Quelle
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Franken Autoankauf 24 steht bewusst an erster Stelle. Wischen Sie
              durch Ergebnis, Kontaktwege und anonymisierte Nachweise aus Google
              Sheets und GA4.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-bold text-navy">
              <FileSpreadsheet className="size-4 text-stamp" aria-hidden="true" />
              Transparente Datengrundlage
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              Kontaktaktionen sind dokumentierte Eingänge – keine Behauptung über
              abgeschlossene Aufträge, Umsatz oder eine garantierte Erfolgsquote.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <FrankenEvidencePost study={featuredCase} />
        </div>

        <div className="mt-8">
          <PortfolioSummary />
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
              Weitere Ergebnisse
            </p>
            <h3 className="mt-2 text-2xl font-bold text-navy">
              Kompakt statt endlos gestapelt
            </h3>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-500">
            Zwei weitere Lead-Sheet-Datensätze und ein klar gekennzeichneter
            GA4-only-Snapshot.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {supportingCases.map((study) => (
            <SupportingCase key={study.id} study={study} />
          ))}
          <FelicityGa4OnlyCard />
        </div>

        <div className="mt-14 border-t border-stone-200 pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
                Weitere Projekte
              </p>
              <h3 className="mt-2 text-2xl font-bold text-navy">
                Fünf zusätzliche Live-Websites
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-stone-500">
              Keller Montage wurde bewusst hierhin verschoben. Alle Projekte
              lassen sich direkt öffnen und auf dem eigenen Gerät prüfen.
            </p>
          </div>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {additionalProjects.map((project) => (
              <li key={project.url}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring group flex h-full items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
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
                    className="size-4 shrink-0 text-stone-300 transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
