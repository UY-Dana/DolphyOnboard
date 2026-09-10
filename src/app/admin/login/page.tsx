import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { error } = await searchParams;
  const message =
    error === "locked"
      ? "Too many attempts. Try again in 15 minutes."
      : error === "setup"
        ? "Admin access is not configured on this server yet."
        : error
          ? "That username or password is incorrect."
          : "";
  return (
    <main className="admin-login">
      <a className="admin-wordmark" href="/">
        DOLPHY
      </a>
      <section className="login-card">
        <span className="login-icon">
          <LockKeyhole size={21} />
        </span>
        <p className="admin-eyebrow">PRIVATE WORKSPACE</p>
        <h1>Project leads.</h1>
        <p className="login-intro">
          Sign in to review new briefs and prepare for your next conversation.
        </p>
        {message && (
          <p className="admin-error" role="alert">
            {message}
          </p>
        )}
        <form method="post" action="/api/admin/login">
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">
            Enter dashboard <ArrowRight size={17} />
          </button>
        </form>
        <a className="back-site" href="/">
          <ArrowLeft size={14} /> Back to Project Start
        </a>
      </section>
      <p className="admin-foot">DOLPHY · PROJECT ONBOARD</p>
    </main>
  );
}
