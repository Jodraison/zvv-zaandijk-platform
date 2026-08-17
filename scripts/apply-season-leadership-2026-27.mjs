/**
 * Zet seizoen 2026/27 leiderschap: Melissa = captain, Dionne = vice.
 * Backup JSON onder .review-backups/four-blockers-real-browser-recovery/
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const CAPTAIN = "Melissa Rietveld";
const VICE = "Dionne van Dijk";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "four-blockers-real-browser-recovery");
mkdirSync(BACKUP_DIR, { recursive: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
if (!String(url || "").includes("othxhnkwkygggkktvosp")) {
  throw new Error(`Wrong Supabase project: ${url}`);
}
const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows, error } = await sb
  .from("player_season_memberships")
  .select("id,player_id,season_id,is_captain,is_vice_captain,shirt_number,players(full_name)")
  .eq("season_id", SEASON);
if (error) throw error;

writeFileSync(
  join(BACKUP_DIR, `memberships-leadership-before-${Date.now()}.json`),
  JSON.stringify(rows, null, 2),
);

const byName = (name) =>
  (rows || []).find((r) => (r.players?.full_name || "").trim().toLowerCase() === name.toLowerCase());
const cap = byName(CAPTAIN);
const vice = byName(VICE);
if (!cap || !vice) throw new Error(`Missing membership: cap=${!!cap} vice=${!!vice}`);

const { error: clearErr } = await sb
  .from("player_season_memberships")
  .update({ is_captain: false, is_vice_captain: false })
  .eq("season_id", SEASON);
if (clearErr) throw clearErr;

const { error: c1 } = await sb
  .from("player_season_memberships")
  .update({ is_captain: true, is_vice_captain: false })
  .eq("id", cap.id);
if (c1) throw c1;

const { error: c2 } = await sb
  .from("player_season_memberships")
  .update({ is_captain: false, is_vice_captain: true })
  .eq("id", vice.id);
if (c2) throw c2;

const { data: after } = await sb
  .from("player_season_memberships")
  .select("id,is_captain,is_vice_captain,players(full_name)")
  .eq("season_id", SEASON)
  .or("is_captain.eq.true,is_vice_captain.eq.true");

const caps = (after || []).filter((r) => r.is_captain);
const vices = (after || []).filter((r) => r.is_vice_captain);
if (caps.length !== 1 || vices.length !== 1) {
  throw new Error(`Validation failed: ${caps.length} captains, ${vices.length} vices`);
}
if (caps[0].players?.full_name !== CAPTAIN || vices[0].players?.full_name !== VICE) {
  throw new Error("Wrong names after update");
}

writeFileSync(join(BACKUP_DIR, "memberships-leadership-after.json"), JSON.stringify(after, null, 2));
console.log("OK", { captain: CAPTAIN, vice: VICE, caps: caps.length, vices: vices.length });
