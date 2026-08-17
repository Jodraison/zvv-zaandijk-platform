/**
 * connected-team — canonical tactical film (Pass 3 combination + recovery).
 * Compiles to ANIM_CONNECTED_TEAM. Single source of truth for choreography.
 */

import {
  CONNECTED_TEAM_AUTHORED,
  CONNECTED_TEAM_RECOVERY,
  CONNECTED_TEAM_RECYCLE,
  CONNECTED_TEAM_SP_ARRIVE,
  CONNECTED_TEAM_SWITCH,
} from "@/lib/academie/tactical-authored-connected-team";
import { shapeToMoves } from "@/lib/academie/tactical-authored-types";
import {
  animStep,
  buildAnimation,
  movePlayer,
  receiveBall,
} from "@/lib/academie/tactical-animation-sequences";
import type { TacticalAnimationAction } from "@/lib/academie/tactical-animation-types";
import {
  ballAtReceivingFoot,
  type TacticalPoint,
} from "@/lib/academie/tactical-visual-system";
import {
  easingFromAcceleration,
  type AuthoredBallTrajectory,
  type TacticalFilmScript,
} from "@/lib/academie/tactical-film-types";
import { filmPass as engineFilmPass } from "@/lib/academie/tactical-engine/pass";

const P = CONNECTED_TEAM_AUTHORED.phases;
const start = P[0]!;
const free = P[1]!;
const recv = P[2]!;
const passSp = P[3]!;
const lay = P[4]!;
const toRw = P[5]!;
const end = P[6]!;
const lossA = CONNECTED_TEAM_RECOVERY["loss-a"];
const lossB = CONNECTED_TEAM_RECOVERY["loss-b"];
const lossC = CONNECTED_TEAM_RECOVERY["loss-c"];
const lossD = CONNECTED_TEAM_RECOVERY["loss-d"];
const spArrive = CONNECTED_TEAM_SP_ARRIVE;
const recycle8 = CONNECTED_TEAM_RECYCLE["via-8"];
const recycleRcb = CONNECTED_TEAM_RECYCLE["via-rcb"];
const switch6 = CONNECTED_TEAM_SWITCH["via-6"];
const switchLcb = CONNECTED_TEAM_SWITCH["via-lcb"];
const switchLb = CONNECTED_TEAM_SWITCH["via-lb"];
const switchLw = CONNECTED_TEAM_SWITCH["via-lw"];

function pt(shape: Record<string, { at: TacticalPoint }>, id: string): TacticalPoint {
  return shape[id]!.at;
}

/** Unified pass — engine syncs lane + trail from this single ballMove. Linear ground passes by default. */
export function filmPass(
  trajectory: AuthoredBallTrajectory,
  stepStartMs: number,
  stepDurationMs: number,
): TacticalAnimationAction[] {
  return engineFilmPass(trajectory, stepStartMs, stepDurationMs);
}

function viaArc(from: TacticalPoint, to: TacticalPoint, bulge = 3, side: 1 | -1 = 1): TacticalPoint[] {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * bulge * side;
  const ny = (dx / len) * bulge * side;
  return [{ x: mx + nx, y: my + ny }];
}

/** Motion via with prepare → accelerate → settle waypoints (field %). */
function motionProfile(
  from: TacticalPoint,
  to: TacticalPoint,
  opts?: { checkAway?: TacticalPoint; bulge?: number; side?: 1 | -1 },
): TacticalPoint[] {
  const pts: TacticalPoint[] = [];
  if (opts?.checkAway) pts.push(opts.checkAway);
  const mid = {
    x: from.x + (to.x - from.x) * 0.55,
    y: from.y + (to.y - from.y) * 0.55,
  };
  if (opts?.bulge) {
    pts.push(...viaArc(from, to, opts.bulge, opts.side ?? 1));
  } else {
    pts.push(mid);
  }
  pts.push({
    x: from.x + (to.x - from.x) * 0.88,
    y: from.y + (to.y - from.y) * 0.88,
  });
  return pts;
}

const PASS_8_10_START = ballAtReceivingFoot(pt(free.usShape, "us.R6"), {
  foot: "left",
  facingDeg: -35,
});
const PASS_8_10_END = ballAtReceivingFoot(pt(recv.usShape, "us.10"), {
  foot: "back-foot",
  facingDeg: 40,
});
const PASS_10_ST_START = ballAtReceivingFoot(pt(passSp.usShape, "us.10"), {
  foot: "right",
  facingDeg: 35,
});
const PASS_10_ST_END = ballAtReceivingFoot(spArrive.usShape["us.SP"]!.at, {
  foot: "left",
  facingDeg: 170,
});
const PASS_ST_10_END = ballAtReceivingFoot(pt(lay.usShape, "us.10"), {
  foot: "front",
  facingDeg: 55,
});
const PASS_10_RW_END = ballAtReceivingFoot(pt(toRw.usShape, "us.RW"), {
  foot: "left",
  facingDeg: -45,
});
const PASS_RW_8_END = ballAtReceivingFoot(pt(recycle8.usShape, "us.R6"), {
  foot: "right",
  facingDeg: 30,
});
const PASS_8_RCB_END = ballAtReceivingFoot(pt(recycleRcb.usShape, "us.RCV"), {
  foot: "left",
  facingDeg: 35,
});
const PASS_RCB_6_END = ballAtReceivingFoot(pt(switch6.usShape, "us.L6"), {
  foot: "left",
  facingDeg: 150,
});
const PASS_6_LCB_END = ballAtReceivingFoot(pt(switchLcb.usShape, "us.LCV"), {
  foot: "left",
  facingDeg: 170,
});
const PASS_LCB_LB_END = ballAtReceivingFoot(pt(switchLb.usShape, "us.LB"), {
  foot: "either",
  facingDeg: 35,
});
const PASS_LB_LW_END = ballAtReceivingFoot(pt(switchLw.usShape, "us.LW"), {
  foot: "right",
  facingDeg: -135,
});

const TRAJ_R6_10: AuthoredBallTrajectory = {
  id: "ct.pass.8-10",
  sceneId: "pass-10",
  releaseTimeMs: 8200,
  arrivalTimeMs: 11200,
  start: PASS_8_10_START,
  end: PASS_8_10_END,
  path: "linear",
  status: "pressured",
  passerId: "us.R6",
  receiverId: "us.10",
  releaseFoot: "left",
};

/** 10 → ST: linear ground pass. */
const TRAJ_10_SP: AuthoredBallTrajectory = {
  id: "ct.pass.10-st",
  sceneId: "pass-sp",
  releaseTimeMs: 15200,
  arrivalTimeMs: 17800,
  start: PASS_10_ST_START,
  end: PASS_10_ST_END,
  path: "linear",
  status: "open",
  passerId: "us.10",
  receiverId: "us.SP",
  releaseFoot: "right",
};

