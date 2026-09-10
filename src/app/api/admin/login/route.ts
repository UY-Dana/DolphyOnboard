import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; expires: number }>();

export async function POST(request: Request) {
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("origin") !== expected)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.expires < now) attempts.delete(key);
  const bucket = attempts.get(ip) || {
    count: 0,
    expires: now + 15 * 60 * 1000,
  };
  bucket.count += 1;
  attempts.set(ip, bucket);
  if (bucket.count > 8)
    return NextResponse.redirect(
      new URL("/admin/login?error=locked", expected),
      303,
    );

  const form = await request.formData();
  const username = String(form.get("username") || "").slice(0, 100);
  const password = String(form.get("password") || "").slice(0, 300);
  let valid = false;
  try {
    valid = verifyAdminCredentials(username, password);
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?error=setup", expected),
      303,
    );
  }
  if (!valid)
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid", expected),
      303,
    );

  attempts.delete(ip);
  const response = NextResponse.redirect(new URL("/admin", expected), 303);
  response.cookies.set(
    ADMIN_COOKIE,
    createAdminSession(),
    adminCookieOptions(),
  );
  return response;
}
