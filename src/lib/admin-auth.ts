import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const adminCookieName = "ixa_admin_session";
export const adminSessionMaxAge = 60 * 60 * 12;

function adminPasswordRecord(): string {
  return process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
}

function adminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
}

export function isAdminConfigured(): boolean {
  const [salt, passwordHash] = adminPasswordRecord().split(":");
  return Boolean(
    salt &&
      passwordHash &&
      /^[0-9a-f]+$/i.test(salt) &&
      /^[0-9a-f]{128}$/i.test(passwordHash) &&
      adminSessionSecret(),
  );
}

function expectedSessionToken(): string {
  const passwordRecord = adminPasswordRecord();
  const secret = adminSessionSecret();
  if (!passwordRecord || !secret) return "";

  return createHmac("sha256", secret)
    .update(`ixa-admin-session-v1:${passwordRecord}`)
    .digest("base64url");
}

function equalStrings(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(candidate: string): boolean {
  const [salt, expectedHash] = adminPasswordRecord().split(":");
  if (
    !salt ||
    !expectedHash ||
    !/^[0-9a-f]+$/i.test(salt) ||
    !/^[0-9a-f]{128}$/i.test(expectedHash)
  ) {
    return false;
  }

  const candidateHash = scryptSync(candidate, Buffer.from(salt, "hex"), 64);
  return equalStrings(candidateHash.toString("hex"), expectedHash);
}

export function createAdminSessionToken(): string {
  return expectedSessionToken();
}

export function verifyAdminSession(candidate?: string): boolean {
  const expected = expectedSessionToken();
  if (!candidate || !expected) return false;
  return equalStrings(candidate, expected);
}
