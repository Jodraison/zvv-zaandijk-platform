/**
 * Academy dashboard visibility rules (C-006–C-008).
 * Run: npx tsx src/lib/decision-lab/academy-visibility.test.ts
 */
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";
import {
  resolveAcademyDashboardVisibility,
  resolveCanonicalLearnerModel,
  sessionDistinctLabel,
} from "@/lib/decision-lab/academy-visibility";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
assert(sessions.length >= 3, "need at least 3 sessions");
const s0 = sessions[0]!;
const s1 = sessions[1]!;

{
  const v = resolveAcademyDashboardVisibility(sessions, {});
  assert(v.ctaLabel === "Start eerste beslissessie", "untouched CTA");
  assert(v.showRecent === false, "no recent");
  assert(v.isFirstStart === true, "first");
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
  const m = resolveCanonicalLearnerModel(sessions, progress);
  assert(m.ctaLabel === "Ga verder met je sessie", "continue");
  assert(m.showResumeDetail === true, "resume");
  assert(m.recommendation?.id === s1.id, "next");
  const recLabel = sessionDistinctLabel(m.recommendation!, m.primary);
  if (s1.playerTitle === s0.playerTitle) {
    assert(recLabel !== m.primary!.playerTitle, "distinct");
  }
}

console.log("academy-visibility.test.ts: OK");
