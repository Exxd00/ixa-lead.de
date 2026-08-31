const SCHEMA_VERSION = 2;
const PROSPECTS_SHEET = "01 Prospects";
const PERSONAL_PAGE_CONTENT_SHEET = "11 Page Content";
const PERSONAL_PAGE_ACTIVATION_SHEET = "12 Page Activations";
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
const PERSONAL_PAGE_EVIDENCE_SCHEMA = "ixa.personal-page-observation.v1";
const PAGE_ACTIVATION_SCHEMA_VERSION = 1;
const PAGE_ACTIVATION_SCOPE = "PAGE_ACTIVATION";
const PAGE_ACTIVATION_SECRET_PROPERTY = "IXA_PAGE_ACTIVATION_SECRET_V1";
const PAGE_ACTIVATION_MAX_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_ACTIVATION_TRIGGER_HANDLER = "processPendingPageActivations";
const PAGE_ACTIVATION_UNIT_SEPARATOR = "\u001f";
const PAGE_ACTIVATION_RECORD_SEPARATOR = "\u001e";
const ACTIVATION_OWNER_APPROVER = "Owner-Emad-Alzaim";
const POSTAL_ACTIVATION_SHEET = "13 Postal Activations";
const POSTAL_ACTIVATION_SCHEMA_VERSION = 2;
const POSTAL_ACTIVATION_SCOPE = "PRINT_READY";
const POSTAL_ACTIVATION_PRIVATE_KEY_PROPERTY =
  "IXA_POSTAL_ACTIVATION_PRIVATE_KEY_PEM_V1";
const POSTAL_ACTIVATION_KEY_ID_PROPERTY = "IXA_POSTAL_ACTIVATION_KEY_ID_V1";
const POSTAL_ACTIVATION_KEY_ID = "IXA-POSTAL-RSA-2026-01";
const POSTAL_ACTIVATION_MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const POSTAL_ACTIVATION_SIGNATURE_DOMAIN = "IXA_POSTAL_ACTIVATION_V2\n";

const PERSONAL_PAGE_CONTENT_HEADERS = [
  "Page_Content_ID",
  "Batch_ID",
  "Experiment_ID",
  "Page_Version",
  "Company_ID",
  "Contact_ID",
  "Token_SHA256",
  "Letter_ID",
  "Public_Page_Label",
  "Evidence_1",
  "Evidence_2",
  "Content_SHA256",
  "State",
  "Approval_Status",
  "Approved_By",
  "Approved_At_UTC",
  "Activated_At_UTC",
  "Expires_UTC",
  "Source_Run_ID",
  "Activation_Receipt_ID",
  "Activation_Receipt_SHA256",
];

const PERSONAL_PAGE_HASH_FIELDS = PERSONAL_PAGE_CONTENT_HEADERS.slice(0, 11);

const PERSONAL_PAGE_ACTIVATION_HEADERS = [
  "Activation_Receipt_ID",
  "Schema_Version",
  "Scope",
  "Batch_ID",
  "Recipient_Set_Hash",
  "Page_Version",
  "Page_Set_SHA256",
  "Recipient_Count",
  "Approved_By",
  "Approved_At_UTC",
  "Expires_At_UTC",
  "Nonce",
  "Signature_HMAC_SHA256",
  "Receipt_SHA256",
  "State",
  "Consumed_At_UTC",
  "Source_Run_ID",
  "Activation_Error",
];

const PERSONAL_PAGE_ACTIVATION_LEGACY_HEADERS =
  PERSONAL_PAGE_ACTIVATION_HEADERS.slice(0, 17);

const PAGE_ACTIVATION_SIGNATURE_HEADERS = [
  "Schema_Version",
  "Scope",
  "Activation_Receipt_ID",
  "Batch_ID",
  "Recipient_Set_Hash",
  "Page_Version",
  "Page_Set_SHA256",
  "Recipient_Count",
  "Approved_By",
  "Approved_At_UTC",
  "Expires_At_UTC",
  "Consumed_At_UTC",
  "Nonce",
];

const POSTAL_ACTIVATION_HEADERS = [
  "Activation_Receipt_ID",
  "Schema_Version",
  "Approved_For",
  "Batch_ID",
  "Content_Version",
  "Letter_Date",
  "Recipient_Count",
  "Batch_Digest_SHA256",
  "Approved_By",
  "Approved_At_UTC",
  "Expires_At_UTC",
  "Nonce",
  "Key_ID",
  "Signature_RSA_SHA256_B64URL",
  "Receipt_SHA256",
  "State",
  "Consumed_At_UTC",
  "Source_Run_ID",
  "Activation_Error",
];

const POSTAL_ACTIVATION_SIGNED_FIELDS = [
  "approved_at_utc",
  "approved_by",
  "approved_for",
  "batch_digest_sha256",
  "batch_id",
  "consumed_at_utc",
  "content_version",
  "expires_at_utc",
  "key_id",
  "letter_date",
  "nonce",
  "receipt_id",
  "recipient_count",
  "schema_version",
];

const PERSONAL_PAGE_EVENT_HEADERS = [
  "Event_Name",
  "Event_UTC",
  "Company_ID",
  "Contact_ID",
  "Token_SHA256",
  "Page_Content_ID",
  "Batch_ID",
  "Experiment_ID",
  "Page_Version",
  "Letter_ID",
  "Content_SHA256",
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
        properties.getProperty(PAGE_ACTIVATION_SECRET_PROPERTY),
      );
      if (!resolution) return json_({ ok: true, allowed: false });
      return json_({
        ok: true,
        allowed: true,
        publicPageLabel: resolution.publicPageLabel,
        findings: resolution.findings,
        firstTest: resolution.firstTest,
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
  const pageContent = ensurePersonalPageContent_(spreadsheet);
  const pageActivations = ensurePersonalPageActivations_(spreadsheet);
  const postalActivations = ensurePostalActivations_(spreadsheet);
  const events = ensurePersonalPageEvents_(spreadsheet);
  formatInboundQueue_(queue);
  formatPersonalPageEvents_(events);
  ensureRetentionTrigger_();
  ensurePageActivationTrigger_();
  SpreadsheetApp.flush();

  return {
    ok: true,
    sheet: queue.getName(),
    columns: INBOUND_HEADERS.length,
    personalPageEventsSheet: events.getName(),
    personalPageContentSheet: pageContent.getName(),
    personalPageActivationSheet: pageActivations.getName(),
    postalActivationSheet: postalActivations.getName(),
  };
}

function ensurePersonalPageContent_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(PERSONAL_PAGE_CONTENT_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(PERSONAL_PAGE_CONTENT_SHEET);
  const missing = PERSONAL_PAGE_CONTENT_HEADERS.length - sheet.getMaxColumns();
  if (missing > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), missing);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, PERSONAL_PAGE_CONTENT_HEADERS.length)
      .setValues([PERSONAL_PAGE_CONTENT_HEADERS]);
  } else {
    let headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getDisplayValues()[0];
    const legacyHeaders = PERSONAL_PAGE_CONTENT_HEADERS.slice(0, 19);
    if (headers.join("\u001f") === legacyHeaders.join("\u001f")) {
      sheet.getRange(1, 20, 1, 2).setValues([[
        "Activation_Receipt_ID",
        "Activation_Receipt_SHA256",
      ]]);
      headers = sheet
        .getRange(1, 1, 1, PERSONAL_PAGE_CONTENT_HEADERS.length)
        .getDisplayValues()[0];
    }
    if (headers.join("\u001f") !== PERSONAL_PAGE_CONTENT_HEADERS.join("\u001f")) {
      throw new Error("personal_page_content_schema_mismatch");
    }
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, PERSONAL_PAGE_CONTENT_HEADERS.length)
    .setBackground("#356853").setFontColor("#FFFFFF")
    .setFontWeight("bold").setWrap(true);
  return sheet;
}

