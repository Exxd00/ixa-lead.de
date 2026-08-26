const SCHEMA_VERSION = 2;
const PROSPECTS_SHEET = "01 Prospects";
const INBOUND_QUEUE_SHEET = "07 Inbound Queue";
const MAX_REQUEST_BYTES = 256 * 1024;
const MAX_BATCH_ITEMS = 50;
const RETENTION_DAYS = 30;
const ALLOWLIST_TICKET_VERSION = 1;
const ALLOWLIST_TICKET_TTL_MS = 60 * 1000;
const PERSONAL_PAGE_EVENTS_SHEET = "08 Outreach Events";
const PERSONAL_PAGE_TICKET_VERSION = 1;
const PERSONAL_PAGE_TICKET_TTL_MS = 2 * 60 * 1000;
const PERSONAL_PAGE_LABEL_HEADER = "Public_Page_Label";
const PERSONAL_PAGE_EXPIRY_HEADER = "Public_Page_Expires_UTC";

const PERSONAL_PAGE_EVENT_HEADERS = [
  "Event_Name",
  "Event_UTC",
  "Company_ID",
  "Contact_ID",
  "Token_SHA256",
];

const INBOUND_HEADERS = [
  "Inbound_ID",
  "Source_Message_ID",
  "Received_UTC",
  "Ingested_UTC",
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

    const spreadsheetId = properties.getProperty("OUTREACH_SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("missing_outreach_spreadsheet_id");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    if (body.recordType === "personal_page_resolve") {
      if (!isHash_(body.tokenProof)) {
        return json_({ ok: false, error: "invalid_payload" });
      }
      const resolution = resolvePersonalPage_(
        spreadsheet,
        String(body.tokenProof).toLowerCase(),
        expectedSecret,
      );
      if (!resolution) return json_({ ok: true, allowed: false });
      return json_({
        ok: true,
        allowed: true,
        publicPageLabel: resolution.publicPageLabel,
        visitTicket: resolution.visitTicket,
      });
    }

    if (body.recordType === "personal_page_visit") {
      if (!isPersonalPageTicket_(body.visitTicket)) {
        return json_({ ok: false, error: "invalid_payload" });
      }
      recordPersonalPageVisit_(
        spreadsheet,
        String(body.visitTicket),
        expectedSecret,
      );
      // Matching and replay state are intentionally never disclosed.
      return json_({ ok: true });
    }

    const isCheck = body.recordType === "whatsapp_allowlist_batch";
    const isInbound = body.recordType === "whatsapp_inbound_batch";
    if (!isCheck && !isInbound) {
      return json_({ ok: false, error: "invalid_record_type" });
    }
    if (!isValidBatch_(body, isInbound, expectedSecret)) {
      return json_({ ok: false, error: "invalid_payload" });
    }

    if (isCheck) {
      const prospectIndex = buildProspectIndex_(spreadsheet, expectedSecret);
      const results = body.items.map(function (item) {
        return allowlistResponse_(
          matchAllowlist_(prospectIndex, item),
          item,
          expectedSecret,
        );
      });
      return json_({ ok: true, results: results });
    }

    // The short-lived ticket was issued by the hash-only preflight. Verifying
    // every ticket before taking the lock prevents partial batch writes and
    // avoids a second full scan of the prospects sheet.
    const verifiedItems = body.items.map(function (item) {
      return {
        item: item,
        match: verifyAllowlistTicket_(item, expectedSecret),
      };
    });
    if (verifiedItems.some(function (verified) { return !verified.match; })) {
      return json_({ ok: false, error: "invalid_allowlist_ticket" });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false, error: "busy" });

    try {
      const queue = ensureInboundQueue_(spreadsheet);
      const sourceMessageIds = [];
      const existingMessageIds = loadQueueMessageIds_(queue);

      verifiedItems.forEach(function (verified) {
        saveInbound_(
          queue,
          verified.item,
          verified.match,
          existingMessageIds,
        );
        sourceMessageIds.push(String(verified.item.sourceMessageId));
      });
      SpreadsheetApp.flush();

      return json_({
        ok: true,
        sourceMessageIds: sourceMessageIds,
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
  ensureProspectPersonalPageColumns_(spreadsheet);
  const events = ensurePersonalPageEvents_(spreadsheet);
  formatInboundQueue_(queue);
  formatPersonalPageEvents_(events);
  ensureRetentionTrigger_();
  SpreadsheetApp.flush();

  return {
    ok: true,
    sheet: queue.getName(),
    columns: INBOUND_HEADERS.length,
    personalPageEventsSheet: events.getName(),
  };
}

function ensureProspectPersonalPageColumns_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(PROSPECTS_SHEET);
  if (!sheet || sheet.getLastRow() < 1) {
    throw new Error("missing_prospects_sheet");
  }

  let headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  [PERSONAL_PAGE_LABEL_HEADER, PERSONAL_PAGE_EXPIRY_HEADER].forEach(function (name) {
    if (headers.indexOf(name) !== -1) return;
    const nextColumn = headers.length + 1;
    if (nextColumn > sheet.getMaxColumns()) {
      sheet.insertColumnAfter(sheet.getMaxColumns());
    }
    sheet.getRange(1, nextColumn).setValue(name);
    headers.push(name);
  });

  const columns = headerMap_(headers);
  [PERSONAL_PAGE_LABEL_HEADER, PERSONAL_PAGE_EXPIRY_HEADER].forEach(function (name) {
    sheet
      .getRange(1, columns[name] + 1)
      .setBackground("#356853")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setWrap(true);
  });
  sheet.setColumnWidth(columns[PERSONAL_PAGE_LABEL_HEADER] + 1, 220);
  sheet.setColumnWidth(columns[PERSONAL_PAGE_EXPIRY_HEADER] + 1, 190);
  if (sheet.getMaxRows() > 1) {
    sheet
      .getRange(
        2,
        columns[PERSONAL_PAGE_EXPIRY_HEADER] + 1,
        sheet.getMaxRows() - 1,
        1,
      )
      .setNumberFormat("@");
  }
  return sheet;
}

function resolvePersonalPage_(spreadsheet, tokenProof, secret) {
  const sheet = spreadsheet.getSheetByName(PROSPECTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  const columns = headerMap_(headers);
  const required = ["Company_ID", "Contact_ID", "Public_Token", "Blocked"];
  if (required.some(function (name) { return columns[name] == null; })) {
    throw new Error("prospect_schema_mismatch");
  }

  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  const matches = rows.filter(function (row) {
    const token = String(row[columns.Public_Token] || "").trim();
    return (
      /^[A-Za-z0-9_-]{16,80}$/.test(token) &&
      hmacSha256Hex_(sha256Hex_(token), secret) === tokenProof
    );
  });
  if (matches.length !== 1) return null;

  const row = matches[0];
  if (String(row[columns.Blocked] || "").toLowerCase() === "true") return null;

  if (columns[PERSONAL_PAGE_EXPIRY_HEADER] != null) {
    const expiryValue = String(
      row[columns[PERSONAL_PAGE_EXPIRY_HEADER]] || "",
    ).trim();
    if (expiryValue) {
      const expiry = new Date(expiryValue);
      if (
        Number.isNaN(expiry.getTime()) ||
        expiry.getTime() <= Date.now()
      ) {
        return null;
      }
    }
  }

  const companyId = String(row[columns.Company_ID] || "").trim().slice(0, 200);
  const contactId = String(row[columns.Contact_ID] || "").trim().slice(0, 200);
  if (!companyId || !contactId) return null;

  const rawToken = String(row[columns.Public_Token]).trim();
  const tokenHash = sha256Hex_(rawToken);
  let publicPageLabel = "";
  if (columns[PERSONAL_PAGE_LABEL_HEADER] != null) {
    publicPageLabel = String(
      row[columns[PERSONAL_PAGE_LABEL_HEADER]] || "",
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  return {
    publicPageLabel: publicPageLabel,
    visitTicket: createPersonalPageTicket_(
      { companyId: companyId, contactId: contactId, tokenHash: tokenHash },
      secret,
    ),
  };
}

function createPersonalPageTicket_(record, secret) {
  const nonce = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
  const expiresAt = Date.now() + PERSONAL_PAGE_TICKET_TTL_MS;
  const payload = {
    version: PERSONAL_PAGE_TICKET_VERSION,
    expiresAt: expiresAt,
    nonce: nonce,
  };
  const encoded = Utilities.base64EncodeWebSafe(
    JSON.stringify(payload),
    Utilities.Charset.UTF_8,
  ).replace(/=+$/g, "");
  const cacheRecord = {
    expiresAt: expiresAt,
    companyId: String(record.companyId),
    contactId: String(record.contactId),
    tokenHash: String(record.tokenHash),
  };
  CacheService.getScriptCache().put(
    personalPageTicketCacheKey_(nonce),
    JSON.stringify(cacheRecord),
    Math.ceil(PERSONAL_PAGE_TICKET_TTL_MS / 1000) + 30,
  );
  return encoded + "." + hmacSha256Hex_(encoded, secret);
}

function isPersonalPageTicket_(value) {
  return /^[A-Za-z0-9_-]{24,2048}\.[0-9a-f]{64}$/i.test(
    String(value || ""),
  );
}

function personalPageTicketCacheKey_(nonce) {
  return "ixa-page-ticket:" + sha256Hex_(String(nonce));
}

function personalPageSpentCacheKey_(nonce) {
  return "ixa-page-spent:" + sha256Hex_(String(nonce));
}

function verifyPersonalPageTicket_(ticket, secret) {
  try {
    const parts = String(ticket || "").split(".");
    if (parts.length !== 2 || !isHash_(parts[1])) return null;
    const expected = hmacSha256Hex_(parts[0], secret);
    if (!constantTimeHexEqual_(expected, parts[1])) return null;

    const paddingLength = (4 - (parts[0].length % 4)) % 4;
    const decoded = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(parts[0] + "=".repeat(paddingLength)),
    ).getDataAsString(Utilities.Charset.UTF_8);
    const payload = JSON.parse(decoded);
    const now = Date.now();
    if (
      payload.version !== PERSONAL_PAGE_TICKET_VERSION ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= now ||
      payload.expiresAt > now + PERSONAL_PAGE_TICKET_TTL_MS + 5000 ||
      !/^[0-9a-f]{64}$/i.test(String(payload.nonce || ""))
    ) {
      return null;
    }

    const cache = CacheService.getScriptCache();
    const cached = cache.get(personalPageTicketCacheKey_(payload.nonce));
    if (!cached) return null;
    const record = JSON.parse(cached);
    if (
      record.expiresAt !== payload.expiresAt ||
      !String(record.companyId || "") ||
      !String(record.contactId || "") ||
      !isHash_(record.tokenHash)
    ) {
      return null;
    }
    return {
      nonce: String(payload.nonce),
      expiresAt: Number(payload.expiresAt),
      companyId: String(record.companyId).slice(0, 200),
      contactId: String(record.contactId).slice(0, 200),
      tokenHash: String(record.tokenHash).toLowerCase(),
    };
  } catch (error) {
    return null;
  }
}

function recordPersonalPageVisit_(spreadsheet, ticket, secret) {
  const initial = verifyPersonalPageTicket_(ticket, secret);
  if (!initial) return { recorded: false };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { recorded: false };
  try {
    const verified = verifyPersonalPageTicket_(ticket, secret);
    if (!verified) return { recorded: false };

    const cache = CacheService.getScriptCache();
    const spentKey = personalPageSpentCacheKey_(verified.nonce);
    if (cache.get(spentKey)) return { recorded: false };

    const sheet = ensurePersonalPageEvents_(spreadsheet);
    const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
    if (rowNumber > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), 100);
      formatPersonalPageEvents_(sheet);
    }
    sheet
      .getRange(rowNumber, 1, 1, PERSONAL_PAGE_EVENT_HEADERS.length)
      .setValues([[
        "personal_page_visit",
        new Date().toISOString(),
        safeCell_(verified.companyId, 200),
        safeCell_(verified.contactId, 200),
        verified.tokenHash,
      ]])
      .setVerticalAlignment("top");
    sheet.getRange(rowNumber, 2).setNumberFormat("@");
    SpreadsheetApp.flush();

    cache.put(spentKey, "1", 300);
    cache.remove(personalPageTicketCacheKey_(verified.nonce));
    return { recorded: true };
  } finally {
    lock.releaseLock();
  }
}

function ensurePersonalPageEvents_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(PERSONAL_PAGE_EVENTS_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(PERSONAL_PAGE_EVENTS_SHEET);
  const missingColumns = PERSONAL_PAGE_EVENT_HEADERS.length - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, PERSONAL_PAGE_EVENT_HEADERS.length)
      .setValues([PERSONAL_PAGE_EVENT_HEADERS]);
  } else {
    const headers = sheet
      .getRange(1, 1, 1, PERSONAL_PAGE_EVENT_HEADERS.length)
      .getDisplayValues()[0];
    if (headers.join("\u001f") !== PERSONAL_PAGE_EVENT_HEADERS.join("\u001f")) {
      throw new Error("personal_page_events_schema_mismatch");
    }
  }
  return sheet;
}

