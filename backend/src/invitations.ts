import { createHmac, randomBytes } from "node:crypto";

export type InviteKeyring = Record<number, string>;

export function parseInviteKeyring(raw: string | undefined): InviteKeyring {
  const keyring: InviteKeyring = {};
  for (const entry of (raw ?? "").split(",")) {
    const separator = entry.indexOf(":");
    if (separator < 1) continue;
    const version = Number(entry.slice(0, separator));
    const secret = entry.slice(separator + 1);
    if (Number.isInteger(version) && version > 0 && secret.length >= 32) keyring[version] = secret;
  }
  return keyring;
}

export function createRawInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function digestInviteToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function escapeCsvField(value: string): string {
  let escaped = value.replaceAll('"', '""');
  if (/^[=+\-@\t\r]/.test(escaped)) escaped = `'${escaped}`;
  return `"${escaped}"`;
}

export function invitationUrl(appOrigin: string, slug: string, token: string): string {
  return `${appOrigin.replace(/\/$/, "")}/vote/${encodeURIComponent(slug)}#token=${token}`;
}
