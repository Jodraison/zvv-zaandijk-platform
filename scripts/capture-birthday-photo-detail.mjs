import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), ".review-screenshots", "birthday-hero-spotlight-upgrade");
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
await page.goto(
  "http://localhost:3000/?season=c0ffee00-0002-4000-8000-000000000001&vandaag=2026-08-01",
  { waitUntil: "networkidle", timeout: 90_000 },
);
const loc = page
  .locator('[data-testid="birthday-hero-spotlight"]')
  .locator("visible=true")
  .first()
  .locator("[data-birthday-portrait]")
  .first();
await loc.waitFor({ state: "visible" });
const box = await loc.boundingBox();
if (!box) throw new Error("no box");
await page.screenshot({
  path: join(OUT, "05-photo-detail.png"),
  clip: {
    x: Math.max(0, box.x - 40),
    y: Math.max(0, box.y - 40),
    width: Math.min(520, box.width + 220),
    height: Math.min(520, box.height + 200),
  },
});
console.log("saved 05-photo-detail", box);
await browser.close();
