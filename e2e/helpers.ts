import { expect, Page } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");

export const USER = process.env.E2E_USER;
export const PASSWORD = process.env.E2E_PASSWORD;

export async function login(page: Page) {
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

/** Collects page errors and failed /api calls; call `problems()` at the end of a test. */
export function trackProblems(page: Page) {
  const list: string[] = [];
  page.on("pageerror", (e) => list.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) list.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return async () => {
    const toasts = await page.locator("[data-sonner-toast][data-type=error]").allInnerTexts();
    return [...list, ...toasts.map((t) => `error toast: ${t}`)];
  };
}
