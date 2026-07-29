import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
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
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  documentedCases,
  felicityGa4Note,
  portfolioEvidence,
  projectLinks,
  type AcquisitionSourceEvidence,
  type ContactMethodEvidence,
  type ContactMethodKey,
  type DocumentedCaseEvidence,
  type Ga4Snapshot,
} from "@/data/evidence";

const numberFormatter = new Intl.NumberFormat("de-DE");

const methodVisuals = {
  form: {
    Icon: FileText,
    barClass: "bg-primary",
    iconClass: "bg-primary/10 text-primary",
  },
  phone: {
    Icon: Phone,
    barClass: "bg-success-500",
    iconClass: "bg-success-100 text-success-700",
  },
  whatsapp: {
    Icon: MessageCircle,
    barClass: "bg-stamp",
    iconClass: "bg-stamp-50 text-stamp",
  },
} satisfies Record<
  ContactMethodKey,
  {
    Icon: LucideIcon;
    barClass: string;
    iconClass: string;
  }
>;

function MethodBars({
  methods,
  total,
  dark = false,
}: {
  methods: ContactMethodEvidence[];
  total: number;
  dark?: boolean;
}) {
  return (
    <ul className="space-y-4" aria-label="Aufteilung nach Kontaktweg">
      {methods.map((method) => {
        const visual = methodVisuals[method.key];
        const Icon = visual.Icon;
        const percentage = Math.round((method.value / total) * 100);

        return (
          <li key={method.key}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span
                className={`flex items-center gap-2 text-sm font-semibold ${
                  dark ? "text-white/80" : "text-navy"
                }`}
              >
                <span
                  className={`grid size-7 place-items-center rounded-lg ${visual.iconClass}`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                {method.label}
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  dark ? "text-white" : "text-navy"
                }`}
              >
                {numberFormatter.format(method.value)}
                <span
                  className={`ml-1.5 text-xs font-medium ${
                    dark ? "text-white/45" : "text-stone-400"
                  }`}
                >
                  {percentage} %
                </span>
              </span>
            </div>
            <div
              className={`h-2 overflow-hidden rounded-full ${
                dark ? "bg-white/10" : "bg-stone-100"
              }`}
              aria-hidden="true"
            >
              <span
                className={`block h-full rounded-full ${visual.barClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SourceBreakdown({
  sources,
}: {
  sources: AcquisitionSourceEvidence[];
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-400">
        <Search className="size-3.5" aria-hidden="true" />
        Erfasste Herkunft
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {sources.map((source) => (
          <li
            key={source.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600"
          >
            <span className="font-mono font-bold text-navy">{source.value}</span>
            {source.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ga4SnapshotCard({
  snapshot,
  dark = false,
}: {
  snapshot: Ga4Snapshot;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark
          ? "border-white/10 bg-white/[0.06]"
          : "border-primary/15 bg-primary/[0.035]"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] ${
          dark ? "text-white/55" : "text-stamp"
        }`}
      >
        <BarChart3 className="size-4" aria-hidden="true" />
        {snapshot.period}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt
            className={`text-xs ${dark ? "text-white/45" : "text-stone-500"}`}
          >
            Sitzungen
          </dt>
          <dd
            className={`mt-0.5 font-mono text-xl font-bold ${
              dark ? "text-white" : "text-navy"
            }`}
          >
            {numberFormatter.format(snapshot.sessions)}
          </dd>
        </div>
        <div>
          <dt
            className={`text-xs ${dark ? "text-white/45" : "text-stone-500"}`}
          >
            Key Events
          </dt>
          <dd
            className={`mt-0.5 font-mono text-xl font-bold ${
              dark ? "text-white" : "text-navy"
            }`}
          >
            {numberFormatter.format(snapshot.keyEvents)}
          </dd>
        </div>
      </dl>
      <p
        className={`mt-3 text-[11px] leading-relaxed ${
          dark ? "text-white/40" : "text-stone-400"
        }`}
      >
        Separater Analysezeitraum – nicht mit dem Lead-Sheet verrechnet.
      </p>
    </div>
  );
}

function EvidenceMeta({
  period,
  dark = false,
}: {
  period: string;
  dark?: boolean;
}) {
  const itemClass = dark ? "text-white/55" : "text-stone-500";

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 text-xs ${itemClass}`}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        {period}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FileSpreadsheet className="size-3.5" aria-hidden="true" />
        Quelle: Lead-Sheet
      </span>
    </div>
  );
}

function FeaturedCase({ study }: { study: DocumentedCaseEvidence }) {
  return (
    <article
      id={`ergebnis-${study.id}`}
      className="relative scroll-mt-28 overflow-hidden rounded-[2rem] bg-navy shadow-card"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-success-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:p-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-700 px-3 py-1.5 text-xs font-bold text-white">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Größter dokumentierter Datensatz
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/45">
              {study.category}
            </span>
          </div>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-6xl font-bold tracking-tight text-white sm:text-7xl">
                {numberFormatter.format(study.documentedActions)}
              </p>
              <p className="mt-2 max-w-sm text-base font-semibold leading-relaxed text-white/75 sm:text-lg">
                dokumentierte Kontaktaktionen
              </p>
            </div>
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Website ansehen
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <h3 className="mt-8 text-2xl font-bold text-white sm:text-3xl">
            {study.business}
          </h3>
          <div className="mt-3">
            <EvidenceMeta period={study.period} dark />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <MethodBars
              methods={study.methods}
              total={study.documentedActions}
              dark
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <Ga4SnapshotCard snapshot={study.ga4} dark />

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="size-4 text-success-400" aria-hidden="true" />
              So sind die Zahlen zu lesen
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Die 211 Kontakte stammen aus dem Lead-Sheet. Sitzungen und Key
              Events kommen aus einem separaten GA4-Zeitraum. Kontaktaktionen
              sind keine Aussage über abgeschlossene Fahrzeugankäufe oder Umsatz.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function SupportingCase({ study }: { study: DocumentedCaseEvidence }) {
  return (
    <article
      id={`ergebnis-${study.id}`}
      className="card-soft flex h-full scroll-mt-28 flex-col overflow-hidden p-6 sm:p-7"
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
          className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-navy transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-6 rounded-2xl border border-success-200 bg-success-50/60 p-5">
        <p className="font-mono text-4xl font-bold tracking-tight text-navy">
          {numberFormatter.format(study.documentedActions)}
        </p>
        <p className="mt-1 text-sm font-semibold text-success-800">
          dokumentierte Kontaktaktionen
        </p>
      </div>

      <div className="mt-5">
        <EvidenceMeta period={study.period} />
      </div>

      <div className="mt-6">
        <MethodBars methods={study.methods} total={study.documentedActions} />
      </div>

      {study.acquisitionSources && (
        <div className="mt-6 border-t border-stone-100 pt-5">
          <SourceBreakdown sources={study.acquisitionSources} />
        </div>
      )}

      <div className="mt-auto pt-6">
        <Ga4SnapshotCard snapshot={study.ga4} />
      </div>
    </article>
  );
}

function FelicityGa4OnlyNote() {
  return (
    <aside className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/[0.035] p-6 sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Globe2 className="size-3.5" aria-hidden="true" />
              GA4-only · International
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {felicityGa4Note.category}
            </span>
          </div>

          <h3 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">
            {felicityGa4Note.business}
          </h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-stone-500">
            <CalendarDays className="size-4 text-stamp" aria-hidden="true" />
            {felicityGa4Note.period}
          </p>
          <a
            href={felicityGa4Note.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline"
          >
            felicity-solar-syria.com
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <dt className="text-xs leading-snug text-stone-500">Sitzungen</dt>
              <dd className="mt-2 font-mono text-2xl font-bold text-navy">
                {numberFormatter.format(felicityGa4Note.sessions)}
              </dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <dt className="text-xs leading-snug text-stone-500">
                GA4-Metrik „Neue Leads“
              </dt>
              <dd className="mt-2 font-mono text-2xl font-bold text-navy">
                {numberFormatter.format(felicityGa4Note.newLeadMetric)}
              </dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <dt className="text-xs leading-snug text-stone-500">Key Events</dt>
              <dd className="mt-2 font-mono text-2xl font-bold text-navy">
                {numberFormatter.format(felicityGa4Note.keyEvents)}
              </dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <dt className="flex items-center gap-1.5 text-xs leading-snug text-stone-500">
                <Smartphone className="size-3.5" aria-hidden="true" />
                Mobile Nutzer
              </dt>
              <dd className="mt-2 font-mono text-2xl font-bold text-navy">
                {felicityGa4Note.mobileShare} %
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Info
              className="mt-0.5 size-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Nicht Teil der 308 dokumentierten Kontakte
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {felicityGa4Note.caveat} Quelle: {felicityGa4Note.source}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function CaseStudiesSection() {
  const featuredCase =
    documentedCases.find((study) => study.featured) ?? documentedCases[0];
  const supportingCases = documentedCases.filter(
    (study) => study.id !== featuredCase.id,
  );

  return (
    <section id="results" className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-success-800">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Dokumentierte Ergebnisse
            </span>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Zahlen mit Kontaktweg, Quelle und Zeitraum
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Vier getrennte Lead-Sheets dokumentieren Formular-, Telefon- und
              WhatsApp-Kontakte. GA4-Werte stehen bewusst separat, weil Zeitraum
              und Definition nicht identisch sind.
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

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-soft">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-center bg-stone-50 p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
                Portfolio-Summe
              </p>
              <p className="mt-4 font-mono text-6xl font-bold tracking-tight text-navy sm:text-7xl">
                {numberFormatter.format(portfolioEvidence.documentedActions)}
              </p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-navy">
                dokumentierte Kontaktaktionen
              </p>
              <p className="mt-3 text-sm text-stone-500">
                {portfolioEvidence.caseCount} Projekte · {portfolioEvidence.source}
              </p>
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <MethodBars
                methods={portfolioEvidence.methods}
                total={portfolioEvidence.documentedActions}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <FeaturedCase study={featuredCase} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {supportingCases.map((study) => (
            <SupportingCase key={study.id} study={study} />
          ))}
        </div>

        <div className="mt-8">
          <FelicityGa4OnlyNote />
        </div>

        <div className="mt-14 border-t border-stone-200 pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stamp">
                Live-Projekte
              </p>
              <h3 className="mt-2 text-2xl font-bold text-navy">
                Neun umgesetzte Websites
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-stone-500">
              Öffnen Sie die Projekte direkt und prüfen Sie Struktur, mobile
              Nutzung und Kontaktwege selbst.
            </p>
          </div>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectLinks.map((project) => (
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
