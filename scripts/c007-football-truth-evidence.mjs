import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  "docs/football-decision-lab/reviews/phase-c/artifacts/c-007",
);
fs.mkdirSync(ROOT, { recursive: true });
const BASE = process.env.C007_BASE_URL ?? "http://127.0.0.1:3010";
const KEY = "fdl-progress-v1";
const GS = `${BASE}/academie/decision-lab/binnenkant-dicht-rw`;

const annotations = {
  ourTeam: "ZVV Zaandijk (blauw / us)",
  formation: "Basis 4-2-3-1; pressfase bezetting afgeleid (leesbare 4-4-2)",
  attackingDirection: "Links → rechts (+x)",
  ballHolderOpening: "opp.cbL (LCB) → opp.lb (LB) bij trigger",
  activeRole: "us.RW (Rechtsbuiten)",
  phase: "Zij bouwen op / Wij zetten druk",
  reason:
    "Orientation chrome + PRESS_V2 start + GS film; preview seek = first-touch opening (geen oplossingcurve).",
};

async function waitReady(page) {
  await page.waitForTimeout(1800);
  await page
    .waitForFunction(() => document.fonts?.status === "loaded", null, { timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });
const report = { base: BASE, annotations, shots: [], consoleErrors: [] };

const SHOTS = [
  {
    name: "academy-desktop-untouched",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-mobile-untouched",
    route: "/academie",
    width: 390,
    height: 844,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-desktop-in-progress",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: true,
    progress: {
      "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1": {
        status: "started",
        step: 2,
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
    },
  },
  {
    name: "academy-desktop-completed-first",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: true,
    progress: {
      "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1": {
        status: "completed",
        step: 5,
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
    },
  },
  {
    name: "dl-desktop-first-use",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: false,
    progress: null,
  },
  {
    name: "dl-mobile-first-use",
    route: "/academie/decision-lab",
    width: 390,
    height: 844,
    fullPage: false,
    progress: null,
  },
];

try {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.addInitScript(
      ({ key, progress }) => {
        if (progress) localStorage.setItem(key, JSON.stringify(progress));
        else localStorage.removeItem(key);
      },
      { key: KEY, progress: shot.progress },
    );
    await page.goto(`${BASE}${shot.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await waitReady(page);
    const checks = await page.evaluate(() => {
      const text = document.body.innerText || "";
      return {
        overflowX:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 2,
        hasStartCta: /Start je eerste sessie/.test(text),
        hasGaVerderCta: /\bGa verder\b/.test(text),
        hasHervatten: /Hervatten/.test(text),
        hasOrientation: /WIJ — ZVV ZAANDIJK|WIJ — ZVV/.test(text) || !!document.querySelector('[data-testid="tactical-orientation-chrome"]'),
        hasStartHier: /Start hier/.test(text),
        hasReferentie: /Referentiesessie|Referentie\b/.test(text),
      };
    });
    const file = path.join(ROOT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
    report.shots.push({ name: shot.name, file, ...checks, consoleErrors: errors.slice(0, 6) });
    report.consoleErrors.push(...errors);
    await context.close();
  }

  // Golden Session frames
  const gsFrames = [
    { name: "gs-opening", seek: 400 },
    { name: "gs-freeze", seek: 6800 },
    { name: "gs-goed", seek: 12400, branch: "good" },
    { name: "gs-fout", seek: 12400, branch: "bad" },
  ];

  for (const frame of gsFrames) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    let url = `${GS}?seekMs=${frame.seek}`;
    if (frame.branch === "good") url = `${GS}?step=execution&seekMs=${frame.seek}`;
    if (frame.branch === "bad") url = `${GS}?compare=1&seekMs=${frame.seek}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitReady(page);
    // Try to land on decision/execution if needed
    if (frame.name === "gs-freeze") {
      const decide = page.getByRole("button", { name: /Beslis|Verder|Doorgaan/i }).first();
      if (await decide.count()) await decide.click().catch(() => {});
      await page.waitForTimeout(800);
    }
    const file = path.join(ROOT, `${frame.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    report.shots.push({
      name: frame.name,
      file,
      seekMs: frame.seek,
      annotations,
      consoleErrors: errors.slice(0, 6),
    });
    report.consoleErrors.push(...errors);
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(ROOT, "evidence.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
