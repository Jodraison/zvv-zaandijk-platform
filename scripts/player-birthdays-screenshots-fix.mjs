import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const JELISA = "f1000001-0000-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "player-birthdays");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 1100 },
});
const page = await ctx.newPage();
const shot = async (n) => {
  await page.screenshot({ path: join(OUT, `${n}.png`), fullPage: false });
  console.log("saved", n);
};

// 15 — Jelisa met volledige datum (na restore)
await page.goto(`${BASE}/beheer/spelers?filter=active&player=${JELISA}&season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
const editBirth = page.locator('input[name="birth_date"]').first();
await editBirth.scrollIntoViewIfNeeded();
const val = await editBirth.inputValue();
console.log("jelisa value", val);
if (val !== "2006-08-01") {
  await editBirth.fill("2006-08-01");
  await page.locator("form").filter({ has: editBirth }).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/beheer/spelers?filter=active&player=${JELISA}&season=${SEASON}`, {
    waitUntil: "networkidle",
  });
  await page.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
}
await shot("15-jelisa-admin-date");

// 14 — cleared state (zonder DB leeg te laten): vul leeg, screenshot, herstel direct
await page.locator('input[name="birth_date"]').first().fill("");
await shot("14-birth-date-cleared");
await page.locator('input[name="birth_date"]').first().fill("2006-08-01");

// 13 — invalid future (client-visible): vul toekomst, submit, screenshot, herstel
await page.locator('input[name="birth_date"]').first().fill("2099-01-01");
await page.locator("form").filter({ has: page.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
await page.waitForTimeout(1200);
await page.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
await shot("13-birth-date-validation");
await page.locator('input[name="birth_date"]').first().fill("2006-08-01");
await page.locator("form").filter({ has: page.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
await page.waitForTimeout(1000);

// 12 — create form birth field
await page.goto(`${BASE}/beheer/spelers?filter=active&season=${SEASON}`, { waitUntil: "networkidle" });
await page.locator("details#speler-toevoegen").evaluate((el) => {
  el.open = true;
});
await page.waitForTimeout(300);
const createBirth = page.locator("#speler-toevoegen input[name='birth_date']").first();
console.log("create count", await createBirth.count());
await createBirth.scrollIntoViewIfNeeded();
await shot("12-create-player-birth-date");

// missing filter evidence
await page.goto(`${BASE}/beheer/spelers?filter=birthdate&season=${SEASON}`, { waitUntil: "networkidle" });
await shot("16-naomi-missing-date");
await shot("17-mariska-missing-date");

await browser.close();
console.log("done fix");
