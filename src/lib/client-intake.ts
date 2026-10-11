export const intakeFields = {
  company: { label: "Firmenname", max: 240 },
  owner: { label: "Inhaber/in", max: 160 },
  address: { label: "Geschäftsadresse", max: 500 },
  services: { label: "Dienstleistungen", max: 2000 },
  regions: { label: "Orte / Regionen", max: 1000 },
  phone: { label: "Telefonnummer", max: 100 },
  whatsapp: { label: "WhatsApp-Nummer", max: 100 },
  email: { label: "E-Mail-Adresse", max: 254 },
  hours: { label: "Öffnungs- oder Erreichbarkeitszeiten", max: 1000 },
  existing: { label: "Domain, Website und E-Mail-Postfach", max: 2000 },
  branding: { label: "Logo, Wunschfarben und eigene Fotos", max: 2000 },
  google: { label: "Google-Unternehmensprofil und Google-Konto", max: 1500 },
  examples: { label: "Website-Beispiele", max: 1500 },
  launch: { label: "Gewünschter Starttermin", max: 500 },
} as const;

export const contactOptions = {
  phone: "Telefon",
  whatsapp: "WhatsApp",
  form: "Anfrageformular",
  appointment: "Terminbuchung",
} as const;

export type IntakeField = keyof typeof intakeFields;
export type ContactOption = keyof typeof contactOptions;
export type IntakeAnswers = Record<IntakeField, string> & {
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
