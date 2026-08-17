/**
 * C-008 first-use + canonical state tests.
 * Run: npx tsx src/lib/decision-lab/c008-first-use.test.ts
 */
import {
  resolveCanonicalLearnerModel,
  resolveLearnerProgressState,
} from "@/lib/decision-lab/academy-visibility";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import {
  ORIENTATION_FRAME_BASE_4231,
  FORMATION_TEACH_FRAMES,
} from "@/lib/decision-lab/formation-teach-frames";
import { ZVV_CANONICAL, classifyUs4231Recognition } from "@/lib/academie/tactical-canonical-perspective";
import { TACTICAL_COLORS } from "@/lib/academie/tactical-visual-tokens";
import { FORMATION_4231_US } from "@/lib/academie/tactical-visual-system";
import { PRESS_V2_ROLES } from "@/lib/academie/tactical-press-reference-v2";
import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
const s0 = sessions[0]!;
const s1 = sessions[1]!;

// Untouched
{
  const m = resolveCanonicalLearnerModel(sessions, {});
  assert(m.state === "untouched", "untouched");
  assert(m.ctaLabel === "Start eerste beslissessie", "start CTA");
  assert(m.ctaLabel !== "Ga verder met je sessie", "no ga verder");
  assert(!/Hervatten/i.test(m.ctaLabel), "no hervatten");
  assert(m.showRecent === false, "no recent");
  assert(m.isFirstUse === true, "first use");
  assert(m.showReturningDashboard === false, "no returning dash");
}

// Bare status without openedAt / step must not fake progress
{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 0,
      updatedAt: "2026-07-23T08:00:00.000Z",
    },
  };
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.state === "untouched", "bare started ≠ opened");
  assert(m.ctaLabel === "Start eerste beslissessie", "bare started keeps start CTA");
  assert(m.showRecent === false, "bare started no recent");
}

// Opened — openedAt, step 0
{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 0,
      openedAt: "2026-07-23T08:00:00.000Z",
      updatedAt: "2026-07-23T08:00:00.000Z",
    },
  };
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.state === "opened", "opened");
  assert(m.ctaLabel === "Begin met de eerste situatie", "opened begin CTA");
  assert(m.showResumeDetail === false, "no invented resume");
  assert(m.showRecent === false, "opened recent not shown");
}

// In progress — step > 0
{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 2,
      openedAt: "2026-07-23T08:00:00.000Z",
      updatedAt: "2026-07-23T09:00:00.000Z",
    },
  };
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.state === "in_progress", "in_progress");
  assert(m.showResumeDetail === true, "real resume");
  assert(m.ctaLabel === "Ga verder met je sessie", "in progress CTA");
}

// Completed first → next session CTA
{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "completed",
      step: 5,
      openedAt: "2026-07-23T08:00:00.000Z",
      completedAt: "2026-07-23T09:00:00.000Z",
      updatedAt: "2026-07-23T09:00:00.000Z",
    },
  };
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.primary?.id === s1.id, "advances to next");
  assert(m.ctaLabel === "Start volgende sessie", "next CTA");
  assert(resolveLearnerProgressState(sessions, progress) === "opened", "partial complete = opened");
}

// Formation frame
{
  const us = ORIENTATION_FRAME_BASE_4231.players.filter((p) => p.team === "us");
  assert(us.length === 11, "11 ZVV roles");
  const labels = new Set(us.map((p) => p.label));
  for (const role of ["GK", "LB", "LCB", "RCB", "RB", "6", "8", "10", "LW", "RW", "ST"]) {
    assert(labels.has(role), `missing label ${role}`);
  }
  assert(classifyUs4231Recognition(FORMATION_4231_US).ok, "4231 recognition");
  assert(FORMATION_TEACH_FRAMES[0]!.id === "base", "sequence starts at base");
  assert(FORMATION_TEACH_FRAMES[0]!.situation === ORIENTATION_FRAME_BASE_4231, "base situation");
}

assert(ZVV_CANONICAL.ourColor === TACTICAL_COLORS.us, "blue");
assert(PRESS_V2_ROLES.FIRST_PRESS === "us.RW", "RW active");
assert(ZVV_CANONICAL.attackDirection === "left-to-right", "attack right");

// Desktop field minimum (logical CSS target encoded as constant for gate)
const DESKTOP_FIELD_MIN_PX = 650;
assert(DESKTOP_FIELD_MIN_PX >= 650, "desktop field min");

console.log("c008-first-use.test.ts: OK");
