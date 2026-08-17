/**
 * Runtime evidence screenshots for public-football-product-recovery.
 * Usage: node scripts/capture-public-football-product-screens.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.REVIEW_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const NAOMI = "f1000002-0000-4000-8000-000000000002";
const OUT = join(process.cwd(), ".review-screenshots", "public-football-product-recovery");
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-selectie-desktop.png", url: `/selectie?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "02-selectie-mobile.png", url: `/selectie?season=${SEASON}`, w: 390, h: 844, full: true },
  { name: "03-naomi-profiel-cb.png", url: `/selectie/${NAOMI}?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "04-ranking-empty-wedstrijd.png", url: `/ranking?season=${SEASON}&view=wedstrijd`, w: 1440, h: 900, full: true },
  { name: "05-ranking-podium-fixture.png", url: `/dev/ranking-podium-fixture`, w: 1440, h: 900, full: true },
  { name: "06-fitheid-desktop.png", url: `/fitheid?season=${SEASON}`, w: 1440, h: 900, full: true },
  { name: "07-fitheid-mobile.png", url: `/fitheid?season=${SEASON}`, w: 390, h: 844, full: true },
  { name: "08-beheer-spelers-login-gate.png", url: `/beheer/spelers?season=${SEASON}&filter=active`, w: 1440, h: 900, full: true },
  { name: "09-profile-completeness-fixture.png", url: `/dev/profile-completeness-fixture`, w: 1440, h: 900, full: true },
  { name: "10-ranking-no-databron.png", url: `/ranking?season=${SEASON}&view=wedstrijd`, w: 1440, h: 900, full: true },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const notes = [];

for (const s of shots) {
  await page.setViewportSize({ width: s.w, height: s.h });
  const res = await page.goto(`${BASE}${s.url}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const path = join(OUT, s.name);
  await page.screenshot({ path, fullPage: s.full });
  const bodyText = await page.locator("body").innerText();
  const consoleErrors = [];
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, overflowX: doc.scrollWidth > doc.clientWidth + 2 };
  });
  notes.push({
    file: s.name,
    url: s.url,
    status: res?.status() ?? null,
    hasDatabron: /Databron/i.test(bodyText),
    hasDisputes: /\bDisputes\b/i.test(bodyText),
    hasPAC: /\bPAC\b/.test(bodyText),
    hasEmptyRanking: /Nog geen wedstrijdklassement/i.test(bodyText),
    hasNaomiCB: /Naomi[\s\S]{0,80}CB|\bCB\b[\s\S]{0,40}Naomi/i.test(bodyText) || (s.name.includes("naomi") && /\bCB\b/.test(bodyText)),
    hasProfielIncompleetGeneric: /Profiel incompleet/i.test(bodyText),
    overflowX: overflow.overflowX,
  });
  console.log("saved", path, "status", res?.status());
}

await browser.close();
const artifact = join(process.cwd(), ".review-artifacts", "public-football-product-recovery", "runtime-observations.json");
mkdirSync(join(process.cwd(), ".review-artifacts", "public-football-product-recovery"), { recursive: true });
await import("fs").then((fs) => fs.writeFileSync(artifact, JSON.stringify({ base: BASE, notes }, null, 2)));
console.log("observations", artifact);
