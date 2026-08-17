/**
 * Tactical Film Standard V2 — visual production gate for press-bad / press-good ONLY.
 * Run: npm run academy:validate-tactical-standard-v2-pressure
 *
 * Never CERTIFIED. Exit 0 = REVIEW READY candidate; exit 1 = BLOCKED.
 */

import fs from "node:fs";
import path from "node:path";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  PRESS_REFERENCE_START_STATE,
  PRESS_V2_BAD_US_END,
  PRESS_V2_BODY_KEY,
  PRESS_V2_GOOD_US_END,
  PRESS_V2_ROLES,
  PRESS_V2_US_START,
  pressV2GoodSpacingReport,
  pressV2MetersBetween,
  type PressShape,
} from "@/lib/academie/tactical-press-reference-v2";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import { ACADEMY_SITUATION_STANDARD_META } from "@/lib/academie/tactical-film-standard-v1";

const OUT = path.resolve(".review-screenshots/tactical-standard-v2-pressure");
fs.mkdirSync(OUT, { recursive: true });

type GateIssue = { level: "error" | "warn"; code: string; message: string };
const issues: GateIssue[] = [];

function err(code: string, message: string) {
  issues.push({ level: "error", code, message });
}
function warn(code: string, message: string) {
  issues.push({ level: "warn", code, message });
}

function ptsEqual(a: TacticalPoint, b: TacticalPoint, eps = 0.01): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

function countCluster(players: Record<string, TacticalPoint>, radiusM: number): number {
  const ids = Object.keys(players);
  let maxCluster = 1;
  for (const id of ids) {
    let n = 0;
    for (const other of ids) {
      if (pressV2MetersBetween(players[id]!, players[other]!) <= radiusM) n += 1;
    }
    maxCluster = Math.max(maxCluster, n);
  }
  return maxCluster;
}

function shapeReadable442(end: Record<string, TacticalPoint>): boolean {
  // Front > mid > back in x (attack L→R), with RW advanced on ball side allowed.
  const frontX = Math.min(end["SP"]!.x, end["10"]!.x);
  const midX = Math.min(end.LW!.x, end.L6!.x, end.R6!.x);
  const backX = Math.max(end.LB!.x, end.LCV!.x);
  // Midline still behind fronts for ST/10; R6/RW may push higher.
  return frontX >= midX - 4 && midX >= backX - 2 && end.RW!.x > end.R6!.x;
}

// --- Comparison purity: identical start ---
const badSit = getTacticalSituation("press-bad");
const goodSit = getTacticalSituation("press-good");
const identicalStart: Record<string, unknown> = {
  players: true,
  ball: true,
  camera: true,
  orientation: true,
  linesEmpty: true,
  deltas: [] as string[],
};

if (!badSit || !goodSit) {
  err("missing-situation", "press-bad or press-good situation missing");
} else {
  const badMap = Object.fromEntries(badSit.players.map((p) => [p.id, p.at]));
  const goodMap = Object.fromEntries(goodSit.players.map((p) => [p.id, p.at]));
  for (const id of Object.keys(badMap)) {
    if (!goodMap[id] || !ptsEqual(badMap[id]!, goodMap[id]!)) {
      identicalStart.players = false;
      (identicalStart.deltas as string[]).push(`player:${id}`);
      err("start-mismatch", `Player ${id} start differs between bad and good`);
    }
  }
  const badBall = badSit.ball;
  const goodBall = goodSit.ball;
  if (
    !badBall ||
    !goodBall ||
    !ptsEqual(badBall, goodBall) ||
    !ptsEqual(badBall, PRESS_REFERENCE_START_STATE.ballAt)
  ) {
    identicalStart.ball = false;
    err("ball-start-mismatch", "Ball start not identical / not from PRESS_REFERENCE_START_STATE");
  }
  if ((badSit.lines?.length ?? 0) !== 0 || (goodSit.lines?.length ?? 0) !== 0) {
    identicalStart.linesEmpty = false;
    err("start-lines", "Start situations must have empty lines for identical first frame");
  }
  for (const [pos, pt] of Object.entries(PRESS_V2_US_START)) {
    const a = badMap[`us.${pos}`];
    if (!a || !ptsEqual(a, pt)) {
      err("start-not-shared-state", `us.${pos} does not match PRESS_REFERENCE_START_STATE`);
    }
  }
}

// --- Animations exist ---
const animBad = getTacticalAnimation("press-bad");
const animGood = getTacticalAnimation("press-good");
if (!animBad || !animGood) err("missing-animation", "press animations missing from registry");

// --- Roles / meta ---
const metaGood = ACADEMY_SITUATION_STANDARD_META["press-good"];
const metaBad = ACADEMY_SITUATION_STANDARD_META["press-bad"];
if (metaGood?.opponentModel !== "BUILDUP_4_2_3_1" || metaBad?.opponentModel !== "BUILDUP_4_2_3_1") {
  err("opponent-model", "press pair must use BUILDUP_4_2_3_1");
}
if (metaGood?.pressingRoles?.FIRST_PRESS !== PRESS_V2_ROLES.FIRST_PRESS) {
  err("first-press-role", `Expected FIRST_PRESS ${PRESS_V2_ROLES.FIRST_PRESS}`);
}
if (metaBad?.pressingRoles?.SECOND_PRESS) {
  err("bad-has-second", "press-bad must not declare SECOND_PRESS");
}