function ensurePersonalPageActivations_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(PERSONAL_PAGE_ACTIVATION_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(PERSONAL_PAGE_ACTIVATION_SHEET);
  if (sheet.getLastRow() === 0) {
    const missing = PERSONAL_PAGE_ACTIVATION_HEADERS.length - sheet.getMaxColumns();
    if (missing > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), missing);
    sheet.getRange(1, 1, 1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
      .setValues([PERSONAL_PAGE_ACTIVATION_HEADERS]);
  } else {
    let headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getDisplayValues()[0];
    if (
      headers.join(PAGE_ACTIVATION_UNIT_SEPARATOR) ===
      PERSONAL_PAGE_ACTIVATION_LEGACY_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
    ) {
      if (sheet.getMaxColumns() < PERSONAL_PAGE_ACTIVATION_HEADERS.length) {
        sheet.insertColumnsAfter(
          sheet.getMaxColumns(),
          PERSONAL_PAGE_ACTIVATION_HEADERS.length - sheet.getMaxColumns(),
        );
      }
      sheet
        .getRange(1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
        .setValue("Activation_Error");
      headers = sheet
        .getRange(1, 1, 1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
        .getDisplayValues()[0];
    }
    if (
      headers.join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
      PERSONAL_PAGE_ACTIVATION_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
    ) {
      throw new Error("personal_page_activation_schema_mismatch");
    }
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
    .setBackground("#356853").setFontColor("#FFFFFF")
    .setFontWeight("bold").setWrap(true);
  return sheet;
}

function ensurePostalActivations_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(POSTAL_ACTIVATION_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(POSTAL_ACTIVATION_SHEET);
  const missing = POSTAL_ACTIVATION_HEADERS.length - sheet.getMaxColumns();
  if (missing > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), missing);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, POSTAL_ACTIVATION_HEADERS.length)
      .setValues([POSTAL_ACTIVATION_HEADERS]);
  } else {
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getDisplayValues()[0];
    if (
      headers.join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
      POSTAL_ACTIVATION_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
    ) {
      throw new Error("postal_activation_schema_mismatch");
    }
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, POSTAL_ACTIVATION_HEADERS.length)
    .setBackground("#356853").setFontColor("#FFFFFF")
    .setFontWeight("bold").setWrap(true);
  return sheet;
}

function processPendingPageActivations() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: "busy" };

  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty("OUTREACH_SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("missing_outreach_spreadsheet_id");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const pageResult = processPersonalPageActivations_(
      spreadsheet,
      properties.getProperty(PAGE_ACTIVATION_SECRET_PROPERTY),
      new Date(),
    );
    const postalResult = processPostalActivations_(
      spreadsheet,
      properties.getProperty(POSTAL_ACTIVATION_PRIVATE_KEY_PROPERTY),
      properties.getProperty(POSTAL_ACTIVATION_KEY_ID_PROPERTY) ||
        POSTAL_ACTIVATION_KEY_ID,
      new Date(),
    );
    return { ok: true, page: pageResult, postal: postalResult };
  } finally {
    lock.releaseLock();
  }
}

function processPersonalPageActivations_(spreadsheet, secret, now) {
  const pageContentSheet = ensurePersonalPageContent_(spreadsheet);
  const activationSheet = ensurePersonalPageActivations_(spreadsheet);
  const nowDate = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error("invalid_activation_clock");

  const contentHeaders = pageContentSheet
    .getRange(1, 1, 1, pageContentSheet.getLastColumn())
    .getDisplayValues()[0];
  const activationHeaders = activationSheet
    .getRange(1, 1, 1, activationSheet.getLastColumn())
    .getDisplayValues()[0];
  if (
    contentHeaders.join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
      PERSONAL_PAGE_CONTENT_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR) ||
    activationHeaders.join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
      PERSONAL_PAGE_ACTIVATION_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
  ) {
    throw new Error("personal_page_activation_schema_mismatch");
  }

  const contentColumns = headerMap_(contentHeaders);
  const activationColumns = headerMap_(activationHeaders);
  const contentRows = pageContentSheet.getLastRow() < 2
    ? []
    : pageContentSheet
      .getRange(
        2,
        1,
        pageContentSheet.getLastRow() - 1,
        contentHeaders.length,
      )
      .getDisplayValues();
  const activationRows = activationSheet.getLastRow() < 2
    ? []
    : activationSheet
      .getRange(
        2,
        1,
        activationSheet.getLastRow() - 1,
        activationHeaders.length,
      )
      .getDisplayValues();
  const actionable = activationRows.map(function (row, index) {
    return { row: row, index: index };
  }).filter(function (entry) {
    const state = String(entry.row[activationColumns.State] || "").trim();
    return state === "Pending" || state === "Signing";
  });

  let consumed = 0;
  let rejected = 0;
  actionable.forEach(function (entry) {
    try {
      processPersonalPageActivationRow_(
        pageContentSheet,
        contentRows,
        contentColumns,
        activationSheet,
        activationRows,
        activationColumns,
        entry.index,
        secret,
        nowDate,
      );
      consumed += 1;
    } catch (error) {
      const next = entry.row.slice(0, activationHeaders.length);
      next[activationColumns.State] = "Rejected";
      next[activationColumns.Activation_Error] = activationError_(error);
      activationSheet
        .getRange(entry.index + 2, 1, 1, activationHeaders.length)
        .setValues([next]);
      SpreadsheetApp.flush();
      rejected += 1;
    }
  });

  return {
    ok: true,
    examined: actionable.length,
    consumed: consumed,
    rejected: rejected,
  };
}

