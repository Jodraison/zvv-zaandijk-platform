/**
 * Final ops E2E with real DB write + publish.
 * Run: node --env-file=.env.local scripts/final-ops-e2e.mjs
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const AUTH = ".review-auth/admin-storage.json";
const SESSION_A = "a0000001-0000-4000-8000-0000000000a1";
const SESSION_B = "a0000001-0000-4000-8000-0000000000b2";
const SESSION_C = "a0000001-0000-4000-8000-0000000000c3";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const q = `?season=${encodeURIComponent(SEASON)}`;

assert.ok(existsSync(AUTH), "auth storage missing");
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("othxhnkwkygggkktvosp"), "wrong project");

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function open(path) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90000 });
  const status = res?.status() ?? 0;
  const p = new URL(page.url()).pathname;
  assert.ok(status < 400, `HTTP ${status} for ${path}`);
  assert.ok(!p.includes("/login"), `redirected to login for ${path}`);
  return page.locator("body").innerText();
}

async function fillStation(station, fillValue) {
  await open(`/beheer/fitheid/${SESSION_C}/station/${station}${q}`);
  const mode = station === "run" ? "numeric" : "decimal";
  const inputs = page.locator(`ul input[inputmode='${mode}']:not([disabled])`);
  const count = await inputs.count();
  assert.ok(count >= 10, `${station} inputs ${count}`);
  const t0 = Date.now();
  const n = Math.min(21, count);
  for (let i = 0; i < n; i++) {
    const input = inputs.nth(i);
    await input.click({ force: true });
    await input.fill(typeof fillValue === "function" ? fillValue(i) : fillValue);
    if (i < n - 1) await input.press("Enter");
  }
  const fillMs = Date.now() - t0;
  await page.getByRole("button", { name: /Concept opslaan/i }).click();
  await page.waitForTimeout(3500);
  const body = await page.locator("body").innerText();
  assert.match(body, /Opgeslagen/i);
  return { n, fillMs };
}

{
  const t = await open(`/beheer${q}`);
  assert.match(t, /Football Operations/i);
  console.log("e2e dashboard ok");
}

// Reopen C as concept so station write + publish can be proven on a real /beheer route.
{
  const { error } = await sb
    .from("fitness_test_sessions")
    .update({ status: "draft", published_at: null, updated_at: new Date().toISOString() })
    .eq("id", SESSION_C);
  assert.equal(error, null, error?.message ?? "reopen C failed");
  console.log("e2e session C reopened as draft");
}

{
  const sprint = await fillStation("sprint", (i) => String((4.5 + i * 0.05).toFixed(2)).replace(".", ","));
  assert.ok(sprint.fillMs <= 240000);
  const { count } = await sb
    .from("fitness_test_results")
    .select("*", { count: "exact", head: true })
    .eq("session_id", SESSION_C)
    .not("flying_sprint_30m_seconds", "is", null);
  assert.ok((count ?? 0) >= 20, `sprint db count ${count}`);
  console.log(JSON.stringify({ sprintSpeed: sprint, dbSprint: count }));
}

{
  await fillStation("agility", (i) => String((16 + i * 0.1).toFixed(2)).replace(".", ","));
  await fillStation("plank", (i) => {
    const sec = 120 + i;
    const mm = Math.floor(sec / 60);
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  });
  await fillStation("run", (i) => String(1300 + i * 10));
  console.log("e2e four stations saved");
}

{
  await open(`/beheer/fitheid/${SESSION_C}/controle${q}`);
  await page.getByRole("button", { name: /Testmoment definitief maken/i }).click();
  await page.getByRole("button", { name: /Ja, definitief maken/i }).click();
  await page.waitForTimeout(5000);
  const { data: sess } = await sb.from("fitness_test_sessions").select("status").eq("id", SESSION_C).single();
  assert.equal(sess?.status, "published");
  console.log("e2e publish ok");
}

{
  const t = await open(`/ranking${q}&view=fitheid`);
  assert.match(t, /01-11-2026|1 november|Actuele fitheidsranking/i);
  console.log("e2e current ranking switched to C");
}

{
  const t = await open(`/ranking${q}&view=historie&session=${SESSION_A}`);
  assert.match(t, /30 augustus|30-08-2026/i);
  const t2 = await open(`/ranking${q}&view=historie&session=${SESSION_B}`);
  assert.match(t2, /11 oktober|11-10-2026/i);
  console.log("e2e history A+B intact");
}

{
  const t = await open(`/${q}`);
  assert.match(t, /Performance spotlight|Leider actuele fitheidstest/i);
  console.log("e2e homepage spotlight ok");
}

{
  const t = await open(`/beheer/seizoenen`);
  assert.doesNotMatch(t, /\bENUM\b|TEKST OP SITE|provisional/i);
  console.log("e2e seasons ok");
}

await browser.close();
console.log("final-ops-e2e: ok");
