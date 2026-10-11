import { createHmac, timingSafeEqual } from "node:crypto";
import { intakeReceiverConfig } from "./client-intake-sheet";

export const INTAKE_RECEIPT_COOKIE = "ixa_client_intake_receipt";
const lifetime = 30 * 60_000;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function signature(body: string): string {
  const secret = intakeReceiverConfig()?.secret;
  if (!secret) throw new Error("receipt_not_configured");
  return createHmac("sha256", secret)
    .update(`ixa-client-intake-receipt-v1:${body}`)
    .digest("base64url");
}
export function createIntakeReceipt(id: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ id, at: now })).toString(
    "base64url",
  );
  return `${body}.${signature(body)}`;
}
export function verifyIntakeReceipt(
  token: string | undefined,
  now = Date.now(),
): { id: string; at: number } | null {
  try {
    if (!token || token.length > 350) return null;
    const [body, signed, extra] = token.split(".");
    if (!body || !signed || extra) return null;
    const expected = Buffer.from(signature(body));
    const actual = Buffer.from(signed);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof data.id === "string" &&
      uuid.test(data.id) &&
      typeof data.at === "number" &&
      data.at <= now + 5000 &&
      now - data.at <= lifetime
      ? data
      : null;
  } catch {
    return null;
  }
}
