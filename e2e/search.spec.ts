import { test, expect } from "@playwright/test";
import { USER, PASSWORD, login, trackProblems } from "./helpers";

// Read-only: runs searches with default/minimal filters, never changes data.
test.describe("search screens", () => {
  test.skip(!USER || !PASSWORD, "set E2E_USER and E2E_PASSWORD in .env.test");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("process search returns a result list without errors", async ({ page }) => {
    const problems = trackProblems(page);
    await page.goto("/view-processes");
    await page.getByRole("button", { name: "בצע חיפוש" }).click();
    await page.waitForLoadState("networkidle");

    // the results header is rendered with a count (0 is fine for the default one-day range)
    await expect(page.getByText(/תוצאות \(\d+\)/)).toBeVisible({ timeout: 15_000 });
    expect(await problems()).toEqual([]);
  });

  // Known request in the test environment (created 2026-02-16). If it is purged/changed, update this id.
  const KNOWN_REQUEST_ID = "NPPRMI260216000272094";

  test("process search by known request id shows that request", async ({ page }) => {
    const problems = trackProblems(page);
    await page.goto("/view-processes");
    await page.getByPlaceholder("NP...").fill(KNOWN_REQUEST_ID);
    // The default range is today only. The date inputs have no placeholder attribute, so
    // locate them by dir=ltr (order: from-date, from-time, to-date, to-time). Use fill(), not typing:
    // typing char-by-char makes react-datepicker parse partial years (e.g. 01/03/0002).
    const fromDate = page.locator("input[dir=ltr]").first();
    await fromDate.fill("01/02/2026");
    await fromDate.press("Tab");
    await page.getByRole("button", { name: "בצע חיפוש" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("תוצאות (1)")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("cell", { name: KNOWN_REQUEST_ID })).toBeVisible();
    expect(await problems()).toEqual([]);
  });

  test("process search rejects a malformed request id", async ({ page }) => {
    await page.goto("/view-processes");
    await page.getByPlaceholder("NP...").fill("abc");
    await page.getByRole("button", { name: "בצע חיפוש" }).click();
    await expect(page.getByText("מזהה בקשה חייב להתחיל ב-NP")).toBeVisible();
  });

  test("event search requires a criterion, then searches", async ({ page }) => {
    const problems = trackProblems(page);
    await page.goto("/GetEventList");

    await page.getByRole("button", { name: "חיפוש", exact: true }).click();
    await expect(page.getByText("יש לבחור לפחות קריטריון אחד")).toBeVisible();

    const severity = page.locator("select").last();
    const value = await severity.locator("option:not([value=''])").first().getAttribute("value");
    await severity.selectOption(value!);
    await page.getByRole("button", { name: "חיפוש", exact: true }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("יש לבחור לפחות קריטריון אחד")).toBeHidden();
    expect(await problems()).toEqual([]);
  });
});
