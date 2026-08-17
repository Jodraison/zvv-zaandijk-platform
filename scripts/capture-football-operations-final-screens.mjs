/**
 * Runtime evidence for final-football-operations-completion.
 * REVIEW_BASE_URL=http://localhost:3000 node scripts/capture-football-operations-final-screens.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.REVIEW_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const NAOMI = "f1000002-0000-4000-8000-000000000002";
const OUT = join(process.cwd(), ".review-screenshots", "final-football-operations-completion");
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-dashboard-desktop.png", url: `/review/admin-ui?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "02-dashboard-mobile.png", url: `/review/admin-ui?season=${SEASON}`, w: 390, h: 844, full: true },
  { name: "03-training-aug17-gepland.png", url: `/review/admin-ui/training?season=${SEASON}&session=2026-08-17`, w: 1440, h: 900, full: true },
  { name: "04-training-aug17-mobile.png", url: `/review/admin-ui/training?season=${SEASON}&session=2026-08-17`, w: 390, h: 844, full: true },
  { name: "05-beheer-opstelling.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1100, full: true },
  { name: "06-beheer-wissel.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1100, full: true, scroll: "Wissels" },
  { name: "07-beheer-positiewijziging.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1100, full: true, scroll: "Positiewijzigingen" },
  { name: "08-wedstrijd-start.png", url: `/dev/match-shape-fixture`, w: 1440, h: 1100, full: true },
  { name: "09-wedstrijd-tijdlijn.png", url: `/dev/match-shape-fixture`, w: 1440, h: 1100, full: true, scroll: "Wijzigingen" },
  { name: "10-wedstrijd-eind.png", url: `/dev/match-shape-fixture`, w: 1440, h: 1100, full: true, scroll: "Eind" },
  { name: "11-profiel-licht-desktop.png", url: `/selectie/${NAOMI}?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "12-profiel-licht-mobile.png", url: `/selectie/${NAOMI}?season=${SEASON}`, w: 390, h: 844, full: true },
  { name: "13-profiel-geen-toekomst-aanwezigheid.png", url: `/selectie/${NAOMI}?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "14-reconstructie-fixture.png", url: `/dev/match-shape-fixture`, w: 1440, h: 1200, full: true },
  { name: "15-beheer-dashboard-live.png", url: `/beheer?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "16-beheer-training-live.png", url: `/beheer/training?season=${SEASON}&session=2026-08-17`, w: 1440, h: 900, full: true },
];

const browser = await chromium.launch({ headless: true });
const notes = [];

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  try {
    const res = await page.goto(`${BASE}${s.url}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(700);
    if (s.scroll) {
      const loc = page.getByText(s.scroll, { exact: false }).first();
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(300);
    }
    const path = join(OUT, s.name);
    await page.screenshot({ path, fullPage: s.full });
    const bodyText = await page.locator("body").innerText();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { overflowX: doc.scrollWidth > doc.clientWidth + 2 };
    });
    notes.push({
      file: s.name,
      url: s.url,
      status: res?.status() ?? null,
      hasGepland: /Gepland/i.test(bodyText),
      hasGeweest: /\bGeweest\b/i.test(bodyText),
      hasGeverifieerd: /Geverifieerd/i.test(bodyText),
      has2020: /20\s*\/\s*20/.test(bodyText),
      has100pct: /100\s*%/.test(bodyText),
      hasHierRegel: /Hier regel je je team/i.test(bodyText),
      hasOpstelling: /Opstelling|1-4-2-3-1/i.test(bodyText),
      overflowX: overflow.overflowX,
      consoleErrors: consoleErrors.slice(0, 8),
    });
    console.log("saved", path, "status", res?.status());
  } catch (e) {
    notes.push({ file: s.name, url: s.url, error: String(e) });
    console.error("fail", s.name, e);
  }
  await page.close();
}

await browser.close();
const artifactDir = join(process.cwd(), ".review-artifacts", "final-football-operations-completion");
mkdirSync(artifactDir, { recursive: true });
writeFileSync(join(artifactDir, "runtime-observations.json"), JSON.stringify({ base: BASE, notes }, null, 2));
console.log("done", OUT);
