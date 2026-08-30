/**
 * Planning & wedstrijdprogramma reality pass.
 * Run: npm run test:schedule-and-planning-reality
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import "@/scripts/load-platform-env";
import { matchAdminPayloadSchema } from "@/lib/validations/match-admin";
import { nextScheduledMatch } from "@/lib/queries/matches";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import { seasonOperations2026_27, SEASON_2026_27_ID, clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import {
  SEASON_2026_27_PRODUCTION_FIXTURES,
  fixtureKickoffIso,
  findExistingFixture,
  matchCalendarDateAmsterdam,
  normalizeOpponentKey,
} from "@/lib/season/season-2026-27-schedule";
import {
  matchPrepLabel,
  matchPrepStatus,
  shouldPreserveExistingLineup,
  shouldRemindLineupUnprepared,
  MATCH_PLANNING_REQUIRED_FIELDS,
} from "@/lib/match/match-planning";
import { canDeleteFitnessSession, canEditFitnessSessionMeta } from "@/lib/fitness/fitness-session-admin";
import { matchTypeLabel } from "@/lib/match-type";
import { formatHumanDateNL, formatTimeNl } from "@/lib/utils/format-date";
import { buildTemporaryMatch } from "@/lib/match/temporary-match-fixture";
import { isQaMatchOpponent, isQaFixtureNotes } from "@/lib/match/qa-fixture-patterns";
import type { ClubDatabase, Match } from "@/types";

const root = process.cwd();
console.log("→ schedule-and-planning-reality");

function emptyDb(): ClubDatabase {
  return {
    seasons: [
      {
        id: SEASON_2026_27_ID,
        name: "2026/27",
        starts_on: "2026-08-01",
        ends_on: "2027-06-30",
        is_active: true,
      },
    ],
    players: [],
    player_season_memberships: [],
    matches: [],
    match_matchday_roster: [],
    match_lineup_entries: [],
    match_player_stats: [],
    match_goal_events: [],
    match_card_events: [],
    match_substitutions: [],
    match_position_changes: [],
    training_sessions: [],
    training_attendance: [],
    fitness_tests: [],
    fitness_test_sessions: [],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
  };
}

function plannedPayload(over: Record<string, unknown> = {}) {
  return {
    season_id: SEASON_2026_27_ID,
    opponent: "WSV 1930 VR1",
    kickoff_at: clubLocalDateTimeToIso("2026-08-29", "14:00"),
    is_home: false,
    match_type: "cup",
    location: "",
    referee: "",
    notes: "",
    status: "scheduled",
    goals_for: 0,
    goals_against: 0,
    selected_player_ids: [],
    goals: [],
    wotm_player_id: "",
    lineup: [],
    cards: [],
    substitutions: [],
    ...over,
  };
}

// 1–2: geplande wedstrijd zonder lineup
{
  const parsed = matchAdminPayloadSchema.safeParse(plannedPayload());
  assert.equal(parsed.success, true, "1: geplande wedstrijd zonder lineup is geldig");
  assert.deepEqual(MATCH_PLANNING_REQUIRED_FIELDS, ["opponent", "kickoff_at", "is_home", "match_type"]);
  const missingOpp = matchAdminPayloadSchema.safeParse(plannedPayload({ opponent: "" }));
  assert.equal(missingOpp.success, false, "2: tegenstander blijft verplicht");
}

// 3–4: publiek + countdown zonder lineup
{
  const db = emptyDb();
  const match = buildTemporaryMatch({
    season_id: SEASON_2026_27_ID,
    opponent: "WSV 1930 VR1",
    kickoff_at: clubLocalDateTimeToIso("2026-08-29", "14:00"),
    is_home: false,
    match_type: "cup",
    status: "scheduled",
  });
  match.data_scope = "production";
  match.notes = null;
  db.matches.push(match);
  const now = new Date("2026-08-17T10:00:00+02:00");
  const next = nextScheduledMatch(db, SEASON_2026_27_ID, now);
  assert.ok(next, "3: geplande wedstrijd verschijnt als volgende");
  assert.equal(next!.opponent, "WSV 1930 VR1");
  assert.equal(formatTimeNl(next!.kickoff_at), "14:00", "4/12: countdown-kickoff is 14:00 Amsterdam");
  assert.equal(matchPrepStatus(next!, []), "lineup_not_prepared");
}

// 5–6: later voorbereiden, lineup save wijzigt planning niet
{
  assert.equal(
    shouldPreserveExistingLineup({ status: "scheduled", incomingLineupCount: 0, existingLineupCount: 11 }),
    true,
    "6: lege planning-save bewaart bestaande opstelling",
  );
  const formation = readFileSync(join(root, "src/actions/match-formation.ts"), "utf8");
  assert.ok(!formation.includes("kickoff_at"), "6: opstelling-save raakt kickoff niet");
  assert.ok(!formation.includes("opponent"), "6: opstelling-save raakt tegenstander niet");
}

// 7–12: zeven fixtures exact
{
  assert.equal(SEASON_2026_27_PRODUCTION_FIXTURES.length, 7);
  const cups = SEASON_2026_27_PRODUCTION_FIXTURES.filter((f) => f.matchType === "cup");
  const league = SEASON_2026_27_PRODUCTION_FIXTURES.filter((f) => f.matchType === "competition");
  assert.equal(cups.length, 3, "7: drie bekerwedstrijden");
  assert.equal(league.length, 4, "7: vier competitiewedstrijden");
  assert.equal(cups[0]!.date, "2026-08-29");
  assert.equal(league[0]!.date, "2026-09-19");
  assert.equal(matchTypeLabel("cup"), "Beker");
  assert.equal(matchTypeLabel("competition"), "Competitie");

  const first = SEASON_2026_27_PRODUCTION_FIXTURES[0]!;
  assert.equal(first.time, "14:00");
  assert.equal(first.isHome, false);
  assert.equal(fixtureKickoffIso(first), "2026-08-29T12:00:00.000Z");
  assert.equal(formatTimeNl(fixtureKickoffIso(first)), "14:00");

  const db = emptyDb();
  for (const spec of SEASON_2026_27_PRODUCTION_FIXTURES) {
    db.matches.push({
      ...buildTemporaryMatch({
        season_id: SEASON_2026_27_ID,
        opponent: spec.opponent,
        kickoff_at: fixtureKickoffIso(spec),
        is_home: spec.isHome,
        match_type: spec.matchType,
      }),
      notes: null,
      data_scope: "production",
    });
  }
  const now = new Date("2026-08-17T12:00:00+02:00");
  const next = nextScheduledMatch(db, SEASON_2026_27_ID, now);
  assert.equal(next?.opponent, "WSV 1930 VR1", "11: 29 augustus is eerstvolgende");
  assert.equal(formatTimeNl(next!.kickoff_at), "14:00", "12: 29 augustus 14:00");
  assert.equal(next?.is_home, false);
  assert.equal(next?.match_type, "cup");

  const keys = db.matches.map((m) => `${matchCalendarDateAmsterdam(m.kickoff_at)}|${normalizeOpponentKey(m.opponent)}`);
  assert.equal(new Set(keys).size, 7, "8: geen duplicaten");
}

// 13–18: fitnessdatum
{
  assert.equal(seasonOperations2026_27.fitness.firstTestOn, "2026-09-07");
  assert.ok(!seasonOperations2026_27.fitness.proposedCycle.includes("2026-08-17"));
  assert.ok(!seasonOperations2026_27.fitness.proposedCycle.includes("2026-09-02"));
  const db = emptyDb();
  const emptyNext = nextFitnessMoment(db, SEASON_2026_27_ID, new Date("2026-08-17T10:00:00+02:00"));
  assert.equal(emptyNext.date, "2026-09-07", "14: fallback is 7 september");
  assert.notEqual(emptyNext.date, "2026-08-17", "13: 17 augustus niet meer actief");
  assert.notEqual(emptyNext.date, "2026-09-02");

  db.fitness_test_sessions = [
    {
      id: "sess-1",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-09-07",
      protocol_code: "four_part_v1",
      status: "draft",
      note: "Verplaatst wegens weer",
      score_config_id: null,
      created_at: "2026-08-01T12:00:00Z",
      updated_at: "2026-08-17T12:00:00Z",
      published_at: null,
      created_by: null,
      published_by: null,
    },
  ];
  const draftNext = nextFitnessMoment(db, SEASON_2026_27_ID, new Date("2026-08-17T10:00:00+02:00"));
  assert.equal(draftNext.kind, "draft");
  assert.equal(draftNext.date, "2026-09-07");
  assert.equal(formatHumanDateNL("2026-09-07", { includeYear: true }).toLowerCase().includes("7 september"), true);

  assert.equal(canEditFitnessSessionMeta({ status: "draft" }), true, "15: testdatum wijzigbaar");
  assert.equal(canDeleteFitnessSession({ status: "draft", published_at: null }), true);
  assert.equal(canDeleteFitnessSession({ status: "published", published_at: "2026-09-02T12:00:00Z" }), false);

  const protocol = readFileSync(join(root, "src/actions/fitness-protocol.ts"), "utf8");
  assert.match(protocol, /updateFitnessSessionMetaAction/);
  assert.match(protocol, /deleteFitnessDraftSessionAction/);
  const sessionPage = readFileSync(join(root, "src/app/(site)/beheer/fitheid/[sessionId]/page.tsx"), "utf8");
  assert.match(sessionPage, /Testmoment wijzigen|FitnessSessionMetaForm/);
  const spotlight = readFileSync(join(root, "src/components/home/fitness-leader-spotlight.tsx"), "utf8");
  assert.match(spotlight, /nextFitnessMoment/);
  assert.ok(!spotlight.includes("2026-08-17"), "18: homepage spotlight geen 17 augustus");
  const beheerFit = readFileSync(join(root, "src/app/(site)/beheer/page.tsx"), "utf8");
  assert.match(beheerFit, /nextFitnessMoment/);
  const publicFit = readFileSync(join(root, "src/app/(site)/fitheid/page.tsx"), "utf8");
  assert.ok(!publicFit.includes("2026-08-17"), "18: publieke fitheid geen hardcoded 17 augustus");
}

// 19: wedstrijd bewerken bewaart shape
{
  assert.equal(
    shouldPreserveExistingLineup({ status: "scheduled", incomingLineupCount: 0, existingLineupCount: 4 }),
    true,
  );
  const admin = readFileSync(join(root, "src/actions/match-admin.ts"), "utf8");
  assert.match(admin, /shouldPreserveExistingLineup/);
  assert.match(admin, /lineup_status: existing\?\.lineup_status \?\? "draft"/);
}

// 20: QA cleanup contract
{
  const qa = buildTemporaryMatch({ season_id: SEASON_2026_27_ID, opponent: "QA Temp cleanup" });
  assert.equal(isQaMatchOpponent(qa.opponent) || isQaFixtureNotes(qa.notes), true);
  const db = emptyDb();
  db.matches.push(qa);
  assert.equal(db.matches.length, 1);
  db.matches = db.matches.filter((m) => m.id !== qa.id);
  db.match_lineup_entries = db.match_lineup_entries.filter((e) => e.match_id !== qa.id);
  assert.equal(db.matches.length, 0, "20: temporary fixture verdwijnt na cleanup");
}

// UX: geen foutstatus voor verre toekomst
{
  const far: Match = {
    ...buildTemporaryMatch({
      season_id: SEASON_2026_27_ID,
      kickoff_at: clubLocalDateTimeToIso("2026-10-10", "14:30"),
    }),
    lineup_status: "draft",
  };
  const now = new Date("2026-08-17T10:00:00+02:00");
  assert.equal(shouldRemindLineupUnprepared(far, [], now), false);
  assert.equal(matchPrepLabel("lineup_not_prepared"), "Opstelling nog niet voorbereid");
  const soon: Match = {
    ...far,
    kickoff_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(shouldRemindLineupUnprepared(soon, [], now), true);
}

// UI-contract: opslaan gaat naar overzicht, niet naar opstelling
{
  const form = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
  assert.match(form, /\/beheer\/wedstrijden\?season=/);
  assert.ok(!form.includes('router.push(`${base}&step=opstelling`)'));
  const nieuw = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/nieuw/page.tsx"), "utf8");
  assert.match(nieuw, /Opstelling/);
  assert.match(nieuw, /later optioneel/);
}

// Live DB: zeven fixtures + fitness 7 september (skip zonder env)
async function liveDbChecks() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.log("schedule-and-planning-reality: skip live DB (no Supabase env)");
    return;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("schedule-and-planning-reality: skip live DB (no service role)");
    return;
  }
  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const client = createSupabaseServiceClient();
  const { data: matches, error } = await client
    .from("matches")
    .select("id,opponent,kickoff_at,is_home,match_type,status,notes,season_id")
    .eq("season_id", SEASON_2026_27_ID)
    .eq("status", "scheduled");
  if (error) throw new Error(error.message);
  const production = (matches ?? []).filter((m) => !isQaMatchOpponent(m.opponent) && !isQaFixtureNotes(m.notes));
  for (const spec of SEASON_2026_27_PRODUCTION_FIXTURES) {
    const hit = findExistingFixture(production, spec);
    assert.ok(hit, `live: fixture ontbreekt ${spec.date} ${spec.opponent}`);
    assert.equal(formatTimeNl(hit!.kickoff_at), spec.time, `live: tijd ${spec.date}`);
    assert.equal(hit!.is_home, spec.isHome, `live: thuis/uit ${spec.date}`);
    assert.equal(hit!.match_type, spec.matchType, `live: type ${spec.date}`);
  }
  const { data: sessions, error: sErr } = await client
    .from("fitness_test_sessions")
    .select("id,test_on,status,note,season_id")
    .eq("season_id", SEASON_2026_27_ID);
  if (sErr) throw new Error(sErr.message);
  const real = (sessions ?? []).filter((s) => !(s.note ?? "").startsWith("[QA]"));
  assert.ok(
    real.some((s) => s.test_on === "2026-09-07"),
    "live: fitheidstest 7 september bestaat",
  );
  assert.ok(
    !real.some((s) => s.test_on === "2026-09-02"),
    "live: geen actieve 2-september-fitheidstest",
  );
  assert.ok(
    !real.some((s) => s.test_on === "2026-08-17"),
    "live: geen actieve 17-augustus-fitheidstest",
  );
  console.log("schedule-and-planning-reality: live DB ok");
}

void liveDbChecks()
  .then(() => {
    assert.ok(existsSync(join(root, "src/lib/season/season-2026-27-schedule.ts")));
    console.log("✓ schedule-and-planning-reality — assertions OK");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
