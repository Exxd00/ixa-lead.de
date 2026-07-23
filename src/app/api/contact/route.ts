import { NextResponse } from "next/server";

/* =====================================================================
   Kontakt-Endpoint — IXA-Leads
   Nimmt Formular-Anfragen entgegen, validiert sie und leitet sie – wenn
   konfiguriert – per Webhook automatisch weiter (z. B. an Google Sheets,
   Zapier oder Make). Ohne Webhook wird die Anfrage serverseitig geloggt.

   Live schalten:
   - LEAD_WEBHOOK_URL setzen (Zapier/Make/Google-Apps-Script Webhook), damit
     Leads automatisch in Google Sheets & Co. landen (Lead-Automation).
   ===================================================================== */

export const dynamic = "force-dynamic";

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
  let data: Payload;
  try {
    data = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  // Minimale serverseitige Validierung
  if (!data.name?.trim() || !data.contact?.trim() || !data.problem?.trim()) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 422 },
    );
  }

  const lead = {
    ...data,
    source: "ixa-leads.de",
    receivedAt: new Date().toISOString(),
  };

  // Optionaler Webhook (Lead-Automation → Google Sheets / Zapier / Make)
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error(`webhook_status_${res.status}`);
    } catch (err) {
      console.error("[contact] Webhook-Weiterleitung fehlgeschlagen:", err);
      return NextResponse.json(
        { ok: false, error: "forwarding_failed" },
        { status: 502 },
      );
    }
  } else {
    // Kein Webhook konfiguriert: Anfrage protokollieren, damit sie nicht verloren geht.
    console.info("[contact] Neue Anfrage (LEAD_WEBHOOK_URL nicht gesetzt):", lead);
  }

  return NextResponse.json({ ok: true });
}
