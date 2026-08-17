import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("docs/football-decision-lab/reviews/phase-c/artifacts/c-004");
fs.mkdirSync(ROOT, { recursive: true });
const BASE = process.env.C004_BASE_URL ?? "http://127.0.0.1:3000";
const ROUTE = `${BASE}/academie`;

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const report = { route: ROUTE, shots: [] };

try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(ROUTE, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);
    const file = path.join(ROOT, `${vp.name}-home.png`);
    await page.screenshot({ path: file, fullPage: true });
    const hasDecisionLab = await page.getByRole("heading", { name: "Decision Lab" }).count();
    const hasStructure = await page.getByText("Hoe is de Academy opgebouwd").count();
    const hasProductBanner = await page.getByText("Football Decision Lab").count();
    report.shots.push({
      vp: vp.name,
      file,
      decisionLabPathVisible: hasDecisionLab > 0,
      structureExplainerRemoved: hasStructure === 0,
      dualProductBannerRemoved: hasProductBanner === 0,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(ROOT, "evidence.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
