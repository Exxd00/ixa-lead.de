const SCHEMA_VERSION = 1;
const SHEET_NAME = "Anfragen";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HEADERS = [
  "Zeitpunkt",
  "Ereignis",
  "Leistung",
  "Unternehmen",
  "Name",
  "Telefon / E-Mail",
  "Website",
  "Hauptleistung",
  "Stadt / Region",
  "Aktuelle Situation",
  "Freie Kapazität",
  "Auftragswert",
  "Größtes Problem",
  "Kontaktweg",
  "Bereich / Seite",
  "GCLID",
  "Quelle / Kampagne",
  "Status",
  "Notizen",
  "Lead-Bewertung",
  "Datensatz-ID (intern)",
];

const HEADER_COLORS = [
  "#172033",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#3157D5",
  "#6D28D9",
  "#6D28D9",
  "#6D28D9",
  "#6D28D9",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#0F766E",
  "#D97706",
  "#475569",
  "#B45309",
  "#94A3B8",
];

const EVENT_LABELS = {
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

const CONTACT_LABELS = {
  phone: "Telefon",
  telephone: "Telefon",
  whatsapp: "WhatsApp",
  email: "E-Mail",
  callback: "Rückruf",
  lead_form: "Formular",
};

const ENTRY_LABELS = {
  callback: "Rückruf-Fenster",
  contact_form: "Anfrageformular",
  floating_phone: "Schwebender Telefon-Button",
  floating_whatsapp: "Schwebender WhatsApp-Button",
  header: "Kopfbereich",
  hero: "Startbereich",
  footer: "Fußbereich",
};

function doGet() {
  return json_({
    ok: true,
    service: "ixa-leads.de",
    schemaVersion: SCHEMA_VERSION,
    sheet: SHEET_NAME,
  });
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
          EVENT_LABELS,
          String(body.eventName || ""),
        ) ||
        (body.submissionId && !isUuidV4_(body.submissionId))
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
      const prepared = prepareCanonicalSheet_(spreadsheet);
      if (prepared.created) cleanupOtherSheets_(spreadsheet, prepared.sheet);

      return isConversion
        ? saveConversion_(prepared.sheet, body)
        : saveLead_(prepared.sheet, body);
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
  const prepared = prepareCanonicalSheet_(spreadsheet);
  formatSheet_(prepared.sheet);
  cleanupOtherSheets_(spreadsheet, prepared.sheet);
  SpreadsheetApp.flush();

  return {
    ok: true,
    sheet: prepared.sheet.getName(),
    columns: HEADERS.length - 1,
    internalColumns: 1,
  };
}

// Backward-compatible alias for older installation instructions.
function setupSheet() {
  return setupSheets();
}

function saveLead_(sheet, body) {
  const existingRow = findRowById_(sheet, body.submissionId);
  if (existingRow) {
    return json_({
      ok: true,
      duplicate: true,
      submissionId: body.submissionId,
    });
  }

  const isCallback =
    body.submissionType === "callback" || body.serviceId === "callback";
  const receivedAt = validDateOrNow_(body.receivedAt);
  const row = [
    receivedAt,
    isCallback ? "Rückruf angefordert" : "Formular eingegangen",
    serviceLabel_(body.serviceId, body.neededService),
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
    isCallback
      ? "Rückruf"
      : contactLabel_(body.contactMethod || body.submissionType),
    areaAndPage_(body.entryPoint, body.landingPath),
    body.gclid,
    sourceAndCampaign_(body),
    "Neu",
    "",
    "Noch offen",
    body.submissionId,
  ].map((value) =>
    value instanceof Date ? value : safeCell_(value),
  );

  const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
  sheet
    .getRange(rowNumber, column_("Telefon / E-Mail"))
    .setNumberFormat("@");
  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([row]);
  formatAppendedRow_(sheet, rowNumber);
  SpreadsheetApp.flush();

  return json_({
    ok: true,
    duplicate: false,
    submissionId: body.submissionId,
  });
}

function saveConversion_(sheet, body) {
  const eventName = String(body.eventName || "");
  const eventLabel = EVENT_LABELS[eventName];
  const mergesWithLead =
    eventName === "ixa_conversion_thank_you" ||
    eventName === "ixa_conversion_callback";

  if (mergesWithLead && body.submissionId) {
    const leadRow = findRowById_(sheet, body.submissionId);
    if (leadRow) {
      const eventColumn = column_("Ereignis");
      const currentLabel = sheet.getRange(leadRow, eventColumn).getDisplayValue();
      const duplicate = currentLabel === eventLabel;
      if (!duplicate) {
        sheet.getRange(leadRow, eventColumn).setValue(eventLabel);
      }
      fillConversionContext_(sheet, leadRow, body);
      SpreadsheetApp.flush();
      return json_({
        ok: true,
        duplicate: duplicate,
        eventId: body.eventId,
      });
    }
  }

  const recordId = body.eventId;
  if (findRowById_(sheet, recordId)) {
    return json_({ ok: true, duplicate: true, eventId: body.eventId });
  }

  const isAnonymousContact =
    eventName === "ixa_conversion_phone_call" ||
    eventName === "ixa_conversion_whatsapp";
  const row = [
    validDateOrNow_(body.occurredAt),
    eventLabel,
    serviceLabel_(body.serviceId, ""),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    conversionContactLabel_(eventName),
    areaAndPage_(body.entryPoint, body.landingPath || body.pagePath),
    body.gclid,
    sourceAndCampaign_(body),
    isAnonymousContact ? "" : "Neu",
    "",
    isAnonymousContact ? "" : "Noch offen",
    recordId,
  ].map((value) =>
    value instanceof Date ? value : safeCell_(value),
  );

  const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([row]);
  formatAppendedRow_(sheet, rowNumber);
  SpreadsheetApp.flush();

  return json_({ ok: true, duplicate: false, eventId: body.eventId });
}