function formatPersonalPageEvents_(sheet) {
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 44);
  sheet
    .getRange(1, 1, 1, PERSONAL_PAGE_EVENT_HEADERS.length)
    .setBackground("#356853")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center")
    .setWrap(true);
  [180, 190, 170, 170, 460].forEach(function (width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setNumberFormat("@");
  }
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
    sha256Hex_(messageId) === String(body.requestKey).toLowerCase() &&
    /^\+[1-9][0-9]{7,14}$/.test(phone) &&
    normalizedPhone &&
    hmacSha256Hex_(normalizedPhone, secret) ===
      String(body.phoneProof).toLowerCase() &&
    /^[a-z_]{1,40}$/.test(type) &&
    message.length <= 4000 &&
    typeof body.allowlistTicket === "string" &&
    body.allowlistTicket.length >= 64 &&
    body.allowlistTicket.length <= 4096 &&
    /^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/i.test(body.allowlistTicket)
  );
}

function buildProspectIndex_(spreadsheet, secret) {
  const sheet = spreadsheet.getSheetByName(PROSPECTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return { tokenProofs: Object.create(null), phoneProofs: Object.create(null) };
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
  const tokenProofs = Object.create(null);
  const phoneProofs = Object.create(null);

  values.forEach(function (row) {
    const publicToken = String(row[columns.Public_Token] || "").trim();
    if (publicToken) {
      addIndexedRow_(
        tokenProofs,
        hmacSha256Hex_(sha256Hex_(publicToken), secret),
        row,
      );
    }

    const seenPhoneProofs = Object.create(null);
    [
      row[columns.Phone_With_Country_Code],
      row[columns.WhatsApp_With_Country_Code],
    ].forEach(function (value) {
      const phone = normalizePhone_(value);
      if (!phone) return;
      const proof = hmacSha256Hex_(phone, secret);
      if (seenPhoneProofs[proof]) return;
      seenPhoneProofs[proof] = true;
      addIndexedRow_(phoneProofs, proof, row);
    });
  });

  return {
    columns: columns,
    tokenProofs: tokenProofs,
    phoneProofs: phoneProofs,
  };
}

function addIndexedRow_(index, proof, row) {
  if (!index[proof]) index[proof] = [];
  index[proof].push(row);
}

function matchAllowlist_(prospectIndex, body) {
  const columns = prospectIndex.columns;
  if (!columns) return { allowed: false, matches: [] };

  const phoneMatches =
    prospectIndex.phoneProofs[String(body.phoneProof).toLowerCase()] || [];
  if (containsBlockedProspect_(phoneMatches, columns)) {
    return { allowed: false, blocked: true, matches: [] };
  }

  let matches = [];
  body.referenceProofs.forEach(function (proof) {
    const indexed = prospectIndex.tokenProofs[String(proof).toLowerCase()];
    if (indexed) matches = matches.concat(indexed);
  });
  let method = "Strong public token";

  if (!matches.length) {
    matches = phoneMatches;
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
  if (containsBlockedProspect_(matches, columns)) {
    // A suppressed/private identity never receives a disclosure ticket, so
    // Vercel never forwards its phone number or message text to this service.
    return { allowed: false, blocked: true, matches: [] };
  }

  return {
    allowed: true,
    companyId: unique ? String(first[columns.Company_ID] || "") : "",
    contactId: unique ? String(first[columns.Contact_ID] || "") : "",
    printedRef: unique ? String(first[columns.Printed_Ref] || "") : "",
    matchMethod: unique ? method : method + " · duplicate CRM match",
    matchConfidence: unique ? 1 : 0.5,
  };
}

function containsBlockedProspect_(rows, columns) {
  return rows.some(function (row) {
    return String(row[columns.Blocked] || "").toLowerCase() === "true";
  });
}

function allowlistResponse_(match, item, secret) {
  if (!match.allowed) {
    return { requestKey: String(item.requestKey), allowed: false };
  }
  return {
    requestKey: String(item.requestKey),
    allowed: true,
    companyId: match.companyId,
    contactId: match.contactId,
    printedRef: match.printedRef,
    matchMethod: match.matchMethod,
    matchConfidence: match.matchConfidence,
    allowlistTicket: createAllowlistTicket_(item, match, secret),
  };
}

function createAllowlistTicket_(item, match, secret) {
  const payload = {
    version: ALLOWLIST_TICKET_VERSION,
    expiresAt: Date.now() + ALLOWLIST_TICKET_TTL_MS,
    requestKey: String(item.requestKey).toLowerCase(),
    phoneProof: String(item.phoneProof).toLowerCase(),
    referenceDigest: referenceDigest_(item.referenceProofs),
    companyId: String(match.companyId || "").slice(0, 200),
    contactId: String(match.contactId || "").slice(0, 200),
    printedRef: String(match.printedRef || "").slice(0, 200),
    matchMethod: String(match.matchMethod || "").slice(0, 200),
    matchConfidence: Number(match.matchConfidence),
  };
  const encoded = Utilities.base64EncodeWebSafe(
    JSON.stringify(payload),
    Utilities.Charset.UTF_8,
  ).replace(/=+$/g, "");
  return encoded + "." + hmacSha256Hex_(encoded, secret);
}

function verifyAllowlistTicket_(item, secret) {
  try {
    const parts = String(item.allowlistTicket || "").split(".");
    if (parts.length !== 2 || !isHash_(parts[1])) return null;
    const expectedSignature = hmacSha256Hex_(parts[0], secret);
    if (!constantTimeHexEqual_(expectedSignature, parts[1])) return null;

    const paddingLength = (4 - (parts[0].length % 4)) % 4;
    const encodedPayload = parts[0] + "=".repeat(paddingLength);
    const json = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(encodedPayload),
    ).getDataAsString(Utilities.Charset.UTF_8);
    const payload = JSON.parse(json);
    const now = Date.now();
    if (
      payload.version !== ALLOWLIST_TICKET_VERSION ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= now ||
      payload.expiresAt > now + ALLOWLIST_TICKET_TTL_MS + 5000 ||
      payload.requestKey !== String(item.requestKey).toLowerCase() ||
      payload.phoneProof !== String(item.phoneProof).toLowerCase() ||
      payload.referenceDigest !== referenceDigest_(item.referenceProofs) ||
      !Number.isFinite(payload.matchConfidence) ||
      payload.matchConfidence <= 0 ||
      payload.matchConfidence > 1
    ) {
      return null;
    }

    return {
      allowed: true,
      companyId: String(payload.companyId || ""),
      contactId: String(payload.contactId || ""),
      printedRef: String(payload.printedRef || ""),
      matchMethod: String(payload.matchMethod || ""),
      matchConfidence: Number(payload.matchConfidence),
    };
  } catch (error) {
    return null;
  }
}

function referenceDigest_(referenceProofs) {
  return sha256Hex_(
    (referenceProofs || []).map(function (proof) {
      return String(proof).toLowerCase();
    }).join("\n"),
  );
}

function constantTimeHexEqual_(left, right) {
  const a = String(left || "").toLowerCase();
  const b = String(right || "").toLowerCase();
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function buildInboundRow_(body, match, ingestedAt, inboundId) {
  const timestamps = inboundTimestamps_(body.receivedAt, ingestedAt);
  const ambiguous = match.matchConfidence < 1;
  const processingStatus = ambiguous ? "Ignored" : "Pending verification";
  const nextAction = ambiguous
    ? "Resolve duplicate CRM match manually. No outbound"
    : "Verify inbound WhatsApp and prepare a personal draft";
  const notes = ambiguous
    ? "Multiple CRM identities matched. Manual resolution is required before any action."
    : "Auto-ingested after strict allowlist check. No reply sent.";

  return [
    inboundId,
    body.sourceMessageId,
    timestamps.receivedAt.toISOString(),
    timestamps.ingestedAt.toISOString(),
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
    timestamps.retentionDate.toISOString(),
    notes,
  ].map(function (value) {
    return typeof value === "number"
      ? value
      : safeCell_(value, 4000);
  });
}

function saveInbound_(sheet, body, match, existingMessageIds) {
  const sourceMessageId = String(body.sourceMessageId);
  if (existingMessageIds[sourceMessageId]) {
    return {
      ok: true,
      duplicate: true,
      sourceMessageId: sourceMessageId,
    };
  }

  const inboundId = "IXA-WA-" + Utilities.getUuid();
  const row = buildInboundRow_(body, match, new Date(), inboundId);

  const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
  if (rowNumber > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), Math.max(100, rowNumber - sheet.getMaxRows()));
    formatInboundQueue_(sheet);
  }
  sheet
    .getRange(rowNumber, INBOUND_HEADERS.indexOf("Phone_E164") + 1)
    .setNumberFormat("@");
  sheet.getRange(rowNumber, 1, 1, INBOUND_HEADERS.length).setValues([row]);
  ["Received_UTC", "Ingested_UTC", "Reviewed_At_UTC", "Retention_Delete_After"]
    .forEach(function (header) {
      sheet
        .getRange(rowNumber, INBOUND_HEADERS.indexOf(header) + 1)
        .setNumberFormat("@");
    });
  sheet
    .getRange(rowNumber, 1, 1, INBOUND_HEADERS.length)
    .setVerticalAlignment("top")
    .setWrap(true);
  existingMessageIds[sourceMessageId] = true;

  return {
    ok: true,
    duplicate: false,
    inboundId: inboundId,
    sourceMessageId: sourceMessageId,
  };
}

