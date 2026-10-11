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
const { emptyIntake } = load("src/lib/client-intake.ts");
const { intakeEmail } = load("src/lib/client-intake-email.ts");
const { POST } = load("src/app/api/client-intake/route.ts");
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

test("client questionnaire delivery contract", async (t) => {
  let calls = [];
  function capture(status = 200, result = { id: "email-test-id" }) {
    calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, ...options, json: JSON.parse(options.body) });
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
        for (const n of ["01", "02", "03", "04", "05", "06", "07", "08", "09"])
          assert.ok(calls[0].json.text.includes(n + " ·"));
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
        assert.ok(!isNoTrackPath("/"));
      },
    );
    const preview = process.env.INTAKE_EMAIL_PREVIEW_PATH;
    if (preview)
      fs.writeFileSync(preview, intakeEmail(valid, valid.submissionId).html);
  } finally {
    global.fetch = originalFetch;
  }
});
