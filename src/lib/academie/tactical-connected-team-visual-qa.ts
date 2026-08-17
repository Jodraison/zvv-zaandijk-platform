/**
 * Programmable visual QA for connected-team only.
 * Complements browser review — does not replace it.
 */

import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateOffsideAtRelease } from "@/lib/academie/tactical-offside-release";
import { CONNECTED_TEAM_TRAJECTORIES } from "@/lib/academie/tactical-connected-team-production";
import { auditConnectedTeamMotionBoundaries } from "@/lib/academie/tactical-connected-team-motion-audit";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export type VisualQaIssue = {
  code: string;
  severity: "error" | "warn";
  atMs: number;
  message: string;
};

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function sampleTimes(durationMs: number, step = 50): number[] {
  const out: number[] = [];
  for (let t = 0; t <= durationMs; t += step) out.push(t);
  if (out[out.length - 1] !== durationMs) out.push(durationMs);
  return out;
}

export function runConnectedTeamVisualQa(): {
  ok: boolean;
  errors: VisualQaIssue[];
  warnings: VisualQaIssue[];
  motionFlags: number;
} {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const errors: VisualQaIssue[] = [];
  const warnings: VisualQaIssue[] = [];

  if (!sit || !anim) {
    errors.push({
      code: "missing-definition",
      severity: "error",
      atMs: 0,
      message: "connected-team situation or animation missing",
    });
    return { ok: false, errors, warnings, motionFlags: 0 };
  }

  let prevTrajId: string | null = null;
  let prevInFlight = false;

  for (const t of sampleTimes(anim.durationMs, 40)) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const count = frame.activeBallTrajectoryCount ?? 0;
    if (count > 1) {
      errors.push({
        code: "multi-trajectory",
        severity: "error",
        atMs: t,
        message: `activeBallTrajectoryCount=${count}`,
      });
    }

    const traj = frame.ballTrajectory;
    if (traj?.inFlight) {
      if (prevTrajId && traj.id !== prevTrajId && prevInFlight) {
        errors.push({
          code: "trajectory-swap-midflight",
          severity: "error",
          atMs: t,
          message: `id ${prevTrajId} → ${traj.id} before arrival`,
        });
      }
      prevTrajId = traj.id;
      if (frame.ball) {
        const onPath = dist(frame.ball, traj.ballAt);
        if (onPath > 0.35) {
          errors.push({
            code: "ball-off-trajectory",
            severity: "error",
            atMs: t,
            message: `ball vs traj.ballAt delta=${onPath.toFixed(2)}`,
          });
        }
      }
    }

    if (traj && !traj.inFlight && traj.laneOpacity > 0.02) {
      // fading — ok
    }
    if (traj && !traj.inFlight && traj.laneOpacity <= 0.02 && (frame.lines?.length ?? 0) > 0) {
      const passLines = (frame.lines ?? []).filter((l) => l.kind === "pass");
      // option lines at end are allowed
      if (passLines.length && frame.activeStepId !== "end") {
        warnings.push({
          code: "lane-after-fade",
          severity: "warn",
          atMs: t,
          message: `pass lines remain after fade (step=${frame.activeStepId})`,
        });
      }
    }

    prevInFlight = Boolean(traj?.inFlight);
    if (!traj?.inFlight && traj?.laneOpacity === 0) prevTrajId = traj?.id ?? prevTrajId;
  }

  // Release proximity: ball may sit beside passer (offset ~4–5 field units)
  const RELEASE_TOL = 6.5;
  const ARRIVAL_TOL = 7;
  for (const traj of CONNECTED_TEAM_TRAJECTORIES) {
    const release = evaluateTacticalAnimation(sit, anim, traj.releaseTimeMs);
    const arrival = evaluateTacticalAnimation(sit, anim, traj.arrivalTimeMs);
    const passerId = traj.passerId;
    const receiverId = traj.receiverId;
    const passer = passerId ? release.playerAt[passerId] : undefined;
    const receiver = receiverId ? arrival.playerAt[receiverId] : undefined;
    if (passer && release.ball && dist(release.ball, passer) > RELEASE_TOL) {
      errors.push({
        code: "release-not-at-passer",
        severity: "error",
        atMs: traj.releaseTimeMs,
        message: `${traj.id}: ball far from ${passerId} d=${dist(release.ball, passer).toFixed(1)}`,
      });
    }
    if (receiver && arrival.ball && dist(arrival.ball, receiver) > ARRIVAL_TOL) {
      errors.push({
        code: "arrival-not-at-receiver",
        severity: "error",
        atMs: traj.arrivalTimeMs,
        message: `${traj.id}: ball far from ${receiverId} d=${dist(arrival.ball, receiver).toFixed(1)}`,
      });
    }

    // Lane should be gone ~450ms after arrival
    const post = evaluateTacticalAnimation(sit, anim, traj.arrivalTimeMs + 450);
    if (post.ballTrajectory?.id === traj.id && (post.ballTrajectory.laneOpacity ?? 0) > 0.08) {
      warnings.push({
        code: "lane-fade-slow",
        severity: "warn",
        atMs: traj.arrivalTimeMs + 450,
        message: `${traj.id}: laneOpacity=${post.ballTrajectory.laneOpacity.toFixed(2)}`,
      });
    }
  }

  // RW onside at real release of 10→RW
  const rwTraj = CONNECTED_TEAM_TRAJECTORIES.find((t) => t.id === "ct.pass.10-rw");
  if (rwTraj) {
    const fr = evaluateTacticalAnimation(sit, anim, rwTraj.releaseTimeMs);
    const defenders = Object.entries(fr.playerAt)
      .filter(([id]) => id.startsWith("opp."))
      .map(([id, at]) => ({ id, at }));
    const rw = fr.playerAt["us.RW"];
    if (rw && fr.ball) {
      const off = evaluateOffsideAtRelease({
        sequenceId: "connected-team",
        phaseId: "to-rw",
        releaseTimeMs: rwTraj.releaseTimeMs,
        passerId: rwTraj.passerId ?? "us.10",
        receiverId: "us.RW",
        ballPosition: fr.ball,
        receiverPosition: rw,
        opponentPositions: defenders,
        attackDirection: "left-to-right",
      });
      if (off.status === "OFFSIDE") {
        errors.push({
          code: "rw-offside-at-release",
          severity: "error",
          atMs: rwTraj.releaseTimeMs,
          message: `RW offside difference=${off.difference.toFixed(1)}`,
        });
      }
    }
  }

  // Scene continuity (position jump at boundaries)
  const motion = auditConnectedTeamMotionBoundaries(100);
  const motionFlags = motion.filter((m) => m.flags.length > 0).length;
  for (const m of motion) {
    if (m.flags.includes("position-jump")) {
      errors.push({
        code: "scene-position-jump",
        severity: "error",
        atMs: m.boundaryMs,
        message: `${m.playerId} jump=${m.positionDelta.toFixed(2)}`,
      });
    } else if (m.flags.length) {
      warnings.push({
        code: "scene-motion-flag",
        severity: "warn",
        atMs: m.boundaryMs,
        message: `${m.playerId} ${m.flags.join(",")}`,
      });
    }
  }

  // No setLines pass during filmPass mid-flight windows (orphan dashed passes)
  for (const traj of CONNECTED_TEAM_TRAJECTORIES) {
    const mid = Math.floor((traj.releaseTimeMs + traj.arrivalTimeMs) / 2);
    const fr = evaluateTacticalAnimation(sit, anim, mid);
    if ((fr.activeBallTrajectoryCount ?? 0) !== 1 && traj.status !== "intercepted") {
      // loss may still be 1
    }
    if (fr.ballTrajectory && fr.ballTrajectory.id !== traj.id && fr.ballTrajectory.inFlight) {
      errors.push({
        code: "wrong-active-trajectory",
        severity: "error",
        atMs: mid,
        message: `expected ${traj.id}, got ${fr.ballTrajectory.id}`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    motionFlags,
  };
}

/** CLI entry */
function main() {
  const result = runConnectedTeamVisualQa();
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        errorCount: result.errors.length,
        warnCount: result.warnings.length,
        motionFlags: result.motionFlags,
        errors: result.errors.slice(0, 40),
        warnings: result.warnings.slice(0, 40),
      },
      null,
      2,
    ),
  );
  if (!result.ok) process.exit(1);
}

const isMain = process.argv[1]?.includes("tactical-connected-team-visual-qa");
if (isMain) main();
