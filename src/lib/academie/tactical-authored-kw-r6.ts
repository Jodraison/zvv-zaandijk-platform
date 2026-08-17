/**
 * Kernwaarden (kw-r6-ball) — Game Model refinement.
 * Attack L→R. Orientation + onside RW at release. Professional back three.
 */

import type { AuthoredScenarioBrief } from "@/lib/academie/tactical-authored-types";
import { authoredAt } from "@/lib/academie/tactical-authored-types";
import { OPPONENT_MODEL_4231_MID_ZONE } from "@/lib/academie/tactical-game-model";
import { orient } from "@/lib/academie/tactical-orientation";

const START_US = {
  "us.GK": authoredAt(12, 50, "support", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(32, 16, "width-left", orient(10, "side-on", { type: "teammate", playerId: "us.LW" })),
  "us.LCV": authoredAt(24, 36, "rest-left", orient(15, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(26, 64, "rest-right", orient(-10, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(36, 80, "mid-high", orient(-5, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(40, 38, "balance", orient(20, "half-open", { type: "ball" })),
  "us.R6": authoredAt(46, 58, "ball-carrier", orient(-30, "half-open", { type: "scan", targets: ["us.10", "us.L6"] }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "right" })),
  "us.10": authoredAt(56, 40, "between-lines", orient(-10, "half-open", { type: "scan", targets: ["us.SP", "us.RW"] })),
  "us.LW": authoredAt(70, 12, "width", orient(5, "side-on", { type: "ball" })),
  "us.RW": authoredAt(72, 88, "width", orient(-20, "side-on", { type: "ball" })),
  "us.SP": authoredAt(76, 50, "bind", orient(180, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const START_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(80, 14, "back"),
  "opp.lcb": authoredAt(78, 36, "cb"),
  "opp.rcb": authoredAt(78, 64, "cb"),
  "opp.rb": authoredAt(80, 86, "back"),
  "opp.ldm": authoredAt(62, 38, "screen"),
  "opp.rdm": authoredAt(62, 58, "screen"),
  "opp.10": authoredAt(52, 50, "am"),
  "opp.lw": authoredAt(56, 20, "wing"),
  "opp.rw": authoredAt(56, 80, "wing"),
  "opp.st": authoredAt(42, 50, "transition"),
};

const FREE_US = {
  "us.GK": authoredAt(14, 50, "support", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(34, 20, "tuck-start", orient(20, "half-open", { type: "ball" })),
  "us.LCV": authoredAt(28, 38, "back-three", orient(15, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(30, 62, "back-three", orient(-10, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(42, 82, "under-rw", orient(-15, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(42, 36, "balance", orient(25, "half-open", { type: "ball" })),
  "us.R6": authoredAt(50, 74, "lure", orient(-55, "half-open", { type: "teammate", playerId: "us.10" }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "left" })),
  "us.10": authoredAt(72, 20, "free-pocket", orient(25, "half-open", { type: "scan", targets: ["us.SP", "us.RW", "us.R6"] }, { receivingFoot: "right", nextActionIntent: "turn" })),
  "us.LW": authoredAt(70, 12, "width", orient(5, "side-on", { type: "ball" })),
  "us.RW": authoredAt(74, 88, "width", orient(-25, "side-on", { type: "ball" })),
  "us.SP": authoredAt(74, 48, "bind", orient(175, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const FREE_OPP = {
  "opp.gk": authoredAt(94, 48, "gk"),
  "opp.lb": authoredAt(80, 16, "line"),
  "opp.lcb": authoredAt(78, 38, "line"),
  "opp.rcb": authoredAt(78, 64, "line"),
  "opp.rb": authoredAt(80, 86, "line"),
  "opp.ldm": authoredAt(74, 42, "screen-sp"),
  "opp.rdm": authoredAt(52, 72, "step-r6"),
  "opp.10": authoredAt(66, 68, "cover-centre"),
  "opp.lw": authoredAt(56, 22, "shift"),
  "opp.rw": authoredAt(58, 80, "shift"),
  "opp.st": authoredAt(42, 50, "threat"),
};

const RECV_US = {
  "us.GK": authoredAt(14, 52, "support", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(36, 24, "tuck", orient(25, "half-open", { type: "ball" })),
  "us.LCV": authoredAt(32, 40, "back-three", orient(20, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(34, 58, "back-three", orient(-5, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(48, 84, "under-rw", orient(-20, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(44, 38, "balance", orient(30, "half-open", { type: "ball" })),
  "us.R6": authoredAt(50, 56, "under", orient(-25, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(58, 34, "receive", orient(40, "half-open", { type: "scan", targets: ["us.SP", "us.RW", "goal"] }, { receivingFoot: "right", nextActionIntent: "play-forward", prePassScan: true })),
  "us.LW": authoredAt(70, 14, "width", orient(0, "side-on", { type: "ball" })),
  "us.RW": authoredAt(74, 86, "width-onside", orient(-30, "side-on", { type: "ball" })),
  "us.SP": authoredAt(74, 48, "bind", orient(170, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const RECV_OPP = {
  "opp.gk": authoredAt(94, 48, "gk"),
  "opp.lb": authoredAt(80, 18, "line"),
  "opp.lcb": authoredAt(76, 38, "line"),
  "opp.rcb": authoredAt(78, 62, "line"),
  "opp.rb": authoredAt(80, 84, "line"),
  "opp.ldm": authoredAt(66, 34, "screen-sp"),
  "opp.rdm": authoredAt(64, 52, "cover"),
  "opp.10": authoredAt(56, 40, "press-10"),
  "opp.lw": authoredAt(58, 24, "shift"),
  "opp.rw": authoredAt(58, 78, "shift"),
  "opp.st": authoredAt(44, 50, "threat"),
};

/** Options — shot blocked; RW wide ONSIDE (x≤ last line). Release to RW uses this shape. */
const OPT_US = {
  "us.GK": authoredAt(16, 52, "support", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(38, 26, "tuck", orient(30, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(36, 42, "back-three", orient(20, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(40, 58, "back-three", orient(0, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(54, 86, "attacking-back", orient(-25, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(48, 42, "balance", orient(25, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(52, 56, "under", orient(-20, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(58, 28, "carrier", orient(55, "half-open", { type: "teammate", playerId: "us.RW" }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "right" })),
  "us.LW": authoredAt(70, 16, "far", orient(5, "side-on", { type: "ball" })),
  "us.RW": authoredAt(74, 88, "free-width-onside", orient(-45, "side-on", { type: "ball" }, { receivingFoot: "left", nextActionIntent: "run-in-behind" })),
  "us.SP": authoredAt(78, 52, "between", orient(160, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const OPT_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(80, 20, "line"),
  "opp.lcb": authoredAt(76, 40, "line"),
  "opp.rcb": authoredAt(78, 60, "line"),
  "opp.rb": authoredAt(80, 82, "hold-line"),
  "opp.ldm": authoredAt(68, 34, "screen"),
  "opp.rdm": authoredAt(70, 50, "screen-central"),
  "opp.10": authoredAt(48, 58, "press"),
  "opp.lw": authoredAt(58, 24, "shift"),
  "opp.rw": authoredAt(62, 70, "help"),
  "opp.st": authoredAt(44, 50, "threat"),
};

const RW_US = {
  "us.GK": authoredAt(18, 54, "angle", orient(15, "open", { type: "ball" })),
  "us.LB": authoredAt(40, 26, "back-three", orient(40, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(40, 42, "back-three", orient(25, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(44, 58, "back-three", orient(5, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(64, 90, "attacking-back", orient(-50, "half-open", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(52, 46, "rest-apex", orient(20, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(56, 58, "under", orient(-30, "half-open", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle" })),
  "us.10": authoredAt(54, 36, "inside", orient(40, "half-open", { type: "teammate", playerId: "us.RW" })),
  "us.LW": authoredAt(70, 18, "far", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(76, 86, "receive-onside", orient(-70, "half-open", { type: "scan", targets: ["us.RB", "us.10", "us.R6"] }, { receivingFoot: "left", nextActionIntent: "recycle", prePassScan: true })),
  "us.SP": authoredAt(80, 46, "occupy", orient(150, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const RW_OPP = {
  "opp.gk": authoredAt(94, 58, "angle"),
  "opp.lb": authoredAt(80, 22, "far-line"),
  "opp.lcb": authoredAt(74, 40, "cover"),
  "opp.rcb": authoredAt(76, 62, "depth"),
  "opp.rb": authoredAt(78, 78, "step-outside"),
  "opp.ldm": authoredAt(68, 34, "screen-10"),
  "opp.rdm": authoredAt(70, 48, "ball-side"),
  "opp.10": authoredAt(50, 52, "recover"),
  "opp.lw": authoredAt(58, 26, "far"),
  "opp.rw": authoredAt(62, 68, "help"),
  "opp.st": authoredAt(46, 52, "threat"),
};

const LAY_US = {
  "us.GK": authoredAt(18, 52, "support", orient(10, "open", { type: "ball" })),
  "us.LB": authoredAt(40, 26, "back-three", orient(35, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(40, 42, "back-three", orient(20, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(44, 58, "back-three", orient(0, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(62, 86, "reposition", orient(-40, "half-open", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(52, 46, "rest-apex", orient(15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(54, 58, "balance", orient(-20, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(64, 46, "receive-lay", orient(30, "half-open", { type: "scan", targets: ["us.SP", "us.RW", "us.R6"] }, { receivingFoot: "either", nextActionIntent: "play-forward" })),
  "us.LW": authoredAt(70, 20, "far", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(78, 84, "after-pass", orient(-60, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.SP": authoredAt(78, 46, "option", orient(155, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const LAY_OPP = {
  "opp.gk": authoredAt(94, 52, "recover"),
  "opp.lb": authoredAt(80, 22, "line"),
  "opp.lcb": authoredAt(76, 42, "recover"),
  "opp.rcb": authoredAt(76, 58, "line"),
  "opp.rb": authoredAt(78, 72, "recover"),
  "opp.ldm": authoredAt(66, 38, "screen"),
  "opp.rdm": authoredAt(62, 52, "near"),
  "opp.10": authoredAt(52, 52, "recover"),
  "opp.lw": authoredAt(56, 26, "far"),
  "opp.rw": authoredAt(60, 70, "shift"),
  "opp.st": authoredAt(44, 50, "threat"),
};

const END_US = {
  "us.GK": authoredAt(16, 50, "support", orient(10, "open", { type: "ball" })),
  "us.LB": authoredAt(38, 26, "back-three", orient(40, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(40, 42, "back-three", orient(25, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RCV": authoredAt(44, 58, "back-three", orient(5, "half-open", { type: "opponent", playerId: "opp.st" })),
  "us.RB": authoredAt(58, 82, "ball-side", orient(-35, "half-open", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(52, 46, "rest-apex", orient(15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(56, 58, "under", orient(-25, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(62, 46, "options", orient(35, "half-open", { type: "scan", targets: ["us.SP", "us.RW", "us.R6"] }, { nextActionIntent: "play-forward", prePassScan: true })),
  "us.LW": authoredAt(70, 18, "far", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(76, 78, "width", orient(-50, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.SP": authoredAt(78, 48, "depth", orient(155, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const END_OPP = {
  "opp.gk": authoredAt(94, 48, "gk"),
  "opp.lb": authoredAt(80, 20, "line"),
  "opp.lcb": authoredAt(78, 40, "line"),
  "opp.rcb": authoredAt(78, 60, "line"),
  "opp.rb": authoredAt(80, 78, "line"),
  "opp.ldm": authoredAt(66, 38, "dm"),
  "opp.rdm": authoredAt(66, 56, "dm"),
  "opp.10": authoredAt(54, 50, "am"),
  "opp.lw": authoredAt(56, 24, "wing"),
  "opp.rw": authoredAt(58, 74, "wing"),
  "opp.st": authoredAt(44, 50, "transition"),
};

export const KW_R6_AUTHORED: AuthoredScenarioBrief = {
  id: "kw-r6-ball",
  lessonObjective:
    "Verplaatsing R6→10→RW onside; oriëntatie leesbaar; 3-2-4-1 + recycle; zone 4-2-3-1; geen pass door dicht schot.",
  positioningMode: "authored",
  attackDirection: "left-to-right",
  us: {
    baseFormation: "4-2-3-1",
    attackingShape: "3-2-4-1 (RB aanvallend)",
    attackingBackId: "us.RB",
    tuckingBackId: "us.LB",
    playerRoles: {
      "us.R6": "start-carrier / under",
      "us.10": "between-lines",
      "us.L6": "balance / rest-apex",
      "us.RW": "width",
      "us.RB": "attacking-back",
      "us.LB": "tuck / back-three",
      "us.LCV": "back-three",
      "us.RCV": "back-three",
      "us.SP": "bind",
      "us.LW": "far-width",
      "us.GK": "support",
    },
  },
  opponent: {
    defensiveModel: OPPONENT_MODEL_4231_MID_ZONE.id,
    formation: OPPONENT_MODEL_4231_MID_ZONE.formation,
    blockHeight: OPPONENT_MODEL_4231_MID_ZONE.blockHeight,
    pressingTrigger: OPPONENT_MODEL_4231_MID_ZONE.pressingTrigger,
    pressingDirection: OPPONENT_MODEL_4231_MID_ZONE.pressingDirection,
    markingPrinciple: OPPONENT_MODEL_4231_MID_ZONE.markingPrinciple,
    playerRoles: {
      "opp.10": "press",
      "opp.rdm": "cover",
      "opp.ldm": "screen",
      "opp.st": "transition",
    },
  },
  transitionThreats: ["opp.st"],
  phases: [
    {
      id: "start",
      ballHolder: "us.R6",
      ballAt: { x: 46, y: 58 },
      ballZone: "middle-third",
      coachingPoint: "SCAN — druk, ruimte en steun",
      usShape: START_US,
      opponentShape: START_OPP,
      attackStructure: "4-2-3-1",
      restDefense: "3+2",
      plannedPasses: [],
    },
    {
      id: "free-10",
      ballHolder: "us.R6",
      ballAt: { x: 50, y: 74 },
      ballZone: "middle-third",
      coachingPoint: "10 vrij — corridor open/pressured",
      usShape: FREE_US,
      opponentShape: FREE_OPP,
      attackStructure: "4-2-3-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.R6", toId: "us.10", expectedStatus: "pressured", releaseTimeMs: 5800 },
      ],
    },
    {
      id: "recv-10",
      ballHolder: "us.10",
      ballAt: { x: 58, y: 34 },
      ballZone: "middle-third",
      coachingPoint: "10 ontvangt half-open — ziet SP én RW",
      usShape: RECV_US,
      opponentShape: RECV_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [],
    },
    {
      id: "options",
      ballHolder: "us.10",
      ballAt: { x: 58, y: 28 },
      ballZone: "middle-third",
      coachingPoint: "Schot dicht — RW open onside",
      usShape: OPT_US,
      opponentShape: OPT_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [
        {
          fromId: "us.10",
          toId: "shot-closed",
          expectedStatus: "blocked",
          exception: "forced-error",
        },
        {
          fromId: "us.10",
          toId: "us.RW",
          expectedStatus: "pressured",
          releaseTimeMs: 12800,
        },
      ],
    },
    {
      id: "to-rw",
      ballHolder: "us.RW",
      ballAt: { x: 76, y: 86 },
      ballZone: "right-flank",
      coachingPoint: "RW onside — recycle naar 10/RB",
      usShape: RW_US,
      opponentShape: RW_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.RW", toId: "us.10", expectedStatus: "pressured" },
      ],
    },
    {
      id: "lay-off",
      ballHolder: "us.10",
      ballAt: { x: 64, y: 46 },
      ballZone: "final-third",
      coachingPoint: "Terugleg — ruimte door opponent shift",
      usShape: LAY_US,
      opponentShape: LAY_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [],
    },
    {
      id: "end",
      ballHolder: "us.10",
      ballAt: { x: 62, y: 46 },
      ballZone: "final-third",
      coachingPoint: "3-2-4-1 — achterste drie — opties",
      usShape: END_US,
      opponentShape: END_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [],
    },
  ],
};
