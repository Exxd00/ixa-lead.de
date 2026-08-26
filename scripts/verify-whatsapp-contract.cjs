/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScriptModule(path) {
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
  new Function("require", "module", "exports", output)(
    require,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

function signedBytes(buffer) {
  return Array.from(buffer, (byte) => (byte > 127 ? byte - 256 : byte));
}

function loadAppsScript(path) {
  const context = vm.createContext({
    Utilities: {
      Charset: { UTF_8: "UTF_8" },
      DigestAlgorithm: { SHA_256: "SHA_256" },
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

function spreadsheetWithRows(headers, rows) {
  const sheet = {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange(row, column, rowCount, columnCount) {
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

const apps = loadAppsScript("integrations/ixa-outreach-webhook/Code.gs");
const matchAllowlist = apps("matchAllowlist_");
const sha256Hex = apps("sha256Hex_");
const hmacSha256Hex = apps("hmacSha256Hex_");
const isValidInbound = apps("isValidInbound_");
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
const spreadsheet = spreadsheetWithRows(headers, [firstRow]);
const unmatchedPhoneProof = hmacSha256Hex("491111111111", secret);
const printedOnly = matchAllowlist(
  spreadsheet,
  {
    phoneProof: unmatchedPhoneProof,
    referenceProofs: [hmacSha256Hex(sha256Hex(firstRow[4]), secret)],
  },
  secret,
);
assert.equal(printedOnly.allowed, false, "Printed_Ref must not open the gate");

const tokenMatch = matchAllowlist(
  spreadsheet,
  {
    phoneProof: unmatchedPhoneProof,
    referenceProofs: [hmacSha256Hex(sha256Hex(firstRow[5]), secret)],
  },
  secret,
);
assert.equal(tokenMatch.allowed, true);
assert.equal(tokenMatch.matchMethod, "Strong public token");

const phoneProof = hmacSha256Hex("4915731562524", secret);
const phoneMatch = matchAllowlist(
  spreadsheet,
  { phoneProof, referenceProofs: [] },
  secret,
);
assert.equal(phoneMatch.allowed, true);
assert.equal(phoneMatch.matchMethod, "Exact E164");

const duplicateSpreadsheet = spreadsheetWithRows(headers, [
  firstRow,
  ["IXA-CO-2", "IXA-CT-2", "+49 15731562524", "", "", "token-2", "TRUE"],
]);
const duplicateMatch = matchAllowlist(
  duplicateSpreadsheet,
  { phoneProof, referenceProofs: [] },
  secret,
);
assert.equal(duplicateMatch.blocked, true);
assert.equal(duplicateMatch.matchConfidence, 0.5);

const inbound = {
  requestKey: "a".repeat(64),
  phoneProof,
  referenceProofs: [],
  sourceMessageId: "wamid.test",
  phoneE164: "+4915731562524",
  messageType: "text",
  messageText: "Hallo",
};
assert.equal(isValidInbound(inbound, secret), true);
assert.equal(
  isValidInbound({ ...inbound, phoneE164: "+491111111111" }, secret),
  false,
  "phone proof must be bound to the forwarded E.164 number",
);

console.log("WhatsApp privacy and matching contract verified.");