// --- Spacing / geometry ---
const spacing = pressV2GoodSpacingReport();
const spacingOk: Record<string, boolean> = {};
for (const [key, range] of Object.entries(spacing.targets)) {
  const v = spacing[key as keyof typeof spacing] as number;
  const [lo, hi] = range as [number, number];
  const ok = v >= lo && v <= hi;
  spacingOk[key] = ok;
  if (!ok) err("spacing", `${key}=${v.toFixed(2)}m outside ${lo}-${hi}m`);
}

const badCluster = countCluster(PRESS_V2_BAD_US_END as unknown as PressShape, 8);
const goodCluster = countCluster(PRESS_V2_GOOD_US_END as unknown as PressShape, 8);
if (badCluster > 3) err("bad-cluster", `Bad end cluster ${badCluster} players within 8m (max 3)`);
if (goodCluster > 3) err("good-cluster", `Good end cluster ${goodCluster} players within 8m (max 3)`);

if (!shapeReadable442(PRESS_V2_GOOD_US_END as unknown as Record<string, TacticalPoint>)) {
  err("shape-442", "Good end does not preserve readable 4-4-2 progression");
}

// Bad principle: only RW moves meaningfully
{
  const moved: string[] = [];
  for (const pos of Object.keys(PRESS_V2_US_START) as (keyof typeof PRESS_V2_US_START)[]) {
    const d = pressV2MetersBetween(PRESS_V2_US_START[pos], PRESS_V2_BAD_US_END[pos]);
    if (d > 4) moved.push(`${pos}:${d.toFixed(1)}m`);
  }
  if (!moved.some((m) => m.startsWith("RW:"))) err("bad-no-rw", "Bad end must move RW");
  const others = moved.filter((m) => !m.startsWith("RW:"));
  if (others.length > 2) {
    err("bad-too-many-movers", `Bad should move mostly RW only; also moved: ${others.join(", ")}`);
  }
}

// Body key players
for (const id of ["opp.lb", "us.RW", "us.R6", "us.RB"] as const) {
  if (!PRESS_V2_BODY_KEY[id]) err("body-key", `Missing body readability for ${id}`);
}

// Hierarchy: animation steps should not set >3 highlights (warn)
for (const anim of [animBad, animGood]) {
  if (!anim) continue;
  for (const step of anim.steps) {
    for (const action of step.actions) {
      if (action.kind === "highlight") {
        const ids = action.playerIds ?? [];
        if (ids.length > 3) {
          warn("highlight-noise", `${anim.situationId}/${step.id} highlights ${ids.length}`);
        }
      }
      if (action.kind === "setLines" && action.lines.length > 2) {
        warn("line-noise", `${anim.situationId}/${step.id} has ${action.lines.length} lines`);
      }
    }
  }
}

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");
const status = errors.length === 0 ? "REVIEW_READY_CANDIDATE" : "BLOCKED";

const identicalReport = {
  status: identicalStart.players && identicalStart.ball && identicalStart.linesEmpty ? "PASS" : "FAIL",
  ...identicalStart,
  sharedStateVersion: PRESS_REFERENCE_START_STATE.version,
};
const spacingReport = { status: Object.values(spacingOk).every(Boolean) ? "PASS" : "FAIL", spacing, spacingOk };
const roleReport = {
  status: errors.some((e) => e.code.includes("press") || e.code.includes("role") || e.code === "opponent-model")
    ? "FAIL"
    : "PASS",
  good: metaGood?.pressingRoles,
  bad: metaBad?.pressingRoles,
  canonical: PRESS_V2_ROLES,
};
const hierarchyReport = {
  status: warns.some((w) => w.code === "highlight-noise" || w.code === "line-noise") ? "WARN" : "PASS",
  maxPrimary: 1,
  maxSecondary: 2,
  notes: "Overview uses hierarchyQuiet; detail allows primary+secondary",
};
const cardReadabilityReport = {
  status: badCluster <= 3 && goodCluster <= 3 ? "PASS" : "FAIL",
  maxClusterWithin8m: { bad: badCluster, good: goodCluster },
  rule: "max 3 players within 8m",
  dualView: "overview full + press-detail crop required in UI",
};
const visualGate = {
  version: "2.0.0-pressure",
  status,
  cardReadability: cardReadabilityReport.status,
  tacticalReadability: status === "REVIEW_READY_CANDIDATE" ? "PASS" : "FAIL",
  shapePreservation: shapeReadable442(PRESS_V2_GOOD_US_END as unknown as Record<string, TacticalPoint>)
    ? "PASS"
    : "FAIL",
  comparisonPurity: identicalReport.status,
  visualHierarchy: hierarchyReport.status,
  errors,
  warns,
};

fs.writeFileSync(path.join(OUT, "identical-start-report.json"), JSON.stringify(identicalReport, null, 2));
fs.writeFileSync(path.join(OUT, "pressure-spacing-report.json"), JSON.stringify(spacingReport, null, 2));
fs.writeFileSync(path.join(OUT, "pressure-role-report.json"), JSON.stringify(roleReport, null, 2));
fs.writeFileSync(path.join(OUT, "visual-hierarchy-report.json"), JSON.stringify(hierarchyReport, null, 2));
fs.writeFileSync(path.join(OUT, "card-readability-report.json"), JSON.stringify(cardReadabilityReport, null, 2));
fs.writeFileSync(path.join(OUT, "visual-production-gate-v2.json"), JSON.stringify(visualGate, null, 2));

console.log("V2 pressure gate:", status);
console.log("errors", errors.length, "warns", warns.length);
for (const e of errors) console.log("ERR", e.code, e.message);
for (const w of warns) console.log("WARN", w.code, w.message);
console.log("Wrote reports →", OUT);

if (errors.length) process.exitCode = 1;
else console.log("tactical-film-standard-v2-pressure-gate: ok (not CERTIFIED)");