/** ST → 10 kaats: short linear, faster. */
const TRAJ_SP_10: AuthoredBallTrajectory = {
  id: "ct.pass.st-lay",
  sceneId: "kaats",
  releaseTimeMs: 18250,
  arrivalTimeMs: 20400,
  start: PASS_10_ST_END,
  end: PASS_ST_10_END,
  path: "linear",
  status: "open",
  passerId: "us.SP",
  receiverId: "us.10",
  releaseFoot: "left",
};

/** 10 → RW: linear — ST lane closed (Variant B). */
const TRAJ_10_RW: AuthoredBallTrajectory = {
  id: "ct.pass.10-rw",
  sceneId: "to-rw",
  releaseTimeMs: 23150,
  arrivalTimeMs: 26200,
  start: PASS_ST_10_END,
  end: PASS_10_RW_END,
  path: "linear",
  status: "pressured",
  passerId: "us.10",
  receiverId: "us.RW",
  releaseFoot: "right",
};

/** Pass 6 Option C: RW → 8. */
const TRAJ_RW_8: AuthoredBallTrajectory = {
  id: "ct.pass.rw-8",
  sceneId: "recycle-8",
  releaseTimeMs: 32200,
  arrivalTimeMs: 33400,
  start: PASS_10_RW_END,
  end: PASS_RW_8_END,
  path: "linear",
  status: "open",
  passerId: "us.RW",
  receiverId: "us.R6",
  releaseFoot: "left",
};

/** Pass 6: 8 → RCB. */
const TRAJ_8_RCB: AuthoredBallTrajectory = {
  id: "ct.pass.8-rcb",
  sceneId: "recycle-rcb",
  releaseTimeMs: 34000,
  arrivalTimeMs: 35200,
  start: PASS_RW_8_END,
  end: PASS_8_RCB_END,
  path: "linear",
  status: "open",
  passerId: "us.R6",
  receiverId: "us.RCV",
  releaseFoot: "right",
};

/** Switch chain Pass 7: RCB → 6. */
const TRAJ_RCB_6: AuthoredBallTrajectory = {
  id: "ct.pass.rcb-6",
  sceneId: "switch-6",
  releaseTimeMs: 35800,
  arrivalTimeMs: 37000,
  start: PASS_8_RCB_END,
  end: PASS_RCB_6_END,
  path: "linear",
  status: "pressured",
  passerId: "us.RCV",
  receiverId: "us.L6",
  releaseFoot: "left",
};

/** Switch chain: 6 → LCB. */
const TRAJ_6_LCB: AuthoredBallTrajectory = {
  id: "ct.pass.6-lcb",
  sceneId: "switch-lcb",
  releaseTimeMs: 37400,
  arrivalTimeMs: 38600,
  start: PASS_RCB_6_END,
  end: PASS_6_LCB_END,
  path: "linear",
  status: "open",
  passerId: "us.L6",
  receiverId: "us.LCV",
  releaseFoot: "left",
};

/** Switch chain: LCB → LB. */
const TRAJ_LCB_LB: AuthoredBallTrajectory = {
  id: "ct.pass.lcb-lb",
  sceneId: "switch-lb",
  releaseTimeMs: 39000,
  arrivalTimeMs: 40200,
  start: PASS_6_LCB_END,
  end: PASS_LCB_LB_END,
  path: "linear",
  status: "open",
  passerId: "us.LCV",
  receiverId: "us.LB",
  releaseFoot: "left",
};

/** Switch chain complete: LB → LW. */
const TRAJ_LB_LW: AuthoredBallTrajectory = {
  id: "ct.pass.lb-lw",
  sceneId: "switch-lw",
  releaseTimeMs: 40600,
  arrivalTimeMs: 42000,
  start: PASS_LCB_LB_END,
  end: PASS_LB_LW_END,
  path: "linear",
  status: "open",
  passerId: "us.LB",
  receiverId: "us.LW",
};

/** Loss intercept — now from LW possession after the completed switch. */
const TRAJ_LOSS: AuthoredBallTrajectory = {
  id: "ct.loss.intercept",
  sceneId: "loss-a",
  releaseTimeMs: 42800,
  arrivalTimeMs: 43800,
  start: PASS_LB_LW_END,
  end: lossA.ballAt,
  path: "linear",
  status: "intercepted",
  passerId: "us.LW",
  receiverId: "opp.rcm",
};

