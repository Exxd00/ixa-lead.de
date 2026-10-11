import {
  contactOptions,
  intakeFields,
  type IntakeAnswers,
  type IntakeField,
} from "./client-intake";

export function escapeIntakeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function intakeEmail(data: IntakeAnswers, submissionId: string) {
  const groups: Array<{ title: string; keys: IntakeField[] }> = [
    { title: "01 · Unternehmen", keys: ["company", "owner", "address"] },
    {
      title: "02 · Dienstleistungen & Einsatzgebiet",
      keys: ["services", "regions"],
    },
    { title: "03 · Kontaktdaten", keys: ["phone", "whatsapp", "email"] },
    { title: "04 · Erreichbarkeit", keys: ["hours"] },
    { title: "05 · Vorhandene Technik", keys: ["existing"] },
    { title: "06 · Logo, Farben & Fotos", keys: ["branding"] },
    { title: "07 · Google", keys: ["google"] },
    { title: "08 · Bevorzugte Kontaktwege", keys: [] },
    { title: "09 · Beispiele & Starttermin", keys: ["examples", "launch"] },
  ];
  const sections = groups.map((group) => {
    const rows = group.keys.length
      ? group.keys.map((key) => ({
          label: intakeFields[key].label,
          value: data[key] || "Nicht angegeben",
        }))
      : [
          {
            label: "Kontaktwege",
            value:
              data.contactMethods
                .map((method) => contactOptions[method])
                .join(", ") || "Nicht angegeben",
          },
        ];
    return { ...group, rows };
  });
  return {
    subject: `Website-Fragebogen · ${data.company.replace(/[\r\n]/g, " ")}`,
    text: [
      "IXA Leads | Neuer Website-Fragebogen",
      "",
      ...sections.flatMap((group) => [
        group.title,
        ...group.rows.map((row) => `${row.label}: ${row.value}`),
        "",
      ]),
      "Datenschutzhinweise bestätigt: Ja",
      `Vorgang: ${submissionId}`,
    ].join("\n"),
    html: `<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#edf6f4;font-family:Arial,Helvetica,sans-serif;color:#163230"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #d5e7e2;border-radius:18px;overflow:hidden"><tr><td style="padding:28px 24px;background:#050606"><div style="color:#64e0d5;font-size:12px;font-weight:700;letter-spacing:.1em">IXA LEADS · WEBSITE-FRAGEBOGEN</div><h1 style="color:#fff;font-size:26px;line-height:1.3;overflow-wrap:anywhere;margin:12px 0">${escapeIntakeHtml(data.company)}</h1><p style="margin:0;color:#cfebe5;font-size:15px">Alle Angaben für die Vorbereitung der Website.</p></td></tr><tr><td style="padding:8px 24px 24px">${sections.map((group) => `<h2 style="margin:24px 0 12px;padding-bottom:9px;border-bottom:2px solid #b9f4ee;font-size:16px;color:#163230">${group.title}</h2>${group.rows.map((row) => `<div style="margin:0 0 16px"><div style="font-size:12px;font-weight:700;color:#57746c;margin-bottom:5px">${row.label}</div><div style="font-size:16px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${escapeIntakeHtml(row.value)}</div></div>`).join("")}`).join("")}<p style="font-size:12px;color:#57746c;margin:24px 0 0">Datenschutzhinweise bestätigt. Vorgang: ${submissionId}</p></td></tr><tr><td style="padding:18px 24px;background:#e9f8f5;font-size:12px;color:#526966">IXA Leads · ixa-leads.de/kundenfragebogen</td></tr></table></td></tr></table></body></html>`,
  };
}
