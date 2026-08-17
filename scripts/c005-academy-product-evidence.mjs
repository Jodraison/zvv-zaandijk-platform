import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  "docs/football-decision-lab/reviews/phase-c/artifacts/c-005",
);
fs.mkdirSync(ROOT, { recursive: true });
const BASE = process.env.C005_BASE_URL ?? "http://127.0.0.1:3000";

const SHOTS = [
  {
    name: "academy-desktop-above-fold",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: false,
  },
  {
    name: "academy-desktop-full",
    route: "/academie",
    width: 1440,
    height: 900,
    fullPage: true,
  },
  {
    name: "academy-mobile-above-fold",
    route: "/academie",
    width: 390,
    height: 844,
    fullPage: false,
  },
  {
    name: "academy-mobile-paths",
    route: "/academie",
    width: 390,
    height: 844,
    fullPage: true,
    scrollTo: "academy-paths-heading",
  },
  {
    name: "dl-desktop-above-fold",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: false,
  },
  {
    name: "dl-desktop-next-decision",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: false,
    scrollTo: "dl-next-heading",
  },
  {
    name: "dl-desktop-mission-map",
    route: "/academie/decision-lab",
    width: 1440,
    height: 900,
    fullPage: true,
    scrollTo: "dl-route-heading",
  },
  {
    name: "dl-mobile-above-fold",
    route: "/academie/decision-lab",
    width: 390,
    height: 844,
    fullPage: false,
  },
  {
    name: "dl-mobile-mission-route",
    route: "/academie/decision-lab",
    width: 390,
    height: 844,
    fullPage: true,
    scrollTo: "dl-route-heading",
  },
  {
    name: "academy-tablet-1024",
    route: "/academie",
    width: 1024,
    height: 768,
    fullPage: false,
  },
  {
    name: "academy-desktop-1280",
    route: "/academie",
    width: 1280,
    height: 720,
    fullPage: false,
  },
  {
    name: "academy-mobile-360",
    route: "/academie",
    width: 360,
    height: 800,
    fullPage: false,
  },
];

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
    await page.goto(`${BASE}${shot.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1400);
    if (shot.scrollTo) {
      await page
        .locator(`#${shot.scrollTo}`)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await page.waitForTimeout(400);
    }
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    const file = path.join(ROOT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
    report.shots.push({
      name: shot.name,
      file,
      overflowX,
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
