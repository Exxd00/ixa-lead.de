import { recordPersonalPageVisit } from "@/lib/personal-outreach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;

function empty(status = 204): Response {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_BODY_BYTES
  ) {
    return empty(413);
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return empty(413);
    const body: unknown = JSON.parse(raw);
    const ticket =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as { ticket?: unknown }).ticket
        : null;
    if (typeof ticket !== "string") return empty(400);

    await recordPersonalPageVisit(ticket);
    // The browser never receives matching or deduplication state.
    return empty();
  } catch {
    return empty();
  }
}
