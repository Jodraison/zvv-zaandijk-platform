/**
 * Runtime evidence — matchday-reality-public-final
 * Creates temporary visual fixtures only when needed; always cleans up in finally.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3020";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "matchday-reality-public-final");
const ART = join(process.cwd(), ".review-artifacts", "matchday-reality-public-final");
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const notes = [];
let createdMatchId = null;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

async function shot(name, extra = {}) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  const body = await page.locator("body").innerText().catch(() => "");
  notes.push({ file: name, url: page.url(), snippet: body.slice(0, 400), ...extra });
  console.log("✓", name);
}

try {
  // Before-state inventory artifact (classification already in backups)
  if (existsSync(".review-backups/matchday-reality-public-final/test-match-classification.json")) {
    copyFileSync(
      ".review-backups/matchday-reality-public-final/test-match-classification.json",
      join(ART, "01-inventory.json"),
    );
  }

  await page.goto(`${BASE}/wedstrijden?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  await shot("03-programma-na-cleanup.png");

  await page.goto(`${BASE}/?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  await shot("04-homepage-zonder-zcfc.png");

  await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("05-beheer-zonder-qa.png");

  // Empty / countdown states on public pages
  await page.goto(`${BASE}/?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  await shot("06-empty-of-countdown-home.png");

  // Create temporary match for formation + countdown visuals, then delete
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const stamp = Date.now();
  const opponent = `QA Capture ${stamp}`;
  await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(opponent);
  // Kickoff ~18h ahead so countdown shows hours
  const kick = new Date(Date.now() + 18 * 60 * 60 * 1000);
  const local = `${kick.getFullYear()}-${String(kick.getMonth() + 1).padStart(2, "0")}-${String(kick.getDate()).padStart(2, "0")}T${String(kick.getHours()).padStart(2, "0")}:${String(kick.getMinutes()).padStart(2, "0")}`;
  await page.locator('input[type="datetime-local"]').fill(local);
  await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
  await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
  createdMatchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1] ?? null;
  await page.waitForTimeout(600);
  await shot("11-beheer-opstelling-horizontaal.png");

  // Fill a few slots to show horizontal lines
  for (const label of [/GK: leeg/i, /LB: leeg/i, /LCB: leeg/i, /RCB: leeg/i, /RB: leeg/i]) {
    const btn = page.getByRole("button", { name: label });
    if (await btn.count()) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(250);
      const pick = page.locator('[role="dialog"] button').filter({ hasText: /#\d+/ }).first();
      if (await pick.count()) await pick.click({ force: true });
      await page.waitForTimeout(150);
    }
  }
  await shot("11b-defensie-horizontaal.png");

  if (createdMatchId) {
    await page.goto(`${BASE}/wedstrijden/${createdMatchId}?season=${SEASON}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("08-detail-countdown.png");
    await shot("12-publieke-grote-opstelling.png");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  if (createdMatchId) {
    await page.goto(`${BASE}/wedstrijden/${createdMatchId}?season=${SEASON}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("10-mobiel-countdown.png");
    await shot("14-mobiel-veld.png");
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("16-beheer-verwijderen-link.png");
} finally {
  if (createdMatchId) {
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}/beheer/wedstrijden/${createdMatchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.first().click();
        await page.waitForTimeout(300);
        await page.getByRole("button", { name: /^Verwijderen$/i }).click();
        await page.waitForTimeout(1200);
        await shot("19-succes-na-delete.png");
      }
    } catch (e) {
      console.error("cleanup delete failed", e);
      notes.push({ cleanupError: String(e), createdMatchId });
    }
  }
  writeFileSync(join(ART, "capture-notes.json"), JSON.stringify(notes, null, 2));
  await browser.close();
  console.log("done", { createdMatchId, cleaned: !!createdMatchId });
}
