"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { SubmissionSummary } from "@/lib/storage";

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function AdminDashboard({
  submissions,
}: {
  submissions: SubmissionSummary[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return submissions.filter((item) => {
      const matches =
        !term ||
        [item.name, item.brand, item.email, item.websiteType].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matches && (filter === "All" || item.status === filter);
    });
  }, [submissions, query, filter]);

  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Search size={16} />
          <span className="sr-only">Search leads</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by client, brand, or email"
          />
        </label>
        <div
          className="admin-filters"
          role="group"
          aria-label="Filter submissions"
        >
          {["All", "New"].map((option) => (
            <button
              type="button"
              aria-pressed={filter === option}
              key={option}
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Project</th>
                <th>Budget</th>
                <th>Received</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.email}</span>
                  </td>
                  <td>
                    <strong>{item.brand}</strong>
                    <span>{item.websiteType}</span>
                  </td>
                  <td>{item.budget}</td>
                  <td>{date.format(new Date(item.receivedAt))}</td>
                  <td>
                    <span className="status-pill">{item.status}</span>
                  </td>
                  <td>
                    <a
                      className="open-lead"
                      href={`/admin/submissions/${item.id}`}
                      aria-label={`Open ${item.brand}`}
                    >
                      <ArrowRight size={17} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <span>✳</span>
          <h2>
            {submissions.length
              ? "No matching leads."
              : "Your first brief will appear here."}
          </h2>
          <p>
            {submissions.length
              ? "Try another search or filter."
              : "Once a client submits Project Start, everything will be organized in this dashboard."}
          </p>
        </div>
      )}
    </>
  );
}
