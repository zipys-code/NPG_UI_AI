import { test, expect, Page } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");

const USER = process.env.E2E_USER;
const PASSWORD = process.env.E2E_PASSWORD;

// Read-only screens only: the test never clicks save / delete / add.
const ROUTES = [
  "/",
  "/view-processes",
  "/manage-processes",
  "/calendar",
  "/dnRouteNumbers",
  "/NumberingPlan",
  "/GetEventList",
  "/GetMessages",
  "/NumberInquiry",
  "/HousekeepingScheduler",
  "/OperatorManagement",
  "/NPGControlTower",
  "/SummaryActivities",
  "/CodeTables",
];

async function login(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("שם משתמש").fill(USER!);
  await page.getByPlaceholder("סיסמה").fill(PASSWORD!);
  const domain = page.locator("select");
  if (await domain.count()) {
    const value = await domain.locator("option:not([value=''])").first().getAttribute("value");
    if (value) await domain.selectOption(value);
  }
  await page.locator("button[type=submit]").click();
  await expect(page.getByPlaceholder("שם משתמש")).toBeHidden();
}

test.describe("smoke: screens load", () => {
  test.skip(!USER || !PASSWORD, "set E2E_USER and E2E_PASSWORD in .env.test");

  test("login and open every screen", async ({ page }) => {
    const problems: string[] = [];
    let current = "login";
    page.on("pageerror", (e) => problems.push(`[${current}] pageerror: ${e.message}`));
    page.on("response", (r) => {
      if (r.url().includes("/api/") && r.status() >= 400) problems.push(`[${current}] HTTP ${r.status()} ${r.url()}`);
    });

    await login(page);

    for (const route of ROUTES) {
      current = route;
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page.getByText("404")).toHaveCount(0);
      const errToasts = await page.locator("[data-sonner-toast][data-type=error]").allInnerTexts();
      errToasts.forEach((t) => problems.push(`[${route}] error toast: ${t}`));
    }

    expect(problems).toEqual([]);
  });
});