function retentionDeleteAfter_(ingestedAt) {
  const retentionDate = new Date(ingestedAt.getTime());
  retentionDate.setUTCDate(retentionDate.getUTCDate() + RETENTION_DAYS);
  return retentionDate;
}

function inboundTimestamps_(receivedAt, ingestedAt) {
  const ingestionDate = new Date(ingestedAt.getTime());
  return {
    receivedAt: validDateOrNow_(receivedAt),
    ingestedAt: ingestionDate,
    retentionDate: retentionDeleteAfter_(ingestionDate),
  };
}

function migrateLegacyInboundTimestamps_(retentionValue, migrationTime) {
  const maximumRetention = retentionDeleteAfter_(migrationTime);
  const legacyRetention = new Date(String(retentionValue || ""));
  const retentionDate =
    !Number.isNaN(legacyRetention.getTime()) &&
    legacyRetention.getTime() < maximumRetention.getTime()
      ? legacyRetention
      : maximumRetention;
  const ingestedAt = new Date(retentionDate.getTime());
  ingestedAt.setUTCDate(ingestedAt.getUTCDate() - RETENTION_DAYS);
  return { ingestedAt: ingestedAt, retentionDate: retentionDate };
}

function migrateLegacyInboundRows_(sheet, migrationTime) {
  const rowCount = sheet.getLastRow() - 1;
  if (rowCount < 1) return;

  const retentionColumn =
    INBOUND_HEADERS.indexOf("Retention_Delete_After") + 1;
  const ingestedColumn = INBOUND_HEADERS.indexOf("Ingested_UTC") + 1;
  const retentionValues = sheet
    .getRange(2, retentionColumn, rowCount, 1)
    .getDisplayValues();
  const migrated = retentionValues.map(function (row) {
    return migrateLegacyInboundTimestamps_(row[0], migrationTime);
  });

  sheet
    .getRange(2, ingestedColumn, rowCount, 1)
    .setValues(migrated.map(function (value) {
      return [value.ingestedAt.toISOString()];
    }))
    .setNumberFormat("@");
  sheet
    .getRange(2, retentionColumn, rowCount, 1)
    .setValues(migrated.map(function (value) {
      return [value.retentionDate.toISOString()];
    }))
    .setNumberFormat("@");
}