export const CONNECTED_TEAM_FILM: TacticalFilmScript = {
  id: "connected-team-canonical",
  situationId: "connected-team",
  presentationDefault: "academy",
  attackDirection: "left-to-right",
  totalDurationMs: 58200,
  scenes: [
    {
      id: "start",
      title: "Startstructuur",
      coachingObjective: "Beide formaties lezen",
      startMs: 0,
      durationMs: 3800,
      primaryFocus: { type: "player", playerId: "us.R6" },
      secondaryFocusIds: ["us.10", "us.L6"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.03 },
      visibleAnnotations: [
        { type: "caption", label: "SITUATIE", text: "Wij houden het veld groot in 4-2-3-1." },
      ],
      hiddenAnnotations: ["pass", "press"],
      endHoldMs: 900,
      statusLabel: "Situatie",
      teachingPoint: "Wij houden het veld groot in 4-2-3-1.",
      phase: "initial",
    },
    {
      id: "scan-a",
      title: "8 scant",
      coachingObjective: "8 scant — cover-shadow van 10",
      startMs: 3800,
      durationMs: 1800,
      primaryFocus: { type: "player", playerId: "us.R6" },
      secondaryFocusIds: ["us.10"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.08 },
      visibleAnnotations: [{ type: "caption", label: "KIJK", text: "6 bewaakt de balans; 8 verbindt vooruit." }],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Kijk",
      teachingPoint: "6 bewaakt de balans; 8 verbindt vooruit.",
      phase: "recognition",
    },
    {
      id: "scan-b",
      title: "Vrije pocket",
      coachingObjective: "10 ziet dezelfde ruimte en start",
      startMs: 5600,
      durationMs: 2600,
      primaryFocus: { type: "player", playerId: "us.10" },
      secondaryFocusIds: ["us.R6"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.09 },
      visibleAnnotations: [{ type: "caption", label: "KIJK", text: "6 bewaakt de balans; 8 verbindt vooruit." }],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Kijk",
      teachingPoint: "10 stapt uit de dekkingsschaduw.",
      phase: "recognition",
    },
    {
      id: "pass-10",
      title: "Pass naar 10",
      coachingObjective: "10 stapt uit de dekkingsschaduw",
      startMs: 8200,
      durationMs: 3400,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.10", "us.R6"],
      ballAction: { trajectory: TRAJ_R6_10, receiveHolderId: "us.10" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.09 },
      visibleAnnotations: [{ type: "caption", label: "SPEEL", text: "10 stapt uit de dekkingsschaduw." }],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Speel",
      teachingPoint: "10 stapt uit de dekkingsschaduw.",
      phase: "prepare",
    },
    {
      id: "sp-comes",
      title: "ST bindt en komt kort",
      coachingObjective: "ST bindt CV’s en komt diagonaal kort",
      startMs: 11600,
      durationMs: 3600,
      primaryFocus: { type: "player", playerId: "us.SP" },
      secondaryFocusIds: ["opp.lcb"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.1 },
      visibleAnnotations: [
        { type: "caption", label: "SPEEL", text: "ST bindt de centrale verdedigers en komt kort." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Speel",
      teachingPoint: "ST bindt de centrale verdedigers en komt kort.",
      phase: "action",
    },
    {
      id: "pass-sp",
      title: "Pass naar ST",
      coachingObjective: "Inspelen vóór de uitstappende CV",
      startMs: 15200,
      durationMs: 3000,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.SP", "us.10"],
      ballAction: { trajectory: TRAJ_10_SP, receiveHolderId: "us.SP" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.1 },
      visibleAnnotations: [
        { type: "caption", label: "REACTIE", text: "10 ontvangt half-open." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Reactie",
      teachingPoint: "10 ontvangt half-open.",
      phase: "action",
    },
    {
      id: "kaats",
      title: "Kaats en derde man",
      coachingObjective: "Kaats maakt de derde man vrij",
      startMs: 18200,
      durationMs: 4600,
      primaryFocus: { type: "player", playerId: "us.SP" },
      secondaryFocusIds: ["us.10"],
      ballAction: { trajectory: TRAJ_SP_10, receiveHolderId: "us.10" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.1 },
      visibleAnnotations: [
        { type: "caption", label: "VERVOLG", text: "De kaats trekt het blok naar binnen." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Vervolg",
      teachingPoint: "De kaats trekt het blok naar binnen.",
      phase: "reaction",
    },
    {
      id: "to-rw",
      title: "Pass naar RW",
      coachingObjective: "Derde man — steun start vóór arrival",
      startMs: 22800,
      durationMs: 4400,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.RW", "us.RB", "us.R6"],
      ballAction: { trajectory: TRAJ_10_RW, receiveHolderId: "us.RW" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.08 },
      visibleAnnotations: [{ type: "caption", label: "VERVOLG", text: "Centraal is gesloten: RW wordt de vrije speler." }],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Vervolg",
      teachingPoint: "Centraal is gesloten: RW wordt de vrije speler.",
      phase: "follow",
    },
    {
      id: "rw-join",
      title: "Volledige aansluiting",
      coachingObjective: "Vijf opties rond RW — levend 3-2-4-1",
      startMs: 27200,
      durationMs: 3200,
      primaryFocus: { type: "player", playerId: "us.RW" },
      secondaryFocusIds: ["us.R6", "us.10", "us.RB"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.06 },
      visibleAnnotations: [
        { type: "caption", label: "BALANS", text: "Met de back erbij bezetten we vijf aanvallende banen." },
      ],
      hiddenAnnotations: ["pass"],
      endHoldMs: 300,
      statusLabel: "Balans",
      teachingPoint: "Met de back erbij bezetten we vijf aanvallende banen.",
      phase: "result",
    },
    {
      id: "opp-close",
      title: "Vooruit gesloten",
      coachingObjective: "Tegenstander sluit flank en halfspace",
      startMs: 30400,
      durationMs: 1600,
      primaryFocus: { type: "player", playerId: "us.RW" },
      secondaryFocusIds: ["opp.rb", "opp.rcm"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.06 },
      visibleAnnotations: [
        { type: "caption", label: "BALANS", text: "Vooruit gesloten — bewaren via 8." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Balans",
      teachingPoint: "Vooruit gesloten — bewaren via 8.",
      phase: "result",
    },
    {
      id: "recycle-8",
      title: "Recycle via 8",
      coachingObjective: "RW → 8",
      startMs: 32000,
      durationMs: 1800,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.RW", "us.R6"],
      ballAction: { trajectory: TRAJ_RW_8, receiveHolderId: "us.R6" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.05 },
      visibleAnnotations: [
        { type: "caption", label: "BALANS", text: "Kan het niet vooruit? We bewaren de bal via 8 of RCB." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 150,
      statusLabel: "Balans",
      teachingPoint: "Kan het niet vooruit? We bewaren de bal via 8 of RCB.",
      phase: "result",
    },
    {
      id: "recycle-rcb",
      title: "Recycle via RCB",
      coachingObjective: "8 → RCB",
      startMs: 33800,
      durationMs: 1800,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.R6", "us.RCV"],
      ballAction: { trajectory: TRAJ_8_RCB, receiveHolderId: "us.RCV" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "BALANS", text: "Kan het niet vooruit? We bewaren de bal via 8 of RCB." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 150,
      statusLabel: "Balans",
      teachingPoint: "Kan het niet vooruit? We bewaren de bal via 8 of RCB.",
      phase: "result",
    },
    {
      id: "switch-6",
      title: "Kantwissel via 6",
      coachingObjective: "RCB → 6 — het spel keert",
      startMs: 35600,
      durationMs: 1800,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.RCV", "us.L6"],
      ballAction: { trajectory: TRAJ_RCB_6, receiveHolderId: "us.L6" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "SWITCH", text: "6 opent het spel naar de andere kant." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 150,
      statusLabel: "Switch",
      teachingPoint: "6 opent het spel naar de andere kant.",
      phase: "result",
    },
    {
      id: "switch-lcb",
      title: "Kantwissel via LCB",
      coachingObjective: "6 → LCB",
      startMs: 37400,
      durationMs: 1600,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.L6", "us.LCV"],
      ballAction: { trajectory: TRAJ_6_LCB, receiveHolderId: "us.LCV" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "SWITCH", text: "LCB ontvangt open — het blok schuift verder mee." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 150,
      statusLabel: "Switch",
      teachingPoint: "LCB ontvangt open — het blok schuift verder mee.",
      phase: "result",
    },
    {
      id: "switch-lb",
      title: "Kantwissel via LB",
      coachingObjective: "LCB → LB",
      startMs: 39000,
      durationMs: 1600,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.LCV", "us.LB"],
      ballAction: { trajectory: TRAJ_LCB_LB, receiveHolderId: "us.LB" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "SWITCH", text: "De bal bereikt de zijlijn — LW wordt breed beschikbaar." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 150,
      statusLabel: "Switch",
      teachingPoint: "De bal bereikt de zijlijn — LW wordt breed beschikbaar.",
      phase: "result",
    },
    {
      id: "switch-lw",
      title: "Kantwissel compleet",
      coachingObjective: "LB → LW — nieuwe balzijde",
      startMs: 40600,
      durationMs: 2200,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: ["us.LB", "us.LW"],
      ballAction: { trajectory: TRAJ_LB_LW, receiveHolderId: "us.LW" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.03 },
      visibleAnnotations: [
        { type: "caption", label: "SWITCH", text: "Kantwissel: de verre kant wordt de nieuwe balzijde." },
      ],
      hiddenAnnotations: [],
      endHoldMs: 200,
      statusLabel: "Switch",
      teachingPoint: "Kantwissel: de verre kant wordt de nieuwe balzijde.",
      phase: "result",
    },
    {
      id: "loss-a",
      title: "Balverlies",
      coachingObjective: "Directe druk na verlies",
      startMs: 42800,
      durationMs: 1800,
      primaryFocus: { type: "player", playerId: "us.LW" },
      secondaryFocusIds: ["us.LB", "opp.rcm"],
      ballAction: { trajectory: TRAJ_LOSS, receiveHolderId: "opp.rcm" },
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "HERSTEL", text: "Na balverlies zetten we direct druk." },
      ],
      hiddenAnnotations: ["pass"],
      endHoldMs: 150,
      statusLabel: "Herstel",
      teachingPoint: "Na balverlies zetten we direct druk.",
      phase: "result",
    },
    {
      id: "loss-b",
      title: "Vertragen",
      coachingObjective: "Centrum sluiten",
      startMs: 44600,
      durationMs: 2200,
      primaryFocus: { type: "relationship", playerIds: ["us.R6", "us.L6"] },
      secondaryFocusIds: ["us.RW"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.04 },
      visibleAnnotations: [
        { type: "caption", label: "HERSTEL", text: "6 beschermt het centrum; 8 sluit de binnenlijn." },
      ],
      hiddenAnnotations: ["pass"],
      endHoldMs: 150,
      statusLabel: "Herstel",
      teachingPoint: "6 beschermt het centrum; 8 sluit de binnenlijn.",
      phase: "result",
    },
    {
      id: "loss-c",
      title: "Zakken",
      coachingObjective: "Wingers en back herstellen",
      startMs: 46800,
      durationMs: 2400,
      primaryFocus: { type: "relationship", playerIds: ["us.RB", "us.RW"] },
      secondaryFocusIds: ["us.LW"],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.03 },
      visibleAnnotations: [
        { type: "caption", label: "HERSTEL", text: "We herstellen samen naar 4-4-2." },
      ],
      hiddenAnnotations: ["pass"],
      endHoldMs: 150,
      statusLabel: "Herstel",
      teachingPoint: "We herstellen samen naar 4-4-2.",
      phase: "result",
    },
    {
      id: "loss-d",
      title: "4-4-2",
      coachingObjective: "Compact in 4-4-2",
      startMs: 49200,
      durationMs: 9000,
      primaryFocus: { type: "ball" },
      secondaryFocusIds: [],
      playerActions: [],
      opponentActions: [],
      camera: { preset: "full-team-tactical", maxZoomHint: 0.03 },
      visibleAnnotations: [
        { type: "caption", label: "HERSTEL", text: "We herstellen samen naar 4-4-2." },
      ],
      hiddenAnnotations: ["pass"],
      endHoldMs: 1200,
      statusLabel: "Herstel",
      teachingPoint: "We herstellen samen naar 4-4-2.",
      phase: "result",
    },
  ],
};

function focusIds(scene: (typeof CONNECTED_TEAM_FILM.scenes)[0]): string[] {
  const ids: string[] = [];
  if (scene.primaryFocus.type === "player") ids.push(scene.primaryFocus.playerId);
  if (scene.primaryFocus.type === "relationship") ids.push(...scene.primaryFocus.playerIds);
  if (scene.secondaryFocusIds) ids.push(...scene.secondaryFocusIds.slice(0, 2));
  return [...new Set(ids)].slice(0, 3);
}

function shapeMoves(
  us: typeof start.usShape,
  opp: typeof start.opponentShape,
  accel: "jog" | "accelerate" | "decelerate" | "walk-adjust" | "sprint" = "jog",
): TacticalAnimationAction {
  const easing = easingFromAcceleration(accel);
  return {
    kind: "groupMove",
    moves: [...shapeToMoves(us), ...shapeToMoves(opp)].map((m) => ({
      playerId: m.id,
      to: m.to,
      easing,
    })),
  };
}

/**
 * Compile film script → animation definition.
 * Ball + lane come only from filmPass (syncLane); no orphan setLines for passes.
 */
export function compileConnectedTeamFilm() {
  return buildAnimation(
    "anim.connected-team",
    "connected-team",
    [
      animStep(
        "start",
        0,
        3800,
        "Situatie",
        [
          { kind: "phase", phase: "initial" },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[0]!) },
          { kind: "setLines", lines: [] },
          { kind: "setZones", zones: [] },
          shapeMoves(start.usShape, start.opponentShape, "walk-adjust"),
          receiveBall("us.R6"),
          { kind: "hold" },
        ],
        CONNECTED_TEAM_FILM.scenes[0]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          balancePlayerIds: ["us.L6"],
          coverPlayerIds: ["us.LCV", "us.RCV"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 25,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "scan-a",
        3800,
        1800,
        "Kijk",
        [
          { kind: "phase", phase: "recognition" },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[1]!) },
          {
            kind: "setZones",
            zones: [
              {
                x: 48,
                y: 36,
                w: 14,
                h: 16,
                kind: "cover-shadow",
                label: "schaduw",
                geometry: {
                  type: "taper-shadow",
                  apex: { x: 46, y: 38 },
                  dirDeg: 15,
                  nearWidth: 3,
                  farWidth: 11,
                  length: 14,
                },
              },
            ],
          },
          // Opp first line corrects while R6 holds (~150–350ms stagger via early opp moves)
          movePlayer("opp.lst", pt(free.opponentShape, "opp.lst"), "easeOut"),
          movePlayer("opp.rst", { x: 46, y: 64 }, "easeInOut"),
          receiveBall("us.R6"),
          { kind: "hold" },
        ],
        CONNECTED_TEAM_FILM.scenes[1]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "opp.rcm",
          coverPlayerIds: ["opp.lcm"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 29,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "scan-b",
        5600,
        2600,
        "Kijk",
        [
          { kind: "phase", phase: "recognition" },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[2]!) },
          {
            kind: "setZones",
            zones: [
              {
                x: 56,
                y: 22,
                w: 12,
                h: 14,
                kind: "pocket",
                label: "pocket",
                geometry: { type: "ellipse" },
              },
            ],
          },
          // Overlapping: 10 starts while 8 still adjusting
          movePlayer(
            "us.10",
            pt(free.usShape, "us.10"),
            "easeInOut",
            motionProfile(pt(start.usShape, "us.10"), pt(free.usShape, "us.10"), {
              checkAway: { x: pt(start.usShape, "us.10").x - 1.5, y: pt(start.usShape, "us.10").y + 1 },
              bulge: 2.5,
              side: -1,
            }),
          ),
          movePlayer("us.R6", pt(free.usShape, "us.R6"), "easeOut"),
          movePlayer("us.SP", pt(free.usShape, "us.SP"), "easeInOut"),
          movePlayer("us.RW", pt(free.usShape, "us.RW"), "easeOut"),
          movePlayer("opp.lcm", pt(free.opponentShape, "opp.lcm"), "easeInOut"),
          movePlayer("opp.rcm", pt(free.opponentShape, "opp.rcm"), "easeOut"),
          movePlayer("opp.lst", pt(free.opponentShape, "opp.lst"), "easeOut"),
          shapeMoves(free.usShape, free.opponentShape, "jog"),
          receiveBall("us.R6"),
        ],
        CONNECTED_TEAM_FILM.scenes[2]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "opp.rcm",
          coverPlayerIds: ["opp.lcm"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 29,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "pass-10",
        8200,
        3400,
        "Speel",
        [
          { kind: "phase", phase: "prepare" },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[3]!) },
          { kind: "setZones", zones: [] },
          ...filmPass(TRAJ_R6_10, 8200, 3400),
          movePlayer(
            "us.10",
            pt(recv.usShape, "us.10"),
            "easeOut",
            viaArc(pt(free.usShape, "us.10"), pt(recv.usShape, "us.10"), 2.5, -1),
          ),
          movePlayer("opp.lcm", pt(recv.opponentShape, "opp.lcm"), "easeOut"),
          movePlayer("opp.rcm", pt(recv.opponentShape, "opp.rcm"), "easeInOut"),
          shapeMoves(recv.usShape, recv.opponentShape, "accelerate"),
          receiveBall("us.10"),
        ],
        CONNECTED_TEAM_FILM.scenes[3]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "opp.lcm",
          coverPlayerIds: ["opp.rcm", "us.RCV"],
          balancePlayerIds: ["us.L6"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 33,
          lastLineAction: "step",
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "sp-comes",
        11600,
        3600,
        "Speel",
        [
          { kind: "phase", phase: "action" },
          receiveBall("us.10"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[4]!) },
          { kind: "setLines", lines: [] },
          {
            kind: "setZones",
            zones: [
              {
                x: 72,
                y: 40,
                w: 8,
                h: 12,
                kind: "pocket",
                label: "ruimte",
                geometry: {
                  type: "corridor",
                  from: { x: 74, y: 42 },
                  to: { x: 82, y: 48 },
                  width: 5,
                },
              },
            ],
          },
          // Check-away then diagonal come-short via motion profile
          movePlayer(
            "us.SP",
            pt(passSp.usShape, "us.SP"),
            "easeInOut",
            motionProfile(pt(recv.usShape, "us.SP"), pt(passSp.usShape, "us.SP"), {
              checkAway: { x: pt(recv.usShape, "us.SP").x + 1.5, y: pt(recv.usShape, "us.SP").y - 1.2 },
              bulge: 2.2,
              side: -1,
            }),
          ),
          movePlayer("us.10", pt(passSp.usShape, "us.10"), "easeOut"),
          movePlayer("us.R6", pt(passSp.usShape, "us.R6"), "easeInOut"),
          movePlayer("us.RW", pt(passSp.usShape, "us.RW"), "easeOut"),
          movePlayer("opp.lcb", pt(passSp.opponentShape, "opp.lcb"), "easeOut"),
          movePlayer("opp.rcb", pt(passSp.opponentShape, "opp.rcb"), "easeInOut"),
          movePlayer("opp.lcm", pt(passSp.opponentShape, "opp.lcm"), "easeInOut"),
          shapeMoves(passSp.usShape, passSp.opponentShape, "jog"),
        ],
        CONNECTED_TEAM_FILM.scenes[4]!.teachingPoint,
        {
          ballZone: "final-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.R6", "us.RCV"],
          balancePlayerIds: ["us.L6", "us.LB"],
          depthThreatPlayerIds: ["opp.lst"],
          lastLineHeight: 35,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "pass-sp",
        15200,
        3000,
        "Reactie",
        [
          { kind: "phase", phase: "action" },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[5]!) },
          ...filmPass(TRAJ_10_SP, 15200, 3000),
          // 10 follows pass into kaats angle
          movePlayer(
            "us.10",
            pt(spArrive.usShape, "us.10"),
            "easeOut",
            viaArc(pt(passSp.usShape, "us.10"), pt(spArrive.usShape, "us.10"), 1.5, 1),
          ),
          shapeMoves(spArrive.usShape, spArrive.opponentShape, "accelerate"),
          receiveBall("us.SP"),
        ],
        CONNECTED_TEAM_FILM.scenes[5]!.teachingPoint,
        {
          ballZone: "final-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.R6", "us.RCV"],
          balancePlayerIds: ["us.L6", "us.LB"],
          depthThreatPlayerIds: ["opp.lst"],
          lastLineHeight: 35,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "kaats",
        18200,
        4600,
        "Vervolg",
        [
          { kind: "phase", phase: "reaction" },
          receiveBall("us.SP"),
          { kind: "highlight", playerIds: ["us.SP"] },
          { kind: "setLines", lines: [] },
          {
            kind: "setZones",
            zones: [
              {
                x: 64,
                y: 52,
                w: 14,
                h: 18,
                kind: "pocket",
                label: "diagonaal",
                geometry: { type: "ellipse" },
              },
            ],
          },
          ...filmPass(TRAJ_SP_10, 18200, 4600),
          movePlayer(
            "us.10",
            pt(lay.usShape, "us.10"),
            "easeOut",
            motionProfile(pt(spArrive.usShape, "us.10"), pt(lay.usShape, "us.10"), { bulge: 1.8, side: 1 }),
          ),
          movePlayer(
            "us.RW",
            pt(lay.usShape, "us.RW"),
            "easeInOut",
            motionProfile(pt(spArrive.usShape, "us.RW"), pt(lay.usShape, "us.RW"), { bulge: 2.5, side: 1 }),
          ),
          movePlayer("us.RB", pt(lay.usShape, "us.RB"), "easeOut"),
          movePlayer("opp.lcm", pt(lay.opponentShape, "opp.lcm"), "easeOut"),
          movePlayer("opp.lcb", pt(lay.opponentShape, "opp.lcb"), "easeInOut"),
          movePlayer("opp.rcb", pt(lay.opponentShape, "opp.rcb"), "easeOut"),
          shapeMoves(lay.usShape, lay.opponentShape, "accelerate"),
          receiveBall("us.10"),
        ],
        CONNECTED_TEAM_FILM.scenes[6]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.RB", "us.R6"],
          balancePlayerIds: ["us.L6"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 39,
          restDefenseStructure: "2+1",
        },
      ),
      animStep(
        "to-rw",
        22800,
        4400,
        "Vervolg",
        [
          { kind: "phase", phase: "follow" },
          receiveBall("us.10"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[7]!) },
          { kind: "setZones", zones: [] },
          ...filmPass(TRAJ_10_RW, 22800, 4400),
          // Support network starts during flight (Pass 6 overlapping choreography)
          movePlayer(
            "us.RB",
            pt(toRw.usShape, "us.RB"),
            "easeOut",
            motionProfile(pt(lay.usShape, "us.RB"), pt(toRw.usShape, "us.RB"), {
              bulge: 2.2,
              side: 1,
            }),
          ),
          movePlayer(
            "us.R6",
            pt(toRw.usShape, "us.R6"),
            "easeOut",
            motionProfile(pt(lay.usShape, "us.R6"), pt(toRw.usShape, "us.R6"), {
              bulge: 2.8,
              side: -1,
            }),
          ),
          movePlayer(
            "us.10",
            pt(toRw.usShape, "us.10"),
            "easeInOut",
            motionProfile(pt(lay.usShape, "us.10"), pt(toRw.usShape, "us.10"), {
              bulge: 1.6,
              side: 1,
            }),
          ),
          movePlayer(
            "us.SP",
            pt(toRw.usShape, "us.SP"),
            "easeOut",
            motionProfile(pt(lay.usShape, "us.SP"), pt(toRw.usShape, "us.SP"), {
              checkAway: { x: 78, y: 36 },
              bulge: 1.4,
              side: -1,
            }),
          ),
          movePlayer(
            "us.LW",
            pt(toRw.usShape, "us.LW"),
            "easeInOut",
            motionProfile(pt(lay.usShape, "us.LW"), pt(toRw.usShape, "us.LW"), {
              bulge: 1.2,
              side: 1,
            }),
          ),
          movePlayer("us.L6", pt(toRw.usShape, "us.L6"), "easeOut"),
          movePlayer("us.RCV", pt(toRw.usShape, "us.RCV"), "easeOut"),
          movePlayer("us.LCV", pt(toRw.usShape, "us.LCV"), "easeInOut"),
          movePlayer("us.LB", pt(toRw.usShape, "us.LB"), "easeInOut"),
          movePlayer("us.GK", pt(toRw.usShape, "us.GK"), "easeInOut"),
          movePlayer(
            "us.RW",
            pt(toRw.usShape, "us.RW"),
            "easeOut",
            motionProfile(pt(lay.usShape, "us.RW"), pt(toRw.usShape, "us.RW"), {
              bulge: 2.4,
              side: 1,
            }),
          ),
          // Opponent block shift — staggered easings (ballside first)
          movePlayer("opp.rb", pt(toRw.opponentShape, "opp.rb"), "easeOut"),
          movePlayer("opp.rcb", pt(toRw.opponentShape, "opp.rcb"), "easeOut"),
          movePlayer("opp.rm", pt(toRw.opponentShape, "opp.rm"), "easeInOut"),
          movePlayer("opp.rcm", pt(toRw.opponentShape, "opp.rcm"), "easeInOut"),
          movePlayer("opp.lcm", pt(toRw.opponentShape, "opp.lcm"), "easeInOut"),
          movePlayer("opp.lm", pt(toRw.opponentShape, "opp.lm"), "easeInOut"),
          movePlayer("opp.lb", pt(toRw.opponentShape, "opp.lb"), "easeInOut"),
          movePlayer("opp.lcb", pt(toRw.opponentShape, "opp.lcb"), "easeInOut"),
          movePlayer("opp.lst", pt(toRw.opponentShape, "opp.lst"), "easeOut"),
          movePlayer("opp.rst", pt(toRw.opponentShape, "opp.rst"), "easeOut"),
          shapeMoves(toRw.usShape, toRw.opponentShape, "accelerate"),
          receiveBall("us.RW"),
        ],
        CONNECTED_TEAM_FILM.scenes[7]!.teachingPoint,
        {
          ballZone: "right-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.RB", "us.R6"],
          balancePlayerIds: ["us.L6", "us.LB"],
          depthThreatPlayerIds: ["opp.lst"],
          markedOpponentIds: ["opp.lst"],
          lastLineHeight: 41,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "rw-join",
        27200,
        3200,
        "Balans",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.RW"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[8]!) },
          { kind: "setLines", lines: [] },
          movePlayer(
            "us.RB",
            pt(end.usShape, "us.RB"),
            "easeOut",
            motionProfile(pt(toRw.usShape, "us.RB"), pt(end.usShape, "us.RB"), {
              bulge: 1.2,
              side: 1,
            }),
          ),
          movePlayer(
            "us.R6",
            pt(end.usShape, "us.R6"),
            "easeOut",
            motionProfile(pt(toRw.usShape, "us.R6"), pt(end.usShape, "us.R6"), {
              bulge: 1.5,
              side: -1,
            }),
          ),
          movePlayer("us.10", pt(end.usShape, "us.10"), "easeInOut"),
          movePlayer("us.SP", pt(end.usShape, "us.SP"), "easeOut"),
          movePlayer("us.LW", pt(end.usShape, "us.LW"), "easeInOut"),
          movePlayer("us.L6", pt(end.usShape, "us.L6"), "easeOut"),
          movePlayer("us.RCV", pt(end.usShape, "us.RCV"), "easeOut"),
          movePlayer("opp.rb", pt(end.opponentShape, "opp.rb"), "easeOut"),
          movePlayer("opp.rm", pt(end.opponentShape, "opp.rm"), "easeInOut"),
          movePlayer("opp.rcm", pt(end.opponentShape, "opp.rcm"), "easeInOut"),
          shapeMoves(end.usShape, end.opponentShape, "decelerate"),
          { kind: "hold" },
        ],
        CONNECTED_TEAM_FILM.scenes[8]!.teachingPoint,
        {
          ballZone: "right-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          balancePlayerIds: ["us.L6", "us.LB"],
          coverPlayerIds: ["us.R6", "us.RB"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 42,
          restDefenseStructure: "3+1",
          teamCompactness: { width: 68, length: 40 },
        },
      ),
      animStep(
        "opp-close",
        30400,
        1600,
        "Balans",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.RW"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[9]!) },
          movePlayer("opp.rb", pt(end.opponentShape, "opp.rb"), "easeOut"),
          movePlayer("opp.rm", pt(end.opponentShape, "opp.rm"), "easeOut"),
          movePlayer("opp.rcm", pt(end.opponentShape, "opp.rcm"), "easeOut"),
          movePlayer("opp.lcm", pt(end.opponentShape, "opp.lcm"), "easeInOut"),
          shapeMoves(end.usShape, end.opponentShape, "walk-adjust"),
          { kind: "hold" },
        ],
        CONNECTED_TEAM_FILM.scenes[9]!.teachingPoint,
        {
          ballZone: "right-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "opp.rb",
          coverPlayerIds: ["us.R6", "us.RB"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 42,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "recycle-8",
        32000,
        1800,
        "Balans",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.RW"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[10]!) },
          ...filmPass(TRAJ_RW_8, 32000, 1800),
          movePlayer(
            "us.R6",
            pt(recycle8.usShape, "us.R6"),
            "easeOut",
            motionProfile(pt(end.usShape, "us.R6"), pt(recycle8.usShape, "us.R6"), {
              bulge: 1.2,
              side: -1,
            }),
          ),
          shapeMoves(recycle8.usShape, recycle8.opponentShape, "accelerate"),
          receiveBall("us.R6"),
        ],
        CONNECTED_TEAM_FILM.scenes[10]!.teachingPoint,
        {
          ballZone: "right-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.R6", "us.RCV"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 40,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "recycle-rcb",
        33800,
        1800,
        "Balans",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.R6"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[11]!) },
          ...filmPass(TRAJ_8_RCB, 33800, 1800),
          movePlayer(
            "us.RCV",
            pt(recycleRcb.usShape, "us.RCV"),
            "easeOut",
            motionProfile(pt(recycle8.usShape, "us.RCV"), pt(recycleRcb.usShape, "us.RCV"), {
              bulge: 1.4,
              side: 1,
            }),
          ),
          shapeMoves(recycleRcb.usShape, recycleRcb.opponentShape, "decelerate"),
          receiveBall("us.RCV"),
        ],
        CONNECTED_TEAM_FILM.scenes[11]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.RCV", "us.L6"],
          balancePlayerIds: ["us.LB"],
          lastLineHeight: 38,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "switch-6",
        35600,
        1800,
        "Switch",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.RCV"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[12]!) },
          ...filmPass(TRAJ_RCB_6, 35600, 1800),
          movePlayer(
            "us.L6",
            pt(switch6.usShape, "us.L6"),
            "easeOut",
            motionProfile(pt(recycleRcb.usShape, "us.L6"), pt(switch6.usShape, "us.L6"), {
              bulge: 1.2,
              side: -1,
            }),
          ),
          shapeMoves(switch6.usShape, switch6.opponentShape, "accelerate"),
          receiveBall("us.L6"),
        ],
        CONNECTED_TEAM_FILM.scenes[12]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.L6", "us.LCV"],
          balancePlayerIds: ["us.LB"],
          lastLineHeight: 36,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "switch-lcb",
        37400,
        1600,
        "Switch",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.L6"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[13]!) },
          ...filmPass(TRAJ_6_LCB, 37400, 1600),
          movePlayer(
            "us.LCV",
            pt(switchLcb.usShape, "us.LCV"),
            "easeOut",
            motionProfile(pt(switch6.usShape, "us.LCV"), pt(switchLcb.usShape, "us.LCV"), {
              bulge: 1.2,
              side: 1,
            }),
          ),
          shapeMoves(switchLcb.usShape, switchLcb.opponentShape, "accelerate"),
          receiveBall("us.LCV"),
        ],
        CONNECTED_TEAM_FILM.scenes[13]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.LCV", "us.LB"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 34,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "switch-lb",
        39000,
        1600,
        "Switch",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.LCV"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[14]!) },
          ...filmPass(TRAJ_LCB_LB, 39000, 1600),
          movePlayer(
            "us.LB",
            pt(switchLb.usShape, "us.LB"),
            "easeOut",
            motionProfile(pt(switchLcb.usShape, "us.LB"), pt(switchLb.usShape, "us.LB"), {
              bulge: 1.4,
              side: -1,
            }),
          ),
          shapeMoves(switchLb.usShape, switchLb.opponentShape, "accelerate"),
          receiveBall("us.LB"),
        ],
        CONNECTED_TEAM_FILM.scenes[14]!.teachingPoint,
        {
          ballZone: "left-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.LB", "us.LCV"],
          balancePlayerIds: ["us.L6"],
          lastLineHeight: 32,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "switch-lw",
        40600,
        2200,
        "Switch",
        [
          { kind: "phase", phase: "result" },
          receiveBall("us.LB"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[15]!) },
          ...filmPass(TRAJ_LB_LW, 40600, 2200),
          movePlayer(
            "us.LW",
            pt(switchLw.usShape, "us.LW"),
            "easeOut",
            motionProfile(pt(switchLb.usShape, "us.LW"), pt(switchLw.usShape, "us.LW"), {
              bulge: 2.2,
              side: 1,
            }),
          ),
          shapeMoves(switchLw.usShape, switchLw.opponentShape, "accelerate"),
          receiveBall("us.LW"),
        ],
        CONNECTED_TEAM_FILM.scenes[15]!.teachingPoint,
        {
          ballZone: "left-flank",
          possessionTeam: "us",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.LW", "us.LB"],
          balancePlayerIds: ["us.R6"],
          lastLineHeight: 30,
          restDefenseStructure: "3+1",
        },
      ),
      animStep(
        "loss-a",
        42800,
        1800,
        "Herstel",
        [
          { kind: "phase", phase: "result" },
          { kind: "setLines", lines: [] },
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[16]!) },
          ...filmPass(TRAJ_LOSS, 42800, 1800),
          movePlayer("us.RW", pt(lossA.usShape, "us.RW"), "easeOut"),
          movePlayer("us.R6", pt(lossA.usShape, "us.R6"), "easeOut"),
          movePlayer("us.10", pt(lossA.usShape, "us.10"), "easeOut"),
          movePlayer("us.SP", pt(lossA.usShape, "us.SP"), "easeOut"),
          movePlayer("us.RB", pt(lossA.usShape, "us.RB"), "easeInOut"),
          receiveBall("opp.rcm"),
          shapeMoves(lossA.usShape, lossA.opponentShape, "sprint"),
        ],
        CONNECTED_TEAM_FILM.scenes[16]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "opponent",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "us.LW",
          coverPlayerIds: ["us.R6"],
          balancePlayerIds: ["us.L6"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 34,
        },
      ),
      animStep(
        "loss-b",
        44600,
        2200,
        "Herstel",
        [
          { kind: "phase", phase: "result" },
          receiveBall("opp.rcm"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[17]!) },
          { kind: "setLines", lines: [] },
          movePlayer("us.L6", pt(lossB.usShape, "us.L6"), "easeOut"),
          movePlayer("us.R6", pt(lossB.usShape, "us.R6"), "easeOut"),
          movePlayer("us.RCV", pt(lossB.usShape, "us.RCV"), "easeOut"),
          shapeMoves(lossB.usShape, lossB.opponentShape, "accelerate"),
        ],
        CONNECTED_TEAM_FILM.scenes[17]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "opponent",
          defensiveBlock: "mid",
          primaryPressurePlayerId: "us.RW",
          coverPlayerIds: ["us.R6", "us.L6"],
          lastLineHeight: 30,
        },
      ),
      animStep(
        "loss-c",
        46800,
        2400,
        "Herstel",
        [
          { kind: "phase", phase: "result" },
          receiveBall("opp.rcm"),
          { kind: "highlight", playerIds: focusIds(CONNECTED_TEAM_FILM.scenes[18]!) },
          movePlayer("us.RB", pt(lossC.usShape, "us.RB"), "easeOut"),
          movePlayer("us.RW", pt(lossC.usShape, "us.RW"), "easeOut"),
          movePlayer("us.LW", pt(lossC.usShape, "us.LW"), "easeInOut"),
          movePlayer("us.10", pt(lossC.usShape, "us.10"), "easeOut"),
          shapeMoves(lossC.usShape, lossC.opponentShape, "jog"),
        ],
        CONNECTED_TEAM_FILM.scenes[18]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "opponent",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.L6", "us.R6"],
          balancePlayerIds: ["us.LW", "us.RW"],
          lastLineHeight: 26,
        },
      ),
      animStep(
        "loss-d",
        49200,
        9000,
        "Herstel",
        [
          { kind: "phase", phase: "result" },
          receiveBall("opp.rcm"),
          { kind: "highlight", playerIds: [] },
          shapeMoves(lossD.usShape, lossD.opponentShape, "decelerate"),
          { kind: "hold" },
        ],
        CONNECTED_TEAM_FILM.scenes[19]!.teachingPoint,
        {
          ballZone: "middle-third",
          possessionTeam: "opponent",
          defensiveBlock: "mid",
          coverPlayerIds: ["us.10", "us.L6", "us.R6"],
          balancePlayerIds: ["us.LW", "us.RW"],
          depthThreatPlayerIds: ["opp.lst", "opp.rst"],
          lastLineHeight: 24,
        },
      ),
    ],
    {
      complexity: "situation",
      pauseAtEndMs: 2200,
      positioningMode: "authored",
      defaultPlaybackRate: 1,
    },
  );
}

