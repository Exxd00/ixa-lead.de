export const intakeFields = {
  company: { label: "Firmenname", max: 240 },
  owner: { label: "Inhaber/in bzw. vertretungsberechtigte Person", max: 160 },
  legalForm: { label: "Rechtsform", max: 100 },
  address: { label: "Geschäftsadresse", max: 500 },
  vatId: { label: "USt-IdNr. (falls vorhanden)", max: 40 },
  businessId: { label: "W-IdNr. (falls vorhanden)", max: 40 },
  register: { label: "Registergericht und Registernummer", max: 500 },
  regulatedDetails: {
    label: "Beruf, Kammer und zuständige Aufsichtsbehörde",
    max: 1200,
  },
  services: { label: "Dienstleistungen", max: 2000 },
  regions: { label: "Orte / Regionen", max: 1000 },
  phone: { label: "Telefonnummer", max: 100 },
  whatsapp: { label: "WhatsApp-Nummer", max: 100 },
  email: { label: "E-Mail-Adresse", max: 254 },
  recipientEmail: { label: "E-Mail für neue Website-Anfragen", max: 254 },
  hours: { label: "Öffnungs- oder Erreichbarkeitszeiten", max: 1000 },
  existing: { label: "Domain, Website und E-Mail-Postfach", max: 2000 },
  branding: { label: "Logo, Wunschfarben und eigene Fotos", max: 2000 },
  google: { label: "Google-Unternehmensprofil und Google-Konto", max: 1500 },
  examples: { label: "Website-Beispiele", max: 1500 },
  launch: { label: "Gewünschter Starttermin", max: 500 },
} as const;

export const intakeChoices = {
  taxStatus: {
    label: "USt-IdNr. oder W-IdNr. vorhanden?",
    options: {
      later: "Reiche ich nach / weiß ich noch nicht",
      yes: "Ja",
      no: "Nicht vorhanden",
    },
  },
  registerStatus: {
    label: "Ist Ihr Unternehmen in einem Register eingetragen?",
    options: { later: "Weiß ich noch nicht", yes: "Ja", no: "Nein" },
  },
  regulatedStatus: {
    label: "Benötigt Ihr Beruf eine besondere Zulassung?",
    options: { later: "Weiß ich noch nicht", yes: "Ja", no: "Nein" },
  },
  existingStatus: {
    label: "Domain, Website oder Firmenpostfach vorhanden?",
    options: {
      later: "Gemeinsam klären",
      yes: "Ja, bereits vorhanden",
      no: "Nein, bitte mit IXA einrichten",
    },
  },
  brandingStatus: {
    label: "Logo oder eigene Bilder vorhanden?",
    options: {
      later: "Gemeinsam klären",
      yes: "Ja, bereits vorhanden",
      no: "Nein, bitte mit IXA vorbereiten",
    },
  },
  googleStatus: {
    label: "Google-Unternehmensprofil oder Firmenkonto vorhanden?",
    options: {
      later: "Weiß ich noch nicht",
      yes: "Ja, bereits vorhanden",
      no: "Nein, bitte mit IXA vorbereiten",
    },
  },
} as const;
export type IntakeChoice = keyof typeof intakeChoices;
export type ChoiceValue = "yes" | "no" | "later";
export const INTAKE_EVENT = "info_danke";
export const INTAKE_SHEET_NAME = "15 Kunden-Websites";
export const INTAKE_SHEET_ID = 151026001;
export const INTAKE_SPREADSHEET_ID =
  "1YFYLQPMSdCzq6ArY0szD93qnfBHIub7yy-WnKDfGhoY";
export const INTAKE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${INTAKE_SPREADSHEET_ID}/edit#gid=${INTAKE_SHEET_ID}`;

export const contactOptions = {
  phone: "Telefon",
  whatsapp: "WhatsApp",
  form: "Anfrageformular",
  appointment: "Terminbuchung",
} as const;

export type IntakeField = keyof typeof intakeFields;
export type ContactOption = keyof typeof contactOptions;
export type IntakeAnswers = Record<IntakeField, string> &
  Record<IntakeChoice, ChoiceValue> & {
    contactMethods: ContactOption[];
    privacyAcknowledged: boolean;
  };
export type IntakeErrors = Partial<
  Record<IntakeField | "privacyAcknowledged", string>
>;

export function emptyIntake(): IntakeAnswers {
  const textFields = Object.fromEntries(
    Object.keys(intakeFields).map((key) => [key, ""]),
  ) as Record<IntakeField, string>;
  return {
    ...textFields,
    ...(Object.fromEntries(
      Object.keys(intakeChoices).map((key) => [key, "later"]),
    ) as Record<IntakeChoice, ChoiceValue>),
    contactMethods: [],
    privacyAcknowledged: false,
  };
}

