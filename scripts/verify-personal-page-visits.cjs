/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function loadModule(path, overrides) {
  const output = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name),
    loaded, loaded.exports,
  );
  return loaded.exports;
}

async function verifyRoute() {
  const calls = [];
  let behavior = async () => true;
  const route = loadModule("src/app/api/outreach/visit/route.ts", {
    "@/lib/personal-outreach": {
      recordPersonalPageVisit: async (...args) => {
        calls.push(args);
        return behavior();
      },
    },
  });
  const request = (body, extraHeaders = {}) => new Request("https://example.test/api/outreach/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body,
  });
  let response = await route.POST(request(JSON.stringify({ ticket: "opaque-test-ticket" }), {
    "User-Agent": "not-forwarded",
    Referer: "https://example.test/r/private-reference",
  }));
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.deepEqual(calls, [["opaque-test-ticket"]], "forward only the ticket, not browser metadata");

  behavior = async () => false;
  response = await route.POST(request('{"ticket":"opaque-test-ticket"}'));
  assert.equal(response.status, 503, "failed receiver handoff must not acknowledge delivery");
  assert.equal(await response.text(), "", "never expose receiver or matching state");

  behavior = async () => { throw new Error("private receiver failure"); };
  response = await route.POST(request('{"ticket":"opaque-test-ticket"}'));
  assert.equal(response.status, 503);
  assert.equal(await response.text(), "");

  const callsBeforeInvalid = calls.length;
  assert.equal((await route.POST(request("{broken"))).status, 400);
  assert.equal((await route.POST(request('{"ticket":17}'))).status, 400);
  assert.equal((await route.POST(request("null"))).status, 400);
  assert.equal((await route.POST(request("x".repeat(4097)))).status, 413);
  assert.equal((await route.POST(request("{}", { "Content-Length": "4097" }))).status, 413);
  assert.equal(calls.length, callsBeforeInvalid, "invalid requests never reach the receiver");
}

function mountBeacon(outcomes, visibility = "visible") {
  const saved = Object.fromEntries(["window", "document", "fetch"].map((name) => [name, global[name]]));
  const timers = new Map();
  const listeners = new Map();
  const calls = [];
  let now = 0;
  let nextTimer = 0;
  let cleanup;
  global.window = {
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, due: now + delay, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  global.document = {
    visibilityState: visibility,
    addEventListener(event, callback) { listeners.set(event, callback); },
    removeEventListener(event, callback) {
      if (listeners.get(event) === callback) listeners.delete(event);
    },
  };
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    const outcome = outcomes[Math.min(calls.length - 1, outcomes.length - 1)];
    if (outcome instanceof Error) throw outcome;
    if (typeof outcome === "function") return outcome(options);
    return new Response(null, { status: outcome });
  };
  const component = loadModule("src/components/personal-check/PersonalPageVisitBeacon.tsx", {
    react: { useEffect(effect) { cleanup = effect(); } },
  });
  assert.equal(component.PersonalPageVisitBeacon({ ticket: "same-opaque-ticket" }), null);
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  return {
    calls,
    timers,
    listeners,
    async nextTimer() {
      assert.ok(timers.size, "expected a scheduled callback");
      const [id, timer] = [...timers.entries()].sort((a, b) => a[1].due - b[1].due)[0];
      timers.delete(id);
      now = timer.due;
      timer.callback();
      await flush();
      return timer.delay;
    },
    visibility(value) {
      global.document.visibilityState = value;
      listeners.get("visibilitychange")?.();
    },
    cleanup() { cleanup(); },
    async flush() { await flush(); },
    restore() {
      cleanup();
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete global[name];
        else global[name] = value;
      }
    },
  };
}

async function withBeacon(outcomes, callback, visibility) {
  const beacon = mountBeacon(outcomes, visibility);
  try { await callback(beacon); } finally { beacon.restore(); }
}

async function verifyBeacon() {
  await withBeacon([204], async (beacon) => {
    assert.equal(beacon.calls.length, 0, "do not record immediately on mount");
    const delay = await beacon.nextTimer();
    assert.ok(delay >= 1000 && delay <= 1500);
    assert.equal(beacon.calls.length, 1);
    const { url, options } = beacon.calls[0];
    assert.equal(url, "/api/outreach/visit");
    assert.deepEqual(JSON.parse(options.body), { ticket: "same-opaque-ticket" });
    assert.equal(options.keepalive, true);
    assert.equal(options.cache, "no-store");
    assert.equal(beacon.timers.size, 0, "acknowledged processing stops retries");
    beacon.visibility("hidden");
    beacon.visibility("visible");
    assert.equal(beacon.timers.size, 0, "visibility changes cannot duplicate an acknowledged event");
  });

  await withBeacon([503, new Error("offline"), 204], async (beacon) => {
    await beacon.nextTimer();
    await beacon.nextTimer();
    await beacon.nextTimer();
    assert.equal(beacon.calls.length, 3);
    assert.equal(new Set(beacon.calls.map(({ options }) => options.body)).size, 1, "retry the same ticket for receiver deduplication");
    assert.equal(beacon.timers.size, 0);
  });

  await withBeacon([503], async (beacon) => {
    await beacon.nextTimer();
    await beacon.nextTimer();
    await beacon.nextTimer();
    assert.equal(beacon.calls.length, 3, "cap attempts during an outage");
    beacon.visibility("hidden");
    beacon.visibility("visible");
    assert.equal(beacon.timers.size, 0);
  });

  await withBeacon([400], async (beacon) => {
    await beacon.nextTimer();
    beacon.visibility("hidden");
    beacon.visibility("visible");
    assert.equal(beacon.calls.length, 1);
    assert.equal(beacon.timers.size, 0, "permanent request errors must not retry");
  });

  await withBeacon([204], async (beacon) => {
    assert.equal(beacon.timers.size, 0, "hidden or prefetched pages do not emit visits");
    beacon.visibility("visible");
    assert.equal(beacon.timers.size, 1);
    beacon.visibility("hidden");
    assert.equal(beacon.timers.size, 0);
    assert.equal(beacon.calls.length, 0);
  }, "hidden");

  await withBeacon([503], async (beacon) => {
    await beacon.nextTimer();
    beacon.cleanup();
    assert.equal(beacon.timers.size, 0, "unmount cancels retry timers");
    assert.equal(beacon.listeners.size, 0);
  });

  await withBeacon([
    (options) => new Promise((_, reject) => options.signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true })),
    204,
  ], async (beacon) => {
    await beacon.nextTimer();
    const timeout = await beacon.nextTimer();
    assert.equal(timeout, 15000, "a hung request has a finite deadline");
    await beacon.nextTimer();
    assert.equal(beacon.calls.length, 2);
    assert.equal(beacon.timers.size, 0);
  });
}

verifyRoute()
  .then(verifyBeacon)
  .then(() => console.log("Personal-page visit delivery, privacy and bounded retries verified."))
  .catch((error) => { console.error(error); process.exitCode = 1; });
