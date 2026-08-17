/**
 * connected-team — Pass 7: UEFA spatial organisation rewrite.
 * True 4-2-3-1 build-up → 3-2-5 attack (RB joins the front five wide) →
 * recycle (RW→8→RCB) → full switch chain (RCB→6→LCB→LB→LW) → recovery to 4-4-2.
 * Spacing authored by hand — validators report only, never rewrite.
 */

import type { AuthoredScenarioBrief } from "@/lib/academie/tactical-authored-types";
import { authoredAt } from "@/lib/academie/tactical-authored-types";
import { OPPONENT_MODEL_442_MID_ZONE } from "@/lib/academie/tactical-game-model";
import { orient } from "@/lib/academie/tactical-orientation";

/**
 * Field map: x 0→100 attack left→right; y 0 = left wing, y 100 = right wing.
 * Meters: 1%x ≈ 1.05m, 1%y ≈ 0.68m (105m x 68m pitch).
 * Spacing targets: ≥5 between teammates in structure; ≥4 us↔opp except duel moments.
 */

/** Scène 1 — 4-2-3-1 wide: LW–10–RW één lijn (x58), SP vóór, opp compact 4-4-2 midblock. */
const START_US = {
  "us.GK": authoredAt(8, 50, "support-build", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(20, 10, "width-left", orient(15, "side-on", { type: "teammate", playerId: "us.LW" })),
  "us.LCV": authoredAt(18, 36, "line-left", orient(10, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(18, 64, "line-right", orient(-10, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(20, 90, "width-right", orient(-15, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(34, 36, "double-6-left", orient(20, "half-open-left", { type: "ball" })),
  "us.R6": authoredAt(38, 58, "ball-carrier", orient(-28, "half-open-right", { type: "scan", targets: ["us.10", "us.L6", "us.RCV"] }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "right" })),
  "us.LW": authoredAt(58, 10, "am-line", orient(5, "side-on", { type: "ball" })),
  "us.10": authoredAt(58, 50, "am-line", orient(-20, "closed", { type: "scan", targets: ["us.SP", "us.RW"] }, { nextActionIntent: "turn" })),
  "us.RW": authoredAt(58, 90, "am-line", orient(-15, "side-on", { type: "ball" })),
  "us.SP": authoredAt(70, 50, "ahead-of-am", orient(0, "open", { type: "goal" })),
};

/** Opp 4-4-2 midblock: front x58, mid x70-72 (gaps ~18y), back x82-84 (gaps ~18y) → ~12.2m gaps. */
const START_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(82, 22, "back-left"),
  "opp.lcb": authoredAt(84, 40, "cb-left"),
  "opp.rcb": authoredAt(84, 60, "cb-right"),
  "opp.rb": authoredAt(82, 78, "back-right"),
  "opp.lm": authoredAt(70, 22, "mid-left"),
  "opp.lcm": authoredAt(72, 40, "mid-centre-left"),
  "opp.rcm": authoredAt(72, 60, "mid-centre-right"),
  "opp.rm": authoredAt(70, 78, "mid-right"),
  "opp.lst": authoredAt(58, 40, "screen-left"),
  "opp.rst": authoredAt(58, 60, "screen-right"),
};

/** Scène 2 — 10 uit cover shadow; blijft op AM-hoogte, niet diep. */
const FREE_US = {
  "us.GK": authoredAt(9, 50, "support", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(22, 12, "line", orient(15, "half-open", { type: "ball" })),
  "us.LCV": authoredAt(20, 36, "line", orient(12, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(20, 64, "line", orient(-8, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(24, 88, "under-rw", orient(-15, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(38, 34, "safe-option", orient(25, "half-open-left", { type: "ball" })),
  "us.R6": authoredAt(42, 58, "lure", orient(-35, "half-open-right", { type: "teammate", playerId: "us.10" }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "left" })),
  "us.LW": authoredAt(60, 12, "hold-width", orient(5, "side-on", { type: "ball" })),
  "us.10": authoredAt(62, 32, "free-pocket", orient(28, "half-open-right", { type: "scan", targets: ["us.SP", "us.RW", "us.R6"] }, { receivingFoot: "right", nextActionIntent: "turn" })),
  "us.RW": authoredAt(62, 90, "hold-width", orient(-20, "side-on", { type: "ball" })),
  "us.SP": authoredAt(72, 48, "bind-high", orient(175, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

/** Tighter opp lines: back gaps 18/20/20y ≈ 12.2/13.6/13.6m (≤15m). */
const FREE_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(84, 18, "line"),
  "opp.lcb": authoredAt(82, 36, "line"),
  "opp.rcb": authoredAt(82, 56, "line"),
  "opp.rb": authoredAt(84, 76, "line"),
  "opp.lm": authoredAt(70, 16, "shift"),
  "opp.lcm": authoredAt(64, 44, "cover-inside"),
  "opp.rcm": authoredAt(58, 64, "step-ballside"),
  "opp.rm": authoredAt(70, 84, "hold"),
  "opp.lst": authoredAt(46, 34, "screen"),
  "opp.rst": authoredAt(46, 66, "screen"),
};

/** Scène 3 — 10 ontvangt half-open op AM-lijn. */
const RECV_US = {
  "us.GK": authoredAt(10, 52, "support", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(24, 18, "tuck", orient(20, "half-open", { type: "ball" })),
  "us.LCV": authoredAt(24, 38, "back", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(26, 56, "back", orient(-5, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(36, 86, "under-rw", orient(-20, "half-open-right", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(40, 34, "balance", orient(25, "half-open-left", { type: "ball" })),
  "us.R6": authoredAt(46, 54, "under-10", orient(-25, "half-open-right", { type: "teammate", playerId: "us.10" })),
  "us.LW": authoredAt(62, 12, "width", orient(0, "side-on", { type: "ball" })),
  "us.10": authoredAt(62, 32, "receive-open", orient(40, "half-open-right", { type: "scan", targets: ["us.SP", "us.RW"] }, { receivingFoot: "right", nextActionIntent: "play-forward", prePassScan: true })),
  "us.RW": authoredAt(64, 90, "width-onside", orient(-25, "side-on", { type: "ball" })),
  "us.SP": authoredAt(74, 50, "bind-between-cvs", orient(170, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

/** Back gaps 22/20/20y ≈ 15/13.6/13.6m. */
const RECV_OPP = {
  "opp.gk": authoredAt(94, 48, "gk"),
  "opp.lb": authoredAt(84, 16, "line"),
  "opp.lcb": authoredAt(82, 38, "line-with-sp"),
  "opp.rcb": authoredAt(82, 58, "line-with-sp"),
  "opp.rb": authoredAt(84, 78, "line"),
  "opp.lm": authoredAt(70, 16, "shift"),
  "opp.lcm": authoredAt(58, 44, "press-10"),
  "opp.rcm": authoredAt(56, 62, "cover"),
  "opp.rm": authoredAt(70, 84, "shift"),
  "opp.lst": authoredAt(46, 34, "threat"),
  "opp.rst": authoredAt(48, 64, "threat"),
};

/** Scène 4 — SP komt diagonaal kort; back-three vormt zich (3-2-4-1). */
const SP_US = {
  "us.GK": authoredAt(12, 52, "support", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(28, 18, "tuck", orient(25, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(30, 38, "back-three", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(32, 56, "back-three", orient(0, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(44, 86, "support-rw", orient(-25, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(44, 34, "screen", orient(20, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(50, 52, "under", orient(-15, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(60, 34, "open-to-sp", orient(35, "half-open", { type: "teammate", playerId: "us.SP" }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "left" })),
  "us.LW": authoredAt(64, 12, "far-width", orient(5, "side-on", { type: "ball" })),
  "us.RW": authoredAt(68, 90, "hold-onside", orient(-30, "side-on", { type: "ball" })),
  "us.SP": authoredAt(71, 44, "come-short", orient(185, "back-to-goal", { type: "teammate", playerId: "us.10" }, { receivingFoot: "either", nextActionIntent: "lay-off" })),
};

/** LCB steps to press SP (duel moment — wider gap accepted); other lines tight. */
const SP_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(82, 20, "line"),
  "opp.lcb": authoredAt(76, 46, "step-to-sp"),
  "opp.rcb": authoredAt(80, 62, "cover-depth"),
  "opp.rb": authoredAt(82, 84, "line"),
  "opp.lm": authoredAt(66, 20, "shift"),
  "opp.lcm": authoredAt(54, 40, "recover"),
  "opp.rcm": authoredAt(52, 58, "recover"),
  "opp.rm": authoredAt(68, 82, "track-rw"),
  "opp.lst": authoredAt(40, 26, "threat"),
  "opp.rst": authoredAt(46, 64, "threat"),
};

/**
 * Scène 5 arrival — SP heeft bal; 10 is meegekomen (kaatshoek).
 * Ball at kaatszijde van SP (richting 10).
 */
const SP_ARRIVE_US = {
  "us.GK": authoredAt(12, 52, "support", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(28, 18, "tuck", orient(25, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(30, 38, "back-three", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(32, 56, "back-three", orient(0, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(46, 86, "support-rw", orient(-25, "side-on", { type: "teammate", playerId: "us.RW" })),
  "us.L6": authoredAt(44, 34, "screen", orient(20, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(50, 52, "under", orient(-10, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(58, 36, "kaats-angle", orient(40, "half-open", { type: "teammate", playerId: "us.SP" }, { nextActionIntent: "turn", receivingFoot: "right" })),
  "us.LW": authoredAt(68, 12, "far-width", orient(5, "side-on", { type: "ball" })),
  "us.RW": authoredAt(74, 90, "hold-onside", orient(-30, "side-on", { type: "ball" })),
  "us.SP": authoredAt(71, 44, "receive-short", orient(170, "back-to-goal", { type: "teammate", playerId: "us.10" }, { receivingFoot: "either", nextActionIntent: "lay-off" })),
};

const SP_ARRIVE_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(82, 18, "line"),
  "opp.lcb": authoredAt(76, 48, "stay-sp"),
  "opp.rcb": authoredAt(80, 64, "cover-depth"),
  "opp.rb": authoredAt(82, 84, "line"),
  "opp.lm": authoredAt(66, 18, "shift"),
  "opp.lcm": authoredAt(48, 30, "recover"),
  "opp.rcm": authoredAt(52, 60, "recover"),
  "opp.rm": authoredAt(68, 82, "track-rw"),
  "opp.lst": authoredAt(40, 26, "threat"),
  "opp.rst": authoredAt(46, 64, "threat"),
};

/**
 * Scène 6 — kaats compleet: centraal gesloten → RW is vrije derde man.
 * LCB tussen 10 en ST; LCM sluit ST-lijn; RCB rugdekking.
 */
const LAY_US = {
  "us.GK": authoredAt(14, 54, "support", orient(10, "open", { type: "ball" })),
  "us.LB": authoredAt(30, 16, "back-three-far", orient(30, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(32, 36, "back-three", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(34, 56, "back-three-ballside", orient(-5, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(54, 84, "under-rw", orient(-35, "side-on", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(46, 34, "six-balance", orient(15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(52, 54, "eight-under", orient(-20, "half-open", { type: "teammate", playerId: "us.10" })),
  "us.10": authoredAt(62, 48, "lay-receive-forward", orient(55, "half-open-right", { type: "teammate", playerId: "us.RW" }, { prePassScan: true, nextActionIntent: "play-forward", receivingFoot: "right" })),
  "us.LW": authoredAt(68, 12, "far-width", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(76, 88, "third-man-onside", orient(-45, "side-on", { type: "ball" }, { receivingFoot: "left", nextActionIntent: "run-in-behind" })),
  "us.SP": authoredAt(76, 38, "bind-screened", orient(160, "back-to-goal", { type: "teammate", playerId: "us.10" })),
};

const LAY_OPP = {
  "opp.gk": authoredAt(94, 52, "gk"),
  "opp.lb": authoredAt(84, 20, "tuck"),
  /** Between 10 and ST — closes central lane after wall pass. */
  "opp.lcb": authoredAt(70, 44, "between-10-st"),
  "opp.rcb": authoredAt(78, 60, "cover-depth"),
  "opp.rb": authoredAt(82, 78, "choose-rw"),
  "opp.lm": authoredAt(64, 20, "shift"),
  /** Closes direct pass line 10 → ST. */
  "opp.lcm": authoredAt(52, 36, "close-st-lane"),
  "opp.rcm": authoredAt(50, 64, "squeeze-inside"),
  "opp.rm": authoredAt(70, 78, "help-inside"),
  "opp.lst": authoredAt(40, 26, "threat"),
  "opp.rst": authoredAt(46, 64, "threat"),
};

/**
 * Scène 7 — RW-arrival: 3-2-5 vormt zich. RB schuift door tot in de aanvalslijn
 * (widest lane, y≈94), RW ontvangt (y≈86). Steunnetwerk start al tijdens de pass.
 */
const RW_US = {
  "us.GK": authoredAt(18, 50, "sweeper", orient(20, "open", { type: "ball" })),
  "us.LB": authoredAt(46, 20, "rest-far", orient(30, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(48, 40, "rest-centre", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(52, 58, "rest-ballside", orient(-10, "half-open", { type: "opponent", playerId: "opp.rst" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(60, 39, "six-balance", orient(25, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(66, 66, "eight-ballside", orient(-40, "half-open-right", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle", receivingFoot: "right" })),
  "us.10": authoredAt(76, 41, "right-halfspace", orient(50, "half-open-right", { type: "scan", targets: ["us.RW", "us.SP"] }, { nextActionIntent: "turn" })),
  "us.LW": authoredAt(72, 12, "far-lane", orient(25, "side-on", { type: "ball" })),
  "us.RW": authoredAt(78, 86, "receive-width", orient(-45, "half-open-right", { type: "scan", targets: ["us.10", "us.R6", "us.RB"] }, { receivingFoot: "left", nextActionIntent: "recycle", prePassScan: true })),
  "us.RB": authoredAt(72, 94, "widest-lane", orient(-50, "half-open", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle" })),
  "us.SP": authoredAt(83, 53, "bind-first-post", orient(150, "back-to-goal", { type: "opponent", playerId: "opp.lcb" })),
};

/** Opp ballside compact, pre-END lines: back/mid mostly aligned (x82/x71), rb/rm pressing the RW/RB overload. */
const RW_OPP = {
  "opp.gk": authoredAt(94, 54, "gk"),
  "opp.lb": authoredAt(82, 28, "pinch-far"),
  "opp.lcb": authoredAt(82, 44, "mark-st"),
  "opp.rcb": authoredAt(82, 64, "cover-behind-rb"),
  "opp.rb": authoredAt(84, 88, "press-rw"),
  "opp.lm": authoredAt(71, 30, "pinch-switch"),
  "opp.lcm": authoredAt(71, 46, "screen-eight"),
  "opp.rcm": authoredAt(71, 58, "close-10"),
  "opp.rm": authoredAt(73, 74, "help-2v2"),
  "opp.lst": authoredAt(60, 46, "screen-six"),
  "opp.rst": authoredAt(60, 60, "screen-back"),
};

/**
 * Scène 8 — levend 3-2-5: vijf aanvalslanen (LW/10/SP/RW/RB), rest-drie
 * (LB/LCV/RCV) en dubbele 6 (L6 balans, R6 ballzijde) bewaren de bal.
 * Opponent sluit vooruit en flank → recycle + switch logisch.
 */
/**
 * Pass 8 Gate A1 — situational 3-2-5 (attack L→R):
 * front five lanes LW / 10 / ST / RW / RB; double pivot 6 low + 8 ballside higher;
 * rest defence LB–LCB–RCB as one readable line (~38–50m wide); GK swept.
 */
const END_US = {
  "us.GK": authoredAt(28, 50, "sweeper", orient(20, "open", { type: "ball" })),
  "us.LB": authoredAt(48, 12, "rest-far", orient(30, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(50, 34, "rest-centre", orient(-20, "half-open", { type: "teammate", playerId: "us.LB" }, { nextActionIntent: "recycle" })),
  "us.RCV": authoredAt(52, 68, "rest-ballside", orient(-25, "half-open", { type: "teammate", playerId: "us.R6" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(58, 44, "six-balance", orient(150, "half-open-left", { type: "teammate", playerId: "us.LCV" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(65, 74, "eight-ballside", orient(-95, "half-open-right", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle", receivingFoot: "right", prePassScan: true })),
  "us.LW": authoredAt(80, 10, "far-lane", orient(15, "side-on", { type: "ball" })),
  "us.10": authoredAt(82, 40, "left-halfspace", orient(25, "half-open", { type: "teammate", playerId: "us.SP" })),
  "us.SP": authoredAt(86, 52, "central-lane", orient(155, "back-to-goal", { type: "opponent", playerId: "opp.lcb" })),
  "us.RW": authoredAt(76, 80, "right-halfspace", orient(-110, "half-open", { type: "scan", targets: ["us.R6", "us.RB"] }, { nextActionIntent: "recycle", receivingFoot: "left" })),
  "us.RB": authoredAt(72, 94, "widest-lane", orient(-50, "half-open", { type: "teammate", playerId: "us.RW" }, { nextActionIntent: "recycle" })),
};

/** Canonical ballside 4-4-2 mid-block — three clear lines, width ≤46m, gaps 8–12m. */
const END_OPP = {
  "opp.gk": authoredAt(94, 52, "angle"),
  "opp.lb": authoredAt(84, 26, "pinch"),
  "opp.lcb": authoredAt(84, 44, "mark-st"),
  "opp.rcb": authoredAt(84, 64, "behind-press"),
  "opp.rb": authoredAt(84, 84, "press-rw"),
  "opp.lm": authoredAt(73, 28, "pinch"),
  "opp.lcm": authoredAt(73, 44, "close-8"),
  "opp.rcm": authoredAt(73, 60, "close-10"),
  "opp.rm": authoredAt(73, 78, "double-rw"),
  "opp.lst": authoredAt(62, 42, "screen-six"),
  "opp.rst": authoredAt(62, 58, "screen-lcb"),
};

/** Recycle: RW → 8 (R6) — 8 ontvangt binnenste steun. */
const RECYCLE_8_US = {
  "us.GK": authoredAt(20, 54, "sweeper", orient(20, "open", { type: "ball" })),
  "us.LB": authoredAt(46, 20, "rest-far", orient(30, "half-open", { type: "zone", zoneId: "far-channel" }, { nextActionIntent: "cover" })),
  "us.LCV": authoredAt(48, 40, "rest", orient(15, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(52, 58, "open-recycle", orient(-20, "half-open", { type: "teammate", playerId: "us.R6" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(58, 36, "six", orient(15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(64, 60, "receive-eight", orient(30, "half-open-right", { type: "scan", targets: ["us.RCV", "us.L6"] }, { receivingFoot: "right", nextActionIntent: "recycle", prePassScan: true })),
  "us.10": authoredAt(70, 50, "halfspace", orient(20, "half-open", { type: "ball" })),
  "us.LW": authoredAt(74, 14, "far", orient(15, "side-on", { type: "ball" })),
  "us.RW": authoredAt(76, 82, "after-pass", orient(-60, "half-open", { type: "teammate", playerId: "us.R6" })),
  "us.RB": authoredAt(70, 90, "widest-lane", orient(-40, "half-open", { type: "teammate", playerId: "us.RW" })),
  "us.SP": authoredAt(80, 46, "bind", orient(160, "back-to-goal", { type: "opponent", playerId: "opp.lcb" })),
};

const RECYCLE_8_OPP = {
  "opp.gk": authoredAt(94, 56, "gk"),
  "opp.lb": authoredAt(80, 32, "pinch"),
  "opp.lcb": authoredAt(78, 50, "st"),
  "opp.rcb": authoredAt(80, 66, "cover"),
  "opp.rb": authoredAt(84, 84, "press"),
  "opp.lm": authoredAt(68, 26, "pinch"),
  "opp.lcm": authoredAt(56, 36, "eight"),
  "opp.rcm": authoredAt(60, 60, "ten"),
  "opp.rm": authoredAt(70, 78, "rw"),
  "opp.lst": authoredAt(42, 34, "six"),
  "opp.rst": authoredAt(60, 50, "screen"),
};

/**
 * Recycle: 8 → RCB — canonical switch-prep frame (Gate A / A2). RCB has just
 * received and opens the ball toward 6; right side stays overloaded (RW/RB/8
 * after the pass just made) while the left side (LCB/LB/LW) opens up wide.
 */
/**
 * Pass 8 Gate A2 — switch preparation: right overloaded/closed, centre recycle open,
 * left opening. Chain visible as RCB (ball) → 6 → LCB → LB → LW readiness.
 */
const RECYCLE_RCB_US = {
  "us.GK": authoredAt(22, 48, "sweeper", orient(10, "open", { type: "ball" })),
  "us.LB": authoredAt(42, 10, "higher-wider", orient(25, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(46, 28, "open-to-lb", orient(-25, "half-open", { type: "teammate", playerId: "us.LB" })),
  "us.RCV": authoredAt(50, 54, "receive-rcb", orient(45, "half-open", { type: "teammate", playerId: "us.L6" }, { receivingFoot: "left", nextActionIntent: "recycle", prePassScan: true })),
  "us.L6": authoredAt(56, 40, "open-both-ways", orient(-15, "half-open-left", { type: "scan", targets: ["us.LCV", "us.LB"] }, { receivingFoot: "left" })),
  "us.R6": authoredAt(58, 66, "after-pass", orient(-20, "half-open", { type: "teammate", playerId: "us.RCV" })),
  "us.10": authoredAt(70, 30, "drift-left-halfspace", orient(20, "half-open", { type: "zone", zoneId: "left-halfspace" })),
  "us.LW": authoredAt(76, 8, "max-width", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(72, 86, "closed-right", orient(-45, "side-on", { type: "ball" })),
  "us.RB": authoredAt(66, 92, "rest-right", orient(-35, "half-open", { type: "ball" })),
  "us.SP": authoredAt(84, 48, "bind-cvs", orient(160, "back-to-goal", { type: "opponent", playerId: "opp.lcb" })),
};

/** Opp fully shifted right: far LM/LB pinched; no player on far touchline; width ≤46m. */
const RECYCLE_RCB_OPP = {
  "opp.gk": authoredAt(94, 54, "gk"),
  "opp.lb": authoredAt(80, 34, "pinch-inward"),
  "opp.lcb": authoredAt(80, 46, "cover-centre"),
  "opp.rcb": authoredAt(84, 66, "ballside"),
  "opp.rb": authoredAt(86, 86, "press-rw"),
  "opp.lm": authoredAt(66, 34, "pinch-inward"),
  "opp.lcm": authoredAt(68, 46, "screen-switch"),
  "opp.rcm": authoredAt(72, 62, "ballside"),
  "opp.rm": authoredAt(74, 78, "ballside"),
  "opp.lst": authoredAt(58, 44, "screen-centre"),
  "opp.rst": authoredAt(60, 58, "screen-centre"),
};

/**
 * SWITCH chain (Pass 7, new) — RCB opens the ball through 6 → LCB → LB → LW.
 * Each hop mirrors the recycle pattern: receiver opens up toward the far
 * touchline while the opponent block reverse-shifts across the pitch.
 */

/** via-6: RCB → 6. 6 receives open, body already shaped toward LCB/LB. */
const SWITCH_6_US = {
  "us.GK": authoredAt(18, 52, "sweeper", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(40, 18, "width", orient(20, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(44, 34, "line", orient(20, "half-open", { type: "teammate", playerId: "us.L6" })),
  "us.RCV": authoredAt(48, 50, "after-pass", orient(30, "half-open", { type: "teammate", playerId: "us.L6" }, { nextActionIntent: "recycle" })),
  "us.L6": authoredAt(52, 42, "receive-open", orient(150, "half-open-left", { type: "scan", targets: ["us.LCV", "us.LB"] }, { receivingFoot: "left", nextActionIntent: "recycle", prePassScan: true })),
  "us.R6": authoredAt(60, 60, "balance", orient(0, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.10": authoredAt(64, 50, "hold", orient(10, "half-open", { type: "ball" })),
  "us.LW": authoredAt(68, 16, "width", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(72, 78, "width", orient(-30, "side-on", { type: "ball" })),
  "us.RB": authoredAt(64, 84, "widest-lane", orient(-20, "half-open", { type: "ball" })),
  "us.SP": authoredAt(76, 42, "high", orient(165, "back-to-goal", { type: "ball" })),
};

const SWITCH_6_OPP = {
  "opp.gk": authoredAt(94, 52, "gk"),
  "opp.lb": authoredAt(78, 28, "shift"),
  "opp.lcb": authoredAt(76, 44, "shift"),
  "opp.rcb": authoredAt(80, 60, "line"),
  "opp.rb": authoredAt(84, 78, "line"),
  "opp.lm": authoredAt(64, 24, "shift"),
  "opp.lcm": authoredAt(56, 36, "screen"),
  "opp.rcm": authoredAt(58, 56, "screen"),
  "opp.rm": authoredAt(68, 74, "mid"),
  "opp.lst": authoredAt(44, 30, "press"),
  "opp.rst": authoredAt(54, 56, "press"),
};

/** via-lcb: 6 → LCB. Ball keeps moving left; opponent block reacts one step further. */
const SWITCH_LCB_US = {
  "us.GK": authoredAt(16, 50, "sweeper", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(36, 18, "receive-shape", orient(160, "half-open-left", { type: "teammate", playerId: "us.LCV" })),
  "us.LCV": authoredAt(42, 32, "receive-open", orient(170, "half-open", { type: "scan", targets: ["us.LB"] }, { receivingFoot: "left", nextActionIntent: "recycle", prePassScan: true })),
  "us.RCV": authoredAt(46, 48, "after-pass", orient(20, "half-open", { type: "teammate", playerId: "us.LCV" })),
  "us.L6": authoredAt(50, 40, "after-lay", orient(10, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(56, 58, "balance", orient(0, "half-open", { type: "ball" })),
  "us.10": authoredAt(60, 50, "hold", orient(10, "half-open", { type: "ball" })),
  "us.LW": authoredAt(64, 18, "width", orient(10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(68, 76, "width", orient(-25, "side-on", { type: "ball" })),
  "us.RB": authoredAt(60, 82, "widest-lane", orient(-20, "half-open", { type: "ball" })),
  "us.SP": authoredAt(72, 40, "high", orient(165, "back-to-goal", { type: "ball" })),
};

const SWITCH_LCB_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(76, 24, "shift"),
  "opp.lcb": authoredAt(74, 40, "shift"),
  "opp.rcb": authoredAt(78, 56, "line"),
  "opp.rb": authoredAt(82, 74, "line"),
  "opp.lm": authoredAt(60, 22, "shift"),
  "opp.lcm": authoredAt(54, 34, "screen"),
  "opp.rcm": authoredAt(54, 54, "screen"),
  "opp.rm": authoredAt(64, 70, "mid"),
  "opp.lst": authoredAt(40, 28, "press"),
  "opp.rst": authoredAt(52, 54, "press"),
};

/** via-lb: LCB → LB. Ball reaches the touchline flank; opponent keeps shifting left. */
const SWITCH_LB_US = {
  "us.GK": authoredAt(14, 48, "sweeper", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(34, 20, "receive-open", orient(35, "half-open", { type: "teammate", playerId: "us.LW" }, { receivingFoot: "either", nextActionIntent: "recycle", prePassScan: true })),
  "us.LCV": authoredAt(38, 34, "after-pass", orient(15, "half-open", { type: "teammate", playerId: "us.LB" })),
  "us.RCV": authoredAt(42, 50, "after-pass", orient(20, "half-open", { type: "teammate", playerId: "us.LB" })),
  "us.L6": authoredAt(46, 42, "balance", orient(10, "half-open", { type: "ball" })),
  "us.R6": authoredAt(52, 58, "balance", orient(0, "half-open", { type: "ball" })),
  "us.10": authoredAt(56, 50, "hold", orient(10, "half-open", { type: "ball" })),
  "us.LW": authoredAt(60, 20, "width", orient(-10, "side-on", { type: "ball" })),
  "us.RW": authoredAt(64, 74, "width", orient(-25, "side-on", { type: "ball" })),
  "us.RB": authoredAt(56, 80, "widest-lane", orient(-15, "half-open", { type: "ball" })),
  "us.SP": authoredAt(68, 38, "high", orient(160, "back-to-goal", { type: "ball" })),
};

const SWITCH_LB_OPP = {
  "opp.gk": authoredAt(94, 48, "gk"),
  "opp.lb": authoredAt(74, 20, "shift"),
  "opp.lcb": authoredAt(72, 36, "shift"),
  "opp.rcb": authoredAt(76, 52, "line"),
  "opp.rb": authoredAt(80, 70, "line"),
  "opp.lm": authoredAt(58, 20, "shift"),
  "opp.lcm": authoredAt(48, 36, "screen"),
  "opp.rcm": authoredAt(52, 52, "screen"),
  "opp.rm": authoredAt(62, 68, "mid"),
  "opp.lst": authoredAt(42, 32, "press"),
  "opp.rst": authoredAt(46, 48, "press"),
};

/**
 * via-lw: LB → LW. Switch complete — opponent fully reverse-shifted to the left,
 * mirroring the 3-2-5 that formed on the right (attackingBack now us.LB).
 */
const SWITCH_LW_US = {
  "us.GK": authoredAt(20, 48, "sweeper", orient(20, "open", { type: "ball" })),
  "us.RB": authoredAt(48, 80, "rest-far", orient(-30, "half-open", { type: "opponent", playerId: "opp.rst" }, { nextActionIntent: "cover" })),
  "us.RCV": authoredAt(50, 60, "rest-centre", orient(-20, "half-open", { type: "opponent", playerId: "opp.rcb" })),
  "us.LCV": authoredAt(54, 42, "rest-ballside", orient(-10, "half-open", { type: "opponent", playerId: "opp.lcb" }, { nextActionIntent: "recycle" })),
  "us.R6": authoredAt(64, 62, "six-balance", orient(30, "half-open-left", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.L6": authoredAt(68, 32, "eight-ballside", orient(-50, "half-open-left", { type: "teammate", playerId: "us.LW" }, { nextActionIntent: "recycle", receivingFoot: "left" })),
  "us.10": authoredAt(74, 52, "left-halfspace", orient(-40, "half-open", { type: "scan", targets: ["us.LW", "us.SP"] })),
  "us.RW": authoredAt(76, 88, "far-lane", orient(15, "side-on", { type: "ball" })),
  "us.LW": authoredAt(82, 14, "receive-width", orient(-135, "half-open-left", { type: "scan", targets: ["us.LB", "us.10", "us.SP"] }, { receivingFoot: "right", nextActionIntent: "recycle", prePassScan: true })),
  "us.LB": authoredAt(76, 6, "widest-lane", orient(20, "half-open", { type: "teammate", playerId: "us.LW" })),
  "us.SP": authoredAt(84, 48, "bind-cvs", orient(20, "back-to-goal", { type: "opponent", playerId: "opp.rcb" })),
};

/** Opp reverse-shifted fully to the left; opp.lb now presses LW tightly. */
const SWITCH_LW_OPP = {
  "opp.gk": authoredAt(94, 52, "gk"),
  "opp.lb": authoredAt(86, 16, "press-lw"),
  "opp.lcb": authoredAt(82, 34, "mark-st"),
  "opp.rcb": authoredAt(78, 50, "cover-behind-lb"),
  "opp.rb": authoredAt(80, 68, "recover"),
  "opp.lm": authoredAt(70, 22, "pinch"),
  "opp.lcm": authoredAt(62, 38, "screen-eight"),
  "opp.rcm": authoredAt(58, 54, "close-10"),
  "opp.rm": authoredAt(64, 72, "recover"),
  "opp.lst": authoredAt(50, 38, "screen-six"),
  "opp.rst": authoredAt(44, 54, "screen"),
};

/** 9A — explosief balverlies vanaf recycle-RCB: druk binnen 400ms. */
const LOSS_A_US = {
  "us.GK": authoredAt(17, 51, "depth", orient(5, "open", { type: "ball" })),
  "us.LB": authoredAt(40, 18, "pinch", orient(20, "half-open", { type: "zone", zoneId: "far-channel" })),
  "us.LCV": authoredAt(43, 36, "step", orient(10, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(48, 55, "behind-press", orient(-5, "half-open", { type: "ball" })),
  "us.RB": authoredAt(60, 85, "brake-recover", orient(-25, "half-open", { type: "ball" })),
  "us.L6": authoredAt(54, 38, "protect-centre", orient(5, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(59, 58, "sprint-inside", orient(-15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.10": authoredAt(64, 49, "turn-press", orient(0, "half-open", { type: "ball" })),
  "us.LW": authoredAt(66, 15, "tuck-mid", orient(20, "side-on", { type: "ball" })),
  "us.RW": authoredAt(69, 79, "press-line", orient(-35, "half-open", { type: "ball" }, { nextActionIntent: "press" })),
  "us.SP": authoredAt(74, 43, "screen-backpass", orient(10, "half-open", { type: "ball" })),
};

const LOSS_A_OPP = {
  "opp.gk": authoredAt(94, 53, "gk"),
  "opp.lb": authoredAt(79, 28, "build"),
  "opp.lcb": authoredAt(78, 46, "build"),
  "opp.rcb": authoredAt(78, 64, "build"),
  "opp.rb": authoredAt(81, 82, "release"),
  "opp.lm": authoredAt(65, 25, "mid"),
  "opp.lcm": authoredAt(54, 43, "mid"),
  "opp.rcm": authoredAt(57, 61, "ball"),
  "opp.rm": authoredAt(67, 77, "support"),
  "opp.lst": authoredAt(47, 34, "run"),
  "opp.rst": authoredAt(58, 52, "run"),
};

/** 9B — vertragen: centrum sluiten, druk naar buiten, nog geen 4-4-2. */
const LOSS_B_US = {
  "us.GK": authoredAt(15, 50, "depth", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(36, 19, "hold", orient(15, "half-open", { type: "opponent", playerId: "opp.lm" })),
  "us.LCV": authoredAt(38, 37, "line", orient(8, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(42, 56, "support-press", orient(-8, "half-open", { type: "ball" })),
  "us.RB": authoredAt(51, 82, "recovering", orient(-25, "half-open", { type: "ball" })),
  "us.L6": authoredAt(50, 39, "centre", orient(5, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(53, 57, "inside-shield", orient(-15, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.10": authoredAt(60, 51, "press-funnel", orient(0, "half-open", { type: "ball" })),
  "us.LW": authoredAt(58, 17, "tuck-in", orient(20, "side-on", { type: "ball" })),
  "us.RW": authoredAt(60, 78, "dropping", orient(-30, "side-on", { type: "ball" })),
  "us.SP": authoredAt(68, 42, "hold-high", orient(5, "half-open", { type: "ball" })),
};

const LOSS_B_OPP = {
  "opp.gk": authoredAt(94, 52, "gk"),
  "opp.lb": authoredAt(78, 25, "build"),
  "opp.lcb": authoredAt(78, 44, "build"),
  "opp.rcb": authoredAt(78, 63, "build"),
  "opp.rb": authoredAt(79, 82, "build"),
  "opp.lm": authoredAt(62, 22, "mid"),
  "opp.lcm": authoredAt(53, 41, "mid"),
  "opp.rcm": authoredAt(56, 60, "ball"),
  "opp.rm": authoredAt(64, 78, "wide"),
  "opp.lst": authoredAt(53, 39, "press"),
  "opp.rst": authoredAt(63, 51, "press"),
};

/** 9C — herstel: tightened toward the LOSS_US canonical 4-4-2 so the morph reads cleanly. */
/** 9C — morph toward Gate A3 LOSS_US / LOSS_OPP. */
const LOSS_C_US = {
  "us.GK": authoredAt(13, 50, "depth", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(31, 22, "back-four", orient(12, "half-open", { type: "opponent", playerId: "opp.lm" })),
  "us.LCV": authoredAt(30, 38, "back-four", orient(6, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(30, 56, "back-four", orient(-6, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(32, 74, "back-four", orient(-12, "half-open", { type: "opponent", playerId: "opp.rm" })),
  "us.LW": authoredAt(42, 22, "mid-arrive", orient(15, "side-on", { type: "ball" })),
  "us.L6": authoredAt(42, 40, "mid-centre", orient(5, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(42, 56, "mid-centre", orient(-5, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.RW": authoredAt(42, 74, "mid-arrive", orient(-15, "side-on", { type: "ball" })),
  "us.SP": authoredAt(52, 38, "front", orient(5, "half-open", { type: "ball" })),
  "us.10": authoredAt(52, 54, "front-join", orient(-5, "half-open", { type: "ball" })),
};

const LOSS_C_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(78, 16, "build"),
  "opp.lcb": authoredAt(80, 38, "build"),
  "opp.rcb": authoredAt(80, 62, "build"),
  "opp.rb": authoredAt(78, 82, "build"),
  "opp.lcm": authoredAt(56, 38, "six"),
  "opp.rcm": authoredAt(58, 58, "eight-ball"),
  "opp.lm": authoredAt(64, 14, "lw"),
  "opp.lst": authoredAt(66, 48, "ten"),
  "opp.rm": authoredAt(64, 80, "rw"),
  "opp.rst": authoredAt(74, 50, "st"),
};

/**
 * Pass 8 Gate A3 — compact 4-4-2 (readable without labels):
 * width ~35–42m, length ~25–30m, line gaps ~8–11m (≤13m).
 * ST+10 same height; LW–6–8–RW one mid line; LB–LCB–RCB–RB one back line.
 * No marker overlap with opponent ball carrier.
 */
const LOSS_US = {
  "us.GK": authoredAt(12, 50, "depth", orient(0, "open", { type: "ball" })),
  "us.LB": authoredAt(29, 22, "back-four", orient(12, "half-open", { type: "opponent", playerId: "opp.lm" })),
  "us.LCV": authoredAt(28, 38, "back-four", orient(6, "half-open", { type: "opponent", playerId: "opp.lst" })),
  "us.RCV": authoredAt(28, 56, "back-four", orient(-6, "half-open", { type: "opponent", playerId: "opp.rst" })),
  "us.RB": authoredAt(29, 74, "back-four", orient(-12, "half-open", { type: "opponent", playerId: "opp.rm" })),
  "us.LW": authoredAt(40, 22, "mid-four", orient(15, "side-on", { type: "ball" })),
  "us.L6": authoredAt(40, 40, "mid-four", orient(8, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.R6": authoredAt(40, 56, "mid-four", orient(-8, "half-open", { type: "ball" }, { nextActionIntent: "cover" })),
  "us.RW": authoredAt(40, 74, "mid-four", orient(-15, "side-on", { type: "ball" })),
  "us.SP": authoredAt(52, 40, "front-two", orient(8, "half-open", { type: "ball" }, { nextActionIntent: "press" })),
  "us.10": authoredAt(52, 54, "front-two", orient(-8, "half-open", { type: "ball" }, { nextActionIntent: "press" })),
};

/**
 * Opponent 4-2-3-1 build-up (Gate A3): full width backs; double pivot 6/8;
 * LW/RW high and wide; 10 between lines; ST central high. RCM (8) on ball —
 * must not sit on our ST/10 markers.
 */
const LOSS_OPP = {
  "opp.gk": authoredAt(94, 50, "gk"),
  "opp.lb": authoredAt(78, 14, "build"),
  "opp.lcb": authoredAt(80, 36, "build"),
  "opp.rcb": authoredAt(80, 62, "build"),
  "opp.rb": authoredAt(78, 84, "build"),
  "opp.lcm": authoredAt(58, 38, "six"),
  "opp.rcm": authoredAt(60, 58, "eight-ball"),
  "opp.lm": authoredAt(66, 12, "lw"),
  "opp.lst": authoredAt(68, 48, "ten"),
  "opp.rm": authoredAt(66, 82, "rw"),
  "opp.rst": authoredAt(78, 50, "st"),
};

/** Authored recovery states for Pass 3+ (no single morph). */
export const CONNECTED_TEAM_RECOVERY = {
  "loss-a": {
    usShape: LOSS_A_US,
    opponentShape: LOSS_A_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 57, y: 61 },
  },
  "loss-b": {
    usShape: LOSS_B_US,
    opponentShape: LOSS_B_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 56, y: 60 },
  },
  "loss-c": {
    usShape: LOSS_C_US,
    opponentShape: LOSS_C_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 55, y: 59 },
  },
  "loss-d": {
    usShape: LOSS_US,
    opponentShape: LOSS_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 60, y: 58 },
  },
} as const;

/** Pass 6/7 recycle shapes (RW → 8 → RCB) — feeds into the switch chain below. */
export const CONNECTED_TEAM_RECYCLE = {
  "via-8": {
    usShape: RECYCLE_8_US,
    opponentShape: RECYCLE_8_OPP,
    ballHolder: "us.R6",
    ballAt: { x: 64, y: 60 },
  },
  "via-rcb": {
    usShape: RECYCLE_RCB_US,
    opponentShape: RECYCLE_RCB_OPP,
    ballHolder: "us.RCV",
    ballAt: { x: 50, y: 54 },
  },
} as const;

/**
 * Gate A — three perfect static canonical match shapes (spatial QA anchors).
 * A1: living 3-2-5 attack, clear ballside opponent 4-4-2 lines.
 * A2: switch-prep — RCB has just received/opens, right overloaded / left opening.
 * A3: compact 4-4-2 defensive shape vs opponent 4-2-3-1 build-up (RCM has ball).
 */
export const CONNECTED_TEAM_CANONICAL = {
  A1: {
    usShape: END_US,
    opponentShape: END_OPP,
    ballHolder: "us.RW",
    ballAt: { x: 77.5, y: 81 },
  },
  A2: {
    usShape: RECYCLE_RCB_US,
    opponentShape: RECYCLE_RCB_OPP,
    ballHolder: "us.RCV",
    ballAt: { x: 50, y: 54 },
  },
  A3: {
    usShape: LOSS_US,
    opponentShape: LOSS_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 60, y: 58 },
  },
} as const;

/**
 * Pass 7 (new) — full switch of play: RCB → 6 → LCB → LB → LW.
 * Continues directly from CONNECTED_TEAM_RECYCLE["via-rcb"].
 */
export const CONNECTED_TEAM_SWITCH = {
  "via-6": {
    usShape: SWITCH_6_US,
    opponentShape: SWITCH_6_OPP,
    ballHolder: "us.L6",
    ballAt: { x: 52, y: 42 },
  },
  "via-lcb": {
    usShape: SWITCH_LCB_US,
    opponentShape: SWITCH_LCB_OPP,
    ballHolder: "us.LCV",
    ballAt: { x: 42, y: 32 },
  },
  "via-lb": {
    usShape: SWITCH_LB_US,
    opponentShape: SWITCH_LB_OPP,
    ballHolder: "us.LB",
    ballAt: { x: 34, y: 20 },
  },
  "via-lw": {
    usShape: SWITCH_LW_US,
    opponentShape: SWITCH_LW_OPP,
    ballHolder: "us.LW",
    ballAt: { x: 82, y: 14 },
  },
} as const;

/** Pass-3 arrival shape for SP receive (used by film compile + QA). */
export const CONNECTED_TEAM_SP_ARRIVE = {
  usShape: SP_ARRIVE_US,
  opponentShape: SP_ARRIVE_OPP,
  ballHolder: "us.SP",
  ballAt: { x: 71, y: 44 },
} as const;

export const CONNECTED_TEAM_AUTHORED: AuthoredScenarioBrief = {
  id: "connected-team",
  lessonObjective:
    "Verbonden linies: 4-2-3-1 opbouw, levend 3-2-5 in de aanval en switch van spel (RCB-6-LCB-LB-LW), met herstel naar 4-4-2.",
  positioningMode: "authored",
  attackDirection: "left-to-right",
  us: {
    baseFormation: "4-2-3-1",
    attackingShape: "3-2-5 (RB schuift door tot in de aanvalslijn; LB/LCV/RCV + L6/R6 blijven)",
    attackingBackId: "us.RB",
    tuckingBackId: "us.LB",
    playerRoles: {
      "us.GK": "support",
      "us.LB": "tuck / far-channel / switch-target",
      "us.LCV": "back-three / lst",
      "us.RCV": "back-three / rst",
      "us.RB": "widest-lane / recycle",
      "us.L6": "balance / switch-relay",
      "us.R6": "ball / under / recycle",
      "us.10": "between-lines",
      "us.LW": "far-width / switch-receiver",
      "us.RW": "width / ball",
      "us.SP": "bind / depth",
    },
  },
  opponent: {
    defensiveModel: OPPONENT_MODEL_442_MID_ZONE.id,
    formation: OPPONENT_MODEL_442_MID_ZONE.formation,
    blockHeight: OPPONENT_MODEL_442_MID_ZONE.blockHeight,
    pressingTrigger: OPPONENT_MODEL_442_MID_ZONE.pressingTrigger,
    pressingDirection: OPPONENT_MODEL_442_MID_ZONE.pressingDirection,
    markingPrinciple: OPPONENT_MODEL_442_MID_ZONE.markingPrinciple,
    playerRoles: {
      "opp.lst": "transition",
      "opp.rst": "transition",
      "opp.rm": "transition-wide",
      "opp.lcm": "zone-step/cover",
      "opp.rcm": "zone-step/cover",
    },
  },
  transitionThreats: ["opp.lst", "opp.rst", "opp.rm"],
  defensiveTransitionShape: {
    usShape: LOSS_US,
    opponentShape: LOSS_OPP,
    ballHolder: "opp.rcm",
    ballAt: { x: 60, y: 58 },
  },
  phases: [
    {
      id: "start",
      ballHolder: "us.R6",
      ballAt: { x: 38, y: 58 },
      ballZone: "middle-third",
      coachingPoint: "Wij staan in 4-2-3-1 en houden het veld groot",
      usShape: START_US,
      opponentShape: START_OPP,
      attackStructure: "4-2-3-1",
      restDefense: "3+2",
      plannedPasses: [],
    },
    {
      id: "free-10",
      ballHolder: "us.R6",
      ballAt: { x: 42, y: 58 },
      ballZone: "middle-third",
      coachingPoint: "R6 scant — 10 ziet de vrije pocket",
      usShape: FREE_US,
      opponentShape: FREE_OPP,
      attackStructure: "4-2-3-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.R6", toId: "us.10", expectedStatus: "pressured", releaseTimeMs: 8200 },
      ],
    },
    {
      id: "recv-10",
      ballHolder: "us.10",
      ballAt: { x: 62, y: 32 },
      ballZone: "middle-third",
      coachingPoint: "10 stapt uit de dekkingsschaduw",
      usShape: RECV_US,
      opponentShape: RECV_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.10", toId: "us.SP", expectedStatus: "open", releaseTimeMs: 15200 },
      ],
    },
    {
      id: "pass-sp",
      ballHolder: "us.SP",
      ballAt: { x: 71, y: 44 },
      ballZone: "attacking-mid",
      coachingPoint: "SP bindt de verdediging en komt kort",
      usShape: SP_US,
      opponentShape: SP_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.SP", toId: "us.10", expectedStatus: "open", releaseTimeMs: 19350 },
      ],
    },
    {
      id: "lay-off",
      ballHolder: "us.10",
      ballAt: { x: 62, y: 48 },
      ballZone: "attacking-mid",
      coachingPoint: "De kaats maakt de derde man vrij",
      usShape: LAY_US,
      opponentShape: LAY_OPP,
      attackStructure: "3-2-4-1",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.10", toId: "us.RW", expectedStatus: "pressured", releaseTimeMs: 23350 },
      ],
    },
    {
      id: "to-rw",
      ballHolder: "us.RW",
      ballAt: { x: 78, y: 86 },
      ballZone: "right-flank",
      coachingPoint: "RW ontvangt — 3-2-5 sluit direct aan",
      usShape: RW_US,
      opponentShape: RW_OPP,
      attackStructure: "3-2-5",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.RW", toId: "us.R6", expectedStatus: "open", releaseTimeMs: 32200 },
      ],
    },
    {
      id: "end",
      ballHolder: "us.RW",
      ballAt: { x: 77, y: 81 },
      ballZone: "right-flank",
      coachingPoint: "Levend 3-2-5 rond RW — vooruit gesloten, switch via 6-LCB-LB-LW",
      usShape: END_US,
      opponentShape: END_OPP,
      attackStructure: "3-2-5",
      restDefense: "3+1",
      plannedPasses: [
        { fromId: "us.RW", toId: "us.R6", expectedStatus: "open", releaseTimeMs: 32200 },
        { fromId: "us.R6", toId: "us.RCV", expectedStatus: "open", releaseTimeMs: 34000 },
        { fromId: "us.RCV", toId: "us.L6", expectedStatus: "pressured", releaseTimeMs: 35800 },
        { fromId: "us.L6", toId: "us.LCV", expectedStatus: "open", releaseTimeMs: 37400 },
        { fromId: "us.LCV", toId: "us.LB", expectedStatus: "open", releaseTimeMs: 39000 },
        { fromId: "us.LB", toId: "us.LW", expectedStatus: "open", releaseTimeMs: 40600 },
      ],
    },
  ],
};
