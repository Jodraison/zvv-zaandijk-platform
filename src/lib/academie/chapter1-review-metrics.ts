/**
 * Chapter 1 final review metrics — word counts + animation critical checks.
 * Run: npx tsx src/lib/academie/chapter1-review-metrics.ts
 */
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";
import type { AcademyLessonStandardV1 } from "@/lib/academie/lesson-standard-v1";

function countWords(s: string): number {
  return s.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function flattenStandard(std: AcademyLessonStandardV1 | undefined): string {
  if (!std) return "";
  const parts: string[] = [];
  if (std.learningOutcomes) parts.push(...std.learningOutcomes);
  if (std.situation?.explanation) parts.push(std.situation.explanation);
  if (std.situation?.note) parts.push(std.situation.note);
  for (const a of std.agreements ?? []) parts.push(a.title, a.body);
  if (std.recognizeCompare) parts.push(std.recognizeCompare.good, std.recognizeCompare.bad);
  if (std.choiceCompare) {
    parts.push(std.choiceCompare.left.title, std.choiceCompare.left.text);
    parts.push(std.choiceCompare.right.title, std.choiceCompare.right.text);
    if (std.choiceCompare.nuance) parts.push(std.choiceCompare.nuance);
  }
  if (std.decisionBranch) {
    const b = std.decisionBranch;
    parts.push(b.start, b.question, b.yes.result, b.no.result);
    if (b.end) parts.push(b.end);
    if (b.followUp) parts.push(b.followUp.question, b.followUp.yes.result, b.followUp.no.result);
    if (b.yesFollowUp) parts.push(b.yesFollowUp.question, b.yesFollowUp.yes.result, b.yesFollowUp.no.result);
  }
  if (std.positionNote) parts.push(std.positionNote);
  for (const m of std.matchMoments ?? []) {
    parts.push(m.title, m.situation, m.agreement, m.action, m.why);
  }
  for (const m of std.choiceMoments ?? []) {
    parts.push(m.title, m.situation, m.choiceA, m.choiceB, m.best, m.why);
  }
  for (const c of std.coachingChips ?? []) parts.push(c.label, c.meaning);
  if (std.summaryPoints) parts.push(...std.summaryPoints);
  if (std.closingNote) parts.push(std.closingNote);
  if (std.traitChips) parts.push(...std.traitChips);
  return parts.join(" ");
}

const CRITICAL = [
  "kw-choice-force",
  "kw-choice-relocate",
  "ta-lcv-buildup",
  "ta-rb-alone",
  "ta-rb-support",
  "gr-10-loss",
  "gr-l6-freeze",
  "gr-l6-recover",
  "in-r6-win",
  "in-10-late",
  "in-10-tempo",
  "in-moment-press",
  "in-moment-rest",
  "me-spits-miss",
  "me-10-hang",
  "me-10-refocus",
  "me-moment-late",
];

console.log("=== LESSON WORDS (content model, excl. SVG) ===");
for (const lesson of ACADEMY_LESSON_DEFINITIONS) {
  const body = flattenStandard(lesson.standard);
  const hero = [lesson.title, lesson.summary, lesson.keyTakeaway].join(" ");
  const n = countWords(hero + " " + body);
  console.log(lesson.slug, n, "est", lesson.estimatedReadingTime);
}

console.log("\n=== ANIMATION REGISTRY ===");
const ids = listAnimatedSituationIds();
console.log("count", ids.length);
let fail = 0;
let partial = 0;
let pass = 0;
const issues: string[] = [];

for (const id of ids) {
  const sit = getTacticalSituation(id);
  const anim = getTacticalAnimation(id);
  if (!sit || !anim) {
    fail++;
    issues.push(`${id}: missing sit/anim`);
    continue;
  }
  const start = evaluateTacticalAnimation(sit, anim, 0);
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.45));
  const end = evaluateTacticalAnimation(sit, anim, anim.durationMs);
  const done = evaluateTacticalAnimation(sit, anim, anim.durationMs + (anim.pauseAtEndMs ?? 0));

  let status: "PASS" | "PARTIAL" | "FAIL" = "PASS";
  if (!start.ball) {
    status = "FAIL";
    issues.push(`${id}: no ball at start`);
  }
  if (!mid.ball) {
    status = "FAIL";
    issues.push(`${id}: no ball mid`);
  }
  if (!done.done) {
    status = "PARTIAL";
    issues.push(`${id}: not done after pause`);
  }
  // reset: evaluate at 0 after end should match start holder
  const reset = evaluateTacticalAnimation(sit, anim, 0);
  if (reset.holderId !== start.holderId) {
    status = "FAIL";
    issues.push(`${id}: reset holder mismatch`);
  }
  // duration sanity
  if (anim.durationMs > 10000) {
    status = status === "FAIL" ? "FAIL" : "PARTIAL";
    issues.push(`${id}: duration >10s (${anim.durationMs})`);
  }
  if (status === "PASS") pass++;
  else if (status === "PARTIAL") partial++;
  else fail++;
}

console.log({ pass, partial, fail });
if (issues.length) console.log("issues", issues);

console.log("\n=== CRITICAL ===");
for (const id of CRITICAL) {
  const sit = getTacticalSituation(id)!;
  const anim = getTacticalAnimation(id)!;
  const start = evaluateTacticalAnimation(sit, anim, 0);
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.5));
  const end = evaluateTacticalAnimation(sit, anim, anim.durationMs);
  const ballMoved =
    start.ball && mid.ball
      ? Math.hypot(mid.ball.x - start.ball.x, mid.ball.y - start.ball.y) > 0.5
      : false;
  const hasBallMove = anim.steps.some((s) => s.actions.some((a) => a.kind === "ballMove"));
  console.log(id, {
    dur: anim.durationMs,
    startH: start.holderId,
    endH: end.holderId,
    endLabel: end.statusLabel,
    ballMoved: hasBallMove ? ballMoved : "n/a-no-pass",
  });
}
