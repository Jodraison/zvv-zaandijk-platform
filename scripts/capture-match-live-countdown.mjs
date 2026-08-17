/**
 * Runtime evidence — live matchday countdown (geen data-mutatie).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/match-live-countdown";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const href = `${BASE}/?season=${encodeURIComponent(SEASON)}`;
mkdirSync(OUT, { recursive: true });

const notes = [];
const consoleLines = [];

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);

async function openPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error" || /hydrat/i.test(text) || type === "warning") {
      consoleLines.push({ type, text, viewport });
    }
  });
  page.on("pageerror", (err) => {
    consoleLines.push({ type: "pageerror", text: String(err), viewport });
  });
  page.on("requestfailed", (req) => {
    consoleLines.push({ type: "requestfailed", text: `${req.failure()?.errorText ?? "fail"} ${req.url()}`, viewport });
  });
  const res = await page.goto(href, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForSelector('[data-live-countdown="hero"]', { timeout: 25_000 });
  try {
    await page.waitForFunction(
      () => !document.querySelector("[data-countdown-pending]"),
      null,
      { timeout: 15_000 },
    );
  } catch (err) {
    const pending = await page.locator("[data-countdown-pending]").count();
    const hero = await page.locator('[data-live-countdown="hero"]').count();
    console.error("pending-wait failed", { pending, hero, err: String(err) });
    throw err;
  }
  await page.waitForTimeout(600);
  return { page, status: res?.status() ?? 0 };
}

async function proveSeconds(page, variant) {
  const sel = variant === "compact" ? '[data-live-slot="matchday"]' : `[data-live-countdown="${variant}"]`;
  const first = await page.locator(sel).getAttribute("data-countdown-seconds");
  const firstText = await page.locator(`${sel} [data-countdown-unit="sec"]`).innerText();
  await page.waitForTimeout(2200);
  const second = await page.locator(sel).getAttribute("data-countdown-seconds");
  const secondText = await page.locator(`${sel} [data-countdown-unit="sec"]`).innerText();
  const changed = first !== second || firstText !== secondText;
  return { variant, first, second, firstText, secondText, changed };
}

try {
  console.log("opening", href);
  const desktop = await openPage({ width: 1440, height: 1100 });
  await desktop.page.screenshot({
    path: join(OUT, "01-homepage-hero-desktop.png"),
    fullPage: false,
  });
  const compact = desktop.page.locator('[data-live-slot="matchday"]');
  await compact.screenshot({ path: join(OUT, "02-compact-matchday-desktop.png") });
  const hero = desktop.page.locator("#wedstrijd-focus");
  await hero.screenshot({ path: join(OUT, "03-hero-next-match-desktop.png") });
  await desktop.page.screenshot({
    path: join(OUT, "04-homepage-full-desktop.png"),
    fullPage: true,
  });
  const tickDesktopHero = await proveSeconds(desktop.page, "hero");
  const tickDesktopCompact = await proveSeconds(desktop.page, "compact");
  const body = await desktop.page.locator("body").innerText();
  notes.push({
    name: "desktop-1440",
    status: desktop.status,
    hasWsv: /WSV 1930/i.test(body),
    has1400: /14:00/.test(body),
    tickDesktopHero,
    tickDesktopCompact,
  });
  await desktop.page.close();

  for (const width of [375, 390, 430]) {
    const mobile = await openPage({ width, height: 844 });
    await mobile.page.screenshot({
      path: join(OUT, `05-homepage-mobile-${width}.png`),
      fullPage: true,
    });
    const heroCard = mobile.page.locator("#wedstrijd-focus");
    await heroCard.screenshot({ path: join(OUT, `06-hero-next-match-mobile-${width}.png`) });
    const tick = await proveSeconds(mobile.page, "hero");
    const overflow = await mobile.page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    });
    notes.push({
      name: `mobile-${width}`,
      status: mobile.status,
      tick,
      overflow,
      noHorizontalOverflow: overflow.scrollWidth <= overflow.clientWidth + 1,
    });
    await mobile.page.close();
  }
} catch (err) {
  console.error("CAPTURE ERROR", err);
  throw err;
} finally {
  await browser.close();
  const relevant = consoleLines.filter((l) => {
    if (/favicon|404 \(Not Found\)/i.test(l.text) && !/hydrat/i.test(l.text)) return false;
    return (
      l.type === "pageerror" ||
      /hydrat/i.test(l.text) ||
      (l.type === "error" && !/Failed to load resource/i.test(l.text))
    );
  });
  writeFileSync(join(OUT, "runtime-notes.json"), JSON.stringify({ notes, consoleLines, relevant }, null, 2));
  console.log(JSON.stringify({ notes, relevant, consoleCount: consoleLines.length }, null, 2));
  if (!notes.some((n) => n.tickDesktopHero?.changed || n.tick?.changed)) {
    console.error("FAIL: seconds did not change without refresh");
    process.exit(1);
  }
  if (relevant.length > 0) {
    console.error("FAIL: console errors / hydration warnings");
    process.exit(1);
  }
}
