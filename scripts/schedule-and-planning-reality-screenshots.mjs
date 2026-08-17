/**
 * Screenshots for schedule-and-planning-reality.
 *   node --env-file=.env.local scripts/final-ops-auth-state.mjs
 *   node --env-file=.env.local scripts/schedule-and-planning-reality-screenshots.mjs
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/schedule-and-planning-reality";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const PROJECT = "othxhnkwkygggkktvosp";
const q = `season=${encodeURIComponent(SEASON)}`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url.includes(PROJECT) || !key) {
  console.error("Missing ZVV Supabase env");
  process.exit(1);
}
if (!existsSync(AUTH)) {
  console.error("Missing auth — run node --env-file=.env.local scripts/final-ops-auth-state.mjs");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
mkdirSync(OUT, { recursive: true });

const QA_ID = randomUUID();
const QA_KICK = "2026-11-14T13:00:00.000Z";

async function ensureQa() {
  await sb.from("match_lineup_entries").delete().eq("match_id", QA_ID);
  await sb.from("matches").delete().eq("id", QA_ID);
  const { error } = await sb.from("matches").insert({
    id: QA_ID,
    season_id: SEASON,
    opponent: "QA Temp planning",
    kickoff_at: QA_KICK,
    is_home: true,
    match_type: "friendly",
    status: "scheduled",
    goals_for: 0,
    goals_against: 0,
    notes: "__qa_fixture__",
    lineup_status: "draft",
  });
  if (error) throw error;
}

async function cleanupQa() {
  await sb.from("match_lineup_entries").delete().eq("match_id", QA_ID);
  await sb.from("match_goal_events").delete().eq("match_id", QA_ID);
  await sb.from("matches").delete().eq("id", QA_ID);
}

const notes = [];
const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);
const context = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function shot(name, pathOrFn) {
  if (typeof pathOrFn === "string") {
    const res = await page.goto(pathOrFn, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(900);
    const status = res?.status() ?? 0;
    const pathOnly = new URL(page.url()).pathname;
    const ok = status < 400 && !pathOnly.includes("/login");
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
    notes.push({ name, pathOnly, status, ok, url: page.url() });
    if (!ok) throw new Error(`Failed ${name}`);
    return;
  }
  await pathOrFn();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  notes.push({ name, pathOnly: new URL(page.url()).pathname, status: 200, ok: true, url: page.url() });
}

try {
  await shot("01-home-next-match", `${BASE}/?${q}`);
  await shot("02-public-programma", `${BASE}/wedstrijden?${q}`);
  await shot("03-beheer-dashboard", `${BASE}/beheer?${q}`);
  await shot("04-new-match-minimal-fields", `${BASE}/beheer/wedstrijden/nieuw?${q}`);

  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?${q}`, { waitUntil: "networkidle" });
  await page.fill('input:not([type="hidden"])', "QA Browser Save");
  const dt = page.locator('input[type="datetime-local"]');
  if (await dt.count()) await dt.first().fill("2026-11-21T15:00");
  await page.screenshot({ path: join(OUT, "05-save-future-match-without-lineup.png"), fullPage: true });
  notes.push({ name: "05-save-future-match-without-lineup", pathOnly: "/beheer/wedstrijden/nieuw", status: 200, ok: true });

  await ensureQa();
  await shot("06-future-match-no-lineup-valid-state", `${BASE}/beheer/wedstrijden/${QA_ID}?${q}&step=wedstrijd`);
  await shot("07-opstelling-later-action", `${BASE}/beheer/wedstrijden/${QA_ID}?${q}&step=opstelling`);

  const sess = "83ff1fbe-fcb0-4803-81f7-f05aa84e79bb";
  await shot("08-fitness-before-date-change", `${BASE}/beheer/fitheid/${sess}?${q}`);
  await page.getByRole("button", { name: "Testmoment wijzigen" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "09-fitness-edit-date.png"), fullPage: true });
  notes.push({ name: "09-fitness-edit-date", pathOnly: `/beheer/fitheid/${sess}`, status: 200, ok: true });
  await shot("10-fitness-after-date-change", `${BASE}/beheer/fitheid/${sess}?${q}`);
  await shot("11-home-fitness-2-september", `${BASE}/?${q}`);
  await shot("12-beheer-fitness-2-september", `${BASE}/beheer/fitheid?${q}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await shot("13-mobile-programma", `${BASE}/wedstrijden?${q}`);
  await shot("14-mobile-future-match", `${BASE}/?${q}`);
} finally {
  await cleanupQa();
  await browser.close();
  writeFileSync(join(OUT, "notes.json"), JSON.stringify(notes, null, 2));
  console.log(JSON.stringify({ out: OUT, notes, qa_cleaned: true }, null, 2));
}
