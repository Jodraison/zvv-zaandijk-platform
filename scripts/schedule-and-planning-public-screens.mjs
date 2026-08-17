/**
 * Public-only screenshots (no auth). Admin shots need admin-storage.json.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/schedule-and-planning-reality";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const q = `season=${encodeURIComponent(SEASON)}`;
mkdirSync(OUT, { recursive: true });

const notes = [];
const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(name, href) {
  const res = await page.goto(href, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  const status = res?.status() ?? 0;
  const pathOnly = new URL(page.url()).pathname;
  const body = await page.locator("body").innerText();
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  notes.push({
    name,
    pathOnly,
    status,
    ok: status < 400,
    url: page.url(),
    hasWsv: /WSV 1930/i.test(body),
    has1400: /14:00/.test(body),
    hasBeker: /Beker|BEKER|beker/.test(body),
    has17aug: /17-08-2026|17 augustus 2026/.test(body),
    has2sep: /2 september|02-09-2026|2 september 2026/i.test(body),
  });
}

try {
  await shot("01-home-next-match", `${BASE}/?${q}`);
  await shot("02-public-programma", `${BASE}/wedstrijden?${q}`);
  await shot("11-home-fitness-2-september", `${BASE}/?${q}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("13-mobile-programma", `${BASE}/wedstrijden?${q}`);
  await shot("14-mobile-future-match", `${BASE}/?${q}`);
} finally {
  await browser.close();
  writeFileSync(join(OUT, "public-notes.json"), JSON.stringify(notes, null, 2));
  console.log(JSON.stringify(notes, null, 2));
}
