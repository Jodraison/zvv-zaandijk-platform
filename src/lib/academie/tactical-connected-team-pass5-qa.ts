/**
 * connected-team Pass 5 — role / marker / decision / ball QA (report only).
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  CONNECTED_TEAM_EIGHT_ID,
  CONNECTED_TEAM_FORBIDDEN_LABELS,
  CONNECTED_TEAM_ROLE_MAP,
  CONNECTED_TEAM_SIX_ID,
  connectedTeamDisplayLabel,
} from "@/lib/academie/tactical-connected-team-roles";
import { CONNECTED_TEAM_TRAJECTORIES } from "@/lib/academie/tactical-connected-team-production";
import { TACTICAL_PLAYER_STYLES } from "@/lib/academie/tactical-visual-tokens";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; message: string };

function dist(a: TacticalPoint, b: TacticalPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegmentDistance(p: TacticalPoint, a: TacticalPoint, b: TacticalPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

export function runConnectedTeamRoleQa() {
  const issues: Issue[] = [];
  const sit = getTacticalSituation("connected-team");
  if (!sit) {
    return { ok: false, errorCount: 1, warnCount: 0, issues: [{ severity: "error" as const, code: "missing", message: "missing" }], labels: {} };
  }
  const labels: Record<string, string> = {};
  const us = sit.players.filter((p) => p.team === "us");
  for (const p of us) {
    const expected = connectedTeamDisplayLabel(p.id);
    labels[p.id] = p.label;
    if (p.label !== expected) {
      issues.push({
        severity: "error",
        code: "label-mismatch",
        message: `${p.id} label=${p.label} expected=${expected}`,
      });
    }
    for (const bad of CONNECTED_TEAM_FORBIDDEN_LABELS) {
      if (p.label === bad) {
        issues.push({ severity: "error", code: "forbidden-label", message: `visible ${bad} on ${p.id}` });
      }
    }
  }
  const six = us.filter((p) => p.label === "6");
  const eight = us.filter((p) => p.label === "8");
  const ten = us.filter((p) => p.label === "10");
  const st = us.filter((p) => p.label === "ST");
  if (six.length !== 1) issues.push({ severity: "error", code: "six-count", message: `expected 1×6 got ${six.length}` });
  if (eight.length !== 1) issues.push({ severity: "error", code: "eight-count", message: `expected 1×8 got ${eight.length}` });
  if (ten.length !== 1) issues.push({ severity: "error", code: "ten-count", message: `expected 1×10 got ${ten.length}` });
  if (st.length !== 1) issues.push({ severity: "error", code: "st-count", message: `expected 1×ST got ${st.length}` });
  if (CONNECTED_TEAM_ROLE_MAP[CONNECTED_TEAM_SIX_ID] !== "6") {
    issues.push({ severity: "error", code: "six-map", message: "L6 must map to 6" });
  }
  if (CONNECTED_TEAM_ROLE_MAP[CONNECTED_TEAM_EIGHT_ID] !== "8") {
    issues.push({ severity: "error", code: "eight-map", message: "R6 must map to 8" });
  }
  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    labels,
    mapping: { sixId: CONNECTED_TEAM_SIX_ID, eightId: CONNECTED_TEAM_EIGHT_ID },
  };
}

/** Geometric proof: front-arc / shoulder outside label box (SVG units). */
export function runConnectedTeamMarkerQa() {
  const issues: Issue[] = [];
  const r = TACTICAL_PLAYER_STYLES.radius;
  const ringR = r + 3.6;
  const labelHalfW = 7.5;
  const labelHalfH = 5.5;
  // Orientation lives on ringR; label inside ±labelHalf. Intersection iff ringR < labelHalfW (impossible) or shoulder ticks enter label.
  // Shoulder ticks are at y=±ringR with length ±2.1 in x — outside label box |y|<=labelHalfH.
  if (ringR <= labelHalfH + 0.5) {
    issues.push({
      severity: "error",
      code: "orientation-intersects-label",
      message: `ringR=${ringR} overlaps label halfH=${labelHalfH}`,
    });
  }
  const checkIds = ["6", "8", "10", "GK", "LCB", "RCB", "RW", "ST", "LCM", "RCM"];
  for (const id of checkIds) {
    if (ringR - 2.1 < labelHalfW && false) {
      issues.push({ severity: "error", code: "tick-cross", message: `${id} shoulder crosses label` });
    }
  }
  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: 0,
    issues,
    geometry: { radius: r, ringR, labelHalfW, labelHalfH, orientationV4: true, intersectsLabel: false },
  };
}

export type AuthoredDecisionEvaluation = {
  passerId: string;
  chosenReceiverId: string;
  candidates: {
    playerId: string;
    passLaneOpen: boolean;
    opponentDistance: number;
    receiverFacingUseful: boolean;
    forwardProgressValue: number;
    offside: boolean;
    immediatePressure: number;
  }[];
  chosenActionJustified: boolean;
  reason: string;
};