export const CONNECTED_TEAM_TRAJECTORIES = [
  TRAJ_R6_10,
  TRAJ_10_SP,
  TRAJ_SP_10,
  TRAJ_10_RW,
  TRAJ_RW_8,
  TRAJ_8_RCB,
  TRAJ_RCB_6,
  TRAJ_6_LCB,
  TRAJ_LCB_LB,
  TRAJ_LB_LW,
  TRAJ_LOSS,
] as const;

/** Pass-6 elite collective proof seeks. */
export const CONNECTED_TEAM_PASS6_SEEKS = {
  "01-rw-pre-arrival-team-starts-moving": 24200,
  "02-rw-first-touch-half-open": 26200,
  "03-rb-support-below": 26800,
  "04-eight-inner-support": 27000,
  "05-ten-right-halfspace": 27200,
  "06-st-binding-run": 26600,
  "07-lw-far-post-adjustment": 27400,
  "08-five-options-around-rw-clean": 29000,
  "09-live-3241-clean": 29800,
  "10-live-3241-with-relations-coach": 30000,
  "11-rest-defence-lb-lcb-rcb-six": 29600,
  "12-opponent-full-block-shift": 31200,
  "13-forward-options-closed": 31600,
  "14-rw-to-eight-release": 32200,
  "15-eight-receive": 33400,
  "16-eight-to-rcb-release": 34000,
  "17-rcb-receive-and-open": 35200,
  "18-loss-frame": 42800,
  "19-counterpress-400ms": 43200,
  "20-counterpress-1000ms": 43800,
  "21-recovery-1800ms": 44600,
  "22-final-442": 55700,
} as const;

