/**
 * Idempotent: voeg trainingssessies toe voor 10 + 12 augustus 2026 (seizoen 2026/27).
 * Geen attendance-rijen. Geen historische deletes.
 * Project: othxhnkwkygggkktvosp
 *
 * Run: npx tsx scripts/reconcile-manual-training-aug-2026.ts
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { clubLocalDateTimeToIso, SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import { trainingDateKeyAmsterdam } from "../src/lib/training/manual-training";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "manual-training-management");
mkdirSync(BACKUP_DIR, { recursive: true });

const TARGET_DATES = ["2026-08-10", "2026-08-12"] as const;
const KEEP_DATE = "2026-08-17";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) {
  throw new Error(`Wrong Supabase project: ${url}`);
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

const sb = createClient(url, key, { auth: { persistSession: false } });

type Sess = {
  id: string;
  season_id: string;
  title: string | null;
  session_at: string;
  location: string | null;
  status: string;
};

async function main() {
  const stamp = Date.now();

  const { data: beforeSessions, error: sErr } = await sb
    .from("training_sessions")
    .select("id, season_id, title, session_at, location, status")
    .eq("season_id", SEASON_2026_27_ID)
    .order("session_at", { ascending: true });
  if (sErr) throw sErr;

  const beforeIds = (beforeSessions ?? []).map((s) => s.id);
  const { data: beforeAtt, error: aErr } = await sb
    .from("training_attendance")
    .select("session_id, player_id, present")
    .in("session_id", beforeIds.length ? beforeIds : ["00000000-0000-0000-0000-000000000000"]);
  if (aErr) throw aErr;

  writeFileSync(
    join(BACKUP_DIR, `training-sessions-before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        season_id: SEASON_2026_27_ID,
        timestamp: new Date().toISOString(),
        sessions: beforeSessions,
        attendance_for_season_sessions: beforeAtt,
      },
      null,
      2,
    ),
  );

  const sessions = (beforeSessions ?? []) as Sess[];
  const inserted: Sess[] = [];
  const skipped: { date: string; reason: string; id?: string }[] = [];

  for (const dateYmd of TARGET_DATES) {
    const onDate = sessions.filter((s) => trainingDateKeyAmsterdam(s.session_at) === dateYmd);
    const wantedAt = clubLocalDateTimeToIso(dateYmd, "20:00");
    const exact = onDate.find(
      (s) =>
        s.session_at === wantedAt &&
        s.status !== "cancelled" &&
        (s.location == null || s.location.includes("20:00")),
    );
    if (exact) {
      skipped.push({ date: dateYmd, reason: "exact_match", id: exact.id });
      continue;
    }
    if (onDate.length > 0) {
      const conflict = onDate[0]!;
      // Conflicterende sessie op dezelfde kalenderdag: niet dupliceren; wel loggen.
      skipped.push({
        date: dateYmd,
        reason: `conflict_existing_${conflict.id}_${conflict.session_at}_${conflict.status}`,
        id: conflict.id,
      });
      console.warn("CONFLICT — analyseer vóór handmatige fix:", {
        dateYmd,
        existing: onDate,
        wantedAt,
      });
      continue;
    }

    const row: Sess = {
      id: randomUUID(),
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: wantedAt,
      location: "20:00–21:00",
      status: "scheduled",
    };
    const { error: insErr } = await sb.from("training_sessions").insert(row);
    if (insErr) throw insErr;
    inserted.push(row);
    sessions.push(row);
  }

  const { data: afterSessions, error: afterErr } = await sb
    .from("training_sessions")
    .select("id, season_id, title, session_at, location, status")
    .eq("season_id", SEASON_2026_27_ID)
    .order("session_at", { ascending: true });
  if (afterErr) throw afterErr;

  const afterIds = (afterSessions ?? []).map((s) => s.id);
  const { data: afterAtt, error: afterAErr } = await sb
    .from("training_attendance")
    .select("session_id, player_id, present")
    .in("session_id", afterIds.length ? afterIds : ["00000000-0000-0000-0000-000000000000"]);
  if (afterAErr) throw afterAErr;

  const summary = {
    project_ref: PROJECT,
    season_id: SEASON_2026_27_ID,
    timestamp: new Date().toISOString(),
    inserted,
    skipped,
    targets: TARGET_DATES.map((d) => {
      const hits = (afterSessions as Sess[]).filter((s) => trainingDateKeyAmsterdam(s.session_at) === d);
      return {
        date: d,
        count: hits.length,
        sessions: hits,
        attendance_rows: (afterAtt ?? []).filter((a) => hits.some((h) => h.id === a.session_id)).length,
      };
    }),
    keep_17_aug: {
      date: KEEP_DATE,
      sessions: (afterSessions as Sess[]).filter((s) => trainingDateKeyAmsterdam(s.session_at) === KEEP_DATE),
    },
    before_count: sessions.length - inserted.length,
    after_count: (afterSessions ?? []).length,
  };

  writeFileSync(join(BACKUP_DIR, `training-sessions-after-${stamp}.json`), JSON.stringify({ sessions: afterSessions, attendance: afterAtt }, null, 2));
  writeFileSync(join(BACKUP_DIR, `reconcile-summary-${stamp}.json`), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify(summary, null, 2));
  for (const t of summary.targets) {
    if (t.count !== 1) {
      console.error(`FAIL: expected exactly 1 session on ${t.date}, got ${t.count}`);
      process.exit(1);
    }
    if (t.attendance_rows !== 0) {
      console.error(`FAIL: unexpected attendance on ${t.date}`);
      process.exit(1);
    }
  }
  if (summary.keep_17_aug.sessions.length < 1) {
    console.error("FAIL: 17 augustus sessie ontbreekt");
    process.exit(1);
  }
  console.log("OK reconcile-manual-training-aug-2026");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
