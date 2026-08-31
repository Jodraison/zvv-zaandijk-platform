/**
 * Reality certification — echte Beheer-uitslagflow → opgeslagen match → getHomepageCelebration.
 * Geen productie-write. Zelfde schema + persist-mapping als saveMatchAdminAction.
 * Run: npm run test:homepage-celebration
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { matchAdminPayloadSchema } from "@/lib/validations/match-admin";
import { aggregateStatsFromGoals } from "@/lib/match-goal-helpers";
import { MATCH_STATUSES } from "@/lib/match/match-status";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { clubDateKeyAmsterdam, todayInClubTz } from "@/lib/season/season-operations-2026-27";
import { getBirthdayPlayersForDate, type BirthdayPerson } from "@/lib/players/birthdays";
import {
  getHomepageCelebration,
  isTodayOfficialVictory,
} from "@/lib/home/homepage-celebration";
import type { Match } from "@/types";

const root = process.cwd();
const SEASON = "season-celebration-flow";
const PLAYERS = ["p-a", "p-b", "p-c"] as const;

console.log("→ homepage-celebration-match-flow");

/** Zelfde payloadvorm als MatchAdminForm.payloadJson. */
function beheerFinishPayload(opts: {
  is_home: boolean;
  goals_for: number;
  goals_against: number;
  kickoff_at: string;
  status?: "scheduled" | "played" | "cancelled" | "postponed";
  opponent?: string;
}) {
  const status = opts.status ?? "played";
  const goals =
    status === "played"
      ? Array.from({ length: opts.goals_for }, (_, i) => ({
          scorer_player_id: PLAYERS[i % PLAYERS.length]!,
          assist_player_id: "",
          minute: 10 + i,
        }))
      : [];
  return {
    match_id: "",
    season_id: SEASON,
    opponent: opts.opponent ?? "Sporting Andijk VR1",
    kickoff_at: opts.kickoff_at,
    is_home: opts.is_home,
    match_type: "competition" as const,
    location: "Sportpark",
    referee: "",
    notes: "",
    status,
    goals_for: status === "played" ? goals.length : 0,
    goals_against: status === "played" ? opts.goals_against : 0,
    selected_player_ids: status === "played" ? [...PLAYERS] : [],
    goals,
    cards: [],
    substitutions: [],
    preserve_shape_events: false,
    wotm_player_id: status === "played" ? PLAYERS[0] : "",
    lineup: [],
  };
}

/**
 * Persist-mapping 1:1 met saveMatchAdminAction na succesvolle afronding:
 * kickoff ISO, goals_for uit events, goals_against uit formulier,
 * status uit payload, nieuwe wedstrijd = production, daarna integrity verified.
 */
function persistFromBeheerFlow(raw: unknown): Match {
  const parsed = matchAdminPayloadSchema.safeParse(raw);
  assert.equal(parsed.success, true, parsed.success ? "" : parsed.error.issues.map((i) => i.message).join("; "));
  const data = parsed.data;
  const played = data.status === "played";
  const kickoffIso = new Date(data.kickoff_at).toISOString();
  let goals_for = 0;
  if (played) {
    const agg = aggregateStatsFromGoals(
      "flow-match",
      data.selected_player_ids,
      data.goals.map((g) => ({
        scorer_player_id: g.scorer_player_id,
        assist_player_id: g.assist_player_id ?? undefined,
        minute: g.minute,
      })),
    );
    assert.equal(agg.goals_for, data.goals.length);
    assert.equal(agg.goals_for, data.goals_for);
    goals_for = agg.goals_for;
  }
  return {
    id: "flow-match",
    season_id: data.season_id,
    opponent: data.opponent.trim(),
    kickoff_at: kickoffIso,
    is_home: data.is_home,
    match_type: data.match_type,
    location: data.location,
    referee: data.referee,
    notes: data.notes,
    goals_for,
    goals_against: data.goals_against,
    status: data.status,
    wotm_player_id: played ? data.wotm_player_id?.trim() || data.wotm_player_ids?.[0] || null : null,
    wotm_player_ids: played
      ? [...new Set([...(data.wotm_player_ids ?? []), data.wotm_player_id?.trim() || ""].filter(Boolean))]
      : [],
    integrity_state: "verified",
    data_scope: "production",
  };
}

