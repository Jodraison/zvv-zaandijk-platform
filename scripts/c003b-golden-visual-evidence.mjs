/**
 * C-003B — Golden Session visual evidence (real route, multi-viewport).
 * Run: node scripts/c003b-golden-visual-evidence.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("docs/football-decision-lab/reviews/phase-c/artifacts/c-003b");
fs.mkdirSync(ROOT, { recursive: true });

const BASE = process.env.C003B_BASE_URL ?? "http://127.0.0.1:3000";
const ROUTE = `${BASE}/academie/decision-lab/binnenkant-dicht-rw`;

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1280x720", width: 1280, height: 720 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-360x800", width: 360, height: 800 },
];

const report = {
  route: ROUTE,
  startedAt: new Date().toISOString(),
  viewports: [],
  consoleErrors: [],
  pageErrors: [],
};

async function clickContinue(page, label) {
  const btn = page.getByRole("button", { name: label });
  if (await btn.count()) {
    await btn.first().click({ timeout: 8000 });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const consoles = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoles.push(msg.text());
    });
    page.on("pageerror", (err) => report.pageErrors.push(`${vp.name}: ${err.message}`));

    const nav = await page.goto(ROUTE, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);

    // Advance to pitch (Start les → Leerdoelen → Bekijk het veld)
    await clickContinue(page, /Start les|Hervat les/i);
    await clickContinue(page, /Bekijk het veld/i);
    await page.waitForTimeout(1800);

    const pitchShot = path.join(ROOT, `${vp.name}-pitch.png`);
    await page.screenshot({ path: pitchShot, fullPage: false });

    // Seek freeze — prefer window helper, fallback to scrub input
    await page.waitForTimeout(600);
    const sought = await page.evaluate(() => {
      const w = window;
      if (typeof w.__ZVV_SEEK__ === "function") {
        w.__ZVV_SEEK__(6800);
        return "window";
      }
      return null;
    });
    if (!sought) {
      const scrub = page.getByTestId("animation-scrub");
      if (await scrub.count()) {
        await scrub.fill("6800");
        await scrub.evaluate((el, v) => {
          el.value = String(v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, 6800);
      }
    }
    await page.waitForTimeout(700);

    const freezeShot = path.join(ROOT, `${vp.name}-freeze.png`);
    await page.screenshot({ path: freezeShot, fullPage: false });
    const freezePhase = await page.evaluate(() => {
      const el = document.querySelector("[data-animation-phase]");
      return el?.getAttribute("data-animation-phase") ?? null;
    });

    // Check horizontal overflow
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });

    const scrub = page.getByTestId("animation-scrub");
    const scrubOk = (await scrub.count()) > 0 && (await scrub.first().isVisible());
    const playOk = (await page.getByTestId("animation-play").count()) > 0;

    // Advance to FOUT/GOED (desktop only for contrast pair)
    let contrastArtifacts = [];
    if (vp.name === "desktop-1440x900") {
      for (const label of [
        /Naar scan-opdracht/i,
        /Naar beslismoment/i,
      ]) {
        await clickContinue(page, label);
      }
      // Choose correct answer B
      const choiceB = page.getByRole("button", { name: /Binnenkant sluiten/i });
      if (await choiceB.count()) {
        await choiceB.first().click();
        await page.waitForTimeout(600);
      }
      for (const label of [/Bekijk beslisboom/i, /Naar uitvoering/i, /FOUT vs GOED/i]) {
        await clickContinue(page, label);
      }
      await page.waitForTimeout(2000);
      const contrastShot = path.join(ROOT, `${vp.name}-fout-vs-goed.png`);
      await page.screenshot({ path: contrastShot, fullPage: true });
      contrastArtifacts = [contrastShot];
    }

    const realConsole = consoles.filter((c) => !c.includes("style property during rerender"));
    report.viewports.push({
      name: vp.name,
      status: nav?.ok() ? "ok" : "nav-fail",
      http: nav?.status() ?? 0,
      overflowX,
      scrubVisible: scrubOk,
      playVisible: playOk,
      freezePhase,
      seekMethod: sought,
      consoleErrors: realConsole.slice(0, 8),
      artifacts: [pitchShot, freezeShot, ...contrastArtifacts],
    });
    report.consoleErrors.push(...realConsole.map((c) => `${vp.name}: ${c}`));

    await context.close();
  }

  // Reduced motion smoke (desktop)
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(ROUTE, { waitUntil: "domcontentloaded", timeout: 45000 });
    await clickContinue(page, /Start les|Hervat les/i);
    await clickContinue(page, /Bekijk het veld/i);
    await page.waitForTimeout(800);
    const reducedShot = path.join(ROOT, "desktop-1280x720-reduced-motion.png");
    await page.screenshot({ path: reducedShot, fullPage: false });
    report.reducedMotionArtifact = reducedShot;
    await context.close();
  }
} finally {
  await browser.close();
}

report.finishedAt = new Date().toISOString();
const jsonPath = path.join(ROOT, "evidence-report.json");
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log("Wrote", jsonPath);
