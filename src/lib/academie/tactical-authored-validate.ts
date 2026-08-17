/**
 * Authored Game Model validators — report only, never rewrite.
 * Run: npm run academy:validate-authored
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import {
  getTacticalAnimation,
  clearTacticalIntelligenceCache,
} from "@/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { dist, SAFE_PLAYER_RADIUS } from "@/lib/academie/tactical-animation-collision";
import { CONNECTED_TEAM_AUTHORED } from "@/lib/academie/tactical-authored-connected-team";
import { KW_R6_AUTHORED } from "@/lib/academie/tactical-authored-kw-r6";
import {
  laneFromY,
  type AuthoredScenarioBrief,
  type AuthoredScenarioPhase,
} from "@/lib/academie/tactical-authored-types";
import {
  evaluatePassLane,
  isIllegalSuccessfulPass,
} from "@/lib/academie/tactical-pass-lane";
import {
  evaluateOffsideAtRelease,
  type AttackDirection,
} from "@/lib/academie/tactical-offside-release";
import {
  angleToward,
  isPassInFieldOfView,
} from "@/lib/academie/tactical-orientation";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = {
  level: "error" | "warn";
  code: string;
  situationId: string;
  phase?: string;
  players?: string[];
  message: string;
};

const PILOTS = ["connected-team", "kw-r6-ball"] as const;

const BRIEFS: Record<string, AuthoredScenarioBrief> = {
  "connected-team": CONNECTED_TEAM_AUTHORED,
  "kw-r6-ball": KW_R6_AUTHORED,
};

const VIRTUAL_TARGETS: Record<string, TacticalPoint> = {
  "shot-closed": { x: 90, y: 50 },
};

const KEY_ORIENTATION_IDS = [
  "us.R6",
  "us.L6",
  "us.10",
  "us.SP",
  "us.RW",
  "us.LW",
  "us.RB",
  "us.LB",
  "us.LCV",
  "us.RCV",
];

function oppList(shape: AuthoredScenarioPhase["opponentShape"]) {
  return Object.entries(shape).map(([id, p]) => ({ id, at: p.at }));
}

function attackDir(brief: AuthoredScenarioBrief): AttackDirection {
  return brief.attackDirection ?? "left-to-right";
}

function validateDefensiveModel(brief: AuthoredScenarioBrief): Issue[] {
  if (!brief.opponent.defensiveModel) {
    return [
      {
        level: "error",
        code: "opponent-defensive-model-missing",
        situationId: brief.id,
        message: `${brief.id}: opponentDefensiveModel missing`,
      },
    ];
  }
  if (!brief.attackDirection) {
    return [
      {
        level: "error",
        code: "attack-direction-missing",
        situationId: brief.id,
        message: `${brief.id}: attackDirection missing`,
      },
    ];
  }
  return [];
}

function validateOrientation(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  for (const id of KEY_ORIENTATION_IDS) {
    const p = phase.usShape[id];
    if (!p) continue;
    if (!p.orientation) {
      issues.push({
        level: "error",
        code: "ORIENTATION_MISSING",
        situationId: brief.id,
        phase: phase.id,
        players: [id],
        message: `ORIENTATION_MISSING sequence=${brief.id} phase=${phase.id} player=${id}`,
      });
    }
  }
  return issues;
}

function validateBackThreeGeometry(
  phase: AuthoredScenarioPhase,
  brief: AuthoredScenarioBrief,
): Issue[] {
  if (phase.attackStructure !== "3-2-4-1" && phase.attackStructure !== "3-1-5-1") {
    return [];
  }
  const us = phase.usShape;
  const tuck = brief.us.tuckingBackId;
  const atk = brief.us.attackingBackId;
  const issues: Issue[] = [];
  const lb = us["us.LB"]?.at;
  const lcv = us["us.LCV"]?.at;
  const rcv = us["us.RCV"]?.at;
  const rb = us["us.RB"]?.at;
  if (!lb || !lcv || !rcv || !rb) {
    return [
      {
        level: "error",
        code: "BACK_THREE_CHANNEL_UNPROTECTED",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id}@${phase.id}: incomplete back unit`,
      },
    ];
  }

  const atkPt = us[atk]?.at;
  const tuckPt = us[tuck]?.at;
  if (atkPt && tuckPt && atkPt.x < tuckPt.x + 8) {
    issues.push({
      level: "error",
      code: "attack-structure-invalid",
      situationId: brief.id,
      phase: phase.id,
      players: [atk, tuck],
      message: `${brief.id}@${phase.id}: attacking back not clearly higher than tuck back`,
    });
  }

  const dLbLcv = dist(lb, lcv);
  const dLcvRcv = dist(lcv, rcv);
  if (dLbLcv < 12 || dLcvRcv < 12) {
    issues.push({
      level: "error",
      code: "BACK_THREE_TOO_NARROW",
      situationId: brief.id,
      phase: phase.id,
      players: ["us.LB", "us.LCV", "us.RCV"],
      message: `BACK_THREE_TOO_NARROW sequence=${brief.id} phase=${phase.id} LB-LCV=${dLbLcv.toFixed(1)} LCV-RCV=${dLcvRcv.toFixed(1)}`,
    });
  }
  if (dLbLcv > 22 || dLcvRcv > 22) {
    issues.push({
      level: "error",
      code: "BACK_THREE_TOO_WIDE",
      situationId: brief.id,
      phase: phase.id,
      players: ["us.LB", "us.LCV", "us.RCV"],
      message: `BACK_THREE_TOO_WIDE sequence=${brief.id} phase=${phase.id} LB-LCV=${dLbLcv.toFixed(1)} LCV-RCV=${dLcvRcv.toFixed(1)}`,
    });
  }

  const lineYSpan = Math.max(lb.y, lcv.y, rcv.y) - Math.min(lb.y, lcv.y, rcv.y);
  if (lineYSpan < 28) {
    issues.push({
      level: "error",
      code: "BACK_THREE_CHANNEL_UNPROTECTED",
      situationId: brief.id,
      phase: phase.id,
      message: `BACK_THREE_CHANNEL_UNPROTECTED sequence=${brief.id} phase=${phase.id} ySpan=${lineYSpan.toFixed(1)}`,
    });
  }

  const six = us["us.L6"]?.at;
  if (six) {
    const lineX = (lcv.x + rcv.x) / 2;
    const ahead = six.x - lineX;
    if (ahead < 6) {
      issues.push({
        level: "error",
        code: "SIX_TOO_CLOSE_TO_BACK_LINE",
        situationId: brief.id,
        phase: phase.id,
        players: ["us.L6"],
        message: `SIX_TOO_CLOSE_TO_BACK_LINE sequence=${brief.id} phase=${phase.id} ahead=${ahead.toFixed(1)}`,
      });
    }
    if (ahead > 16) {
      issues.push({
        level: "error",
        code: "SIX_TOO_FAR_FROM_BACK_LINE",
        situationId: brief.id,
        phase: phase.id,
        players: ["us.L6"],
        message: `SIX_TOO_FAR_FROM_BACK_LINE sequence=${brief.id} phase=${phase.id} ahead=${ahead.toFixed(1)}`,
      });
    }
  }

  return issues;
}

function validateRecycle(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  if (phase.ballZone !== "right-flank" && phase.ballZone !== "left-flank" && phase.ballZone !== "final-third") {
    return [];
  }
  if (!phase.ballHolder.startsWith("us.")) return [];
  const holder = phase.ballHolder;
  if (holder !== "us.RW" && holder !== "us.LW" && holder !== "us.10") return [];

  const from = phase.ballAt;
  const recycleIds =
    holder === "us.RW"
      ? ["us.RB", "us.R6", "us.10", "us.RCV"]
      : holder === "us.LW"
        ? ["us.LB", "us.L6", "us.10", "us.LCV"]
        : ["us.R6", "us.L6", "us.RB", "us.RW"];

  const opps = oppList(phase.opponentShape);
  let safe = 0;
  for (const toId of recycleIds) {
    const to = phase.usShape[toId]?.at;
    if (!to) continue;
    const ev = evaluatePassLane(from, to, opps);
    if (ev.status === "open" || ev.status === "pressured") safe++;
  }
  if (safe < 1) {
    return [
      {
        level: "error",
        code: "NO_SAFE_RECYCLE_OPTION",
        situationId: brief.id,
        phase: phase.id,
        players: [holder],
        message: `NO_SAFE_RECYCLE_OPTION sequence=${brief.id} phase=${phase.id} holder=${holder}`,
      },
    ];
  }
  return [];
}

function validateTransitionThreats(
  phase: AuthoredScenarioPhase,
  brief: AuthoredScenarioBrief,
): Issue[] {
  if (phase.attackStructure !== "3-2-4-1" && phase.attackStructure !== "3-1-5-1") return [];
  const threats = brief.transitionThreats ?? [];
  if (threats.length === 0) return [];
  const issues: Issue[] = [];
  const cover = [phase.usShape["us.LCV"]?.at, phase.usShape["us.RCV"]?.at, phase.usShape["us.L6"]?.at].filter(
    Boolean,
  ) as TacticalPoint[];
  for (const tid of threats.slice(0, 2)) {
    const t = phase.opponentShape[tid]?.at;
    if (!t) continue;
    const nearest = Math.min(...cover.map((c) => dist(c, t)));
    if (nearest > 28) {
      issues.push({
        level: "error",
        code: "TRANSITION_THREAT_UNCONTROLLED",
        situationId: brief.id,
        phase: phase.id,
        players: [tid],
        message: `TRANSITION_THREAT_UNCONTROLLED sequence=${brief.id} phase=${phase.id} threat=${tid} d=${nearest.toFixed(1)}`,
      });
    }
  }
  return issues;
}

function resolvePassEndpoints(
  phase: AuthoredScenarioPhase,
  brief: AuthoredScenarioBrief,
  pass: { fromId: string; toId: string },
): { from: TacticalPoint; to: TacticalPoint } | null {
  const fromPlayer = phase.usShape[pass.fromId]?.at ?? phase.opponentShape[pass.fromId]?.at;
  const from =
    pass.fromId === phase.ballHolder || !fromPlayer
      ? phase.ballAt
      : (() => {
          const idx = brief.phases.findIndex((p) => p.id === phase.id);
          const prev = idx > 0 ? brief.phases[idx - 1] : undefined;
          if (prev && prev.ballHolder === pass.fromId) return prev.ballAt;
          return fromPlayer;
        })();
  let to =
    phase.usShape[pass.toId]?.at ??
    phase.opponentShape[pass.toId]?.at ??
    VIRTUAL_TARGETS[pass.toId];
  if (!from || !to) {
    if (pass.toId === "shot-closed") to = VIRTUAL_TARGETS["shot-closed"];
    else return null;
  }
  if (!from || !to) return null;
  return { from, to };
}

function validatePlannedPasses(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  const dir = attackDir(brief);

  for (const pass of phase.plannedPasses ?? []) {
    if (pass.exception === "forced-error" || pass.expectedStatus === "blocked") {
      const ends = resolvePassEndpoints(phase, brief, pass);
      if (!ends) continue;
      const evaled = evaluatePassLane(ends.from, ends.to, oppList(phase.opponentShape), {
        intentionalForced: true,
      });
      if (evaled.status === "open") {
        issues.push({
          level: "warn",
          code: "blocked-pass-success",
          situationId: brief.id,
          phase: phase.id,
          message: `${brief.id}@${phase.id}: declared blocked lane is geometrically open`,
        });
      }
      continue;
    }

    const ends = resolvePassEndpoints(phase, brief, pass);
    if (!ends) {
      issues.push({
        level: "error",
        code: "BLOCKED_PASS_SUCCESS",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id}@${phase.id}: pass endpoints missing ${pass.fromId}→${pass.toId}`,
      });
      continue;
    }

    const evaled = evaluatePassLane(ends.from, ends.to, oppList(phase.opponentShape), {
      intentionalForced: pass.expectedStatus === "forced",
    });

    if (isIllegalSuccessfulPass(evaled, pass.exception)) {
      issues.push({
        level: "error",
        code: "BLOCKED_PASS_SUCCESS",
        situationId: brief.id,
        phase: phase.id,
        players: [pass.fromId, pass.toId, evaled.nearestOpponentId ?? ""].filter(Boolean),
        message: `BLOCKED_PASS_SUCCESS sequence=${brief.id} phase=${phase.id} ${pass.fromId}→${pass.toId} via ${evaled.nearestOpponentId} d=${evaled.nearestDistance.toFixed(1)} status=${evaled.status}`,
      });
    } else if (pass.expectedStatus === "pressured") {
      if (evaled.status === "blocked" || evaled.status === "interceptable") {
        issues.push({
          level: "error",
          code: "INTERCEPTABLE_PASS_WITHOUT_DUEL",
          situationId: brief.id,
          phase: phase.id,
          players: [pass.fromId, pass.toId],
          message: `${brief.id}@${phase.id}: expected pressured/open but ${evaled.status} ${pass.fromId}→${pass.toId}`,
        });
      }
    }

    // Offside at release — receiver position in this phase (pre-pass authored frame)
    const receiverAt = phase.usShape[pass.toId]?.at ?? phase.opponentShape[pass.toId]?.at;
    if (receiverAt && pass.toId.startsWith("us.") && !VIRTUAL_TARGETS[pass.toId]) {
      const off = evaluateOffsideAtRelease({
        sequenceId: brief.id,
        phaseId: phase.id,
        releaseTimeMs: pass.releaseTimeMs ?? 0,
        passerId: pass.fromId,
        receiverId: pass.toId,
        ballPosition: ends.from,
        receiverPosition: receiverAt,
        opponentPositions: oppList(phase.opponentShape),
        attackDirection: dir,
      });
      if (off.status === "OFFSIDE") {
        issues.push({
          level: "error",
          code: "AUTHORED_OFFSIDE_AT_RELEASE",
          situationId: brief.id,
          phase: phase.id,
          players: [pass.fromId, pass.toId],
          message: `AUTHORED_OFFSIDE_AT_RELEASE sequence=${brief.id} phase=${phase.id} passer=${pass.fromId} receiver=${pass.toId} releaseTime=${pass.releaseTimeMs ?? "?"} receiverX=${off.receiverX.toFixed(1)} ballX=${off.ballX.toFixed(1)} secondLastDefenderX=${off.secondLastDefenderX.toFixed(1)} difference=${off.difference.toFixed(1)}`,
        });
      }
    }

    // Field of view
    const passerPos = phase.usShape[pass.fromId];
    const o = passerPos?.orientation;
    if (o && receiverAt && pass.toId.startsWith("us.")) {
      const passAngle = angleToward(ends.from, ends.to);
      const inFov = isPassInFieldOfView(o.facingAngleDeg, o.bodyShape, passAngle, {
        prePassScan: o.prePassScan,
      });
      if (!inFov) {
        issues.push({
          level: "error",
          code: "PASS_OUTSIDE_FIELD_OF_VIEW",
          situationId: brief.id,
          phase: phase.id,
          players: [pass.fromId, pass.toId],
          message: `PASS_OUTSIDE_FIELD_OF_VIEW sequence=${brief.id} phase=${phase.id} ${pass.fromId}→${pass.toId} facing=${o.facingAngleDeg} body=${o.bodyShape} passAngle=${passAngle.toFixed(0)}`,
        });
      }
      if (!o.prePassScan && (o.bodyShape === "closed" || o.bodyShape === "back-to-goal")) {
        // lay-off from SP is intentional with back-to-goal + lay-off intent
        if (o.nextActionIntent !== "lay-off") {
          issues.push({
            level: "error",
            code: "NO_PRE_PASS_SCAN",
            situationId: brief.id,
            phase: phase.id,
            players: [pass.fromId],
            message: `NO_PRE_PASS_SCAN sequence=${brief.id} phase=${phase.id} passer=${pass.fromId}`,
          });
        }
      }
      if (
        pass.toId.startsWith("us.") &&
        phase.usShape[pass.toId]?.orientation?.bodyShape === "closed" &&
        phase.usShape[pass.toId]?.orientation?.receivingFoot == null
      ) {
        issues.push({
          level: "warn",
          code: "RECEIVER_BODY_SHAPE_INVALID",
          situationId: brief.id,
          phase: phase.id,
          players: [pass.toId],
          message: `RECEIVER_BODY_SHAPE_INVALID sequence=${brief.id} phase=${phase.id} ${pass.toId}`,
        });
      }
    }
  }
  return issues;
}

function validateWidth(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const ys = Object.entries(phase.usShape)
    .filter(([id]) => id.startsWith("us.") && id !== "us.GK")
    .map(([, p]) => p.at.y);
  if (ys.length < 6) return [];
  const width = Math.max(...ys) - Math.min(...ys);
  if (width < 55) {
    return [
      {
        level: "error",
        code: "field-width-insufficient",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id}@${phase.id}: field width ${width.toFixed(0)} < 55`,
      },
    ];
  }
  return [];
}

function validateOppBlock(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  const backs = ["opp.lb", "opp.lcb", "opp.rcb", "opp.rb"]
    .map((id) => phase.opponentShape[id]?.at)
    .filter(Boolean) as TacticalPoint[];
  if (backs.length >= 4) {
    const ys = backs.map((p) => p.y).sort((a, b) => a - b);
    let gapsOk = 0;
    for (let i = 1; i < ys.length; i++) {
      if (ys[i]! - ys[i - 1]! >= 8) gapsOk++;
    }
    if (gapsOk < 2) {
      issues.push({
        level: "error",
        code: "opponent-line-spacing-invalid",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id}@${phase.id}: opponent back line vertically stacked`,
      });
    }
  }
  return issues;
}

function validateOverlaps(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  const all = [
    ...Object.entries(phase.usShape).map(([id, p]) => ({ id, at: p.at })),
    ...Object.entries(phase.opponentShape).map(([id, p]) => ({ id, at: p.at })),
  ];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]!;
      const b = all[j]!;
      const d = dist(a.at, b.at);
      if (d < SAFE_PLAYER_RADIUS * 0.55) {
        issues.push({
          level: "error",
          code: "player-marker-overlap",
          situationId: brief.id,
          phase: phase.id,
          players: [a.id, b.id],
          message: `AUTHORED_PLAYER_OVERLAP sequence=${brief.id} phase=${phase.id} ${a.id}~${b.id} d=${d.toFixed(1)}`,
        });
      }
    }
  }
  return issues;
}

function validateWingerBack(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  for (const [w, b] of [
    ["us.RW", "us.RB"],
    ["us.LW", "us.LB"],
  ] as const) {
    const wp = phase.usShape[w]?.at;
    const bp = phase.usShape[b]?.at;
    if (!wp || !bp) continue;
    if (Math.abs(wp.x - bp.x) < 4 && Math.abs(wp.y - bp.y) < 6) {
      issues.push({
        level: "error",
        code: "back-winger-same-lane-height",
        situationId: brief.id,
        phase: phase.id,
        players: [w, b],
        message: `${brief.id}@${phase.id}: ${w}/${b} same lane+height`,
      });
    }
  }
  return issues;
}

function validateLanes(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const us = Object.entries(phase.usShape).filter(([id]) => id.startsWith("us.") && id !== "us.GK");
  const lanes = new Set(us.map(([, p]) => laneFromY(p.at.y)));
  if (lanes.size < 4) {
    return [
      {
        level: "error",
        code: "field-width-insufficient",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id}@${phase.id}: only ${lanes.size} lanes occupied`,
      },
    ];
  }
  return [];
}

function validateTenSp(phase: AuthoredScenarioPhase, brief: AuthoredScenarioBrief): Issue[] {
  const ten = phase.usShape["us.10"]?.at;
  const sp = phase.usShape["us.SP"]?.at;
  if (!ten || !sp) return [];
  if (dist(ten, sp) < 8 && phase.id !== "pass-sp" && phase.id !== "lay-off") {
    return [
      {
        level: "error",
        code: "attack-structure-invalid",
        situationId: brief.id,
        phase: phase.id,
        players: ["us.10", "us.SP"],
        message: `${brief.id}@${phase.id}: 10 and SP too close`,
      },
    ];
  }
  return [];
}

function validateBriefCompleteness(brief: AuthoredScenarioBrief): Issue[] {
  const issues: Issue[] = [];
  issues.push(...validateDefensiveModel(brief));
  for (const phase of brief.phases) {
    const usN = Object.keys(phase.usShape).length;
    const oppN = Object.keys(phase.opponentShape).length;
    if (usN < 11) {
      issues.push({
        level: "error",
        code: "authored-positions-incomplete",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id} phase=${phase.id}: us ${usN}/11`,
      });
    }
    if (oppN < 11) {
      issues.push({
        level: "error",
        code: "authored-positions-incomplete",
        situationId: brief.id,
        phase: phase.id,
        message: `${brief.id} phase=${phase.id}: opp ${oppN}/11`,
      });
    }
    issues.push(...validateOrientation(phase, brief));
    issues.push(...validateBackThreeGeometry(phase, brief));
    issues.push(...validateRecycle(phase, brief));
    issues.push(...validateTransitionThreats(phase, brief));
    issues.push(...validateWidth(phase, brief));
    issues.push(...validateOppBlock(phase, brief));
    issues.push(...validatePlannedPasses(phase, brief));
    issues.push(...validateOverlaps(phase, brief));
    issues.push(...validateWingerBack(phase, brief));
    issues.push(...validateLanes(phase, brief));
    issues.push(...validateTenSp(phase, brief));
  }
  if (brief.id === "connected-team" && !brief.defensiveTransitionShape) {
    issues.push({
      level: "error",
      code: "defensive-transition-missing",
      situationId: brief.id,
      message: `${brief.id}: defensive transition 4-4-2 shape missing`,
    });
  }
  return issues;
}

function validateRuntimePathSamples(
  playerAt: Record<string, TacticalPoint>,
  situationId: string,
  timeMs: number,
): Issue[] {
  const issues: Issue[] = [];
  const ids = Object.keys(playerAt);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const d = dist(playerAt[a]!, playerAt[b]!);
      if (d < SAFE_PLAYER_RADIUS * 0.4) {
        issues.push({
          level: "error",
          code: "PLAYER_PATH_COLLISION",
          situationId,
          phase: `${timeMs}ms`,
          players: [a, b],
          message: `PLAYER_PATH_COLLISION sequence=${situationId} timeMs=${timeMs} playerA=${a} playerB=${b} distance=${d.toFixed(1)}`,
        });
      }
    }
  }
  return issues;
}

function validateBallVsDefenders(
  ball: TacticalPoint | null | undefined,
  playerAt: Record<string, TacticalPoint>,
  situationId: string,
  timeMs: number,
  holderId: string | null | undefined,
  ballInFlight?: boolean,
): Issue[] {
  if (!ball) return [];
  // Loss / switch possession: ball arriving at opponent is intentional.
  if (holderId?.startsWith("opp.")) return [];
  // Held ball under pressure (e.g. SP binding a CV) is not a flight collision.
  if (holderId?.startsWith("us.") && !ballInFlight) return [];
  const issues: Issue[] = [];
  for (const [id, at] of Object.entries(playerAt)) {
    if (!id.startsWith("opp.")) continue;
    if (holderId === id) continue;
    const d = dist(ball, at);
    if (d < 1.4) {
      issues.push({
        level: "error",
        code: "BALL_PATH_INTERSECTS_DEFENDER",
        situationId,
        phase: `${timeMs}ms`,
        players: [id],
        message: `BALL_PATH_INTERSECTS_DEFENDER sequence=${situationId} timeMs=${timeMs} defender=${id} d=${d.toFixed(1)}`,
      });
    }
  }
  return issues;
}

export type AuthoredValidateStats = {
  blockedPassesFound: number;
  passLanesCorrected: number;
  overlapsFound: number;
  overlapsCorrected: number;
  offsideErrors: number;
  fovErrors: number;
  pathCollisions: number;
};

export function validateAuthoredPilots(): {
  issues: Issue[];
  checked: string[];
  stats: AuthoredValidateStats;
} {
  clearTacticalIntelligenceCache();
  const issues: Issue[] = [];
  let blockedPassesFound = 0;
  let overlapsFound = 0;
  let offsideErrors = 0;
  let fovErrors = 0;
  let pathCollisions = 0;

  for (const brief of Object.values(BRIEFS)) {
    const briefIssues = validateBriefCompleteness(brief);
    issues.push(...briefIssues);
    blockedPassesFound += briefIssues.filter(
      (i) =>
        i.code === "BLOCKED_PASS_SUCCESS" ||
        i.code === "pass-through-defender" ||
        i.code === "INTERCEPTABLE_PASS_WITHOUT_DUEL",
    ).length;
    overlapsFound += briefIssues.filter(
      (i) => i.code === "player-marker-overlap" || i.code === "player-path-overlap",
    ).length;
    offsideErrors += briefIssues.filter((i) => i.code === "AUTHORED_OFFSIDE_AT_RELEASE").length;
    fovErrors += briefIssues.filter((i) => i.code === "PASS_OUTSIDE_FIELD_OF_VIEW").length;
  }

  for (const id of PILOTS) {
    const sit = getTacticalSituation(id);
    const anim = getTacticalAnimation(id);
    if (!sit || !anim) {
      issues.push({
        level: "error",
        code: "missing",
        situationId: id,
        message: `${id}: missing sit/anim`,
      });
      continue;
    }
    if (anim.positioningMode !== "authored") {
      issues.push({
        level: "error",
        code: "positioning-mode",
        situationId: id,
        message: `${id}: expected authored, got ${anim.positioningMode}`,
      });
    }
    const step = 125;
    for (let t = 0; t <= anim.durationMs; t += step) {
    // Skip intentional loss-pass arrivals and settle window
    if (id === "connected-team" && t >= 32400) continue;
    if (id === "kw-r6-ball" && t >= 23000) continue;
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const pathIssues = validateRuntimePathSamples(frame.playerAt, id, t);
    issues.push(...pathIssues);
    pathCollisions += pathIssues.length;
    const ballIssues = validateBallVsDefenders(
      frame.ball,
      frame.playerAt,
      id,
      t,
      frame.holderId,
      frame.ballTrajectory?.inFlight === true,
    );
    issues.push(...ballIssues);
    }
  }

  return {
    issues,
    checked: [...PILOTS],
    stats: {
      blockedPassesFound,
      passLanesCorrected: 0,
      overlapsFound,
      overlapsCorrected: 0,
      offsideErrors,
      fovErrors,
      pathCollisions,
    },
  };
}

const isMain = process.argv[1]?.includes("tactical-authored-validate");
if (isMain) {
  const { issues, checked, stats } = validateAuthoredPilots();
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  console.log(`Authored Game Model validation — ${checked.length} pilots`);
  console.log(`errors=${errors.length} warns=${warns.length}`);
  console.log(
    `blockedPass=${stats.blockedPassesFound} offside=${stats.offsideErrors} fov=${stats.fovErrors} path=${stats.pathCollisions} overlap=${stats.overlapsFound}`,
  );
  for (const i of errors.slice(0, 60)) console.log(`  ERROR [${i.code}] ${i.message}`);
  for (const i of warns.slice(0, 20)) console.log(`  WARN  [${i.code}] ${i.message}`);
  if (errors.length) process.exit(1);
}
