/**
 * C-009 state language + journey gates.
 * Run: npx tsx src/lib/decision-lab/c009-player-journey.test.ts
 */
import {
  resolveCanonicalLearnerModel,
  nextSessionPlayerCopy,
} from "@/lib/decision-lab/academy-visibility";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import {
  LESSON_FLOW,
  lessonStageLabel,
  migrateLegacyLessonStep,
  stageFromStoredStep,
} from "@/lib/decision-lab/lesson-stages";
import { FORMATION_TEACH_FRAMES } from "@/lib/decision-lab/formation-teach-frames";
import { ZVV_CANONICAL, classifyUs4231Recognition } from "@/lib/academie/tactical-canonical-perspective";
import { FORMATION_4231_US } from "@/lib/academie/tactical-visual-system";
import { TACTICAL_COLORS } from "@/lib/academie/tactical-visual-tokens";
import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
const s0 = sessions[0]!;
const s1 = sessions[1]!;

{
  const m = resolveCanonicalLearnerModel(sessions, {});
  assert(m.statusLabel === "Nog niet gestart", "untouched status");
  assert(m.ctaLabel === "Start eerste beslissessie", "untouched CTA");
  assert(!/Ga verder/i.test(m.ctaLabel), "no ga verder");
  assert(!/Hervatten/i.test(m.statusDetail), "no hervatten");
  assert(m.showRecent === false, "no recent");
}

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
  assert(m.statusLabel === "Sessie geopend", "opened status");
  assert(m.ctaLabel === "Begin met de eerste situatie", "opened CTA");
  assert(!/ga verder waar je was/i.test(m.statusDetail), "no generic resume");
  assert(m.showResumeDetail === false, "opened not meaningful progress");
}

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
  assert(m.statusLabel === "Bezig", "in progress status");
  assert(m.ctaLabel === "Ga verder met je sessie", "in progress CTA");
  assert(m.resumeStageLabel === lessonStageLabel("decision"), "named stage");
  assert(m.statusDetail.includes("Ga verder vanaf:"), "exact resume");
}

{
  const progress: DecisionLabProgressMap = {
    [s0.id]: {
      status: "completed",
      step: 5,
      openedAt: "2026-07-23T08:00:00.000Z",
      completedAt: "2026-07-23T10:00:00.000Z",
      updatedAt: "2026-07-23T10:00:00.000Z",
    },
  };
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.primary?.id === s1.id, "next primary");
  assert(m.ctaLabel === "Start volgende sessie", "next CTA");
  assert(
    /linkerflank|pressingkeuze vanaf links/i.test(nextSessionPlayerCopy(s1, s0)),
    "player language next",
  );
}

assert(LESSON_FLOW.length === 6, "6 stages");
assert(migrateLegacyLessonStep(10) === 5, "legacy summary");
assert(stageFromStoredStep(2) === "decision", "decision");
assert(FORMATION_TEACH_FRAMES[0]!.label === "Basis 4-2-3-1", "frame1");
assert(FORMATION_TEACH_FRAMES[1]!.label === "Trigger", "frame2");
assert(FORMATION_TEACH_FRAMES[2]!.label === "Pressvorm", "frame3");
assert(ZVV_CANONICAL.ourColor === TACTICAL_COLORS.us, "blue");
assert(classifyUs4231Recognition(FORMATION_4231_US).ok, "4231");

console.log("c009-player-journey.test.ts: OK");
