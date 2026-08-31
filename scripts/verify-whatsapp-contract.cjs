/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScriptModule(path, requireOverrides = {}) {
  const source = fs.readFileSync(path, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: path,
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (specifier) =>
    Object.hasOwn(requireOverrides, specifier)
      ? requireOverrides[specifier]
      : require(specifier);
  new Function("require", "module", "exports", output)(
    localRequire,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

function signedBytes(buffer) {
  return Array.from(buffer, (byte) => (byte > 127 ? byte - 256 : byte));
}

function loadAppsScript(path) {
  const cacheValues = new Map();
  const rsaSigningCalls = [];
  const context = vm.createContext({
    __rsaSigningCalls: rsaSigningCalls,
    CacheService: {
      getScriptCache: () => ({
        get: (key) => cacheValues.get(String(key)) || null,
        put: (key, value) => cacheValues.set(String(key), String(value)),
        remove: (key) => cacheValues.delete(String(key)),
      }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
    },
    SpreadsheetApp: { flush: () => {} },
    Utilities: {
      Charset: { UTF_8: "UTF_8" },
      DigestAlgorithm: { SHA_256: "SHA_256" },
      newBlob(value) {
        const buffer = Buffer.isBuffer(value)
          ? value
          : Array.isArray(value)
            ? Buffer.from(value.map((byte) => (byte < 0 ? byte + 256 : byte)))
            : Buffer.from(String(value), "utf8");
        return {
          getBytes: () => signedBytes(buffer),
          getDataAsString: () => buffer.toString("utf8"),
        };
      },
      base64EncodeWebSafe(value) {
        const buffer = Array.isArray(value)
          ? Buffer.from(value.map((byte) => (byte < 0 ? byte + 256 : byte)))
          : Buffer.from(String(value), "utf8");
        return buffer.toString("base64url");
      },
      base64DecodeWebSafe(value) {
        return signedBytes(Buffer.from(String(value), "base64url"));
      },
      getUuid() {
        return crypto.randomUUID();
      },
      computeDigest(_algorithm, value) {
        return signedBytes(
          crypto.createHash("sha256").update(String(value), "utf8").digest(),
        );
      },
      computeHmacSha256Signature(value, secret) {
        return signedBytes(
          crypto
            .createHmac("sha256", String(secret))
            .update(String(value), "utf8")
            .digest(),
        );
      },
      computeRsaSha256Signature(value, privateKey) {
        rsaSigningCalls.push({
          value: String(value),
          privateKey: String(privateKey),
        });
        const digest = crypto
          .createHash("sha256")
          .update(String(value), "utf8")
          .digest();
        return signedBytes(Buffer.concat(Array.from({ length: 8 }, () => digest)));
      },
    },
  });
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  return (expression) => vm.runInContext(expression, context);
}

function spreadsheetWithRows(headers, rows, metrics = {}) {
  const sheet = {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange(row, column, rowCount, columnCount) {
      metrics.rangeReads = (metrics.rangeReads || 0) + 1;
      const all = [headers, ...rows];
      const selected = all
        .slice(row - 1, row - 1 + rowCount)
        .map((values) => values.slice(column - 1, column - 1 + columnCount));
      return { getDisplayValues: () => selected };
    },
  };
  return {
    getSheetByName: (name) => (name === "01 Prospects" ? sheet : null),
  };
}

const webhook = loadTypeScriptModule("src/lib/whatsapp-webhook.ts");
const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "waba",
      changes: [
        {
          field: "messages",
          value: {
            metadata: { phone_number_id: "phone" },
            messages: [
              {
                id: "wamid.test",
                from: "004915731562524",
                timestamp: "1787760000",
                type: "text",
                text: {
                  body: "Bitte IXAP260827003 https://ixa-leads.de/r/D-C-vbdQt83-B3lACz10Dg",
                },
              },
            ],
          },
        },
      ],
    },
  ],
};
const rawPayload = JSON.stringify(payload);
const signature = `sha256=${crypto
  .createHmac("sha256", "app-secret")
  .update(rawPayload)
  .digest("hex")}`;
assert.equal(
  webhook.verifyMetaSignature(Buffer.from(rawPayload), signature, "app-secret"),
  true,
);
assert.equal(
  webhook.verifyMetaSignature(Buffer.from(rawPayload), signature, "wrong"),
  false,
);
assert.equal(webhook.extractWhatsAppMessages(payload, "wrong", "phone").length, 0);
const parsed = webhook.extractWhatsAppMessages(payload, "waba", "phone");
assert.equal(parsed.length, 1);
assert.equal(parsed[0].phoneE164, "+4915731562524");
assert.equal(parsed[0].referenceHashes.length, 2);

const overflowPayload = JSON.parse(JSON.stringify(payload));
overflowPayload.entry[0].changes[0].value.messages = Array.from(
  { length: webhook.maxWhatsAppMessagesPerWebhook + 1 },
  (_, index) => ({
    id: `wamid.overflow.${index}`,
    from: "4915731562524",
    timestamp: "1787760000",
    type: "text",
    text: { body: "Hallo" },
  }),
);
assert.throws(
  () => webhook.extractWhatsAppMessages(overflowPayload, "waba", "phone"),
  (error) => error && error.name === "WhatsAppMessageLimitError",
  "oversized message batches must fail before any processing",
);

const apps = loadAppsScript("integrations/ixa-outreach-webhook/Code.gs");
const matchAllowlist = apps("matchAllowlist_");
const buildProspectIndex = apps("buildProspectIndex_");
const allowlistResponse = apps("allowlistResponse_");
const verifyAllowlistTicket = apps("verifyAllowlistTicket_");
const inboundTimestamps = apps("inboundTimestamps_");
const migrateLegacyInboundTimestamps = apps("migrateLegacyInboundTimestamps_");
const migrateLegacyInboundRows = apps("migrateLegacyInboundRows_");
const loadQueueMessageIds = apps("loadQueueMessageIds_");
const saveInbound = apps("saveInbound_");
const buildInboundRow = apps("buildInboundRow_");
const ensureInboundQueue = apps("ensureInboundQueue_");
const sha256Hex = apps("sha256Hex_");
const hmacSha256Hex = apps("hmacSha256Hex_");
const isValidInbound = apps("isValidInbound_");
const resolvePersonalPage = apps("resolvePersonalPage_");
const verifyPersonalPageTicket = apps("verifyPersonalPageTicket_");
const recordPersonalPageVisit = apps("recordPersonalPageVisit_");
const ensureProspectPersonalPageColumns = apps(
  "ensureProspectPersonalPageColumns_",
);
const ensurePersonalPageContent = apps("ensurePersonalPageContent_");
const ensurePersonalPageActivations = apps("ensurePersonalPageActivations_");
const processPersonalPageActivations = apps("processPersonalPageActivations_");
const ensurePostalActivations = apps("ensurePostalActivations_");
const processPostalActivations = apps("processPostalActivations_");
const rsaSigningCalls = apps("__rsaSigningCalls");
const secret = "sheet-secret";
const headers = [
  "Company_ID",
  "Contact_ID",
  "Phone_With_Country_Code",
  "WhatsApp_With_Country_Code",
  "Printed_Ref",
  "Public_Token",
  "Blocked",
];
const firstRow = [
  "IXA-CO-1",
  "IXA-CT-1",
  "+49 15731562524",
  "",
  "IXAP260827003",
  "D-C-vbdQt83-B3lACz10Dg",
  "FALSE",
];
const metrics = {};
const spreadsheet = spreadsheetWithRows(headers, [firstRow], metrics);
const prospectIndex = buildProspectIndex(spreadsheet, secret);
assert.equal(metrics.rangeReads, 2, "prospects must be loaded once per batch");
const unmatchedPhoneProof = hmacSha256Hex("491111111111", secret);
const printedOnly = matchAllowlist(
  prospectIndex,
  {
    phoneProof: unmatchedPhoneProof,
    referenceProofs: [hmacSha256Hex(sha256Hex(firstRow[4]), secret)],
  },
);
assert.equal(printedOnly.allowed, false, "Printed_Ref must not open the gate");

const tokenMatch = matchAllowlist(
  prospectIndex,
  {
    phoneProof: unmatchedPhoneProof,
    referenceProofs: [hmacSha256Hex(sha256Hex(firstRow[5]), secret)],
  },
);
assert.equal(tokenMatch.allowed, true);
assert.equal(tokenMatch.matchMethod, "Strong public token");

const phoneProof = hmacSha256Hex("4915731562524", secret);
const phoneMatch = matchAllowlist(
  prospectIndex,
  { phoneProof, referenceProofs: [] },
);
assert.equal(phoneMatch.allowed, true);
assert.equal(phoneMatch.matchMethod, "Exact E164");
assert.equal(
  metrics.rangeReads,
  2,
  "matching every item in a batch must reuse the in-memory prospect index",
);

const duplicateSpreadsheet = spreadsheetWithRows(headers, [
  firstRow,
  ["IXA-CO-2", "IXA-CT-2", "+49 15731562524", "", "", "token-2", "TRUE"],
]);
const duplicateIndex = buildProspectIndex(duplicateSpreadsheet, secret);
const duplicateMatch = matchAllowlist(
  duplicateIndex,
  { phoneProof, referenceProofs: [] },
);
assert.equal(duplicateMatch.allowed, false);
assert.equal(duplicateMatch.blocked, true);
const blockedPhone = "4917612345678";
const blockedPhoneProof = hmacSha256Hex(blockedPhone, secret);
const crossReferenceSpreadsheet = spreadsheetWithRows(headers, [
  firstRow,
  [
    "IXA-CO-BLOCKED",
    "IXA-CT-BLOCKED",
    `+${blockedPhone}`,
    "",
    "",
    "blocked-token",
    "TRUE",
  ],
]);
const crossReferenceMatch = matchAllowlist(
  buildProspectIndex(crossReferenceSpreadsheet, secret),
  {
    phoneProof: blockedPhoneProof,
    referenceProofs: [hmacSha256Hex(sha256Hex(firstRow[5]), secret)],
  },
);
assert.equal(
  crossReferenceMatch.allowed,
  false,
  "a valid token must not let a blocked phone bypass suppression",
);
const blockedDecision = allowlistResponse(
  duplicateMatch,
  {
    requestKey: sha256Hex("wamid.blocked"),
    phoneProof,
    referenceProofs: [],
  },
  secret,
);
assert.equal(blockedDecision.allowed, false);
assert.equal(
  Object.hasOwn(blockedDecision, "allowlistTicket"),
  false,
  "blocked prospects must never receive a ticket that discloses phone or text",
);

const messageId = "wamid.test";
const requestKey = sha256Hex(messageId);
const allowlistItem = {
  requestKey,
  phoneProof,
  referenceProofs: [],
};
const allowlistDecision = allowlistResponse(
  phoneMatch,
  allowlistItem,
  secret,
);
assert.equal(allowlistDecision.allowed, true);
assert.match(
  allowlistDecision.allowlistTicket,
  /^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/,
);

const inbound = {
  requestKey,
  phoneProof,
  referenceProofs: [],
  allowlistTicket: allowlistDecision.allowlistTicket,
  sourceMessageId: messageId,
  phoneE164: "+4915731562524",
  messageType: "text",
  messageText: "Hallo",
};
assert.equal(isValidInbound(inbound, secret), true);
assert.equal(verifyAllowlistTicket(inbound, secret).allowed, true);
const [ticketPayload] = allowlistDecision.allowlistTicket.split(".");
const expiredPayload = JSON.parse(
  Buffer.from(ticketPayload, "base64url").toString("utf8"),
);
expiredPayload.expiresAt = Date.now() - 1;
const expiredEncoded = Buffer.from(JSON.stringify(expiredPayload), "utf8").toString(
  "base64url",
);
const expiredTicket = `${expiredEncoded}.${crypto
  .createHmac("sha256", secret)
  .update(expiredEncoded)
  .digest("hex")}`;
assert.equal(
  verifyAllowlistTicket({ ...inbound, allowlistTicket: expiredTicket }, secret),
  null,
  "expired disclosure tickets must be rejected before saving text",
);
assert.equal(
  isValidInbound({ ...inbound, phoneE164: "+491111111111" }, secret),
  false,
  "phone proof must be bound to the forwarded E.164 number",
);
assert.equal(
  verifyAllowlistTicket(
    { ...inbound, referenceProofs: ["b".repeat(64)] },
    secret,
  ),
  null,
  "allowlist tickets must be bound to the exact proof set",
);
assert.equal(
  isValidInbound({ ...inbound, sourceMessageId: "wamid.changed" }, secret),
  false,
  "request key must be bound to Meta's message ID",
);

const ingestion = new Date("2026-08-26T10:00:00.000Z");
const timestamps = inboundTimestamps("2099-01-01T00:00:00.000Z", ingestion);
assert.equal(timestamps.receivedAt.toISOString(), "2099-01-01T00:00:00.000Z");
assert.equal(timestamps.ingestedAt.toISOString(), ingestion.toISOString());
assert.equal(
  timestamps.retentionDate.toISOString(),
  "2026-09-25T10:00:00.000Z",
  "retention must be based on ingestion, not sender timestamp",
);
const v2Row = buildInboundRow(
  { ...inbound, receivedAt: "2099-01-01T00:00:00.000Z" },
  phoneMatch,
  ingestion,
  "IXA-WA-TEST",
);
assert.equal(v2Row.length, 18);
assert.equal(v2Row[2], "2099-01-01T00:00:00.000Z");
assert.equal(v2Row[3], ingestion.toISOString());
assert.equal(v2Row[4], "'+4915731562524");
assert.equal(v2Row[9], "Hallo");
assert.equal(v2Row[16], "2026-09-25T10:00:00.000Z");

let queueRangeReads = 0;
const existingMessageIds = loadQueueMessageIds({
  getLastRow: () => 3,
  getRange: () => {
    queueRangeReads += 1;
    return { getDisplayValues: () => [["wamid.existing"], [""]] };
  },
});
assert.equal(queueRangeReads, 1, "dedupe IDs must be loaded once per save batch");
assert.equal(existingMessageIds["wamid.existing"], true);
assert.equal(
  saveInbound(
    {},
    { sourceMessageId: "wamid.existing" },
    {},
    existingMessageIds,
  ).duplicate,
  true,
  "a retried Meta message must not create a second row",
);

const legacyInboundHeaders = [
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
const migratedHeaders = [...legacyInboundHeaders];
const migrationSheet = {
  getLastRow: () => 1,
  getLastColumn: () => migratedHeaders.length,
  getMaxColumns: () => migratedHeaders.length,
  insertColumnAfter(column) {
    migratedHeaders.splice(column, 0, "");
  },
  getRange(_row, column, _rowCount, columnCount = 1) {
    return {
      getDisplayValues: () => [
        migratedHeaders.slice(column - 1, column - 1 + columnCount),
      ],
      setValue: (value) => {
        migratedHeaders[column - 1] = value;
      },
    };
  },
};
ensureInboundQueue({
  getSheetByName: (name) => (name === "07 Inbound Queue" ? migrationSheet : null),
});
assert.equal(migratedHeaders[3], "Ingested_UTC");
assert.equal(migratedHeaders[4], "Phone_E164");
assert.equal(migratedHeaders.length, 18);
const migrationTime = new Date("2026-08-26T12:00:00.000Z");
const cappedLegacyRetention = migrateLegacyInboundTimestamps(
  "2099-01-31T00:00:00.000Z",
  migrationTime,
);
assert.equal(
  cappedLegacyRetention.ingestedAt.toISOString(),
  migrationTime.toISOString(),
);
assert.equal(
  cappedLegacyRetention.retentionDate.toISOString(),
  "2026-09-25T12:00:00.000Z",
  "schema migration must cap future v1 retention at 30 days from migration",
);
const legacyDataRow = Array(18).fill("");
legacyDataRow[16] = "2099-01-31T00:00:00.000Z";
const legacyRowsSheet = {
  getLastRow: () => 2,
  getRange(row, column, rowCount, columnCount) {
    return {
      getDisplayValues: () =>
        [legacyDataRow]
          .slice(row - 2, row - 2 + rowCount)
          .map((values) => values.slice(column - 1, column - 1 + columnCount)),
      setValues(values) {
        values.forEach((valuesRow) => {
          valuesRow.forEach((value, columnIndex) => {
            legacyDataRow[column - 1 + columnIndex] = value;
          });
        });
        return this;
      },
      setNumberFormat() {
        return this;
      },
    };
  },
};
migrateLegacyInboundRows(legacyRowsSheet, migrationTime);
assert.equal(legacyDataRow[3], migrationTime.toISOString());
assert.equal(legacyDataRow[16], "2026-09-25T12:00:00.000Z");

function mutableSheet(initialRows = [], initialColumns = 5) {
  const rows = initialRows.map((row) => [...row]);
  let maxRows = 100;
  let maxColumns = initialColumns;
  const range = (row, column, rowCount = 1, columnCount = 1) => ({
    getDisplayValues: () =>
      rows
        .slice(row - 1, row - 1 + rowCount)
        .map((values) => values.slice(column - 1, column - 1 + columnCount)),
    setValues(values) {
      values.forEach((valuesRow, rowIndex) => {
        const target = row - 1 + rowIndex;
        if (!rows[target]) rows[target] = [];
        valuesRow.forEach((value, columnIndex) => {
          rows[target][column - 1 + columnIndex] = value;
        });
      });
      return this;
    },
    setNumberFormat() { return this; },
    setVerticalAlignment() { return this; },
    setBackground() { return this; },
    setFontColor() { return this; },
    setFontWeight() { return this; },
    setHorizontalAlignment() { return this; },
    setWrap() { return this; },
    setValue(value) {
      if (!rows[row - 1]) rows[row - 1] = [];
      rows[row - 1][column - 1] = value;
      return this;
    },
  });
  return {
    rows,
    getLastRow: () => rows.length,
    getLastColumn: () => Math.max(0, ...rows.map((row) => row.length)),
    getMaxRows: () => maxRows,
    getMaxColumns: () => maxColumns,
    getRange: range,
    insertColumnAfter() { maxColumns += 1; },
    insertColumnsAfter(_column, count = 1) { maxColumns += count; },
    insertRowsAfter(_row, count) { maxRows += count; },
    setFrozenRows() {},
    setRowHeight() {},
    setColumnWidth() {},
  };
}

const pageHeaders = [
  "Company_ID",
  "Contact_ID",
  "Public_Token",
  "Blocked",
  "Public_Page_Label",
  "Public_Page_Expires_UTC",
];
const pageContentHeaders = [
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
const pageActivationHeaders = [
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
const pageActivationSignatureHeaders = [
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
const postalActivationHeaders = [
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
const postalSignedFields = [
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
const pageActivationSecret = "page-activation-secret-v1-48-bytes-minimum-value";
const pageUnitSeparator = "\u001f";
const pageRecordSeparator = "\u001e";
const pageActivationDomain = "IXA_PAGE_ACTIVATION_V1\n";
const crossRuntimeGoldenFields = [
  "1",
  "PAGE_ACTIVATION",
  "IXA-PA-001",
  "IXA001",
  "5396697978ddb94134ae46e0c6764c2cbf2d839ba952bf8c94409a6f5375676e",
  "v3.0",
  "d5af087ae80bcd1ebfafbb4f7008067f145b18fbc1e4e2100dc941c739ec7a0b",
  "50",
  "IXA owner",
  "2026-08-30T20:00:00.000Z",
  "2026-08-30T21:00:00.000Z",
  "2026-08-30T20:05:00.000Z",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
];
const crossRuntimeGoldenBody = crossRuntimeGoldenFields.join(pageUnitSeparator);
const crossRuntimeGoldenSignature = crypto
  .createHmac("sha256", "0123456789abcdef0123456789abcdef")
  .update(pageActivationDomain + crossRuntimeGoldenBody, "utf8")
  .digest("hex");
assert.equal(
  crossRuntimeGoldenSignature,
  "1b919ffc8d0e4ee2dc6f91fb0af7993051cca8683974ca7a78237d3d4289077b",
  "Apps Script and Python must share one PAGE_ACTIVATION HMAC vector",
);
assert.equal(
  sha256Hex(
    pageActivationDomain + crossRuntimeGoldenBody +
      pageUnitSeparator + crossRuntimeGoldenSignature,
  ),
  "8b2c97ffed91017aa6c618697c9e9253a32b5518766f12f288aa9ba07e6d6765",
  "Apps Script and Python must share one PAGE_ACTIVATION receipt digest",
);
const personalPageEvidence = (position) =>
  JSON.stringify({
    schema: "ixa.personal-page-observation.v1",
    position,
    title: position === 1 ? "Mobiler Kontaktweg" : "Anfragequalifizierung",
    observation:
      position === 1
        ? "Der wichtigste Kontaktweg ist mobil erst nach längerem Scrollen sichtbar."
        : "Der Anfrageweg fragt weder nach Projektart noch nach gewünschtem Zeitraum.",
    implication:
      position === 1
        ? "Das könnte schnelle Kontaktaufnahmen unnötig bremsen."
        : "Erstanfragen könnten dadurch zusätzliche Rückfragen erfordern.",
    sourceLabel: "Öffentlich sichtbare Website",
    sourceUrl: `https://example.test/beobachtung-${position}`,
    verifiedAt: "2026-08-28",
    ...(position === 1
      ? {
          firstTest: {
            title: "Kontaktweg im ersten Mobilbereich testen",
            description:
              "Die bestehende Kontaktoption 14 Tage lang zusätzlich im ersten sichtbaren Mobilbereich platzieren und danach vergleichen.",
          },
        }
      : {}),
  });
const personalPageContentRow = (overrides = {}) => {
  const values = {
    Page_Content_ID: "IXA-PC-001",
    Batch_ID: "IXA001",
    Experiment_ID: "IXA-EXP-001",
    Page_Version: "v3.0",
    Company_ID: "IXA-CO-PAGE",
    Contact_ID: "IXA-CT-PAGE",
    Token_SHA256: sha256Hex(pageToken),
    Letter_ID: "IXA-LETTER-001",
    Public_Page_Label: "Manuell freigegebener Betrieb",
    Evidence_1: personalPageEvidence(1),
    Evidence_2: personalPageEvidence(2),
    State: "Active",
    Approval_Status: "Approved",
    Approved_By: "Owner-Emad-Alzaim",
    Approved_At_UTC: "2026-08-28T04:30:00.000Z",
    Activated_At_UTC: "2026-08-28T04:31:00.000Z",
    Expires_UTC: "2099-01-01T00:00:00.000Z",
    Source_Run_ID: "IXA-RUN-PAGE-001",
    Activation_Receipt_ID: "",
    Activation_Receipt_SHA256: "",
    ...overrides,
  };
  values.Content_SHA256 = sha256Hex(
    pageContentHeaders.slice(0, 11).map((name) => values[name] || "").join("\u001f"),
  );
  if (Object.hasOwn(overrides, "Content_SHA256")) {
    values.Content_SHA256 = overrides.Content_SHA256;
  }
  return pageContentHeaders.map((name) => values[name] || "");
};
const pageActivationRow = (contentRows, overrides = {}) => {
  const objects = contentRows.map((row) =>
    Object.fromEntries(pageContentHeaders.map((name, index) => [name, row[index] || ""])),
  );
  const recipientSetHash = sha256Hex(
    objects
      .map((item) =>
        [item.Company_ID, item.Contact_ID, item.Token_SHA256, item.Letter_ID]
          .join(pageUnitSeparator),
      )
      .sort()
      .join(pageRecordSeparator),
  );
  const pageSetSha256 = sha256Hex(
    objects
      .map((item) =>
        [
          item.Page_Content_ID,
          item.Batch_ID,
          item.Experiment_ID,
          item.Page_Version,
          item.Company_ID,
          item.Contact_ID,
          item.Token_SHA256,
          item.Letter_ID,
          item.Content_SHA256,
          item.Expires_UTC,
          item.Source_Run_ID,
        ].join(pageUnitSeparator),
      )
      .sort()
      .join(pageRecordSeparator),
  );
  const values = {
    Activation_Receipt_ID: "IXA-PAGE-ACT-001",
    Schema_Version: "1",
    Scope: "PAGE_ACTIVATION",
    Batch_ID: "IXA001",
    Recipient_Set_Hash: recipientSetHash,
    Page_Version: "v3.0",
    Page_Set_SHA256: pageSetSha256,
    Recipient_Count: "50",
    Approved_By: "Owner-Emad-Alzaim",
    Approved_At_UTC: "2026-08-28T04:30:00.000Z",
    Expires_At_UTC: "2026-08-29T04:30:00.000Z",
    Nonce: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString("base64url"),
    Signature_HMAC_SHA256: "",
    Receipt_SHA256: "",
    State: "Consumed",
    Consumed_At_UTC: "2026-08-28T04:31:00.000Z",
    Source_Run_ID: "IXA-RUN-PAGE-001",
    ...overrides,
  };
  const signedBody = pageActivationSignatureHeaders
    .map((name) => String(values[name]))
    .join(pageUnitSeparator);
  values.Signature_HMAC_SHA256 = crypto
    .createHmac("sha256", pageActivationSecret)
    .update(pageActivationDomain + signedBody, "utf8")
    .digest("hex");
  values.Receipt_SHA256 = sha256Hex(
    pageActivationDomain + signedBody + pageUnitSeparator + values.Signature_HMAC_SHA256,
  );
  if (Object.hasOwn(overrides, "Signature_HMAC_SHA256")) {
    values.Signature_HMAC_SHA256 = overrides.Signature_HMAC_SHA256;
  }
  if (Object.hasOwn(overrides, "Receipt_SHA256")) {
    values.Receipt_SHA256 = overrides.Receipt_SHA256;
  }
  return pageActivationHeaders.map((name) => values[name] || "");
};
const pageToken = "D-C-vbdQt83-B3lACz10Dg";
const setupProspects = mutableSheet([
  ["Company_ID", "Contact_ID", "Public_Token", "Blocked"],
  ["IXA-CO-SETUP", "IXA-CT-SETUP", pageToken, "FALSE"],
], 4);
ensureProspectPersonalPageColumns({
  getSheetByName: (name) => (name === "01 Prospects" ? setupProspects : null),
});
assert.deepEqual(setupProspects.rows[0], [
  "Company_ID",
  "Contact_ID",
  "Public_Token",
  "Blocked",
  "Public_Page_Label",
  "Public_Page_Expires_UTC",
]);
assert.deepEqual(
  setupProspects.rows[1],
  ["IXA-CO-SETUP", "IXA-CT-SETUP", pageToken, "FALSE"],
  "setup must not auto-publish or overwrite CRM values",
);
let setupPageActivations = null;
ensurePersonalPageActivations({
  getSheetByName: (name) =>
    name === "12 Page Activations" ? setupPageActivations : null,
  insertSheet(name) {
    assert.equal(name, "12 Page Activations");
    setupPageActivations = mutableSheet([], pageActivationHeaders.length);
    return setupPageActivations;
  },
});
assert.deepEqual(
  setupPageActivations.rows[0],
  pageActivationHeaders,
  "setup must create the durable activation-receipt ledger without a receipt",
);
const legacyActivationHeaders = pageActivationHeaders.slice(0, 17);
const legacyActivationSheet = mutableSheet(
  [legacyActivationHeaders, Array(17).fill("")],
  legacyActivationHeaders.length,
);
ensurePersonalPageActivations({
  getSheetByName: (name) =>
    name === "12 Page Activations" ? legacyActivationSheet : null,
});
assert.deepEqual(
  legacyActivationSheet.rows[0],
  pageActivationHeaders,
  "setup must append Activation_Error to the 17-column ledger without deleting rows",
);
assert.equal(
  legacyActivationSheet.rows.length,
  2,
  "activation ledger migration must preserve all existing rows",
);

const activationTestColumns = Object.fromEntries(
  pageActivationHeaders.map((name, index) => [name, index]),
);
const activationContentTestColumns = Object.fromEntries(
  pageContentHeaders.map((name, index) => [name, index]),
);
const activationTestNow = new Date("2030-01-02T10:05:00.000Z");
const activationApprovedAt = "2030-01-02T10:00:00.000Z";
const activationRequestExpiry = "2030-01-02T11:00:00.000Z";
const preparedActivationRows = (batchId) =>
  Array.from({ length: 50 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    return personalPageContentRow({
      Page_Content_ID: `${batchId}-PC-${suffix}`,
      Batch_ID: batchId,
      Company_ID: `${batchId}-CO-${suffix}`,
      Contact_ID: `${batchId}-CT-${suffix}`,
      Token_SHA256: sha256Hex(`${batchId}-token-${suffix}`),
      Letter_ID: `${batchId}-LETTER-${suffix}`,
      Public_Page_Label: `Freigegebener Betrieb ${suffix}`,
      State: "Prepared",
      Approved_By: "Owner-Emad-Alzaim",
      Approved_At_UTC: activationApprovedAt,
      Activated_At_UTC: "",
      Expires_UTC: "2099-01-01T00:00:00.000Z",
      Source_Run_ID: `${batchId}-RUN`,
      Activation_Receipt_ID: "",
      Activation_Receipt_SHA256: "",
    });
  });
const pendingActivationRow = (contentRows, batchId, overrides = {}) =>
  pageActivationRow(contentRows, {
    Activation_Receipt_ID: "",
    Batch_ID: batchId,
    Approved_By: "Owner-Emad-Alzaim",
    Approved_At_UTC: activationApprovedAt,
    Expires_At_UTC: activationRequestExpiry,
    Nonce: "",
    Signature_HMAC_SHA256: "",
    Receipt_SHA256: "",
    State: "Pending",
    Consumed_At_UTC: "",
    Source_Run_ID: `${batchId}-RUN`,
    ...overrides,
  });
const activationFixture = (contentRows, activationRow) => {
  const contentSheet = mutableSheet(
    [pageContentHeaders, ...contentRows],
    pageContentHeaders.length,
  );
  const activationSheet = mutableSheet(
    [pageActivationHeaders, activationRow],
    pageActivationHeaders.length,
  );
  return {
    contentSheet,
    activationSheet,
    spreadsheet: {
      getSheetByName(name) {
        if (name === "11 Page Content") return contentSheet;
        if (name === "12 Page Activations") return activationSheet;
        return null;
      },
    },
  };
};

const pendingRows = preparedActivationRows("IXA101");
const pendingFixture = activationFixture(
  pendingRows,
  pendingActivationRow(pendingRows, "IXA101"),
);
assert.deepEqual(
  JSON.parse(JSON.stringify(processPersonalPageActivations(
    pendingFixture.spreadsheet,
    pageActivationSecret,
    activationTestNow,
  ))),
  { ok: true, examined: 1, consumed: 1, rejected: 0 },
  "an exact approved Pending request must be signed and consumed internally",
);
const consumedPendingRow = pendingFixture.activationSheet.rows[1];
assert.equal(
  consumedPendingRow[activationTestColumns.State],
  "Consumed",
  "Pending must advance through the signed ledger to Consumed",
);
assert.match(
  consumedPendingRow[activationTestColumns.Activation_Receipt_ID],
  /^IXA-PA-[0-9a-f]{32}$/,
  "the internal signer must create an opaque receipt id",
);
assert.match(
  consumedPendingRow[activationTestColumns.Nonce],
  /^[A-Za-z0-9_-]{43}$/,
  "the internal signer must create a 32-byte base64url nonce",
);
assert.equal(
  consumedPendingRow[activationTestColumns.Activation_Error],
  "",
  "a consumed receipt must not retain an error",
);
assert.ok(
  pendingFixture.contentSheet.rows.slice(1).every((row) =>
    row[activationContentTestColumns.State] === "Active" &&
    row[activationContentTestColumns.Activation_Receipt_ID] ===
      consumedPendingRow[activationTestColumns.Activation_Receipt_ID] &&
    row[activationContentTestColumns.Activation_Receipt_SHA256] ===
      consumedPendingRow[activationTestColumns.Receipt_SHA256]
  ),
  "all 50 contiguous rows must reference the same consumed receipt",
);

const badHashRows = preparedActivationRows("IXA102");
const badHashFixture = activationFixture(
  badHashRows,
  pendingActivationRow(badHashRows, "IXA102", {
    Recipient_Set_Hash: "0".repeat(64),
  }),
);
processPersonalPageActivations(
  badHashFixture.spreadsheet,
  pageActivationSecret,
  activationTestNow,
);
assert.equal(
  badHashFixture.activationSheet.rows[1][activationTestColumns.State],
  "Rejected",
  "a request whose exact recipient hash is wrong must fail closed",
);
assert.equal(
  badHashFixture.activationSheet.rows[1][activationTestColumns.Activation_Error],
  "recipient_set_hash_mismatch",
  "the ledger must retain a readable hash failure",
);
assert.ok(
  badHashFixture.contentSheet.rows.slice(1).every((row) =>
    row[activationContentTestColumns.State] === "Prepared"
  ),
  "invalid hashes must never activate content",
);

const wrongApproverRows = preparedActivationRows("IXA103");
const wrongApproverFixture = activationFixture(
  wrongApproverRows,
  pendingActivationRow(wrongApproverRows, "IXA103", {
    Approved_By: "General-Approval",
  }),
);
processPersonalPageActivations(
  wrongApproverFixture.spreadsheet,
  pageActivationSecret,
  activationTestNow,
);
assert.equal(
  wrongApproverFixture.activationSheet.rows[1][activationTestColumns.State],
  "Rejected",
  "general or mismatched approval must never authorize a batch",
);

const wrongSecretRows = preparedActivationRows("IXA104");
const wrongSecretSigning = pageActivationRow(wrongSecretRows, {
  Activation_Receipt_ID: "IXA-PAGE-ACT-WRONG-SECRET",
  Batch_ID: "IXA104",
  Approved_At_UTC: activationApprovedAt,
  Expires_At_UTC: activationRequestExpiry,
  State: "Signing",
  Consumed_At_UTC: activationTestNow.toISOString(),
  Source_Run_ID: "IXA104-RUN",
});
const wrongSecretFixture = activationFixture(wrongSecretRows, wrongSecretSigning);
processPersonalPageActivations(
  wrongSecretFixture.spreadsheet,
  "wrong-page-activation-secret-that-is-long-enough",
  activationTestNow,
);
assert.equal(
  wrongSecretFixture.activationSheet.rows[1][activationTestColumns.State],
  "Rejected",
  "a Signing receipt made with another secret must fail closed",
);
assert.equal(
  wrongSecretFixture.activationSheet.rows[1][activationTestColumns.Activation_Error],
  "activation_signature_mismatch",
  "the ledger must identify a signing-key mismatch without exposing the key",
);

const retrySigningRows = preparedActivationRows("IXA105");
const retrySigningRow = pageActivationRow(retrySigningRows, {
  Activation_Receipt_ID: "IXA-PAGE-ACT-RETRY-SIGNING",
  Batch_ID: "IXA105",
  Approved_At_UTC: activationApprovedAt,
  Expires_At_UTC: activationRequestExpiry,
  State: "Signing",
  Consumed_At_UTC: activationTestNow.toISOString(),
  Source_Run_ID: "IXA105-RUN",
});
const retrySigningFixture = activationFixture(retrySigningRows, retrySigningRow);
processPersonalPageActivations(
  retrySigningFixture.spreadsheet,
  pageActivationSecret,
  activationTestNow,
);
assert.equal(
  retrySigningFixture.activationSheet.rows[1][activationTestColumns.State],
  "Consumed",
  "a valid Signing row must resume idempotently after an interrupted run",
);
assert.ok(
  retrySigningFixture.contentSheet.rows.slice(1).every((row) =>
    row[activationContentTestColumns.State] === "Active" &&
    row[activationContentTestColumns.Activation_Receipt_ID] ===
      "IXA-PAGE-ACT-RETRY-SIGNING"
  ),
  "Signing recovery must bind all 50 rows to the pre-existing receipt",
);

let setupPostalActivations = null;
ensurePostalActivations({
  getSheetByName: (name) =>
    name === "13 Postal Activations" ? setupPostalActivations : null,
  insertSheet(name) {
    assert.equal(name, "13 Postal Activations");
    setupPostalActivations = mutableSheet([], postalActivationHeaders.length);
    return setupPostalActivations;
  },
});
assert.deepEqual(
  setupPostalActivations.rows[0],
  postalActivationHeaders,
  "setup must create the exact schema for 13 Postal Activations",
);

const postalColumns = Object.fromEntries(
  postalActivationHeaders.map((name, index) => [name, index]),
);
const postalNow = new Date("2030-01-02T10:05:00.000Z");
const postalPrivateKey =
  "-----BEGIN PRIVATE KEY-----\n" + "A".repeat(1100) +
  "\n-----END PRIVATE KEY-----";
const postalKeyId = "IXA-POSTAL-RSA-2026-01";
const postalActivationRow = (batchId, overrides = {}) => {
  const values = {
    Activation_Receipt_ID: "",
    Schema_Version: "2",
    Approved_For: "PRINT_READY",
    Batch_ID: batchId,
    Content_Version: "IXA-POSTAL-V3-L1-20260830",
    Letter_Date: "2030-01-03",
    Recipient_Count: "50",
    Batch_Digest_SHA256: sha256Hex(`${batchId}-exact-print-manifest`),
    Approved_By: "Owner-Emad-Alzaim",
    Approved_At_UTC: "2030-01-02T10:00:00.000Z",
    Expires_At_UTC: "2030-01-03T10:00:00.000Z",
    Nonce: "",
    Key_ID: "",
    Signature_RSA_SHA256_B64URL: "",
    Receipt_SHA256: "",
    State: "Pending",
    Consumed_At_UTC: "",
    Source_Run_ID: `${batchId}-RUN`,
    Activation_Error: "",
    ...overrides,
  };
  return postalActivationHeaders.map((name) => values[name] || "");
};
const postalFixture = (rows) => {
  const sheet = mutableSheet(
    [postalActivationHeaders, ...rows],
    postalActivationHeaders.length,
  );
  return {
    sheet,
    spreadsheet: {
      getSheetByName: (name) =>
        name === "13 Postal Activations" ? sheet : null,
    },
  };
};

rsaSigningCalls.splice(0, rsaSigningCalls.length);
const exactPostalFixture = postalFixture([postalActivationRow("IXA201")]);
assert.deepEqual(
  JSON.parse(JSON.stringify(processPostalActivations(
    exactPostalFixture.spreadsheet,
    postalPrivateKey,
    postalKeyId,
    postalNow,
  ))),
  { ok: true, examined: 1, consumed: 1, rejected: 0, pending: 0 },
  "an exact trusted-owner postal approval must be consumed",
);
const consumedPostalRow = exactPostalFixture.sheet.rows[1];
assert.equal(consumedPostalRow[postalColumns.State], "Consumed");
assert.equal(consumedPostalRow[postalColumns.Activation_Error], "");
assert.match(
  consumedPostalRow[postalColumns.Signature_RSA_SHA256_B64URL],
  /^[A-Za-z0-9_-]{342}$/,
  "a mocked 2048-bit RSA signature must retain the production wire format",
);
assert.equal(rsaSigningCalls.length, 1, "the exact request must be signed once");
assert.equal(
  rsaSigningCalls[0].privateKey,
  postalPrivateKey,
  "the internal signer must receive the configured private key",
);
const postalSignatureDomain = "IXA_POSTAL_ACTIVATION_V2\n";
assert.ok(
  rsaSigningCalls[0].value.startsWith(postalSignatureDomain),
  "the RSA signature must be domain-separated",
);
const postalCanonical = rsaSigningCalls[0].value.slice(postalSignatureDomain.length);
const postalSignedPayload = JSON.parse(postalCanonical);
assert.deepEqual(
  Object.keys(postalSignedPayload),
  postalSignedFields,
  "Apps Script canonical fields must match Python postal_activation schema v2",
);
assert.equal(postalSignedPayload.schema_version, 2);
assert.equal(postalSignedPayload.recipient_count, 50);
assert.equal(postalSignedPayload.approved_by, "Owner-Emad-Alzaim");
assert.equal(postalSignedPayload.approved_for, "PRINT_READY");
assert.equal(postalSignedPayload.batch_id, "IXA201");
assert.equal(
  postalSignedPayload.batch_digest_sha256,
  consumedPostalRow[postalColumns.Batch_Digest_SHA256],
);
assert.equal(
  postalSignedPayload.receipt_id,
  consumedPostalRow[postalColumns.Activation_Receipt_ID],
);
assert.equal(
  postalSignedPayload.nonce,
  consumedPostalRow[postalColumns.Nonce],
);
assert.equal(
  postalCanonical,
  JSON.stringify(Object.fromEntries(
    postalSignedFields.map((name) => [name, postalSignedPayload[name]]),
  )),
  "the signed JSON must use the same sorted compact canonical form as Python",
);
assert.equal(
  consumedPostalRow[postalColumns.Receipt_SHA256],
  sha256Hex(
    rsaSigningCalls[0].value + pageUnitSeparator +
      consumedPostalRow[postalColumns.Signature_RSA_SHA256_B64URL],
  ),
  "the receipt digest must match Python's domain+canonical+separator+signature rule",
);

const missingPostalKeyFixture = postalFixture([postalActivationRow("IXA202")]);
assert.deepEqual(
  JSON.parse(JSON.stringify(processPostalActivations(
    missingPostalKeyFixture.spreadsheet,
    "",
    postalKeyId,
    postalNow,
  ))),
  { ok: true, examined: 1, consumed: 0, rejected: 0, pending: 1 },
  "missing signing infrastructure must keep an exact request Pending",
);
assert.equal(
  missingPostalKeyFixture.sheet.rows[1][postalColumns.State],
  "Pending",
);
assert.equal(
  missingPostalKeyFixture.sheet.rows[1][postalColumns.Activation_Error],
  "postal_signing_key_unavailable",
);

const wrongPostalApproverFixture = postalFixture([
  postalActivationRow("IXA203", { Approved_By: "General-Approval" }),
]);
processPostalActivations(
  wrongPostalApproverFixture.spreadsheet,
  postalPrivateKey,
  postalKeyId,
  postalNow,
);
assert.equal(
  wrongPostalApproverFixture.sheet.rows[1][postalColumns.State],
  "Rejected",
  "only Owner-Emad-Alzaim may approve PRINT_READY",
);
assert.equal(
  wrongPostalApproverFixture.sheet.rows[1][postalColumns.Activation_Error],
  "invalid_postal_activation_request",
);

const tamperedPostalDigestFixture = postalFixture([
  postalActivationRow("IXA204", { Batch_Digest_SHA256: "tampered" }),
]);
processPostalActivations(
  tamperedPostalDigestFixture.spreadsheet,
  postalPrivateKey,
  postalKeyId,
  postalNow,
);
assert.equal(
  tamperedPostalDigestFixture.sheet.rows[1][postalColumns.State],
  "Rejected",
  "a malformed or tampered batch digest must not be signed",
);
assert.equal(
  tamperedPostalDigestFixture.sheet.rows[1][postalColumns.Activation_Error],
  "invalid_postal_activation_request",
);

const duplicatePostalFixture = postalFixture([
  postalActivationRow("IXA205", { Source_Run_ID: "IXA205-RUN-A" }),
  postalActivationRow("IXA205", { Source_Run_ID: "IXA205-RUN-B" }),
]);
const duplicatePostalResult = processPostalActivations(
  duplicatePostalFixture.spreadsheet,
  postalPrivateKey,
  postalKeyId,
  postalNow,
);
assert.deepEqual(
  JSON.parse(JSON.stringify(duplicatePostalResult)),
  { ok: true, examined: 2, consumed: 0, rejected: 2, pending: 0 },
  "duplicate Batch_ID requests must both fail closed",
);
assert.ok(
  duplicatePostalFixture.sheet.rows.slice(1).every((row) =>
    row[postalColumns.State] === "Rejected" &&
    row[postalColumns.Activation_Error] === "duplicate_postal_activation_request"
  ),
  "the duplicate Batch_ID reason must remain readable in the ledger",
);
const pageProspects = mutableSheet([
  pageHeaders,
  [
    "IXA-CO-PAGE",
    "IXA-CT-PAGE",
    pageToken,
    "FALSE",
    "Manuell freigegebener Betrieb",
    "2099-01-01T00:00:00.000Z",
  ],
], pageHeaders.length);
const pageContentRows = Array.from({ length: 50 }, (_, index) =>
  personalPageContentRow(
    index === 0
      ? {}
      : {
          Page_Content_ID: `IXA-PC-${String(index + 1).padStart(3, "0")}`,
          Company_ID: `IXA-CO-PAGE-${String(index + 1).padStart(3, "0")}`,
          Contact_ID: `IXA-CT-PAGE-${String(index + 1).padStart(3, "0")}`,
          Token_SHA256: sha256Hex(`synthetic-public-token-${index + 1}`),
          Letter_ID: `IXA-LETTER-${String(index + 1).padStart(3, "0")}`,
          Public_Page_Label: `Synthetischer Testbetrieb ${index + 1}`,
        },
  ),
);
const validActivationRow = pageActivationRow(pageContentRows);
const activationColumnsForTest = Object.fromEntries(
  pageActivationHeaders.map((name, index) => [name, index]),
);
const receiptIdForTest =
  validActivationRow[activationColumnsForTest.Activation_Receipt_ID];
const receiptShaForTest = validActivationRow[activationColumnsForTest.Receipt_SHA256];
const receiptIdColumn = pageContentHeaders.indexOf("Activation_Receipt_ID");
const receiptShaColumn = pageContentHeaders.indexOf("Activation_Receipt_SHA256");
pageContentRows.forEach((row) => {
  row[receiptIdColumn] = receiptIdForTest;
  row[receiptShaColumn] = receiptShaForTest;
});
const pageContent = mutableSheet(
  [pageContentHeaders, ...pageContentRows],
  pageContentHeaders.length,
);
const pageActivations = mutableSheet(
  [pageActivationHeaders, validActivationRow],
  pageActivationHeaders.length,
);
let pageEvents = null;
const pageSpreadsheet = {
  getSheetByName(name) {
    if (name === "01 Prospects") return pageProspects;
    if (name === "11 Page Content") return pageContent;
    if (name === "12 Page Activations") return pageActivations;
    if (name === "08 Outreach Events") return pageEvents;
    return null;
  },
  insertSheet(name) {
    assert.equal(name, "08 Outreach Events");
    pageEvents = mutableSheet([], 11);
    return pageEvents;
  },
};
const pageTokenProof = hmacSha256Hex(sha256Hex(pageToken), secret);
const pageResolution = resolvePersonalPage(
  pageSpreadsheet,
  pageTokenProof,
  secret,
  pageActivationSecret,
);
assert.equal(pageResolution.publicPageLabel, "Manuell freigegebener Betrieb");
assert.ok(
  Date.now() > Date.parse("2026-08-29T04:30:00.000Z"),
  "the test must exercise a committed receipt after its short approval window",
);
assert.deepEqual(
  Object.keys(pageResolution).sort(),
  ["findings", "firstTest", "publicPageLabel", "visitTicket"],
  "resolution must expose only the curated public page contract",
);
assert.equal(pageResolution.findings.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(pageResolution.findings[0])), {
  title: "Mobiler Kontaktweg",
  observation:
    "Der wichtigste Kontaktweg ist mobil erst nach längerem Scrollen sichtbar.",
  implication: "Das könnte schnelle Kontaktaufnahmen unnötig bremsen.",
  sourceLabel: "Öffentlich sichtbare Website",
  verifiedAt: "2026-08-28",
});
assert.equal(
  pageResolution.firstTest.title,
  "Kontaktweg im ersten Mobilbereich testen",
);
assert.equal(
  JSON.stringify(pageResolution).includes("https://example.test"),
  false,
  "internal evidence URLs must not be returned to the browser",
);
assert.equal(JSON.stringify(pageResolution).includes("IXA-CO-PAGE"), false);
assert.equal(JSON.stringify(pageResolution).includes("IXA-CT-PAGE"), false);
assert.equal(JSON.stringify(pageResolution).includes(pageToken), false);
assert.match(pageResolution.visitTicket, /^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/);
const [personalTicketPayload] = pageResolution.visitTicket.split(".");
const publicTicketPayload = JSON.parse(
  Buffer.from(personalTicketPayload, "base64url").toString("utf8"),
);
assert.deepEqual(
  Object.keys(publicTicketPayload).sort(),
  ["expiresAt", "nonce", "version"],
  "the browser ticket must not disclose CRM IDs or the token hash",
);
assert.equal(
  verifyPersonalPageTicket(pageResolution.visitTicket, secret).companyId,
  "IXA-CO-PAGE",
);
assert.equal(
  resolvePersonalPage(
    pageSpreadsheet,
    "0".repeat(64),
    secret,
    pageActivationSecret,
  ),
  null,
  "unknown tokens must have the same empty resolution as suppressed tokens",
);
const pageContentColumns = Object.fromEntries(
  pageContentHeaders.map((name, index) => [name, index]),
);
const futureApprovalAt = new Date(Date.now() - 60 * 1000).toISOString();
const futureConsumptionAt = new Date(Date.now() + 60 * 1000).toISOString();
const futureApprovalExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const originalApprovalValues = pageContent.rows.slice(1).map((row) => ({
  approvedAt: row[pageContentColumns.Approved_At_UTC],
  activatedAt: row[pageContentColumns.Activated_At_UTC],
  receiptSha: row[pageContentColumns.Activation_Receipt_SHA256],
}));
pageContent.rows.slice(1).forEach((row) => {
  row[pageContentColumns.Approved_At_UTC] = futureApprovalAt;
  row[pageContentColumns.Activated_At_UTC] = futureConsumptionAt;
});
const futureConsumptionReceipt = pageActivationRow(pageContent.rows.slice(1), {
  Approved_At_UTC: futureApprovalAt,
  Expires_At_UTC: futureApprovalExpiry,
  Consumed_At_UTC: futureConsumptionAt,
});
const futureReceiptSha =
  futureConsumptionReceipt[activationColumnsForTest.Receipt_SHA256];
pageContent.rows.slice(1).forEach((row) => {
  row[pageContentColumns.Activation_Receipt_SHA256] = futureReceiptSha;
});
pageActivations.rows[1] = futureConsumptionReceipt;
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "a valid receipt must not serve before its signed consumption instant",
);
pageActivations.rows[1] = [...validActivationRow];
pageContent.rows.slice(1).forEach((row, index) => {
  row[pageContentColumns.Approved_At_UTC] = originalApprovalValues[index].approvedAt;
  row[pageContentColumns.Activated_At_UTC] = originalApprovalValues[index].activatedAt;
  row[pageContentColumns.Activation_Receipt_SHA256] =
    originalApprovalValues[index].receiptSha;
});
const originalConsumedAt =
  pageActivations.rows[1][activationColumnsForTest.Consumed_At_UTC];
const originalActivatedAtValues = pageContent.rows.slice(1).map(
  (row) => row[pageContentColumns.Activated_At_UTC],
);
pageActivations.rows[1][activationColumnsForTest.Consumed_At_UTC] =
  "2026-08-28T04:30:30.000Z";
pageContent.rows.slice(1).forEach((row) => {
  row[pageContentColumns.Activated_At_UTC] = "2026-08-28T04:30:30.000Z";
});
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "backdating both the ledger and all rows must fail without a new signature",
);
pageActivations.rows[1][activationColumnsForTest.Consumed_At_UTC] =
  originalConsumedAt;
pageContent.rows.slice(1).forEach((row, index) => {
  row[pageContentColumns.Activated_At_UTC] = originalActivatedAtValues[index];
});
pageContent.rows[1][pageContentColumns.Approval_Status] = "Drafted";
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "unapproved page content must remain unavailable",
);
pageContent.rows[1][pageContentColumns.Approval_Status] = "Approved";
pageContent.rows[1][pageContentColumns.Evidence_2] = JSON.stringify({
  schema: "ixa.personal-page-observation.v1",
  position: 2,
});
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "incomplete evidence must remain unavailable",
);
pageContent.rows[1][pageContentColumns.Evidence_2] =
  personalPageEvidence(2);
pageContent.rows[1][pageContentColumns.Content_SHA256] = "0".repeat(64);
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "content whose immutable digest does not match must remain unavailable",
);
pageContent.rows[1] = [...pageContentRows[0]];
pageContent.rows.push(personalPageContentRow({ Page_Content_ID: "IXA-PC-002" }));
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "multiple active records for one token must fail closed",
);
pageContent.rows.pop();
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, "wrong-page-secret"),
  null,
  "the WhatsApp secret or another key must not authorize page activation",
);
pageActivations.rows[1][activationColumnsForTest.State] = "Pending";
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "an unconsumed approval receipt must fail closed",
);
pageActivations.rows[1] = [...validActivationRow];
pageActivations.rows[1] = pageActivationRow(pageContentRows, {
  Scope: "PRINT_READY",
});
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "a valid PRINT_READY HMAC must not authorize PAGE_ACTIVATION",
);
pageActivations.rows[1] = [...validActivationRow];
pageActivations.rows.push([...validActivationRow]);
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "duplicate consumed receipts must fail closed",
);
pageActivations.rows.pop();
const originalExpiry = pageContent.rows[1][pageContentColumns.Expires_UTC];
pageContent.rows[1][pageContentColumns.Expires_UTC] = "2098-01-01T00:00:00.000Z";
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "changing a page expiry after approval must invalidate the signed page set",
);
pageContent.rows[1][pageContentColumns.Expires_UTC] = originalExpiry;
const originalReceiptReference =
  pageContent.rows[1][pageContentColumns.Activation_Receipt_SHA256];
