/**
 * Real-route screenshots for Season 2026/27 Reality Reset.
 * Requires .review-auth/admin-storage.json and npm run dev on :3000.
 *
 * Run: node scripts/season-reality-reset-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/season-2026-27-reality-reset";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const q = `?season=${encodeURIComponent(SEASON)}`;

if (!existsSync(AUTH)) {
  console.error("Missing auth storage — run: node --env-file=.env.local scripts/final-ops-auth-state.mjs");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: AUTH,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

async function shot(name, url, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  else await page.setViewportSize({ width: 1440, height: 900 });
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1000);
  const status = res?.status() ?? 0;
  const pathOnly = new URL(page.url()).pathname;
  const ok = status < 400 && !pathOnly.includes("/login");
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(JSON.stringify({ name, url: pathOnly, status, ok }));
  if (!ok) throw new Error(`Screenshot failed auth/route: ${name} → ${pathOnly} (${status})`);
}

await shot("01-beheer-countdowns", `${BASE}/beheer${q}`);
await shot("02-beheer-milestones", `${BASE}/beheer${q}`);
await shot("03-beheer-training", `${BASE}/beheer/training${q}`);
await shot("04-beheer-fitheid", `${BASE}/beheer/fitheid${q}`);
await shot("05-beheer-fitheid-nieuw", `${BASE}/beheer/fitheid/nieuw${q}`);
await shot("06-ranking-fitness-current", `${BASE}/ranking${q}&view=fitheid`);
await shot("07-ranking-fitness-history", `${BASE}/ranking${q}&view=historie`);
await shot("08-ranking-season", `${BASE}/ranking${q}&view=seizoen`);
await shot("09-homepage", `${BASE}/${q}`);
await shot("10-beheer-mobile", `${BASE}/beheer${q}`, { width: 390, height: 844 });
await shot("11-training-mobile", `${BASE}/beheer/training${q}`, { width: 390, height: 844 });
await shot("12-fitheid-mobile", `${BASE}/beheer/fitheid${q}`, { width: 390, height: 844 });

await browser.close();
console.log("screenshots done", OUT);
