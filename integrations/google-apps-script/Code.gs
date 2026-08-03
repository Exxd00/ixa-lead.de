const SCHEMA_VERSION = 1;

const HEADERS = [
  "Eingang-ID",
  "Empfangen UTC",
  "Quelle",
  "Formulartyp",
  "Einstieg",
  "Leistung-ID",
  "Gewünschte Leistung",
  "Branche",
  "Analyse-Art",
  "Kontaktweg",
  "Name",
  "Kontakt",
  "Unternehmen",
  "Website",
  "Hauptleistung",
  "Einsatzgebiet",
  "Freie Kapazität",
  "Auftragswert",
  "Werbebudget",
  "Startzeitpunkt",
  "Termin-Ort",
  "Terminwunsch",
  "Projektsituation",
  "Anliegen",
  "Landingpage",
  "Referrer",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "UTM Term",
  "UTM Content",
  "Status",
  "Erstkontakt",
  "Qualifizierung",
  "Angebot EUR",
  "Ergebnis",
  "Notizen",
];

function doGet() {
  return json_({ ok: true, service: "ixa-leads.de", schemaVersion: SCHEMA_VERSION });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty("WEBHOOK_SECRET");

    if (!expectedSecret || body._secret !== expectedSecret) {
      return json_({ ok: false, error: "unauthorized" });
    }

    if (
      body.schemaVersion !== SCHEMA_VERSION ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(body.submissionId || ""),
      )
    ) {
      return json_({ ok: false, error: "invalid_payload" });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return json_({ ok: false, error: "busy" });
    }

    try {
      const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
      if (!spreadsheetId) throw new Error("missing_spreadsheet_id");

      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = prepareSheet_(spreadsheet);
      const lastRow = sheet.getLastRow();

      if (lastRow > 1) {
        const existing = sheet
          .getRange(2, 1, lastRow - 1, 1)
          .createTextFinder(body.submissionId)
          .matchEntireCell(true)
          .matchCase(true)
          .findNext();

        if (existing) {
          return json_({
            ok: true,
            duplicate: true,
            submissionId: body.submissionId,
          });
        }
      }

      const row = [
        body.submissionId,
        body.receivedAt,
        body.source,
        body.submissionType,
        body.entryPoint,
        body.serviceId,
        body.neededService,
        body.branch,
        body.auditType,
        body.contactMethod,
        body.name,
        body.contact,
        body.company,
        body.url,
        body.serviceFocus,
        body.serviceArea,
        body.capacity,
        body.orderValueRange,
        body.adBudgetReadiness,
        body.startTiming,
        body.visitLocation,
        body.visitWindow,
        body.projectDetail,
        body.problem,
        body.landingPath,
        body.referrerHost,
        body.utmSource,
        body.utmMedium,
        body.utmCampaign,
        body.utmTerm,
        body.utmContent,
        "Neu",
        "",
        "",
        "",
        "",
        "",
      ].map(safeCell_);

      sheet
        .getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.length)
        .setValues([row]);
      SpreadsheetApp.flush();

      return json_({
        ok: true,
        duplicate: false,
        submissionId: body.submissionId,
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: "receiver_error" });
  }
}

function setupSheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("missing_spreadsheet_id");

  const sheet = prepareSheet_(SpreadsheetApp.openById(spreadsheetId));
  sheet.autoResizeColumns(1, HEADERS.length);
  return { ok: true, sheet: sheet.getName(), columns: HEADERS.length };
}

function prepareSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName("Leads");
  if (!sheet) sheet = spreadsheet.insertSheet("Leads");

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const currentHeaders = sheet
      .getRange(1, 1, 1, HEADERS.length)
      .getDisplayValues()[0];

    if (currentHeaders.join("\u001f") !== HEADERS.join("\u001f")) {
      throw new Error("header_mismatch");
    }
  }

  return sheet;
}

function safeCell_(value) {
  const text = String(value == null ? "" : value).trim().slice(0, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
