/**
 * Visuele reality gate — birthday hero spotlight upgrade.
 * Output: .review-screenshots/birthday-hero-spotlight-upgrade/
 */
import { chromium } from "playwright";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "birthday-hero-spotlight-upgrade");
mkdirSync(OUT, { recursive: true });

const before = join(
  process.cwd(),
  ".review-screenshots",
  "player-birthday-preview-recovery",
  "04-home-jelisa-1-august.png",
);
if (existsSync(before)) {
  copyFileSync(before, join(OUT, "10a-before-small-card.png"));
}

const report = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

function visibleSpotlight() {
  return page.locator('[data-testid="birthday-hero-spotlight"]').locator("visible=true").first();
}

async function measureSpotlight() {
  const handle = await visibleSpotlight().elementHandle();
  if (!handle) return null;
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const portraits = [...el.querySelectorAll("[data-birthday-portrait]")].map((p) => {
      const pr = p.getBoundingClientRect();
      return { w: Math.round(pr.width), h: Math.round(pr.height) };
    });
    const names = [...el.querySelectorAll("[data-birthday-fullname]")].map((n) => ({
      text: n.textContent?.trim() || "",
      truncated:
        getComputedStyle(n).textOverflow === "ellipsis" && n.scrollWidth > n.clientWidth + 1,
    }));
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return {
      width: Math.round(r.width),
      height: Math.round(r.height),
      portraits,
      names,
      overflow,
      bodyHasYearLeak: /2006|jaar geworden|Geboren op/i.test(el.textContent || ""),
    };
  });
}

async function shot(name, note) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  report.push({ name, url: page.url(), note, path });
  console.log("saved", name, note);
}

let failed = false;
function fail(msg) {
  failed = true;
  console.error("FAIL:", msg);
  report.push({ error: msg });
}

try {
  // 01 Jelisa desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await visibleSpotlight().waitFor({ state: "visible", timeout: 20_000 });
  let m = await measureSpotlight();
  console.log("jelisa desktop", m);
  if (!m || m.width < 500) fail(`spotlight width ${m?.width} < 500`);
  if (!m || m.height < 350) fail(`spotlight height ${m?.height} < 350`);
  if (!m?.portraits[0] || m.portraits[0].w < 150) fail(`portrait ${m?.portraits[0]?.w} < 150`);
  if (!m?.names.some((n) => /Jelisa/i.test(n.text) && !n.truncated)) fail("Jelisa name truncated/missing");
  if (m?.bodyHasYearLeak) fail("year leak in spotlight");
  if (m?.overflow) fail("horizontal overflow");
  const text = await visibleSpotlight().innerText();
  if (!/#1/.test(text) || !/Keeper|GK/i.test(text)) fail("rugnummer/positie Jelisa");
  await shot("01-jelisa-large-desktop", JSON.stringify(m));

  // 02 Jelisa mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  m = await measureSpotlight();
  if (m?.overflow) fail("mobile overflow Jelisa");
  await shot("02-jelisa-large-mobile", JSON.stringify(m));

  // 03 duo desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-06-23`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  m = await measureSpotlight();
  console.log("duo desktop", m);
  if (!m || m.width < 500) fail(`duo width ${m?.width}`);
  if (!m || m.height < 350) fail(`duo height ${m?.height}`);
  if ((m?.portraits.length || 0) < 2) fail("need 2 portraits");
  if (m?.portraits.some((p) => p.w < 110)) fail(`duo portrait too small ${JSON.stringify(m?.portraits)}`);
  const nameTexts = m?.names.map((n) => n.text) || [];
  if (!nameTexts.some((t) => t === "Maura Hoffman")) fail(`Maura full name missing: ${nameTexts}`);
  if (!nameTexts.some((t) => t === "Nienke Hoffman")) fail(`Nienke full name missing: ${nameTexts}`);
  if (m?.names.some((n) => n.truncated)) fail("name truncated");
  const duoText = await visibleSpotlight().innerText();
  if (!/#13/.test(duoText) || !/\bLB\b/.test(duoText)) fail("Maura #13 LB");
  if (!/#11/.test(duoText) || !/\bSP\b/.test(duoText)) fail("Nienke #11 SP");
  if (/\bDEF\b|\bATT\b/.test(duoText)) fail("generic DEF/ATT shown");
  await shot("03-maura-nienke-large-desktop", JSON.stringify(m));
  await shot("07-full-names-visible", "full names Maura + Nienke");

  // 04 duo mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-06-23`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  m = await measureSpotlight();
  if (m?.overflow) fail("mobile overflow duo");
  await shot("04-maura-nienke-large-mobile", JSON.stringify(m));

  // 05 photo detail — crop spotlight
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const box = await page.locator("[data-birthday-portrait]").first().boundingBox();
  if (box) {
    await page.screenshot({
      path: join(OUT, "05-photo-detail.png"),
      clip: {
        x: Math.max(0, box.x - 24),
        y: Math.max(0, box.y - 24),
        width: Math.min(480, box.width + 48),
        height: Math.min(480, box.height + 120),
      },
    });
    report.push({ name: "05-photo-detail", note: "portrait crop" });
    console.log("saved 05-photo-detail");
  }

  // 06 fallback — hide image on Andrada day or Maura if no photo
  await page.goto(`${BASE}/?season=${SEASON}&vandaag=2026-06-23`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await page.evaluate(() => {
    document.querySelectorAll("[data-birthday-portrait] img").forEach((img) => {
      img.removeAttribute("src");
      img.style.display = "none";
    });
  });
  await page.waitForTimeout(200);
  await shot("06-fallback-detail", "initialen fallback even groot");

  // 08 reduced motion
  await context.close();
  const rm = await browser.newContext({
    storageState: existsSync(".review-auth/admin-storage.json")
      ? ".review-auth/admin-storage.json"
      : undefined,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const rp = await rm.newPage();
  await rp.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await rp.screenshot({ path: join(OUT, "08-reduced-motion.png"), fullPage: false });
  report.push({ name: "08-reduced-motion", note: "static with reduced motion" });
  console.log("saved 08-reduced-motion");
  await rm.close();

  const ctx2 = await browser.newContext({
    storageState: existsSync(".review-auth/admin-storage.json")
      ? ".review-auth/admin-storage.json"
      : undefined,
    viewport: { width: 1440, height: 900 },
  });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/?season=${SEASON}&vandaag=2026-07-31`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const t = await p2.locator("body").innerText();
  if (/in het zonnetje/i.test(t)) fail("normal day still has spotlight");
  if (!/Matchday/i.test(t)) fail("Matchday missing on normal day");
  await p2.screenshot({ path: join(OUT, "09-normal-day-matchday.png"), fullPage: false });
  report.push({ name: "09-normal-day-matchday", note: "Matchday restored" });
  console.log("saved 09-normal-day-matchday");

  // 10 after
  await p2.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await p2.screenshot({ path: join(OUT, "10b-after-large-spotlight.png"), fullPage: false });
  report.push({ name: "10b-after-large-spotlight", note: "after upgrade" });
  // composite note file for before/after
  writeFileSync(
    join(OUT, "10-desktop-before-after.txt"),
    "Compare 10a-before-small-card.png vs 10b-after-large-spotlight.png\n",
  );
  console.log("saved 10 after");
  await ctx2.close();
} catch (e) {
  fail(String(e));
} finally {
  writeFileSync(join(OUT, "evidence-report.json"), JSON.stringify({ report, failed }, null, 2));
  await browser.close();
  if (failed) process.exit(1);
  console.log("REALITY GATE = PASS", OUT);
}
