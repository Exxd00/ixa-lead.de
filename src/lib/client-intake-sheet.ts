import {
  intakeChoices,
  intakeFields,
  contactOptions,
  INTAKE_SHEET_ID,
  INTAKE_SHEET_URL,
  type IntakeAnswers,
} from "./client-intake";

export const intakeSheetColumns = [
  ["receivedAt", "Eingang (UTC)"],
  ["company", "1 | Wie heißt Ihr Unternehmen?"],
  ["status", "Bearbeitungsstatus"],
  ["owner", "1 | Wer ist Inhaber/in bzw. vertretungsberechtigt?"],
  ["legalForm", "1 | Welche Rechtsform?"],
  ["address", "1 | Wie lautet die Geschäftsadresse?"],
  ["taxStatus", "1 | USt-IdNr. oder W-IdNr. vorhanden?"],
  ["vatId", "1 | Welche USt-IdNr.?"],
  ["businessId", "1 | Welche W-IdNr.?"],
  ["registerStatus", "1 | Registereintrag vorhanden?"],
  ["register", "1 | Welches Registergericht und welche Nummer?"],
  ["regulatedStatus", "1 | Besondere Berufszulassung erforderlich?"],
  ["regulatedDetails", "1 | Welcher Beruf, welche Kammer/Aufsichtsbehörde?"],
  ["services", "2 | Welche Leistungen sind besonders wichtig?"],
  ["regions", "2 | In welchen Orten sind Sie tätig?"],
  ["phone", "3 | Welche Telefonnummer veröffentlichen?"],
  ["whatsapp", "3 | Welche WhatsApp-Nummer veröffentlichen?"],
  ["email", "3 | Welche E-Mail-Adresse veröffentlichen?"],
  ["recipientEmail", "3 | Wohin sollen Website-Anfragen gehen?"],
  ["hours", "4 | Wann sind Sie erreichbar?"],
  ["existingStatus", "5 | Domain, Website oder Firmenpostfach vorhanden?"],
  ["existing", "5 | Welche Adressen und Anbieter?"],
  ["brandingStatus", "6 | Logo oder eigene Bilder vorhanden?"],
  ["branding", "6 | Welche Farben, Bilder und Wünsche?"],
  ["googleStatus", "7 | Google-Profil oder Firmenkonto vorhanden?"],
  ["google", "7 | Welches Google-Profil und Konto?"],
  ["contactMethods", "8 | Wie sollen Kunden Sie kontaktieren?"],
  ["examples", "9 | Welche Websites gefallen Ihnen?"],
  ["launch", "9 | Wann soll die Website starten?"],
  ["missing", "Noch zu ergänzen"],
  ["privacy", "Datenschutzhinweise bestätigt"],
  ["originalLead", "Ursprüngliche Lead-ID (IXA intern)"],
  ["agreementAt", "Auftrag bestätigt am (IXA intern)"],
  ["orderValue", "Bestätigter Auftragswert (IXA intern)"],
  ["currency", "Währung"],
  ["gclid", "Ursprüngliche GCLID (IXA intern)"],
  ["adsConsent", "ad_user_data (Nachweis erforderlich)"],
  ["adsApproval", "Google-Ads-Export freigegeben?"],
  ["submissionId", "Vorgang-ID"],
  ["digest", "Inhalt-Prüfsumme"],
  ["emailStatus", "E-Mail-Status"],
  ["emailId", "E-Mail-ID"],
  ["tracking", "GA4-Sendeversuch (UTC)"],
] as const;
export const intakeSheetHeaders = intakeSheetColumns.map(([, label]) => label);

export function missingIntakeDetails(data: IntakeAnswers): string[] {
  const missing: string[] = (
    ["address", "legalForm", "services", "regions"] as const
  )
    .filter((key) => !data[key])
    .map((key) => intakeFields[key].label);
  if (data.taxStatus === "later") missing.push("USt-IdNr. / W-IdNr. klären");
  if (data.taxStatus === "yes" && !data.vatId && !data.businessId)
    missing.push("Vorhandene USt-IdNr. / W-IdNr. nachreichen");
  if (data.registerStatus === "yes" && !data.register)
    missing.push("Registerangaben nachreichen");
  if (data.regulatedStatus === "yes" && !data.regulatedDetails)
    missing.push("Berufsrechtliche Angaben nachreichen");
  return missing;
}

export function intakeSheetValues(
  data: IntakeAnswers,
  id: string,
  digest: string,
): string[] {
  const values: Record<string, string> = {};
  for (const key of Object.keys(intakeFields) as Array<
    keyof typeof intakeFields
  >)
    values[key] = data[key];
  for (const [key, choice] of Object.entries(intakeChoices))
    values[key] = choice.options[data[key as keyof typeof intakeChoices]];
  Object.assign(values, {
    receivedAt: new Date().toISOString(),
    status: "Eingegangen",
    contactMethods: data.contactMethods
      .map((key) => contactOptions[key])
      .join(", "),
    recipientEmail: data.recipientEmail || data.email,
    missing: missingIntakeDetails(data).join("; "),
    privacy: "Ja",
    currency: "EUR",
    adsConsent: "UNKNOWN",
    adsApproval: "Nicht freigegeben",
    submissionId: id,
    digest,
    emailStatus: "Ausstehend",
  });
  return intakeSheetColumns.map(([key]) => values[key] || "");
}

export function intakeReceiverConfig() {
  const value =
    process.env.OUTREACH_SHEET_WEBHOOK_URL?.trim() ||
    process.env.WHATSAPP_SHEET_WEBHOOK_URL?.trim() ||
    "";
  const secret =
    process.env.OUTREACH_SHEET_WEBHOOK_SECRET?.trim() ||
    process.env.WHATSAPP_SHEET_WEBHOOK_SECRET?.trim() ||
    "";
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname) ||
      secret.length < 32
    )
      return null;
    return { url: url.toString(), secret };
  } catch {
    return null;
  }
}

export async function writeIntakeSheet(
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const config = intakeReceiverConfig();
  if (!config) return null;
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        schemaVersion: 2,
        recordType: "client_intake",
        _secret: config.secret,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (
      result?.ok !== true ||
      result.submissionId !== body.submissionId ||
      result.sheetId !== INTAKE_SHEET_ID ||
      !Number.isInteger(result.rowNumber) ||
      result.rowNumber < 2
    )
      return null;
    return result;
  } catch {
    return null;
  }
}

export function intakeRecordUrl(row: number): string {
  return `${INTAKE_SHEET_URL}&range=A${row}:AC${row}`;
}
