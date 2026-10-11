import {
  intakeChoices,
  contactOptions,
  type IntakeAnswers,
} from "./client-intake";
import { missingIntakeDetails } from "./client-intake-sheet";

export function escapeIntakeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function intakeEmail(
  data: IntakeAnswers,
  submissionId: string,
  recordUrl = "https://ixa-leads.de/info",
) {
  const yesNo = (key: keyof typeof intakeChoices) =>
    intakeChoices[key].options[data[key]];
  const groups = [
    {
      title: "Kontakt",
      rows: [
        ["Ansprechpartner", data.owner],
        ["Telefon", data.phone],
        ["WhatsApp", data.whatsapp],
        ["E-Mail", data.email],
        ...(data.recipientEmail && data.recipientEmail !== data.email
          ? [["Neue Website-Anfragen an", data.recipientEmail]]
          : []),
      ],
    },
    {
      title: "Unternehmen & Impressum",
      rows: [
        ["Rechtsform", data.legalForm],
        ["Adresse", data.address],
        [
          "USt-IdNr. / W-IdNr.",
          [data.vatId, data.businessId].filter(Boolean).join(" · ") ||
            yesNo("taxStatus"),
        ],
        ["Register", data.register || yesNo("registerStatus")],
        [
          "Berufliche Zulassung",
          data.regulatedDetails || yesNo("regulatedStatus"),
        ],
      ],
    },
    {
      title: "Website & Erreichbarkeit",
      rows: [
        ["Wichtigste Leistungen", data.services],
        ["Orte / Regionen", data.regions],
        ["Zeiten", data.hours],
        [
          "Kontaktwege",
          data.contactMethods.map((key) => contactOptions[key]).join(", "),
        ],
      ],
    },
    {
      title: "Bereits vorhanden",
      rows: [
        [
          "Domain / Website / Postfach",
          [yesNo("existingStatus"), data.existing].filter(Boolean).join("\n"),
        ],
        [
          "Logo / Farben / Bilder",
          [yesNo("brandingStatus"), data.branding].filter(Boolean).join("\n"),
        ],
        [
          "Google",
          [yesNo("googleStatus"), data.google].filter(Boolean).join("\n"),
        ],
      ],
    },
    {
      title: "Wünsche & Termin",
      rows: [
        ["Beispiele", data.examples],
        ["Wunschtermin", data.launch],
      ],
    },
  ]
    .map((group) => ({
      ...group,
      rows: group.rows.filter(([, value]) => Boolean(value)),
    }))
    .filter((group) => group.rows.length);
  const missing = missingIntakeDetails(data);
  const text = [
    `IXA | Website-Daten: ${data.company}`,
    `Kundendaten nach Projektvereinbarung · Referenz ${submissionId.slice(0, 8).toUpperCase()}`,
    "",
    ...groups.flatMap((group) => [
      group.title,
      ...group.rows.map(([label, value]) => `${label}: ${value}`),
      "",
    ]),
    ...(missing.length ? [`Noch zu ergänzen: ${missing.join("; ")}`, ""] : []),
    `Vollständiger Datensatz: ${recordUrl}`,
    "Datenschutzhinweise bestätigt.",
  ].join("\n");
  const html = `<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f5f7f6;color:#182b26;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:18px 12px" align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #dce6e0;border-radius:12px"><tr><td style="padding:22px 20px"><p style="font-size:12px;color:#466259;margin:0 0 8px">IXA · WEBSITE-DATEN</p><h1 style="margin:0 0 8px;font-size:23px;line-height:1.3;overflow-wrap:anywhere">${escapeIntakeHtml(data.company)}</h1><p style="margin:0 0 20px;font-size:13px;color:#52675f">Projektvorbereitung · ${submissionId.slice(0, 8).toUpperCase()}</p><a href="${escapeIntakeHtml(recordUrl)}" style="display:inline-block;padding:12px 16px;background:#b9f3df;color:#16372c;border-radius:7px;font-size:14px;font-weight:bold;text-decoration:none">Datensatz im Sheet öffnen</a>${missing.length ? `<p style="padding:12px;background:#fff5dc;font-size:14px;line-height:1.5;border-radius:7px"><strong>Noch zu ergänzen:</strong><br>${escapeIntakeHtml(missing.join(" · "))}</p>` : ""}${groups.map((group) => `<h2 style="margin:22px 0 10px;padding-bottom:7px;border-bottom:1px solid #dce6e0;font-size:15px">${group.title}</h2>${group.rows.map(([label, value]) => `<p style="margin:0 0 11px;font-size:14px;line-height:1.55;overflow-wrap:anywhere;word-break:break-word"><strong style="color:#476157">${label}:</strong><br>${escapeIntakeHtml(value).replaceAll("\n", "<br>")}</p>`).join("")}`).join("")}<p style="margin:22px 0 0;font-size:11px;color:#62796f">Datenschutzhinweise bestätigt · IXA Leads</p></td></tr></table></td></tr></table></body></html>`;
  return {
    subject: `Website-Daten · ${data.company.replace(/[\r\n]/g, " ")}`,
    text,
    html,
  };
}
