/**
 * Runtime evidence — match-workflow-product-ux-final
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3020";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "match-workflow-product-ux-final");
const ART = join(process.cwd(), ".review-artifacts", "match-workflow-product-ux-final");
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const notes = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: ".review-auth/admin-storage.json",
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

async function shot(name, extra = {}) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  const body = await page.locator("body").innerText().catch(() => "");
  notes.push({
    file: name,
    url: page.url(),
    hasFourSteps: /Wedstrijd/.test(body) && /Opstelling/.test(body) && /Na de wedstrijd/.test(body),
    hasVerloop: /\bVerloop\b/.test(body),
    hasSelectieStep: /Opstelling & selectie/.test(body),
    hasPitch: /1-4-2-3-1|LCB|GK/.test(body),
    hasEindstand: /Eindstand/.test(body),
    ...extra,
  });
  console.log("✓", name);
}

console.log("BASE", BASE);
await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
await shot("01-vier-stappenflow.png");
await shot("02-stap-wedstrijd.png");

const opponent = `QA Workflow ${Date.now()}`;
let matchId = null;
try {
  await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(opponent);
  await page.locator('input[type="datetime-local"]').fill("2026-10-05T15:00");
  await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
  await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
  await page.waitForTimeout(800);
  await shot("03-redirect-opstelling.png");
  await shot("04-opstelling-leeg.png");

  // Open picker on GK
  await page.getByRole("button", { name: /GK: leeg/i }).click();
  await page.waitForTimeout(400);
  await shot("05-picker-rugnummer.png");
  // Pick first player
  await page.locator('[role="dialog"] button').filter({ hasText: /#\d+/ }).first().click();
  await page.waitForTimeout(300);
  await shot("06-professioneel-veld.png");

  // Assign a few more via picker quickly is heavy — mark remaining as bank/absent for visual
  const unassigned = page.locator("text=Nog indelen").locator("..").locator("button:has-text('Bank')");
  const n = await unassigned.count();
  for (let i = 0; i < Math.min(n, 8); i++) {
    await unassigned.nth(0).click();
    await page.waitForTimeout(50);
  }
  await shot("08-bank.png");
  const absentBtns = page.locator("text=Nog indelen").locator("..").locator("button:has-text('Afwezig')");
  const na = await absentBtns.count();
  for (let i = 0; i < Math.min(na, 5); i++) {
    await absentBtns.nth(0).click();
    await page.waitForTimeout(50);
  }
  await shot("09-afwezig.png");
  await shot("10-gast-ingeklapt.png");

  matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1];
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("12-na-de-wedstrijd-later.png");

  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await page.waitForTimeout(700);
  await shot("13-afrondmodus.png");
  await shot("14-eindstandkaart.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=opstelling`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("20-mobiel-opstelling.png");
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("21-mobiel-afronden.png");
} finally {
  if (matchId) {
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.first().click();
        await page.waitForTimeout(300);
        await page.getByRole("button", { name: /^Verwijderen$/i }).click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.error("fixture cleanup failed", e);
    }
  }
  await browser.close();
  writeFileSync(join(ART, "runtime-observations.json"), JSON.stringify({ base: BASE, matchId, notes }, null, 2));
  console.log("done", OUT);
}
