import { test } from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import {
  initialBrief,
  submissionSchema,
  validateStep,
} from "../src/lib/schema";
import type { Pool } from "mysql2/promise";
import {
  createAdminSession,
  verifyAdminCredentials,
  verifyAdminSession,
} from "../src/lib/admin-auth";
import {
  getSubmission,
  listSubmissions,
  saveSubmission,
  setStoragePoolForTests,
} from "../src/lib/storage";
test("budget can be skipped without creating a false monetary commitment", () => {
  assert.equal(
    submissionSchema.safeParse({ ...valid, budget: "" }).success,
    true,
  );
  assert.equal(
    submissionSchema.safeParse({ ...valid, budget: "$1,000–$2,500" }).success,
    false,
  );
});
const valid = {
  ...initialBrief,
  name: "Alex Morgan",
  email: "alex@example.com",
  brand: "Example Studio",
  websiteType: "Online Store",
  features: ["Buy Products"],
  size: "1–5",
  timeline: "1–2 Months",
  budget: "$1,000–$2,000",
  honeypot: "",
  submissionId: "61cf34ba-0fc6-4f41-af1e-afcebf48512e",
};
test("valid brief passes; required contact and enum fields are enforced", () => {
  assert.equal(submissionSchema.safeParse(valid).success, true);
  assert.equal(
    submissionSchema.safeParse({
      ...valid,
      email: "wrong",
      websiteType: "Injected",
    }).success,
    false,
  );
  assert.ok(validateStep(initialBrief, 1).name);
});
test("mood cap, exclusive assets, hidden field and URL protocols are enforced server-side", () => {
  for (const change of [
    { moods: ["Minimal", "Luxury", "Bold", "Clean"] },
    { assets: ["Nothing Yet", "Logo"] },
    { honeypot: "spam" },
    { website: "javascript:alert(1)" },
    { features: ["Other"], otherFeature: "" },
    { references: ["https://good.com", "not-a-url", ""] },
  ])
    assert.equal(
      submissionSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});
test("admin credentials and signed sessions reject tampering", () => {
  process.env.ADMIN_USERNAME = "dolphyadmin";
  process.env.ADMIN_PASSWORD_SALT = "unit-test-salt";
  process.env.ADMIN_PASSWORD_HASH = scryptSync(
    "test-admin-password",
    "unit-test-salt",
    64,
  ).toString("hex");
  assert.equal(
    verifyAdminCredentials("dolphyadmin", "test-admin-password"),
    true,
  );
  assert.equal(verifyAdminCredentials("dolphyadmin", "wrong"), false);
  const token = createAdminSession();
  assert.equal(verifyAdminSession(token), true);
  assert.equal(verifyAdminSession(`${token}x`), false);
});

test("dashboard storage creates the table, saves full briefs, lists and reads them", async () => {
  const now = new Date("2026-09-10T12:00:00Z");
  let inserted: unknown[] = [];
  const fakePool = {
    execute: async (sql: string, values?: unknown[]) => {
      if (sql.includes("CREATE TABLE")) return [{ affectedRows: 0 }];
      if (sql.includes("INSERT INTO")) {
        inserted = values || [];
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("brief_json"))
        return [
          [
            {
              id: 1,
              submission_id: valid.submissionId,
              received_at: now,
              client_name: valid.name,
              email: valid.email,
              phone: valid.phone,
              brand_name: valid.brand,
              website_type: valid.websiteType,
              timeline: valid.timeline,
              budget: valid.budget,
              status: "New",
              brief_json: inserted[8],
            },
          ],
        ];
      throw new Error("Unexpected execute");
    },
    query: async () => [
      [
        {
          id: 1,
          submission_id: valid.submissionId,
          received_at: now,
          client_name: valid.name,
          email: valid.email,
          phone: valid.phone,
          brand_name: valid.brand,
          website_type: valid.websiteType,
          timeline: valid.timeline,
          budget: valid.budget,
          status: "New",
        },
      ],
    ],
  } as unknown as Pool;
  setStoragePoolForTests(fakePool);
  await saveSubmission(valid, valid.submissionId);
  assert.equal(JSON.parse(String(inserted[8])).brand, "Example Studio");
  assert.equal((await listSubmissions())[0].email, "alex@example.com");
  assert.equal((await getSubmission(1))?.brief.features[0], "Buy Products");
});
