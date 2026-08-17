/**
 * Runtime evidence for real-workflow-integration-recovery.
 * REVIEW_BASE_URL=http://localhost:3020 ADMIN_UI_PREVIEW=1
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.REVIEW_BASE_URL ?? "http://localhost:3020";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "real-workflow-integration-recovery");
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-wedstrijd-nieuw-geen-gasten.png", url: `/review/admin-ui/wedstrijden/nieuw?season=${SEASON}`, w: 1440, h: 900 },
  { name: "02-wedstrijd-nieuw-stappen.png", url: `/review/admin-ui/wedstrijden/nieuw?season=${SEASON}`, w: 1440, h: 900 },
  { name: "03-fitheid-overzicht.png", url: `/review/admin-ui/fitheid?season=${SEASON}`, w: 1440, h: 900 },
  { name: "04-fitheid-nieuw.png", url: `/review/admin-ui/fitheid/nieuw?season=${SEASON}`, w: 1440, h: 800 },
  { name: "05-opstelling-fixture.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1200 },
  { name: "06-wissel-opnieuw.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1200, scroll: "Wisselmoment" },
  { name: "07-positiewijziging.png", url: `/dev/match-ops-admin-fixture`, w: 1440, h: 1200, scroll: "Positiewijziging" },
  { name: "08-reconstructie.png", url: `/dev/match-shape-fixture`, w: 1440, h: 1200 },
  { name: "09-dashboard.png", url: `/review/admin-ui?season=${SEASON}`, w: 1440, h: 900 },
  { name: "10-ranking-geen-gasten.png", url: `/ranking?season=${SEASON}`, w: 1440, h: 900 },
  { name: "11-selectie-geen-gasten.png", url: `/selectie?season=${SEASON}`, w: 1440, h: 900 },
  { name: "12-opstelling-mobile.png", url: `/dev/match-ops-admin-fixture`, w: 390, h: 844 },
  { name: "13-sprint-station-hint.png", url: `/review/admin-ui/fitheid?season=${SEASON}`, w: 390, h: 844 },
];

const browser = await chromium.launch({ headless: true });
const notes = [];

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  try {
    const res = await page.goto(`${BASE}${s.url}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(600);
    if (s.scroll) {
      await page.getByText(s.scroll, { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
    }
    const path = join(OUT, s.name);
    await page.screenshot({ path, fullPage: true });
    const body = await page.locator("body").innerText();
    notes.push({
      file: s.name,
      status: res?.status() ?? null,
      hasEsmee: /Esmee/i.test(body),
      hasMicah: /Micah/i.test(body),
      hasNolita: /Nolita/i.test(body),
      hasGastToevoegen: /Gastspeler toevoegen|Gast aan wedstrijd/i.test(body),
      hasOpstelling: /Opstelling|1-4-2-3-1/i.test(body),
      hasWissel: /Wisselmoment|Wedstrijdverloop/i.test(body),
      hasSprint: /Sprint|Verder met invoeren|Concept aanmaken/i.test(body),
      hasStappen: /Wedstrijd|Selectie|Opstelling/i.test(body),
    });
    console.log("saved", path, res?.status());
  } catch (e) {
    notes.push({ file: s.name, error: String(e) });
    console.error("fail", s.name, e);
  }
  await page.close();
}

await browser.close();
const art = join(process.cwd(), ".review-artifacts", "real-workflow-integration-recovery");
mkdirSync(art, { recursive: true });
writeFileSync(join(art, "runtime-observations.json"), JSON.stringify({ base: BASE, notes }, null, 2));
console.log("done", OUT);