function processPersonalPageActivationRow_(
  pageContentSheet,
  contentRows,
  contentColumns,
  activationSheet,
  activationRows,
  activationColumns,
  activationIndex,
  secret,
  now,
) {
  const sourceRow = activationRows[activationIndex];
  const state = String(sourceRow[activationColumns.State] || "").trim();
  if (state !== "Pending" && state !== "Signing") {
    throw new Error("activation_not_actionable");
  }
  if (typeof secret !== "string" || Utilities.newBlob(secret).getBytes().length < 32) {
    throw new Error("invalid_activation_secret");
  }

  let request;
  let signingRow;
  if (state === "Pending") {
    request = pendingPageActivationRequest_(sourceRow, activationColumns, now);
  } else {
    request = signingPageActivationRequest_(
      sourceRow,
      activationColumns,
      secret,
      now,
    );
  }

  assertUniquePageActivationRequest_(
    activationRows,
    activationColumns,
    activationIndex,
    request,
  );
  const members = pageActivationCandidateMembers_(
    contentRows,
    contentColumns,
    request,
    state === "Signing",
    now,
  );
  const hashes = pageActivationSetHashes_(members);
  if (!constantTimeHexEqual_(request.recipientSetHash, hashes.recipientSetHash)) {
    throw new Error("recipient_set_hash_mismatch");
  }
  if (!constantTimeHexEqual_(request.pageSetSha256, hashes.pageSetSha256)) {
    throw new Error("page_set_hash_mismatch");
  }

  if (state === "Pending") {
    signingRow = createSigningPageActivationRow_(
      sourceRow,
      activationColumns,
      activationRows,
      secret,
      now,
    );
    activationSheet
      .getRange(activationIndex + 2, 1, 1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
      .setValues([signingRow]);
    SpreadsheetApp.flush();
    request = signingPageActivationRequest_(
      signingRow,
      activationColumns,
      secret,
      now,
    );
  } else {
    signingRow = sourceRow.slice(0, PERSONAL_PAGE_ACTIVATION_HEADERS.length);
  }

  const activatedRows = members.map(function (member) {
    const row = member.row.slice(0, PERSONAL_PAGE_CONTENT_HEADERS.length);
    row[contentColumns.State] = "Active";
    row[contentColumns.Activated_At_UTC] = request.consumedAtUtc;
    row[contentColumns.Activation_Receipt_ID] = request.receiptId;
    row[contentColumns.Activation_Receipt_SHA256] = request.receiptSha256;
    return row;
  });
  pageContentSheet
    .getRange(
      members[0].index + 2,
      1,
      activatedRows.length,
      PERSONAL_PAGE_CONTENT_HEADERS.length,
    )
    .setValues(activatedRows);
  SpreadsheetApp.flush();

  const consumedRow = signingRow.slice(0, PERSONAL_PAGE_ACTIVATION_HEADERS.length);
  consumedRow[activationColumns.State] = "Consumed";
  consumedRow[activationColumns.Activation_Error] = "";
  activationSheet
    .getRange(activationIndex + 2, 1, 1, PERSONAL_PAGE_ACTIVATION_HEADERS.length)
    .setValues([consumedRow]);
  SpreadsheetApp.flush();
}

function pendingPageActivationRequest_(row, columns, now) {
  const nowMs = now.getTime();
  const receiptFields = [
    "Activation_Receipt_ID",
    "Nonce",
    "Signature_HMAC_SHA256",
    "Receipt_SHA256",
    "Consumed_At_UTC",
  ];
  if (receiptFields.some(function (name) {
    return String(row[columns[name]] || "").trim() !== "";
  })) {
    throw new Error("pending_activation_contains_receipt");
  }
  const request = basePageActivationRequest_(row, columns);
  const approvedAtMs = new Date(request.approvedAtUtc).getTime();
  const expiresAtMs = new Date(request.expiresAtUtc).getTime();
  if (
    String(row[columns.State] || "").trim() !== "Pending" ||
    approvedAtMs > nowMs ||
    expiresAtMs <= nowMs ||
    expiresAtMs <= approvedAtMs ||
    expiresAtMs > approvedAtMs + PAGE_ACTIVATION_MAX_TTL_MS
  ) {
    throw new Error("invalid_activation_window");
  }
  return request;
}

function signingPageActivationRequest_(row, columns, secret, now) {
  if (String(row[columns.State] || "").trim() !== "Signing") {
    throw new Error("activation_not_signing");
  }
  const request = basePageActivationRequest_(row, columns);
  const receipt = pageActivationReceipt_(row, columns, now.getTime());
  if (!receipt) throw new Error("invalid_signing_receipt");
  const signedBody = PAGE_ACTIVATION_SIGNATURE_HEADERS.map(function (name) {
    return String(row[columns[name]] == null ? "" : row[columns[name]]).trim();
  }).join(PAGE_ACTIVATION_UNIT_SEPARATOR);
  const expectedSignature = hmacSha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody,
    secret,
  );
  if (!constantTimeHexEqual_(expectedSignature, receipt.signature)) {
    throw new Error("activation_signature_mismatch");
  }
  const expectedReceiptSha256 = sha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody +
      PAGE_ACTIVATION_UNIT_SEPARATOR + receipt.signature,
  );
  if (!constantTimeHexEqual_(expectedReceiptSha256, receipt.receiptSha256)) {
    throw new Error("activation_receipt_hash_mismatch");
  }
  request.receiptId = receipt.receiptId;
  request.nonce = receipt.nonce;
  request.signature = receipt.signature;
  request.receiptSha256 = receipt.receiptSha256;
  request.consumedAtUtc = receipt.consumedAtUtc;
  return request;
}

function basePageActivationRequest_(row, columns) {
  const schemaVersion = String(row[columns.Schema_Version] || "").trim();
  const scope = String(row[columns.Scope] || "").trim();
  const batchId = safePageId_(row[columns.Batch_ID]);
  const recipientSetHash = String(row[columns.Recipient_Set_Hash] || "")
    .trim().toLowerCase();
  const pageVersion = safePageVersion_(row[columns.Page_Version]);
  const pageSetSha256 = String(row[columns.Page_Set_SHA256] || "")
    .trim().toLowerCase();
  const recipientCount = String(row[columns.Recipient_Count] || "").trim();
  const approvedBy = curatedPublicText_(row[columns.Approved_By] || "", 200);
  const approvedAtUtc = String(row[columns.Approved_At_UTC] || "").trim();
  const expiresAtUtc = String(row[columns.Expires_At_UTC] || "").trim();
  const sourceRunId = safePageId_(row[columns.Source_Run_ID]);
  if (
    schemaVersion !== String(PAGE_ACTIVATION_SCHEMA_VERSION) ||
    scope !== PAGE_ACTIVATION_SCOPE || !batchId ||
    !isHash_(recipientSetHash) || !pageVersion || !isHash_(pageSetSha256) ||
    recipientCount !== String(MAX_BATCH_ITEMS) ||
    approvedBy !== ACTIVATION_OWNER_APPROVER ||
    !isIsoUtcTimestamp_(approvedAtUtc) || !isIsoUtcTimestamp_(expiresAtUtc) ||
    !sourceRunId
  ) {
    throw new Error("invalid_activation_request");
  }
  return {
    batchId: batchId,
    recipientSetHash: recipientSetHash,
    pageVersion: pageVersion,
    pageSetSha256: pageSetSha256,
    recipientCount: MAX_BATCH_ITEMS,
    approvedBy: approvedBy,
    approvedAtUtc: approvedAtUtc,
    expiresAtUtc: expiresAtUtc,
    sourceRunId: sourceRunId,
  };
}

function assertUniquePageActivationRequest_(
  rows,
  columns,
  currentIndex,
  request,
) {
  const competing = rows.filter(function (row, index) {
    if (index === currentIndex) return false;
    const state = String(row[columns.State] || "").trim();
    return (
      ["Pending", "Signing", "Consumed"].indexOf(state) !== -1 &&
      String(row[columns.Scope] || "").trim() === PAGE_ACTIVATION_SCOPE &&
      String(row[columns.Batch_ID] || "").trim() === request.batchId &&
      String(row[columns.Page_Version] || "").trim() === request.pageVersion
    );
  });
  if (competing.length) throw new Error("duplicate_activation_request");

  if (request.receiptId && rows.some(function (row, index) {
    return index !== currentIndex &&
      String(row[columns.Activation_Receipt_ID] || "").trim() === request.receiptId;
  })) {
    throw new Error("duplicate_activation_receipt_id");
  }
  if (request.nonce && rows.some(function (row, index) {
    return index !== currentIndex &&
      String(row[columns.Nonce] || "").trim() === request.nonce;
  })) {
    throw new Error("duplicate_activation_nonce");
  }
}

