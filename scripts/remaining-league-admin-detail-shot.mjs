import { chromium } from "playwright";
import { join } from "node:path";

const ADMIN = process.env.ADMIN_BASE_URL ?? "http://localhost:3013";
const OUT = ".review-screenshots/remaining-league-program-2026-27";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const FUTURE_ID = "adc6e3fb-7fcd-4360-8f35-4a97824a503e";

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);
const context = await browser.newContext({
  storageState: AUTH,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
await page.goto(`${ADMIN}/beheer/wedstrijden?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(600);
const href = page.locator(`a[href*="${FUTURE_ID}"]`).first();
if (await href.count()) {
  await href.click();
  await page.waitForTimeout(1200);
} else {
  await page.goto(`${ADMIN}/beheer/wedstrijden/${FUTURE_ID}?season=${SEASON}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(1500);
}
const pathOnly = new URL(page.url()).pathname;
const body = await page.locator("body").innerText();
if (pathOnly.includes("/login") || /Beheerderslogin|Inloggen/.test(body.slice(0, 400))) {
  await page.screenshot({ path: join(OUT, "07-login-fail.png"), fullPage: true });
  throw new Error(`still login path=${pathOnly}`);
}
await page.screenshot({ path: join(OUT, "07-toekomst-zonder-opstelling.png"), fullPage: true });
console.log(JSON.stringify({ url: page.url(), pathOnly, head: body.slice(0, 240) }));
await browser.close();
