/**
 * Idempotent: reconciliëer KNVB-programma 2026/27 + verplaats fitheidstest 17-08 → 02-09.
 * Geen lineup/events. Geen brede deletes.
 * Project: othxhnkwkygggkktvosp
 *
 * Run: npx tsx scripts/reconcile-season-2026-27-schedule-reality.ts
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import {
  SEASON_2026_27_PRODUCTION_FIXTURES,
  fixtureKickoffIso,
  findExistingFixture,
} from "../src/lib/season/season-2026-27-schedule";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "season-2026-27-schedule-reality");
mkdirSync(BACKUP_DIR, { recursive: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) {
  throw new Error(`Wrong Supabase project: ${url}`);
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

const sb = createClient(url, key, { auth: { persistSession: false } });

type MatchRow = {
  id: string;
  season_id: string;
  opponent: string;
  kickoff_at: string;
  is_home: boolean;
  match_type: string | null;
  location: string | null;
  referee: string | null;
  notes: string | null;
  goals_for: number;
  goals_against: number;
  status: string;
  wotm_player_id: string | null;
  integrity_state: string | null;
  lineup_status: string | null;
};

type FitnessSession = {
  id: string;
  season_id: string;
  test_on: string;
  protocol_code: string;
  status: string;
  note: string | null;
  published_at: string | null;
};

async function main() {
  const stamp = Date.now();

  const { data: beforeMatches, error: mErr } = await sb
    .from("matches")
    .select(
      "id,season_id,opponent,kickoff_at,is_home,match_type,location,referee,notes,goals_for,goals_against,status,wotm_player_id,integrity_state,lineup_status",
    )
    .eq("season_id", SEASON_2026_27_ID)
    .order("kickoff_at", { ascending: true });
  if (mErr) throw mErr;

  const matchIds = (beforeMatches ?? []).map((m) => m.id);
  const emptyId = "00000000-0000-0000-0000-000000000000";
  const { data: beforeLineup, error: lErr } = await sb
    .from("match_lineup_entries")
    .select("id,match_id,player_id,role")
    .in("match_id", matchIds.length ? matchIds : [emptyId]);
  if (lErr) throw lErr;
  const { data: beforeEvents, error: eErr } = await sb
    .from("match_goal_events")
    .select("id,match_id")
    .in("match_id", matchIds.length ? matchIds : [emptyId]);
  if (eErr) throw eErr;
  const { data: beforeRoster, error: rErr } = await sb
    .from("match_matchday_roster")
    .select("match_id,player_id")
    .in("match_id", matchIds.length ? matchIds : [emptyId]);
  if (rErr) throw rErr;

  const { data: beforeSessions, error: sErr } = await sb
    .from("fitness_test_sessions")
    .select("id,season_id,test_on,protocol_code,status,note,published_at")
    .eq("season_id", SEASON_2026_27_ID)
    .order("test_on", { ascending: true });
  if (sErr) throw sErr;
  const sessionIds = (beforeSessions ?? []).map((s) => s.id);
  const { data: beforeResults, error: frErr } = await sb
    .from("fitness_test_results")
    .select("id,session_id,player_id,flying_sprint_30m_seconds,agility_10_20_10_seconds,plank_seconds,six_minute_run_meters,participation_status")
    .in("session_id", sessionIds.length ? sessionIds : [emptyId]);
  if (frErr) throw frErr;

  writeFileSync(
    join(BACKUP_DIR, `before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        season_id: SEASON_2026_27_ID,
        timestamp: new Date().toISOString(),
        matches: beforeMatches,
        lineup: beforeLineup,
        events: beforeEvents,
        roster: beforeRoster,
        fitness_sessions: beforeSessions,
        fitness_results: beforeResults,
      },
      null,
      2,
    ),
  );

  const matches = [...((beforeMatches ?? []) as MatchRow[])];
  const mutations: Array<{ action: "update" | "insert"; id: string; opponent: string; detail: string }> = [];

  for (const spec of SEASON_2026_27_PRODUCTION_FIXTURES) {
    const kickoff = fixtureKickoffIso(spec);
    const existing = findExistingFixture(matches, spec);
    if (existing) {
      const needs =
        existing.kickoff_at !== kickoff ||
        existing.is_home !== spec.isHome ||
        existing.match_type !== spec.matchType ||
        existing.opponent !== spec.opponent ||
        existing.status !== "scheduled";
      if (needs) {
        const { error } = await sb
          .from("matches")
          .update({
            opponent: spec.opponent,
            kickoff_at: kickoff,
            is_home: spec.isHome,
            match_type: spec.matchType,
            status: "scheduled",
          })
          .eq("id", existing.id);
        if (error) throw error;
        mutations.push({
          action: "update",
          id: existing.id,
          opponent: spec.opponent,
          detail: `${existing.kickoff_at} → ${kickoff}; type ${existing.match_type} → ${spec.matchType}`,
        });
        Object.assign(existing, {
          opponent: spec.opponent,
          kickoff_at: kickoff,
          is_home: spec.isHome,
          match_type: spec.matchType,
          status: "scheduled",
        });
      }
      continue;
    }

    const row: MatchRow = {
      id: randomUUID(),
      season_id: SEASON_2026_27_ID,
      opponent: spec.opponent,
      kickoff_at: kickoff,
      is_home: spec.isHome,
      match_type: spec.matchType,
      location: null,
      referee: null,
      notes: null,
      goals_for: 0,
      goals_against: 0,
      status: "scheduled",
      wotm_player_id: null,
      integrity_state: "verified",
      lineup_status: "draft",
    };
    const { error } = await sb.from("matches").insert(row);
    if (error) throw error;
    matches.push(row);
    mutations.push({ action: "insert", id: row.id, opponent: spec.opponent, detail: `new ${spec.date} ${spec.time}` });
  }

  const sessions = [...((beforeSessions ?? []) as FitnessSession[])];
  const fitnessMutations: Array<{ action: string; id: string; detail: string }> = [];
  const on17 = sessions.filter((s) => s.test_on === "2026-08-17" && !(s.note ?? "").startsWith("[QA]"));
  const on2 = sessions.filter((s) => s.test_on === "2026-09-02" && !(s.note ?? "").startsWith("[QA]"));
  const on7 = sessions.filter((s) => s.test_on === "2026-09-07" && !(s.note ?? "").startsWith("[QA]"));

  if (on7.length === 0 && on2.length) {
    const keep = on2[0]!;
    const { error } = await sb
      .from("fitness_test_sessions")
      .update({
        test_on: "2026-09-07",
        updated_at: new Date().toISOString(),
      })
      .eq("id", keep.id);
    if (error) throw error;
    fitnessMutations.push({ action: "move", id: keep.id, detail: "2026-09-02 → 2026-09-07" });
    keep.test_on = "2026-09-07";
  } else if (on7.length === 0 && on17.length) {
    const keep = on17[0]!;
    const { error } = await sb
      .from("fitness_test_sessions")
      .update({
        test_on: "2026-09-07",
        updated_at: new Date().toISOString(),
      })
      .eq("id", keep.id);
    if (error) throw error;
    fitnessMutations.push({ action: "move", id: keep.id, detail: "2026-08-17 → 2026-09-07" });
    keep.test_on = "2026-09-07";
  } else if (on7.length === 0 && on2.length === 0 && on17.length === 0) {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const { error } = await sb.from("fitness_test_sessions").insert({
      id: sessionId,
      season_id: SEASON_2026_27_ID,
      test_on: "2026-09-07",
      protocol_code: "four_part_v1",
      status: "draft",
      note: "Eerste meting seizoen 2026/27",
      created_at: now,
      updated_at: now,
      published_at: null,
    });
    if (error) throw error;
    fitnessMutations.push({ action: "insert", id: sessionId, detail: "created 2026-09-07 draft" });
  }

  const { data: afterMatches, error: afterMErr } = await sb
    .from("matches")
    .select(
      "id,season_id,opponent,kickoff_at,is_home,match_type,status,notes,lineup_status",
    )
    .eq("season_id", SEASON_2026_27_ID)
    .order("kickoff_at", { ascending: true });
  if (afterMErr) throw afterMErr;
  const afterIds = (afterMatches ?? []).map((m) => m.id);
  const { data: afterLineup } = await sb
    .from("match_lineup_entries")
    .select("id,match_id")
    .in("match_id", afterIds.length ? afterIds : [emptyId]);
  const { data: afterEvents } = await sb
    .from("match_goal_events")
    .select("id,match_id")
    .in("match_id", afterIds.length ? afterIds : [emptyId]);
  const { data: afterSessions, error: afterSErr } = await sb
    .from("fitness_test_sessions")
    .select("id,season_id,test_on,status,note,published_at")
    .eq("season_id", SEASON_2026_27_ID)
    .order("test_on", { ascending: true });
  if (afterSErr) throw afterSErr;

  const qaResults = (beforeResults ?? []).filter((r) => {
    const filled = [r.flying_sprint_30m_seconds, r.agility_10_20_10_seconds, r.plank_seconds, r.six_minute_run_meters].some(
      (v) => v != null,
    );
    return filled;
  });

  const summary = {
    project_ref: PROJECT,
    season_id: SEASON_2026_27_ID,
    timestamp: new Date().toISOString(),
    before_match_count: (beforeMatches ?? []).length,
    after_match_count: (afterMatches ?? []).length,
    match_mutations: mutations,
    fitness_mutations: fitnessMutations,
    fixtures: SEASON_2026_27_PRODUCTION_FIXTURES.map((spec) => {
      const hit = findExistingFixture((afterMatches ?? []) as MatchRow[], spec);
      const lineupCount = (afterLineup ?? []).filter((e) => e.match_id === hit?.id).length;
      const eventCount = (afterEvents ?? []).filter((e) => e.match_id === hit?.id).length;
      return {
        ...spec,
        id: hit?.id ?? null,
        kickoff_at: hit?.kickoff_at ?? null,
        lineup_rows: lineupCount,
        event_rows: eventCount,
      };
    }),
    fitness_after: afterSessions,
    classified_filled_fitness_results: qaResults.length,
    orphans: {
      lineup_without_match: (afterLineup ?? []).filter((e) => !afterIds.includes(e.match_id)).length,
      events_without_match: (afterEvents ?? []).filter((e) => !afterIds.includes(e.match_id)).length,
    },
  };

  writeFileSync(join(BACKUP_DIR, `after-${stamp}.json`), JSON.stringify({ matches: afterMatches, sessions: afterSessions }, null, 2));
  writeFileSync(join(BACKUP_DIR, `reconcile-summary-${stamp}.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  for (const f of summary.fixtures) {
    if (!f.id) {
      console.error(`FAIL: missing fixture ${f.date} ${f.opponent}`);
      process.exit(1);
    }
  }
  if (summary.orphans.lineup_without_match || summary.orphans.events_without_match) {
    console.error("FAIL: orphans");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
