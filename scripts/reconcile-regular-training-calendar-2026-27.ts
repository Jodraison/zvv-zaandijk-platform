/**
 * Idempotent: materialiseer ontbrekende ma/wo-trainingen seizoen 2026/27.
 * Overschrijft geen bestaande sessies of attendance.
 *
 * Run: npx tsx scripts/reconcile-regular-training-calendar-2026-27.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import { ensureRegularTrainingSessionsForSeason } from "../src/lib/training/regular-training-calendar";
import { trainingDateKeyAmsterdam } from "../src/lib/training/manual-training";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "training-calendar-date-regression");
mkdirSync(BACKUP_DIR, { recursive: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) throw new Error(`Wrong Supabase project: ${url}`);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const stamp = Date.now();
  const { data: season, error: se } = await sb
    .from("seasons")
    .select("id,name,starts_on,ends_on,is_active")
    .eq("id", SEASON_2026_27_ID)
    .maybeSingle();
  if (se) throw se;

  const { data: sessions, error: sErr } = await sb
    .from("training_sessions")
    .select("id,season_id,title,session_at,location,status")
    .eq("season_id", SEASON_2026_27_ID)
    .order("session_at", { ascending: true });
  if (sErr) throw sErr;

  const ids = (sessions ?? []).map((s) => s.id);
  const { data: attendance, error: aErr } = await sb
    .from("training_attendance")
    .select("session_id,player_id,present")
    .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (aErr) throw aErr;

  const { data: fitness, error: fErr } = await sb
    .from("fitness_test_sessions")
    .select("id,season_id,test_on,status,protocol_code,note,published_at")
    .eq("season_id", SEASON_2026_27_ID)
    .order("test_on");
  if (fErr) throw fErr;

  writeFileSync(
    join(BACKUP_DIR, `before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        timestamp: new Date().toISOString(),
        season,
        sessions,
        attendance_counts: Object.fromEntries(
          ids.map((id) => [id, (attendance ?? []).filter((a) => a.session_id === id).length]),
        ),
        attendance,
        fitness,
      },
      null,
      2,
    ),
  );

  const first = ensureRegularTrainingSessionsForSeason(sessions ?? [], SEASON_2026_27_ID, attendance ?? []);
  if (first.inserted.length) {
    const { error: insErr } = await sb.from("training_sessions").insert(
      first.inserted.map((s) => ({
        id: s.id,
        season_id: s.season_id,
        title: s.title,
        session_at: s.session_at,
        location: s.location,
        status: s.status,
      })),
    );
    if (insErr) throw insErr;
  }

  const second = ensureRegularTrainingSessionsForSeason(first.sessions, SEASON_2026_27_ID, attendance ?? []);
  const { data: after } = await sb
    .from("training_sessions")
    .select("id,title,session_at,status")
    .eq("season_id", SEASON_2026_27_ID)
    .order("session_at");
  const afterKeys = (after ?? []).map((s) => trainingDateKeyAmsterdam(s.session_at));
  const report = {
    before: (sessions ?? []).length,
    after: after?.length ?? first.sessions.length,
    inserted: first.inserted.length,
    preserved: first.preservedIds.length,
    skipped: first.skippedDates.length,
    cancelledPreserved: first.cancelledPreserved,
    attendancePreserved: first.attendancePreserved,
    secondRunInserted: second.inserted.length,
    duplicates: afterKeys.length - new Set(afterKeys).size,
    keepDates: ["2026-08-10", "2026-08-12", "2026-08-17", "2026-08-19"].map((d) => ({
      date: d,
      present: afterKeys.includes(d),
    })),
    upcomingSample: ["2026-08-24", "2026-08-26", "2026-08-31", "2026-09-02"].map((d) => ({
      date: d,
      present: afterKeys.includes(d),
    })),
  };
  writeFileSync(join(BACKUP_DIR, `after-${stamp}.json`), JSON.stringify({ report, inserted: first.inserted }, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.duplicates !== 0 || report.secondRunInserted !== 0) {
    throw new Error("Reconcile not idempotent or created duplicates");
  }
  if (report.keepDates.some((d) => !d.present) || report.upcomingSample.some((d) => !d.present)) {
    throw new Error("Required dates missing after reconcile");
  }
  console.log("OK reconcile-regular-training-calendar-2026-27");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
