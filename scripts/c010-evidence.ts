/**
 * C-010 release evidence — clean E2E across desktop + mobile viewports.
 * Run: npx tsx scripts/c010-evidence.ts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.C010_BASE_URL ?? "http://localhost:3003";
const OUT = path.resolve("docs/football-decision-lab/reviews/phase-c/evidence/c010");
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
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  const cta = await page
    .locator(
      "[data-testid='academy-primary-cta'], [data-testid='hub-primary-cta'], [data-testid='lesson-continue'], [data-testid='lesson-next-cta']",
    )
    .first()
    .innerText()
    .catch(() => "");
  const metrics = await page.evaluate(() => {
    const d = document.documentElement;
    const targets = [...document.querySelectorAll("button, a[href]")].slice(0, 40);
    const small = targets.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).length;
    return {
      overflow: d.scrollWidth > d.clientWidth + 1,
      w: d.clientWidth,
      h: d.clientHeight,
      smallTouchApprox: small,
    };
  });
  const progress = await page.evaluate((k) => localStorage.getItem(k), KEY);
  shots.push({
    file,
    cta: cta.replace(/\s+/g, " ").trim(),
    ...meta,
    ...metrics,
    progressSnippet: progress?.slice(0, 180) ?? null,
  });
  console.log("shot", file);
}

async function journey(page: Page, viewport: string, prefix: string) {
  await clear(page);
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-first-use']");
  await shot(page, `${prefix}-01-untouched.png`, {
    viewport,
    page: "academy",
    state: "untouched",
    stage: "home",
  });

  await page.getByRole("button", { name: "Basis 4-2-3-1" }).click();
  await page.waitForTimeout(350);
  await shot(page, `${prefix}-02-base.png`, { viewport, stage: "transform-base" });

  await page.getByRole("button", { name: "Trigger" }).click();
  await page.waitForTimeout(350);
  await shot(page, `${prefix}-03-trigger.png`, { viewport, stage: "transform-trigger" });

  await page.getByRole("button", { name: "Pressvorm" }).click();
  await page.waitForTimeout(350);
  await shot(page, `${prefix}-04-press.png`, { viewport, stage: "transform-press" });

  if (viewport.startsWith("390") || viewport.startsWith("360") || viewport.startsWith("320")) {
    const expand = page.getByRole("button", { name: /Bekijk volledige opstelling|Vergroot/i });
    if (await expand.count()) {
      await expand.first().click();
      await page.waitForSelector("[data-testid='pitch-fullscreen']");
      await shot(page, `${prefix}-04b-fullscreen.png`, { viewport, stage: "fullscreen-pitch" });
      await page.getByRole("button", { name: "Sluiten" }).click();
    }
  }

  await page.locator("[data-testid='academy-primary-cta']").click();
  await page.waitForURL(`**/decision-lab/${GS_SLUG}`);
  await page.waitForSelector("[data-testid='lesson-experience']");
  await shot(page, `${prefix}-05-lesson-open.png`, { viewport, stage: "situation" });

  // Skip transform controls on lesson — go to scan
  await page.locator("[data-testid='lesson-continue']").first().click();
  await page.waitForSelector("[data-testid='lesson-stage-scan']");
  await shot(page, `${prefix}-06-scan.png`, { viewport, stage: "scan" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-stage-decision']");
  await shot(page, `${prefix}-07-decision.png`, { viewport, stage: "decision" });

  await page.locator("[data-testid='choice-B']").click();
  await page.waitForSelector("[data-testid='consequence-panel']", { timeout: 8000 });
  await shot(page, `${prefix}-08-consequence.png`, { viewport, stage: "consequence" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-stage-explanation']");
  await shot(page, `${prefix}-09-explanation.png`, { viewport, stage: "explanation" });

  await page.locator("[data-testid='lesson-continue']").click();
  await page.waitForSelector("[data-testid='lesson-completion']");
  await shot(page, `${prefix}-10-completion.png`, { viewport, stage: "completion" });

  const progress = await page.evaluate((k) => localStorage.getItem(k), KEY);
  const parsed = progress ? JSON.parse(progress) : {};
  const gsDone = parsed[GS]?.status === "completed";
  const versionOk = parsed[GS]?.progressVersion === 2;

  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-returning']");
  await shot(page, `${prefix}-11-after.png`, {
    viewport,
    stage: "academy-after",
    gsDone,
    versionOk,
  });

  await page.goto(`${BASE}/academie/decision-lab`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='decision-lab-hub']");
  await shot(page, `${prefix}-12-hub.png`, { viewport, stage: "hub", gsDone });

  return { gsDone, versionOk };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  const d1 = await journey(page, "1440x900", "d1440");

  await page.setViewportSize({ width: 1280, height: 720 });
  await clear(page);
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await shot(page, "d1280-01-untouched.png", { viewport: "1280x720", stage: "untouched" });

  await page.setViewportSize({ width: 390, height: 844 });
  const m1 = await journey(page, "390x844", "m390");

  await page.setViewportSize({ width: 360, height: 800 });
  await clear(page);
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await shot(page, "m360-01-untouched.png", { viewport: "360x800", stage: "untouched" });

  await page.setViewportSize({ width: 320, height: 568 });
  await clear(page);
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await shot(page, "m320-01-untouched.png", { viewport: "320x568", stage: "untouched" });
  const overflow320 = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );

  await context.tracing.stop({ path: path.join(OUT, "trace.zip") });

  const summary = {
    base: BASE,
    d1,
    m1,
    overflow320,
    consoleErrors: consoleErrors.filter((e) => !/fonts\.googleapis|Failed to load resource/i.test(e)),
    shots,
    gates: {
      untouchedStart: shots.some((s) => /Start eerste/i.test(String(s.cta))),
      completionPersisted: d1.gsDone && m1.gsDone,
      progressVersion2: d1.versionOk,
      noOverflow: shots.every((s) => s.overflow === false),
      mobile320NoOverflow: !overflow320,
    },
  };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.gates, null, 2));
  await browser.close();
  if (!summary.gates.untouchedStart || !summary.gates.completionPersisted || !summary.gates.mobile320NoOverflow) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
