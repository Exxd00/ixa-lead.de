"use client";

import { CallbackRequestDialog } from "@/components/CallbackRequestDialog";
import { Reveal } from "@/components/Reveal";
import { WhatsappConfirmDialog } from "@/components/WhatsappConfirmDialog";
import { SectionHeading } from "@/components/section-heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  freeCheckServiceId,
  leadServiceOptions,
  siteConfig,
} from "@/data/site";
import { reportAdsConversion, track } from "@/lib/tracking";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FormState = {
  serviceId: string;
  company: string;
  name: string;
  contact: string;
  url: string;
  serviceFocus: string;
  serviceArea: string;
  projectDetail: string;
  capacity: string;
  orderValueRange: string;
  problem: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  serviceId: freeCheckServiceId,
  company: "",
  name: "",
  contact: "",
  url: "",
  serviceFocus: "",
  serviceArea: "",
  projectDetail: "",
  capacity: "",
  orderValueRange: "",
  problem: "",
};

const situationOptions = [
  "Noch keine geeignete Website",
  "Website vorhanden, aber kaum Anfragen",
  "Anfragen vorhanden, Herkunft unklar",
  "Google Ads bereits aktiv",
  "Ich möchte gezielt zusätzliche Anfragen testen",
  "Ich bin noch nicht sicher, was sinnvoll ist",
];

const capacityOptions = [
  "Aktuell keine zusätzliche Kapazität",
  "Begrenzte Kapazität für einzelne zusätzliche Aufträge",
  "Kapazität für mehrere zusätzliche Aufträge",
  "Kapazität ist noch unklar",
];

const orderValueOptions = [
  "Unter 500 €",
  "500–1.500 €",
  "1.500–5.000 €",
  "Über 5.000 €",
  "Unterschiedlich / noch unklar",
];

const serviceIds = new Set<string>(
  leadServiceOptions.map((service) => service.id),
);