/** Pass-3 proof seek times (Academy). */
export const CONNECTED_TEAM_PASS3_SEEKS = {
  "04a-sp-binds-start": 11800,
  "04b-sp-comes-short": 14800,
  "05a-ten-pass-release": 15300,
  "05b-sp-arrival": 17900,
  "06a-sp-contact-hold": 18050,
  "06b-wall-pass-release": 18260,
  "06c-ten-receives-wall-pass": 20500,
  "07a-third-player-release": 23200,
  "07b-rw-arrival-clean": 26500,
  "08a-canonical-3241-clean": 29800,
  "08b-canonical-3241-with-roles": 29800,
  "08c-recycle-first-pass": 32200,
  "08d-recycle-second-pass": 34000,
  "09a-loss": 43400,
  "09b-delay": 45400,
  "09c-recover": 48200,
  "09d-final-442": 55700,
} as const;

/** Pass-4 perception-led proof seeks. */
export const CONNECTED_TEAM_PASS4_SEEKS = {
  "01-true-4231-clean": 1200,
  "01-true-4231-with-lines": 2000,
  "02-opponent-442-midblock": 2800,
  "03-r6-scan": 4600,
  "04-ten-cover-shadow": 4800,
  "05-ten-free-pocket": 6800,
  "06-ten-half-open-receive": 11200,
  "07-sp-binds-cvs": 12200,
  "08-sp-comes-short": 14800,
  "09-space-behind-stepping-cv": 15000,
  "10-sp-contact": 18050,
  "11-wall-pass-ten": 20500,
  "12-rw-pre-scan": 22000,
  "13-third-man-release": 23200,
  "14-rw-half-open-arrival": 26500,
  "15-rw-options": 27200,
  "16-true-3241-clean": 29800,
  "17-true-3241-orientation": 30000,
  "18-true-3241-opponent-reaction": 31200,
  "19-loss": 42800,
  "20-delay": 44600,
  "21-recover": 46800,
  "22-final-442-orientation": 52200,
} as const;

