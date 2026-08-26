const SCHEMA_VERSION = 1;
const PROSPECTS_SHEET = "01 Prospects";
const INBOUND_QUEUE_SHEET = "07 Inbound Queue";
const MAX_REQUEST_BYTES = 256 * 1024;
const MAX_BATCH_ITEMS = 50;
const RETENTION_DAYS = 30;

const INBOUND_HEADERS = [
  "Inbound_ID",
  "Source_Message_ID",
  "Received_UTC",
  "Phone_E164",
  "Company_ID",
  "Contact_ID",
  "Printed_Ref",
  "Message_Type",
  "Message_Text",
  "Match_Method",
  "Match_Confidence",
  "Processing_Status",
  "Review_Outcome",
  "Next_Action",
  "Reviewed_At_UTC",
  "Retention_Delete_After",
  "Notes",
];

function doGet() {
  return json_({
    ok: true,
    service: "ixa-whatsapp-inbound",
    schemaVersion: SCHEMA_VERSION,
  });
}

function doPost(e) {
  try {
    const rawBody = (e && e.postData && e.postData.contents) || "{}";
    if (Utilities.newBlob(rawBody).getBytes().length > MAX_REQUEST_BYTES) {
      return json_({ ok: false, error: "payload_too_large" });
    }

    const body = JSON.parse(rawBody);
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty("WHATSAPP_WEBHOOK_SECRET");

    if (!expectedSecret || body._secret !== expectedSecret) {
      return json_({ ok: false, error: "unauthorized" });
    }
    if (body.schemaVersion !== SCHEMA_VERSION) {
      return json_({ ok: false, error: "invalid_payload" });
    }

    const isCheck = body.recordType === "whatsapp_allowlist_batch";
    const isInbound = body.recordType === "whatsapp_inbound_batch";
    if (!isCheck && !isInbound) {
      return json_({ ok: false, error: "invalid_record_type" });
    }
    if (!isValidBatch_(body, isInbound, expectedSecret)) {
      return json_({ ok: false, error: "invalid_payload" });
    }

    const spreadsheetId = properties.getProperty("OUTREACH_SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("missing_outreach_spreadsheet_id");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    if (isCheck) {
      const results = body.items.map(function (item) {
        return allowlistResponse_(
          matchAllowlist_(spreadsheet, item, expectedSecret),
          item.requestKey,
        );
      });
      return json_({ ok: true, results: results });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false, error: "busy" });

    try {
      const queue = ensureInboundQueue_(spreadsheet);
      const sourceMessageIds = [];
      let ignoredCount = 0;

      body.items.forEach(function (item) {
        const match = matchAllowlist_(spreadsheet, item, expectedSecret);
        if (match.allowed) {
          saveInbound_(queue, item, match);
        } else {
          // A contact can be removed between the hash-only preflight and save.
          // The text is discarded, while the signed Meta delivery is still
          // acknowledged so it is not retried forever.
          ignoredCount += 1;
        }
        sourceMessageIds.push(String(item.sourceMessageId));
      });

      return json_({
        ok: true,
        sourceMessageIds: sourceMessageIds,
        ignoredCount: ignoredCount,
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : "receiver_error");
    return json_({ ok: false, error: "receiver_error" });
  }
}

function setupWhatsAppInboundQueue() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("OUTREACH_SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("missing_outreach_spreadsheet_id");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const queue = ensureInboundQueue_(spreadsheet);
  formatInboundQueue_(queue);
  ensureRetentionTrigger_();
  SpreadsheetApp.flush();

  return {
    ok: true,
    sheet: queue.getName(),
    columns: INBOUND_HEADERS.length,
  };
}

function isValidBatch_(body, inbound, secret) {
  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > MAX_BATCH_ITEMS
  ) {
    return false;
  }
  return body.items.every(function (item) {
    return isValidProof_(item) && (!inbound || isValidInbound_(item, secret));
  });
}

function isValidProof_(body) {
  if (!isHash_(body.requestKey) || !isHash_(body.phoneProof)) return false;
  if (!Array.isArray(body.referenceProofs) || body.referenceProofs.length > 8) {
    return false;
  }
  return body.referenceProofs.every(isHash_);
}