function websiteLooksValid(value: string) {
  const candidate = value.trim();
  if (!candidate || /\s/.test(candidate)) return false;
  try {
    const url = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
    return (
      ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

function normalizedWebsite(value: string) {
  const candidate = value.trim();
  if (!candidate) return "";
  return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
}

function contactLooksValid(value: string) {
  const candidate = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return true;
  const digits = candidate.replace(/\D/g, "");
  return /^[+\d][\d\s()./-]*$/.test(candidate) && digits.length >= 6;
}

function sourceMetadata() {
  const searchParams = new URLSearchParams(window.location.search);
  let referrerHost = "";
  if (document.referrer) {
    try {
      referrerHost = new URL(document.referrer).hostname;
    } catch {
      // Browser-filtered or malformed referrer.
    }
  }
  return {
    entryPoint: "contact_form",
    landingPath: window.location.pathname,
    referrerHost,
    utmSource: searchParams.get("utm_source")?.trim() ?? "",
    utmMedium: searchParams.get("utm_medium")?.trim() ?? "",
    utmCampaign: searchParams.get("utm_campaign")?.trim() ?? "",
    utmTerm: searchParams.get("utm_term")?.trim() ?? "",
    utmContent: searchParams.get("utm_content")?.trim() ?? "",
    gclid: searchParams.get("gclid")?.trim() ?? "",
  };
}

function validateBusinessStep(state: FormState): Errors {
  const errors: Errors = {};
  if (!serviceIds.has(state.serviceId)) errors.serviceId = "Ungültige Auswahl.";
  if (!state.company.trim())
    errors.company = "Bitte nennen Sie Ihr Unternehmen.";
  if (state.url.trim() && !websiteLooksValid(state.url)) {
    errors.url = "Bitte geben Sie eine gültige Website-Adresse ein.";
  }
  if (!state.serviceFocus.trim()) {
    errors.serviceFocus = "Bitte nennen Sie die wichtigste Leistung.";
  }
  if (!state.serviceArea.trim()) {
    errors.serviceArea = "Bitte nennen Sie Ihre Zielregion.";
  }
  if (!state.projectDetail)
    errors.projectDetail = "Bitte wählen Sie Ihre Ausgangslage.";
  if (!state.capacity)
    errors.capacity = "Bitte wählen Sie Ihre aktuelle Kapazität.";
  return errors;
}

function validatePersonalStep(state: FormState): Errors {
  const errors: Errors = {};
  if (!state.name.trim())
    errors.name = "Bitte nennen Sie Ihren Ansprechpartner.";
  if (!contactLooksValid(state.contact)) {
    errors.contact =
      "Bitte geben Sie eine gültige Telefonnummer oder E-Mail-Adresse ein.";
  }
  return errors;
}

function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: keyof FormState;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`field-${id}`}>
        {label}
        {required && <span className="ml-1 text-stamp">*</span>}
        {optional && (
          <span className="ml-1 font-normal text-stone-400">(optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p
          id={`field-${id}-error`}
          className="text-xs font-semibold text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [state, setState] = useState(initialState);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const startedRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const serviceId = (event as CustomEvent<string>).detail;
      if (!serviceIds.has(serviceId)) return;
      setState((current) => ({ ...current, serviceId }));
      setStep(1);
      setErrors({});
      setStatus("idle");
    };
    window.addEventListener("lp:select-service", handler);
    return () => window.removeEventListener("lp:select-service", handler);
  }, []);

  const update = (key: keyof FormState, value: string) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { service: state.serviceId });
    }
    setState((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const focusFormCard = () => {
    window.requestAnimationFrame(() => {
      document
        .getElementById("potential-form-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleNext = () => {
    const nextErrors = validateBusinessStep(state);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      track("form_submit_error", {
        reason: "step_1_validation",
        service: state.serviceId,
      });
      document.getElementById(`field-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }

    setErrors({});
    setStep(2);
    track("form_option_select", {
      option: "step_1_complete",
      service: state.serviceId,
    });
    focusFormCard();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;
    if (step === 1) {
      handleNext();
      return;
    }
    const businessErrors = validateBusinessStep(state);
    if (Object.keys(businessErrors).length) {
      setErrors(businessErrors);
      setStep(1);
      focusFormCard();
      return;
    }

    const nextErrors = validatePersonalStep(state);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      track("form_submit_error", {
        reason: "validation",
        service: state.serviceId,
      });
      document.getElementById(`field-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }

    setStatus("loading");
    const submissionId = submissionIdRef.current ?? window.crypto.randomUUID();
    submissionIdRef.current = submissionId;
    const selectedService = leadServiceOptions.find(
      (item) => item.id === state.serviceId,
    );
    const contactMethod = state.contact.includes("@") ? "email" : "phone";

    try {
      const response = await fetch(siteConfig.form.endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          submissionType: "lead_form",
          serviceId: state.serviceId,
          neededService: selectedService?.label ?? "",
          auditType: state.serviceId === freeCheckServiceId ? "written" : "",
          contactMethod:
            state.serviceId === freeCheckServiceId ? contactMethod : "",
          company: state.company.trim(),
          name: state.name.trim(),
          contact: state.contact.trim(),
          url: normalizedWebsite(state.url),
          serviceFocus: state.serviceFocus.trim(),
          serviceArea: state.serviceArea.trim(),
          projectDetail: state.projectDetail,
          capacity: state.capacity,
          orderValueRange: state.orderValueRange,
          problem: state.problem.trim(),
          adService: "",
          budget: "",
          visitLocation: "",
          visitWindow: "",
          ...sourceMetadata(),
        }),
      });
      if (!response.ok) throw new Error("request_failed");

      setStatus("success");
      track("form_submit_success", {
        service: state.serviceId,
        contact_method: contactMethod,
        transaction_id: submissionId,
      });
      reportAdsConversion({
        service: state.serviceId,
        transaction_id: submissionId,
      });
      try {
        window.sessionStorage.setItem(
          "ixa_form_success",
          JSON.stringify({
            createdAt: Date.now(),
            serviceId: state.serviceId,
            auditType: "potential",
          }),
        );
      } catch {
        // The request was submitted even if session storage is unavailable.
      }
      window.setTimeout(() => window.location.assign("/danke"), 180);
    } catch {
      setStatus("error");
      track("form_submit_error", {
        reason: "network",
        service: state.serviceId,
      });
    }
  };

  const selectedService = leadServiceOptions.find(
    (item) => item.id === state.serviceId,
  );

  return (
    <section
      id="contact"
      className="section-alt border-y border-stone-200/70 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-lp">
        <SectionHeading
          eyebrow="Kostenlose Potenzialanalyse"
          title="Anfrage-Potenzial kostenlos prüfen"
          description="Sie erhalten eine kurze persönliche Einschätzung zu Suchnachfrage, aktueller Ausgangslage, Kontaktwegen und Messbarkeit – inklusive der wichtigsten nächsten Schritte."
        />
        <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-stone-500">
          Die Potenzialanalyse ist keine automatische Verkaufszusage. Wir prüfen
          zuerst, ob zusätzliche Nachfrage aktuell sinnvoll ist und ob ein IXA
          Anfrage-System zu Ihrer Situation passt.
        </p>

        <Reveal delay={70} className="mx-auto mt-9 max-w-3xl">
          <div
            id="potential-form-card"
            className="card-soft scroll-mt-24 p-5 sm:p-8"
          >
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  Ihre Auswahl
                </p>
                <p className="mt-1 text-sm font-bold text-navy">
                  {selectedService?.label}
                </p>
              </div>
              <div className="flex gap-2">
                <CallbackRequestDialog location="contact_form">
                  <button
                    type="button"
                    className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-navy"
                  >
                    <Phone className="size-4" /> Rückruf
                  </button>
                </CallbackRequestDialog>
                <WhatsappConfirmDialog location="contact_form">
                  <button
                    type="button"
                    className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-success-700 px-3 text-xs font-semibold text-white"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </button>
                </WhatsappConfirmDialog>
              </div>
            </div>

            {status === "success" ? (
              <div className="rounded-2xl bg-success-100 p-6 text-center text-success-800">
                <CheckCircle2 className="mx-auto size-9" />
                <p className="mt-3 font-bold">
                  Ihre Angaben wurden übermittelt.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="rounded-2xl border border-navy/10 bg-stone-50/70 p-3 sm:p-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    {(
                      [
                        [1, "Ihr Betrieb"],
                        [2, "Ihre Kontaktdaten"],
                      ] as const
                    ).map(([number, label], index) => (
                      <div key={number} className="contents">
                        {index === 1 && (
                          <span className="h-0.5 rounded-full bg-stone-200">
                            <span
                              className={`block h-full rounded-full bg-primary transition-all ${step === 2 ? "w-full" : "w-0"}`}
                            />
                          </span>
                        )}
                        <div
                          className={`flex min-w-0 items-center gap-2 ${index === 1 ? "justify-end" : ""}`}
                        >
                          <span
                            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${step >= number ? "bg-primary text-white" : "bg-white text-stone-400"}`}
                          >
                            {step > number ? (
                              <Check className="size-4" />
                            ) : (
                              number
                            )}
                          </span>
                          <span
                            className={`truncate text-xs font-semibold ${step >= number ? "text-navy" : "text-stone-400"}`}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {step === 1 ? (
                  <>
                    <div>
                      <p className="text-lg font-bold text-navy">
                        Zuerst kurz zu Ihrem Betrieb
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Damit die Ersteinschätzung zu Ihrer Situation passt.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="company"
                        label="Unternehmen"
                        required
                        error={errors.company}
                      >
                        <Input
                          id="field-company"
                          value={state.company}
                          onChange={(e) => update("company", e.target.value)}
                          autoComplete="organization"
                          aria-invalid={!!errors.company}
                        />
                      </Field>
                      <Field
                        id="url"
                        label="Website"
                        optional
                        error={errors.url}
                      >
                        <Input
                          id="field-url"
                          value={state.url}
                          onChange={(e) => update("url", e.target.value)}
                          placeholder="muster.de"
                          inputMode="url"
                          aria-invalid={!!errors.url}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="serviceFocus"
                        label="Welche Leistung möchten Sie vermarkten?"
                        required
                        error={errors.serviceFocus}
                      >
                        <Input
                          id="field-serviceFocus"
                          value={state.serviceFocus}
                          onChange={(e) =>
                            update("serviceFocus", e.target.value)
                          }
                          placeholder="z. B. Rohrreinigung"
                          aria-invalid={!!errors.serviceFocus}
                        />
                      </Field>
                      <Field
                        id="serviceArea"
                        label="Stadt / Zielregion"
                        required
                        error={errors.serviceArea}
                      >
                        <Input
                          id="field-serviceArea"
                          value={state.serviceArea}
                          onChange={(e) =>
                            update("serviceArea", e.target.value)
                          }
                          placeholder="z. B. Nürnberg + 30 km"
                          aria-invalid={!!errors.serviceArea}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="projectDetail"
                        label="Wo stehen Sie aktuell?"
                        required
                        error={errors.projectDetail}
                      >
                        <select
                          id="field-projectDetail"
                          value={state.projectDetail}
                          onChange={(e) =>
                            update("projectDetail", e.target.value)
                          }
                          className="focus-ring h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-navy"
                          aria-invalid={!!errors.projectDetail}
                        >
                          <option value="">Bitte auswählen</option>
                          {situationOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        id="capacity"
                        label="Zusätzliche Kapazität"
                        required
                        error={errors.capacity}
                      >
                        <select
                          id="field-capacity"
                          value={state.capacity}
                          onChange={(e) => update("capacity", e.target.value)}
                          className="focus-ring h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-navy"
                          aria-invalid={!!errors.capacity}
                        >
                          <option value="">Bitte auswählen</option>
                          {capacityOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <details className="group rounded-2xl border border-navy/10 bg-stone-50/60">
                      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
                        Freiwillige Zusatzangaben
                        <span className="text-xs font-normal text-stone-400">
                          Auftragswert &amp; Problem
                        </span>
                      </summary>
                      <div className="space-y-5 border-t border-stone-200 p-4">
                        <Field
                          id="orderValueRange"
                          label="Typischer Auftragswert"
                          optional
                        >
                          <select
                            id="field-orderValueRange"
                            value={state.orderValueRange}
                            onChange={(e) =>
                              update("orderValueRange", e.target.value)
                            }
                            className="focus-ring h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-navy"
                          >
                            <option value="">Keine Angabe</option>
                            {orderValueOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </Field>
                        <Field
                          id="problem"
                          label="Was ist aktuell Ihr größtes Problem?"
                          optional
                        >
                          <Textarea
                            id="field-problem"
                            value={state.problem}
                            onChange={(e) => update("problem", e.target.value)}
                            rows={3}
                            placeholder="Ein oder zwei Sätze reichen aus."
                          />
                        </Field>
                      </div>
                    </details>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-cta transition-all hover:-translate-y-0.5 sm:text-base"
                    >
                      Weiter zu den Kontaktdaten
                      <ArrowRight className="size-5" />
                    </button>
                    <p className="text-center text-xs text-stone-400">
                      Im nächsten Schritt nur noch Name und Telefon oder E-Mail.
                    </p>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-bold text-navy">
                        Wie dürfen wir Sie erreichen?
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Letzter Schritt · Ihre Angaben werden persönlich
                        geprüft.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-success-700/15 bg-success-100/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-success-800">
                        Ihre Angaben
                      </p>
                      <p className="mt-2 text-sm font-bold text-navy">
                        {state.company}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        {state.serviceFocus} · {state.serviceArea}
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="name"
                        label="Ansprechpartner"
                        required
                        error={errors.name}
                      >
                        <Input
                          id="field-name"
                          value={state.name}
                          onChange={(e) => update("name", e.target.value)}
                          autoComplete="name"
                          aria-invalid={!!errors.name}
                        />
                      </Field>
                      <Field
                        id="contact"
                        label="Telefon oder E-Mail"
                        required
                        error={errors.contact}
                      >
                        <Input
                          id="field-contact"
                          value={state.contact}
                          onChange={(e) => update("contact", e.target.value)}
                          placeholder="+49 … oder name@firma.de"
                          aria-invalid={!!errors.contact}
                        />
                      </Field>
                    </div>

                    {status === "error" && (
                      <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        Ihre Anfrage konnte nicht gesendet werden. Bitte erneut
                        versuchen oder WhatsApp nutzen.
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setErrors({});
                          focusFormCard();
                        }}
                        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-5 text-sm font-semibold text-navy"
                      >
                        <ArrowLeft className="size-4" /> Zurück
                      </button>
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-cta transition-all hover:-translate-y-0.5 disabled:opacity-70 sm:text-base"
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="size-5 animate-spin" /> Wird
                            gesendet …
                          </>
                        ) : (
                          <>
                            <Send className="size-5" /> Anfrage-Potenzial prüfen
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-center text-xs font-semibold text-stone-500">
                      Kostenlose Ersteinschätzung · keine feste Kundenzahl
                      versprochen
                    </p>
                    <p className="flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-stone-400">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-600" />
                      Ihre Angaben werden nur zur Bearbeitung Ihrer Anfrage
                      verwendet.
                    </p>
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
