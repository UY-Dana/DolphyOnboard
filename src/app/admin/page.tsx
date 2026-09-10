import { redirect } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";
import AdminDashboard from "@/components/admin-dashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/storage";
import type { SubmissionSummary } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  let submissions: SubmissionSummary[] = [];
  let databaseError = false;
  try {
    submissions = await listSubmissions();
  } catch {
    databaseError = true;
  }
  const thisMonth = submissions.filter(
    (item) => Date.now() - new Date(item.receivedAt).valueOf() < 30 * 86400000,
  ).length;
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-wordmark" href="/admin">
          DOLPHY
        </a>
        <span>PROJECT ONBOARD</span>
        <form method="post" action="/api/admin/logout">
          <button type="submit">
            Sign out <LogOut size={14} />
          </button>
        </form>
      </header>
      <section className="admin-hero">
        <div>
          <p className="admin-eyebrow">PRIVATE WORKSPACE</p>
          <h1>
            Project leads<span>.</span>
          </h1>
          <p>Every new conversation, collected and ready.</p>
        </div>
        <a href="/" target="_blank">
          View intake <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="admin-stats">
        <div>
          <span>Total briefs</span>
          <strong>{submissions.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>New</span>
          <strong>
            {submissions
              .filter((item) => item.status === "New")
              .length.toString()
              .padStart(2, "0")}
          </strong>
        </div>
        <div>
          <span>Last 30 days</span>
          <strong>{thisMonth.toString().padStart(2, "0")}</strong>
        </div>
      </section>
      <section className="admin-leads">
        <div className="leads-heading">
          <div>
            <p className="admin-eyebrow">INCOMING</p>
            <h2>Client briefs</h2>
          </div>
          <span>
            {submissions.length} submission{submissions.length === 1 ? "" : "s"}
          </span>
        </div>
        {databaseError ? (
          <div className="admin-error database-error">
            <strong>Database connection needed.</strong>
            <br />
            Add the Hostinger MySQL connection string and restart the
            application.
          </div>
        ) : (
          <AdminDashboard submissions={submissions} />
        )}
      </section>
    </main>
  );
}
