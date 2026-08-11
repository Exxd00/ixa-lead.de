const SCHEMA_VERSION = 1;
const SHEET_NAME = "Anfragen";
const CONVERSIONS_SHEET_NAME = "Conversions";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const CONVERSION_HEADERS = [
  "Erfasst am",
  "Conversion",
  "GA4-Ereignis",
  "Bereich der Website",
  "Leistung",
  "Seite",
  "Verweisende Website",
  "GCLID",
  "UTM-Quelle",
  "UTM-Medium",
  "UTM-Kampagne",
  "UTM-Suchbegriff",
  "UTM-Inhalt",
  "Anfrage-ID (intern)",
  "Event-ID (intern)",
];

const CONVERSION_HEADER_COLORS = [
  "#3157D5",
  "#15803D",
  "#15803D",
  "#6D28D9",
  "#3157D5",
  "#6D28D9",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#94A3B8",
  "#94A3B8",
];

const CONVERSION_EVENT_LABELS = {
  ixa_conversion_thank_you: "Formular erfolgreich abgeschlossen",
  ixa_conversion_phone_call: "Direkten Anruf bestätigt",
  ixa_conversion_callback: "Rückruf erfolgreich angefordert",
  ixa_conversion_whatsapp: "WhatsApp-Weiterleitung bestätigt",
};

const SERVICE_LABELS = {
  "website-check": "Kostenlose Anfrage-Potenzialanalyse",
  startklar: "IXA Anfrage-System – 90 Tage",
  "website-system": "Website-System als digitale Grundlage",
  betreuung: "IXA Anfrage-Optimierung",
  callback: "Rückrufwunsch",
};

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

    if (body.schemaVersion !== SCHEMA_VERSION) {
      return json_({ ok: false, error: "invalid_payload" });
    }

    const isConversion = body.recordType === "conversion_event";
    const isLead =
      body.recordType == null ||
      body.recordType === "" ||
      body.recordType === "lead" ||
      body.recordType === "lead_submission";

    if (!isConversion && !isLead) {
      return json_({ ok: false, error: "invalid_record_type" });
    }

    if (isConversion) {
      if (
        !isUuidV4_(body.eventId) ||
        !Object.prototype.hasOwnProperty.call(
          CONVERSION_EVENT_LABELS,
          String(body.eventName || ""),
        )
      ) {
        return json_({ ok: false, error: "invalid_conversion_event" });
      }
    } else if (!isUuidV4_(body.submissionId)) {
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
      return isConversion
        ? saveConversion_(spreadsheet, body)
        : saveLead_(spreadsheet, body);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: "receiver_error" });
  }
}

function setupSheets() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("missing_spreadsheet_id");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const leadsSheet = prepareSheet_(spreadsheet, true);
  const conversionsSheet = prepareConversionsSheet_(spreadsheet, true);
  SpreadsheetApp.flush();

  return {
    ok: true,
    // Keep the original properties for callers of the former setupSheet().
    sheet: leadsSheet.getName(),
    columns: HEADERS.length,
    sheets: [
      { name: leadsSheet.getName(), columns: HEADERS.length },
      { name: conversionsSheet.getName(), columns: CONVERSION_HEADERS.length },
    ],
  };
}

// Backward-compatible alias used by the previous installation instructions.
function setupSheet() {
  return setupSheets();
}