pageContent.rows[1][pageContentColumns.Activation_Receipt_SHA256] = "0".repeat(64);
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "every active row must reference the exact consumed receipt",
);
pageContent.rows[1][pageContentColumns.Activation_Receipt_SHA256] =
  originalReceiptReference;
const removedCohortMember = pageContent.rows.pop();
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
  "production activation requires the exact 50-row cohort",
);
pageContent.rows.push(removedCohortMember);
pageProspects.rows[1][3] = "TRUE";
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
);
pageProspects.rows[1][3] = "FALSE";
pageProspects.rows[1][5] = "2020-01-01T00:00:00.000Z";
assert.equal(
  resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret, pageActivationSecret),
  null,
);
pageProspects.rows[1][5] = "2099-01-01T00:00:00.000Z";

assert.equal(
  recordPersonalPageVisit(pageSpreadsheet, pageResolution.visitTicket, secret)
    .recorded,
  true,
);
assert.deepEqual(pageEvents.rows[0], [
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
]);
assert.equal(pageEvents.rows.length, 2);
assert.equal(pageEvents.rows[1][0], "personal_page_visit");
assert.equal(pageEvents.rows[1][2], "IXA-CO-PAGE");
assert.equal(pageEvents.rows[1][3], "IXA-CT-PAGE");
assert.equal(pageEvents.rows[1][4], sha256Hex(pageToken));
assert.deepEqual(pageEvents.rows[1].slice(5), [
  "IXA-PC-001",
  "IXA001",
  "IXA-EXP-001",
  "v3.0",
  "IXA-LETTER-001",
  pageContent.rows[1][pageContentColumns.Content_SHA256],
]);
assert.equal(pageEvents.rows[1].length, 11, "event rows preserve cohort attribution");
assert.equal(
  recordPersonalPageVisit(pageSpreadsheet, pageResolution.visitTicket, secret)
    .recorded,
  false,
  "the opaque nonce must be consumed exactly once",
);
assert.equal(pageEvents.rows.length, 2, "a replay must not add an event row");

