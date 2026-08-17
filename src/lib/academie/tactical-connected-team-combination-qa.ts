/**
 * connected-team Pass 3 — combination QA (scenes 4–7). Report only.
 * Run: npm run academy:validate-connected-team-combination
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { CONNECTED_TEAM_PASS3_SEEKS } from "@/lib/academie/tactical-connected-team-production";
import { evaluateOffsideAtRelease } from "@/lib/academie/tactical-offside-release";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; atMs: number; message: string };

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function runConnectedTeamCombinationQa(): {
  ok: boolean;
  errorCount: number;
  warnCount: number;
  issues: Issue[];
} {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const issues: Issue[] = [];
  if (!sit || !anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error", code: "missing", atMs: 0, message: "connected-team missing" }],
    };
  }

  const binds = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["04a-sp-binds-start"]);
  const short = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["04b-sp-comes-short"]);
  const arrival = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["05b-sp-arrival"]);
  const contact = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["06a-sp-contact-hold"]);
  const tenRecv = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["06c-ten-receives-wall-pass"]);
  const rwRel = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["07a-third-player-release"]);
  const rwArr = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"]);

  const sp0 = binds.playerAt["us.SP"]!;
  const lcb0 = binds.playerAt["opp.lcb"]!;
  const rcb0 = binds.playerAt["opp.rcb"]!;
  // SP between CVs at bind start (y between CVs, similar x depth to line)
  if (!(sp0.y > Math.min(lcb0.y, rcb0.y) && sp0.y < Math.max(lcb0.y, rcb0.y))) {
    issues.push({
      severity: "error",
      code: "sp-not-between-cvs",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["04a-sp-binds-start"],
      message: `SP y=${sp0.y.toFixed(1)} not between CVs`,
    });
  }

  const sp1 = short.playerAt["us.SP"]!;
  const lcb1 = short.playerAt["opp.lcb"]!;
  const rcb1 = short.playerAt["opp.rcb"]!;
  const step = dist(lcb0, lcb1);
  if (step < 1.5 || step > 7) {
    issues.push({
      severity: "warn",
      code: "cv-step-size",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["04b-sp-comes-short"],
      message: `LCB step d=${step.toFixed(1)} (expect ~2–6)`,
    });
  }
  if (rcb1.x < rcb0.x - 0.5) {
    issues.push({
      severity: "warn",
      code: "cover-cv-not-deeper",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["04b-sp-comes-short"],
      message: "Cover CV should stay deeper or equal",
    });
  }
  if (dist(sp1, lcb1) < 3.2) {
    issues.push({
      severity: "error",
      code: "sp-cv-overlap",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["04b-sp-comes-short"],
      message: `SP↔LCB d=${dist(sp1, lcb1).toFixed(1)}`,
    });
  }

  const spA = arrival.playerAt["us.SP"]!;
  const tenA = arrival.playerAt["us.10"]!;
  const lcbA = arrival.playerAt["opp.lcb"]!;
  if (dist(spA, tenA) < 4) {
    issues.push({
      severity: "error",
      code: "ten-sp-overlap",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["05b-sp-arrival"],
      message: `10↔SP d=${dist(spA, tenA).toFixed(1)}`,
    });
  }
  if (dist(spA, lcbA) < 3.0) {
    issues.push({
      severity: "error",
      code: "sp-cv-arrival-overlap",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["05b-sp-arrival"],
      message: `SP↔LCB arrival d=${dist(spA, lcbA).toFixed(1)}`,
    });
  }
  if (arrival.holderId !== "us.SP") {
    issues.push({
      severity: "error",
      code: "sp-not-holder",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["05b-sp-arrival"],
      message: `holder=${arrival.holderId}`,
    });
  }

  if (contact.holderId !== "us.SP" && contact.ballTrajectory?.inFlight) {
    // ok if already releasing
  } else if (contact.holderId !== "us.SP" && !contact.ballTrajectory?.inFlight) {
    issues.push({
      severity: "warn",
      code: "contact-holder",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["06a-sp-contact-hold"],
      message: `expected SP hold, holder=${contact.holderId}`,
    });
  }

  const tenPassOrigin = short.playerAt["us.10"]!;
  const tenAfter = tenRecv.playerAt["us.10"]!;
  if (dist(tenPassOrigin, tenAfter) < 4) {
    issues.push({
      severity: "error",
      code: "ten-same-receive-spot",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["06c-ten-receives-wall-pass"],
      message: `10 kaats recv too close to pass origin d=${dist(tenPassOrigin, tenAfter).toFixed(1)}`,
    });
  }
  if (tenRecv.holderId !== "us.10") {
    issues.push({
      severity: "error",
      code: "ten-not-holder-after-kaats",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["06c-ten-receives-wall-pass"],
      message: `holder=${tenRecv.holderId}`,
    });
  }

  const rwP = rwRel.playerAt["us.RW"]!;
  const ballP = rwRel.ball ?? rwRel.playerAt["us.10"]!;
  const off = evaluateOffsideAtRelease({
    sequenceId: "connected-team",
    phaseId: "to-rw",
    releaseTimeMs: CONNECTED_TEAM_PASS3_SEEKS["07a-third-player-release"],
    passerId: "us.10",
    receiverId: "us.RW",
    ballPosition: ballP,
    receiverPosition: rwP,
    opponentPositions: Object.entries(rwRel.playerAt)
      .filter(([id]) => id.startsWith("opp."))
      .map(([id, at]) => ({ id, at })),
    attackDirection: "left-to-right",
  });
  if (off.status === "OFFSIDE") {
    issues.push({
      severity: "error",
      code: "rw-offside-at-release",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07a-third-player-release"],
      message: `RW OFFSIDE diff=${off.difference.toFixed(1)}`,
    });
  }

  const rw = rwArr.playerAt["us.RW"]!;
  const rb = rwArr.playerAt["us.RB"]!;
  const oppRb = rwArr.playerAt["opp.rb"]!;
  const r6 = rwArr.playerAt["us.R6"]!;
  const dRwOpp = dist(rw, oppRb);
  if (dRwOpp < 3.5) {
    issues.push({
      severity: "error",
      code: "rw-opp-back-overlap",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: `RW↔opp.rb d=${dRwOpp.toFixed(1)}`,
    });
  }
  if (rb.x > rw.x - 4 || rb.y > rw.y - 2) {
    issues.push({
      severity: "warn",
      code: "rb-not-under-rw",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: `RB should be left/behind RW (lower x, lower y). RB=${rb.x.toFixed(0)},${rb.y.toFixed(0)} RW=${rw.x.toFixed(0)},${rw.y.toFixed(0)}`,
    });
  }
  const dRwRb = dist(rw, rb);
  if (dRwRb < 5 || dRwRb > 16) {
    issues.push({
      severity: "warn",
      code: "rb-distance",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: `RW↔RB d=${dRwRb.toFixed(1)} (expect ~6–10)`,
    });
  }
  if (Math.abs(rw.x - rb.x) < 4 && Math.abs(rw.y - rb.y) < 6) {
    issues.push({
      severity: "error",
      code: "winger-back-double",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: "RW/RB double occupation",
    });
  }
  if (dist(rw, r6) < 6) {
    issues.push({
      severity: "warn",
      code: "r6-too-close-rw",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: `R6↔RW d=${dist(rw, r6).toFixed(1)}`,
    });
  }
  if (rwArr.holderId !== "us.RW") {
    issues.push({
      severity: "error",
      code: "rw-not-holder",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["07b-rw-arrival-clean"],
      message: `holder=${rwArr.holderId}`,
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return { ok: errors.length === 0, errorCount: errors.length, warnCount: warns.length, issues };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-combination-qa");
if (isMain) {
  const r = runConnectedTeamCombinationQa();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
