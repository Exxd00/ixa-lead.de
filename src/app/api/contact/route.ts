import { NextResponse } from "next/server";
import {
  freeCheckServiceId,
  leadServiceOptions,
} from "@/data/site";

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
  "serviceId",
  "auditType",
  "contactMethod",
  "visitLocation",
  "visitWindow",
  "projectDetail",
] as const;

type Payload = {
  name?: string;
  contact?: string;
  url?: string;
  adService?: string;
  neededService?: string;
  problem?: string;
  budget?: string;
  serviceId?: string;
  auditType?: string;
  contactMethod?: string;
  visitLocation?: string;
  visitWindow?: string;
  projectDetail?: string;
};

function normalizeWebsite(value: string): string | null {
  const candidate = value.trim();
  if (!candidate || /\s/.test(candidate)) return null;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname.includes(".")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

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

  const selectedService = leadServiceOptions.find(
    (service) => service.id === data.serviceId,
  );
  if (!selectedService) {
    return NextResponse.json(
      { ok: false, error: "invalid_service" },
      { status: 422 },
    );
  }

  if (!data.name || !data.contact) {
    return NextResponse.json(
      { ok: false, error: "missing_contact_fields" },
      { status: 422 },
    );
  }

  if (data.url) {
    const website = normalizeWebsite(data.url);
    if (!website) {
      return NextResponse.json(
        { ok: false, error: "invalid_website" },
        { status: 422 },
      );
    }
    data.url = website;
  }

  const isFreeCheck = data.serviceId === freeCheckServiceId;
  if (isFreeCheck) {
    if (data.auditType !== "written" && data.auditType !== "onsite") {
      return NextResponse.json(
        { ok: false, error: "invalid_audit_type" },
        { status: 422 },
      );
    }

    if (data.auditType === "written") {
      if (!data.url) {
        return NextResponse.json(
          { ok: false, error: "invalid_website" },
          { status: 422 },
        );
      }
      if (
        data.contactMethod !== "whatsapp" &&
        data.contactMethod !== "email"
      ) {
        return NextResponse.json(
          { ok: false, error: "invalid_contact_method" },
          { status: 422 },
        );
      }

      data.adService = "";
      data.visitLocation = "";
      data.visitWindow = "";
      data.projectDetail = "";
    } else {
      if (
        !data.adService ||
        !data.visitLocation ||
        !data.visitWindow ||
        !data.problem
      ) {
        return NextResponse.json(
          { ok: false, error: "missing_visit_details" },
          { status: 422 },
        );
      }

      data.contactMethod = "phone";
      data.projectDetail = "";
    }
  } else {
    if (!data.projectDetail || !data.problem) {
      return NextResponse.json(
        { ok: false, error: "missing_project_details" },
        { status: 422 },
      );
    }

    data.auditType = "";
    data.contactMethod = "";
    data.visitLocation = "";
    data.visitWindow = "";
  }

  data.neededService = selectedService.label;

  const fields = [
    data.name,
    data.contact,
    data.url,
    data.adService,
    data.neededService,
    data.problem,
    data.budget,
    data.serviceId,
    data.auditType,
    data.contactMethod,
    data.visitLocation,
    data.visitWindow,
    data.projectDetail,
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
