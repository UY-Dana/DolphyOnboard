import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSubmission } from "@/lib/storage";

export const dynamic = "force-dynamic";

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="brief-group">
      <h2>{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  let submission;
  try {
    submission = await getSubmission(id);
  } catch {
    return (
      <main className="admin-shell">
        <p className="admin-error">The database could not be reached.</p>
      </main>
    );
  }
  if (!submission) notFound();
  const b = submission.brief;
  return (
    <main className="admin-shell brief-page">
      <header className="admin-header">
        <a className="admin-wordmark" href="/admin">
          DOLPHY
        </a>
        <span>PROJECT ONBOARD</span>
        <a className="return-admin" href="/admin">
          <ArrowLeft size={14} /> All briefs
        </a>
      </header>
      <div className="brief-top">
        <div>
          <p className="admin-eyebrow">
            PROJECT BRIEF · #{String(submission.id).padStart(4, "0")}
          </p>
          <h1>{b.brand}</h1>
          <p>
            Submitted by {b.name} ·{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(new Date(submission.receivedAt))}
          </p>
        </div>
        <div className="brief-actions">
          <a href={`mailto:${b.email}`}>
            <Mail size={15} /> Email client
          </a>
          {b.phone && (
            <a
              href={`https://wa.me/${b.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="brief-grid">
        <Group title="01 / Client & brand">
          <Detail label="Client" value={b.name} />
          <Detail label="Email" value={b.email} />
          <Detail label="Phone / WhatsApp" value={b.phone} />
          <Detail label="Location" value={b.location} />
          <Detail label="Brand" value={b.brand} />
          <Detail label="Industry" value={b.industry.join(", ")} />
          <Detail label="Brand description" value={b.description} />
          {b.website && (
            <div>
              <dt>Website</dt>
              <dd>
                <a href={b.website} target="_blank" rel="noreferrer">
                  {b.website} <ExternalLink size={12} />
                </a>
              </dd>
            </div>
          )}
          {b.social && (
            <div>
              <dt>Social</dt>
              <dd>
                <a href={b.social} target="_blank" rel="noreferrer">
                  {b.social} <ExternalLink size={12} />
                </a>
              </dd>
            </div>
          )}
        </Group>
        <Group title="02 / Website">
          <Detail label="Website type" value={b.websiteType} />
          <Detail
            label="Required features"
            value={[
              ...b.features,
              b.features.includes("Other") ? b.otherFeature : "",
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <Detail label="Approximate size" value={b.size} />
        </Group>
        <Group title="03 / Direction">
          <Detail
            label="Creative direction"
            value={b.moods.join(", ") || "Open to direction"}
          />
          <Detail
            label="References"
            value={b.references.filter(Boolean).join("\n")}
          />
          <Detail label="Please avoid" value={b.avoid} />
        </Group>
        <Group title="04 / Assets & support">
          <Detail
            label="Already ready"
            value={b.assets.join(", ") || "Not specified"}
          />
          <Detail
            label="DOLPHY help requested"
            value={b.services.join(", ") || "Not specified"}
          />
        </Group>
        <Group title="05 / Project">
          <Detail label="Timeline" value={b.timeline} />
          <Detail label="Budget" value={b.budget || "Let’s discuss"} />
          <Detail label="Additional notes" value={b.notes} />
        </Group>
      </div>
    </main>
  );
}
