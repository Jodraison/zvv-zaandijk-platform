/**
 * Read-only backup of training attendance before performance-center work.
 * Run: npx tsx scripts/backup-training-performance-center.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "training-performance-center");
mkdirSync(BACKUP_DIR, { recursive: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(PROJECT)) throw new Error("Wrong project");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const stamp = Date.now();
  const { data: sessions } = await sb
    .from("training_sessions")
    .select("id,season_id,title,session_at,location,status")
    .eq("season_id", SEASON_2026_27_ID)
    .order("session_at");
  const ids = (sessions ?? []).map((s) => s.id);
  const { data: attendance } = await sb
    .from("training_attendance")
    .select("session_id,player_id,present,note")
    .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data: members } = await sb
    .from("player_season_memberships")
    .select("player_id,shirt_number,is_guest")
    .eq("season_id", SEASON_2026_27_ID);

  writeFileSync(
    join(BACKUP_DIR, `before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        timestamp: new Date().toISOString(),
        sessions,
        attendance,
        player_ids: (members ?? []).map((m) => m.player_id),
        attendance_values: attendance,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      sessions: sessions?.length,
      attendance: attendance?.length,
      present: (attendance ?? []).filter((a) => a.present).length,
      absent: (attendance ?? []).filter((a) => !a.present).length,
      notesSet: (attendance ?? []).filter((a) => a.note).length,
      players: members?.length,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