function pageActivationCandidateMembers_(
  rows,
  columns,
  request,
  allowSigningRecovery,
  now,
) {
  const matching = rows.map(function (row, index) {
    return { row: row, index: index };
  }).filter(function (entry) {
    return (
      String(entry.row[columns.Batch_ID] || "").trim() === request.batchId &&
      String(entry.row[columns.Page_Version] || "").trim() === request.pageVersion
    );
  });
  if (matching.length !== MAX_BATCH_ITEMS) {
    throw new Error("activation_content_count_mismatch");
  }
  if (matching.some(function (entry, index) {
    return index > 0 && entry.index !== matching[index - 1].index + 1;
  })) {
    throw new Error("activation_content_not_contiguous");
  }

  return matching.map(function (entry) {
    const row = entry.row;
    const state = String(row[columns.State] || "").trim();
    const isPrepared = state === "Prepared";
    const isRecoverableActive = allowSigningRecovery && state === "Active";
    if ((!isPrepared && !isRecoverableActive) ||
        String(row[columns.Approval_Status] || "").trim() !== "Approved") {
      throw new Error("activation_content_not_prepared");
    }

    const pageContentId = safePageId_(row[columns.Page_Content_ID]);
    const experimentId = safePageId_(row[columns.Experiment_ID]);
    const companyId = safePageId_(row[columns.Company_ID]);
    const contactId = safePageId_(row[columns.Contact_ID]);
    const tokenHash = String(row[columns.Token_SHA256] || "").trim().toLowerCase();
    const letterId = safePageId_(row[columns.Letter_ID]);
    const publicPageLabel = curatedPublicText_(
      row[columns.Public_Page_Label] || "",
      120,
    );
    const contentSha256 = String(row[columns.Content_SHA256] || "")
      .trim().toLowerCase();
    const approvedBy = curatedPublicText_(row[columns.Approved_By] || "", 200);
    const approvedAtUtc = String(row[columns.Approved_At_UTC] || "").trim();
    const expiresUtc = String(row[columns.Expires_UTC] || "").trim();
    const sourceRunId = safePageId_(row[columns.Source_Run_ID]);
    const firstEvidence = parsePersonalPageEvidence_(row[columns.Evidence_1], 1, true);
    const secondEvidence = parsePersonalPageEvidence_(row[columns.Evidence_2], 2, false);
    if (
      !pageContentId || !experimentId || !companyId || !contactId ||
      !isHash_(tokenHash) || !letterId || !publicPageLabel ||
      !isHash_(contentSha256) || approvedBy !== request.approvedBy ||
      approvedAtUtc !== request.approvedAtUtc || !isIsoUtcTimestamp_(expiresUtc) ||
      new Date(expiresUtc).getTime() <= now.getTime() || !sourceRunId ||
      !firstEvidence || !secondEvidence || !firstEvidence.firstTest
    ) {
      throw new Error("invalid_activation_content");
    }
    const expectedContentSha256 = sha256Hex_(
      PERSONAL_PAGE_HASH_FIELDS.map(function (name) {
        return String(row[columns[name]] || "").trim();
      }).join(PAGE_ACTIVATION_UNIT_SEPARATOR),
    );
    if (!constantTimeHexEqual_(expectedContentSha256, contentSha256)) {
      throw new Error("activation_content_hash_mismatch");
    }

    const activatedAtUtc = String(row[columns.Activated_At_UTC] || "").trim();
    const activationReceiptId = String(
      row[columns.Activation_Receipt_ID] || "",
    ).trim();
    const activationReceiptSha256 = String(
      row[columns.Activation_Receipt_SHA256] || "",
    ).trim().toLowerCase();
    if (isPrepared && (activatedAtUtc || activationReceiptId || activationReceiptSha256)) {
      throw new Error("prepared_content_contains_activation");
    }
    if (isRecoverableActive && (
      activatedAtUtc !== request.consumedAtUtc ||
      activationReceiptId !== request.receiptId ||
      !constantTimeHexEqual_(activationReceiptSha256, request.receiptSha256)
    )) {
      throw new Error("active_content_receipt_mismatch");
    }

    return {
      row: row,
      index: entry.index,
      pageContentId: pageContentId,
      batchId: request.batchId,
      experimentId: experimentId,
      pageVersion: request.pageVersion,
      companyId: companyId,
      contactId: contactId,
      tokenHash: tokenHash,
      letterId: letterId,
      contentSha256: contentSha256,
      expiresUtc: expiresUtc,
      sourceRunId: sourceRunId,
    };
  });
}

function pageActivationSetHashes_(members) {
  const uniquenessFields = [
    "pageContentId",
    "companyId",
    "contactId",
    "tokenHash",
    "letterId",
  ];
  if (uniquenessFields.some(function (field) {
    return new Set(members.map(function (member) { return member[field]; })).size !==
      members.length;
  })) {
    throw new Error("activation_content_not_unique");
  }
  return {
    recipientSetHash: sha256Hex_(members.map(function (member) {
      return [member.companyId, member.contactId, member.tokenHash, member.letterId]
        .join(PAGE_ACTIVATION_UNIT_SEPARATOR);
    }).sort().join(PAGE_ACTIVATION_RECORD_SEPARATOR)),
    pageSetSha256: sha256Hex_(members.map(function (member) {
      return [
        member.pageContentId,
        member.batchId,
        member.experimentId,
        member.pageVersion,
        member.companyId,
        member.contactId,
        member.tokenHash,
        member.letterId,
        member.contentSha256,
        member.expiresUtc,
        member.sourceRunId,
      ].join(PAGE_ACTIVATION_UNIT_SEPARATOR);
    }).sort().join(PAGE_ACTIVATION_RECORD_SEPARATOR)),
  };
}

function createSigningPageActivationRow_(
  sourceRow,
  columns,
  activationRows,
  secret,
  now,
) {
  const next = sourceRow.slice(0, PERSONAL_PAGE_ACTIVATION_HEADERS.length);
  const existingReceiptIds = new Set(activationRows.map(function (row) {
    return String(row[columns.Activation_Receipt_ID] || "").trim();
  }));
  const existingNonces = new Set(activationRows.map(function (row) {
    return String(row[columns.Nonce] || "").trim();
  }));
  let receiptId = "";
  let nonce = "";
  for (let attempt = 0; attempt < 4 && (!receiptId || !nonce); attempt += 1) {
    const candidateReceiptId = "IXA-PA-" + Utilities.getUuid().replace(/-/g, "");
    const randomBytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() + Utilities.getUuid(),
      Utilities.Charset.UTF_8,
    );
    const candidateNonce = Utilities.base64EncodeWebSafe(randomBytes)
      .replace(/=+$/g, "");
    if (!existingReceiptIds.has(candidateReceiptId)) receiptId = candidateReceiptId;
    if (
      /^[A-Za-z0-9_-]{43}$/.test(candidateNonce) &&
      new Set(candidateNonce).size >= 12 &&
      !existingNonces.has(candidateNonce)
    ) {
      nonce = candidateNonce;
    }
  }
  if (!receiptId || !nonce) throw new Error("activation_randomness_failure");

  next[columns.Activation_Receipt_ID] = receiptId;
  next[columns.Nonce] = nonce;
  next[columns.Consumed_At_UTC] = now.toISOString();
  next[columns.State] = "Signing";
  next[columns.Activation_Error] = "";
  const signedBody = PAGE_ACTIVATION_SIGNATURE_HEADERS.map(function (name) {
    return String(next[columns[name]] == null ? "" : next[columns[name]]).trim();
  }).join(PAGE_ACTIVATION_UNIT_SEPARATOR);
  const signature = hmacSha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody,
    secret,
  );
  next[columns.Signature_HMAC_SHA256] = signature;
  next[columns.Receipt_SHA256] = sha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody +
      PAGE_ACTIVATION_UNIT_SEPARATOR + signature,
  );
  return next;
}

