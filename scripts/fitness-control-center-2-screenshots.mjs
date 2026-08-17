/**
 * Fitness Control Center 2.0 screenshots.
 * Prefer real /beheer when ADMIN_UI_PREVIEW=1; else /review/admin-ui/*.
 *
 * ADMIN20_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/fitness-control-center-2-screenshots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.ADMIN20_BASE_URL || "http://127.0.0.1:3000";
const outDir = path.resolve(".review-screenshots/fitness-control-center-2");
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { name: "01-fitheid-overzicht-desktop", url: "/review/admin-ui/fitheid", w: 1440, h: 1000 },
  { name: "02-fitheid-nieuw", url: "/review/admin-ui/fitheid/nieuw", w: 1440, h: 900 },
  { name: "03-fitheid-invoer-onderdeel", url: "/review/admin-ui/fitheid-invoer", w: 1440, h: 1100 },
  { name: "04-fitheid-invoer-mobile", url: "/review/admin-ui/fitheid-invoer", w: 390, h: 844 },
  { name: "05-dashboard", url: "/review/admin-ui", w: 1440, h: 1000 },
  { name: "06-spelers-overzicht", url: "/review/admin-ui/spelers", w: 1440, h: 1000 },
  { name: "07-training", url: "/review/admin-ui/training", w: 1440, h: 1000 },
  { name: "08-fitheid-legacy", url: "/review/admin-ui/fitheid/legacy", w: 1440, h: 1000 },
  { name: "09-fitheid-tablet", url: "/review/admin-ui/fitheid", w: 768, h: 1024 },
  { name: "10-beheer-fitheid-route", url: "/beheer/fitheid", w: 1440, h: 900 },
];

const browser = await chromium.launch({ headless: true });
const report = [];

for (const s of shots) {
  const context = await browser.newContext({ viewport: { width: s.w, height: s.h } });
  const page = await context.newPage();
  try {
    const res = await page.goto(`${base}${s.url}`, { waitUntil: "networkidle", timeout: 60000 });
    if (s.name.includes("invoer-onderdeel")) {
      await page.getByRole("tab", { name: "Per speelster" }).click().catch(() => {});
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, "03b-fitheid-invoer-speelster.png"), fullPage: true });
      await page.getByRole("tab", { name: "Per onderdeel" }).click().catch(() => {});
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(400);
    const file = path.join(outDir, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.push({ ...s, file, status: `${res?.status()} → ${page.url()}` });
    console.log("saved", file);
  } catch (e) {
    report.push({ ...s, error: String(e) });
    console.error("fail", s.name, e);
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, "evidence-report.json"), JSON.stringify(report, null, 2));
console.log("done", outDir);
