"use client";

import {
  Check,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  contactOptions,
  emptyIntake,
  intakeFields,
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
  const submissionId = useRef<string | null>(null);
  const sending = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const success = useRef<HTMLDivElement>(null);

  function update(key: IntakeField, value: string) {
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
    requestAnimationFrame(() => {
      const first = Object.keys(next)[0];
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
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
        signal: AbortSignal.timeout(25_000),
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
      requestAnimationFrame(() => {
        success.current?.focus();
        success.current?.scrollIntoView({
          block: "center",
          behavior: "instant",
        });
      });
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
      <div className={styles.success} ref={success} tabIndex={-1}>
        <span className={styles.successIcon}>
          <CheckCircle2 size={36} aria-hidden="true" />
        </span>
        <p className={styles.eyebrow}>Vielen Dank!</p>
        <h2>Ihre Angaben wurden übermittelt.</h2>
        <p>
          Wir haben Ihren Website-Fragebogen erhalten und melden uns persönlich
          bei Ihnen.
        </p>
        <p className={styles.reference}>
          Ihre Referenz: {submissionId.current?.slice(0, 8).toUpperCase()}
        </p>
        <Link href="/" className={styles.secondaryLink}>
          Zur IXA Website <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    );

  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      className={styles.form}
      aria-busy={status === "sending"}
    >
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
        <Question
          number={1}
          title="Wie heißt Ihr Unternehmen?"
          hint="Bitte nennen Sie auch den Inhaber und die Geschäftsadresse."
        >
          <div className={styles.grid}>
            {field("company", { required: true, autoComplete: "organization" })}
            {field("owner", { required: true, autoComplete: "name" })}
          </div>
          {field("address", { autoComplete: "street-address", rows: 2 })}
        </Question>
        <Question
          number={2}
          title="Welche Dienstleistungen bieten Sie an und in welchen Orten sind Sie tätig?"
        >
          <div className={styles.grid}>
            {field("services", { rows: 4 })}
            {field("regions", { rows: 4 })}
          </div>
        </Question>
        <Question
          number={3}
          title="Welche Telefonnummer, WhatsApp-Nummer und E-Mail-Adresse sollen auf der Website stehen?"
          hint="Mindestens eine erreichbare Telefonnummer, WhatsApp-Nummer oder E-Mail-Adresse benötigen wir für Rückfragen."
        >
          <div className={styles.grid}>
            {field("phone", { inputMode: "tel", autoComplete: "tel" })}
            {field("whatsapp", { inputMode: "tel" })}
          </div>
          {field("email", { inputMode: "email", autoComplete: "email" })}
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
        <Question
          number={5}
          title="Haben Sie bereits eine Domain, eine Website oder ein geschäftliches E-Mail-Postfach?"
        >
          {field("existing", {
            rows: 3,
            placeholder:
              "Falls vorhanden: Domain, Website-Adresse oder Anbieter",
          })}
        </Question>
        <Question
          number={6}
          title="Haben Sie ein Logo, Wunschfarben oder eigene Fotos?"
        >
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
          {field("google", { rows: 3 })}
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
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      contactMethods: event.target.checked
                        ? [...current.contactMethods, key]
                        : current.contactMethods.filter((item) => item !== key),
                    }))
                  }
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
            <strong>Fehlt noch etwas?</strong> Schreiben Sie einfach „nicht
            vorhanden“. Wir können die fehlenden Bestandteile nach Absprache für
            Sie erstellen oder einrichten.
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
      </fieldset>
      {message && (
        <div role="alert" className={styles.error}>
          {message}
        </div>
      )}
      <div className={styles.submitArea}>
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
          {status === "sending" ? "Wird gesendet …" : "Angaben an IXA senden"}
          {status !== "sending" && <ArrowRight size={19} aria-hidden="true" />}
        </button>
        <p className={styles.small}>
          Ihre Antworten gehen direkt an unser Team.
        </p>
      </div>
    </form>
  );
}
