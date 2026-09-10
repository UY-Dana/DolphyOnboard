import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "dolphy_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function configuredUsername() {
  return process.env.ADMIN_USERNAME || "dolphyadmin";
}

function sessionSecret() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const salt = process.env.ADMIN_PASSWORD_SALT;
  if (!hash || !salt) throw new Error("Admin credentials are not configured");
  return `${hash}:${salt}`;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function passwordDigest(password: string) {
  const salt = process.env.ADMIN_PASSWORD_SALT;
  if (!salt) throw new Error("ADMIN_PASSWORD_SALT is not configured");
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedHash) throw new Error("ADMIN_PASSWORD_HASH is not configured");
  return (
    safeEqual(username, configuredUsername()) &&
    safeEqual(passwordDigest(password), expectedHash)
  );
}

export function createAdminSession() {
  const payload = Buffer.from(
    JSON.stringify({
      user: configuredUsername(),
      expires: Date.now() + SESSION_SECONDS * 1000,
      nonce: randomBytes(12).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = createHmac("sha256", sessionSecret())
      .update(payload)
      .digest("base64url");
    if (!safeEqual(signature, expected)) return false;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { user: string; expires: number };
    return data.user === configuredUsername() && data.expires > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: (process.env.APP_ORIGIN || "").startsWith("https://"),
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
