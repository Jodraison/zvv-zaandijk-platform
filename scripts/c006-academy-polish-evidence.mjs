import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  "docs/football-decision-lab/reviews/phase-c/artifacts/c-006",
);
fs.mkdirSync(ROOT, { recursive: true });
const BASE = process.env.C006_BASE_URL ?? "http://127.0.0.1:3000";
const PROGRESS_KEY = "fdl-progress-v1";

const SHOTS = [
  {
    name: "academy-desktop-above-fold-0pct",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-desktop-full-0pct",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: true,
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
    name: "academy-mobile-above-fold",
    route: "/academie",
    width: 390,
    height: 844,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-mobile-paths",
    route: "/academie",
    width: 390,
    height: 844,
    fullPage: true,
    progress: null,
    scrollTo: "academy-paths-heading",
  },
  {
    name: "dl-desktop-above-fold",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: false,
    progress: null,
  },
  {
    name: "dl-desktop-trainingsroute",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: true,
    progress: null,
    scrollTo: "dl-route-heading",
  },
  {
    name: "dl-mobile-above-fold",
    route: "/academie/decision-lab",
    width: 390,
    height: 844,
    fullPage: false,
    progress: null,
  },
  {
    name: "dl-mobile-trainingsblok",
    route: "/academie/decision-lab",
    width: 390,
    height: 844,
    fullPage: true,
    progress: null,
    scrollTo: "dl-route-heading",
  },
  {
    name: "academy-desktop-1280",
    route: "/academie",
    width: 1280,
    height: 720,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-tablet-1024",
    route: "/academie",
    width: 1024,
    height: 768,
    fullPage: false,
    progress: null,
  },
  {
    name: "academy-mobile-360",
    route: "/academie",
    width: 360,
    height: 800,
    fullPage: false,
    progress: null,
  },
];

async function waitReady(page) {
  await page.waitForTimeout(1600);
  await page
    .waitForFunction(() => document.fonts?.status === "loaded", null, { timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const report = { base: BASE, shots: [], consoleErrors: [] };

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
      { key: PROGRESS_KEY, progress: shot.progress },
    );

    await page.goto(`${BASE}${shot.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await waitReady(page);

    if (shot.scrollTo) {
      await page
        .locator(`#${shot.scrollTo}`)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await page.waitForTimeout(350);
    }

    const checks = await page.evaluate(() => {
      const text = document.body.innerText || "";
      const recommendCount = (text.match(/Hierna leer je/g) || []).length;
      const titleHits = (text.match(/Hun back krijgt de bal/g) || []).length;
      return {
        overflowX:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 2,
        recommendCount,
        titleHits,
        hasFootballAcademy: /Football Academy/i.test(text),
        hasStartCta: /Start je eerste sessie|Ga verder/i.test(text),
      };
    });

    const file = path.join(ROOT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
    report.shots.push({
      name: shot.name,
      file,
      ...checks,
      consoleErrors: errors.slice(0, 8),
    });
    report.consoleErrors.push(...errors);
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(ROOT, "evidence.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