function fillConversionContext_(sheet, rowNumber, body) {
  const values = [
    ["Bereich / Seite", areaAndPage_(body.entryPoint, body.landingPath)],
    ["GCLID", safeCell_(body.gclid)],
    ["Quelle / Kampagne", sourceAndCampaign_(body)],
  ];

  values.forEach(function (entry) {
    const column = column_(entry[0]);
    const cell = sheet.getRange(rowNumber, column);
    if (!cell.getDisplayValue() && entry[1]) cell.setValue(entry[1]);
  });
}

function prepareCanonicalSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  let created = false;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    created = true;
  } else {
    ensureColumnCapacity_(sheet, HEADERS.length);
    if (sheet.getLastRow() > 0 && !hasCanonicalHeaders_(sheet)) {
      const legacySheet = sheet;
      legacySheet.setName(nextArchiveName_(spreadsheet, SHEET_NAME));
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      created = true;
      legacySheet.hideSheet();
    }
  }

  ensureColumnCapacity_(sheet, HEADERS.length);
  if (created || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    formatNewSheet_(sheet);
  }
  sheet.showSheet();

  return { sheet: sheet, created: created };
}

function hasCanonicalHeaders_(sheet) {
  const current = sheet
    .getRange(1, 1, 1, HEADERS.length)
    .getDisplayValues()[0];
  return current.join("\u001f") === HEADERS.join("\u001f");
}

function cleanupOtherSheets_(spreadsheet, canonicalSheet) {
  const sheets = spreadsheet.getSheets().slice();

  sheets.forEach(function (sheet) {
    if (sheet.getSheetId() === canonicalSheet.getSheetId()) return;

    const name = sheet.getName();
    const isDefaultSheet = name === "Sheet1" || name === "Tabelle1";
    if (isDefaultSheet && sheet.getLastRow() === 0 && sheets.length > 1) {
      spreadsheet.deleteSheet(sheet);
      return;
    }

    if (name === "Conversions" || isDefaultSheet) {
      sheet.setName(nextArchiveName_(spreadsheet, name));
    }
    sheet.hideSheet();
  });

  canonicalSheet.showSheet();
  spreadsheet.setActiveSheet(canonicalSheet);
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

function ensureColumnCapacity_(sheet, requiredColumns) {
  const missingColumns = requiredColumns - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function formatNewSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.setRowHeight(1, 44);
  sheet
    .getRange(1, 1, 1, HEADERS.length)
    .setBackgrounds([HEADER_COLORS])
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left")
    .setWrap(true);
  sheet
    .getRange(
      2,
      column_("Telefon / E-Mail"),
      Math.max(sheet.getMaxRows() - 1, 1),
      1,
    )
    .setNumberFormat("@");
  sheet.hideColumns(column_("Datensatz-ID (intern)"));
}

function formatSheet_(sheet) {
  formatNewSheet_(sheet);
  const maxRows = Math.max(sheet.getMaxRows(), 2);
  const widths = [
    150, 250, 230, 180, 170, 205, 220, 190, 190, 280, 180,
    160, 280, 140, 220, 190, 280, 145, 280, 160, 110,
  ];
  widths.forEach(function (width, index) {
    sheet.setColumnWidth(index + 1, width);
  });

  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat("dd.MM.yyyy HH:mm");
  sheet
    .getRange(2, 1, maxRows - 1, HEADERS.length)
    .setVerticalAlignment("top")
    .setWrap(true);

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
  sheet
    .getRange(2, column_("Status"), maxRows - 1, 1)
    .setDataValidation(statusValidation);

  const ratingValues = [
    "Noch offen",
    "A – passend",
    "B – prüfen",
    "C – nicht passend",
  ];
  const ratingValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(ratingValues, true)
    .setAllowInvalid(false)
    .build();
  sheet
    .getRange(2, column_("Lead-Bewertung"), maxRows - 1, 1)
    .setDataValidation(ratingValidation);

  const statusRange = sheet.getRange(
    2,
    column_("Status"),
    maxRows - 1,
    1,
  );
  const ratingRange = sheet.getRange(
    2,
    column_("Lead-Bewertung"),
    maxRows - 1,
    1,
  );
  const eventRange = sheet.getRange(
    2,
    column_("Ereignis"),
    maxRows - 1,
    1,
  );

  const rules = [
    conditionalRule_(statusRange, "Neu", "#FEF3C7", "#92400E"),
    conditionalRule_(statusRange, "Kontaktiert", "#DBEAFE", "#1E40AF"),
    conditionalRule_(statusRange, "Qualifiziert", "#EDE9FE", "#5B21B6"),
    conditionalRule_(statusRange, "Angebot / Termin", "#FFEDD5", "#9A3412"),
    conditionalRule_(statusRange, "Auftrag", "#DCFCE7", "#166534"),
    conditionalRule_(statusRange, "Nicht passend", "#FEE2E2", "#991B1B"),
    conditionalRule_(ratingRange, "A – passend", "#DCFCE7", "#166534"),
    conditionalRule_(ratingRange, "B – prüfen", "#FEF3C7", "#92400E"),
    conditionalRule_(ratingRange, "C – nicht passend", "#FEE2E2", "#991B1B"),
    conditionalRule_(eventRange, EVENT_LABELS.ixa_conversion_thank_you, "#DCFCE7", "#166534"),
    conditionalRule_(eventRange, EVENT_LABELS.ixa_conversion_callback, "#EDE9FE", "#5B21B6"),
    conditionalRule_(eventRange, EVENT_LABELS.ixa_conversion_phone_call, "#DBEAFE", "#1E40AF"),
    conditionalRule_(eventRange, EVENT_LABELS.ixa_conversion_whatsapp, "#D1FAE5", "#065F46"),
  ];
  sheet.setConditionalFormatRules(rules);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, maxRows, HEADERS.length - 1).createFilter();
  }
  sheet.hideColumns(column_("Datensatz-ID (intern)"));
}

