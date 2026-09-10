import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { Brief } from "./schema";

export type SubmissionSummary = {
  id: number;
  submissionId: string;
  receivedAt: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  websiteType: string;
  timeline: string;
  budget: string;
  status: string;
};

export type StoredSubmission = SubmissionSummary & { brief: Brief };

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: databaseUrl(),
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 20,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: "Z",
    });
  }
  return pool;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .execute(
        `
        CREATE TABLE IF NOT EXISTS project_submissions (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          submission_id CHAR(36) NOT NULL,
          received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          client_name VARCHAR(300) NOT NULL,
          email VARCHAR(300) NOT NULL,
          phone VARCHAR(300) NOT NULL DEFAULT '',
          brand_name VARCHAR(300) NOT NULL,
          website_type VARCHAR(100) NOT NULL,
          timeline VARCHAR(100) NOT NULL,
          budget VARCHAR(100) NOT NULL DEFAULT 'Let''s discuss',
          status VARCHAR(32) NOT NULL DEFAULT 'New',
          brief_json LONGTEXT NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY submission_id_unique (submission_id),
          KEY received_at_index (received_at),
          KEY status_index (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      )
      .then(() => undefined)
      .catch((error) => {
        schemaReady = undefined;
        throw error;
      });
  }
  return schemaReady;
}

function normalizeDate(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf())
    ? new Date().toISOString()
    : date.toISOString();
}

function rowToSummary(row: RowDataPacket): SubmissionSummary {
  return {
    id: Number(row.id),
    submissionId: String(row.submission_id),
    receivedAt: normalizeDate(row.received_at),
    name: String(row.client_name),
    email: String(row.email),
    phone: String(row.phone || ""),
    brand: String(row.brand_name),
    websiteType: String(row.website_type),
    timeline: String(row.timeline),
    budget: String(row.budget),
    status: String(row.status),
  };
}

export async function saveSubmission(brief: Brief, submissionId: string) {
  await ensureSchema();
  const budget = brief.budget || "Let’s discuss";
  await getPool().execute(
    `INSERT INTO project_submissions
      (submission_id, client_name, email, phone, brand_name, website_type, timeline, budget, brief_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE submission_id = VALUES(submission_id)`,
    [
      submissionId,
      brief.name,
      brief.email,
      brief.phone,
      brief.brand,
      brief.websiteType,
      brief.timeline,
      budget,
      JSON.stringify(brief),
    ],
  );
}

export async function listSubmissions(): Promise<SubmissionSummary[]> {
  await ensureSchema();
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT id, submission_id, received_at, client_name, email, phone, brand_name, website_type, timeline, budget, status FROM project_submissions ORDER BY received_at DESC LIMIT 500",
  );
  return rows.map(rowToSummary);
}

export async function getSubmission(
  id: number,
): Promise<StoredSubmission | null> {
  await ensureSchema();
  const [rows] = await getPool().execute<RowDataPacket[]>(
    "SELECT id, submission_id, received_at, client_name, email, phone, brand_name, website_type, timeline, budget, status, brief_json FROM project_submissions WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows[0]) return null;
  return {
    ...rowToSummary(rows[0]),
    brief: JSON.parse(String(rows[0].brief_json)) as Brief,
  };
}

export function resetStorageForTests() {
  pool = undefined;
  schemaReady = undefined;
}

export function setStoragePoolForTests(value: Pool) {
  pool = value;
  schemaReady = undefined;
}
