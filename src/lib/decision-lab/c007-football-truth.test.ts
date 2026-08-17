/**
 * C-007 — tactical semantic + first-use language gates.
 * Run: npx tsx src/lib/decision-lab/c007-football-truth.test.ts
 */
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import {
  ZVV_CANONICAL,
  classifyUs4231Recognition,
  validateTacticalSituationSemantics,
} from "@/lib/academie/tactical-canonical-perspective";
import { TACTICAL_COLORS } from "@/lib/academie/tactical-visual-tokens";
import { FORMATION_4231_US } from "@/lib/academie/tactical-visual-system";
import { PRESS_V2_US_START, PRESS_V2_ROLES } from "@/lib/academie/tactical-press-reference-v2";
import { resolveAcademyDashboardVisibility } from "@/lib/decision-lab/academy-visibility";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import { GS_SEEKS } from "@/lib/decision-lab/gs-timings";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  ANIM_FDL_GS_INSIDE_CLOSE_LIVE,
  FDL_GS_INSIDE_CLOSE_SITUATION,
} from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";
import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
const s0 = sessions[0]!;

// 1–3 first-use language
{
  const v = resolveAcademyDashboardVisibility(sessions, {});
  assert(v.learnerState === "untouched", "untouched state");
  assert(v.ctaLabel === "Start eerste beslissessie", "untouched CTA");
  assert(v.ctaLabel !== "Ga verder met je sessie", "untouched never continue CTA");
  assert(v.continueEyebrow === "Start hier", "untouched eyebrow");
  assert(v.continueEyebrow !== "Ga verder met", "untouched never Ga verder met");
  assert(v.showResumeHint === false, "untouched never resume hint");
  assert(v.showRecent === false, "untouched no recent");
  assert(!/Hervatten/i.test(v.ctaLabel), "untouched never Hervatten");
}

{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 2,
      openedAt: "2026-07-23T10:00:00.000Z",
      updatedAt: "2026-07-23T10:00:00.000Z",
    },
  };
  const v = resolveAcademyDashboardVisibility(sessions, progress);
  assert(v.ctaLabel === "Ga verder met je sessie", "in_progress CTA");
  assert(v.showResumeHint === true, "resume only with step>0");
  assert(v.learnerState === "in_progress", "in_progress state");
}

{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 0,
      openedAt: "2026-07-23T10:00:00.000Z",
      updatedAt: "2026-07-23T10:00:00.000Z",
    },
  };
  const v = resolveAcademyDashboardVisibility(sessions, progress);
  assert(v.showResumeHint === false, "step 0 does not invent resume moment");
  assert(v.learnerState === "opened", "opened without inventing step");
}

// 4–5 colors + 4231 base
assert(ZVV_CANONICAL.ourColor === TACTICAL_COLORS.us, "canonical blue");
assert(ZVV_CANONICAL.opponentColor === TACTICAL_COLORS.opponent, "canonical red");
assert(Object.keys(FORMATION_4231_US).length === 11, "4231 has 11");
assert(classifyUs4231Recognition(FORMATION_4231_US).ok, "attack 4231 recognizable");
assert(classifyUs4231Recognition(PRESS_V2_US_START).ok, "press shape derived from 4231");
assert(classifyUs4231Recognition(PRESS_V2_US_START).reason === "press-from-4231", "press reason");

// 6–8 Golden Session
assert(PRESS_V2_ROLES.FIRST_PRESS === "us.RW", "GS active role RW");
const sit = getTacticalSituation("fdl-gs-inside-close-live") ?? FDL_GS_INSIDE_CLOSE_SITUATION;
assert(sit.homeShape?.direction === "left-to-right", "attack direction present");
const opening = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.t0 + 200);
assert(opening.holderId === "opp.cbL" || opening.holderId === "opp.lb", "opening opp has ball");
const atTrigger = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.previewOpening);
assert(atTrigger.holderId === "opp.lb", "preview opening: LB has ball");
assert(Boolean(atTrigger.playerAt["us.RW"]), "RW present at preview");

const issues = validateTacticalSituationSemantics(sit, {
  requireFullUsTeam: true,
  expectedActiveRoleId: "us.RW",
  requireBallHolder: true,
});
assert(issues.length === 0, `GS semantic clean: ${issues.map((i) => i.code).join(",")}`);

// 9 invalid specs fail
{
  const bad = {
    ...sit,
    id: "fdl-gs-inside-close-live" as const,
    players: sit.players.map((p) =>
      p.id === "us.RW" ? { ...p, team: "opponent" as const } : p,
    ),
  };
  const badIssues = validateTacticalSituationSemantics(bad, {
    requireFullUsTeam: true,
    expectedActiveRoleId: "us.RW",
  });
  assert(badIssues.some((i) => i.code === "missing-role" || i.code === "us-count"), "invalid team fails");
}

{
  const noDir = {
    ...sit,
    homeShape: { formation: "4-4-2" as const, phase: "high-press" as const, direction: "right-to-left" as const },
  };
  const dirIssues = validateTacticalSituationSemantics(noDir, { requireFullUsTeam: true });
  assert(dirIssues.some((i) => i.code === "attack-direction"), "wrong attack direction fails");
}

console.log("c007-football-truth.test.ts: OK");
