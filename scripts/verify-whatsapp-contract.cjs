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
  const context = vm.createContext({
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
        return Buffer.from(String(value), "utf8").toString("base64url");
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
let pageEvents = null;
const pageSpreadsheet = {
  getSheetByName(name) {
    if (name === "01 Prospects") return pageProspects;
    if (name === "08 Outreach Events") return pageEvents;
    return null;
  },
  insertSheet(name) {
    assert.equal(name, "08 Outreach Events");
    pageEvents = mutableSheet([], 5);
    return pageEvents;
  },
};
const pageTokenProof = hmacSha256Hex(sha256Hex(pageToken), secret);
const pageResolution = resolvePersonalPage(
  pageSpreadsheet,
  pageTokenProof,
  secret,
);
assert.equal(pageResolution.publicPageLabel, "Manuell freigegebener Betrieb");
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
  resolvePersonalPage(pageSpreadsheet, "0".repeat(64), secret),
  null,
  "unknown tokens must have the same empty resolution as suppressed tokens",
);
pageProspects.rows[1][3] = "TRUE";
assert.equal(resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret), null);
pageProspects.rows[1][3] = "FALSE";
pageProspects.rows[1][5] = "2020-01-01T00:00:00.000Z";
assert.equal(resolvePersonalPage(pageSpreadsheet, pageTokenProof, secret), null);
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
]);
assert.equal(pageEvents.rows.length, 2);
assert.equal(pageEvents.rows[1][0], "personal_page_visit");
assert.equal(pageEvents.rows[1][2], "IXA-CO-PAGE");
assert.equal(pageEvents.rows[1][3], "IXA-CT-PAGE");
assert.equal(pageEvents.rows[1][4], sha256Hex(pageToken));
assert.equal(pageEvents.rows[1].length, 5, "event rows contain exactly five fields");
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
          visitTicket: opaqueTicket,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const resolved = await personal.resolvePersonalPage(pageToken);
    assert.equal(resolved.publicPageLabel, "Freigegebener Anzeigename");
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
