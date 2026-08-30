/**
 * Idempotent: resterend competitieprogramma 2026/27 vanaf 24 oktober.
 * Raakt GEEN eerdere wedstrijden, GEEN gespeelde data, GEEN fitness/training/spelers.
 *
 * Run: npx tsx scripts/reconcile-remaining-league-program-2026-27.ts
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import {
  SEASON_2026_27_REMAINING_LEAGUE_FIXTURES,
  fixtureKickoffIso,
  findExistingFixture,
  matchCalendarDateAmsterdam,
  remainingLeagueHomeAwayCounts,
} from "../src/lib/season/season-2026-27-schedule";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "remaining-league-program-2026-27");
mkdirSync(BACKUP_DIR, { recursive: true });

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

function sameInstant(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}

async function main() {
  const counts = remainingLeagueHomeAwayCounts();
  if (SEASON_2026_27_REMAINING_LEAGUE_FIXTURES.length !== 18 || counts.home !== 9 || counts.away !== 9) {
    throw new Error("spec must be 18 fixtures, 9 home / 9 away");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  if (!url.includes(PROJECT)) throw new Error(`Wrong Supabase project: ${url}`);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  const sb = createClient(url, key, { auth: { persistSession: false } });

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
  const [lineup, goals, cards, subs, stats, roster, pos] = await Promise.all([
    sb.from("match_lineup_entries").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_goal_events").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_card_events").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_substitutions").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_player_stats").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_matchday_roster").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
    sb.from("match_position_changes").select("*").in("match_id", matchIds.length ? matchIds : [emptyId]),
  ]);
  for (const block of [lineup, goals, cards, subs, stats, roster, pos]) {
    if (block.error) throw block.error;
  }

  const stamp = Date.now();
  writeFileSync(
    join(BACKUP_DIR, `before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        season_id: SEASON_2026_27_ID,
        timestamp: new Date().toISOString(),
        matches: beforeMatches,
        match_lineup_entries: lineup.data,
        match_goal_events: goals.data,
        match_card_events: cards.data,
        match_substitutions: subs.data,
        match_player_stats: stats.data,
        match_matchday_roster: roster.data,
        match_position_changes: pos.data,
      },
      null,
      2,
    ),
  );

  const matches = [...((beforeMatches ?? []) as MatchRow[])];
  const created: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  const skippedPlayed: string[] = [];
  const duplicates: string[] = [];

  for (const spec of SEASON_2026_27_REMAINING_LEAGUE_FIXTURES) {
    const kickoff = fixtureKickoffIso(spec);
    const dateHits = matches.filter((m) => matchCalendarDateAmsterdam(m.kickoff_at) === spec.date);
    const existing = findExistingFixture(matches, spec);
    if (dateHits.length > 1 && existing) {
      const extra = dateHits.filter((m) => m.id !== existing.id);
      if (extra.length) {
        duplicates.push(`${spec.date} ${spec.opponent} extra=${extra.map((m) => m.id).join(",")}`);
      }
    }

    if (existing) {
      if (existing.status === "played") {
        skippedPlayed.push(existing.id);
        continue;
      }
      const needs =
        !sameInstant(existing.kickoff_at, kickoff) ||
        existing.is_home !== spec.isHome ||
        existing.match_type !== spec.matchType ||
        existing.opponent !== spec.opponent ||
        (spec.location != null && existing.location !== spec.location);
      if (!needs) {
        unchanged.push(existing.id);
        continue;
      }
      const patch: Record<string, unknown> = {
        opponent: spec.opponent,
        kickoff_at: kickoff,
        is_home: spec.isHome,
        match_type: spec.matchType,
      };
      if (spec.location != null) patch.location = spec.location;
      const { error } = await sb.from("matches").update(patch).eq("id", existing.id);
      if (error) throw error;
      Object.assign(existing, patch);
      updated.push(existing.id);
      continue;
    }

    const row: MatchRow = {
      id: randomUUID(),
      season_id: SEASON_2026_27_ID,
      opponent: spec.opponent,
      kickoff_at: kickoff,
      is_home: spec.isHome,
      match_type: spec.matchType,
      location: spec.location ?? null,
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
    created.push(row.id);
  }

  const { data: afterMatches, error: afterErr } = await sb
    .from("matches")
    .select(
      "id,season_id,opponent,kickoff_at,is_home,match_type,location,status,goals_for,goals_against,lineup_status,wotm_player_id",
    )
    .eq("season_id", SEASON_2026_27_ID)
    .order("kickoff_at", { ascending: true });
  if (afterErr) throw afterErr;

  const afterIds = (afterMatches ?? []).map((m) => m.id);
  const { data: afterLineup } = await sb
    .from("match_lineup_entries")
    .select("id,match_id")
    .in("match_id", afterIds.length ? afterIds : [emptyId]);
  const { data: afterGoals } = await sb
    .from("match_goal_events")
    .select("id,match_id")
    .in("match_id", afterIds.length ? afterIds : [emptyId]);

  const remaining = (afterMatches ?? []).filter((m) => matchCalendarDateAmsterdam(m.kickoff_at) >= "2026-10-24");
  const report = remaining.map((m) => ({
    date: matchCalendarDateAmsterdam(m.kickoff_at),
    opponent: m.opponent,
    is_home: m.is_home,
    type: m.match_type,
    status: m.status,
    id: m.id,
    lineup: (afterLineup ?? []).filter((r) => r.match_id === m.id).length,
    events: (afterGoals ?? []).filter((r) => r.match_id === m.id).length,
    location: m.location,
  }));

  const summary = {
    created: created.length,
    updated: updated.length,
    unchanged: unchanged.length,
    skippedPlayed: skippedPlayed.length,
    duplicates: duplicates.length,
    remainingCount: remaining.length,
    remainingHome: remaining.filter((m) => m.is_home).length,
    remainingAway: remaining.filter((m) => !m.is_home).length,
    earlyMatchesUntouched: (afterMatches ?? []).filter((m) => matchCalendarDateAmsterdam(m.kickoff_at) < "2026-10-24")
      .length,
    createdIds: created,
    updatedIds: updated,
    duplicateNotes: duplicates,
    remaining: report,
  };
  writeFileSync(join(BACKUP_DIR, `after-${stamp}.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

void main();
