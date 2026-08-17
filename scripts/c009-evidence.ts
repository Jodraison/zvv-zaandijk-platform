/**
 * C-009 end-to-end player journey evidence.
 * Run: npx tsx scripts/c009-evidence.ts
 * Requires: npm run dev (default http://localhost:3003)
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.C009_BASE_URL ?? "http://localhost:3003";
const OUT = path.resolve("docs/football-decision-lab/reviews/phase-c/evidence/c009");
const KEY = "fdl-progress-v1";
const GS = "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1";
const GS_SLUG = "binnenkant-dicht-rw";

fs.mkdirSync(OUT, { recursive: true });

type Meta = Record<string, unknown>;
const shots: Meta[] = [];
const consoleErrors: string[] = [];

async function clear(page: Page) {
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
}

async function shot(page: Page, file: string, meta: Meta) {
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, fullPage: false });
  const cta = await page
    .locator("[data-testid='academy-primary-cta'], [data-testid='hub-primary-cta'], [data-testid='lesson-continue'], [data-testid='lesson-next-cta']")
    .first()
    .innerText()
    .catch(() => "");
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return { overflow: d.scrollWidth > d.clientWidth + 1, w: d.clientWidth, h: d.clientHeight };
  });
  const progress = await page.evaluate((k) => localStorage.getItem(k), KEY);
  shots.push({ file, cta: cta.replace(/\s+/g, " ").trim(), ...meta, ...overflow, progress });
  console.log("shot", file);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // —— Desktop journey ——
  await page.setViewportSize({ width: 1440, height: 900 });
  await clear(page);
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-first-use']");
  await shot(page, "01-academy-untouched.png", {
    stage: "academy-untouched",
    viewport: "1440x900",
    state: "untouched",
  });

  await page.getByRole("button", { name: "Onze opstelling" }).click();
  await page.waitForTimeout(400);
  await shot(page, "02-formation-base.png", { stage: "formation-base", viewport: "1440x900" });

  await page.getByRole("button", { name: "Wedstrijdsituatie" }).click();
  await page.waitForTimeout(400);
  await shot(page, "03-formation-context.png", { stage: "formation-context", viewport: "1440x900" });

  await page.getByRole("button", { name: "Jouw moment" }).click();
  await page.waitForTimeout(400);
  await shot(page, "04-formation-decision.png", { stage: "formation-decision", viewport: "1440x900" });

  await page.locator("[data-testid='academy-primary-cta']").click();
  await page.waitForURL(`**/academie/decision-lab/${GS_SLUG}`);
  await page.waitForSelector("[data-testid='lesson-experience']");
  await shot(page, "05-golden-view.png", { stage: "lesson-view", viewport: "1440x900" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-stage-scan']");
  await shot(page, "06-golden-scan.png", { stage: "lesson-scan", viewport: "1440x900" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-stage-decide']");
  await shot(page, "07-decision-freeze.png", { stage: "lesson-decide", viewport: "1440x900" });

  // Choose wrong first (A often wrong) — pick by testid; prefer incorrect if possible
  const choiceB = page.locator("[data-testid='choice-B']");
  await choiceB.click();
  await page.waitForSelector("[data-testid='consequence-panel']", { timeout: 8000 });
  await shot(page, "08-consequence.png", { stage: "lesson-consequence", viewport: "1440x900" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-stage-understand']");
  await page.getByRole("button", { name: /Vergelijk FOUT/ }).click().catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "09-understand-compare.png", { stage: "lesson-understand", viewport: "1440x900" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-complete']");
  await shot(page, "10-completion.png", { stage: "lesson-complete", viewport: "1440x900" });

  const progressAfter = await page.evaluate((k) => localStorage.getItem(k), KEY);
  const parsed = progressAfter ? JSON.parse(progressAfter) : {};
  const gsDone = parsed[GS]?.status === "completed";

  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-returning'], [data-testid='academy-first-use']");
  await shot(page, "11-academy-after-complete.png", {
    stage: "academy-after",
    viewport: "1440x900",
    gsCompleted: gsDone,
  });

  await page.locator("[data-testid='academy-primary-cta']").click();
  await page.waitForTimeout(800);
  await shot(page, "12-next-session-started.png", { stage: "next-session", viewport: "1440x900" });

  // Hub
  await page.goto(`${BASE}/academie/decision-lab`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='decision-lab-hub']");
  await shot(page, "13-decision-lab-hub.png", { stage: "hub", viewport: "1440x900" });

  // —— Mobile journey ——
  await clear(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-first-use']");
  await shot(page, "14-mobile-untouched.png", { stage: "mobile-untouched", viewport: "390x844" });
  const expand = page.getByRole("button", { name: "Vergroot veld" });
  if (await expand.count()) {
    await expand.click();
    await page.waitForTimeout(400);
    await shot(page, "15-mobile-expanded-pitch.png", { stage: "mobile-expand", viewport: "390x844" });
    await page.getByRole("button", { name: "Sluiten" }).click().catch(() => {});
  }
  await page.locator("[data-testid='academy-primary-cta']").click();
  await page.waitForSelector("[data-testid='lesson-experience']");
  await shot(page, "16-mobile-lesson.png", { stage: "mobile-lesson", viewport: "390x844" });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await shot(page, "17-mobile-360.png", { stage: "mobile-360", viewport: "360x800" });

  await context.tracing.stop({ path: path.join(OUT, "trace.zip") });

  const summary = {
    base: BASE,
    gsCompletedPersisted: gsDone,
    consoleErrors: consoleErrors.filter((e) => !/fonts\.googleapis|Failed to load resource/i.test(e)),
    shots,
    gates: {
      untouchedStart: shots.some((s) => s.stage === "academy-untouched" && /Start eerste/i.test(String(s.cta))),
      completionPersisted: gsDone,
      noOverflowDesktop: shots
        .filter((s) => String(s.viewport).startsWith("1440"))
        .every((s) => s.overflow === false),
      noOverflowMobile: shots
        .filter((s) => String(s.viewport).startsWith("390") || String(s.viewport).startsWith("360"))
        .every((s) => s.overflow === false),
    },
  };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.gates, null, 2));
  await browser.close();
  if (!summary.gates.untouchedStart || !summary.gates.completionPersisted) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
