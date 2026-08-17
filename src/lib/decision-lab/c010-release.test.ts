/**
 * C-010 release-candidate gates.
 * Run: npx tsx src/lib/decision-lab/c010-release.test.ts
 */
import {
  assertTransformTraceable,
  FORMATION_TEACH_FRAMES,
  FORMATION_TRIGGER_US,
  TRANSFORM_T_TRIGGER,
} from "@/lib/decision-lab/formation-teach-frames";
import {
  migrateProgressMap,
  type DecisionLabProgressMap,
} from "@/lib/decision-lab/progress";
import {
  LESSON_FLOW,
  PROGRESS_VERSION,
  migrateLegacyElevenStep,
  resolveLessonStageFromLegacy,
  lessonStageLabel,
} from "@/lib/decision-lab/lesson-stages";
import { resolveCanonicalLearnerModel } from "@/lib/decision-lab/academy-visibility";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import { FORMATION_4231_US } from "@/lib/academie/tactical-visual-system";
import { PRESS_V2_US_START } from "@/lib/academie/tactical-press-reference-v2";
import { classifyUs4231Recognition } from "@/lib/academie/tactical-canonical-perspective";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
const s0 = sessions[0]!;

// Transform frames
assert(FORMATION_TEACH_FRAMES.length === 3, "3 transform stages");
assert(FORMATION_TEACH_FRAMES[0]!.id === "base", "base");
assert(FORMATION_TEACH_FRAMES[1]!.id === "trigger", "trigger");
assert(FORMATION_TEACH_FRAMES[2]!.id === "press", "press");
assert(TRANSFORM_T_TRIGGER > 0 && TRANSFORM_T_TRIGGER < 1, "mid t");
const trace = assertTransformTraceable();
assert(trace.ok, `traceable: ${trace.issues.join("; ")}`);
assert(classifyUs4231Recognition(FORMATION_4231_US).ok, "4231 base");
assert(Object.keys(FORMATION_TRIGGER_US).length === 11, "11 mid");
assert(Object.keys(PRESS_V2_US_START).length === 11, "11 press");

// Named stages
assert(LESSON_FLOW.join(",") === "situation,scan,decision,consequence,explanation,completion", "names");
assert(migrateLegacyElevenStep(0) === "situation", "leg0");
assert(migrateLegacyElevenStep(4) === "decision", "leg4");
assert(migrateLegacyElevenStep(10) === "completion", "leg10");
assert(resolveLessonStageFromLegacy({ lessonStage: "view" }) === "situation", "alias view");
assert(resolveLessonStageFromLegacy({ step: 7 }) === "explanation", "legacy mid");
assert(resolveLessonStageFromLegacy({ status: "completed", step: 0 }) === "completion", "completed");

// Migration persists version
{
  const legacy: DecisionLabProgressMap = {
    [s0.id]: {
      status: "started",
      step: 8,
      updatedAt: "2026-01-01T00:00:00.000Z",
      openedAt: "2026-01-01T00:00:00.000Z",
    },
  };
  const { map, changed } = migrateProgressMap(legacy);
  assert(changed, "migration changed");
  assert(map[s0.id]!.progressVersion === PROGRESS_VERSION, "version 2");
  assert(map[s0.id]!.lessonStage === "explanation", "named");
  assert(map[s0.id]!.step === 4, "index");
}

{
  const completed: DecisionLabProgressMap = {
    [s0.id]: {
      status: "completed",
      step: 2,
      updatedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.000Z",
    },
  };
  const { map } = migrateProgressMap(completed);
  assert(map[s0.id]!.lessonStage === "completion", "keep completed");
  assert(map[s0.id]!.status === "completed", "status");
}

// State consistency
{
  const m = resolveCanonicalLearnerModel(sessions, {});
  assert(m.statusLabel === "Nog niet gestart", "untouched");
  assert(m.ctaLabel === "Start eerste beslissessie", "cta");
}
{
  const m = resolveCanonicalLearnerModel(sessions, {
    [s0.id]: {
      status: "started",
      step: 2,
      lessonStage: "decision",
      progressVersion: 2,
      openedAt: "2026-07-23T08:00:00.000Z",
      updatedAt: "2026-07-23T08:00:00.000Z",
    },
  });
  assert(m.statusLabel === "Bezig", "bezig");
  assert(m.resumeStageLabel === lessonStageLabel("decision"), "resume name");
}

console.log("c010-release.test.ts: OK");
