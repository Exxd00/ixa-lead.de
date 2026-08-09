const SCHEMA_VERSION = 1;
const SHEET_NAME = "Anfragen";

const HEADERS = [
  "Eingegangen",
  "Gewünschte Leistung",
  "Unternehmen",
  "Ansprechpartner",
  "Telefon / E-Mail",
  "Website",
  "Hauptleistung",
  "Zielregion",
  "Ausgangslage",
  "Freie Kapazität",
  "Typischer Auftragswert",
  "Größtes Problem",
  "GCLID",
  "Kontaktweg",
  "Status",
  "Erreicht",
  "Qualifizierte Anfrage",
  "Angebot / Termin",
  "Auftrag",
  "Umsatz",
  "Notizen",
  "Eingang-ID (intern)",
];

const HEADER_COLORS = [
  "#3157D5", "#3157D5", "#3157D5", "#3157D5", "#3157D5",
  "#3157D5", "#3157D5", "#3157D5", "#3157D5", "#3157D5",
  "#3157D5", "#3157D5", "#3157D5", "#3157D5", "#D97706",
  "#0F766E", "#6D28D9", "#B45309", "#15803D", "#166534",
  "#475569", "#94A3B8",
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

      const sheet = prepareSheet_(SpreadsheetApp.openById(spreadsheetId));
      const lastRow = sheet.getLastRow();
      const idColumn = HEADERS.indexOf("Eingang-ID (intern)") + 1;

      if (lastRow > 1) {
        const existing = sheet
          .getRange(2, idColumn, lastRow - 1, 1)
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

      const receivedAt = new Date(body.receivedAt || "");
      const row = [
        Number.isNaN(receivedAt.getTime()) ? body.receivedAt : receivedAt,
        body.neededService,
        body.company,
        body.name,
        body.contact,
        body.url,
        body.serviceFocus,
        body.serviceArea,
        body.projectDetail,
        body.capacity,
        body.orderValueRange,
        body.problem,
        body.gclid,
        body.contactMethod || body.submissionType,
        "Neu",
        false,
        false,
        "",
        false,
        "",
        "",
        body.submissionId,
      ].map((value) =>
        value instanceof Date || typeof value === "boolean"
          ? value
          : safeCell_(value),
      );

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
  return { ok: true, sheet: sheet.getName(), columns: HEADERS.length };
}

function prepareSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const currentHeaders = sheet
      .getRange(1, 1, 1, HEADERS.length)
      .getDisplayValues()[0];
    if (currentHeaders.join("\u001f") !== HEADERS.join("\u001f")) {
      throw new Error("header_mismatch");
    }
  }

  formatSheet_(sheet);
  return sheet;
}

function formatSheet_(sheet) {
  const maxRows = Math.max(sheet.getMaxRows(), 2);
  const statusColumn = HEADERS.indexOf("Status") + 1;
  const reachedColumn = HEADERS.indexOf("Erreicht") + 1;
  const qualifiedColumn = HEADERS.indexOf("Qualifizierte Anfrage") + 1;
  const orderColumn = HEADERS.indexOf("Auftrag") + 1;
  const revenueColumn = HEADERS.indexOf("Umsatz") + 1;
  const idColumn = HEADERS.indexOf("Eingang-ID (intern)") + 1;

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.setRowHeight(1, 42);
  sheet
    .getRange(1, 1, 1, HEADERS.length)
    .setBackgrounds([HEADER_COLORS])
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left")
    .setWrap(true);

  const widths = [
    145, 230, 180, 170, 200, 220, 180, 180, 260, 260, 170,
    280, 200, 120, 140, 100, 170, 180, 100, 120, 280, 100,
  ];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));

  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat("dd.MM.yyyy HH:mm");
  sheet
    .getRange(2, 1, maxRows - 1, HEADERS.length)
    .setVerticalAlignment("top")
    .setWrap(true);
  sheet.getRange(2, revenueColumn, maxRows - 1, 1).setNumberFormat('#,##0.00 "€"');

  sheet.getRange(2, reachedColumn, maxRows - 1, 1).insertCheckboxes();
  sheet.getRange(2, qualifiedColumn, maxRows - 1, 1).insertCheckboxes();
  sheet.getRange(2, orderColumn, maxRows - 1, 1).insertCheckboxes();

  const statusValues = [
    "Neu",
    "Kontaktiert",
    "Qualifiziert",
    "Angebot / Termin",
    "Auftrag",
    "Nicht passend",
  ];
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusColumn, maxRows - 1, 1).setDataValidation(statusValidation);

  const statusRange = sheet.getRange(2, statusColumn, maxRows - 1, 1);
  const statusRules = [
    ["Neu", "#FEF3C7", "#92400E"],
    ["Kontaktiert", "#DBEAFE", "#1E40AF"],
    ["Qualifiziert", "#EDE9FE", "#5B21B6"],
    ["Angebot / Termin", "#FFEDD5", "#9A3412"],
    ["Auftrag", "#DCFCE7", "#166534"],
    ["Nicht passend", "#FEE2E2", "#991B1B"],
  ].map(([value, background, fontColor]) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(value)
      .setBackground(background)
      .setFontColor(fontColor)
      .setRanges([statusRange])
      .build(),
  );
  sheet.setConditionalFormatRules(statusRules);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, maxRows, HEADERS.length).createFilter();
  }
  sheet.hideColumns(idColumn);
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
