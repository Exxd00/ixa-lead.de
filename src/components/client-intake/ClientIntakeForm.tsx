"use client";

import { Check, ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import {
  contactOptions,
  emptyIntake,
  intakeFields,
  intakeChoices,
  type IntakeChoice,
  type ChoiceValue,
  validateIntake,
  type ContactOption,
  type IntakeAnswers,
  type IntakeErrors,
  type IntakeField,
} from "@/lib/client-intake";
import styles from "./client-intake.module.css";

function Question({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.question} aria-labelledby={`question-${number}`}>
      <div className={styles.questionHeading}>
        <span className={styles.number} aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        <div>
          <h2 id={`question-${number}`}>{title}</h2>
          {hint && <p className={styles.hint}>{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ClientIntakeForm() {
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyIntake);
  const [errors, setErrors] = useState<IntakeErrors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);
  const [differentRecipient, setDifferentRecipient] = useState(false);
  const submissionId = useRef<string | null>(null);
  const sending = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);

  function goToStep(next: number) {
    setStep(next);
    setMessage("");
    requestAnimationFrame(() => {
      stepHeading.current?.focus();
      stepHeading.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    });
  }

  const stepForField = (key: string) =>
    [
      "company",
      "owner",
      "legalForm",
      "address",
      "vatId",
      "businessId",
      "register",
      "regulatedDetails",
    ].includes(key)
      ? 0
      : [
            "services",
            "regions",
            "phone",
            "whatsapp",
            "email",
            "recipientEmail",
            "hours",
          ].includes(key)
        ? 1
        : 2;

  function nextStep() {
    const relevant = Object.fromEntries(
      Object.entries(validateIntake(answers)).filter(
        ([key]) => stepForField(key) === step,
      ),
    );
    if (Object.keys(relevant).length) {
      showErrors(relevant);
      return;
    }
    goToStep(Math.min(2, step + 1));
  }

  function update(key: IntakeField, value: string) {
    submissionId.current = null;
    setAnswers((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(["phone", "whatsapp", "email"].includes(key)
        ? { phone: undefined }
        : {}),
    }));
  }

  function showErrors(next: IntakeErrors) {
    setErrors(next);
    setStep(stepForField(Object.keys(next)[0]));
    requestAnimationFrame(() => {
      const first = Object.keys(next)[0];
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  }

  function choice(key: IntakeChoice) {
    return (
      <div className={styles.field}>
        <label htmlFor={`intake-${key}`}>{intakeChoices[key].label}</label>
        <select
          id={`intake-${key}`}
          name={key}
          value={answers[key]}
          className={styles.input}
          onChange={(event) => {
            submissionId.current = null;
            const value = event.target.value as ChoiceValue;
            setAnswers((current) => ({
              ...current,
              [key]: value,
              ...(key === "taxStatus" && value !== "yes"
                ? { vatId: "", businessId: "" }
                : {}),
              ...(key === "registerStatus" && value !== "yes"
                ? { register: "" }
                : {}),
              ...(key === "regulatedStatus" && value !== "yes"
                ? { regulatedDetails: "" }
                : {}),
            }));
            if (key === "taxStatus")
              setErrors((current) => ({
                ...current,
                vatId: undefined,
                businessId: undefined,
              }));
          }}
        >
          {Object.entries(intakeChoices[key].options).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function field(
    key: IntakeField,
    options: {
      rows?: number;
      required?: boolean;
      autoComplete?: string;
      placeholder?: string;
      inputMode?: "tel" | "email" | "text";
    } = {},
  ) {
    const properties = {
      id: `intake-${key}`,
      name: key,
      value: answers[key],
      maxLength: intakeFields[key].max,
      required: options.required,
      autoComplete: options.autoComplete ?? "off",
      placeholder: options.placeholder,
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `error-${key}` : undefined,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => update(key, event.target.value),
      className: styles.input,
    };
    return (
      <div className={styles.field}>
        <label htmlFor={properties.id}>
          {intakeFields[key].label}
          {options.required && <span aria-hidden="true"> *</span>}
        </label>
        {options.rows ? (
          <textarea {...properties} rows={options.rows} />
        ) : (
          <input {...properties} type="text" inputMode={options.inputMode} />
        )}
        {errors[key] && (
          <p className={styles.fieldError} id={`error-${key}`}>
            {errors[key]}
          </p>
        )}
      </div>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    if (step < 2) {
      nextStep();
      return;
    }
    const nextErrors = validateIntake(answers);
    if (Object.keys(nextErrors).length) {
      showErrors(nextErrors);
      setStatus("error");
      setMessage("Bitte prüfen Sie die markierten Felder.");
      return;
    }
    sending.current = true;
    setStatus("sending");
    setMessage("");
    try {
      submissionId.current ||= crypto.randomUUID();
      const body = {
        ...answers,
        submissionId: submissionId.current,
        websiteExtra:
          new FormData(event.currentTarget).get("websiteExtra") || "",
      };
      const response = await fetch("/api/client-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(50_000),
      });
      const result = await response.json();
      if (
        !response.ok ||
        result.ok !== true ||
        result.submissionId !== submissionId.current
      ) {
        if (result.fields) showErrors(result.fields);
        throw new Error(response.status === 429 ? "rate" : "send");
      }
      setStatus("success");
      window.location.assign("/info/danke");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.message === "rate"
          ? "Bitte warten Sie einige Minuten und versuchen Sie es erneut. Ihre Angaben bleiben hier erhalten."
          : "Das Senden konnte nicht bestätigt werden. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns unter info@ixa-leads.de.",
      );
    } finally {
      sending.current = false;
    }
  }

  if (status === "success")
    return (
      <p role="status" className={styles.success}>
        Ihre Angaben wurden gespeichert. Die Bestätigung wird geöffnet …
      </p>
    );

  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      className={styles.form}
      aria-busy={status === "sending"}
    >
      <div className={styles.steps} aria-label="Fortschritt">
        {["Unternehmen", "Leistungen & Kontakt", "Vorhandenes & Start"].map(
          (label, index) => (
            <span
              key={label}
              aria-current={step === index ? "step" : undefined}
              className={step === index ? styles.activeStep : ""}
            >
              {index + 1}
              <span>{label}</span>
            </span>
          ),
        )}
      </div>
      <h2 ref={stepHeading} tabIndex={-1} className={styles.stepHeading}>
        Schritt {step + 1} von 3
      </h2>
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="websiteExtra">Zusätzliche Website</label>
        <input
          id="websiteExtra"
          name="websiteExtra"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <fieldset className={styles.fields} disabled={status === "sending"}>
        <legend className={styles.srOnly}>Fragebogen für Ihre Website</legend>
        <div hidden={step !== 0}>
          <Question
            number={1}
            title="Wie heißt Ihr Unternehmen?"
            hint="Wir übernehmen diese Angaben in den Website-Entwurf. Bitte verwenden Sie den vollständigen rechtlichen Namen."
          >
            <div className={styles.grid}>
              {field("company", {
                required: true,
                autoComplete: "organization",
              })}
              {field("owner", { required: true, autoComplete: "name" })}
            </div>
            {field("address", { autoComplete: "street-address", rows: 2 })}
            {field("legalForm", {
              placeholder: "Zum Beispiel Einzelunternehmen, GbR, GmbH oder UG",
            })}
            <div className={styles.legalDetails}>
              <h3>Angaben für Ihr Impressum</h3>
              <p className={styles.hint}>
                Falls vorhanden: USt-IdNr. oder W-IdNr. Keine persönliche
                Steuer-ID oder Steuernummer vom Finanzamt. Fehlende Angaben
                können Sie nachreichen.
              </p>
              {choice("taxStatus")}
              {answers.taxStatus === "yes" && (
                <div className={styles.grid}>
                  {field("vatId", { placeholder: "z. B. DE123456789" })}
                  {field("businessId", {
                    placeholder: "z. B. DE123456789-00001",
                  })}
                </div>
              )}
              {choice("registerStatus")}
              {answers.registerStatus === "yes" &&
                field("register", {
                  rows: 2,
                  placeholder: "Zum Beispiel Amtsgericht …, HRB …",
                })}
              {choice("regulatedStatus")}
              {answers.regulatedStatus === "yes" &&
                field("regulatedDetails", {
                  rows: 3,
                  placeholder:
                    "Berufsbezeichnung, Kammer, Aufsicht und ggf. berufsrechtliche Regelungen",
                })}
            </div>
          </Question>
        </div>
        <div hidden={step !== 1}>
          <Question
            number={2}
            title="Welche Leistungen und Orte sind wichtig?"
            hint="Nennen Sie Ihre Leistungen, möglichst mit den drei wichtigsten zuerst."
          >
            <div className={styles.grid}>
              {field("services", { rows: 4 })}
              {field("regions", { rows: 4 })}
            </div>
          </Question>
          <Question
            number={3}
            title="Welche Kontaktdaten sollen auf Ihre Website?"
            hint="Mindestens eine erreichbare Telefonnummer, WhatsApp-Nummer oder E-Mail-Adresse benötigen wir für Rückfragen."
          >
            <div className={styles.grid}>
              {field("phone", { inputMode: "tel", autoComplete: "tel" })}
              {field("whatsapp", { inputMode: "tel" })}
            </div>
            {field("email", { inputMode: "email", autoComplete: "email" })}
            <label className={styles.privacy}>
              <input
                type="checkbox"
                checked={differentRecipient}
                onChange={(event) => {
                  setDifferentRecipient(event.target.checked);
                  if (!event.target.checked) update("recipientEmail", "");
                }}
              />
              <span>
                Neue Website-Anfragen sollen an eine andere E-Mail-Adresse
                gehen.
              </span>
            </label>
            {differentRecipient &&
              field("recipientEmail", { inputMode: "email" })}
          </Question>
          <Question
            number={4}
            title="Wie sind Ihre Öffnungs- oder Erreichbarkeitszeiten?"
          >
            {field("hours", {
              rows: 3,
              placeholder:
                "Zum Beispiel: Montag bis Freitag, 08:00 bis 18:00 Uhr",
            })}
          </Question>
        </div>
        <div hidden={step !== 2}>
          <Question
            number={5}
            title="Haben Sie bereits eine Domain, eine Website oder ein geschäftliches E-Mail-Postfach?"
          >
            {choice("existingStatus")}
            {answers.existingStatus === "yes" &&
              field("existing", {
                rows: 3,
                placeholder:
                  "Falls vorhanden: Domain, Website-Adresse oder Anbieter",
              })}
          </Question>
          <Question
            number={6}
            title="Haben Sie ein Logo, Wunschfarben oder eigene Fotos?"
          >
            {choice("brandingStatus")}
            {field("branding", {
              rows: 3,
              placeholder:
                "Beschreiben Sie kurz, was bereits vorhanden ist und was Sie sich wünschen.",
            })}
          </Question>
          <Question
            number={7}
            title="Gibt es bereits ein Google-Unternehmensprofil und ein Google-Konto für Ihr Unternehmen?"
          >
            {choice("googleStatus")}
            {answers.googleStatus === "yes" &&
              field("google", {
                rows: 3,
                placeholder:
                  "Link zum Unternehmensprofil und die geschäftliche Google-E-Mail, soweit bekannt",
              })}
          </Question>
          <Question
            number={8}
            title="Wie sollen Kunden Sie bevorzugt kontaktieren?"
            hint="Mehrfachauswahl möglich."
          >
            <div className={styles.options}>
              {(
                Object.entries(contactOptions) as Array<[ContactOption, string]>
              ).map(([key, label]) => (
                <label className={styles.option} key={key}>
                  <input
                    type="checkbox"
                    name="contactMethods"
                    value={key}
                    checked={answers.contactMethods.includes(key)}
                    onChange={(event) => {
                      submissionId.current = null;
                      setAnswers((current) => ({
                        ...current,
                        contactMethods: event.target.checked
                          ? [...current.contactMethods, key]
                          : current.contactMethods.filter(
                              (item) => item !== key,
                            ),
                      }));
                    }}
                  />
                  <span className={styles.checkboxVisual} aria-hidden="true">
                    <Check size={15} />
                  </span>
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Question>
          <Question
            number={9}
            title="Gibt es Websites, die Ihnen gefallen? Wann soll Ihre Website online gehen?"
          >
            <div className={styles.grid}>
              {field("examples", {
                rows: 3,
                placeholder: "Links oder Beispiele",
              })}
              {field("launch", {
                rows: 3,
                placeholder: "Wunschtermin oder nach Absprache",
              })}
            </div>
          </Question>
          <div className={styles.closing}>
            <p>
              <strong>Fast fertig.</strong> Wir prüfen Ihre Angaben und melden
              uns gezielt, falls noch etwas fehlt. Mit „Zurück“ können Sie Ihre
              Antworten vor dem Senden ändern.
            </p>
            <label className={styles.privacy}>
              <input
                type="checkbox"
                name="privacyAcknowledged"
                required
                checked={answers.privacyAcknowledged}
                aria-invalid={Boolean(errors.privacyAcknowledged)}
                aria-describedby={
                  errors.privacyAcknowledged ? "error-privacy" : undefined
                }
                onChange={(event) => {
                  setAnswers((current) => ({
                    ...current,
                    privacyAcknowledged: event.target.checked,
                  }));
                  setErrors((current) => ({
                    ...current,
                    privacyAcknowledged: undefined,
                  }));
                }}
              />
              <span>
                Ich habe die{" "}
                <a
                  href="/datenschutz#kundenfragebogen"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Datenschutzhinweise
                </a>{" "}
                zur Bearbeitung meiner Angaben gelesen. *
              </span>
            </label>
            {errors.privacyAcknowledged && (
              <p id="error-privacy" className={styles.fieldError}>
                {errors.privacyAcknowledged}
              </p>
            )}
            <p className={styles.small}>
              * Pflichtangaben. Weitere Angaben können Sie später ergänzen.
            </p>
          </div>
        </div>
      </fieldset>
      {message && (
        <div role="alert" className={styles.error}>
          {message}
        </div>
      )}
      <div className={styles.submitArea}>
        <div className={styles.navigation}>
          {step > 0 && (
            <button
              type="button"
              className={styles.backButton}
              disabled={status === "sending"}
              onClick={() => goToStep(step - 1)}
            >
              Zurück
            </button>
          )}
          {step < 2 ? (
            <button type="button" className={styles.submit} onClick={nextStep}>
              Weiter <ArrowRight size={19} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className={styles.submit}
              disabled={status === "sending"}
            >
              {status === "sending" ? (
                <LoaderCircle
                  className={styles.spinner}
                  size={20}
                  aria-hidden="true"
                />
              ) : (
                <Mail size={20} aria-hidden="true" />
              )}
              {status === "sending"
                ? "Wird gesendet …"
                : "Angaben an IXA senden"}
              {status !== "sending" && (
                <ArrowRight size={19} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        <p className={styles.small}>
          Ihre Antworten gehen direkt an unser Team.
        </p>
      </div>
    </form>
  );
}