/** Homepage leest matches via supabase-db zonder data_scope-kolom. */
function asHomepageRead(stored: Match): Match {
  const { data_scope: _scope, ...rest } = stored;
  void _scope;
  return rest;
}

function celebrate(stored: Match, now: Date, birthdayCount = 0) {
  return getHomepageCelebration({
    birthdayCount,
    matches: [asHomepageRead(stored)],
    seasonId: SEASON,
    now,
  });
}

// Broncontract: persist-velden moeten nog steeds in saveMatchAdminAction staan
{
  const action = readFileSync(join(root, "src/actions/match-admin.ts"), "utf8");
  const form = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
  const page = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const supabaseLoad = readFileSync(join(root, "src/lib/data/supabase-db.ts"), "utf8");
  assert.doesNotMatch(
    supabaseLoad.slice(supabaseLoad.indexOf("const matches: Match[]"), supabaseLoad.indexOf("const match_player_stats")),
    /data_scope:/,
  );
  assert.match(form, /goals_for: status === "played" \? goals\.length : 0/);
  assert.match(form, /goals_against: status === "played" \? goalsAgainst : 0/);
  assert.match(form, /kickoff_at: kickoffIso/);
  assert.match(form, /is_home: isHome/);
  assert.match(action, /const kickoffIso = new Date\(data\.kickoff_at\)\.toISOString\(\)/);
  assert.match(action, /aggregateStatsFromGoals/);
  assert.match(action, /if \(goals_for !== data\.goals_for\)/);
  assert.match(action, /goals_against: played \? data\.goals_against : data\.goals_against/);
  assert.match(action, /status: data\.status/);
  assert.match(action, /data_scope: "production"/);
  assert.match(action, /verifiedRow\.integrity_state = "verified"/);
  assert.match(page, /getHomepageCelebration/);
  assert.match(page, /matches: db\.matches/);
}

assert.deepEqual([...MATCH_STATUSES], ["scheduled", "played", "cancelled", "postponed"]);

const noonToday = new Date("2026-08-31T12:00:00+02:00");
const todayKick = "2026-08-31T14:00:00+02:00";

// A. thuis 3–1 winst
{
  const stored = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: true, goals_for: 3, goals_against: 1, kickoff_at: todayKick }),
  );
  assert.equal(stored.status, "played");
  assert.equal(stored.is_home, true);
  assert.equal(stored.goals_for, 3);
  assert.equal(stored.goals_against, 1);
  assert.equal(stored.integrity_state, "verified");
  assert.equal(stored.data_scope, "production");
  assert.equal(resolveMatchScore(stored).result, "win");
  assert.equal(resolveMatchScore(stored).homeScore, 3);
  assert.equal(resolveMatchScore(stored).awayScore, 1);
  assert.equal(celebrate(stored, noonToday).type, "victory");
}

// B. uit 1–2 winst (tegenstander 1, Zaandijk 2)
{
  const stored = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: false, goals_for: 2, goals_against: 1, kickoff_at: todayKick }),
  );
  assert.equal(stored.is_home, false);
  assert.equal(stored.goals_for, 2);
  assert.equal(stored.goals_against, 1);
  assert.equal(resolveMatchScore(stored).result, "win");
  assert.equal(resolveMatchScore(stored).homeScore, 1);
  assert.equal(resolveMatchScore(stored).awayScore, 2);
  assert.equal(celebrate(stored, noonToday).type, "victory");
}

// C. 2–2 gelijk
{
  const stored = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: true, goals_for: 2, goals_against: 2, kickoff_at: todayKick }),
  );
  assert.equal(stored.goals_for, 2);
  assert.equal(stored.goals_against, 2);
  assert.equal(resolveMatchScore(stored).result, "draw");
  assert.equal(celebrate(stored, noonToday).type, null);
}

// D. 1–3 verlies
{
  const homeLoss = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: true, goals_for: 1, goals_against: 3, kickoff_at: todayKick }),
  );
  const awayLoss = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: false, goals_for: 1, goals_against: 3, kickoff_at: todayKick }),
  );
  assert.equal(resolveMatchScore(homeLoss).result, "loss");
  assert.equal(resolveMatchScore(awayLoss).result, "loss");
  assert.equal(celebrate(homeLoss, noonToday).type, null);
  assert.equal(celebrate(awayLoss, noonToday).type, null);
}

