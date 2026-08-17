import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

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

const { data: matches } = await sb
  .from("matches")
  .select("id,opponent")
  .ilike("opponent", "OWF FourBlock%");

console.log("found", matches?.length, matches);
for (const m of matches || []) {
  const id = m.id;
  for (const table of [
    "match_goal_events",
    "match_card_events",
    "match_substitutions",
    "match_position_changes",
    "match_player_stats",
    "match_lineup_entries",
    "match_matchday_roster",
  ]) {
    await sb.from(table).delete().eq("match_id", id);
  }
  const { error } = await sb.from("matches").delete().eq("id", id);
  console.log("deleted", id, m.opponent, error?.message || "ok");
}
