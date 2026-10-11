const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (name) =>
    name.startsWith("@/")
      ? load(`src/${name.slice(2)}.ts`)
      : name.startsWith(".")
        ? load(path.resolve(path.dirname(filename), `${name}.ts`))
        : require(name);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
    filename,
  })(localRequire, mod, mod.exports);
  return mod.exports;
}
const { emptyIntake, parseIntake, INTAKE_EVENT } = load(
  "src/lib/client-intake.ts",
);
const { intakeEmail } = load("src/lib/client-intake-email.ts");
const { POST } = load("src/app/api/client-intake/route.ts");
const { intakeSheetHeaders, intakeSheetValues } = load(
  "src/lib/client-intake-sheet.ts",
);
const { createIntakeReceipt, verifyIntakeReceipt } = load(
  "src/lib/client-intake-receipt.ts",
);
const { POST: complete } = load("src/app/api/client-intake/complete/route.ts");
const { NextRequest } = require("next/server");
const { isNoTrackPath } = load("src/lib/privacy-routes.ts");
const valid = {
  ...emptyIntake(),
  submissionId: "fa4e6f50-7e96-489f-a78d-24896a58a759",
  websiteExtra: "",
  company: "TEST Musterfirma",
  owner: "Testperson",
  address: "Musterstraße 12",
  services: "Reinigung\nBüropflege",
  regions: "Beispielstadt",
  phone: "+49 000 123456",
  email: "test@example.invalid",
  hours: "Mo-Fr 8-18",
  existing: "Nicht vorhanden",
  branding: "Mint & Weiß",
  google: "Noch nicht vorhanden",
  examples: "example.invalid",
  launch: "Nach Absprache",
  contactMethods: ["phone", "form"],
  privacyAcknowledged: true,
};
function request(body = valid, options = {}) {
  return new Request("https://ixa-leads.de/api/client-intake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://ixa-leads.de",
      ...options.headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const originalFetch = global.fetch;
process.env.RESEND_API_KEY = "test-key-not-real";
process.env.RESEND_FROM_EMAIL = "IXA <test@example.invalid>";
delete process.env.CLIENT_INTAKE_NOTIFICATION_EMAIL;
process.env.OUTREACH_SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/TEST_NOT_REAL/exec";
process.env.OUTREACH_SHEET_WEBHOOK_SECRET = "test-secret-only-".repeat(4);

test("client questionnaire delivery contract", async (t) => {
  let calls = [];
  let sheetCalls = [];
  function capture(status = 200, result = { id: "email-test-id" }) {
    calls = [];
    sheetCalls = [];
    global.fetch = async (url, options) => {
      const body = JSON.parse(options.body);
      if (url.includes("script.google.com")) {
        sheetCalls.push(body);
        return new Response(
          JSON.stringify({
            ok: true,
            submissionId: body.submissionId,
            sheetId: 151026001,
            rowNumber: 2,
            emailAccepted: false,
            sendEvent: true,
          }),
        );
      }
      calls.push({ url, ...options, json: body });
      return new Response(JSON.stringify(result), { status });
    };
  }
  try {
    await t.test(
      "all nine answers reach the fixed IXA recipient, with safe HTML and Reply-To",
      async () => {
        capture();
        const response = await POST(
          request({
            ...valid,
            company: "TEST <img src=x onerror=alert(1)>",
            to: "attacker@example.invalid",
          }),
        );
        assert.equal(response.status, 200);
        assert.equal((await response.json()).ok, true);
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].json.to, ["info@ixa-leads.de"]);
        assert.equal(calls[0].json.reply_to, valid.email);
        for (const heading of [
          "Kontakt",
          "Unternehmen & Impressum",
          "Website & Erreichbarkeit",
          "Bereits vorhanden",
          "Wünsche & Termin",
        ])
          assert.ok(calls[0].json.text.includes(heading));
        assert.deepEqual(
          sheetCalls.map((x) => x.operation),
          ["save", "email_accepted"],
        );
        assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
        assert.match(response.headers.get("set-cookie"), /Max-Age=1800/i);
        assert.equal(sheetCalls[0].headers.length, 43);
        assert.ok(calls[0].json.html.includes("&lt;img"));
        assert.ok(!calls[0].json.html.includes("<img src=x"));
        assert.ok(calls[0].json.text.includes("Reinigung\nBüropflege"));
      },
    );
    await t.test(
      "retries preserve both idempotency key and exact outbound email",
      async () => {
        capture();
        await POST(request());
        await POST(request());
        assert.equal(
          calls[0].headers["Idempotency-Key"],
          calls[1].headers["Idempotency-Key"],
        );
        assert.equal(calls[0].body, calls[1].body);
        await POST(request({ ...valid, services: "Geänderte Antwort" }));
        assert.notEqual(
          calls[1].headers["Idempotency-Key"],
          calls[2].headers["Idempotency-Key"],
        );
      },
    );
    await t.test(
      "provider failure or an invalid acknowledgement never produces success",
      async () => {
        for (const [status, body] of [
          [500, { error: "test" }],
          [200, { ok: true }],
          [200, { id: "" }],
        ]) {
          capture(status, body);
          const response = await POST(request());
          assert.equal(response.status, 502);
          assert.equal((await response.json()).ok, false);
        }
      },
    );
    await t.test(
      "timeouts retain retry semantics and missing configuration fails closed",
      async () => {
        global.fetch = async () => {
          throw new Error("timeout");
        };
        assert.equal((await POST(request())).status, 502);
        delete process.env.RESEND_API_KEY;
        assert.equal((await POST(request())).status, 503);
        process.env.RESEND_API_KEY = "test-key-not-real";
      },
    );
    await t.test(
      "incomplete, automated, cross-origin and oversized requests never send email",
      async () => {
        capture();
        for (const body of [
          { ...valid, owner: "" },
          { ...valid, privacyAcknowledged: false },
          { ...valid, websiteExtra: "spam" },
          { ...valid, submissionId: "wrong" },
          { ...valid, email: "", phone: "", whatsapp: "" },
          { ...valid, contactMethods: ["unknown"] },
          { ...valid, services: "x".repeat(2001) },
        ])
          assert.equal((await POST(request(body))).status, 422);
        assert.equal(
          (
            await POST(
              request(valid, {
                headers: { origin: "https://elsewhere.invalid" },
              }),
            )
          ).status,
          403,
        );
        assert.equal((await POST(request("not-json"))).status, 400);
        assert.equal((await POST(request("x".repeat(32769)))).status, 413);
        assert.equal(calls.length, 0);
      },
    );
    await t.test(
      "missing business email is allowed when a telephone is reachable",
      async () => {
        capture();
        assert.equal(
          (await POST(request({ ...valid, email: "Nicht vorhanden" }))).status,
          200,
        );
        assert.ok(!("reply_to" in calls[0].json));
      },
    );
    await t.test(
      "bounded warm-instance abuse guard and private measurement paths",
      async () => {
        capture();
        const options = { headers: { "x-forwarded-for": "192.0.2.44" } };
        for (let i = 0; i < 10; i++)
          assert.equal((await POST(request(valid, options))).status, 200);
        assert.equal((await POST(request(valid, options))).status, 429);
        assert.equal(calls.length, 10);
        assert.ok(isNoTrackPath("/kundenfragebogen"));
        assert.ok(isNoTrackPath("/kundenfragebogen/"));
        assert.ok(isNoTrackPath("/info"));
        assert.ok(!isNoTrackPath("/info/danke"));
        assert.ok(!isNoTrackPath("/"));
      },
    );
    await t.test(
      "storage failure never sends mail or creates a success receipt",
      async () => {
        capture();
        global.fetch = async () => new Response(JSON.stringify({ ok: false }));
        const response = await POST(request());
        assert.equal(response.status, 502);
        assert.equal(response.headers.get("set-cookie"), null);
        assert.equal(calls.length, 0);
      },
    );
    await t.test("a previously accepted email is not sent twice", async () => {
      capture();
      global.fetch = async (url, options) => {
        assert.ok(url.includes("script.google.com"));
        const body = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            ok: true,
            submissionId: body.submissionId,
            sheetId: 151026001,
            rowNumber: 2,
            emailAccepted: true,
          }),
        );
      };
      assert.equal((await POST(request())).status, 200);
    });
    await t.test(
      "signed receipts reject tampering and expire; statistics require receipt and consent",
      async () => {
        const token = createIntakeReceipt(valid.submissionId, 10000);
        assert.equal(verifyIntakeReceipt(token, 10001).id, valid.submissionId);
        assert.equal(verifyIntakeReceipt(token + "x", 10001), null);
        assert.equal(verifyIntakeReceipt(token, 1810001), null);
        assert.equal(verifyIntakeReceipt(undefined), null);
        const base = { origin: "https://ixa-leads.de" };
        const req = (headers) =>
          new NextRequest("https://ixa-leads.de/api/client-intake/complete", {
            method: "POST",
            headers,
          });
        capture();
        assert.equal((await complete(req(base))).status, 403);
        assert.equal(
          (await complete(req({ ...base, "x-ixa-statistics": "granted" })))
            .status,
          403,
        );
        const cookie =
          "ixa_client_intake_receipt=" +
          createIntakeReceipt(valid.submissionId);
        assert.equal((await complete(req({ ...base, cookie }))).status, 403);
        assert.equal(sheetCalls.length, 0);
        const response = await complete(
          req({ ...base, cookie, "x-ixa-statistics": "granted" }),
        );
        assert.equal(response.status, 200);
        assert.deepEqual(
          Object.keys(sheetCalls[0]).sort(),
          [
            "_secret",
            "operation",
            "recordType",
            "schemaVersion",
            "submissionId",
          ].sort(),
        );
        assert.equal(INTAKE_EVENT, "info_danke");
      },
    );
    await t.test(
      "conditional legal fields and Ads metadata retain truthful defaults",
      () => {
        const parsed = parseIntake({
          ...valid,
          taxStatus: "no",
          vatId: "DE123456789",
          registerStatus: "no",
          register: "old",
          existingStatus: "no",
          existing: "old",
        });
        assert.equal(parsed.ok, true);
        assert.equal(parsed.answers.vatId, "");
        assert.equal(parsed.answers.register, "");
        assert.equal(parsed.answers.existing, "");
        assert.equal(
          parseIntake({ ...valid, taxStatus: "yes", vatId: "123/456/789" }).ok,
          false,
        );
        const values = intakeSheetValues(
          parsed.answers,
          valid.submissionId,
          "a".repeat(32),
        );
        assert.equal(values.length, intakeSheetHeaders.length);
        assert.equal(values[36], "UNKNOWN");
        assert.equal(values[37], "Nicht freigegeben");
      },
    );
    const preview = process.env.INTAKE_EMAIL_PREVIEW_PATH;
    if (preview)
      fs.writeFileSync(preview, intakeEmail(valid, valid.submissionId).html);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Apps Script saves only to the intended tab and deduplicates records and tracking", () => {
  const rows = [intakeSheetHeaders.slice()];
  let released = 0;
  const get = (r, c) => String(rows[r - 1]?.[c - 1] ?? "");
  const range = (r, c, h = 1, w = 1) => ({
    getDisplayValues: () =>
      Array.from({ length: h }, (_, i) =>
        Array.from({ length: w }, (_, j) => get(r + i, c + j)),
      ),
    getDisplayValue: () => get(r, c),
    setNumberFormat() {
      return this;
    },
    setWrap() {
      return this;
    },
    setVerticalAlignment() {
      return this;
    },
    setValues(values) {
      for (let i = 0; i < values.length; i++) {
        rows[r + i - 1] ??= [];
        for (let j = 0; j < values[i].length; j++)
          rows[r + i - 1][c + j - 1] = values[i][j];
      }
      return this;
    },
    setValue(value) {
      return this.setValues([[value]]);
    },
    createTextFinder(id) {
      return {
        matchEntireCell() {
          return this;
        },
        useRegularExpression() {
          return this;
        },
        findNext() {
          const index = rows.findIndex(
            (row, i) => i >= r - 1 && i < r - 1 + h && row[c - 1] === id,
          );
          return index < 0 ? null : { getRow: () => index + 1 };
        },
      };
    },
  });
  const sheet = {
    getSheetId: () => 151026001,
    getRange: range,
    getLastColumn: () => 43,
    getLastRow: () => rows.length,
    getMaxRows: () => 500,
    setRowHeight() {},
  };
  const book = {
    getId: () => "1YFYLQPMSdCzq6ArY0szD93qnfBHIub7yy-WnKDfGhoY",
    getSheetByName(name) {
      assert.equal(name, "15 Kunden-Websites");
      return sheet;
    },
  };
  const context = vm.createContext({
    json_: (x) => x,
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        releaseLock: () => released++,
      }),
    },
    SpreadsheetApp: { flush() {} },
    Date,
  });
  vm.runInContext(
    fs.readFileSync(
      path.join(root, "integrations/ixa-outreach-webhook/ClientIntake.gs"),
      "utf8",
    ),
    context,
  );
  const digest = "a".repeat(32);
  const body = {
    operation: "save",
    submissionId: valid.submissionId,
    digest,
    headers: intakeSheetHeaders,
    values: intakeSheetValues(
      { ...valid, company: '=HYPERLINK("https://example.invalid")' },
      valid.submissionId,
      digest,
    ),
  };
  const save = (patch = {}) =>
    context.saveClientIntake_(book, { ...body, ...patch });
  assert.equal(save().ok, true);
  assert.equal(rows.length, 2);
  assert.ok(rows[1][1].startsWith("'="));
  assert.equal(save().duplicate, true);
  assert.equal(rows.length, 2);
  assert.equal(
    save({
      digest: "b".repeat(32),
      values: body.values.map((x, i) => (i === 39 ? "b".repeat(32) : x)),
    }).error,
    "intake_id_conflict",
  );
  assert.equal(save({ headers: ["wrong"] }).ok, false);
  assert.equal(
    save({ operation: "email_accepted", emailId: "TEST-email-id" })
      .emailAccepted,
    true,
  );
  assert.equal(save({ operation: "claim_tracking" }).sendEvent, true);
  assert.equal(save({ operation: "claim_tracking" }).sendEvent, false);
  assert.equal(
    context.saveClientIntake_({ getId: () => "wrong" }, body).ok,
    false,
  );
  assert.equal(rows.length, 2);
  assert.equal(released, 7);
});
