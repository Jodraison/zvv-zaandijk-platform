/**
 * Verwijder QA/demo-wedstrijden (OWF Accept/Debug, timestamp-QA, vfdvgs, …)
 * uit de actieve datastore via bestaande delete-contract.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ART = join(process.cwd(), ".review-artifacts", "visual-product-rebuild-lineup-reality");
mkdirSync(ART, { recursive: true });

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const patterns = [
  /^UX Final\b/i,
  /^Ketenherstel\b/i,
  /^Debug FC\b/i,
  /^Test FC\b/i,
  /^QA[\s_-]/i,
  /^OWF\b/i,
  /^vfdvgs$/i,
  /\b\d{13,}\b/,
];

function isQa(opponent, notes) {
  const n = (opponent || "").trim();
  if (patterns.some((re) => re.test(n))) return true;
  if ((notes || "").includes("__qa_fixture__")) return true;
  return false;
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data: matches, error } = await sb.from("matches").select("id, opponent, notes, status, season_id");
if (error) {
  console.error(error);
  process.exit(1);
}

const doomed = (matches || []).filter((m) => isQa(m.opponent, m.notes));
console.log("QA matches to delete:", doomed.length, doomed.map((m) => m.opponent));

const deleted = [];
for (const m of doomed) {
  // child tables — best-effort by match_id
  for (const table of [
    "match_matchday_roster",
    "match_lineup_entries",
    "match_card_events",
    "match_substitutions",
    "match_position_changes",
    "match_player_stats",
    "match_goal_events",
  ]) {
    await sb.from(table).delete().eq("match_id", m.id);
  }
  const { error: delErr } = await sb.from("matches").delete().eq("id", m.id);
  if (delErr) console.error("fail", m.id, delErr.message);
  else deleted.push({ id: m.id, opponent: m.opponent });
}

const report = {
  at: new Date().toISOString(),
  found: doomed.length,
  deleted: deleted.length,
  deletedRows: deleted,
};
writeFileSync(join(ART, "demo-data-cleanup.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
