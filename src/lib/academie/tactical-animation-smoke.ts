/**
 * Smoke-check Tactical Animation System V3 (pilots + realism + registry).
 * Run: npx tsx src/lib/academie/tactical-animation-smoke.ts
 */
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";
import { validateAllAcademyLessons } from "@/lib/academie/lesson-validation";
import { validateAnimationRealism } from "@/lib/academie/tactical-animation-realism";

const ids = listAnimatedSituationIds();
console.log("animated", ids.length);

let short = 0;
let pass = 0;
let partial = 0;
let fail = 0;
const offsideHits: string[] = [];
const missingShape: string[] = [];

for (const id of ids) {
  const sit = getTacticalSituation(id);
  const anim = getTacticalAnimation(id);
  if (!sit || !anim) {
    console.log("MISSING", id);
    fail++;
    continue;
  }
  if (!anim.complexity) console.log("no complexity", id);
  const total = anim.durationMs + (anim.pauseAtEndMs ?? 0);
  if (anim.complexity !== "micro" && anim.durationMs < 5000) {
    console.log("SHORT", id, anim.durationMs);
    short++;
  }
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.55));
  const end = evaluateTacticalAnimation(sit, anim, total);
  if (!mid.ball) console.log("no ball mid", id);
  if (!end.done) console.log("not done", id);

  const issues = validateAnimationRealism(sit, anim);
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  for (const e of errors) {
    if (e.code === "unintended-offside") offsideHits.push(e.message);
  }
  if (!sit.homeShape || !sit.opponentShape) missingShape.push(id);

  if (errors.length === 0 && warns.length === 0) pass++;
  else if (errors.length === 0) partial++;
  else {
    fail++;
    console.log("REALISM_FAIL", id, errors.map((e) => e.code).join(","));
  }
}

const force = getTacticalSituation("kw-choice-force")!;
const aForce = getTacticalAnimation("kw-choice-force")!;
const f1 = evaluateTacticalAnimation(force, aForce, 0);
const f2 = evaluateTacticalAnimation(force, aForce, Math.floor(aForce.durationMs * 0.45));
const f3 = evaluateTacticalAnimation(force, aForce, aForce.durationMs);
console.log("FORCE", {
  durationMs: aForce.durationMs,
  steps: aForce.steps.length,
  startHolder: f1.holderId,
  midBall: f2.ball,
  midHolder: f2.holderId,
  midLabel: f2.statusLabel,
  endHolder: f3.holderId,
  endLabel: f3.statusLabel,
  oppCount: force.players.filter((p) => p.team === "opponent").length,
});

const rel = getTacticalSituation("kw-choice-relocate")!;
const aRel = getTacticalAnimation("kw-choice-relocate")!;
const r1 = evaluateTacticalAnimation(rel, aRel, 0);
const r2 = evaluateTacticalAnimation(rel, aRel, Math.floor(aRel.durationMs * 0.45));
const r3 = evaluateTacticalAnimation(rel, aRel, aRel.durationMs);
console.log("RELOCATE", {
  durationMs: aRel.durationMs,
  steps: aRel.steps.length,
  start: r1.holderId,
  midBall: r2.ball,
  midLabel: r2.statusLabel,
  end: r3.holderId,
  endLabel: r3.statusLabel,
  oppCount: rel.players.filter((p) => p.team === "opponent").length,
});

const ctSit = getTacticalSituation("connected-team")!;
const ct = getTacticalAnimation("connected-team")!;
const ctIssues = validateAnimationRealism(ctSit, ct);
console.log("CONNECTED", {
  durationMs: ct.durationMs,
  steps: ct.steps.length,
  labels: ct.steps.map((s) => s.label),
  homeShape: ctSit.homeShape,
  opponentShape: ctSit.opponentShape,
  oppCount: ctSit.players.filter((p) => p.team === "opponent").length,
  spX: ctSit.players.find((p) => p.id === "us.SP")?.at.x,
  realismErrors: ctIssues.filter((i) => i.level === "error").map((i) => i.message),
});

const mains = ["connected-team", "press-bad", "press-good", "kw-choice-force", "kw-choice-relocate"];
const mainDur =
  mains.reduce((s, id) => s + (getTacticalAnimation(id)?.durationMs ?? 0), 0) / mains.length;

console.log("shortCount", short);
console.log("realismPASS", pass);
console.log("realismPARTIAL", partial);
console.log("realismFAIL", fail);
console.log("offsideCount", offsideHits.length);
if (offsideHits.length) console.log("offsideSamples", offsideHits.slice(0, 8));
console.log("missingShapeCount", missingShape.length);
console.log("avgMainDurationMs", Math.round(mainDur));
console.log(
  "lessons",
  validateAllAcademyLessons(ACADEMY_LESSON_DEFINITIONS).every((x) => x.passed),
);
