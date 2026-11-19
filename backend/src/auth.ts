import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "./db.js";
import { ApiError } from "./errors.js";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "ballotveyra_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  const secret = process.env.VOTER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("VOTER_SESSION_SECRET must contain at least 32 characters");
  }
  return secret;
}

export async function hashPassword(password: string) {
  if (password.length < 12) throw new ApiError(400, "VALIDATION_ERROR", "Password must be at least 12 characters");
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function registerAccount(input: { firstName: string; lastName: string; email: string; password: string }) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  if (!firstName || !lastName) throw new ApiError(400, "VALIDATION_ERROR", "First and last name are required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "VALIDATION_ERROR", "A valid email address is required");

  const passwordHash = await hashPassword(input.password);
  const existing = await prisma.organizerProfile.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "CONFLICT", "An account with this email already exists");

  const account = await prisma.organizerProfile.create({
    data: { email, firstName, lastName, passwordHash, emailVerified: true },
  });
  return account;
}

export async function loginAccount(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) throw new ApiError(400, "VALIDATION_ERROR", "Email and password are required");
  const account = await prisma.organizerProfile.findUnique({ where: { email } });
  if (!account?.passwordHash || !(await verifyPassword(input.password, account.passwordHash))) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
  }
  return account;
}

export function createSessionCookie(account: { id: string; email: string }) {
  const payload = Buffer.from(JSON.stringify({ id: account.id, email: account.email, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const cookieValue = `${payload}.${signature}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${cookieValue}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionCookie(cookieHeader?: string) {
  if (!cookieHeader) return null;
  const cookie = cookieHeader.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  const value = cookie.slice(SESSION_COOKIE.length + 1);
  const separator = value.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { id: string; email: string; exp: number };
    if (!session.id || !session.email || session.exp <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAccountFromRequest(cookieHeader?: string) {
  const session = readSessionCookie(cookieHeader);
  if (!session) return null;
  return prisma.organizerProfile.findUnique({ where: { id: session.id } });
}

export function publicAccount(account: { id: string; email: string; firstName: string | null; lastName: string | null; emailVerified: boolean }) {
  return { id: account.id, email: account.email, firstName: account.firstName, lastName: account.lastName, emailVerified: account.emailVerified };
}
