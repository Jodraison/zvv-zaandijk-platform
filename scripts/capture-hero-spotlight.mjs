/**
 * Runtime evidence — hero spotlight + countdown deduplicatie.
 * Normale dag via production server; verjaardagen via ?vandaag= op de dev-server.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROD = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3002";
const DEV = process.env.HERO_DEV_BASE_URL ?? "http://localhost:3003";
const OUT = ".review-screenshots/hero-spotlight-dedupe";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
mkdirSync(OUT, { recursive: true });

const notes = [];
const consoleLines = [];

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);

function track(page, viewport) {
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
}

async function open(base, path, viewport) {
  const page = await browser.newPage({ viewport });
  track(page, viewport);
  const href = `${base}${path}`;
  const res = await page.goto(href, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(900);
  return { page, status: res?.status() ?? 0, href };
}

async function proveHeroSeconds(page) {
  const sel = '[data-live-countdown="hero"]';
  const count = await page.locator(sel).count();
  if (count === 0) return { present: false };
  await page.waitForFunction(() => !document.querySelector("[data-countdown-pending]"), null, {
    timeout: 12_000,
  });
  const first = await page.locator(sel).getAttribute("data-countdown-seconds");
  await page.waitForTimeout(2200);
  const second = await page.locator(sel).getAttribute("data-countdown-seconds");
  return { present: true, first, second, changed: first !== second };
}

try {
  const desktop = await open(PROD, `/?season=${SEASON}`, { width: 1440, height: 1100 });
  const spotlight = await desktop.page.getAttribute("section[aria-label='Club']", "data-hero-spotlight");
  const compactCount = await desktop.page.locator('[data-live-countdown="compact"]').count();
  const teamCount = await desktop.page.locator('[data-testid="home-team-spotlight"]').count();
  const birthdayCount = await desktop.page.locator('[data-testid="birthday-hero-spotlight"]').count();
  const heroCount = await desktop.page.locator('[data-live-countdown="hero"]').count();
  const body = await desktop.page.locator("body").innerText();
  await desktop.page.screenshot({ path: join(OUT, "01-homepage-normal-desktop.png"), fullPage: true });
  await desktop.page.screenshot({ path: join(OUT, "02-hero-normal-desktop.png"), fullPage: false });
  await desktop.page.locator("#wedstrijd-focus").screenshot({
    path: join(OUT, "03-next-match-countdown-desktop.png"),
  });
  const tick = await proveHeroSeconds(desktop.page);
  notes.push({
    name: "normal-desktop",
    status: desktop.status,
    spotlight,
    compactCount,
    teamCount,
    birthdayCount,
    heroCount,
    hasWsv: /WSV 1930/i.test(body),
    hasTraining: /Volgende training/i.test(body),
    hasFitness: /Volgende fitheidstest/i.test(body),
    tick,
  });
  await desktop.page.close();

  const mobile = await open(PROD, `/?season=${SEASON}`, { width: 375, height: 844 });
  await mobile.page.screenshot({ path: join(OUT, "06-homepage-mobile-normal.png"), fullPage: true });
  const overflow = await mobile.page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  notes.push({
    name: "normal-mobile-375",
    status: mobile.status,
    spotlight: await mobile.page.getAttribute("section[aria-label='Club']", "data-hero-spotlight"),
    compactCount: await mobile.page.locator('[data-live-countdown="compact"]').count(),
    teamCount: await mobile.page.locator('[data-testid="home-team-spotlight"]').count(),
    overflow,
    noHorizontalOverflow: overflow.scrollWidth <= overflow.clientWidth + 1,
  });
  await mobile.page.close();

  const tablet = await open(PROD, `/?season=${SEASON}`, { width: 768, height: 1024 });
  await tablet.page.screenshot({ path: join(OUT, "08-homepage-tablet-normal.png"), fullPage: false });
  notes.push({
    name: "normal-tablet-768",
    status: tablet.status,
    spotlight: await tablet.page.getAttribute("section[aria-label='Club']", "data-hero-spotlight"),
  });
  await tablet.page.close();

  const jelisa = await open(DEV, `/?season=${SEASON}&vandaag=2026-08-01`, { width: 1440, height: 1100 });
  const jelisaBanner = await jelisa.page.locator('[data-testid="birthday-dev-preview-banner"]').count();
  const jelisaBirth = await jelisa.page.locator('[data-testid="birthday-hero-spotlight"]').count();
  const jelisaTeam = await jelisa.page.locator('[data-testid="home-team-spotlight"]').count();
  const jelisaText = await jelisa.page.locator("body").innerText();
  await jelisa.page.screenshot({ path: join(OUT, "04-jelisa-birthday-desktop.png"), fullPage: false });
  notes.push({
    name: "jelisa-2026-08-01",
    status: jelisa.status,
    banner: jelisaBanner,
    birthdayCount: jelisaBirth,
    teamCount: jelisaTeam,
    hasJelisa: /Jelisa/i.test(jelisaText),
    heroCountdown: await jelisa.page.locator('[data-live-countdown="hero"]').count(),
    compactCount: await jelisa.page.locator('[data-live-countdown="compact"]').count(),
  });
  await jelisa.page.close();

  const duo = await open(DEV, `/?season=${SEASON}&vandaag=2026-06-23`, { width: 1440, height: 1100 });
  const duoText = await duo.page.locator("body").innerText();
  await duo.page.screenshot({ path: join(OUT, "05-nienke-maura-birthday-desktop.png"), fullPage: false });
  notes.push({
    name: "duo-2026-06-23",
    status: duo.status,
    birthdayCount: await duo.page.locator('[data-testid="birthday-hero-spotlight"]').count(),
    teamCount: await duo.page.locator('[data-testid="home-team-spotlight"]').count(),
    birthdayPlayers: await duo.page.locator("[data-birthday-count]").first().getAttribute("data-birthday-count"),
    hasNienke: /Nienke/i.test(duoText),
    hasMaura: /Maura/i.test(duoText),
    compactCount: await duo.page.locator('[data-live-countdown="compact"]').count(),
  });
  await duo.page.close();

  const single = await open(DEV, `/?season=${SEASON}&vandaag=2026-08-16`, { width: 1440, height: 1100 });
  const singleText = await single.page.locator("body").innerText();
  await single.page.screenshot({ path: join(OUT, "04b-andrada-single-birthday-desktop.png"), fullPage: false });
  notes.push({
    name: "andrada-2026-08-16",
    status: single.status,
    birthdayCount: await single.page.locator('[data-testid="birthday-hero-spotlight"]').count(),
    teamCount: await single.page.locator('[data-testid="home-team-spotlight"]').count(),
    hasAndrada: /Andrada/i.test(singleText),
    compactCount: await single.page.locator('[data-live-countdown="compact"]').count(),
  });
  await single.page.close();

  const mobileBday = await open(DEV, `/?season=${SEASON}&vandaag=2026-08-16`, { width: 390, height: 844 });
  await mobileBday.page.screenshot({ path: join(OUT, "07-homepage-mobile-birthday.png"), fullPage: true });
  notes.push({
    name: "jelisa-mobile-390",
    status: mobileBday.status,
    birthdayCount: await mobileBday.page.locator('[data-testid="birthday-hero-spotlight"]').count(),
    teamCount: await mobileBday.page.locator('[data-testid="home-team-spotlight"]').count(),
  });
  await mobileBday.page.close();
} catch (err) {
  console.error("CAPTURE ERROR", err);
  throw err;
} finally {
  await browser.close();
  const relevant = consoleLines.filter((l) => {
    if (/favicon|404 \(Not Found\)|Failed to load resource/i.test(l.text) && !/hydrat/i.test(l.text)) {
      return false;
    }
    return l.type === "pageerror" || /hydrat/i.test(l.text);
  });
  writeFileSync(join(OUT, "runtime-notes.json"), JSON.stringify({ notes, relevant, consoleLines }, null, 2));
  console.log(JSON.stringify({ notes, relevant }, null, 2));

  const normal = notes.find((n) => n.name === "normal-desktop");
  const single = notes.find((n) => n.name === "andrada-2026-08-16");
  const duo = notes.find((n) => n.name === "duo-2026-06-23");
  if (!normal || normal.compactCount !== 0 || normal.teamCount < 1 || !normal.tick?.changed) {
    console.error("FAIL: normal day spotlight / countdown");
    process.exit(1);
  }
  if (!single || single.birthdayCount < 1 || single.teamCount !== 0 || !single.hasAndrada) {
    console.error("FAIL: single birthday preview");
    process.exit(1);
  }
  if (!duo || duo.teamCount !== 0 || duo.birthdayPlayers !== "2") {
    console.error("FAIL: Nienke + Maura birthday preview");
    process.exit(1);
  }
  if (relevant.length > 0) {
    console.error("FAIL: hydration / page errors");
    process.exit(1);
  }
}