// Status: alleen played
{
  for (const status of ["scheduled", "cancelled", "postponed"] as const) {
    const raw = beheerFinishPayload({
      is_home: true,
      goals_for: 0,
      goals_against: 0,
      kickoff_at: todayKick,
      status,
    });
    const stored = persistFromBeheerFlow(raw);
    assert.equal(stored.status, status);
    assert.equal(stored.goals_for, 0);
    assert.equal(isTodayOfficialVictory(stored, SEASON, noonToday), false, status);
    assert.equal(celebrate(stored, noonToday).type, null, status);
  }
}

// Amsterdam-datum: vandaag / gisteren / morgen / UTC-grens
{
  const winToday = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: true, goals_for: 3, goals_against: 1, kickoff_at: todayKick }),
  );
  assert.equal(clubDateKeyAmsterdam(winToday.kickoff_at), "2026-08-31");
  assert.equal(todayInClubTz(noonToday), "2026-08-31");
  assert.equal(celebrate(winToday, noonToday).type, "victory");
  assert.equal(celebrate(winToday, new Date("2026-08-30T12:00:00+02:00")).type, null);
  assert.equal(celebrate(winToday, new Date("2026-09-01T00:10:00+02:00")).type, null);

  const late = persistFromBeheerFlow(
    beheerFinishPayload({
      is_home: true,
      goals_for: 1,
      goals_against: 0,
      kickoff_at: "2026-08-31T23:30:00+02:00",
    }),
  );
  assert.equal(clubDateKeyAmsterdam(late.kickoff_at), "2026-08-31");
  assert.equal(celebrate(late, new Date("2026-08-31T23:50:00+02:00")).type, "victory");

  const utcNextClubDay = persistFromBeheerFlow(
    beheerFinishPayload({
      is_home: true,
      goals_for: 1,
      goals_against: 0,
      kickoff_at: "2026-08-31T22:30:00.000Z",
    }),
  );
  assert.equal(clubDateKeyAmsterdam(utcNextClubDay.kickoff_at), "2026-09-01");
  assert.equal(celebrate(utcNextClubDay, noonToday).type, null);
  assert.equal(celebrate(utcNextClubDay, new Date("2026-09-01T00:40:00+02:00")).type, "victory");

  const yesterday = persistFromBeheerFlow(
    beheerFinishPayload({
      is_home: true,
      goals_for: 3,
      goals_against: 0,
      kickoff_at: "2026-08-30T14:00:00+02:00",
    }),
  );
  const tomorrow = persistFromBeheerFlow(
    beheerFinishPayload({
      is_home: true,
      goals_for: 3,
      goals_against: 0,
      kickoff_at: "2026-09-01T14:00:00+02:00",
    }),
  );
  assert.equal(celebrate(yesterday, noonToday).type, null);
  assert.equal(celebrate(tomorrow, noonToday).type, null);
}

// Combined: echte-flow winst + jarige vandaag
{
  const stored = persistFromBeheerFlow(
    beheerFinishPayload({ is_home: false, goals_for: 2, goals_against: 1, kickoff_at: todayKick }),
  );
  const people: BirthdayPerson[] = [
    { id: "j", full_name: "Jelisa De Jonge", birth_date: "2006-08-31" },
  ];
  const birthdayCount = getBirthdayPlayersForDate(people, noonToday).length;
  assert.equal(birthdayCount, 1);
  const decision = celebrate(stored, noonToday, birthdayCount);
  assert.equal(decision.type, "birthday_victory");
  assert.equal(decision.birthday, true);
  assert.equal(decision.victory, true);
}

// QA-scope uit echte persist + QA-opponent telt niet
{
  const stored = persistFromBeheerFlow(
    beheerFinishPayload({
      is_home: true,
      goals_for: 4,
      goals_against: 0,
      kickoff_at: todayKick,
      opponent: "Test FC Debug",
    }),
  );
  assert.equal(celebrate(stored, noonToday).type, null);
}

console.log("homepage-celebration-match-flow.test.ts: ok");