function ensureInboundQueue_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(INBOUND_QUEUE_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(INBOUND_QUEUE_SHEET);

  const legacyHeaders = INBOUND_HEADERS.filter(function (header) {
    return header !== "Ingested_UTC";
  });
  if (sheet.getLastRow() > 0 && sheet.getLastColumn() >= legacyHeaders.length) {
    const currentLegacy = sheet
      .getRange(1, 1, 1, legacyHeaders.length)
      .getDisplayValues()[0];
    if (currentLegacy.join("\u001f") === legacyHeaders.join("\u001f")) {
      sheet.insertColumnAfter(legacyHeaders.indexOf("Received_UTC") + 1);
      sheet
        .getRange(1, INBOUND_HEADERS.indexOf("Ingested_UTC") + 1)
        .setValue("Ingested_UTC");
      migrateLegacyInboundRows_(sheet, new Date());
    }
  }

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
    230, 260, 165, 165, 165, 150, 150, 145, 120, 420,
    180, 125, 170, 150, 300, 165, 180, 330,
  ];
  widths.forEach(function (width, index) {
    sheet.setColumnWidth(index + 1, width);
  });

  const maxRows = Math.max(sheet.getMaxRows(), 2);
  [
    "Received_UTC",
    "Ingested_UTC",
    "Reviewed_At_UTC",
    "Retention_Delete_After",
  ].forEach(function (header) {
    sheet
      .getRange(2, INBOUND_HEADERS.indexOf(header) + 1, maxRows - 1, 1)
      .setNumberFormat("@");
  });
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

function loadQueueMessageIds_(sheet) {
  const messageIds = Object.create(null);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return messageIds;

  const column = INBOUND_HEADERS.indexOf("Source_Message_ID") + 1;
  sheet
    .getRange(2, column, lastRow - 1, 1)
    .getDisplayValues()
    .forEach(function (row) {
      const messageId = String(row[0] || "");
      if (messageId) messageIds[messageId] = true;
    });
  return messageIds;
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