function conditionalRule_(range, value, background, fontColor) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(value)
    .setBackground(background)
    .setFontColor(fontColor)
    .setRanges([range])
    .build();
}

function formatAppendedRow_(sheet, rowNumber) {
  sheet.getRange(rowNumber, 1).setNumberFormat("dd.MM.yyyy HH:mm");
  sheet
    .getRange(rowNumber, 1, 1, HEADERS.length - 1)
    .setVerticalAlignment("top")
    .setWrap(true);
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1 || !id) return 0;

  const match = sheet
    .getRange(2, column_("Datensatz-ID (intern)"), lastRow - 1, 1)
    .createTextFinder(String(id))
    .matchEntireCell(true)
    .matchCase(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function column_(header) {
  return HEADERS.indexOf(header) + 1;
}

function validDateOrNow_(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function serviceLabel_(serviceId, suppliedLabel) {
  return (
    SERVICE_LABELS[String(serviceId || "")] ||
    safeCell_(suppliedLabel) ||
    "Nicht angegeben"
  );
}

function contactLabel_(value) {
  const key = String(value || "").toLowerCase();
  return CONTACT_LABELS[key] || humanize_(value) || "Formular";
}

function conversionContactLabel_(eventName) {
  if (eventName === "ixa_conversion_phone_call") return "Telefon";
  if (eventName === "ixa_conversion_whatsapp") return "WhatsApp";
  if (eventName === "ixa_conversion_callback") return "Rückruf";
  return "Formular";
}

function areaAndPage_(entryPoint, pagePath) {
  const entryKey = String(entryPoint || "").toLowerCase();
  const entry = ENTRY_LABELS[entryKey] || humanize_(entryPoint);
  const page = pageLabel_(pagePath);
  return [entry, page].filter(Boolean).join(" · ");
}

function pageLabel_(pagePath) {
  const path = String(pagePath || "").trim();
  if (!path || path === "/") return path === "/" ? "Startseite" : "";
  if (path === "/danke") return "Danke-Seite";
  if (path.indexOf("/fallstudien/") === 0) return "Fallstudie";
  if (path.indexOf("/google-ads-") === 0) return "Google-Ads-Seite";
  return path.slice(0, 200);
}

function sourceAndCampaign_(body) {
  const parts = [];
  if (body.utmSource) parts.push("Quelle: " + safeCell_(body.utmSource));
  if (body.utmMedium) parts.push("Medium: " + safeCell_(body.utmMedium));
  if (body.utmCampaign) {
    parts.push("Kampagne: " + safeCell_(body.utmCampaign));
  }
  if (body.utmTerm) parts.push("Suchbegriff: " + safeCell_(body.utmTerm));
  if (body.utmContent) parts.push("Inhalt: " + safeCell_(body.utmContent));
  if (!parts.length && body.referrerHost) {
    parts.push("Verweis: " + safeCell_(body.referrerHost));
  }
  return parts.join(" · ").slice(0, 2000);
}

function humanize_(value) {
  const text = String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
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
