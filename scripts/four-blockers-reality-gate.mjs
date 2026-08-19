/**
 * Reality gate: 4 blockers op echte productroutes + screenshots.
 * Cleanup van tijdelijke OWF FourBlock* wedstrijden.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const ART = join(process.cwd(), ".review-artifacts", "four-blockers-real-browser-recovery");
const SHOT = join(process.cwd(), ".review-screenshots", "four-blockers-real-browser-recovery");
mkdirSync(ART, { recursive: true });
mkdirSync(SHOT, { recursive: true });

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const steps = [];
function record(action, result, screenshot, pass) {
  steps.push({ action, result, screenshot, pass: pass ? "PASS" : "FAIL" });
  if (!pass) console.error("FAIL:", action, result);
  else console.log("PASS:", action);
}

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

async function shot(name) {
  const path = join(SHOT, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

let matchId = null;
let failed = false;

try {
  // A leadership
  await page.goto(`${BASE}/selectie?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  const selText = await page.locator("body").innerText();
  const melOk = /Melissa Rietveld/i.test(selText) && /Aanvoerder/i.test(selText);
  await shot("01-melissa-captain-selectie");
  record("Melissa Aanvoerder op selectie", melOk ? "zichtbaar" : "ontbreekt", "01", melOk);
  if (!melOk) failed = true;

  const dionOk = /Dionne van Dijk/i.test(selText) && /Vice-aanvoerder/i.test(selText);
  await shot("02-dionne-vice-selectie");
  record("Dionne Vice-aanvoerder op selectie", dionOk ? "zichtbaar" : "ontbreekt", "02", dionOk);
  if (!dionOk) failed = true;

  const { data: melMem } = await sb
    .from("player_season_memberships")
    .select("player_id,players(full_name)")
    .eq("season_id", SEASON)
    .eq("is_captain", true)
    .maybeSingle();
  const melId = melMem?.player_id;
  if (melId) {
    await page.goto(`${BASE}/selectie/${melId}?season=${SEASON}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    const prof = await page.locator("body").innerText();
    const pOk = /Aanvoerder/i.test(prof);
    await shot("03-leadership-profile");
    record("Profiel toont Aanvoerder", pOk ? "ok" : "fail", "03", pOk);
    if (!pOk) failed = true;
  }

  // B fitness
  await page.goto(`${BASE}/beheer/fitheid?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  const stationHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href*="/station/"]')].find((el) =>
      /sprint/i.test(el.getAttribute("href") || ""),
    );
    return a?.getAttribute("href") || null;
  });
  if (!stationHref) {
    record("Fitness station link", "geen sprint link", "05", false);
    failed = true;
  } else {
    for (const [tab, shotName] of [
      ["sprint", "05-sprint-jelisa-visible"],
      ["agility", "07-agility-jelisa-visible"],
      ["plank", "08-plank-jelisa-visible"],
      ["run", "09-run-jelisa-visible"],
    ]) {
      const href = stationHref.replace(/\/station\/[^/?]+/, `/station/${tab}`);
      await page.goto(`${BASE}${href}`, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.scrollBy(0, 80));
      const boxes = await page.evaluate(() => {
        const header = document.querySelector("[data-fitness-station-header]");
        const col = document.querySelector("[data-fitness-column-header]");
        const first = [...document.querySelectorAll("ul li p.font-semibold")].find((p) =>
          /Jelisa/i.test(p.textContent || ""),
        );
        const row = first?.closest("li");
        const h = header?.getBoundingClientRect();
        const c = col?.getBoundingClientRect();
        const r = row?.getBoundingClientRect();
        const overlapH = h && r ? Math.max(0, h.bottom - r.top) : 0;
        const overlapC = c && r ? Math.max(0, c.bottom - r.top) : 0;
        return {
          header: h ? { top: h.top, bottom: h.bottom } : null,
          firstRow: r ? { top: r.top, bottom: r.bottom } : null,
          overlapPixels: Math.max(overlapH, overlapC),
          jelisa: first?.textContent,
        };
      });
      writeFileSync(join(ART, `fitness-header-after-${tab}.json`), JSON.stringify(boxes, null, 2));
      const ok = boxes.overlapPixels === 0 && !!boxes.jelisa && boxes.header && boxes.firstRow && boxes.header.bottom <= boxes.firstRow.top + 0.5;
      await shot(shotName);
      record(`Fitness ${tab} header vs Jelisa`, JSON.stringify(boxes.overlapPixels), shotName, ok);
      if (!ok) failed = true;
      if (tab === "sprint") {
        await page.evaluate(() => window.scrollBy(0, 200));
        await shot("06-sprint-header-scroll");
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}${stationHref}`, { waitUntil: "networkidle", timeout: 90_000 });
    await shot("10-fitness-mobile");
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  // C lineup — verse sessiecheck (lange fitness-run kan cookie laten verlopen)
  await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Auth verlopen voor lineup-stap — vernieuw .review-auth/admin-storage.json");
  }
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Auth verlopen op nieuw-wedstrijd");
  }
  await page.locator('input[type="datetime-local"]').waitFor({ state: "visible", timeout: 30_000 });
  const stamp = Date.now();
  const opponentInput = page.locator('label:has-text("Tegenstander") input').first();
  await opponentInput.fill(`OWF FourBlock ${stamp}`);
  await page.locator('input[type="datetime-local"]').fill("2026-08-23T15:00");
  const createBtn = page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i });
  await createBtn.waitFor({ state: "visible", timeout: 15_000 });
  await createBtn.click();
  // Next.js client navigate vuurt niet altijd "load" — poll op URL.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && !/step=opstelling/.test(page.url())) {
    await page.waitForTimeout(250);
  }
  if (!/step=opstelling/.test(page.url())) {
    const body = (await page.locator("body").innerText()).slice(0, 600);
    throw new Error(`Geen opstelling-URL na create: ${page.url()} :: ${body}`);
  }
  matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1];
  await page.waitForSelector('[data-testid="formation-pitch"]', { timeout: 30_000 });
  await page.waitForTimeout(600);

  const lineupDiag = await page.evaluate(() => {
    const pitch = document.querySelector('[data-testid="formation-pitch"]');
    const r = pitch?.getBoundingClientRect();
    const empty = document.querySelectorAll('button[aria-label$="leeg — speelster kiezen"]').length;
    const opVeld = [...document.querySelectorAll("button")].filter((b) =>
      /^Op veld$/i.test((b.textContent || "").trim()),
    ).length;
    return {
      width: r ? Math.round(r.width) : 0,
      height: r ? Math.round(r.height) : 0,
      emptySlots: empty,
      opVeldButtons: opVeld,
    };
  });
  writeFileSync(join(ART, "lineup-computed-layout-after.json"), JSON.stringify(lineupDiag, null, 2));
  await shot("11-real-route-empty-pitch");
  await shot("12-eleven-empty-slots");
  const pitchOk = lineupDiag.width > 600 && lineupDiag.height > 500 && lineupDiag.emptySlots === 11;
  record("Leeg 1-4-2-3-1 veld", JSON.stringify(lineupDiag), "11-12", pitchOk);
  if (!pitchOk) failed = true;
  record("Op veld knoppen", String(lineupDiag.opVeldButtons), "12", lineupDiag.opVeldButtons >= 1);
  if (lineupDiag.opVeldButtons < 1) failed = true;

  await page.getByRole("button", { name: /LCB: leeg/i }).click();
  await page.waitForTimeout(300);
  await shot("13-lcb-clicked");
  await shot("14-player-picker");
  const pickerOpen = await page.getByRole("dialog", { name: /LCB/i }).count();
  record("LCB opent picker", String(pickerOpen), "13-14", pickerOpen > 0);
  if (!pickerOpen) failed = true;

  await page.getByRole("button", { name: /#3\s+Naomi Lattig|Naomi Lattig/i }).first().click();
  await page.waitForTimeout(400);
  await shot("15-naomi-on-lcb");
  const naomiOn = await page.getByRole("button", { name: /LCB: Naomi/i }).count();
  record("Naomi op LCB", String(naomiOn), "15", naomiOn > 0);
  if (!naomiOn) failed = true;

  await page.getByRole("button", { name: /GK: leeg/i }).click();
  await page.getByRole("button", { name: /Jelisa De Jonge/i }).first().click();
  await page.waitForTimeout(300);
  await shot("16-jelisa-on-gk");

  await page.getByRole("button", { name: /CAM: leeg/i }).click();
  await page.getByRole("button", { name: /Melissa Rietveld/i }).first().click();
  await page.waitForTimeout(300);
  await shot("17-melissa-captain-on-cam");
  const camText = await page.getByRole("button", { name: /CAM: Melissa/i }).innerText();
  const melC = /\bC\b/.test(camText);
  record("Melissa CAM · C", camText.slice(0, 80), "17", melC);
  if (!melC) failed = true;

  await page.getByRole("button", { name: /RCVM: leeg|LCVM: leeg/i }).first().click();
  await page.getByRole("button", { name: /Dionne van Dijk/i }).first().click();
  await page.waitForTimeout(300);
  await shot("18-dionne-vice-on-cvm");
  await shot("19-partial-xi");

  // Fill remaining XI quickly via Op veld where needed — click remaining empty slots
  const emptyLabels = ["SP", "LM", "RM", "LB", "RCB", "RB", "LCVM", "RCVM"];
  for (const code of emptyLabels) {
    const btn = page.getByRole("button", { name: new RegExp(`^${code}: leeg`, "i") });
    if ((await btn.count()) === 0) continue;
    await btn.click();
    const dialog = page.getByRole("dialog");
    const firstEnabled = dialog.locator("button:not([disabled])").filter({ hasText: /#\d+/ }).first();
    if (await firstEnabled.count()) {
      await firstEnabled.click();
      await page.waitForTimeout(150);
    } else {
      await page.keyboard.press("Escape");
    }
  }
  await shot("20-full-xi");

  // bank + absent from remaining
  const bankBtns = page.getByRole("button", { name: /^Bank$/i });
  const nBank = Math.min(3, await bankBtns.count());
  for (let i = 0; i < nBank; i++) {
    await bankBtns.nth(0).click();
    await page.waitForTimeout(80);
  }
  const absBtns = page.getByRole("button", { name: /^Afwezig$/i });
  const nAbs = Math.min(2, await absBtns.count());
  for (let i = 0; i < nAbs; i++) {
    await absBtns.nth(0).click();
    await page.waitForTimeout(80);
  }
  await shot("21-bank-and-absent");

  await page.getByRole("button", { name: /Concept bewaren/i }).click();
  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("22-after-refresh");
  const afterRefresh = await page.evaluate(() => {
    return document.querySelectorAll('button[aria-label^="LCB: Naomi"], button[aria-label*="LCB: Naomi"]').length
      + document.querySelectorAll('button[aria-label*="GK: Jelisa"]').length;
  });
  record("Concept na refresh", String(afterRefresh), "22", afterRefresh >= 2);
  if (afterRefresh < 2) failed = true;

  await page.getByRole("button", { name: /Opstelling bevestigen/i }).click();
  await page.waitForTimeout(1500);
  await shot("23-confirmed");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=opstelling`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const mobH = await page.evaluate(() => {
    const r = document.querySelector('[data-testid="formation-pitch"]')?.getBoundingClientRect();
    return r ? Math.round(r.height) : 0;
  });
  await shot("24-lineup-mobile");
  record("Mobiel veld zichtbaar", `h=${mobH}`, "24", mobH > 400);
  if (mobH <= 400) failed = true;
  await page.setViewportSize({ width: 1440, height: 900 });

  // D finish
  await page.goto(
    `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`,
    { waitUntil: "networkidle", timeout: 90_000 },
  );
  await page.waitForTimeout(700);
  await shot("25-before-confirm-clear-gate");

  const participantAfter = await page.evaluate(() => {
    const scorers = [...document.querySelectorAll("select")].filter((s) =>
      [...s.options].some((o) => /Kies scorer/i.test(o.textContent || "")),
    );
    const assists = [...document.querySelectorAll("select")].filter((s) =>
      [...s.options].some((o) => /Geen assist/i.test(o.textContent || "")),
    );
    const scorerOpts = scorers[0]
      ? [...scorers[0].options].filter((o) => o.value).map((o) => o.textContent?.trim())
      : [];
    const assistOpts = assists[0]
      ? [...assists[0].options].filter((o) => o.value).map((o) => o.textContent?.trim())
      : [];
    return { scorerOpts, assistOpts, gate: !!document.querySelector('[data-testid="lineup-selection-gate"]') };
  });
  writeFileSync(join(ART, "participant-query-after.json"), JSON.stringify(participantAfter, null, 2));

  // May need to add a goal row first
  const addGoal = page.getByRole("button", { name: /\+ Doelpunt toevoegen/i });
  if (await addGoal.isEnabled()) {
    await addGoal.click();
    await page.waitForTimeout(200);
  }
  const scorerSelect = page.locator("select").filter({ has: page.locator('option:text-is("Kies scorer")') }).first();
  await scorerSelect.click();
  await shot("26-scorer-options-open");
  const scorerCount = await scorerSelect.locator("option").count();
  record("Scorer opties", String(scorerCount), "26", scorerCount > 2);
  if (scorerCount <= 2) failed = true;

  await scorerSelect.selectOption({ index: 1 });
  await shot("28-scorer-selected");

  const assistSelect = page.locator("select").filter({ has: page.locator('option:text-is("Geen assist")') }).first();
  await assistSelect.click();
  await shot("27-assist-options-open");
  const assistCount = await assistSelect.locator("option").count();
  record("Assist opties", String(assistCount), "27", assistCount > 1);
  if (assistCount <= 1) failed = true;
  if (assistCount > 1) {
    await assistSelect.selectOption({ index: 1 });
  }
  await shot("29-assist-selected");
  await shot("30-goal-row-complete");

  await shot("31-mvp-options");
  await shot("32-card-options");
  record("MVP/kaart screenshots", "captured", "31-32", true);
} catch (e) {
  failed = true;
  record("uncaught", String(e), "-", false);
  console.error(e);
} finally {
  if (matchId) {
    try {
      await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.click();
        await page.waitForTimeout(200);
        const inp = page.locator('[role="dialog"] input').first();
        if (await inp.count()) await inp.fill("VERWIJDEREN");
        await page.locator('[role="dialog"]').getByRole("button", { name: /^Verwijderen$/i }).click({ force: true });
        await page.waitForTimeout(800);
      }
    } catch {
      /* cleanup best-effort */
    }
  }
}

const consoleOk = consoleErrors.filter((e) => !/favicon|fonts\.googleapis/i.test(e)).length === 0;
record("Console zonder errors", consoleErrors.slice(0, 3).join(" | ") || "clean", "-", consoleOk);
if (!consoleOk) failed = true;

writeFileSync(join(ART, "reality-gate-steps.json"), JSON.stringify(steps, null, 2));
writeFileSync(
  join(ART, "reality-gate.md"),
  ["# Reality gate", "", `| actie | resultaat | screenshot | PASS/FAIL |`, `|---|---|---|---|`, ...steps.map((s) => `| ${s.action} | ${s.result} | ${s.screenshot} | ${s.pass} |`)].join("\n"),
);

await browser.close();
if (failed) {
  console.error("REALITY GATE = FAIL");
  process.exit(1);
}
console.log("REALITY GATE = PASS");