/** Pass-7 switch-of-play proof seeks (RCB → 6 → LCB → LB → LW). */
export const CONNECTED_TEAM_PASS7_SEEKS = {
  "01-start-4231-meters": 1200,
  "02-opponent-442-midblock-meters": 2800,
  "03-line-gap-report-start": 2000,
  "04-rw-arrival": 26200,
  "05-five-attacking-lanes-clean": 29000,
  "06-live-325-with-rest-defence": 29800,
  "07-opponent-ballside-compact": 31200,
  "08-right-side-overload": 31600,
  "09-recycle-rw-to-eight": 32200,
  "10-rcb-opens": 35200,
  "11-six-receives-open": 37000,
  "12-lcb-prepares-switch": 38600,
  "13-lb-receives": 40200,
  "14-lw-receives-switch": 42000,
  "15-opponent-reverse-shift": 42200,
  "16-loss": 42800,
  "17-first-pressure": 43200,
  "18-442-line-gaps": 51000,
  "19-442-width-proof": 52000,
  "20-final-compact-442-clean": 56000,
  "21-opponent-4231-vs-our-442": 56000,
  "22-six-open-body": 37000,
  "23-eight-open-body": 33400,
  "24-ten-back-foot": 11200,
  "25-st-back-to-goal": 18000,
  "26-rw-outside-foot": 26200,
  "27-lb-switch-body": 40200,
} as const;

/** Pass-8 Gate A / body / motion proof seeks (film timeline). */
export const CONNECTED_TEAM_PASS8_SEEKS = {
  A1: 29800,
  A2: 35200,
  A3: 56000,
  "A1-our-325-vs-opponent-442-clean": 29800,
  "A1-our-325-vs-opponent-442-meters": 29800,
  "A2-switch-preparation-clean": 35200,
  "A2-switch-chain-coach": 35200,
  "A2-opponent-overload-right": 35200,
  "A3-our-compact-442-clean": 56000,
  "A3-our-compact-442-meters": 56000,
  "A3-opponent-4231-clean": 56000,
  "B1-six-open-body": 37000,
  "B2-eight-support-body": 33400,
  "B3-ten-back-foot": 11200,
  "B4-st-back-to-goal": 18000,
  "B5-rw-outside-foot": 26200,
  "B6-lb-switch-receive": 40200,
  "C1-rw-support-relations": 29000,
  "C2-opponent-ballside-chain": 31200,
  "C3-switch-central-chain": 38600,
  "C4-opponent-reverse-shift": 42200,
  "C5-loss-400ms": 43200,
  "C6-loss-1200ms": 44000,
  "C7-final-442": 56000,
} as const;
