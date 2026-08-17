import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
console.log("URL", url);
const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SEASON = "c0ffee00-0002-4000-8000-000000000001";

const { data: all, error } = await sb
  .from("player_season_memberships")
  .select("id,player_id,is_captain,is_vice_captain,shirt_number,players(full_name)")
  .eq("season_id", SEASON);
if (error) throw error;

const leaders = (all || []).filter((m) => m.is_captain || m.is_vice_captain);
const md = (all || []).filter((m) =>
  /Melissa Rietveld|Dionne van Dijk/i.test(m.players?.full_name || ""),
);
console.log("current leaders", leaders.map((m) => ({ name: m.players?.full_name, c: m.is_captain, v: m.is_vice_captain, id: m.id })));
console.log("melissa/dionne", md.map((m) => ({ name: m.players?.full_name, c: m.is_captain, v: m.is_vice_captain, id: m.id, pid: m.player_id })));