export function isIntakeEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function isPhone(value: string): boolean {
  return (
    /^[+\d][\d\s()./-]*$/.test(value) &&
    /^\d{6,20}$/.test(value.replace(/\D/g, ""))
  );
}

export function validateIntake(data: IntakeAnswers): IntakeErrors {
  const errors: IntakeErrors = {};
  for (const key of Object.keys(intakeFields) as IntakeField[]) {
    if (data[key].length > intakeFields[key].max) {
      errors[key] = `Bitte auf ${intakeFields[key].max} Zeichen kürzen.`;
    }
  }
  if (!data.company.trim())
    errors.company = "Bitte nennen Sie Ihren Firmennamen.";
  if (!data.owner.trim())
    errors.owner = "Bitte nennen Sie den Inhaber oder die Inhaberin.";
  if (
    ![data.phone, data.whatsapp].some((value) => isPhone(value.trim())) &&
    !isIntakeEmail(data.email.trim())
  ) {
    errors.phone =
      "Bitte geben Sie mindestens eine erreichbare Telefonnummer, WhatsApp-Nummer oder E-Mail-Adresse an.";
  }
  if (!data.privacyAcknowledged)
    errors.privacyAcknowledged =
      "Bitte bestätigen Sie die Datenschutzhinweise.";
  if (
    data.vatId &&
    !/^[A-Z]{2}[A-Z0-9]{2,15}$/i.test(data.vatId.replace(/\s/g, ""))
  )
    errors.vatId =
      "Bitte die USt-IdNr. mit Länderkennzeichen angeben (z. B. DE…). Keine persönliche Steuer-ID oder Steuernummer.";
  if (
    data.businessId &&
    !/^DE\d{9}(?:-\d{5})?$/i.test(data.businessId.replace(/\s/g, ""))
  )
    errors.businessId =
      "Bitte die W-IdNr. im Format DE123456789 oder DE123456789-00001 angeben.";
  if (data.recipientEmail && !isIntakeEmail(data.recipientEmail))
    errors.recipientEmail =
      "Bitte eine gültige Empfangsadresse angeben oder das Feld leer lassen.";
  return errors;
}

export function parseIntake(
  value: unknown,
):
  | { ok: true; answers: IntakeAnswers; submissionId: string }
  | { ok: false; code: string; errors?: IntakeErrors } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ok: false, code: "invalid_payload" };
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.submissionId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      raw.submissionId,
    )
  ) {
    return { ok: false, code: "invalid_submission" };
  }
  if (raw.websiteExtra !== "") return { ok: false, code: "invalid_payload" };
  const answers = emptyIntake();
  for (const key of Object.keys(intakeFields) as IntakeField[]) {
    if (raw[key] === undefined) continue;
    if (
      typeof raw[key] !== "string" ||
      (raw[key] as string).length > intakeFields[key].max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw[key] as string)
    ) {
      return {
        ok: false,
        code: "invalid_field",
        errors: { [key]: "Bitte prüfen Sie Ihre Eingabe." },
      };
    }
    answers[key] = (raw[key] as string).trim().replace(/\r\n?/g, "\n");
  }
  for (const key of Object.keys(intakeChoices) as IntakeChoice[]) {
    const choice = raw[key] ?? "later";
    if (
      typeof choice !== "string" ||
      !Object.hasOwn(intakeChoices[key].options, choice)
    )
      return { ok: false, code: "invalid_choice" };
    answers[key] = choice as ChoiceValue;
  }
  if (answers.taxStatus !== "yes") {
    answers.vatId = "";
    answers.businessId = "";
  }
  if (answers.registerStatus !== "yes") answers.register = "";
  if (answers.regulatedStatus !== "yes") answers.regulatedDetails = "";
  if (answers.existingStatus !== "yes") answers.existing = "";
  if (answers.googleStatus !== "yes") answers.google = "";
  if (
    !Array.isArray(raw.contactMethods) ||
    raw.contactMethods.length > 4 ||
    raw.contactMethods.some(
      (method) =>
        typeof method !== "string" || !Object.hasOwn(contactOptions, method),
    )
  ) {
    return { ok: false, code: "invalid_contact_methods" };
  }
  answers.contactMethods = [...new Set(raw.contactMethods)] as ContactOption[];
  answers.privacyAcknowledged = raw.privacyAcknowledged === true;
  const errors = validateIntake(answers);
  if (Object.keys(errors).length)
    return { ok: false, code: "invalid_fields", errors };
  return { ok: true, answers, submissionId: raw.submissionId.toLowerCase() };
}
