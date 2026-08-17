/**
 * Tactical Intelligence V1 — validators (development).
 * Run: npx tsx src/lib/academie/tactical-intelligence-validate.ts
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { dist } from "@/lib/academie/tactical-animation-collision";
import {
  TACTICAL_DISTANCES,
  countInRadius,
  occupancyAlongLane,
} from "@/lib/academie/tactical-intelligence-roles";

type Issue = { level: "error" | "warn"; code: string; situationId: string; message: string };

const issues: Issue[] = [];
const PILOTS = new Set([
  "kw-r6-ball",
  "kw-choice-force",
  "kw-choice-relocate",
  "connected-team",
  "press-good",
  "press-bad",
  "solo-support",
  "ta-lcv-buildup",
  "in-r6-win",
  "in-moment-rest",
  "me-spits-miss",
]);

function sampleTimes(durationMs: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= durationMs; t += 500) out.push(t);
  if (out[out.length - 1] !== durationMs) out.push(durationMs);
  return out;
}

function movedDistance(
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  return dist(start, end);
}

for (const id of listAnimatedSituationIds()) {
  const sit = getTacticalSituation(id);
  const anim = getTacticalAnimation(id);
  if (!sit || !anim) {
    issues.push({ level: "error", code: "missing", situationId: id, message: "sit or anim missing" });
    continue;
  }

  const times = sampleTimes(anim.durationMs);
  const startFrame = evaluateTacticalAnimation(sit, anim, 0);
  const endFrame = evaluateTacticalAnimation(sit, anim, anim.durationMs);
  let maxCluster = 0;
  let staticRelevant = 0;
  let moversUs = 0;
  let moversOpp = 0;

  for (const [pid, start] of Object.entries(startFrame.playerAt)) {
    const end = endFrame.playerAt[pid];
    if (!end) continue;
    const d = movedDistance(start, end);
    if (d >= 3) {
      if (pid.startsWith("us.")) moversUs++;
      else moversOpp++;
    }
  }

  for (const t of times) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const ball = frame.ball ?? sit.ball ?? { x: 50, y: 50 };
    const pts = Object.values(frame.playerAt);
    // Cluster around ball
    const aroundBall = countInRadius(ball, pts, TACTICAL_DISTANCES.clusterRadius);
    maxCluster = Math.max(maxCluster, aroundBall);

    // Dense clusters anywhere (sample each us player as center)
    for (const [pid, p] of Object.entries(frame.playerAt)) {
      if (!pid.startsWith("us.")) continue;
      const n = countInRadius(p, pts, TACTICAL_DISTANCES.clusterRadius);
      maxCluster = Math.max(maxCluster, n);
    }

    // Pass lane overcrowding when a pass line exists
    for (const line of frame.lines ?? []) {
      if (line.kind !== "pass" && line.kind !== "fault") continue;
      const players = Object.entries(frame.playerAt).map(([pid, at]) => ({
        id: pid,
        at,
        team: (pid.startsWith("us.") ? "us" : "opponent") as "us" | "opponent",
      }));
      const blockers = occupancyAlongLane(line.from, line.to, players, 4.2);
      if (blockers.length >= 3 && line.kind === "pass") {
        issues.push({
          level: PILOTS.has(id) ? "error" : "warn",
          code: "passing-lane-overcrowded",
          situationId: id,
          message: `@${t}ms ${blockers.length} blockers on pass lane`,
        });
      }
    }
  }

  // Long-lived dense cluster: check mid samples
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.55));
  const midBall = mid.ball ?? sit.ball ?? { x: 50, y: 50 };
  const midCluster = countInRadius(midBall, Object.values(mid.playerAt), TACTICAL_DISTANCES.clusterRadius);
  if (midCluster > TACTICAL_DISTANCES.clusterMaxDuel) {
    issues.push({
      level: PILOTS.has(id) ? "error" : "warn",
      code: "cluster-density",
      situationId: id,
      message: `mid cluster around ball=${midCluster} (max ${TACTICAL_DISTANCES.clusterMaxDuel})`,
    });
  }

  // Relevant static players (near ball at start, barely move)
  for (const [pid, start] of Object.entries(startFrame.playerAt)) {
    const end = endFrame.playerAt[pid];
    if (!end) continue;
    if (dist(start, startFrame.ball ?? midBall) > TACTICAL_DISTANCES.relevantBallRadius) continue;
    if (movedDistance(start, end) < 2.2) staticRelevant++;
  }

  if (PILOTS.has(id)) {
    const needSeven = anim.complexity === "pattern" || id === "kw-r6-ball" || id === "press-good" || id === "connected-team";
    if (needSeven && moversUs < 7) {
      issues.push({
        level: "error",
        code: "relevant-player-static",
        situationId: id,
        message: `only ${moversUs} us movers (need ≥7)`,
      });
    } else if (!needSeven && moversUs < 4) {
      issues.push({
        level: "error",
        code: "relevant-player-static",
        situationId: id,
        message: `only ${moversUs} us movers (need ≥4)`,
      });
    }
    if (moversOpp < 3 && anim.complexity !== "micro") {
      issues.push({
        level: "warn",
        code: "opponent-cover-missing",
        situationId: id,
        message: `only ${moversOpp} opponent movers (want ≥3)`,
      });
    }
  }

  // Sixes distance at end for attacking anims
  const l6 = endFrame.playerAt["us.L6"];
  const r6 = endFrame.playerAt["us.R6"];
  if (l6 && r6) {
    const d6 = dist(l6, r6);
    if (d6 < TACTICAL_DISTANCES.sixesApart.min - 1) {
      issues.push({
        level: "warn",
        code: "support-angle-invalid",
        situationId: id,
        message: `L6-R6 distance ${d6.toFixed(1)} too tight`,
      });
    }
  }

  // Balance present in tacticalState on any step
  const hasBalance = anim.steps.some((s) => (s.tacticalState?.balancePlayerIds?.length ?? 0) > 0);
  if (PILOTS.has(id) && !hasBalance && anim.complexity === "pattern") {
    issues.push({
      level: "warn",
      code: "balance-player-missing",
      situationId: id,
      message: "no balancePlayerIds in tacticalState",
    });
  }

  if (PILOTS.has(id)) {
    console.log(
      JSON.stringify({
        id,
        moversUs,
        moversOpp,
        maxCluster,
        midCluster,
        staticRelevantNearBall: staticRelevant,
        durationMs: anim.durationMs,
      }),
    );
  }
}

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");
// Deduplicate noisy lane warnings
const uniq = new Map<string, Issue>();
for (const i of [...errors, ...warns]) {
  const key = `${i.situationId}:${i.code}:${i.message.slice(0, 40)}`;
  if (!uniq.has(key)) uniq.set(key, i);
}
const all = [...uniq.values()];
const errN = all.filter((i) => i.level === "error").length;
const warnN = all.filter((i) => i.level === "warn").length;

console.log("checked", listAnimatedSituationIds().length);
console.log("errors", errN);
console.log("warns", warnN);
for (const e of all.filter((i) => i.level === "error").slice(0, 30)) {
  console.log("ERR", e.situationId, e.code, e.message);
}
for (const w of all.filter((i) => i.level === "warn").slice(0, 20)) {
  console.log("WARN", w.situationId, w.code, w.message);
}
if (errN) process.exitCode = 1;
else console.log("tactical-intelligence-validate: ok");
