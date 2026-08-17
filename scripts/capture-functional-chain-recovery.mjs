/**
 * Runtime evidence — functional-chain-recovery (localhost:3020 + admin auth)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3020";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "functional-chain-recovery");
const ART = join(process.cwd(), ".review-artifacts", "functional-chain-recovery");
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const notes = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: ".review-auth/admin-storage.json",
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

async function shot(name, extra = {}) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  const body = await page.locator("body").innerText().catch(() => "");
  const entry = {
    file: name,
    url: page.url(),
    hasGoalsVoor: /\bGoals voor\b/i.test(body),
    hasGoalsTegen: /\bGoals tegen\b/i.test(body),
    hasInvalidInput: /Invalid input/i.test(body),
    onSelectieStep: /step=selectie/i.test(page.url()),
    onOpstelling: /step=opstelling/i.test(page.url()) || /1-4-2-3-1/i.test(body),
    hasAfronden: /Wedstrijd afronden/i.test(body),
    hasStationNav: /Station ·|Sprint/.test(body) && /Agility/.test(body),
    hasIngevuld: /\d+ van \d+ ingevuld/i.test(body),
    hasOpgeslagen: /Opgeslagen|Wedstrijd gepland/i.test(body),
    ...extra,
  };
  notes.push(entry);
  console.log("✓", name, page.url().replace(BASE, ""));
  return entry;
}

console.log("BASE", BASE);

// --- Wedstrijd ---
await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await shot("01-nieuw-gepland-zonder-scorevelden.png");

const opponent = `Ketenherstel ${Date.now()}`;
await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(opponent);
await page.locator('input[type="datetime-local"]').fill("2026-09-20T15:00");
await shot("02-stap1-ingevuld.png");

await page.getByRole("button", { name: /Opslaan en naar selectie/i }).click();
await page.waitForURL(/\/beheer\/wedstrijden\/(?!nieuw)[^/?]+/, { timeout: 25_000 });
await page.waitForTimeout(800);
await shot("03-save-naar-selectie.png", { saveOk: /step=selectie/i.test(page.url()) });

const matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1];
if (!matchId || matchId === "nieuw") throw new Error("save did not create matchId");

await shot("04-stap-selectie.png");

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=opstelling`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(600);
await shot("05-stap-opstelling.png");

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=wedstrijd`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await shot("06-gepland-zonder-uitslag.png");

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=selectie`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await shot("07-bestaande-wedstrijd.png");

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=uitslag&finish=1`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(700);
await shot("08-wedstrijd-afronden.png");
await shot("09-goals-voor-en-tegen.png");

if (await page.locator('input[name="goals_against"]').count()) {
  await page.locator('input[name="goals_against"]').fill("1");
}
if (await page.locator('input[name="goals_for"]').count()) {
  await page.locator('input[name="goals_for"]').fill("3");
}
await page.waitForTimeout(300);
await shot("10-score-3-1-ingevuld.png");

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=controle`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await shot("11-controle.png");

// --- Fitheid ---
await page.goto(`${BASE}/beheer/fitheid?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
await shot("12-fitheid-klikbare-stations.png");

const sprint = page.locator('a[href*="/station/sprint"]').first();
await sprint.click();
await page.waitForURL(/\/station\//, { timeout: 20_000 });
await page.waitForTimeout(800);
await shot("13-sprint-twintig-speelsters.png");

// Desktop list inputs (mobile one-player inputs are hidden)
const decimals = page.locator("ul input[inputmode='decimal']:visible");
const n = await decimals.count();
if (n > 0) {
  await decimals.nth(0).fill("4,82");
  await decimals.nth(0).press("Enter");
  if (n > 1) await decimals.nth(1).fill("5,14");
  await page.getByRole("button", { name: /Alleen opslaan/i }).click();
  await page.waitForTimeout(2500);
  await shot("14-sprint-waarden.png");
} else {
  notes.push({ warn: "geen zichtbare sprint inputs" });
}

const sessionId = page.url().match(/fitheid\/([^/]+)\/station/)?.[1];
for (const [file, station] of [
  ["15-agility.png", "agility"],
  ["16-plank-min-sec.png", "plank"],
  ["17-zes-minuten.png", "run"],
]) {
  await page.goto(`${BASE}/beheer/fitheid/${sessionId}/station/${station}?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await page.waitForTimeout(400);
  await shot(file);
}

await page.goto(`${BASE}/beheer/fitheid/${sessionId}/controle?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await shot("18-controle.png");

await page.goto(`${BASE}/fitheid?season=${SEASON}`, { waitUntil: "networkidle", timeout: 60_000 });
await shot("20-publieke-fitheid.png");
await page.goto(`${BASE}/ranking?season=${SEASON}`, { waitUntil: "networkidle", timeout: 60_000 });
await shot("21-ranking.png");
const profile = page.locator('a[href*="/selectie/"]').first();
if (await profile.count()) {
  await profile.click();
  await page.waitForTimeout(600);
  await shot("22-spelersprofiel.png");
}

await browser.close();
writeFileSync(join(ART, "runtime-observations.json"), JSON.stringify({ base: BASE, matchId, sessionId, consoleErrors, notes }, null, 2));
console.log("done", OUT, "matchId", matchId, "sessionId", sessionId);
