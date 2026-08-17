/**
 * Validates that every tactical comparison has full bad + good sides.
 * Run: npx tsx src/lib/academie/comparison-validation.ts
 */
import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";

type Issue = { lesson: string; code: string; message: string };

const issues: Issue[] = [];
let comparisons = 0;
let migrated = 0;

function requireSide(lesson: string, role: string, situationId: string | undefined) {
  if (!situationId) {
    issues.push({ lesson, code: "missing-situation", message: `${role} missing situationId` });
    return;
  }
  if (!getTacticalSituation(situationId)) {
    issues.push({ lesson, code: "unknown-situation", message: `${role} unknown situation ${situationId}` });
  }
  if (!getTacticalAnimation(situationId)) {
    issues.push({
      lesson,
      code: "missing-animation",
      message: `${role} ${situationId} has no animation (static fallback only)`,
    });
  }
}

for (const lesson of ACADEMY_LESSON_DEFINITIONS) {
  const std = lesson.standard;
  if (!std) continue;
  const slug = lesson.slug;

  if (std.recognizeCompare) {
    comparisons++;
    const c = std.recognizeCompare;
    if (c.badSituationId && c.goodSituationId) {
      migrated++;
      requireSide(slug, "recognize.bad", c.badSituationId);
      requireSide(slug, "recognize.good", c.goodSituationId);
      if (!c.bad?.trim() || !c.good?.trim()) {
        issues.push({ lesson: slug, code: "missing-takeaway", message: "recognizeCompare takeaway empty" });
      }
    } else {
      issues.push({
        lesson: slug,
        code: "incomplete-recognize",
        message: "recognizeCompare missing badSituationId or goodSituationId",
      });
    }
  }

  if (std.choiceCompare) {
    comparisons++;
    migrated++;
    requireSide(slug, "choice.left", std.choiceCompare.left.situationId);
    requireSide(slug, "choice.right", std.choiceCompare.right.situationId);
  }

  for (const pair of std.mistakes ?? []) {
    comparisons++;
    const badId = pair.badSituationId;
    const goodId = pair.goodSituationId;
    if (!badId || !goodId) {
      issues.push({
        lesson: slug,
        code: "text-only-good",
        message: `mistake pair missing dual situationIds (visual=${pair.visual})`,
      });
      continue;
    }
    migrated++;
    requireSide(slug, "mistake.bad", badId);
    requireSide(slug, "mistake.good", goodId);
    if (!pair.better?.trim()) {
      issues.push({ lesson: slug, code: "missing-good-takeaway", message: "mistake better empty" });
    }
  }

  for (const moment of std.matchMoments ?? []) {
    const agreement = (moment.agreementLabel ?? "").toLowerCase();
    const action = (moment.actionLabel ?? "").toLowerCase();
    // Alleen echte Fout/Beter- of Verkeerd/Gewenst-vergelijkingen (niet Herken/Gewenst).
    const isTacticalCompare =
      Boolean(moment.goodSituationId) ||
      (/verkeerd|fout|niet goed/.test(agreement) && /gewenst|beter|goed/.test(action));
    if (!isTacticalCompare) continue;
    comparisons++;
    if (!moment.goodSituationId) {
      issues.push({
        lesson: slug,
        code: "match-text-only-good",
        message: `matchMoment "${moment.title}" Verkeerd/Gewenst without goodSituationId`,
      });
      continue;
    }
    migrated++;
    requireSide(slug, "match.bad", moment.situationId);
    requireSide(slug, "match.good", moment.goodSituationId);
  }
}

const errors = issues.filter((i) => i.code !== "missing-animation");
const warns = issues.filter((i) => i.code === "missing-animation");

console.log("comparisonsFound", comparisons);
console.log("comparisonsMigrated", migrated);
console.log("errors", errors.length);
console.log("animationWarns", warns.length);
if (errors.length) {
  for (const e of errors.slice(0, 40)) console.log("ERR", e.lesson, e.code, e.message);
  process.exitCode = 1;
} else {
  console.log("comparisonValidation: ok");
}
if (warns.length) {
  for (const w of warns.slice(0, 20)) console.log("WARN", w.lesson, w.message);
}
