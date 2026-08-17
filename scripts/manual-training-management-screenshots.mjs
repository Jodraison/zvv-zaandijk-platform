/**
 * Screenshots + QA fixture lifecycle for flexibel trainingsbeheer.
 * Run after auth state + deploy/local:
 *   node --env-file=.env.local scripts/final-ops-auth-state.mjs
 *   node --env-file=.env.local scripts/manual-training-management-screenshots.mjs
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const OUT = ".review-screenshots/manual-training-management";
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
const QA_MOVED_AT = "2026-08-26T17:30:00.000Z"; // 19:30 Amsterdam CEST
const QA_AT = "2026-08-25T17:30:00.000Z";

async function ensureQa() {
  await sb.from("training_attendance").delete().eq("session_id", QA_ID);
  await sb.from("training_sessions").delete().eq("id", QA_ID);
  const { error } = await sb.from("training_sessions").insert({
    id: QA_ID,
    season_id: SEASON,
    title: "[QA] Extra training",
    session_at: QA_AT,
    location: "19:30–20:45 · QA fixture",
    status: "scheduled",
  });
  if (error) throw error;
}

async function cleanupQa() {
  await sb.from("training_attendance").delete().eq("session_id", QA_ID);
  await sb.from("training_sessions").delete().eq("id", QA_ID);
}

const notes = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function shot(name, pathOrFn) {
  if (typeof pathOrFn === "string") {
    const res = await page.goto(pathOrFn, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);
    const status = res?.status() ?? 0;
    const pathOnly = new URL(page.url()).pathname;
    const ok = status < 400 && !pathOnly.includes("/login");
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
    notes.push({ name, pathOnly, status, ok, url: page.url() });
    if (!ok) throw new Error(`Failed ${name}`);
    return;
  }
  await pathOrFn();
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  notes.push({ name, pathOnly: new URL(page.url()).pathname, status: 200, ok: true, url: page.url() });
}

try {
  await ensureQa();

  await shot(
    "01-training-overview-10-12-17-aug",
    `${BASE}/beheer/training?${q}`,
  );

  await shot(
    "02-10-aug-attendance-open",
    `${BASE}/beheer/training?${q}&session=2026-08-10&sid=1a2e8c35-586b-47a7-b049-079fbfb63fe9`,
  );

  await shot(
    "03-12-aug-session",
    `${BASE}/beheer/training?${q}&session=2026-08-12&sid=c2e087d5-b6c6-40e1-b0c5-511a6085e5cc`,
  );

  await shot("04-add-training-button", async () => {
    await page.goto(`${BASE}/beheer/training?${q}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);
    const btn = page.getByRole("button", { name: "+ Training toevoegen" });
    await btn.waitFor({ state: "visible", timeout: 15000 });
  });

  await shot("05-new-training-form", async () => {
    await page.getByRole("button", { name: "+ Training toevoegen" }).click();
    await page.getByRole("heading", { name: "Nieuwe training" }).waitFor({ timeout: 10000 });
  });

  await shot(
    "06-created-extra-training",
    `${BASE}/beheer/training?${q}&session=2026-08-25&sid=${QA_ID}`,
  );

  // Edit QA → 26 aug
  await sb
    .from("training_sessions")
    .update({
      session_at: QA_MOVED_AT,
      location: "19:30–20:45 · QA verplaatst",
      title: "[QA] Extra training",
    })
    .eq("id", QA_ID);

  await shot("07-edit-training", async () => {
    await page.goto(`${BASE}/beheer/training?${q}&sid=${QA_ID}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);
    const edit = page.getByRole("button", { name: "Training wijzigen" });
    if (await edit.count()) {
      await edit.click();
      await page.getByRole("heading", { name: "Training wijzigen" }).waitFor({ timeout: 10000 });
    }
  });

  await sb.from("training_sessions").update({ status: "cancelled", title: "Afgelast: [QA] Extra training" }).eq("id", QA_ID);

  await shot(
    "08-cancel-training",
    `${BASE}/beheer/training?${q}&sid=${QA_ID}`,
  );

  await shot("09-delete-test-training", async () => {
    await page.goto(`${BASE}/beheer/training?${q}&sid=${QA_ID}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(600);
    // Soft visual: show delete control if present; hard delete via API cleanup below.
    const del = page.getByRole("button", { name: "Training verwijderen" });
    notes.push({ name: "09-delete-control-visible", ok: (await del.count()) > 0 });
  });

  await shot("10-dashboard-open-attendance-task", `${BASE}/beheer?${q}`);

  await shot("11-mobile-training-overview", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/beheer/training?${q}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(900);
  });
} finally {
  await cleanupQa();
  await browser.close();
  writeFileSync(join(OUT, "notes.json"), JSON.stringify({ base: BASE, qaId: QA_ID, notes }, null, 2));
  console.log(JSON.stringify({ out: OUT, base: BASE, notes }, null, 2));
}
