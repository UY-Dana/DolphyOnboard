import { test, expect } from "@playwright/test";
import { initialBrief } from "../../src/lib/schema";
process.loadEnvFile(".env.local");
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
test("budget is optional and older drafts do not imply a new amount", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(
    (brief) =>
      localStorage.setItem(
        "dolphy-project-start-v1",
        JSON.stringify({
          brief: {
            ...brief,
            name: "Alex",
            email: "alex@example.com",
            brand: "Example",
            websiteType: "Brand Website",
            features: ["Contact Us"],
            size: "1–5",
            timeline: "ASAP",
            budget: "$1,000–$2,500",
          },
          step: 5,
          savedAt: Date.now(),
          id: "0daa4b88-b11b-4303-86ca-eb7a82e7bc23",
        }),
      ),
    initialBrief,
  );
  await page.reload();
  await page.getByRole("button", { name: "Continue your project" }).click();
  await expect(
    page.getByRole("heading", {
      name: "What budget feels comfortable? (optional)",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "budget" })
      .locator('[aria-pressed="true"]'),
  ).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-budget.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Review your brief" }).click();
  await expect(
    page.getByRole("heading", { name: "Looks good?" }),
  ).toBeVisible();
  await expect(page.locator(".review-section").last()).toContainText(
    "Let’s discuss",
  );
});
test("complete guided brief, validation, reload, review editing, retry and cleanup", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Let’s shape/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-welcome.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Start Project", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".error-summary")).toContainText(
    "Please enter your name",
  );
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill("alex@example.com");
  await page.getByLabel("Brand / business name").fill("Example Studio");
  await page.getByLabel("City + country").fill("New York, United States");
  await page.reload();
  await page.getByRole("button", { name: "Continue your project" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Morgan");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Online Store Sell/ }).click();
  await page.getByRole("button", { name: "Buy Products", exact: true }).click();
  await page.getByRole("button", { name: "Other", exact: true }).click();
  await page.getByLabel("What else should people").fill("Gift wrapping");
  await page.getByRole("button", { name: "1–5", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Minimal", exact: false }).click();
  await page.getByRole("button", { name: "Luxury", exact: false }).click();
  await page.getByRole("button", { name: "Bold", exact: false }).click();
  await expect(
    page.getByRole("button", { name: "Clean", exact: false }),
  ).toBeDisabled();
  await page.getByLabel("Reference 1").fill("https://example.com");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-direction.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Logo", exact: true }).first().click();
  await page.getByRole("button", { name: "Nothing Yet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Logo", exact: true }).first(),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Website Design", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "1–2 Months", exact: true }).click();
  await page
    .getByRole("button", { name: "$1,000–$2,000", exact: true })
    .click();
  await page.getByRole("button", { name: "Review your brief" }).click();
  await expect(page.getByText("Gift wrapping")).toBeVisible();
  await page
    .getByRole("button", { name: "Edit", exact: false })
    .first()
    .click();
  await page.getByLabel("Brand / business name").fill("Example Studio Updated");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Review your brief" }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-review.png`,
    fullPage: true,
  });
  let attempts = 0;
  await page.route("**/api/submit", async (route) => {
    attempts++;
    const body = route.request().postDataJSON();
    expect(body.brand).toBe("Example Studio Updated");
    await route.fulfill({
      status: attempts === 1 ? 502 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        attempts === 1 ? { error: "Please try again." } : { success: true },
      ),
    });
  });
  await page.getByRole("button", { name: "Send Project Brief" }).click();
  await expect(page.locator(".error-summary")).toContainText(
    "Please try again",
  );
  await page.getByRole("button", { name: "Send Project Brief" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re all set." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("dolphy-project-start-v1")),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
});
test("real API refuses unconfigured submissions and cross-origin requests", async ({
  request,
}) => {
  const badOrigin = await request.post("/api/submit", {
    headers: { origin: "https://wrong.example" },
    data: {},
  });
  expect(badOrigin.status()).toBe(403);
  const invalid = await request.post("/api/submit", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(invalid.status()).toBe(400);
  const unavailable = await request.post("/api/submit", {
    headers: { origin: "http://localhost:3000" },
    data: {
      ...initialBrief,
      name: "Test Client",
      email: "test@example.com",
      brand: "Test Brand",
      websiteType: "Brand Website",
      features: ["Contact Us"],
      size: "1–5",
      timeline: "ASAP",
      budget: "Let’s discuss",
      honeypot: "",
      submissionId: "24543e71-dcd7-4327-b54a-37045c620d00",
    },
  });
  expect(unavailable.status()).toBe(503);
  expect((await unavailable.json()).error).toContain("aren’t open yet");
});

test("small screens and keyboard navigation remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page
    .getByRole("button", { name: "Start Project", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "First, a little about you." }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Full name")).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("admin dashboard is protected, signs in, and signs out", async ({
  page,
}, testInfo) => {
  if (!adminPassword) throw new Error("E2E_ADMIN_PASSWORD is not configured");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "Project leads." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(adminPassword);
  await page.getByLabel("Username").fill("dolphyadmin");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: /Enter dashboard/ }).click();
  await expect(page.locator(".admin-error")).toContainText("incorrect");
  await page.getByLabel("Username").fill("dolphyadmin");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: /Enter dashboard/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Project leads." }),
  ).toBeVisible();
  await expect(page.getByText("Database connection needed.")).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-admin.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin login rejects cross-origin form posts", async ({ request }) => {
  const response = await request.post("/api/admin/login", {
    headers: { origin: "https://wrong.example" },
    form: { username: "dolphyadmin", password: "redacted-test-value" },
  });
  expect(response.status()).toBe(403);
});