function isValidInbound_(body, secret) {
  const messageId = String(body.sourceMessageId || "");
  const phone = String(body.phoneE164 || "");
  const normalizedPhone = normalizePhone_(phone);
  const type = String(body.messageType || "");
  const message = String(body.messageText || "");

  return (
    messageId.length > 0 &&
    messageId.length <= 255 &&
    /^\+[1-9][0-9]{7,14}$/.test(phone) &&
    normalizedPhone &&
    hmacSha256Hex_(normalizedPhone, secret) ===
      String(body.phoneProof).toLowerCase() &&
    /^[a-z_]{1,40}$/.test(type) &&
    message.length <= 4000
  );
}

function matchAllowlist_(spreadsheet, body, secret) {
  const sheet = spreadsheet.getSheetByName(PROSPECTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return { allowed: false, matches: [] };
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  const required = [
    "Company_ID",
    "Contact_ID",
    "Phone_With_Country_Code",
    "WhatsApp_With_Country_Code",
    "Printed_Ref",
    "Public_Token",
    "Blocked",
  ];
  const columns = headerMap_(headers);
  if (required.some(function (name) { return columns[name] == null; })) {
    throw new Error("prospect_schema_mismatch");
  }

  const values = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  const referenceProofs = body.referenceProofs;

  let matches = values.filter(function (row) {
    const publicToken = String(row[columns.Public_Token] || "").trim();
    if (!publicToken) return false;

    const proof = hmacSha256Hex_(sha256Hex_(publicToken), secret);
    return referenceProofs.indexOf(proof) >= 0;
  });
  let method = "Strong public token";

  if (!matches.length) {
    matches = values.filter(function (row) {
      const phone = normalizePhone_(row[columns.Phone_With_Country_Code]);
      const whatsapp = normalizePhone_(row[columns.WhatsApp_With_Country_Code]);
      return (
        (phone && hmacSha256Hex_(phone, secret) === body.phoneProof) ||
        (whatsapp && hmacSha256Hex_(whatsapp, secret) === body.phoneProof)
      );
    });
    method = "Exact E164";
  }

  if (!matches.length) return { allowed: false, matches: [] };

  const identities = {};
  matches.forEach(function (row) {
    const key =
      String(row[columns.Company_ID] || "") + "\u001f" +
      String(row[columns.Contact_ID] || "");
    identities[key] = true;
  });
  const unique = Object.keys(identities).length === 1;
  const first = matches[0];
  const blocked = matches.some(function (row) {
    return String(row[columns.Blocked] || "").toLowerCase() === "true";
  });

  return {
    allowed: true,
    companyId: unique ? String(first[columns.Company_ID] || "") : "",
    contactId: unique ? String(first[columns.Contact_ID] || "") : "",
    printedRef: unique ? String(first[columns.Printed_Ref] || "") : "",
    matchMethod: unique ? method : method + " · duplicate CRM match",
    matchConfidence: unique ? 1 : 0.5,
    blocked: blocked,
  };
}

function allowlistResponse_(match, requestKey) {
  if (!match.allowed) {
    return { requestKey: String(requestKey), allowed: false };
  }
  return {
    requestKey: String(requestKey),
    allowed: true,
    companyId: match.companyId,
    contactId: match.contactId,
    printedRef: match.printedRef,
    matchMethod: match.matchMethod,
    matchConfidence: match.matchConfidence,
  };
}

function saveInbound_(sheet, body, match) {
  const existing = findQueueRow_(sheet, String(body.sourceMessageId));
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      sourceMessageId: String(body.sourceMessageId),
    };
  }

  const receivedAt = validDateOrNow_(body.receivedAt);
  const retentionDate = new Date(receivedAt.getTime());
  retentionDate.setUTCDate(retentionDate.getUTCDate() + RETENTION_DAYS);
  const ambiguous = match.matchConfidence < 1;
  const processingStatus =
    match.blocked || ambiguous ? "Ignored" : "Pending verification";
  const nextAction = match.blocked
    ? "No outbound. Suppressed contact; manual review only"
    : ambiguous
      ? "Resolve duplicate CRM match manually. No outbound"
      : "Verify inbound WhatsApp and prepare a personal draft";
  const notes = match.blocked
    ? "Known contact is suppressed. Inbound recorded; no outbound draft or send."
    : ambiguous
      ? "Multiple CRM identities matched. Manual resolution is required before any action."
      : "Auto-ingested after strict allowlist check. No reply sent.";

  const inboundId = "IXA-WA-" + Utilities.getUuid();
  const row = [
    inboundId,
    body.sourceMessageId,
    receivedAt.toISOString(),
    body.phoneE164,
    match.companyId,
    match.contactId,
    match.printedRef,
    body.messageType,
    body.messageText,
    match.matchMethod,
    match.matchConfidence,
    processingStatus,
    "Unknown",
    nextAction,
    "",
    retentionDate.toISOString(),
    notes,
  ].map(function (value) {
    return typeof value === "number"
      ? value
      : safeCell_(value, 4000);
  });

  const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
  if (rowNumber > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), Math.max(100, rowNumber - sheet.getMaxRows()));
    formatInboundQueue_(sheet);
  }
  sheet.getRange(rowNumber, 4).setNumberFormat("@");
  sheet.getRange(rowNumber, 1, 1, INBOUND_HEADERS.length).setValues([row]);
  sheet.getRange(rowNumber, 3).setNumberFormat("@");
  sheet.getRange(rowNumber, 15, 1, 2).setNumberFormat("@");
  sheet
    .getRange(rowNumber, 1, 1, INBOUND_HEADERS.length)
    .setVerticalAlignment("top")
    .setWrap(true);
  SpreadsheetApp.flush();

  return {
    ok: true,
    duplicate: false,
    inboundId: inboundId,
    sourceMessageId: String(body.sourceMessageId),
  };
}