function activationError_(error) {
  const message = error && error.message ? String(error.message) : "activation_error";
  const normalized = message.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 240);
  return normalized || "activation_error";
}

function processPostalActivations_(spreadsheet, privateKeyValue, keyIdValue, now) {
  const sheet = ensurePostalActivations_(spreadsheet);
  const nowDate = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error("invalid_postal_activation_clock");
  if (sheet.getLastRow() < 2) {
    return { ok: true, examined: 0, consumed: 0, rejected: 0, pending: 0 };
  }
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  if (
    headers.join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
    POSTAL_ACTIVATION_HEADERS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
  ) {
    throw new Error("postal_activation_schema_mismatch");
  }
  const columns = headerMap_(headers);
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getDisplayValues();
  const privateKey = String(privateKeyValue || "").replace(/\\n/g, "\n").trim();
  const keyId = String(keyIdValue || "").trim();
  let consumed = 0;
  let rejected = 0;
  let pending = 0;

  rows.forEach(function (row, index) {
    if (String(row[columns.State] || "").trim() !== "Pending") return;
    try {
      const request = pendingPostalActivationRequest_(
        row,
        columns,
        rows,
        index,
        nowDate,
      );
      if (
        keyId !== POSTAL_ACTIVATION_KEY_ID ||
        !/^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----$/.test(
          privateKey,
        ) ||
        privateKey.length < 1000
      ) {
        throw new Error("postal_signing_key_unavailable");
      }
      const next = createConsumedPostalActivationRow_(
        row,
        columns,
        request,
        privateKey,
        keyId,
        nowDate,
      );
      sheet.getRange(index + 2, 1, 1, headers.length).setValues([next]);
      SpreadsheetApp.flush();
      consumed += 1;
    } catch (error) {
      const next = row.slice(0, headers.length);
      const code = activationError_(error);
      const infrastructureError = code === "postal_signing_key_unavailable";
      next[columns.State] = infrastructureError ? "Pending" : "Rejected";
      next[columns.Activation_Error] = code;
      sheet.getRange(index + 2, 1, 1, headers.length).setValues([next]);
      SpreadsheetApp.flush();
      if (infrastructureError) pending += 1;
      else rejected += 1;
    }
  });
  return {
    ok: true,
    examined: consumed + rejected + pending,
    consumed: consumed,
    rejected: rejected,
    pending: pending,
  };
}

function pendingPostalActivationRequest_(row, columns, rows, currentIndex, now) {
  const generatedFields = [
    "Activation_Receipt_ID",
    "Nonce",
    "Key_ID",
    "Signature_RSA_SHA256_B64URL",
    "Receipt_SHA256",
    "Consumed_At_UTC",
  ];
  if (generatedFields.some(function (name) {
    return String(row[columns[name]] || "").trim() !== "";
  })) {
    throw new Error("pending_postal_activation_contains_receipt");
  }
  const schemaVersion = String(row[columns.Schema_Version] || "").trim();
  const approvedFor = String(row[columns.Approved_For] || "").trim();
  const batchId = safePageId_(row[columns.Batch_ID]);
  const contentVersion = safePageId_(row[columns.Content_Version]);
  const letterDate = String(row[columns.Letter_Date] || "").trim();
  const recipientCount = String(row[columns.Recipient_Count] || "").trim();
  const batchDigest = String(row[columns.Batch_Digest_SHA256] || "")
    .trim().toLowerCase();
  const approvedBy = curatedPublicText_(row[columns.Approved_By] || "", 120);
  const approvedAtUtc = String(row[columns.Approved_At_UTC] || "").trim();
  const expiresAtUtc = String(row[columns.Expires_At_UTC] || "").trim();
  const sourceRunId = safePageId_(row[columns.Source_Run_ID]);
  if (
    schemaVersion !== String(POSTAL_ACTIVATION_SCHEMA_VERSION) ||
    approvedFor !== POSTAL_ACTIVATION_SCOPE || !batchId || !contentVersion ||
    !curatedIsoDate_(letterDate) || recipientCount !== String(MAX_BATCH_ITEMS) ||
    !isHash_(batchDigest) || approvedBy !== ACTIVATION_OWNER_APPROVER ||
    !isIsoUtcTimestamp_(approvedAtUtc) || !isIsoUtcTimestamp_(expiresAtUtc) ||
    !sourceRunId || String(row[columns.State] || "").trim() !== "Pending"
  ) {
    throw new Error("invalid_postal_activation_request");
  }
  const approvedAtMs = new Date(approvedAtUtc).getTime();
  const expiresAtMs = new Date(expiresAtUtc).getTime();
  if (
    approvedAtMs > now.getTime() + 5 * 60 * 1000 ||
    expiresAtMs <= now.getTime() || expiresAtMs <= approvedAtMs ||
    expiresAtMs > approvedAtMs + POSTAL_ACTIVATION_MAX_TTL_MS
  ) {
    throw new Error("invalid_postal_activation_window");
  }
  const competing = rows.filter(function (candidate, index) {
    if (index === currentIndex) return false;
    const state = String(candidate[columns.State] || "").trim();
    return (
      ["Pending", "Consumed"].indexOf(state) !== -1 &&
      String(candidate[columns.Batch_ID] || "").trim() === batchId
    );
  });
  if (competing.length) throw new Error("duplicate_postal_activation_request");
  return {
    batchId: batchId,
    contentVersion: contentVersion,
    letterDate: letterDate,
    batchDigest: batchDigest,
    approvedBy: approvedBy,
    approvedAtUtc: approvedAtUtc,
    expiresAtUtc: expiresAtUtc,
    sourceRunId: sourceRunId,
  };
}

