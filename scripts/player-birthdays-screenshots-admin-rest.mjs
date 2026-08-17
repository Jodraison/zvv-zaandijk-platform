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

async function shot(n) {
  await page.screenshot({ path: join(OUT, `${n}.png`), fullPage: false });
  console.log("saved", n);
}

await page.goto(`${BASE}/beheer/spelers?filter=active&player=${JELISA}&season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(600);
const bodyText = await page.locator("body").innerText();
console.log("Geboortedatum in page?", bodyText.includes("Geboortedatum"));
const count = await page.locator('input[name="birth_date"]').count();
console.log("input count", count);
if (count === 0) {
  // dump snippet
  const labels = await page.locator("label").allTextContents();
  console.log("labels", labels.slice(0, 30));
}
const editBirth = page.locator('input[name="birth_date"]').first();
if (count) {
  await editBirth.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}
await shot("11-edit-player-birth-date");

if (count) {
  await editBirth.fill("2099-01-01");
  await page.locator('form').filter({ has: editBirth }).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1200);
  await page.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await shot("13-birth-date-validation");

  await page.locator('input[name="birth_date"]').first().fill("");
  await page.locator('form').filter({ has: page.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await shot("14-birth-date-cleared");

  await page.locator('input[name="birth_date"]').first().fill("2006-08-01");
  await page.locator('form').filter({ has: page.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await shot("15-jelisa-admin-date");
}

await page.goto(`${BASE}/beheer/spelers?filter=active&season=${SEASON}#speler-toevoegen`, {
  waitUntil: "networkidle",
});
await page.locator("details#speler-toevoegen").evaluate((el) => {
  el.open = true;
});
await page.waitForTimeout(300);
const createInput = page.locator('form').filter({ hasText: "Nieuwe speelster" }).locator('input[name="birth_date"]');
const createCount = await createInput.count();
console.log("create birth count", createCount);
if (createCount) {
  await createInput.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}
await shot("12-create-player-birth-date");

await page.goto(`${BASE}/beheer/spelers?filter=birthdate&season=${SEASON}`, {
  waitUntil: "networkidle",
});
await shot("10-players-missing-birthday-filter");
await shot("16-naomi-missing-date");
await shot("17-mariska-missing-date");

await page.goto(`${BASE}/beheer?season=${SEASON}`, { waitUntil: "networkidle" });
const card = page.locator('[data-testid="upcoming-birthdays"]');
await card.scrollIntoViewIfNeeded();
await shot("08-dashboard-upcoming-birthdays");
await shot("09-dashboard-jelisa-tomorrow");

await browser.close();
console.log("done");