function ensureInboundQueue_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(INBOUND_QUEUE_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(INBOUND_QUEUE_SHEET);

  const missingColumns = INBOUND_HEADERS.length - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, INBOUND_HEADERS.length).setValues([INBOUND_HEADERS]);
    formatInboundQueue_(sheet);
  } else {
    const current = sheet
      .getRange(1, 1, 1, INBOUND_HEADERS.length)
      .getDisplayValues()[0];
    if (current.join("\u001f") !== INBOUND_HEADERS.join("\u001f")) {
      throw new Error("inbound_queue_schema_mismatch");
    }
  }
  return sheet;
}

function formatInboundQueue_(sheet) {
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 44);
  sheet
    .getRange(1, 1, 1, INBOUND_HEADERS.length)
    .setBackground("#356853")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center")
    .setWrap(true);

  const widths = [
    230, 260, 165, 165, 150, 150, 145, 120, 420,
    180, 125, 170, 150, 300, 165, 180, 330,
  ];
  widths.forEach(function (width, index) {
    sheet.setColumnWidth(index + 1, width);
  });

  const maxRows = Math.max(sheet.getMaxRows(), 2);
  sheet.getRange(2, 3, maxRows - 1, 1).setNumberFormat("@");
  sheet.getRange(2, 15, maxRows - 1, 2).setNumberFormat("@");
  const processingValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      ["Pending verification", "Verified", "Draft created", "Ignored", "Error"],
      true,
    )
    .setAllowInvalid(false)
    .build();
  sheet
    .getRange(2, INBOUND_HEADERS.indexOf("Processing_Status") + 1, maxRows - 1, 1)
    .setDataValidation(processingValidation);

  const outcomeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      ["Unknown", "Positive", "Neutral", "Negative", "Opt out", "Family / private"],
      true,
    )
    .setAllowInvalid(false)
    .build();
  sheet
    .getRange(2, INBOUND_HEADERS.indexOf("Review_Outcome") + 1, maxRows - 1, 1)
    .setDataValidation(outcomeValidation);

  const currentFilter = sheet.getFilter();
  if (
    currentFilter &&
    currentFilter.getRange().getNumRows() < maxRows
  ) {
    currentFilter.remove();
  }
  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, maxRows, INBOUND_HEADERS.length).createFilter();
  }
}

