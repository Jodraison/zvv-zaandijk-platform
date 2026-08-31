/**
 * Visual reality gate — homepage celebrations.
 * Development preview only. Writes to .review-screenshots/homepage-celebration/
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SHOT = join(process.cwd(), ".review-screenshots", "homepage-celebration");
mkdirSync(SHOT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "msedge" });
const consoleErrors = [];

async function shotPage(name, url, viewport, extras = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: extras.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 90_000 });
  if (extras.waitMs) await page.waitForTimeout(extras.waitMs);
  const path = join(SHOT, `${name}.png`);
  await page.screenshot({ path, fullPage: extras.fullPage ?? false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  const hydration = errors.filter((e) => /hydrat/i.test(e));
  console.log(`${name}: overflow=${overflow} console=${errors.length} hydration=${hydration.length} → ${path}`);
  if (errors.length) console.log("  errors:", errors.slice(0, 6));
  consoleErrors.push(...errors.map((e) => `${name}: ${e}`));
  await context.close();
  return { path, overflow, errors };
}

const results = [];
results.push(await shotPage("01-home-normal-1440", "/", { width: 1440, height: 900 }));
results.push(
  await shotPage("02-birthday-hold-1440", "/?celebration=birthday&celebrationHold=1", {
    width: 1440,
    height: 900,
  }),
);
results.push(
  await shotPage("03-victory-hold-1440", "/?celebration=victory&celebrationHold=1", { width: 1440, height: 900 }),
);
results.push(
  await shotPage("04-combined-hold-1440", "/?celebration=combined&celebrationHold=1", {
    width: 1440,
    height: 900,
  }),
);
results.push(
  await shotPage("05-birthday-spotlight-hold-1440", "/?celebration=birthday&celebrationHold=1", {
    width: 1440,
    height: 900,
  }),
);
results.push(
  await shotPage("06-birthday-hold-390", "/?celebration=birthday&celebrationHold=1", {
    width: 390,
    height: 844,
  }),
);
results.push(
  await shotPage("07-victory-hold-390", "/?celebration=victory&celebrationHold=1", { width: 390, height: 844 }),
);
results.push(
  await shotPage("08-combined-hold-430", "/?celebration=combined&celebrationHold=1", {
    width: 430,
    height: 932,
  }),
);
results.push(
  await shotPage("09-birthday-hold-375", "/?celebration=birthday&celebrationHold=1", {
    width: 375,
    height: 812,
  }),
);
results.push(
  await shotPage("10-after-celebration-1440", "/?celebration=victory", { width: 1440, height: 900 }, { waitMs: 16000 }),
);
results.push(
  await shotPage(
    "11-reduced-motion-1440",
    "/?celebration=combined",
    { width: 1440, height: 900 },
    { reducedMotion: "reduce", waitMs: 400 },
  ),
);

await browser.close();

const overflowFail = results.filter((r) => r.overflow);
if (overflowFail.length) {
  console.error("FAIL horizontal overflow:", overflowFail.map((r) => r.path));
  process.exit(1);
}
if (consoleErrors.some((e) => /hydrat/i.test(e))) {
  console.error("FAIL hydration errors");
  process.exit(1);
}
console.log("homepage-celebration screens: ok");
