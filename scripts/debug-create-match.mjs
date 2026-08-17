import { chromium } from "playwright";
import { existsSync } from "fs";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
page.on("response", (r) => {
  if (r.url().includes("wedstrijden") || r.status() >= 400) {
    console.log("RESP", r.status(), r.url().slice(0, 120));
  }
});

await page.goto(
  "http://localhost:3000/beheer/wedstrijden/nieuw?season=c0ffee00-0002-4000-8000-000000000001",
  { waitUntil: "networkidle", timeout: 90_000 },
);
console.log("url1", page.url());
const stamp = Date.now();
await page.locator('label:has-text("Tegenstander") input').fill(`OWF FourBlock ${stamp}`);
await page.locator('input[type="datetime-local"]').fill("2026-08-23T15:00");
const btn = page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i });
console.log("btn", await btn.count(), "enabled", await btn.isEnabled());
await btn.click();
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  console.log(`t+${i + 1}s`, page.url());
  if (/step=opstelling/.test(page.url())) break;
}
console.log("body slice", (await page.locator("body").innerText()).slice(0, 1000));
await browser.close();
