import { NextResponse } from "next/server";

/* =====================================================================
   Kontakt-Endpoint — IXA-Leads
   Nimmt Formular-Anfragen entgegen, validiert sie und leitet sie – wenn
   konfiguriert – per Webhook automatisch weiter (z. B. an Google Sheets,
   Zapier oder Make). Ohne Webhook wird keine Anfrage als erfolgreich bestätigt.

   Live schalten:
   - LEAD_WEBHOOK_URL setzen (Zapier/Make/Google-Apps-Script Webhook), damit
     Leads automatisch in Google Sheets & Co. landen (Lead-Automation).
   ===================================================================== */

export const dynamic = "force-dynamic";

const payloadKeys = [
  "name",
  "contact",
  "url",
  "adService",
  "neededService",
  "problem",
  "budget",
] as const;

type Payload = {
  name?: string;
  contact?: string;
  url?: string;
  adService?: string;
  neededService?: string;
  problem?: string;
  budget?: string;
};

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const raw = parsed as Record<string, unknown>;
  if (
    payloadKeys.some(
      (key) => raw[key] !== undefined && typeof raw[key] !== "string",
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_field_type" },
      { status: 400 },
    );
  }

  const data = Object.fromEntries(
    payloadKeys
      .filter((key) => typeof raw[key] === "string")
      .map((key) => [key, (raw[key] as string).trim()]),
  ) as Payload;

  // Minimale serverseitige Validierung
  if (!data.name || !data.contact || !data.problem) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 422 },
    );
  }

  const fields = [
    data.name,
    data.contact,
    data.url,
    data.adService,
    data.neededService,
    data.problem,
    data.budget,
  ];
  if (fields.some((value) => value && value.length > 2_000)) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  const lead = {
    ...data,
    source: "ixa-leads.de",
    receivedAt: new Date().toISOString(),
  };

  // Optionaler Webhook (Lead-Automation → Google Sheets / Zapier / Make)
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.error("[contact] LEAD_WEBHOOK_URL ist nicht konfiguriert.");
    return NextResponse.json(
      { ok: false, error: "form_not_configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`webhook_status_${res.status}`);
  } catch (err) {
    console.error("[contact] Webhook-Weiterleitung fehlgeschlagen:", err);
    return NextResponse.json(
      { ok: false, error: "forwarding_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
