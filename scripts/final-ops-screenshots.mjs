/**
 * Real-route screenshots for final football operations certification.
 * Requires .review-auth/admin-storage.json and npm run dev on :3000.
 *
 * Run: node scripts/final-ops-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/final-football-operations";
const AUTH = ".review-auth/admin-storage.json";
const SESSION_A = "a0000001-0000-4000-8000-0000000000a1";
const SESSION_B = "a0000001-0000-4000-8000-0000000000b2";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const q = `?season=${encodeURIComponent(SEASON)}`;

if (!existsSync(AUTH)) {
  console.error("Missing auth storage — run scripts/final-ops-auth-state.mjs first");
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
  await page.waitForTimeout(900);
  const status = res?.status() ?? 0;
  const pathOnly = new URL(page.url()).pathname;
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(JSON.stringify({ name, url: pathOnly, status, ok: status < 400 && !pathOnly.includes("/login") }));
}

await shot("01-beheer-dashboard", `${BASE}/beheer${q}`);
await shot("02-beheer-wedstrijden", `${BASE}/beheer/wedstrijden${q}`);
await shot("03-beheer-wedstrijd-toevoegen", `${BASE}/beheer/wedstrijd-toevoegen${q}`);
await shot("04-beheer-spelers", `${BASE}/beheer/spelers${q}`);
await shot("05-beheer-training", `${BASE}/beheer/training${q}`);
await shot("06-beheer-seizoenen", `${BASE}/beheer/seizoenen`);
await shot("07-beheer-fitheid", `${BASE}/beheer/fitheid${q}`);
await shot("08-fitheid-testdag-b", `${BASE}/beheer/fitheid/${SESSION_B}${q}`);
await shot("09-station-sprint", `${BASE}/beheer/fitheid/${SESSION_B}/station/sprint${q}`);
await shot("10-station-agility", `${BASE}/beheer/fitheid/${SESSION_B}/station/agility${q}`);
await shot("11-station-plank", `${BASE}/beheer/fitheid/${SESSION_B}/station/plank${q}`);
await shot("12-station-run", `${BASE}/beheer/fitheid/${SESSION_B}/station/run${q}`);
await shot("13-fitheid-controle", `${BASE}/beheer/fitheid/${SESSION_B}/controle${q}`);
await shot("14-fitheid-resultaten", `${BASE}/beheer/fitheid/${SESSION_B}/resultaten${q}`);
await shot("15-beheer-mobile-dashboard", `${BASE}/beheer${q}`, { width: 390, height: 844 });
await shot("16-station-mobile-sprint", `${BASE}/beheer/fitheid/${SESSION_B}/station/sprint${q}`, {
  width: 390,
  height: 844,
});

await shot("17-ranking-wedstrijd", `${BASE}/ranking${q}&view=wedstrijd`);
await shot("18-ranking-fitheid-actueel", `${BASE}/ranking${q}&view=fitheid`);
await shot("19-ranking-historie-a", `${BASE}/ranking${q}&view=historie&session=${SESSION_A}`);
await shot("20-ranking-historie-b", `${BASE}/ranking${q}&view=historie&session=${SESSION_B}`);
await shot("21-ranking-seizoen", `${BASE}/ranking${q}&view=seizoen`);
await shot("22-homepage", `${BASE}/${q}`);

await browser.close();
console.log("screenshots done", OUT);
