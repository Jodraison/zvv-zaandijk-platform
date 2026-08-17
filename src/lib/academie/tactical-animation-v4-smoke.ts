/**
 * V4 smoke: registry + realism + collision/pressing/spacing/local/role validators.
 * Run: npx tsx src/lib/academie/tactical-animation-v4-smoke.ts
 */
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { validateAnimationRealism } from "@/lib/academie/tactical-animation-realism";
import {
  validateAnimationCollision,
  validateDefensiveSpacing,
  validateLocalNumbers,
  validatePressingChain,
  validateRoleIntegrity,
} from "@/lib/academie/tactical-animation-v4-validators";
import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";
import { validateAllAcademyLessons } from "@/lib/academie/lesson-validation";

const ids = listAnimatedSituationIds();
console.log("animated", ids.length);

const buckets = {
  collision: 0,
  spacing: 0,
  chain: 0,
  local: 0,
  role: 0,
  offside: 0,
  formation: 0,
  realismErrors: 0,
};

const pilots = [
  "press-good",
  "press-bad",
  "connected-team",
  "kw-choice-force",
  "kw-choice-relocate",
  "ta-lcv-buildup",
  "ta-rb-alone",
  "ta-rb-support",
  "gr-10-loss",
  "gr-l6-recover",
  "in-r6-win",
  "in-moment-press",
  "in-moment-rest",
  "me-spits-miss",
  "me-10-refocus",
  "me-moment-late",
];

for (const id of ids) {
  const sit = getTacticalSituation(id);
  const anim = getTacticalAnimation(id);
  if (!sit || !anim) {
    console.log("MISSING", id);
    continue;
  }
  const issues = validateAnimationRealism(sit, anim);
  for (const i of issues) {
    if (i.level !== "error") continue;
    buckets.realismErrors++;
    if (i.code.includes("collision")) buckets.collision++;
    else if (i.code.includes("spacing") || i.code.includes("double-mark") || i.code.includes("last-line"))
      buckets.spacing++;
    else if (i.code.includes("press-chain")) buckets.chain++;
    else if (i.code.includes("local-numbers")) buckets.local++;
    else if (i.code.includes("role")) buckets.role++;
    else if (i.code.includes("offside")) buckets.offside++;
    else if (i.code.includes("shape") || i.code.includes("formation")) buckets.formation++;
  }
  // dedicated counters (errors+warns)
  buckets.collision += validateAnimationCollision(sit, anim).filter((x) => x.level === "error").length;
  buckets.spacing += validateDefensiveSpacing(sit, anim).filter((x) => x.level === "error").length;
  buckets.chain += validatePressingChain(sit, anim).filter((x) => x.level === "error").length;
  buckets.local += validateLocalNumbers(sit, anim).filter((x) => x.level === "error").length;
  buckets.role += validateRoleIntegrity(sit, anim).filter((x) => x.level === "error").length;
}

console.log("V4_ERROR_BUCKETS", buckets);

for (const id of pilots) {
  const sit = getTacticalSituation(id)!;
  const anim = getTacticalAnimation(id)!;
  const issues = validateAnimationRealism(sit, anim);
  const errors = issues.filter((i) => i.level === "error");
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.55));
  console.log("PILOT", {
    id,
    durationMs: anim.durationMs,
    steps: anim.steps.length,
    labels: anim.steps.map((s) => s.label),
    midPhase: mid.statusLabel,
    primary: mid.tacticalState?.primaryPressurePlayerId,
    cover: mid.tacticalState?.coverPlayerIds,
    errors: errors.map((e) => e.code),
  });
}

const mains = ["connected-team", "press-bad", "press-good", "kw-choice-force", "kw-choice-relocate"];
const goedNiet = ["press-good", "press-bad"];
const avgMain =
  mains.reduce((s, id) => s + (getTacticalAnimation(id)?.durationMs ?? 0), 0) / mains.length;
const avgGn =
  goedNiet.reduce((s, id) => s + (getTacticalAnimation(id)?.durationMs ?? 0), 0) / goedNiet.length;

console.log("avgMainDurationMs", Math.round(avgMain));
console.log("avgGoedNietDurationMs", Math.round(avgGn));
console.log(
  "lessons",
  validateAllAcademyLessons(ACADEMY_LESSON_DEFINITIONS).every((x) => x.passed),
);
console.log(
  "allSequencesOk",
  ids.every((id) => {
    const sit = getTacticalSituation(id);
    const anim = getTacticalAnimation(id);
    if (!sit || !anim) return false;
    return validateAnimationRealism(sit, anim).every((i) => i.level !== "error");
  }),
);