function saveLead_(spreadsheet, body) {
  const sheet = prepareSheet_(spreadsheet, false);
  const lastRow = sheet.getLastRow();
  const idColumn = HEADERS.indexOf("Eingang-ID (intern)") + 1;

  if (hasId_(sheet, idColumn, body.submissionId)) {
    return json_({
      ok: true,
      duplicate: true,
      submissionId: body.submissionId,
    });
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

  sheet.getRange(lastRow + 1, 1, 1, HEADERS.length).setValues([row]);
  SpreadsheetApp.flush();

  return json_({
    ok: true,
    duplicate: false,
    submissionId: body.submissionId,
  });
}

function saveConversion_(spreadsheet, body) {
  const sheet = prepareConversionsSheet_(spreadsheet, false);
  const lastRow = sheet.getLastRow();
  const idColumn = CONVERSION_HEADERS.indexOf("Event-ID (intern)") + 1;

  if (hasId_(sheet, idColumn, body.eventId)) {
    return json_({ ok: true, duplicate: true, eventId: body.eventId });
  }

  const eventName = String(body.eventName);
  const occurredAt = new Date(body.occurredAt || "");
  const row = [
    Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    CONVERSION_EVENT_LABELS[eventName],
    eventName,
    body.entryPoint || body.location,
    SERVICE_LABELS[String(body.serviceId || "")] || body.serviceId,
    body.landingPath || body.pagePath,
    body.referrerHost,
    body.gclid,
    body.utmSource,
    body.utmMedium,
    body.utmCampaign,
    body.utmTerm,
    body.utmContent,
    body.submissionId,
    body.eventId,
  ].map((value) => (value instanceof Date ? value : safeCell_(value)));

  sheet
    .getRange(lastRow + 1, 1, 1, CONVERSION_HEADERS.length)
    .setValues([row]);
  SpreadsheetApp.flush();

  return json_({ ok: true, duplicate: false, eventId: body.eventId });
}

function hasId_(sheet, idColumn, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  return Boolean(
    sheet
      .getRange(2, idColumn, lastRow - 1, 1)
      .createTextFinder(String(id))
      .matchEntireCell(true)
      .matchCase(true)
      .findNext(),
  );
}

function prepareSheet_(spreadsheet, applyFullFormatting) {
  const prepared = prepareStructuredSheet_(
    spreadsheet,
    SHEET_NAME,
    HEADERS,
  );
  if (prepared.created) formatHeader_(prepared.sheet, HEADER_COLORS);
  if (applyFullFormatting) formatSheet_(prepared.sheet);
  return prepared.sheet;
}

function prepareConversionsSheet_(spreadsheet, applyFullFormatting) {
  const prepared = prepareStructuredSheet_(
    spreadsheet,
    CONVERSIONS_SHEET_NAME,
    CONVERSION_HEADERS,
  );
  if (prepared.created) {
    formatHeader_(prepared.sheet, CONVERSION_HEADER_COLORS);
  }
  if (applyFullFormatting) formatConversionsSheet_(prepared.sheet);
  return prepared.sheet;
}

/**
 * Never make a live enquiry fail only because an older/manual sheet has a
 * different first row. Preserve that tab as a recoverable archive and create
 * a clean active tab with the expected schema. The receiver deliberately does
 * only the light header work; setupSheets() owns the expensive full formatting.
 */
function prepareStructuredSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  let created = false;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    created = true;
  } else if (sheet.getLastRow() > 0) {
    ensureColumnCapacity_(sheet, headers.length);
    const currentHeaders = sheet
      .getRange(1, 1, 1, headers.length)
      .getDisplayValues()[0];
    if (currentHeaders.join("\u001f") !== headers.join("\u001f")) {
      const archiveName = nextArchiveName_(spreadsheet, sheetName);
      sheet.setName(archiveName);
      console.warn(
        "Archived incompatible sheet " + sheetName + " as " + archiveName,
      );
      sheet = spreadsheet.insertSheet(sheetName);
      created = true;
    }
  }

  ensureColumnCapacity_(sheet, headers.length);
  if (created || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return { sheet: sheet, created: created };
}

function ensureColumnCapacity_(sheet, requiredColumns) {
  const missingColumns = requiredColumns - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function nextArchiveName_(spreadsheet, sheetName) {
  const timeZone = Session.getScriptTimeZone() || "Europe/Berlin";
  const stamp = Utilities.formatDate(new Date(), timeZone, "yyyy-MM-dd HHmmss");
  const base = (sheetName + " Archiv " + stamp).slice(0, 96);
  let candidate = base;
  let suffix = 2;

  while (spreadsheet.getSheetByName(candidate)) {
    candidate = (base.slice(0, 93) + " " + suffix).slice(0, 100);
    suffix += 1;
  }

  return candidate;
}

function formatHeader_(sheet, colors) {
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 42);
  sheet
    .getRange(1, 1, 1, colors.length)
    .setBackgrounds([colors])
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left")
    .setWrap(true);
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
  formatHeader_(sheet, HEADER_COLORS);

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

function formatConversionsSheet_(sheet) {
  const maxRows = Math.max(sheet.getMaxRows(), 2);
  const eventColumn = CONVERSION_HEADERS.indexOf("Conversion") + 1;

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  formatHeader_(sheet, CONVERSION_HEADER_COLORS);

  const widths = [
    145, 250, 245, 190, 230, 220, 210, 200, 150, 150, 190, 180, 180, 110,
    100,
  ];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));

  const dataRange = sheet.getRange(
    2,
    1,
    maxRows - 1,
    CONVERSION_HEADERS.length,
  );
  dataRange.setVerticalAlignment("top").setWrap(true);
  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat("dd.MM.yyyy HH:mm");

  const rules = [
    ["Formular erfolgreich abgeschlossen", "#DCFCE7", "#166534"],
    ["Direkten Anruf bestätigt", "#DBEAFE", "#1E40AF"],
    ["Rückruf erfolgreich angefordert", "#EDE9FE", "#5B21B6"],
    ["WhatsApp-Weiterleitung bestätigt", "#D1FAE5", "#065F46"],
  ].map(([label, background, fontColor]) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$${columnLetter_(eventColumn)}2="${label}"`)
      .setBackground(background)
      .setFontColor(fontColor)
      .setRanges([dataRange])
      .build(),
  );
  sheet.setConditionalFormatRules(rules);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, maxRows, CONVERSION_HEADERS.length).createFilter();
  }
  const submissionIdColumn =
    CONVERSION_HEADERS.indexOf("Anfrage-ID (intern)") + 1;
  sheet.hideColumns(submissionIdColumn, 2);
}

function columnLetter_(column) {
  let value = Number(column);
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function isUuidV4_(value) {
  return UUID_V4_PATTERN.test(String(value || ""));
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
