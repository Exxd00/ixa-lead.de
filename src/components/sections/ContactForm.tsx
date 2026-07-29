"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/section-heading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buildWhatsappUrl, reportAdsConversion, track } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

type FormState = {
  name: string;
  contact: string;
  url: string;
  adService: string;
  neededService: string;
  problem: string;
  budget: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  contact: "",
  url: "",
  adService: "",
  neededService: "",
  problem: "",
  budget: "",
};

function validate(state: FormState): Errors {
  const errors: Errors = {};
  if (!state.name.trim()) errors.name = "Bitte geben Sie Ihren Namen ein.";
  if (!state.contact.trim())
    errors.contact = "Bitte geben Sie Telefon oder E-Mail an.";
  if (!state.problem.trim())
    errors.problem = "Bitte beschreiben Sie kurz Ihr Problem.";
  return errors;
}

function payloadFor(state: FormState): FormState {
  const companyOrWebsite = state.adService.trim();
  const looksLikeWebsite =
    /^(?:https?:\/\/|www\.)/i.test(companyOrWebsite) ||
    /^[^\s]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(companyOrWebsite);

  return {
    ...state,
    url: looksLikeWebsite ? companyOrWebsite : "",
    adService: looksLikeWebsite ? "" : companyOrWebsite,
  };
}

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const startedRef = useRef(false);

  // تحديد الخدمة تلقائيًا عند الضغط على زر خدمة معيّنة
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setState((s) => ({ ...s, neededService: detail }));
    };
    window.addEventListener("lp:select-service", handler);
    return () => window.removeEventListener("lp:select-service", handler);
  }, []);

  const markStart = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start");
    }
  };

  const update = (key: keyof FormState, value: string) => {
    markStart();
    setState((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return; // منع الإرسال المتكرر

    const nextErrors = validate(state);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      track("form_submit_error", { reason: "validation" });
      // نقل التركيز إلى أول حقل خطأ
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    setStatus("loading");
    try {
      const endpoint = siteConfig.form.endpoint;
      const payload = payloadFor(state);
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("request_failed");
      } else {
        // وضع التجربة: لا توجد وجهة إرسال حقيقية بعد
        await new Promise((r) => setTimeout(r, 800));
      }

      setStatus("success");
      // حدث النجاح — جاهز للربط مع GA4 وGoogle Ads
      track("form_submit_success", {
        service: state.neededService,
        demo: !siteConfig.form.endpoint,
      });
      reportAdsConversion();
    } catch {
      setStatus("error");
      track("form_submit_error", { reason: "network" });
    }
  };

  const isDemo = !siteConfig.form.endpoint;

  return (
    <section id="contact" className="section-alt border-y border-stone-200/70 py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <SectionHeading
          eyebrow="Anfrage"
          title="Kostenlose Erstanalyse anfordern"
          description="Teilen Sie die wichtigsten Infos zu Ihrem Unternehmen – ich melde mich, um Ihre Situation und den passenden nächsten Schritt zu besprechen."
        />

        <Reveal delay={80} className="mx-auto mt-10 max-w-2xl">
          <div className="card-soft p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <a
                href={siteConfig.contact.phoneHref}
                onClick={() => track("phone_click", { location: "contact_form" })}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-stamp/40 hover:text-stamp"
              >
                <Phone className="size-4" aria-hidden="true" />
                Direkt anrufen
              </a>
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
              <SuccessState isDemo={isDemo} />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {state.neededService && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-stamp/20 bg-stamp/5 px-4 py-3 text-sm text-navy">
                    <span>
                      Interesse:{" "}
                      <strong className="font-semibold">
                        {state.neededService}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          neededService: "",
                        }))
                      }
                      className="focus-ring grid size-7 shrink-0 place-items-center rounded-full text-stone-500 transition-colors hover:bg-white hover:text-navy"
                      aria-label="Ausgewählte Leistung entfernen"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

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
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Ihr Name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "field-name-error" : undefined}
                      autoComplete="name"
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
                      onChange={(e) => update("contact", e.target.value)}
                      placeholder="Telefonnummer oder E-Mail"
                      aria-invalid={!!errors.contact}
                      aria-describedby={
                        errors.contact ? "field-contact-error" : undefined
                      }
                      autoComplete="tel"
                    />
                  </Field>
                </div>

                <Field
                  id="field-adService"
                  label="Unternehmen oder Website"
                  optional
                >
                  <Input
                    id="field-adService"
                    value={state.adService}
                    onChange={(e) => update("adService", e.target.value)}
                    placeholder="z. B. Muster GmbH oder muster.de"
                    autoComplete="organization"
                  />
                </Field>

                <Field
                  id="field-problem"
                  label="Was möchten Sie erreichen oder lösen?"
                  error={errors.problem}
                  required
                >
                  <Textarea
                    id="field-problem"
                    value={state.problem}
                    onChange={(e) => update("problem", e.target.value)}
                    placeholder="Beschreiben Sie kurz, was Sie erreichen möchten oder was aktuell nicht funktioniert."
                    rows={4}
                    aria-invalid={!!errors.problem}
                    aria-describedby={
                      errors.problem ? "field-problem-error" : undefined
                    }
                  />
                </Field>

                {status === "error" && (
                  <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertTriangle className="size-4 shrink-0" />
                    Ihre Anfrage konnte nicht gesendet werden. Bitte erneut
                    versuchen oder mich per WhatsApp kontaktieren.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="focus-ring inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-cta transition-all hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:shadow-cta-pressed disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-cta"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Wird gesendet …
                    </>
                  ) : (
                    <>
                      <Send className="size-5" />
                      Anfrage senden
                    </>
                  )}
                </button>

                <p className="flex items-center justify-center gap-2 text-center text-sm text-stone-500">
                  <ShieldCheck className="size-4 text-success-600" />
                  Ihre Angaben werden ausschließlich zur Kontaktaufnahme wegen
                  Ihrer Anfrage verwendet und nicht weitergegeben.
                </p>

                {isDemo && (
                  <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-center text-xs text-stone-500">
                    Hinweis für Entwickler: Das Formular ist im Demo-Modus. Tragen
                    Sie das Ziel in
                    <span className="mx-1 font-mono">siteConfig.form.endpoint</span>
                    (Formspree / API / Supabase) ein, um den echten Versand zu
                    aktivieren.
                  </p>
                )}
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
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
          <span className="ml-1 text-xs font-normal text-stone-400">(optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SuccessState({ isDemo }: { isDemo: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center py-8 text-center"
    >
      <span className="grid size-16 place-items-center rounded-full bg-success-100 text-success-600">
        <CheckCircle2 className="size-9" />
      </span>
      <h3 className="mt-5 text-xl font-bold text-navy">Ihre Anfrage ist eingegangen</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-stone-600">
        Ich melde mich, sobald ich Ihre Angaben geprüft habe.
      </p>
      {isDemo && (
        <p className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Demo-Modus: Es ist noch kein Versandziel eingerichtet, daher wurden keine
          Daten tatsächlich gesendet. Verbinden Sie das Formular mit einem
          E-Mail-Dienst oder einer API, um Anfragen zu empfangen.
        </p>
      )}
    </div>
  );
}
