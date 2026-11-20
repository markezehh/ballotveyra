import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../auth.js";

function resetSecret() {
  return process.env.PASSWORD_RESET_SECRET || process.env.VOTER_SESSION_SECRET;
}

function apiError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function createPasswordResetToken(account) {
  const secret = resetSecret();
  if (!secret || secret.length < 32) throw new Error("PASSWORD_RESET_SECRET or VOTER_SESSION_SECRET must contain at least 32 characters");
  const payload = Buffer.from(JSON.stringify({
    id: account.id,
    email: account.email,
    exp: Date.now() + 30 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readPasswordResetToken(token) {
  const secret = resetSecret();
  if (!secret || typeof token !== "string") return null;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const supplied = Buffer.from(signature);
  const validSignature = Buffer.from(expected);
  if (supplied.length !== validSignature.length || !timingSafeEqual(supplied, validSignature)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || !data.email || data.exp <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function requestPasswordReset(email) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const account = await prisma.organizerProfile.findUnique({ where: { email: normalizedEmail } });

  // Never reveal whether an account exists. In production, send this token by email.
  if (!account) return { ok: true };
  const token = createPasswordResetToken(account);
  return process.env.NODE_ENV === "production"
    ? { ok: true }
    : { ok: true, resetToken: token, resetUrl: `/reset-password?token=${encodeURIComponent(token)}` };
}

export async function resetPassword(token, password, confirmPassword) {
  if (password !== confirmPassword) throw apiError(422, "VALIDATION_ERROR", "Passwords do not match");
  const data = readPasswordResetToken(token);
  if (!data) throw apiError(400, "VALIDATION_ERROR", "This reset link is invalid or has expired");
  if (String(password).length < 12) throw apiError(422, "VALIDATION_ERROR", "Password must be at least 12 characters");

  const passwordHash = await hashPassword(password);
  const account = await prisma.organizerProfile.findUnique({ where: { id: data.id } });
  if (!account || account.email !== data.email) throw apiError(400, "VALIDATION_ERROR", "This reset link is invalid or has expired");
  await prisma.organizerProfile.update({
    where: { id: account.id },
    data: { passwordHash },
  });
  return { ok: true };
}