function createConsumedPostalActivationRow_(
  sourceRow,
  columns,
  request,
  privateKey,
  keyId,
  now,
) {
  const next = sourceRow.slice(0, POSTAL_ACTIVATION_HEADERS.length);
  const receiptId = "IXA-PRA-" + Utilities.getUuid().replace(/-/g, "");
  const randomBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + Utilities.getUuid(),
    Utilities.Charset.UTF_8,
  );
  const nonce = Utilities.base64EncodeWebSafe(randomBytes).replace(/=+$/g, "");
  if (
    !safePageId_(receiptId) || !/^[A-Za-z0-9_-]{43}$/.test(nonce) ||
    new Set(nonce).size < 12
  ) {
    throw new Error("postal_activation_randomness_failure");
  }
  const consumedAtUtc = now.toISOString();
  const signed = {
    approved_at_utc: request.approvedAtUtc,
    approved_by: request.approvedBy,
    approved_for: POSTAL_ACTIVATION_SCOPE,
    batch_digest_sha256: request.batchDigest,
    batch_id: request.batchId,
    consumed_at_utc: consumedAtUtc,
    content_version: request.contentVersion,
    expires_at_utc: request.expiresAtUtc,
    key_id: keyId,
    letter_date: request.letterDate,
    nonce: nonce,
    receipt_id: receiptId,
    recipient_count: MAX_BATCH_ITEMS,
    schema_version: POSTAL_ACTIVATION_SCHEMA_VERSION,
  };
  if (
    Object.keys(signed).join(PAGE_ACTIVATION_UNIT_SEPARATOR) !==
    POSTAL_ACTIVATION_SIGNED_FIELDS.join(PAGE_ACTIVATION_UNIT_SEPARATOR)
  ) {
    throw new Error("postal_activation_canonical_schema_mismatch");
  }
  const canonical = JSON.stringify(signed);
  const signatureBytes = Utilities.computeRsaSha256Signature(
    POSTAL_ACTIVATION_SIGNATURE_DOMAIN + canonical,
    privateKey,
  );
  const signature = Utilities.base64EncodeWebSafe(signatureBytes)
    .replace(/=+$/g, "");
  if (!/^[A-Za-z0-9_-]{300,400}$/.test(signature)) {
    throw new Error("postal_activation_signature_format_error");
  }
  const receiptSha256 = sha256Hex_(
    POSTAL_ACTIVATION_SIGNATURE_DOMAIN + canonical +
      PAGE_ACTIVATION_UNIT_SEPARATOR + signature,
  );
  next[columns.Activation_Receipt_ID] = receiptId;
  next[columns.Key_ID] = keyId;
  next[columns.Nonce] = nonce;
  next[columns.Signature_RSA_SHA256_B64URL] = signature;
  next[columns.Receipt_SHA256] = receiptSha256;
  next[columns.State] = "Consumed";
  next[columns.Consumed_At_UTC] = consumedAtUtc;
  next[columns.Activation_Error] = "";
  return next;
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

function resolvePersonalPage_(
  spreadsheet,
  tokenProof,
  secret,
  pageActivationSecret,
) {
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
  const content = resolvePersonalPageContent_(
    spreadsheet,
    companyId,
    contactId,
    tokenHash,
    pageActivationSecret,
  );
  if (!content) return null;

  return {
    publicPageLabel: content.publicPageLabel,
    findings: content.findings,
    firstTest: content.firstTest,
    visitTicket: createPersonalPageTicket_(
      {
        companyId: companyId,
        contactId: contactId,
        tokenHash: tokenHash,
        pageContentId: content.pageContentId,
        batchId: content.batchId,
        experimentId: content.experimentId,
        pageVersion: content.pageVersion,
        letterId: content.letterId,
        contentSha256: content.contentSha256,
      },
      secret,
    ),
  };
}

