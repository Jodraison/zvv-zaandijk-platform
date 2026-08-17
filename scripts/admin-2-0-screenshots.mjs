/**
 * Admin 2.0 runtime screenshot capture via public review gallery (same UI as /beheer).
 * Run against local next start: ADMIN20_BASE_URL=http://127.0.0.1:4312 npx tsx scripts/admin-2-0-screenshots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.ADMIN20_BASE_URL || "http://127.0.0.1:4312";
const outDir = path.resolve(".review-screenshots/admin-2-0");
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { name: "01-dashboard-desktop", url: "/review/admin-ui", w: 1440, h: 900 },
  { name: "02-dashboard-mobile", url: "/review/admin-ui", w: 390, h: 844 },
  { name: "03-wedstrijden", url: "/review/admin-ui/wedstrijden", w: 1440, h: 900 },
  { name: "04-wedstrijd-editor-stap1", url: "/review/admin-ui/wedstrijden/nieuw", w: 1440, h: 1100 },
  { name: "05-spelers", url: "/review/admin-ui/spelers", w: 1440, h: 900 },
  { name: "06-training-desktop", url: "/review/admin-ui/training", w: 1440, h: 900 },
  { name: "07-training-mobile", url: "/review/admin-ui/training", w: 390, h: 844 },
  { name: "08-fitheid", url: "/review/admin-ui/fitheid", w: 1440, h: 900 },
  { name: "09-public-wedstrijden", url: "/wedstrijden", w: 1440, h: 900 },
  { name: "10-public-ranking", url: "/ranking", w: 1440, h: 900 },
  { name: "11-public-statistieken", url: "/statistieken", w: 1440, h: 900 },
  { name: "12-dashboard-tablet", url: "/review/admin-ui", w: 768, h: 1024 },
];

const browser = await chromium.launch({ headless: true });
const report = [];

for (const s of shots) {
  const context = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const target = `${base}${s.url}`;
  try {
    const res = await page.goto(target, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(500);
    const file = path.join(outDir, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.push({ ...s, file, status: `${res?.status() ?? "?"} → ${page.url()}` });
    console.log("saved", file);
  } catch (e) {
    report.push({ ...s, error: String(e), status: "fail" });
    console.error("fail", s.name, e);
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, "evidence-report.json"), JSON.stringify(report, null, 2));
console.log("done", outDir);
