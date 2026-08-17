/**
 * Functional chain recovery — planned match without score + fitness station entry.
 * Run: npm run test:functional-chain-recovery
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { matchAdminPayloadSchema } from "@/lib/validations/match-admin";
import {
  MATCH_STATUSES,
  matchAllowsScoreAndEvents,
  matchFieldRequirements,
  MATCH_STATUS_LABEL_NL,
} from "@/lib/match/match-status";
import { MATCH_WORKFLOW_STEPS, parseMatchWorkflowStep } from "@/lib/match/match-workflow-steps";
import { parsePlankToSeconds, parseSecondsValue, parseMetersValue } from "@/lib/fitness/parse-values";

const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const root = process.cwd();

function basePlannedPayload(overrides: Record<string, unknown> = {}) {
  return {
    season_id: SEASON,
    opponent: "Test Tegenstander FC",
    kickoff_at: "2026-09-15T14:00:00.000Z",
    is_home: true,
    match_type: "competition",
    location: null,
    referee: null,
    notes: null,
    status: "scheduled",
    goals_for: 0,
    goals_against: 0,
    selected_player_ids: [],
    goals: [],
    wotm_player_id: "",
    lineup: [],
    cards: [],
    substitutions: [],
    preserve_shape_events: false,
    ...overrides,
  };
}

console.log("→ functional-chain-recovery");

// 1–6: planned match schema (null optionals = root cause Invalid input)
{
  const ok = matchAdminPayloadSchema.safeParse(basePlannedPayload());
  assert.equal(ok.success, true, "1/3/5: geplande wedstrijd zonder uitslag parseert (incl. null optionals)");
  if (ok.success) {
    assert.equal(ok.data.location, null);
    assert.equal(ok.data.goals_for, 0);
    assert.equal(ok.data.goals_against, 0);
  }

  const withEmptyStrings = matchAdminPayloadSchema.safeParse(
    basePlannedPayload({ location: "", referee: "", notes: "" }),
  );
  assert.equal(withEmptyStrings.success, true, "lege strings → null");

  const withScore = matchAdminPayloadSchema.safeParse(
    basePlannedPayload({ goals_for: 2, goals_against: 1 }),
  );
  assert.equal(withScore.success, false, "2: gepland mag geen uitslag hebben");
  const msgs = withScore.success ? [] : withScore.error.issues.map((i) => i.message);
  assert.ok(
    msgs.some((m) => /uitslag|geplande/i.test(m)),
    "6: veldspecifieke melding i.p.v. generiek Invalid input",
  );
  assert.ok(!msgs.includes("Invalid input"), "5: geen bare Invalid input");
}

// Lifecycle contract
{
  assert.deepEqual([...MATCH_STATUSES], ["scheduled", "played", "cancelled", "postponed"]);
  assert.equal(MATCH_STATUS_LABEL_NL.scheduled, "Gepland");
  assert.equal(matchAllowsScoreAndEvents("scheduled"), false);
  assert.equal(matchAllowsScoreAndEvents("played"), true);
  const plannedFields = matchFieldRequirements("scheduled");
  assert.equal(plannedFields.goals_for, "hidden");
  assert.equal(plannedFields.mvp, "hidden");
  assert.equal(plannedFields.opponent, "required");
  const playedFields = matchFieldRequirements("played");
  assert.equal(playedFields.goals_against, "required");
  assert.equal(playedFields.mvp, "required");
}

// Wizard steps 7–10
{
  assert.equal(parseMatchWorkflowStep("selectie"), "opstelling");
  assert.equal(parseMatchWorkflowStep("opstelling"), "opstelling");
  assert.equal(
    MATCH_WORKFLOW_STEPS.map((s) => s.id).join(">"),
    "wedstrijd>opstelling>na-de-wedstrijd>controle",
  );
  const nieuwSrc = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/nieuw/page.tsx"), "utf8");
  assert.match(nieuwSrc, /workflowStep="wedstrijd"/);
  assert.match(nieuwSrc, /Opstelling/);
  const formSrc = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
  assert.match(formSrc, /step=opstelling/);
  assert.match(formSrc, /Opslaan/);
  assert.ok(!formSrc.includes("location: location.trim() || null"), "payload stuurt geen null meer voor location");
  assert.match(formSrc, /goals_against: status === "played" \? goalsAgainst : 0/);
}

// Score 3-1 + finish 11–16
{
  const scoreOnly = matchAdminPayloadSchema.safeParse(
    basePlannedPayload({
      status: "played",
      goals_for: 3,
      goals_against: 1,
      selected_player_ids: ["a", "b", "c"],
      wotm_player_id: "a",
      goals: [
        { scorer_player_id: "a", minute: 1 },
        { scorer_player_id: "b", minute: 2 },
        { scorer_player_id: "c", minute: 3 },
      ],
    }),
  );
  assert.equal(scoreOnly.success, true, "12–14: score 3-1 met drie events parseert");
  if (scoreOnly.success) {
    assert.equal(scoreOnly.data.goals_against, 1);
    assert.equal(scoreOnly.data.goals.length, 3);
    assert.equal(scoreOnly.data.goals_for, 3);
  }
  const mismatch = matchAdminPayloadSchema.safeParse(
    basePlannedPayload({
      status: "played",
      goals_for: 3,
      goals_against: 1,
      selected_player_ids: ["a"],
      wotm_player_id: "a",
      goals: [{ scorer_player_id: "a", minute: 1 }],
    }),
  );
  assert.equal(mismatch.success, false, "15: goal-events moeten matchen met goals voor");

  const editSrc = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/[matchId]/page.tsx"), "utf8");
  assert.match(editSrc, /Wedstrijd afronden/);
  assert.match(editSrc, /finish:\s*["']1["']|finish=1/);
  assert.match(editSrc, /Beschikbaar na de wedstrijd|Na de wedstrijd/);
  const listSrc = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/page.tsx"), "utf8");
  assert.match(listSrc, /AdminMatchRowActions|Wedstrijd afronden/);
  const rowActions = readFileSync(join(root, "src/components/admin/admin-match-row-actions.tsx"), "utf8");
  assert.match(rowActions, /Wedstrijd afronden/);
}

// Fitness 17–32
{
  const fitPage = readFileSync(join(root, "src/app/(site)/beheer/fitheid/page.tsx"), "utf8");
  assert.match(fitPage, /Open invoer|Test starten/);
  assert.match(fitPage, /station\/\$\{c\.tabId\}/);

  const stationPage = readFileSync(
    join(root, "src/app/(site)/beheer/fitheid/[sessionId]/station/[station]/page.tsx"),
    "utf8",
  );
  assert.match(stationPage, /activeSeasonMembers/);
  assert.match(stationPage, /FitnessStationEntry/);

  const entry = readFileSync(join(root, "src/components/admin/fitness/fitness-station-entry.tsx"), "utf8");
  assert.match(entry, /STATION_ORDER/);
  assert.match(entry, /Opslaan en naar volgend station/);
  assert.match(entry, /lege invoer wist/);
  assert.match(entry, /plankMin/);
  assert.match(entry, /Enter/);

  const nieuwForm = readFileSync(
    join(root, "src/components/admin/fitness/fitness-new-session-form.tsx"),
    "utf8",
  );
  assert.match(nieuwForm, /station\/\$\{startStation\}/);

  const sprint = parseSecondsValue("4,82");
  assert.equal(sprint.ok, true);
  if (sprint.ok) assert.equal(sprint.value, 4.82);

  const plank = parsePlankToSeconds("1:30");
  assert.equal(plank.ok, true);
  if (plank.ok) assert.equal(plank.value, 90);

  const meters = parseMetersValue("1320");
  assert.equal(meters.ok, true);
  if (meters.ok) assert.equal(meters.value, 1320);

  const empty = parseSecondsValue("");
  assert.equal(empty.ok, true);
  if (empty.ok) assert.equal(empty.value, null);

  const tracePath = join(root, ".review-backups/functional-chain-recovery/fitness-traceability.md");
  assert.ok(existsSync(tracePath), "13: traceabilitydocument aanwezig");
}

console.log("✓ functional-chain-recovery — assertions OK");
