"use client";

import { CallbackRequestDialog } from "@/components/CallbackRequestDialog";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type LeadServiceId,
  freeCheckServiceId,
  leadServiceOptions,
  siteConfig,
} from "@/data/site";
import { buildWhatsappUrl, reportAdsConversion, track } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AuditType = "" | "written" | "onsite";
type ContactMethod = "" | "whatsapp" | "email" | "phone";

type FormState = {
  serviceId: string;
  auditType: AuditType;
  contactMethod: ContactMethod;
  name: string;
  contact: string;
  company: string;
  url: string;
  serviceFocus: string;
  serviceArea: string;
  visitLocation: string;
  visitWindow: string;
  projectDetail: string;
  problem: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

const initialState: FormState = {
  serviceId: "",
  auditType: "",
  contactMethod: "",
  name: "",
  contact: "",
  company: "",
  url: "",
  serviceFocus: "",
  serviceArea: "",
  visitLocation: "",
  visitWindow: "",
  projectDetail: "",
  problem: "",
};

const serviceIds = new Set<string>(
  leadServiceOptions.map((service) => service.id),
);

const visitWindowOptions: RadioOption[] = [
  {
    value: "next-2-days",
    label: "Innerhalb der nächsten 2 Tage",
  },
  {
    value: "within-7-days",
    label: "Innerhalb von 7 Tagen",
  },
  {
    value: "flexible",
    label: "Ich bin zeitlich flexibel",
  },
];

const projectOptions: Partial<
  Record<
    LeadServiceId,
    {
      legend: string;
      options: RadioOption[];
    }
  >
> = {
  "website-system": {
    legend: "Wie ist Ihre aktuelle Situation?",
    options: [
      { value: "no-website", label: "Noch keine Website" },
      { value: "replace-website", label: "Bestehende Website ersetzen" },
      { value: "improve-website", label: "Bestehende Website verbessern" },
    ],
  },
  startklar: {
    legend: "Womit möchten Sie starten?",
    options: [
      { value: "new-system", label: "Website und Werbung neu starten" },
      {
        value: "website-plus-ads",
        label: "Bestehende Website mit neuer Kampagne",
      },
      { value: "unsure", label: "Ich bin noch unsicher" },
    ],
  },
  "google-ads-setup": {
    legend: "Was trifft auf Sie zu?",
    options: [
      { value: "first-campaign", label: "Erste Google-Ads-Kampagne" },
      {
        value: "improve-campaign",
        label: "Bestehende Kampagne verbessern",
      },
      { value: "unsure", label: "Ich bin noch unsicher" },
    ],
  },
  betreuung: {
    legend: "Wobei wünschen Sie laufende Unterstützung?",
    options: [
      { value: "website", label: "Website" },
      { value: "google-ads", label: "Google Ads" },
      { value: "both", label: "Website und Google Ads" },
    ],
  },
  "single-update": {
    legend: "Was soll angepasst werden?",
    options: [
      { value: "website", label: "Website" },
      { value: "google-ads", label: "Google Ads" },
      { value: "both", label: "Website und Google Ads" },
    ],
  },
};

const serviceHeadingTitles: Partial<Record<LeadServiceId, string>> = {
  "website-system": "IXA Website-System anfragen",
  startklar: "IXA Anfrage-System anfragen",
  "google-ads-setup": "Google Ads Start anfragen",
  betreuung: "Betreuung & Optimierung anfragen",
  "single-update": "Einzelne Anpassung anfragen",
};

function isLeadServiceId(value: string): value is LeadServiceId {
  return serviceIds.has(value);
}

function selectedServiceFor(serviceId: string) {
  return leadServiceOptions.find((service) => service.id === serviceId);
}

function websiteLooksValid(value: string): boolean {
  const candidate = value.trim();
  if (!candidate || /\s/.test(candidate)) return false;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

function normalizedWebsite(value: string): string {
  const candidate = value.trim();
  if (!candidate) return "";
  return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
}

function sourceMetadata(entryPoint: string) {
  const searchParams = new URLSearchParams(window.location.search);
  let referrerHost = "";

  if (document.referrer) {
    try {
      referrerHost = new URL(document.referrer).hostname;
    } catch {
      // Ignore malformed or browser-filtered referrers.
    }
  }

  return {
    entryPoint,
    landingPath: window.location.pathname,
    referrerHost,
    utmSource: searchParams.get("utm_source")?.trim() ?? "",
    utmMedium: searchParams.get("utm_medium")?.trim() ?? "",
    utmCampaign: searchParams.get("utm_campaign")?.trim() ?? "",
    utmTerm: searchParams.get("utm_term")?.trim() ?? "",
    utmContent: searchParams.get("utm_content")?.trim() ?? "",
  };
}

function validate(state: FormState): Errors {
  const errors: Errors = {};
  const isFreeCheck = state.serviceId === freeCheckServiceId;

  if (!isLeadServiceId(state.serviceId)) {
    errors.serviceId = "Bitte wählen Sie eine Leistung aus.";
    return errors;
  }

  if (isFreeCheck && !state.auditType) {
    errors.auditType =
      "Bitte wählen Sie den schriftlichen oder persönlichen Check.";
  }

  if (isLeadServiceId(state.serviceId)) {
    if (!state.serviceFocus.trim()) {
      errors.serviceFocus = "Bitte nennen Sie Ihre wichtigste Leistung.";
    }
    if (!state.serviceArea.trim()) {
      errors.serviceArea = "Bitte nennen Sie Ihr Einsatzgebiet.";
    }
  }

  if (isFreeCheck && state.auditType === "written") {
    if (!websiteLooksValid(state.url)) {
      errors.url = "Bitte geben Sie eine gültige Website-Adresse ein.";
    }
    if (!state.name.trim()) {
      errors.name = "Bitte geben Sie Ihren Namen ein.";
    }
    if (state.contactMethod !== "whatsapp" && state.contactMethod !== "email") {
      errors.contactMethod = "Bitte wählen Sie WhatsApp oder E-Mail.";
    }
    if (!state.contact.trim()) {
      errors.contact =
        state.contactMethod === "email"
          ? "Bitte geben Sie Ihre E-Mail-Adresse ein."
          : "Bitte geben Sie Ihre WhatsApp-Nummer ein.";
    } else if (
      state.contactMethod === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.trim())
    ) {
      errors.contact = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }
  } else if (isFreeCheck && state.auditType === "onsite") {
    if (!state.name.trim()) {
      errors.name = "Bitte geben Sie Ihren Namen ein.";
    }
    if (!state.company.trim()) {
      errors.company = "Bitte geben Sie den Namen Ihres Unternehmens ein.";
    }
    if (!state.contact.trim()) {
      errors.contact = "Bitte geben Sie Ihre Telefonnummer ein.";
    }
    if (!state.visitLocation.trim()) {
      errors.visitLocation = "Bitte geben Sie PLZ und Ort in Nürnberg ein.";
    }
    if (!state.visitWindow) {
      errors.visitWindow = "Bitte wählen Sie Ihren Wunschzeitraum.";
    }
    if (state.url.trim() && !websiteLooksValid(state.url)) {
      errors.url = "Bitte geben Sie eine gültige Website-Adresse ein.";
    }
    if (!state.problem.trim()) {
      errors.problem = "Bitte beschreiben Sie kurz, worum es geht.";
    }
  } else if (!isFreeCheck) {
    if (!state.name.trim()) {
      errors.name = "Bitte geben Sie Ihren Namen ein.";
    }
    if (!state.contact.trim()) {
      errors.contact = "Bitte geben Sie Telefon oder E-Mail an.";
    }
    if (state.url.trim() && !websiteLooksValid(state.url)) {
      errors.url = "Bitte geben Sie eine gültige Website-Adresse ein.";
    }
    if (!state.projectDetail) {
      errors.projectDetail = "Bitte wählen Sie eine passende Option.";
    }
    if (!state.problem.trim()) {
      errors.problem = "Bitte beschreiben Sie kurz Ihr Vorhaben.";
    }
  }

  return errors;
}

function payloadFor(state: FormState) {
  const selectedService = selectedServiceFor(state.serviceId);
  const selectedProjectOption = isLeadServiceId(state.serviceId)
    ? projectOptions[state.serviceId]?.options.find(
        (option) => option.value === state.projectDetail,
      )
    : undefined;
  const selectedVisitWindow = visitWindowOptions.find(
    (option) => option.value === state.visitWindow,
  );
  const isFreeCheck = state.serviceId === freeCheckServiceId;

  return {
    name: state.name.trim(),
    contact: state.contact.trim(),
    url: state.url ? normalizedWebsite(state.url) : "",
    company: state.company.trim(),
    serviceFocus: state.serviceFocus.trim(),
    serviceArea: state.serviceArea.trim(),
    adService: "",
    neededService: selectedService?.label ?? "",
    problem: state.problem.trim(),
    budget: "",
    serviceId: state.serviceId,
    auditType: isFreeCheck ? state.auditType : "",
    contactMethod: isFreeCheck ? state.contactMethod : "",
    visitLocation:
      isFreeCheck && state.auditType === "onsite"
        ? state.visitLocation.trim()
        : "",
    visitWindow:
      isFreeCheck && state.auditType === "onsite"
        ? (selectedVisitWindow?.label ?? "")
        : "",
    projectDetail: isFreeCheck ? "" : (selectedProjectOption?.label ?? ""),
  };
}

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const startedRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const serviceId = (event as CustomEvent<string>).detail;
      if (!isLeadServiceId(serviceId)) return;

      setState((current) => ({
        ...current,
        serviceId,
        auditType: "",
        contactMethod: "",
        visitWindow: "",
        projectDetail: "",
      }));
      setErrors({});
      setStatus("idle");
      submissionIdRef.current = null;
    };

    window.addEventListener("lp:select-service", handler);
    return () => window.removeEventListener("lp:select-service", handler);
  }, []);

  const selectedService = selectedServiceFor(state.serviceId);
  const isFreeCheck = state.serviceId === freeCheckServiceId;
  const selectedProject = isLeadServiceId(state.serviceId)
    ? projectOptions[state.serviceId]
    : undefined;
  const isDemo = !siteConfig.form.endpoint;

  const markStart = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { service: state.serviceId || undefined });
    }
  };

  const clearErrors = (...keys: (keyof FormState)[]) => {
    setErrors((current) => {
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  };

  const update = (key: keyof FormState, value: string) => {
    markStart();
    setState((current) => ({ ...current, [key]: value }));
    if (errors[key]) clearErrors(key);
  };

  const chooseService = (serviceId: string) => {
    markStart();
    setState((current) => ({
      ...current,
      serviceId,
      auditType: "",
      contactMethod: "",
      visitWindow: "",
      projectDetail: "",
    }));
    setErrors({});
    setStatus("idle");
    submissionIdRef.current = null;
    track("form_service_select", { service: serviceId });
  };

  const chooseAuditType = (auditType: Exclude<AuditType, "">) => {
    markStart();
    setState((current) => ({
      ...current,
      auditType,
      contact: "",
      contactMethod: auditType === "onsite" ? "phone" : "",
      visitWindow: "",
    }));
    clearErrors(
      "auditType",
      "contactMethod",
      "contact",
      "company",
      "url",
      "serviceFocus",
      "serviceArea",
      "visitLocation",
      "visitWindow",
      "problem",
    );
    track("form_option_select", {
      service: freeCheckServiceId,
      option: auditType,
    });
  };

  const chooseContactMethod = (contactMethod: "whatsapp" | "email") => {
    markStart();
    setState((current) => ({
      ...current,
      contactMethod,
      contact: current.contactMethod === contactMethod ? current.contact : "",
    }));
    clearErrors("contactMethod", "contact");
    track("form_option_select", {
      service: freeCheckServiceId,
      option: contactMethod,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;

    const nextErrors = validate(state);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      track("form_submit_error", {
        reason: "validation",
        service: state.serviceId,
        audit_type: state.auditType || undefined,
      });
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    setStatus("loading");
    const submissionId =
      submissionIdRef.current ?? window.crypto.randomUUID();
    submissionIdRef.current = submissionId;

    try {
      const endpoint = siteConfig.form.endpoint;
      const payload = {
        ...payloadFor(state),
        submissionId,
        submissionType: "lead_form",
        ...sourceMetadata("contact_form"),
      };
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("request_failed");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setStatus("success");
      track("form_submit_success", {
        service: state.serviceId,
        audit_type: state.auditType || undefined,
        contact_method: state.contactMethod || undefined,
        demo: !endpoint,
        transaction_id: submissionId,
      });
      reportAdsConversion({
        service: state.serviceId,
        audit_type: state.auditType || undefined,
        transaction_id: submissionId,
      });
      submissionIdRef.current = null;
      try {
        window.sessionStorage.setItem(
          "ixa_form_success",
          JSON.stringify({
            createdAt: Date.now(),
            serviceId: state.serviceId,
            auditType: state.auditType,
          }),
        );
      } catch {
        // The inline success state remains available if storage is blocked.
      }
      window.setTimeout(() => window.location.assign("/danke"), 180);
    } catch {
      setStatus("error");
      track("form_submit_error", {
        reason: "network",
        service: state.serviceId,
        audit_type: state.auditType || undefined,
      });
    }
  };

  const headingTitle = selectedService
    ? isFreeCheck
      ? "Anfrage-Potenzial kostenlos prüfen"
      : (serviceHeadingTitles[selectedService.id] ?? "Leistung anfragen")
    : "Womit möchten Sie starten?";

  const headingDescription = isFreeCheck
    ? "Wählen Sie zwischen einer schriftlichen Potenzialanalyse in weniger als 24 Stunden und einem persönlichen 30-Minuten-Termin bei Ihnen in Nürnberg."
    : selectedService
      ? "Ihre Auswahl ist bereits übernommen. Ergänzen Sie nur noch die wichtigsten Angaben zu Ihrem Vorhaben."
      : "Wählen Sie die kostenlose Potenzialanalyse oder direkt die Leistung, die zu Ihrem Vorhaben passt.";

  return (
    <section
      id="contact"
      className="section-alt border-y border-stone-200/70 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Ihr nächster Schritt"
          title={headingTitle}
          description={headingDescription}
        />

        <Reveal delay={80} className="mx-auto mt-10 max-w-2xl">
          <div className="card-soft p-5 sm:p-8">
            <div className="mb-6 grid gap-3 min-[360px]:grid-cols-2">
              <CallbackRequestDialog location="contact_form">
                <button
                  type="button"
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  Rückruf / Anruf
                </button>
              </CallbackRequestDialog>
              <a
                href={buildWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("whatsapp_click", { location: "contact_form" })
                }
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-success-700 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-success-800"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>

            {status === "success" ? (
              <SuccessState
                isDemo={isDemo}
                serviceId={state.serviceId}
                auditType={state.auditType}
              />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <Field
                  id="field-serviceId"
                  label="Wobei kann ich Ihnen helfen?"
                  error={errors.serviceId}
                  required
                >
                  <select
                    id="field-serviceId"
                    value={state.serviceId}
                    onChange={(event) => chooseService(event.target.value)}
                    aria-invalid={!!errors.serviceId}
                    aria-describedby={
                      errors.serviceId ? "field-serviceId-error" : undefined
                    }
                    className="focus-ring flex h-12 w-full appearance-none rounded-xl border border-input bg-white px-4 text-base text-navy shadow-sm transition-colors focus:border-primary sm:h-11 md:text-sm"
                  >
                    <option value="">Bitte auswählen</option>
                    {leadServiceOptions.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {isFreeCheck && (
                  <>
                    <fieldset
                      id="field-auditType"
                      tabIndex={-1}
                      aria-describedby={
                        errors.auditType ? "field-auditType-error" : undefined
                      }
                      className="space-y-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <legend className="text-sm font-semibold text-navy">
                        Wie möchten Sie Ihre kostenlose Analyse erhalten?
                        <span className="ml-1 text-stamp">*</span>
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AuditTypeCard
                          value="written"
                          checked={state.auditType === "written"}
                          onChange={() => chooseAuditType("written")}
                          icon={<FileText className="size-5" />}
                          title="Schriftliche Potenzialanalyse"
                          description="In weniger als 24 Stunden an jedem Wochentag per WhatsApp oder E-Mail."
                          badge="Empfohlen"
                        />
                        <AuditTypeCard
                          value="onsite"
                          checked={state.auditType === "onsite"}
                          onChange={() => chooseAuditType("onsite")}
                          icon={<MapPin className="size-5" />}
                          title="30-Minuten-Analyse vor Ort"
                          description="Bei Ihnen im Unternehmen in Nürnberg. Termin nach persönlicher Bestätigung."
                        />
                      </div>
                      {errors.auditType && (
                        <ErrorText
                          id="field-auditType-error"
                          message={errors.auditType}
                        />
                      )}
                    </fieldset>

                    {state.auditType === "written" && (
                      <div className="space-y-5 rounded-2xl border border-navy/10 bg-stone-50/70 p-4 sm:p-5">
                        <Field
                          id="field-url"
                          label="Ihre Website"
                          error={errors.url}
                          required
                        >
                          <Input
                            id="field-url"
                            value={state.url}
                            onChange={(event) =>
                              update("url", event.target.value)
                            }
                            placeholder="z. B. muster.de"
                            inputMode="url"
                            autoComplete="url"
                            aria-invalid={!!errors.url}
                            aria-describedby={
                              errors.url ? "field-url-error" : undefined
                            }
                          />
                        </Field>

                        <BusinessScopeFields
                          serviceFocus={state.serviceFocus}
                          serviceArea={state.serviceArea}
                          errors={errors}
                          onChange={update}
                        />

                        <Field
                          id="field-name"
                          label="Ihr Name"
                          error={errors.name}
                          required
                        >
                          <Input
                            id="field-name"
                            value={state.name}
                            onChange={(event) =>
                              update("name", event.target.value)
                            }
                            placeholder="Ihr Name"
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                            aria-describedby={
                              errors.name ? "field-name-error" : undefined
                            }
                          />
                        </Field>

                        <fieldset
                          id="field-contactMethod"
                          tabIndex={-1}
                          aria-describedby={
                            errors.contactMethod
                              ? "field-contactMethod-error"
                              : undefined
                          }
                          className="space-y-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <legend className="text-sm font-semibold text-navy">
                            Wohin darf ich die Analyse senden?
                            <span className="ml-1 text-stamp">*</span>
                          </legend>
                          <div className="grid grid-cols-2 gap-3">
                            <CompactChoice
                              name="contact-method"
                              value="whatsapp"
                              checked={state.contactMethod === "whatsapp"}
                              onChange={() => chooseContactMethod("whatsapp")}
                              icon={<MessageCircle className="size-4" />}
                              label="WhatsApp"
                            />
                            <CompactChoice
                              name="contact-method"
                              value="email"
                              checked={state.contactMethod === "email"}
                              onChange={() => chooseContactMethod("email")}
                              icon={<Mail className="size-4" />}
                              label="E-Mail"
                            />
                          </div>
                          {errors.contactMethod && (
                            <ErrorText
                              id="field-contactMethod-error"
                              message={errors.contactMethod}
                            />
                          )}
                        </fieldset>

                        {state.contactMethod && (
                          <Field
                            id="field-contact"
                            label={
                              state.contactMethod === "email"
                                ? "Ihre E-Mail-Adresse"
                                : "Ihre WhatsApp-Nummer"
                            }
                            error={errors.contact}
                            required
                          >
                            <Input
                              id="field-contact"
                              type={
                                state.contactMethod === "email"
                                  ? "email"
                                  : "tel"
                              }
                              value={state.contact}
                              onChange={(event) =>
                                update("contact", event.target.value)
                              }
                              placeholder={
                                state.contactMethod === "email"
                                  ? "name@unternehmen.de"
                                  : "+49 …"
                              }
                              autoComplete={
                                state.contactMethod === "email"
                                  ? "email"
                                  : "tel"
                              }
                              inputMode={
                                state.contactMethod === "email"
                                  ? "email"
                                  : "tel"
                              }
                              aria-invalid={!!errors.contact}
                              aria-describedby={
                                errors.contact
                                  ? "field-contact-error"
                                  : undefined
                              }
                            />
                          </Field>
                        )}

                        <Field
                          id="field-problem"
                          label="Was möchten Sie vor allem verbessern?"
                          optional
                        >
                          <Textarea
                            id="field-problem"
                            value={state.problem}
                            onChange={(event) =>
                              update("problem", event.target.value)
                            }
                            placeholder="z. B. mehr Anfragen oder einen klareren Kontaktweg"
                            rows={3}
                          />
                        </Field>
                      </div>
                    )}

                    {state.auditType === "onsite" && (
                      <div className="space-y-5 rounded-2xl border border-navy/10 bg-stone-50/70 p-4 sm:p-5">
                        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm leading-relaxed text-stone-600">
                          Die kostenlose Vor-Ort-Analyse ist für Unternehmen
                          innerhalb Nürnbergs. Den genauen Termin bestätige ich
                          persönlich.
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            id="field-name"
                            label="Ihr Name"
                            error={errors.name}
                            required
                          >
                            <Input
                              id="field-name"
                              value={state.name}
                              onChange={(event) =>
                                update("name", event.target.value)
                              }
                              placeholder="Ihr Name"
                              autoComplete="name"
                              aria-invalid={!!errors.name}
                              aria-describedby={
                                errors.name ? "field-name-error" : undefined
                              }
                            />
                          </Field>
                          <Field
                            id="field-company"
                            label="Unternehmen"
                            error={errors.company}
                            required
                          >
                            <Input
                              id="field-company"
                              value={state.company}
                              onChange={(event) =>
                                update("company", event.target.value)
                              }
                              placeholder="Unternehmensname"
                              autoComplete="organization"
                              aria-invalid={!!errors.company}
                              aria-describedby={
                                errors.company
                                  ? "field-company-error"
                                  : undefined
                              }
                            />
                          </Field>
                        </div>

                        <BusinessScopeFields
                          serviceFocus={state.serviceFocus}
                          serviceArea={state.serviceArea}
                          errors={errors}
                          onChange={update}
                        />

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            id="field-contact"
                            label="Telefonnummer"
                            error={errors.contact}
                            required
                          >
                            <Input
                              id="field-contact"
                              type="tel"
                              value={state.contact}
                              onChange={(event) =>
                                update("contact", event.target.value)
                              }
                              placeholder="+49 …"
                              autoComplete="tel"
                              inputMode="tel"
                              aria-invalid={!!errors.contact}
                              aria-describedby={
                                errors.contact
                                  ? "field-contact-error"
                                  : undefined
                              }
                            />
                          </Field>
                          <Field
                            id="field-visitLocation"
                            label="PLZ / Ort"
                            error={errors.visitLocation}
                            required
                          >
                            <Input
                              id="field-visitLocation"
                              value={state.visitLocation}
                              onChange={(event) =>
                                update("visitLocation", event.target.value)
                              }
                              placeholder="z. B. 90402 Nürnberg"
                              autoComplete="postal-code"
                              aria-invalid={!!errors.visitLocation}
                              aria-describedby={
                                errors.visitLocation
                                  ? "field-visitLocation-error"
                                  : undefined
                              }
                            />
                          </Field>
                        </div>

                        <Field
                          id="field-url"
                          label="Website"
                          error={errors.url}
                          optional
                        >
                          <Input
                            id="field-url"
                            value={state.url}
                            onChange={(event) =>
                              update("url", event.target.value)
                            }
                            placeholder="z. B. muster.de"
                            inputMode="url"
                            autoComplete="url"
                            aria-invalid={!!errors.url}
                            aria-describedby={
                              errors.url ? "field-url-error" : undefined
                            }
                          />
                        </Field>

                        <RadioGroup
                          id="field-visitWindow"
                          legend="Wann wünschen Sie den Termin?"
                          value={state.visitWindow}
                          options={visitWindowOptions}
                          error={errors.visitWindow}
                          onChange={(value) => {
                            update("visitWindow", value);
                            track("form_option_select", {
                              service: freeCheckServiceId,
                              option: value,
                            });
                          }}
                        />

                        <Field
                          id="field-problem"
                          label="Worum geht es bei Ihnen?"
                          error={errors.problem}
                          required
                        >
                          <Textarea
                            id="field-problem"
                            value={state.problem}
                            onChange={(event) =>
                              update("problem", event.target.value)
                            }
                            placeholder="Beschreiben Sie Ihr Vorhaben in ein oder zwei Sätzen."
                            rows={3}
                            aria-invalid={!!errors.problem}
                            aria-describedby={
                              errors.problem ? "field-problem-error" : undefined
                            }
                          />
                        </Field>
                      </div>
                    )}
                  </>
                )}

                {selectedService && !isFreeCheck && selectedProject && (
                  <div className="space-y-5 rounded-2xl border border-navy/10 bg-stone-50/70 p-4 sm:p-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="field-name"
                        label="Ihr Name"
                        error={errors.name}
                        required
                      >
                        <Input
                          id="field-name"
                          value={state.name}
                          onChange={(event) =>
                            update("name", event.target.value)
                          }
                          placeholder="Ihr Name"
                          autoComplete="name"
                          aria-invalid={!!errors.name}
                          aria-describedby={
                            errors.name ? "field-name-error" : undefined
                          }
                        />
                      </Field>
                      <Field
                        id="field-contact"
                        label="Telefon oder E-Mail"
                        error={errors.contact}
                        required
                      >
                        <Input
                          id="field-contact"
                          value={state.contact}
                          onChange={(event) =>
                            update("contact", event.target.value)
                          }
                          placeholder="Telefonnummer oder E-Mail"
                          autoComplete="email"
                          aria-invalid={!!errors.contact}
                          aria-describedby={
                            errors.contact ? "field-contact-error" : undefined
                          }
                        />
                      </Field>
                    </div>

                    <BusinessScopeFields
                      serviceFocus={state.serviceFocus}
                      serviceArea={state.serviceArea}
                      errors={errors}
                      onChange={update}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="field-company" label="Unternehmen" optional>
                        <Input
                          id="field-company"
                          value={state.company}
                          onChange={(event) =>
                            update("company", event.target.value)
                          }
                          placeholder="Unternehmensname"
                          autoComplete="organization"
                        />
                      </Field>
                      <Field
                        id="field-url"
                        label="Website"
                        error={errors.url}
                        optional
                      >
                        <Input
                          id="field-url"
                          value={state.url}
                          onChange={(event) =>
                            update("url", event.target.value)
                          }
                          placeholder="z. B. muster.de"
                          inputMode="url"
                          autoComplete="url"
                          aria-invalid={!!errors.url}
                          aria-describedby={
                            errors.url ? "field-url-error" : undefined
                          }
                        />
                      </Field>
                    </div>

                    <RadioGroup
                      id="field-projectDetail"
                      legend={selectedProject.legend}
                      value={state.projectDetail}
                      options={selectedProject.options}
                      error={errors.projectDetail}
                      onChange={(value) => {
                        update("projectDetail", value);
                        track("form_option_select", {
                          service: state.serviceId,
                          option: value,
                        });
                      }}
                    />

                    <Field
                      id="field-problem"
                      label="Was möchten Sie erreichen?"
                      error={errors.problem}
                      required
                    >
                      <Textarea
                        id="field-problem"
                        value={state.problem}
                        onChange={(event) =>
                          update("problem", event.target.value)
                        }
                        placeholder="Beschreiben Sie Ihr Vorhaben kurz in ein oder zwei Sätzen."
                        rows={3}
                        aria-invalid={!!errors.problem}
                        aria-describedby={
                          errors.problem ? "field-problem-error" : undefined
                        }
                      />
                    </Field>
                  </div>
                )}

                {selectedService &&
                  (!isFreeCheck || state.auditType !== "") && (
                    <>
                      {status === "error" && (
                        <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                          <AlertTriangle className="size-4 shrink-0" />
                          Ihre Anfrage konnte nicht gesendet werden. Bitte
                          erneut versuchen oder mich per WhatsApp kontaktieren.
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 whitespace-normal rounded-xl bg-primary px-3 py-3 text-center text-sm font-semibold leading-tight text-primary-foreground shadow-cta transition-all hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:shadow-cta-pressed disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-cta sm:h-14 sm:px-6 sm:py-0 sm:text-base"
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="size-5 animate-spin" />
                            Wird gesendet …
                          </>
                        ) : (
                          <>
                            <Send className="size-5" />
                            <span>
                              {isFreeCheck
                                ? state.auditType === "onsite"
                                  ? "Kostenlose Vor-Ort-Analyse anfragen"
                                  : "Potenzialanalyse kostenlos anfordern"
                                : "Anfrage zu dieser Leistung senden"}
                            </span>
                          </>
                        )}
                      </button>

                      <p className="flex items-start justify-center gap-2 text-center text-sm leading-relaxed text-stone-500">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-600" />
                        Ihre Angaben werden nur zur Bearbeitung Ihrer Anfrage
                        verwendet und nicht weitergegeben.
                      </p>

                      {isDemo && (
                        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-center text-xs text-stone-500">
                          Das Formular befindet sich noch im Demo-Modus. Es
                          werden keine Daten versendet.
                        </p>
                      )}
                    </>
                  )}
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function AuditTypeCard({
  value,
  checked,
  onChange,
  icon,
  title,
  description,
  badge,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <label
      className={cn(
        "focus-within:ring-2 focus-within:ring-primary/60 relative flex min-h-40 cursor-pointer flex-col rounded-2xl border p-4 transition-all",
        checked
          ? "border-primary bg-primary/[0.05] shadow-sm"
          : "border-navy/10 bg-white hover:border-primary/35",
      )}
    >
      <input
        type="radio"
        name="audit-type"
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            checked ? "bg-primary text-white" : "bg-stone-100 text-navy",
          )}
        >
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-success-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success-800">
            {badge}
          </span>
        ) : checked ? (
          <span className="grid size-6 place-items-center rounded-full bg-primary text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <span className="mt-4 text-sm font-bold leading-snug text-navy">
        {title}
      </span>
      <span className="mt-2 text-xs leading-relaxed text-stone-600">
        {description}
      </span>
    </label>
  );
}

function BusinessScopeFields({
  serviceFocus,
  serviceArea,
  errors,
  onChange,
}: {
  serviceFocus: string;
  serviceArea: string;
  errors: Errors;
  onChange: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        id="field-serviceFocus"
        label="Ihre wichtigste Leistung"
        error={errors.serviceFocus}
        required
      >
        <Input
          id="field-serviceFocus"
          value={serviceFocus}
          onChange={(event) => onChange("serviceFocus", event.target.value)}
          placeholder="z. B. Rohrreinigung"
          aria-invalid={!!errors.serviceFocus}
          aria-describedby={
            errors.serviceFocus ? "field-serviceFocus-error" : undefined
          }
        />
      </Field>
      <Field
        id="field-serviceArea"
        label="Ihr Einsatzgebiet"
        error={errors.serviceArea}
        required
      >
        <Input
          id="field-serviceArea"
          value={serviceArea}
          onChange={(event) => onChange("serviceArea", event.target.value)}
          placeholder="z. B. Nürnberg + 30 km"
          autoComplete="address-level2"
          aria-invalid={!!errors.serviceArea}
          aria-describedby={
            errors.serviceArea ? "field-serviceArea-error" : undefined
          }
        />
      </Field>
    </div>
  );
}

function CompactChoice({
  name,
  value,
  checked,
  onChange,
  icon,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <label
      className={cn(
        "focus-within:ring-2 focus-within:ring-primary/60 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors",
        checked
          ? "border-primary bg-primary text-white"
          : "border-navy/10 bg-white text-navy hover:border-primary/35",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {icon}
      {label}
    </label>
  );
}

function RadioGroup({
  id,
  legend,
  value,
  options,
  error,
  onChange,
}: {
  id: string;
  legend: string;
  value: string;
  options: RadioOption[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={error ? `${id}-error` : undefined}
      className="space-y-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <legend className="text-sm font-semibold text-navy">
        {legend}
        <span className="ml-1 text-stamp">*</span>
      </legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "focus-within:ring-2 focus-within:ring-primary/60 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-2.5 text-sm transition-colors",
              value === option.value
                ? "border-primary text-navy shadow-sm"
                : "border-navy/10 text-stone-700 hover:border-primary/35",
            )}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="font-semibold">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <ErrorText id={`${id}-error`} message={error} />}
    </fieldset>
  );
}

function Field({
  id,
  label,
  error,
  required,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="ml-1 text-stamp">*</span>}
        {optional && (
          <span className="ml-1 text-xs font-normal text-stone-400">
            (optional)
          </span>
        )}
      </Label>
      {children}
      {error && <ErrorText id={`${id}-error`} message={error} />}
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function SuccessState({
  isDemo,
  serviceId,
  auditType,
}: {
  isDemo: boolean;
  serviceId: string;
  auditType: AuditType;
}) {
  const isWrittenCheck =
    serviceId === freeCheckServiceId && auditType === "written";
  const isOnsiteCheck =
    serviceId === freeCheckServiceId && auditType === "onsite";

  return (
    <output
      aria-live="polite"
      className="flex flex-col items-center py-8 text-center"
    >
      <span className="grid size-16 place-items-center rounded-full bg-success-100 text-success-600">
        <CheckCircle2 className="size-9" />
      </span>
      <h3 className="mt-5 text-xl font-bold text-navy">
        {isWrittenCheck
          ? "Ihre Potenzialanalyse ist angefragt"
          : isOnsiteCheck
            ? "Ihre Terminanfrage ist eingegangen"
            : "Ihre Anfrage ist eingegangen"}
      </h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-stone-600">
        {isWrittenCheck
          ? "Ich prüfe Leistung, Region und Kontaktweg. Ihre kurze schriftliche Einschätzung erhalten Sie in weniger als 24 Stunden."
          : isOnsiteCheck
            ? "Ich prüfe Ihre Angaben und melde mich persönlich, um den genauen Termin in Nürnberg zu bestätigen."
            : "Ich prüfe Ihre Angaben und melde mich, um den passenden nächsten Schritt mit Ihnen zu klären."}
      </p>
      {isDemo && (
        <p className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Demo-Modus: Es wurden keine Daten tatsächlich gesendet.
        </p>
      )}
    </output>
  );
}