async function verifyPersonalPageContract() {
  const personal = loadTypeScriptModule("src/lib/personal-outreach.ts", {
    "@/data/site": {
      siteConfig: { contact: { whatsappNumber: "491629155408" } },
    },
  });
  const previousFetch = global.fetch;
  const previousEnvironment = {
    OUTREACH_SHEET_WEBHOOK_URL: process.env.OUTREACH_SHEET_WEBHOOK_URL,
    OUTREACH_SHEET_WEBHOOK_SECRET: process.env.OUTREACH_SHEET_WEBHOOK_SECRET,
    OUTREACH_PUBLIC_BASE_URL: process.env.OUTREACH_PUBLIC_BASE_URL,
    OUTREACH_WHATSAPP_NUMBER: process.env.OUTREACH_WHATSAPP_NUMBER,
  };
  const receiverSecret = "s".repeat(48);
  Object.assign(process.env, {
    OUTREACH_SHEET_WEBHOOK_URL:
      "https://script.google.com/macros/s/test-deployment/exec",
    OUTREACH_SHEET_WEBHOOK_SECRET: receiverSecret,
    OUTREACH_PUBLIC_BASE_URL: "https://ixa-leads.de",
    OUTREACH_WHATSAPP_NUMBER: "",
  });

  try {
    assert.equal(personal.isValidPublicToken(pageToken), true);
    assert.equal(personal.isValidPublicToken("../private"), false);
    assert.equal(personal.isValidPublicToken("short"), false);
    let receiverBody;
    const opaqueTicket = `${"A".repeat(48)}.${"b".repeat(64)}`;
    global.fetch = async (_url, options) => {
      receiverBody = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          ok: true,
          allowed: true,
          publicPageLabel: "Freigegebener Anzeigename",
          findings: [
            {
              title: "Mobiler Kontaktweg",
              observation: "Der Kontaktweg ist mobil erst später sichtbar.",
              implication: "Das könnte spontane Kontaktstarts bremsen.",
              sourceLabel: "Öffentlich sichtbare Website",
              verifiedAt: "2026-08-28",
            },
            {
              title: "Anfragequalifizierung",
              observation: "Projektart und Zeitraum werden nicht abgefragt.",
              implication: "Das könnte zusätzliche Rückfragen verursachen.",
              sourceLabel: "Öffentlich sichtbares Anfrageformular",
              verifiedAt: "2026-08-28",
            },
          ],
          firstTest: {
            title: "Kontaktweg im ersten Mobilbereich testen",
            description:
              "Die bestehende Kontaktoption 14 Tage lang zusätzlich im ersten sichtbaren Mobilbereich platzieren.",
          },
          visitTicket: opaqueTicket,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const resolved = await personal.resolvePersonalPage(pageToken);
    assert.equal(resolved.publicPageLabel, "Freigegebener Anzeigename");
    assert.equal(resolved.findings.length, 2);
    assert.equal(resolved.findings[0].verifiedAt, "28.08.2026");
    assert.equal(
      resolved.firstTest.title,
      "Kontaktweg im ersten Mobilbereich testen",
    );
    assert.equal(receiverBody.recordType, "personal_page_resolve");
    assert.equal(receiverBody.tokenProof.length, 64);
    assert.equal(JSON.stringify(receiverBody).includes(pageToken), false);
    assert.equal(Object.hasOwn(receiverBody, "companyId"), false);
    assert.equal(Object.hasOwn(receiverBody, "contactId"), false);

    const whatsappHref = personal.personalWhatsAppHref(pageToken);
    assert.match(whatsappHref, /^https:\/\/wa\.me\/491629155408\?text=/);
    assert.ok(
      decodeURIComponent(whatsappHref).includes(
        `https://ixa-leads.de/r/${pageToken}`,
      ),
      "the CTA must carry the same personal page URL",
    );
    assert.ok(
      decodeURIComponent(whatsappHref).includes(
        "Bitte senden Sie mir den vertieften Check per WhatsApp.",
      ),
      "the primary CTA must contain an explicit recipient request",
    );
    const meetingRequest = personal.personalWhatsAppRequest(
      pageToken,
      "meeting_15_min",
    );
    assert.match(
      meetingRequest.href,
      /^https:\/\/wa\.me\/491629155408\?text=/,
    );
    assert.match(
      meetingRequest.message,
      /Ich möchte ein unverbindliches 15-Minuten-Gespräch dazu anfragen\./,
    );
    assert.notEqual(meetingRequest.href, whatsappHref);

    const privacy = loadTypeScriptModule("src/lib/privacy-routes.ts");
    assert.equal(privacy.isNoTrackPath(`/r/${pageToken}`), true);
    assert.equal(privacy.isNoTrackPath("/vorschau/ixa-check"), true);
    assert.equal(privacy.isNoTrackPath("/"), false);

    const nextConfig = require("../next.config.js");
    const configuredHeaders = await nextConfig.headers();
    const personalHeaders = configuredHeaders.find(
      (entry) => entry.source === "/r/:path*",
    );
    assert.ok(personalHeaders);
    const headerMap = Object.fromEntries(
      personalHeaders.headers.map(({ key, value }) => [key, value]),
    );
    assert.match(headerMap["Cache-Control"], /no-store/);
    assert.equal(headerMap["X-Frame-Options"], "DENY");
    assert.equal(headerMap["Referrer-Policy"], "no-referrer");
    assert.match(headerMap["X-Robots-Tag"], /noindex/);
    assert.match(
      fs.readFileSync("src/app/robots.ts", "utf8"),
      /"\/r\/"/,
    );
    assert.equal(
      fs.readFileSync("src/app/vorschau/ixa-check/page.tsx", "utf8")
        .includes("PersonalPageVisitBeacon"),
      false,
      "the synthetic preview must never emit a personal visit",
    );

    const personalCheckView = fs.readFileSync(
      "src/components/personal-check/PersonalCheckView.tsx",
      "utf8",
    );
    assert.match(
      personalCheckView,
      /border-border bg-background\/95 text-foreground/,
      "the personal page header must use readable theme-aware colors",
    );
    assert.match(
      personalCheckView,
      /bg-primary[^\"]*text-primary-foreground/,
      "the personal page CTA must keep a high-contrast color pair",
    );
    assert.doesNotMatch(
      personalCheckView,
      /bg-\[#111414\][^\"]*text-white/,
      "the CTA must not reuse the hero text override that broke contrast",
    );
    assert.match(
      personalCheckView,
      /href="\/datenschutz"/,
      "the personal page footer must link to privacy information",
    );
    assert.match(
      personalCheckView,
      /href="\/datenloeschung"/,
      "the personal page footer must link to data deletion information",
    );
    assert.match(
      personalCheckView,
      /<ImpressumDialog/,
      "the personal page footer must expose the legal notice",
    );
    assert.match(
      personalCheckView,
      /findings: readonly \[PersonalPageFinding, PersonalPageFinding\]/,
      "the live page must require exactly two findings at its type boundary",
    );
    assert.match(
      personalCheckView,
      /Vertieften Check per WhatsApp anfordern/,
      "the live page must expose the deeper-check decision",
    );
    assert.match(
      personalCheckView,
      /15-Minuten-Gespräch per WhatsApp anfragen/,
      "the live page must expose the meeting decision",
    );
    const liveDecisionLinks =
      personalCheckView.match(/<a[\s\S]*?<\/a>/g) || [];
    assert.equal(
      liveDecisionLinks.length,
      2,
      "the live page must expose exactly two direct WhatsApp decisions",
    );
    assert.equal(
      liveDecisionLinks.every(
        (link) =>
          /target="_blank"/.test(link) &&
          /rel="noopener noreferrer"/.test(link) &&
          /referrerPolicy="no-referrer"/.test(link),
      ),
      true,
      "both live decisions must use privacy-safe outbound links",
    );
    const livePersonalPage = fs.readFileSync(
      "src/app/r/[token]/page.tsx",
      "utf8",
    );
    assert.match(livePersonalPage, /personalWhatsAppRequest\(token, "deeper_check"\)/);
    assert.match(livePersonalPage, /personalWhatsAppRequest\(token, "meeting_15_min"\)/);
    assert.match(livePersonalPage, /findings=\{resolution\.findings\}/);
    assert.match(livePersonalPage, /firstTest=\{resolution\.firstTest\}/);

    const decisionPreviewPage = fs.readFileSync(
      "src/app/vorschau/ixa-check/page.tsx",
      "utf8",
    );
    const decisionPreviewView = fs.readFileSync(
      "src/components/personal-check/PersonalCheckDecisionPreview.tsx",
      "utf8",
    );
    const privacyPage = fs.readFileSync(
      "src/app/datenschutz/page.tsx",
      "utf8",
    );
    assert.match(
      decisionPreviewPage,
      /PersonalCheckDecisionPreview/,
      "the synthetic route must render the V3 decision preview",
    );
    assert.match(
      decisionPreviewPage,
      /V3-Vorschau:[\s\S]*Page-Version v3\.0/,
      "the synthetic route metadata must identify V3 and Page-Version v3.0",
    );
    assert.match(
      decisionPreviewView,
      /Interne V3-Vorschau · Page-Version v3\.0/,
      "the visible preview notice must identify V3 and Page-Version v3.0",
    );
    assert.match(
      decisionPreviewPage,
      /title: "Mobiler Kontaktweg"/,
      "the V3 preview must include the first synthetic observation",
    );
    assert.match(
      decisionPreviewPage,
      /title: "Anfragequalifizierung"/,
      "the V3 preview must include the second synthetic observation",
    );
    assert.equal(
      (decisionPreviewPage.match(/verifiedAt:/g) || []).length,
      2,
      "both synthetic observations must carry a verification date",
    );
    assert.match(
      decisionPreviewView,
      /findings: readonly \[/,
      "the V3 preview must require exactly two findings at the type boundary",
    );
    assert.match(
      decisionPreviewView,
      /Vertieften Check per WhatsApp anfordern/,
      "the deeper check must be the primary V3 decision",
    );
    assert.match(
      decisionPreviewView,
      /15-Minuten-Gespräch per WhatsApp anfragen/,
      "the meeting request must remain a secondary V3 decision",
    );
    assert.match(
      decisionPreviewPage,
      /Bitte senden Sie mir den vertieften Check per WhatsApp/,
      "the primary action must show an explicit client-initiated request",
    );
    assert.match(
      decisionPreviewPage,
      /ich möchte ein unverbindliches 15-Minuten-Gespräch/,
      "the secondary action must show its own explicit request",
    );
    assert.match(
      decisionPreviewView,
      /Persönlicher Brief[\s\S]*QR-Seite[\s\S]*Sie starten WhatsApp/,
      "the preview must explain the postal-to-inbound response path",
    );
    assert.match(
      decisionPreviewView,
      /Google-Suche → passende Seite → Kontakt → qualifizierte[\s\S]*Anfrage → Angebot\/Auftrag → messbares Ergebnis/,
      "the preview must preserve the full IXA value chain",
    );
    assert.match(
      decisionPreviewView,
      /Eine kurze Nachricht „Nein“ genügt/,
      "the preview must state the simple objection path",
    );
    assert.match(
      decisionPreviewView,
      /Diese Vorschau erfasst weder einen Seitenbesuch noch eine[\s\S]*Google Analytics, Google Ads und Vercel Analytics deaktiviert/,
      "the preview must explain that it does not contaminate measurement",
    );
    const decisionPreviewButtons =
      decisionPreviewView.match(/<button[\s\S]*?<\/button>/g) || [];
    assert.equal(
      decisionPreviewButtons.length,
      2,
      "the V3 preview must expose exactly two decision actions",
    );
    assert.equal(
      decisionPreviewButtons.every((button) => /\sdisabled\s/.test(button)),
      true,
      "every V3 preview action must remain disabled",
    );
    assert.doesNotMatch(
      `${decisionPreviewPage}\n${decisionPreviewView}`,
      /<a\b|<Link\b|\bhref=|\bonClick=|wa\.me|whatsappHref|meetingHref|PersonalPageVisitBeacon|recordMainConversion/,
      "the synthetic V3 preview must not contain links, click handlers, beacons, or conversion calls",
    );
    assert.match(
      privacyPage,
      /tätig unter \{siteConfig\.name\}/,
      "the privacy notice must identify the controller's trading name",
    );
    assert.match(
      privacyPage,
      /Art\. 14 DSGVO[\s\S]*Art\. 6 Abs\. 1 lit\. f DSGVO/,
      "the privacy notice must explain the Article 14 postal-contact basis",
    );
    assert.match(
      privacyPage,
      /Widerspruch gegen Direktwerbung \(Art\. 21 Abs\. 2 und 3 DSGVO\)/,
      "the privacy notice must display the direct-marketing objection separately",
    );
    assert.match(
      privacyPage,
      /personal_page_visit[\s\S]*weder die IP-Adresse noch User-Agent, Referrer/,
      "the privacy notice must describe the minimal pseudonymous QR event",
    );
    assert.match(
      privacyPage,
      /Google Sheets[\s\S]*OpenAI\/ChatGPT[\s\S]*Vercel[\s\S]*Resend[\s\S]*Hostinger[\s\S]*WhatsApp/,
      "the privacy notice must name the service-provider categories used by the workflow",
    );

    let recordedTicket = null;
    const visitRoute = loadTypeScriptModule(
      "src/app/api/outreach/visit/route.ts",
      {
        "@/lib/personal-outreach": {
          recordPersonalPageVisit: async (ticket) => {
            recordedTicket = ticket;
            return true;
          },
        },
      },
    );
    const visitResponse = await visitRoute.POST(
      new Request("https://ixa-leads.de/api/outreach/visit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          referer: `https://ixa-leads.de/r/${pageToken}`,
          "user-agent": "must-not-be-forwarded",
        },
        body: JSON.stringify({ ticket: opaqueTicket }),
      }),
    );
    assert.equal(visitResponse.status, 204);
    assert.equal(recordedTicket, opaqueTicket);
  } finally {
    global.fetch = previousFetch;
    for (const [name, value] of Object.entries(previousEnvironment)) {
      if (value == null) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

async function verifyRouteContract() {
  const route = loadTypeScriptModule("src/app/api/whatsapp/webhook/route.ts", {
    "@/lib/whatsapp-webhook": webhook,
  });
  const previousFetch = global.fetch;
  const previousEnvironment = {
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_SHEET_WEBHOOK_URL: process.env.WHATSAPP_SHEET_WEBHOOK_URL,
    WHATSAPP_SHEET_WEBHOOK_SECRET: process.env.WHATSAPP_SHEET_WEBHOOK_SECRET,
  };

  Object.assign(process.env, {
    WHATSAPP_APP_SECRET: "app-secret",
    WHATSAPP_PHONE_NUMBER_ID: "phone",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "waba",
    WHATSAPP_SHEET_WEBHOOK_URL:
      "https://script.google.com/macros/s/test-deployment/exec",
    WHATSAPP_SHEET_WEBHOOK_SECRET: secret,
  });

  const signedRequest = (body) => {
    const raw = JSON.stringify(body);
    return new Request("https://ixa-leads.de/api/whatsapp/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": `sha256=${crypto
          .createHmac("sha256", "app-secret")
          .update(raw)
          .digest("hex")}`,
      },
      body: raw,
    });
  };

  try {
    let calls = [];
    global.fetch = async (_url, options) => {
      calls.push(JSON.parse(options.body));
      return new Response(
        JSON.stringify({
          ok: true,
          results: [{ requestKey, allowed: false }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const blockedResponse = await route.POST(signedRequest(payload));
    assert.equal(blockedResponse.status, 200);
    assert.equal(calls.length, 1, "blocked senders must stop after hash preflight");
    assert.equal(calls[0].schemaVersion, 2);
    assert.equal(
      Object.hasOwn(calls[0].items[0], "messageText"),
      false,
      "blocked sender text must never be forwarded",
    );
    assert.equal(
      Object.hasOwn(calls[0].items[0], "phoneE164"),
      false,
      "blocked sender phone must never be forwarded",
    );

    const largePayload = JSON.parse(JSON.stringify(payload));
    largePayload.entry[0].changes[0].value.messages = Array.from(
      { length: webhook.maxWhatsAppMessagesPerWebhook },
      (_, index) => ({
        id: `wamid.large.${index}`,
        from: "4915731562524",
        timestamp: "1787760000",
        type: "text",
        text: { body: "x".repeat(3500) },
      }),
    );
    calls = [];
    global.fetch = async (_url, options) => {
      const serialized = String(options.body);
      assert.ok(
        Buffer.byteLength(serialized, "utf8") <= 256 * 1024,
        "every Apps Script request must stay within its byte limit",
      );
      const body = JSON.parse(serialized);
      calls.push(body);
      if (body.recordType === "whatsapp_allowlist_batch") {
        return new Response(
          JSON.stringify({
            ok: true,
            results: body.items.map((item) => ({
              requestKey: item.requestKey,
              allowed: true,
              allowlistTicket: "t".repeat(4000),
            })),
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          sourceMessageIds: body.items.map((item) => item.sourceMessageId),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const largeResponse = await route.POST(signedRequest(largePayload));
    assert.equal(largeResponse.status, 200);
    assert.ok(
      calls.length > 2,
      "large accepted batches must be split into bounded save requests",
    );

    calls = [];
    global.fetch = async () => {
      throw new Error("overflow must fail before any Sheet request");
    };
    const overflowResponse = await route.POST(signedRequest(overflowPayload));
    assert.equal(overflowResponse.status, 413);
    assert.deepEqual(await overflowResponse.json(), { received: false });
  } finally {
    global.fetch = previousFetch;
    for (const [name, value] of Object.entries(previousEnvironment)) {
      if (value == null) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

verifyRouteContract()
  .then(() => verifyPersonalPageContract())
  .then(() => {
    console.log("Outreach privacy and matching contracts verified.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
