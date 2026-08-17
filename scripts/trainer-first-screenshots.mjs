/**
 * Screenshots for trainer-first operations recovery.
 * Run: node scripts/trainer-first-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/trainer-first-operations-recovery";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const q = `?season=${encodeURIComponent(SEASON)}`;

if (!existsSync(AUTH)) {
  console.error("Missing auth — run node --env-file=.env.local scripts/final-ops-auth-state.mjs");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

async function shot(name, url, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  else await page.setViewportSize({ width: 1440, height: 900 });
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(900);
  const status = res?.status() ?? 0;
  const pathOnly = new URL(page.url()).pathname;
  const ok = status < 400 && !pathOnly.includes("/login");
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(JSON.stringify({ name, pathOnly, status, ok }));
  if (!ok) throw new Error(`Failed ${name}`);
}

await shot("01-beheer", `${BASE}/beheer${q}`);
await shot("02-uitslag", `${BASE}/beheer/taken/uitslag${q}`);
await shot("03-training-afgelasten", `${BASE}/beheer/taken/training-afgelasten${q}`);
await shot("04-spelers", `${BASE}/beheer/spelers${q}`);
await shot("05-uit-selectie", `${BASE}/beheer/taken/uit-selectie${q}`);
await shot("06-rugnummer", `${BASE}/beheer/taken/rugnummer${q}`);
await shot("07-beheer-fitheid", `${BASE}/beheer/fitheid${q}`);
await shot("08-fitheid-public", `${BASE}/fitheid${q}`);
await shot("09-beheer-mobile", `${BASE}/beheer${q}`, { width: 390, height: 844 });
await shot("10-fitheid-mobile", `${BASE}/fitheid${q}`, { width: 390, height: 844 });
await shot("11-taken-mobile", `${BASE}/beheer/taken/uit-selectie${q}`, { width: 390, height: 844 });

await browser.close();
console.log(JSON.stringify({ consoleErrors: consoleErrors.slice(0, 20), out: OUT }));
