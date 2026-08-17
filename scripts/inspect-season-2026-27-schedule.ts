/**
 * Read-only preflight for season 2026/27 matches + fitness sessions.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) throw new Error(`Wrong project: ${url}`);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: matches, error: mErr } = await sb
  .from("matches")
  .select("id,opponent,kickoff_at,is_home,match_type,status,notes,lineup_status")
  .eq("season_id", SEASON_2026_27_ID)
  .order("kickoff_at", { ascending: true });
if (mErr) throw mErr;

const { data: sessions, error: sErr } = await sb
  .from("fitness_test_sessions")
  .select("id,test_on,status,note,published_at,protocol_code")
  .eq("season_id", SEASON_2026_27_ID)
  .order("test_on", { ascending: true });
if (sErr) throw sErr;

console.log(JSON.stringify({ project_ref: PROJECT, match_count: matches?.length ?? 0, matches, session_count: sessions?.length ?? 0, sessions }, null, 2));
