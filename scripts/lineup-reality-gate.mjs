/**
 * Reality Gate: echte opstelling — pitch >700px, 11 slots, picker, plaatsing.
 * Maakt tijdelijke QA-match en ruimt altijd op.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const ART = join(process.cwd(), ".review-artifacts", "visual-product-rebuild-lineup-reality");
const SHOT = join(process.cwd(), ".review-screenshots", "visual-product-rebuild-lineup-reality");
mkdirSync(ART, { recursive: true });
mkdirSync(SHOT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
let matchId = null;
const steps = [];

const mark = (step, pass, note = "") => {
  steps.push({ step, result: pass ? "PASS" : "FAIL", note });
  console.log(pass ? "PASS" : "FAIL", step, note);
};

async function shot(name) {
  await page.screenshot({ path: join(SHOT, `${name}.png`), fullPage: true });
}

try {
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const stamp = Date.now();
  await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(`OWF Reality ${stamp}`);
  await page.locator('input[type="datetime-local"]').fill("2026-08-20T15:00");
  await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
  await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
  matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1] ?? null;
  mark("1_open_match_opstelling", !!matchId, page.url());
  await page.waitForTimeout(800);

  const diag = await page.evaluate(() => {
    const pitch = document.querySelector('[data-testid="formation-pitch"]');
    if (!pitch) return { found: false };
    const r = pitch.getBoundingClientRect();
    const cs = getComputedStyle(pitch);
    return {
      found: true,
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top),
      display: cs.display,
      visibility: cs.visibility,
      heightCss: cs.height,
    };
  });
  writeFileSync(join(ART, "lineup-runtime-diagnostics.json"), JSON.stringify({ ...diag, url: page.url() }, null, 2));
  await shot("23-lineup-real-empty-visible-pitch");
  mark("2_pitch_visible", diag.found && diag.height > 700, JSON.stringify(diag));

  const emptySlots = await page.locator('button[aria-label$="leeg — speelster kiezen"]').count();
  await shot("24-lineup-11-visible-empty-slots");
  mark("3_eleven_empty_slots", emptySlots === 11, `empty=${emptySlots}`);

  await page.getByRole("button", { name: /LCB: leeg/i }).click({ force: true });
  await page.waitForTimeout(300);
  const pickerOpen = (await page.locator('[role="dialog"]').count()) > 0;
  await shot("25-lineup-player-picker");
  mark("4_click_LCB_opens_picker", pickerOpen);

  const naomi = page.locator('[role="dialog"] button').filter({ hasText: /Naomi/i }).first();
  if (await naomi.count()) {
    await naomi.click();
  } else {
    await page.evaluate(() => {
      const root = document.querySelector('[role="dialog"]');
      const btn = [...(root?.querySelectorAll("ul button") || [])].find((b) => !b.disabled);
      btn?.click();
    });
  }
  await page.waitForTimeout(400);
  await shot("26-lineup-one-player");
  const lcbFilled = (await page.getByRole("button", { name: /LCB: leeg/i }).count()) === 0;
  mark("5_player_on_LCB", lcbFilled);

  await page.getByRole("button", { name: /GK: leeg/i }).click({ force: true });
  await page.waitForTimeout(200);
  const jelisa = page.locator('[role="dialog"] button').filter({ hasText: /Jelisa|Jonge/i }).first();
  if (await jelisa.count()) await jelisa.click();
  else {
    await page.evaluate(() => {
      const root = document.querySelector('[role="dialog"]');
      const btn = [...(root?.querySelectorAll("ul button") || [])].find((b) => !b.disabled);
      btn?.click();
    });
  }
  await page.waitForTimeout(300);
  mark("6_GK_filled", (await page.getByRole("button", { name: /GK: leeg/i }).count()) === 0);

  // Fill remaining empties — altijd eerst niet-disabled speelster
  for (let guard = 0; guard < 14; guard++) {
    const left = await page.locator('button[aria-label$="leeg — speelster kiezen"]').count();
    if (left === 0) break;
    await page.locator('button[aria-label$="leeg — speelster kiezen"]').first().evaluate((el) => el.click());
    await page.waitForTimeout(200);
    if (!(await page.locator('[role="dialog"]').count())) {
      await page.locator('button[aria-label$="leeg — speelster kiezen"]').first().click({ force: true });
      await page.waitForTimeout(200);
    }
    const picked = await page.evaluate(() => {
      const root = document.querySelector('[role="dialog"]');
      if (!root) return false;
      const btn = [...root.querySelectorAll("ul button")].find(
        (b) => !b.disabled && !/leegmaken|annuleren/i.test(b.textContent || ""),
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!picked) {
      await page.keyboard.press("Escape");
      break;
    }
    await page
      .locator('[role="dialog"]')
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => page.keyboard.press("Escape"));
    await page.waitForTimeout(150);
  }
  await shot("28-lineup-full");
  mark("7_full_xi", (await page.locator('button[aria-label$="leeg — speelster kiezen"]').count()) === 0);

  // Assign rest bank/absent
  for (let i = 0; i < 40; i++) {
    if (await page.getByText(/Iedereen is ingedeeld/i).count()) break;
    await page.evaluate(() => {
      const h = [...document.querySelectorAll("h3")].find((el) => /Nog indelen/i.test(el.textContent || ""));
      if (!h) return;
      const root = h.closest("div.rounded-2xl") || h.parentElement;
      const n = root?.querySelectorAll("li").length || 0;
      const label = n > 3 ? "Bank" : "Afwezig";
      const btn = [...(root?.querySelectorAll("button") || [])].find((b) => b.textContent?.trim() === label);
      btn?.click();
    });
    await page.waitForTimeout(40);
  }
  await shot("29-lineup-bank-absent");
  mark("8_bank_absent", (await page.getByText(/Iedereen is ingedeeld/i).count()) > 0);

  await page.getByRole("button", { name: /Concept bewaren/i }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /Concept bewaard/i })
    .waitFor({ timeout: 15_000 })
    .catch(() => {});
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shot("30-lineup-after-refresh");
  const h2 = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="formation-pitch"]');
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  });
  mark("9_persist_after_refresh", h2 > 700 && (await page.locator('button[aria-label$="leeg — speelster kiezen"]').count()) === 0, `h=${h2}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await shot("31-lineup-mobile");
  const hm = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="formation-pitch"]');
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  });
  mark("10_mobile_pitch", hm > 480, `h=${hm}`);
} catch (e) {
  mark("crash", false, String(e));
  await shot("99-lineup-reality-crash");
} finally {
  if (matchId) {
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.click();
        await page.waitForTimeout(200);
        const input = page.locator('[role="dialog"] input').first();
        if (await input.count()) await input.fill("VERWIJDEREN");
        await page.locator('[role="dialog"]').getByRole("button", { name: /^Verwijderen$/i }).click({ force: true });
        await page.waitForTimeout(1000);
      }
    } catch {
      /* reported */
    }
  }
  const fails = steps.filter((s) => s.result === "FAIL");
  writeFileSync(
    join(ART, "lineup-reality-gate.md"),
    ["# Lineup Reality Gate", "", `Verdict: ${fails.length ? "NOT PASS" : "PASS"}`, "", ...steps.map((s) => `- **${s.step}:** ${s.result}${s.note ? ` — ${s.note}` : ""}`)].join("\n"),
  );
  await browser.close();
  console.log("\nDONE", { fails: fails.length });
  process.exit(fails.length ? 1 : 0);
}