function resolvePersonalPageContent_(
  spreadsheet,
  companyId,
  contactId,
  tokenHash,
  pageActivationSecret,
) {
  const sheet = spreadsheet.getSheetByName(PERSONAL_PAGE_CONTENT_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  if (
    headers.length !== PERSONAL_PAGE_CONTENT_HEADERS.length ||
    PERSONAL_PAGE_CONTENT_HEADERS.some(function (name, index) {
      return headers[index] !== name;
    })
  ) {
    throw new Error("personal_page_content_schema_mismatch");
  }

  const columns = headerMap_(headers);
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  const candidates = rows.filter(function (row) {
    return (
      String(row[columns.Company_ID] || "").trim() === companyId &&
      String(row[columns.Contact_ID] || "").trim() === contactId &&
      String(row[columns.Token_SHA256] || "").trim().toLowerCase() === tokenHash &&
      String(row[columns.State] || "").trim() === "Active" &&
      String(row[columns.Approval_Status] || "").trim() ===
        "Approved" &&
      curatedPublicText_(row[columns.Approved_By] || "", 200) &&
      isIsoUtcTimestamp_(row[columns.Approved_At_UTC]) &&
      isIsoUtcTimestamp_(row[columns.Activated_At_UTC])
    );
  });
  if (candidates.length !== 1) return null;

  const row = candidates[0];
  const ids = {
    pageContentId: safePageId_(row[columns.Page_Content_ID]),
    batchId: safePageId_(row[columns.Batch_ID]),
    experimentId: safePageId_(row[columns.Experiment_ID]),
    pageVersion: safePageVersion_(row[columns.Page_Version]),
    letterId: safePageId_(row[columns.Letter_ID]),
  };
  if (Object.keys(ids).some(function (key) { return !ids[key]; })) return null;
  const expiry = String(row[columns.Expires_UTC] || "").trim();
  if (expiry && (!isIsoUtcTimestamp_(expiry) || new Date(expiry).getTime() <= Date.now())) {
    return null;
  }
  const expectedHash = sha256Hex_(PERSONAL_PAGE_HASH_FIELDS.map(function (name) {
    return String(row[columns[name]] || "").trim();
  }).join("\u001f"));
  const contentSha256 = String(row[columns.Content_SHA256] || "").trim().toLowerCase();
  if (!isHash_(contentSha256) || !constantTimeHexEqual_(expectedHash, contentSha256)) {
    return null;
  }
  const publicPageLabel = curatedPublicText_(row[columns.Public_Page_Label], 120);
  if (!publicPageLabel) return null;
  const first = parsePersonalPageEvidence_(
    row[columns.Evidence_1],
    1,
    true,
  );
  const second = parsePersonalPageEvidence_(
    row[columns.Evidence_2],
    2,
    false,
  );
  if (!first || !second || !first.firstTest) return null;
  const activation = verifyPersonalPageActivation_(
    spreadsheet,
    rows,
    columns,
    ids.batchId,
    ids.pageVersion,
    pageActivationSecret,
  );
  if (!activation) return null;

  return {
    pageContentId: ids.pageContentId,
    batchId: ids.batchId,
    experimentId: ids.experimentId,
    pageVersion: ids.pageVersion,
    letterId: ids.letterId,
    contentSha256: contentSha256,
    publicPageLabel: publicPageLabel,
    findings: [first.finding, second.finding],
    firstTest: first.firstTest,
  };
}

function verifyPersonalPageActivation_(
  spreadsheet,
  contentRows,
  contentColumns,
  batchId,
  pageVersion,
  secret,
) {
  if (typeof secret !== "string" || Utilities.newBlob(secret).getBytes().length < 32) {
    return null;
  }
  const sheet = spreadsheet.getSheetByName(PERSONAL_PAGE_ACTIVATION_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  if (
    headers.length !== PERSONAL_PAGE_ACTIVATION_HEADERS.length ||
    PERSONAL_PAGE_ACTIVATION_HEADERS.some(function (name, index) {
      return headers[index] !== name;
    })
  ) {
    throw new Error("personal_page_activation_schema_mismatch");
  }

  const activeMembers = contentRows.filter(function (row) {
    return (
      String(row[contentColumns.Batch_ID] || "").trim() === batchId &&
      String(row[contentColumns.Page_Version] || "").trim() === pageVersion &&
      String(row[contentColumns.State] || "").trim() === "Active" &&
      String(row[contentColumns.Approval_Status] || "").trim() === "Approved"
    );
  });
  if (activeMembers.length !== MAX_BATCH_ITEMS) return null;

  const memberRecords = activeMembers.map(function (row) {
    return personalPageActivationMember_(row, contentColumns, batchId, pageVersion);
  });
  if (memberRecords.some(function (record) { return !record; })) return null;

  const uniquenessFields = [
    "pageContentId",
    "companyId",
    "contactId",
    "tokenHash",
    "letterId",
  ];
  if (uniquenessFields.some(function (field) {
    return new Set(memberRecords.map(function (record) { return record[field]; })).size !==
      memberRecords.length;
  })) {
    return null;
  }

  const recipientSetHash = sha256Hex_(memberRecords.map(function (record) {
    return [record.companyId, record.contactId, record.tokenHash, record.letterId]
      .join(PAGE_ACTIVATION_UNIT_SEPARATOR);
  }).sort().join(PAGE_ACTIVATION_RECORD_SEPARATOR));
  const pageSetSha256 = sha256Hex_(memberRecords.map(function (record) {
    return [
      record.pageContentId,
      record.batchId,
      record.experimentId,
      record.pageVersion,
      record.companyId,
      record.contactId,
      record.tokenHash,
      record.letterId,
      record.contentSha256,
      record.expiresUtc,
      record.sourceRunId,
    ].join(PAGE_ACTIVATION_UNIT_SEPARATOR);
  }).sort().join(PAGE_ACTIVATION_RECORD_SEPARATOR));

  const activationColumns = headerMap_(headers);
  const activationRows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  const receipts = activationRows.filter(function (row) {
    return (
      String(row[activationColumns.Batch_ID] || "").trim() === batchId &&
      String(row[activationColumns.Page_Version] || "").trim() === pageVersion &&
      String(row[activationColumns.Scope] || "").trim() === PAGE_ACTIVATION_SCOPE &&
      String(row[activationColumns.State] || "").trim() === "Consumed"
    );
  });
  if (receipts.length !== 1) return null;

  const receipt = pageActivationReceipt_(receipts[0], activationColumns);
  if (!receipt || receipt.recipientCount !== memberRecords.length) return null;
  if (
    activationRows.filter(function (row) {
      return String(row[activationColumns.Activation_Receipt_ID] || "").trim() ===
        receipt.receiptId;
    }).length !== 1 ||
    activationRows.filter(function (row) {
      return String(row[activationColumns.Nonce] || "").trim() === receipt.nonce;
    }).length !== 1
  ) {
    return null;
  }
  if (
    !constantTimeHexEqual_(receipt.recipientSetHash, recipientSetHash) ||
    !constantTimeHexEqual_(receipt.pageSetSha256, pageSetSha256)
  ) {
    return null;
  }
  if (memberRecords.some(function (record) {
    return (
      record.approvedBy !== receipt.approvedBy ||
      record.approvedAtUtc !== receipt.approvedAtUtc ||
      record.activatedAtUtc !== receipt.consumedAtUtc ||
      record.activationReceiptId !== receipt.receiptId ||
      !constantTimeHexEqual_(record.activationReceiptSha256, receipt.receiptSha256)
    );
  })) {
    return null;
  }

  const signedBody = PAGE_ACTIVATION_SIGNATURE_HEADERS.map(function (name) {
    return String(receipts[0][activationColumns[name]] == null
      ? ""
      : receipts[0][activationColumns[name]]).trim();
  }).join(PAGE_ACTIVATION_UNIT_SEPARATOR);
  const expectedSignature = hmacSha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody,
    secret,
  );
  if (!constantTimeHexEqual_(expectedSignature, receipt.signature)) return null;
  const expectedReceiptSha256 = sha256Hex_(
    "IXA_PAGE_ACTIVATION_V1\n" + signedBody +
      PAGE_ACTIVATION_UNIT_SEPARATOR + receipt.signature,
  );
  if (!constantTimeHexEqual_(expectedReceiptSha256, receipt.receiptSha256)) {
    return null;
  }

  return {
    receiptId: receipt.receiptId,
    recipientSetHash: recipientSetHash,
    pageSetSha256: pageSetSha256,
  };
}

function personalPageActivationMember_(row, columns, batchId, pageVersion) {
  const pageContentId = safePageId_(row[columns.Page_Content_ID]);
  const companyId = safePageId_(row[columns.Company_ID]);
  const contactId = safePageId_(row[columns.Contact_ID]);
  const letterId = safePageId_(row[columns.Letter_ID]);
  const experimentId = safePageId_(row[columns.Experiment_ID]);
  const tokenHash = String(row[columns.Token_SHA256] || "").trim().toLowerCase();
  const contentSha256 = String(row[columns.Content_SHA256] || "").trim().toLowerCase();
  const approvedBy = curatedPublicText_(row[columns.Approved_By] || "", 200);
  const approvedAtUtc = String(row[columns.Approved_At_UTC] || "").trim();
  const activatedAtUtc = String(row[columns.Activated_At_UTC] || "").trim();
  const expiresUtc = String(row[columns.Expires_UTC] || "").trim();
  const sourceRunId = safePageId_(row[columns.Source_Run_ID]);
  const activationReceiptId = safePageId_(row[columns.Activation_Receipt_ID]);
  const activationReceiptSha256 = String(
    row[columns.Activation_Receipt_SHA256] || "",
  ).trim().toLowerCase();
  if (
    !pageContentId || !companyId || !contactId || !letterId || !experimentId ||
    !isHash_(tokenHash) || !isHash_(contentSha256) || !approvedBy ||
    !isIsoUtcTimestamp_(approvedAtUtc) || !isIsoUtcTimestamp_(activatedAtUtc) ||
    !isIsoUtcTimestamp_(expiresUtc) || new Date(expiresUtc).getTime() <= Date.now() ||
    !sourceRunId || !activationReceiptId || !isHash_(activationReceiptSha256) ||
    String(row[columns.Batch_ID] || "").trim() !== batchId ||
    String(row[columns.Page_Version] || "").trim() !== pageVersion
  ) {
    return null;
  }
  const expectedContentHash = sha256Hex_(PERSONAL_PAGE_HASH_FIELDS.map(function (name) {
    return String(row[columns[name]] || "").trim();
  }).join(PAGE_ACTIVATION_UNIT_SEPARATOR));
  if (!constantTimeHexEqual_(expectedContentHash, contentSha256)) return null;
  return {
    pageContentId: pageContentId,
    batchId: batchId,
    experimentId: experimentId,
    pageVersion: pageVersion,
    companyId: companyId,
    contactId: contactId,
    tokenHash: tokenHash,
    letterId: letterId,
    contentSha256: contentSha256,
    approvedBy: approvedBy,
    approvedAtUtc: approvedAtUtc,
    activatedAtUtc: activatedAtUtc,
    expiresUtc: expiresUtc,
    sourceRunId: sourceRunId,
    activationReceiptId: activationReceiptId,
    activationReceiptSha256: activationReceiptSha256,
  };
}

function pageActivationReceipt_(row, columns, nowMs) {
  const receiptId = safePageId_(row[columns.Activation_Receipt_ID]);
  const schemaVersion = String(row[columns.Schema_Version] || "").trim();
  const scope = String(row[columns.Scope] || "").trim();
  const recipientSetHash = String(row[columns.Recipient_Set_Hash] || "")
    .trim().toLowerCase();
  const pageSetSha256 = String(row[columns.Page_Set_SHA256] || "")
    .trim().toLowerCase();
  const countText = String(row[columns.Recipient_Count] || "").trim();
  const approvedBy = curatedPublicText_(row[columns.Approved_By] || "", 200);
  const approvedAtUtc = String(row[columns.Approved_At_UTC] || "").trim();
  const expiresAtUtc = String(row[columns.Expires_At_UTC] || "").trim();
  const nonce = String(row[columns.Nonce] || "").trim();
  const signature = String(row[columns.Signature_HMAC_SHA256] || "")
    .trim().toLowerCase();
  const receiptSha256 = String(row[columns.Receipt_SHA256] || "")
    .trim().toLowerCase();
  const consumedAtUtc = String(row[columns.Consumed_At_UTC] || "").trim();
  if (
    !receiptId || schemaVersion !== String(PAGE_ACTIVATION_SCHEMA_VERSION) ||
    scope !== PAGE_ACTIVATION_SCOPE || !isHash_(recipientSetHash) ||
    !isHash_(pageSetSha256) || countText !== "50" ||
    !approvedBy || !isIsoUtcTimestamp_(approvedAtUtc) ||
    !isIsoUtcTimestamp_(expiresAtUtc) ||
    !/^[A-Za-z0-9_-]{43}$/.test(nonce) || new Set(nonce).size < 12 ||
    !isHash_(signature) || !isHash_(receiptSha256) ||
    !isIsoUtcTimestamp_(consumedAtUtc)
  ) {
    return null;
  }
  const approvedAtMs = new Date(approvedAtUtc).getTime();
  const expiresAtMs = new Date(expiresAtUtc).getTime();
  const consumedAtMs = new Date(consumedAtUtc).getTime();
  const referenceNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (
    approvedAtMs > referenceNowMs + 5 * 60 * 1000 ||
    expiresAtMs <= approvedAtMs ||
    expiresAtMs > approvedAtMs + PAGE_ACTIVATION_MAX_TTL_MS ||
    consumedAtMs < approvedAtMs || consumedAtMs > expiresAtMs ||
    consumedAtMs > referenceNowMs
  ) {
    return null;
  }
  return {
    receiptId: receiptId,
    recipientSetHash: recipientSetHash,
    pageSetSha256: pageSetSha256,
    recipientCount: Number(countText),
    approvedBy: approvedBy,
    approvedAtUtc: approvedAtUtc,
    approvedAtMs: approvedAtMs,
    expiresAtMs: expiresAtMs,
    consumedAtUtc: consumedAtUtc,
    signature: signature,
    receiptSha256: receiptSha256,
    nonce: nonce,
  };
}

function safePageId_(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$/.test(text) ? text : "";
}

function safePageVersion_(value) {
  const text = String(value || "").trim();
  return /^v[1-9][0-9]{0,5}(?:\.(?:0|[1-9][0-9]{0,5}))?$/.test(text)
    ? text
    : "";
}

function parsePersonalPageEvidence_(value, expectedPosition, requireFirstTest) {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 8000) return null;

  let record;
  try {
    record = JSON.parse(raw);
  } catch (_error) {
    return null;
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }
  if (
    record.schema !== PERSONAL_PAGE_EVIDENCE_SCHEMA ||
    record.position !== expectedPosition
  ) {
    return null;
  }

  const sourceUrl = String(record.sourceUrl || "").trim();
  if (
    !sourceUrl ||
    sourceUrl.length > 2048 ||
    !/^https:\/\/[^\s<>"']+$/i.test(sourceUrl)
  ) {
    return null;
  }

  const finding = {
    title: curatedPublicText_(record.title, 120),
    observation: curatedPublicText_(record.observation, 900),
    implication: curatedPublicText_(record.implication, 900),
    sourceLabel: curatedPublicText_(record.sourceLabel, 160),
    verifiedAt: curatedIsoDate_(record.verifiedAt),
  };
  if (
    !finding.title ||
    !finding.observation ||
    !finding.implication ||
    !finding.sourceLabel ||
    !finding.verifiedAt
  ) {
    return null;
  }

  let firstTest = null;
  if (requireFirstTest) {
    const candidate = record.firstTest;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    firstTest = {
      title: curatedPublicText_(candidate.title, 160),
      description: curatedPublicText_(candidate.description, 1200),
    };
    if (!firstTest.title || !firstTest.description) return null;
  } else if (record.firstTest != null) {
    return null;
  }

  return { finding: finding, firstTest: firstTest };
}

function curatedPublicText_(value, maxLength) {
  if (typeof value !== "string") return "";
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    return "";
  }
  const text = value.replace(/\s+/g, " ").trim();
  return text && text.length <= maxLength ? text : "";
}

