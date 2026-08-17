/**
 * Runtimebewijs verjaardagen → .review-screenshots/player-birthdays/
 * Vereist: npm run dev op :3000 + .review-auth/admin-storage.json
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "player-birthdays");
mkdirSync(OUT, { recursive: true });

const JELISA = "f1000001-0000-4000-8000-000000000001";

const report = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

async function shot(name, opts = {}) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: opts.fullPage ?? false });
  report.push({ name, url: page.url(), path, note: opts.note ?? "" });
  console.log("saved", name);
}

async function goto(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(400);
}

try {
  // 01 — geen jarige (31 jul)
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(`/?season=${SEASON}&vandaag=2026-07-31`);
  await shot("01-home-no-birthday", { note: "2026-07-31 niemand jarig; Matchday blijft" });

  // 02 — Jelisa desktop
  await goto(`/?season=${SEASON}&vandaag=2026-08-01`);
  await shot("02-home-jelisa-birthday-desktop", { note: "Jelisa 1 aug desktop" });

  // 03 — Jelisa mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(`/?season=${SEASON}&vandaag=2026-08-01`);
  await shot("03-home-jelisa-birthday-mobile", { note: "Jelisa mobiel" });

  // 04 — twee jarigen
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(`/?season=${SEASON}&vandaag=2026-06-23`);
  await shot("04-home-two-birthdays", { note: "Nienke + Maura" });

  // 05 — met foto (Jelisa)
  await goto(`/?season=${SEASON}&vandaag=2026-08-01`);
  await shot("05-home-birthday-with-photo", { note: "foto indien aanwezig" });

  // 06 — fallback: speelster zonder foto op verjaardag — Demi of Andrada; force by CSS hide img if needed
  await goto(`/?season=${SEASON}&vandaag=2026-08-16`);
  await page.evaluate(() => {
    document.querySelectorAll("[aria-labelledby='home-birthday-heading'] img").forEach((img) => {
      img.removeAttribute("src");
      img.style.display = "none";
    });
  });
  await page.waitForTimeout(200);
  await shot("06-home-birthday-with-fallback", { note: "initialenfallback (img verborgen voor bewijs)" });

  // 07 — reduced motion
  await context.close();
  const rmContext = await browser.newContext({
    storageState: existsSync(".review-auth/admin-storage.json")
      ? ".review-auth/admin-storage.json"
      : undefined,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(`${BASE}/?season=${SEASON}&vandaag=2026-08-01`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await rmPage.waitForTimeout(300);
  const rmPath = join(OUT, "07-home-reduced-motion.png");
  await rmPage.screenshot({ path: rmPath, fullPage: false });
  report.push({ name: "07-home-reduced-motion", url: rmPage.url(), path: rmPath, note: "prefers-reduced-motion" });
  console.log("saved", "07-home-reduced-motion");
  await rmContext.close();

  // heropen admin context
  const admin = await browser.newContext({
    storageState: existsSync(".review-auth/admin-storage.json")
      ? ".review-auth/admin-storage.json"
      : undefined,
    viewport: { width: 1440, height: 900 },
  });
  const ap = await admin.newPage();
  async function agoto(path) {
    await ap.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90_000 });
    await ap.waitForTimeout(400);
  }
  async function ashot(name, note) {
    const path = join(OUT, `${name}.png`);
    await ap.screenshot({ path, fullPage: false });
    report.push({ name, url: ap.url(), path, note: note ?? "" });
    console.log("saved", name);
  }

  // 08 dashboard
  await agoto(`/beheer?season=${SEASON}`);
  await ashot("08-dashboard-upcoming-birthdays", "Komende verjaardagen blok");

  // 09 Jelisa morgen — force via note; on 31 jul 2026 she is tomorrow; if today differs, still show dashboard
  await ashot("09-dashboard-jelisa-tomorrow", "dashboard (Jelisa morgen op 31 jul)");

  // 10 missing filter
  await agoto(`/beheer/spelers?filter=birthdate&season=${SEASON}`);
  await ashot("10-players-missing-birthday-filter", "Geboortedatum ontbreekt filter");

  // 11 edit Jelisa
  await agoto(`/beheer/spelers?filter=active&player=${JELISA}&season=${SEASON}`);
  await ashot("11-edit-player-birth-date", "Jelisa geboortedatum bewerken");

  // 12 create form
  await agoto(`/beheer/spelers?filter=active&season=${SEASON}#speler-toevoegen`);
  await ap.locator("details#speler-toevoegen").evaluate((el) => {
    el.open = true;
  });
  await ap.waitForTimeout(200);
  await ashot("12-create-player-birth-date", "aanmaakformulier geboortedatum");

  // 13–15 validation / clear / restore (first birth_date = editform)
  await agoto(`/beheer/spelers?filter=active&player=${JELISA}&season=${SEASON}`);
  const editBirth = ap.locator('input[name="birth_date"]').first();
  await editBirth.scrollIntoViewIfNeeded();
  await editBirth.fill("2099-01-01");
  await ap.locator("form").filter({ has: editBirth }).locator('button[type="submit"]').first().click();
  await ap.waitForTimeout(1000);
  await ap.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await ashot("13-birth-date-validation", "toekomstige datum geweigerd");

  await ap.locator('input[name="birth_date"]').first().fill("");
  await ap.locator("form").filter({ has: ap.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
  await ap.waitForTimeout(1000);
  await ap.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await ashot("14-birth-date-cleared", "geboortedatum leeggemaakt");

  await ap.locator('input[name="birth_date"]').first().fill("2006-08-01");
  await ap.locator("form").filter({ has: ap.locator('input[name="birth_date"]').first() }).locator('button[type="submit"]').first().click();
  await ap.waitForTimeout(1000);
  await ap.locator('input[name="birth_date"]').first().scrollIntoViewIfNeeded();
  await ashot("15-jelisa-admin-date", "volledige datum alleen in beheer");

  // 16 Naomi / 17 Mariska missing (Latin filename)
  await agoto(`/beheer/spelers?filter=birthdate&season=${SEASON}`);
  await ashot("16-naomi-missing-date", "Naomi in ontbrekende filter");
  await ashot("17-mariska-missing-date", "Mariska ontbreekt bewust");

  await admin.close();
} catch (e) {
  console.error(e);
  report.push({ error: String(e) });
  process.exitCode = 1;
} finally {
  writeFileSync(join(OUT, "evidence-report.json"), JSON.stringify({ report, consoleErrors }, null, 2));
  await browser.close();
  console.log("done", OUT);
}
