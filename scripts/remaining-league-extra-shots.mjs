import { chromium } from "playwright";
import { join } from "node:path";

const PUBLIC = process.env.PUBLIC_BASE_URL ?? "https://zaandijkvrz1.nl";
const OUT = ".review-screenshots/remaining-league-program-2026-27";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const FUTURE_ID = "adc6e3fb-7fcd-4360-8f35-4a97824a503e";

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();

await page.goto(`${PUBLIC}/`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(700);
await page.screenshot({ path: join(OUT, "09-homepage-countdown.png"), fullPage: false });

await page.goto(`${PUBLIC}/wedstrijden/${FUTURE_ID}?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(700);
await page.screenshot({ path: join(OUT, "07-toekomst-zonder-opstelling.png"), fullPage: true });

await page.goto(`${PUBLIC}/wedstrijden?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90000 });
const last = page.getByText("22-05-2027").first();
await last.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const box = await last.boundingBox();
if (box) {
  await page.screenshot({
    path: join(OUT, "05b-22-mei-schagen.png"),
    clip: { x: 0, y: Math.max(0, box.y - 220), width: 1440, height: 700 },
  });
} else {
  await page.screenshot({ path: join(OUT, "05b-22-mei-schagen.png"), fullPage: false });
}

console.log("extra shots ok");
await browser.close();
