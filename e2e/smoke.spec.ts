import { test, expect } from "@playwright/test";
import { USER, PASSWORD, login } from "./helpers";

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

test.describe("smoke: screens load", () => {
  test.skip(!USER || !PASSWORD, "set E2E_USER and E2E_PASSWORD in .env.test");

  test("login and open every screen", async ({ page }) => {
    // 14 screens, each waiting for network idle: takes ~45-60 s alone and more when run in parallel
    // (every request now also runs the server-side session check), so the default 60 s is too tight.
    test.setTimeout(150_000);
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