function findQueueRow_(sheet, sourceMessageId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1 || !sourceMessageId) return 0;

  const column = INBOUND_HEADERS.indexOf("Source_Message_ID") + 1;
  const match = sheet
    .getRange(2, column, lastRow - 1, 1)
    .createTextFinder(sourceMessageId)
    .matchEntireCell(true)
    .matchCase(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function ensureRetentionTrigger_() {
  const handler = "purgeExpiredWhatsAppMessageText";
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });
  if (!exists) {
    ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(3).create();
  }
}

function purgeExpiredWhatsAppMessageText() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: "busy" };

  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty("OUTREACH_SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("missing_outreach_spreadsheet_id");

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(INBOUND_QUEUE_SHEET);
    if (!sheet || sheet.getLastRow() < 2) return { ok: true, purged: 0 };

    const headers = sheet
      .getRange(1, 1, 1, INBOUND_HEADERS.length)
      .getDisplayValues()[0];
    const columns = headerMap_(headers);
    const required = [
      "Phone_E164",
      "Message_Text",
      "Retention_Delete_After",
      "Notes",
    ];
    if (required.some(function (name) { return columns[name] == null; })) {
      throw new Error("inbound_queue_schema_mismatch");
    }

    const lastRow = sheet.getLastRow();
    const rows = sheet
      .getRange(2, 1, lastRow - 1, INBOUND_HEADERS.length)
      .getDisplayValues();
    const now = new Date();
    let purged = 0;

    rows.forEach(function (row, index) {
      const retentionDate = new Date(
        String(row[columns.Retention_Delete_After] || ""),
      );
      if (
        Number.isNaN(retentionDate.getTime()) ||
        retentionDate.getTime() > now.getTime()
      ) {
        return;
      }

      const phone = String(row[columns.Phone_E164] || "");
      const message = String(row[columns.Message_Text] || "");
      if (!phone && !message) return;

      const rowNumber = index + 2;
      sheet.getRange(rowNumber, columns.Phone_E164 + 1).clearContent();
      sheet.getRange(rowNumber, columns.Message_Text + 1).clearContent();

      const existingNote = String(row[columns.Notes] || "").trim();
      const purgeNote = "Sensitive phone and message text purged after retention window.";
      const nextNote = existingNote
        ? existingNote + " " + purgeNote
        : purgeNote;
      sheet
        .getRange(rowNumber, columns.Notes + 1)
        .setValue(safeCell_(nextNote, 4000));
      purged += 1;
    });

    SpreadsheetApp.flush();
    return { ok: true, purged: purged };
  } finally {
    lock.releaseLock();
  }
}

function headerMap_(headers) {
  return headers.reduce(function (map, header, index) {
    map[String(header)] = index;
    return map;
  }, {});
}

function normalizePhone_(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.indexOf("00") === 0) digits = digits.slice(2);
  return /^[1-9][0-9]{7,14}$/.test(digits) ? digits : "";
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8,
  );
  return bytes
    .map(function (byte) {
      const unsigned = byte < 0 ? byte + 256 : byte;
      return unsigned.toString(16).padStart(2, "0");
    })
    .join("");
}

function hmacSha256Hex_(value, secret) {
  const bytes = Utilities.computeHmacSha256Signature(
    String(value),
    String(secret),
    Utilities.Charset.UTF_8,
  );
  return bytes
    .map(function (byte) {
      const unsigned = byte < 0 ? byte + 256 : byte;
      return unsigned.toString(16).padStart(2, "0");
    })
    .join("");
}

function isHash_(value) {
  return /^[0-9a-f]{64}$/i.test(String(value || ""));
}

function validDateOrNow_(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function safeCell_(value, maxLength) {
  const limit = Number(maxLength) || 2000;
  const text = String(value == null ? "" : value).trim().slice(0, limit);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
