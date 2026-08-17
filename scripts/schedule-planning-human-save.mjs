/**
 * Human reality: save a future match with only planning fields, then cleanup.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";

const BASE = process.env.FINAL_OPS_BASE_URL ?? "http://localhost:3000";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const PROJECT = "othxhnkwkygggkktvosp";
const opponent = `QA Temp ${Date.now()}`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url.includes(PROJECT) || !existsSync(AUTH)) {
  console.error("Missing env or auth");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);
const context = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
let createdId = null;

try {
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, { waitUntil: "networkidle" });
  await page.getByLabel("Tegenstander").fill(opponent);
  await page.locator('input[type="datetime-local"]').fill("2026-11-21T15:00");
  await page.getByLabel("Thuis / uit").selectOption("false");
  await page.getByLabel("Wedstrijdtype").selectOption("cup");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await page.waitForURL(/\/beheer\/wedstrijden/, { timeout: 30000 });
  await page.waitForTimeout(800);
  const path = new URL(page.url()).pathname;
  const { data, error } = await sb
    .from("matches")
    .select("id,opponent,status,lineup_status,kickoff_at,is_home,match_type")
    .eq("season_id", SEASON)
    .eq("opponent", opponent);
  if (error) throw error;
  createdId = data?.[0]?.id ?? null;
  const { data: lineup } = createdId
    ? await sb.from("match_lineup_entries").select("id").eq("match_id", createdId)
    : { data: [] };
  console.log(
    JSON.stringify(
      {
        redirected_to: path,
        saved: data?.[0] ?? null,
        lineup_rows: lineup?.length ?? 0,
        pass: !!createdId && data[0].status === "scheduled" && (lineup?.length ?? 0) === 0 && path.includes("/beheer/wedstrijden"),
      },
      null,
      2,
    ),
  );
  if (!createdId) process.exit(1);
} finally {
  if (createdId) {
    await sb.from("match_lineup_entries").delete().eq("match_id", createdId);
    await sb.from("match_goal_events").delete().eq("match_id", createdId);
    await sb.from("matches").delete().eq("id", createdId);
  }
  const { data: leftover } = await sb
    .from("matches")
    .select("id,opponent")
    .eq("season_id", SEASON)
    .like("opponent", "QA Temp%");
  console.log(JSON.stringify({ leftover_qa: leftover ?? [] }, null, 2));
  await browser.close();
}