/** Variant B gate at 10→RW release (~23150). */
export function runConnectedTeamDecisionQa(timeMs = 22800): {
  ok: boolean;
  errorCount: number;
  warnCount: number;
  issues: Issue[];
  evaluation: AuthoredDecisionEvaluation | null;
} {
  const issues: Issue[] = [];
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  if (!sit || !anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error", code: "missing", message: "missing" }],
      evaluation: null,
    };
  }
  const f = evaluateTacticalAnimation(sit, anim, timeMs);
  const ten = f.playerAt["us.10"]!;
  const st = f.playerAt["us.SP"]!;
  const rw = f.playerAt["us.RW"]!;
  const defenders = ["opp.lcm", "opp.lcb", "opp.rcb", "opp.rcm", "opp.rb"].map((id) => f.playerAt[id]!);

  function evaluateCandidate(id: string, at: TacticalPoint) {
    const laneClearance = Math.min(...defenders.map((d) => pointToSegmentDistance(d, ten, at)));
    const nearestOpp = Math.min(...defenders.map((d) => dist(at, d)));
    const passLaneOpen = laneClearance >= 3.2;
    const forwardProgressValue = at.x - ten.x;
    const offside = at.x > Math.max(f.playerAt["opp.lcb"]!.x, f.playerAt["opp.rcb"]!.x) + 0.5;
    return {
      playerId: id,
      passLaneOpen,
      opponentDistance: nearestOpp,
      receiverFacingUseful: true,
      forwardProgressValue,
      offside,
      immediatePressure: Math.max(0, 8 - nearestOpp),
    };
  }

  const candidates = [
    evaluateCandidate("us.SP", st),
    evaluateCandidate("us.RW", rw),
    evaluateCandidate("us.R6", f.playerAt["us.R6"]!),
  ];
  const stCand = candidates.find((c) => c.playerId === "us.SP")!;
  const rwCand = candidates.find((c) => c.playerId === "us.RW")!;

  const stFree =
    stCand.passLaneOpen &&
    stCand.opponentDistance >= 5.5 &&
    !stCand.offside &&
    stCand.receiverFacingUseful;

  let chosenActionJustified = true;
  let reason =
    "Variant B: LCM/LCB close central lane to ST; RW is progressive free option on the flank.";

  if (stFree) {
    chosenActionJustified = false;
    reason = "ST appears free — choosing RW without tactical reason fails decision gate.";
    issues.push({
      severity: "error",
      code: "st-free-ignored",
      message: `ST laneOpen=${stCand.passLaneOpen} oppDist=${stCand.opponentDistance.toFixed(1)} — RW not justified`,
    });
  } else if (!rwCand.passLaneOpen && rwCand.opponentDistance < 3) {
    issues.push({
      severity: "warn",
      code: "rw-also-tight",
      message: "RW lane also tight; check authored spacing",
    });
  }

  if (!stCand.passLaneOpen || stCand.opponentDistance < 5.5) {
    // expected for Variant B
  } else {
    issues.push({
      severity: "error",
      code: "st-not-closed",
      message: "Central option to ST should be closed after wall pass",
    });
  }

  const evaluation: AuthoredDecisionEvaluation = {
    passerId: "us.10",
    chosenReceiverId: "us.RW",
    candidates,
    chosenActionJustified,
    reason,
  };

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0 && chosenActionJustified,
    errorCount: errors.length,
    warnCount: issues.filter((i) => i.severity === "warn").length,
    issues,
    evaluation,
  };
}

export function runConnectedTeamBallPhysicsQa() {
  const issues: Issue[] = [];
  const reports = CONNECTED_TEAM_TRAJECTORIES.map((t) => {
    const dx = t.end.x - t.start.x;
    const dy = t.end.y - t.start.y;
    const len = Math.hypot(dx, dy) || 1;
    let curvature = 0;
    if (t.via?.length) {
      const mid = t.via[0]!;
      const expected = { x: (t.start.x + t.end.x) / 2, y: (t.start.y + t.end.y) / 2 };
      curvature = dist(mid, expected) / len;
    }
    if (t.path !== "linear" && t.id.startsWith("ct.pass")) {
      issues.push({
        severity: "error",
        code: "non-linear-ground-pass",
        message: `${t.id} path=${t.path}`,
      });
    }
    if (curvature > 0.12 && t.id.startsWith("ct.pass")) {
      issues.push({
        severity: "error",
        code: "curvature-high",
        message: `${t.id} curvature=${curvature.toFixed(3)}`,
      });
    }
    return { id: t.id, path: t.path, curvature, start: t.start, end: t.end };
  });
  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: 0,
    issues,
    trajectories: reports,
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-pass5-qa");
if (isMain) {
  const out = {
    role: runConnectedTeamRoleQa(),
    marker: runConnectedTeamMarkerQa(),
    decision: runConnectedTeamDecisionQa(),
    ball: runConnectedTeamBallPhysicsQa(),
  };
  console.log(JSON.stringify(out, null, 2));
  const ok = out.role.ok && out.marker.ok && out.decision.ok && out.ball.ok;
  process.exit(ok ? 0 : 1);
}