function curatedIsoDate_(value) {
  const text = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return "";
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.toISOString().slice(0, 10) === text ? text : "";
}

function isIsoUtcTimestamp_(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text)) {
    return false;
  }
  const date = new Date(text);
  return !Number.isNaN(date.getTime()) && date.toISOString() === text;
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
    pageContentId: String(record.pageContentId),
    batchId: String(record.batchId),
    experimentId: String(record.experimentId),
    pageVersion: String(record.pageVersion),
    letterId: String(record.letterId),
    contentSha256: String(record.contentSha256),
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
      !isHash_(record.tokenHash) ||
      !safePageId_(record.pageContentId) ||
      !safePageId_(record.batchId) ||
      !safePageId_(record.experimentId) ||
      !safePageVersion_(record.pageVersion) ||
      !safePageId_(record.letterId) ||
      !isHash_(record.contentSha256)
    ) {
      return null;
    }
    return {
      nonce: String(payload.nonce),
      expiresAt: Number(payload.expiresAt),
      companyId: String(record.companyId).slice(0, 200),
      contactId: String(record.contactId).slice(0, 200),
      tokenHash: String(record.tokenHash).toLowerCase(),
      pageContentId: String(record.pageContentId),
      batchId: String(record.batchId),
      experimentId: String(record.experimentId),
      pageVersion: String(record.pageVersion),
      letterId: String(record.letterId),
      contentSha256: String(record.contentSha256).toLowerCase(),
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
        safeCell_(verified.pageContentId, 120),
        safeCell_(verified.batchId, 120),
        safeCell_(verified.experimentId, 120),
        safeCell_(verified.pageVersion, 40),
        safeCell_(verified.letterId, 120),
        verified.contentSha256,
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

function ensurePageActivationTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === PAGE_ACTIVATION_TRIGGER_HANDLER;
  });
  if (!exists) {
    ScriptApp
      .newTrigger(PAGE_ACTIVATION_TRIGGER_HANDLER)
      .timeBased()
      .everyMinutes(5)
      .create();
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
