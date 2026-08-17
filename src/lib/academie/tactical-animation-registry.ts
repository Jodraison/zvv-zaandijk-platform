/**
 * Registry: situation-id → TacticalAnimationDefinition (Chapter 1).
 */

import { FORMATION_4231_US, FORMATION_KW_R6, PRESS_BALL } from "@/lib/academie/tactical-visual-system";
import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { resolveAnimationIntelligence } from "@/lib/academie/tactical-intelligence";
import { ANIM_KW_R6_BALL } from "@/lib/academie/tactical-animation-kw-r6";
import { ANIM_CONNECTED_TEAM } from "@/lib/academie/tactical-animation-connected-team";
import { ANIM_PRESS_BAD, ANIM_PRESS_GOOD } from "@/lib/academie/tactical-animation-press-v2";
import {
  ANIM_FDL_GS_INSIDE_CLOSE_BAD,
  ANIM_FDL_GS_INSIDE_CLOSE_GOOD,
  ANIM_FDL_GS_INSIDE_CLOSE_LIVE,
} from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";
import { getDedicatedFilmRegistry } from "@/lib/decision-lab/films/dedicated/build-dedicated-films";
import {
  ANIM_GR_10_LOSS,
  ANIM_IN_R6_WIN,
  ANIM_IN_REST,
  ANIM_KW_CHOICE_FORCE,
  ANIM_KW_CHOICE_RELOCATE,
  ANIM_ME_10_REFOCUS,
  ANIM_ME_SPITS,
  ANIM_TA_LCV,
  animStep,
  buildAnimation,
  buildLineFollowAnimation,
  V3M,
  V3S,
  highlightSpace,
  moveGroup,
  movePlayer,
  passBall,
  receiveBall,
  showPassingLane,
} from "@/lib/academie/tactical-animation-sequences";

const F = FORMATION_4231_US;
const K = FORMATION_KW_R6;

const registry: Record<string, TacticalAnimationDefinition> = {
  "kw-choice-force": ANIM_KW_CHOICE_FORCE,
  "kw-choice-relocate": ANIM_KW_CHOICE_RELOCATE,

  "kw-r6-ball": ANIM_KW_R6_BALL,

  "kw-moment-hold": buildLineFollowAnimation("kw-moment-hold", {
    ballFrom: { x: 24, y: 40 },
    ballTo: { x: 42, y: 66 },
    holderStart: "us.LCV",
    holderEnd: "us.R6",
    prepareMovers: [{ id: "opp.8", to: { x: 44, y: 42 } }],
    followMovers: [{ id: "us.L6", to: { x: 38, y: 44 } }],
    coverMovers: [{ id: "us.RCV", to: { x: 36, y: 56 } }],
    balanceMovers: [{ id: "us.LB", to: { x: 34, y: 28 } }],
    lastLineMovers: [{ id: "us.RB", to: { x: 36, y: 74 } }],
    opponentReact: [{ id: "opp.6", to: { x: 48, y: 50 } }],
    endZones: [{ x: 36, y: 58, w: 14, h: 14, label: "Vrij" }],
    complexity: "micro",
    teachingPoints: {
      situatie: "Bal bij LCV",
      herken: "Zie R6 vrij",
      speel: "Speel naar R6",
      reactie: "L6 schuift mee",
      gevolg: "Ruimte ontstaat",
    },
  }),

  "kw-moment-wing": buildLineFollowAnimation("kw-moment-wing", {
    ballFrom: { x: 70, y: 16 },
    ballTo: { x: 58, y: 32 },
    holderStart: "us.LW",
    holderEnd: "us.10",
    prepareMovers: [
      { id: "us.LW", to: { x: 82, y: 14 } },
      { id: "us.LB", to: { x: 74, y: 8 } },
    ],
    followMovers: [{ id: "us.RW", to: { x: 78, y: 70 } }],
    coverMovers: [{ id: "us.L6", to: { x: 44, y: 36 } }],
    balanceMovers: [{ id: "us.R6", to: { x: 38, y: 56 } }],
    lastLineMovers: [
      { id: "us.LCV", to: { x: 38, y: 36 } },
      { id: "us.RB", to: { x: 36, y: 74 } },
      { id: "us.GK", to: { x: 20, y: 48 } },
    ],
    opponentReact: [{ id: "opp.6", to: { x: 64, y: 28 } }],
    endZones: [{ x: 52, y: 28, w: 14, h: 14, label: "Steun" }],
    complexity: "micro",
    teachingPoints: {
      situatie: "Bal op links",
      herken: "Tien in het midden",
      speel: "Steun naar tien",
      reactie: "RW strekt",
      gevolg: "Steun is er",
    },
  }),

  "kw-moment-finish": buildLineFollowAnimation("kw-moment-finish", {
    ballFrom: { x: 68, y: 48 },
    ballTo: { x: 92, y: 48 },
    holderStart: "us.10",
    holderEnd: "us.10",
    passKind: "pass",
    movers: [{ id: "us.SP", to: { x: 88, y: 46 } }],
    followMovers: [{ id: "us.LW", to: { x: 76, y: 28 } }],
    coverMovers: [{ id: "us.R6", to: { x: 48, y: 56 } }],
    balanceMovers: [{ id: "us.L6", to: { x: 42, y: 40 } }],
    lastLineMovers: [
      { id: "us.LCV", to: { x: 40, y: 40 } },
      { id: "us.RCV", to: { x: 40, y: 58 } },
      { id: "us.GK", to: { x: 22, y: 50 } },
    ],
    opponentReact: [{ id: "opp.6", to: { x: 84, y: 46 } }],
    endZones: [{ x: 86, y: 40, w: 12, h: 16, label: "Afronden" }],
    complexity: "micro",
    teachingPoints: {
      situatie: "Bal bij tien",
      herken: "Spits diep",
      speel: "Laatste pass",
      reactie: "LW maakt ruimte",
      gevolg: "Afronden",
    },
  }),

  "connected-team": ANIM_CONNECTED_TEAM,
  "press-good": ANIM_PRESS_GOOD,
  "press-bad": ANIM_PRESS_BAD,
  "fdl-gs-inside-close-live": ANIM_FDL_GS_INSIDE_CLOSE_LIVE,
  "fdl-gs-inside-close-good": ANIM_FDL_GS_INSIDE_CLOSE_GOOD,
  "fdl-gs-inside-close-bad": ANIM_FDL_GS_INSIDE_CLOSE_BAD,

  "solo-solve": buildAnimation(
    "anim.solo-solve",
    "solo-solve",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.LW", "opp.7"] },
        { kind: "hold" },
      ], "Bal bij hun 7"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.LW"] },
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 52, y: 16 }, to: { x: 56, y: 14 }, dashed: true }],
        },
        { kind: "hold" },
      ], "LW start te vroeg"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        movePlayer("us.LW", { x: 58, y: 12 }, "easeOut"),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: { x: 52, y: 16 }, to: { x: 58, y: 12 } },
            { kind: "pass", from: { x: 56, y: 14 }, to: { x: 50, y: 38 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.LW"] },
      ], "LW alleen op bal"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        moveGroup([
          { id: "opp.7", to: { x: 62, y: 18 } },
          { id: "opp.8", to: { x: 54, y: 34 } },
        ]),
        ...passBall({ x: 56, y: 14 }, { x: 50, y: 38 }),
        receiveBall("opp.8"),
        ...highlightSpace([{ x: 44, y: 30, w: 18, h: 16, label: "Open 8" }], ["us.LW"]),
      ], "Passlijn open — geen steun"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        moveGroup([
          { id: "us.LB", to: { x: 24, y: 24 } },
          { id: "us.10", to: { x: 42, y: 54 } },
          { id: "us.L6", to: { x: 28, y: 44 } },
        ]),
        ...highlightSpace([{ x: 48, y: 10, w: 20, h: 20, label: "Isolatie" }], ["us.LW"]),
        { kind: "hold" },
      ], "Afstanden groter — aanval vast"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  "blind-run": buildAnimation(
    "anim.blind-run",
    "blind-run",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RW", "opp.lb"] },
        { kind: "hold" },
      ], "Bal bij hun LB"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RW"] },
        showPassingLane({ x: 78, y: 84 }, { x: 60, y: 58 }, "pass", true),
        { kind: "hold" },
      ], "Geen druktrigger"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        movePlayer("us.RW", { x: 78, y: 86 }, "easeOut"),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 70, y: 80 }, to: { x: 78, y: 86 } }],
        },
        { kind: "highlight", playerIds: ["us.RW"] },
      ], "Recht op de bal af"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        ...passBall({ x: 78, y: 84 }, { x: 60, y: 58 }),
        receiveBall("opp.8"),
        moveGroup([
          { id: "opp.lb", to: { x: 74, y: 78 } },
          { id: "opp.8", to: { x: 58, y: 54 } },
        ]),
        ...highlightSpace([{ x: 50, y: 66, w: 24, h: 20, label: "Open flank" }], ["us.RW"]),
      ], "Bal speelt eromheen"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        moveGroup([
          { id: "us.R6", to: { x: 36, y: 58 } },
          { id: "us.RB", to: { x: 20, y: 74 } },
          { id: "us.10", to: { x: 44, y: 50 } },
        ]),
        ...highlightSpace([{ x: 50, y: 66, w: 24, h: 20, label: "Gat achter druk" }], ["us.RW"]),
        { kind: "hold" },
      ], "Geen steun — ruimte achter"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  "always-forward": buildLineFollowAnimation("always-forward", {
    ballFrom: F.LCV,
    ballTo: F.SP,
    holderStart: "us.LCV",
    holderEnd: "opp.6",
    passKind: "fault",
    interceptProgress: 0.55,
    interceptHolder: "opp.6",
    movers: [{ id: "opp.6", to: { x: 48, y: 46 } }],
    followMovers: [{ id: "us.LCV", to: { x: F.LCV.x + 4, y: F.LCV.y } }],
    coverMovers: [{ id: "us.L6", to: { x: 40, y: 42 } }],
    balanceMovers: [{ id: "us.R6", to: { x: 36, y: 58 } }],
    lastLineMovers: [
      { id: "us.RCV", to: { x: 20, y: 56 } },
      { id: "us.LB", to: { x: 20, y: 24 } },
    ],
    opponentReact: [{ id: "opp.8", to: { x: 52, y: 44 } }],
    endZones: [{ x: 44, y: 40, w: 16, h: 16, label: "Onderschept" }],
    complexity: "situation",
    teachingPoints: {
      situatie: "LCV met bal",
      herken: "Spits diep",
      speel: "Direct vooruit",
      reactie: "Onderschepping",
      gevolg: "Bal kwijt",
    },
  }),

  /** Zelfde start als solo-solve — LW scant, steun eerst, dan gebogen druk. */
  "solo-support": buildAnimation(
    "anim.solo-support",
    "solo-support",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.LW", "opp.7"] },
        { kind: "hold" },
      ], "Bal bij hun 7"),
      animStep("trigger", V3S.herken, V3S.dHer, "TRIGGER", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.LW"] },
        {
          kind: "setLines",
          lines: [
            { kind: "pass", from: { x: 56, y: 14 }, to: { x: 50, y: 38 }, dashed: true },
            { kind: "press", from: { x: 52, y: 16 }, to: { x: 56, y: 14 }, dashed: true },
          ],
        },
        { kind: "hold" },
      ], "LW scant"),
      animStep("steun", V3S.speel, V3S.dSp, "Steun", [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["us.LW", "us.LB", "us.10"] },
        movePlayer("us.LW", { x: 52, y: 18 }),
        moveGroup([
          { id: "us.LB", to: { x: 42, y: 22 } },
          { id: "us.10", to: { x: 48, y: 36 } },
          { id: "us.L6", to: { x: 40, y: 40 } },
          { id: "us.R6", to: { x: 42, y: 56 } },
          { id: "us.SP", to: { x: 68, y: 48 } },
          { id: "us.RW", to: { x: 64, y: 78 } },
          { id: "us.RB", to: { x: 36, y: 74 } },
          { id: "us.LCV", to: { x: 36, y: 40 } },
          { id: "us.RCV", to: { x: 36, y: 58 } },
          { id: "us.GK", to: { x: 18, y: 50 } },
        ]),
      ], "LB en 10 schuiven", {
        ballZone: "left-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.R6"],
        coverPlayerIds: ["us.LCV"],
        depthThreatPlayerIds: ["opp.lst"],
        markedOpponentIds: ["opp.lst"],
        lastLineHeight: 36,
      }),
      animStep("druk", V3S.reactie, V3S.dRe, "Druk", [
        { kind: "phase", phase: "action" },
        movePlayer("us.LW", { x: 56, y: 18 }, "easeOut", [{ x: 50, y: 22 }]),
        movePlayer("us.L6", { x: 38, y: 36 }),
        moveGroup([
          { id: "opp.8", to: { x: 52, y: 36 } },
          { id: "opp.9", to: { x: 50, y: 54 } },
          { id: "us.LB", to: { x: 42, y: 20 } },
          { id: "us.10", to: { x: 50, y: 34 } },
          { id: "us.R6", to: { x: 38, y: 54 } },
          { id: "us.SP", to: { x: 70, y: 46 } },
        ]),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: { x: 56, y: 18 }, to: { x: 56, y: 14 } },
            { kind: "run", from: { x: 40, y: 18 }, to: { x: 48, y: 20 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.LW", "us.L6"] },
      ], "LW gebogen — L6 dekt"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        moveGroup([
          { id: "opp.7", to: { x: 62, y: 10 } },
          { id: "opp.8", to: { x: 54, y: 36 } },
          { id: "us.LB", to: { x: 44, y: 20 } },
          { id: "us.10", to: { x: 50, y: 34 } },
          { id: "us.L6", to: { x: 40, y: 34 } },
          { id: "us.R6", to: { x: 40, y: 52 } },
          { id: "us.RB", to: { x: 24, y: 74 } },
          { id: "us.LCV", to: { x: 22, y: 40 } },
          { id: "us.RCV", to: { x: 22, y: 58 } },
          { id: "us.SP", to: { x: 68, y: 48 } },
          { id: "us.RW", to: { x: 62, y: 76 } },
        ]),
        ...highlightSpace([{ x: 40, y: 14, w: 24, h: 28, label: "Compact" }], [
          "us.LW",
          "us.LB",
          "us.10",
          "us.L6",
        ]),
        { kind: "hold" },
      ], "Pass geforceerd — team verbonden"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  /** Zelfde start als blind-run — trigger, gebogen druk, rugdekking. */
  "blind-press": buildAnimation(
    "anim.blind-press",
    "blind-press",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RW", "opp.lb"] },
        { kind: "hold" },
      ], "Bal bij hun LB"),
      animStep("trigger", V3S.herken, V3S.dHer, "TRIGGER", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RW"] },
        showPassingLane({ x: 78, y: 84 }, { x: 60, y: 58 }, "pass", true),
        { kind: "hold" },
      ], "RW wacht trigger"),
      animStep("druk", V3S.speel, V3S.dSp, "Druk", [
        { kind: "phase", phase: "action" },
        movePlayer("us.RW", { x: 76, y: 80 }, "easeOut", [{ x: 72, y: 72 }]),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 76, y: 80 }, to: { x: 78, y: 84 } }],
        },
        { kind: "highlight", playerIds: ["us.RW"] },
      ], "RW gebogen — sluit binnen"),
      animStep("dekking", V3S.reactie, V3S.dRe, "Dekking", [
        { kind: "phase", phase: "reaction" },
        moveGroup([
          { id: "us.R6", to: { x: 58, y: 68 } },
          { id: "us.RB", to: { x: 48, y: 82 } },
          { id: "us.RCV", to: { x: 24, y: 64 } },
          { id: "us.10", to: { x: 52, y: 56 } },
        ]),
        moveGroup([
          { id: "opp.lb", to: { x: 82, y: 88 } },
          { id: "opp.8", to: { x: 64, y: 60 } },
        ]),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: { x: 76, y: 80 }, to: { x: 78, y: 84 } },
            { kind: "run", from: { x: 58, y: 68 }, to: { x: 66, y: 72 }, dashed: true },
          ],
        },
      ], "R6 en RB stap — laatste lijn mee"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 54, y: 62, w: 28, h: 24, label: "Compact" }], [
          "us.RW",
          "us.R6",
          "us.RB",
        ]),
        { kind: "hold" },
      ], "Tegenstander geforceerd"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  /** Zelfde start als always-forward — eerst verplaatsen via R6, dan 10. */
  "forward-relocate": buildAnimation(
    "anim.forward-relocate",
    "forward-relocate",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.LCV"] },
        { kind: "hold" },
      ], "LCV met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.LCV", "us.R6"] },
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: F.LCV, to: F.SP, dashed: true },
            { kind: "pass", from: F.LCV, to: F.R6, dashed: true },
          ],
        },
        ...highlightSpace([{ x: 36, y: 36, w: 28, h: 28, label: "Gesloten" }], ["us.LCV"]),
      ], "Vooruitlijn dicht"),
      animStep("verplaats", V3S.speel, V3S.dSp, "Verplaats", [
        { kind: "phase", phase: "action" },
        ...passBall(F.LCV, F.R6),
        movePlayer("us.LCV", { x: F.LCV.x + 4, y: F.LCV.y }),
      ], "Pass naar R6"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.R6"),
        moveGroup([
          { id: "opp.6", to: { x: 62, y: 40 } },
          { id: "opp.10", to: { x: 48, y: 58 } },
          { id: "opp.9", to: { x: 34, y: 52 } },
        ]),
        moveGroup([
          { id: "us.10", to: { x: 48, y: 44 } },
          { id: "us.L6", to: { x: 40, y: 42 } },
        ]),
        showPassingLane({ x: F.R6.x + 4, y: F.R6.y }, { x: 48, y: 44 }, "pass", true),
      ], "Tegenstander schuift"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...passBall({ x: F.R6.x + 4, y: F.R6.y - 2 }, { x: 48, y: 44 }),
        receiveBall("us.10"),
        moveGroup([
          { id: "us.R6", to: { x: F.R6.x + 4, y: F.R6.y - 2 } },
          { id: "us.RB", to: { x: 22, y: 78 } },
          { id: "us.RCV", to: { x: 22, y: 60 } },
        ]),
        ...highlightSpace([{ x: 40, y: 40, w: 22, h: 18, label: "Verbonden" }], [
          "us.R6",
          "us.10",
          "us.LCV",
        ]),
        { kind: "hold" },
      ], "Tweede pass — team verbindt"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  "buildup-gk": buildLineFollowAnimation("buildup-gk", {
    ballFrom: F.GK,
    ballTo: F.LCV,
    holderStart: "us.GK",
    holderEnd: "us.LCV",
    prepareMovers: [
      { id: "us.LB", to: { x: 24, y: 16 } },
      { id: "us.L6", to: { x: 36, y: 40 } },
    ],
    followMovers: [
      { id: "us.RCV", to: { x: F.RCV.x + 4, y: F.RCV.y } },
      { id: "us.R6", to: { x: F.R6.x + 2, y: F.R6.y } },
    ],
    coverMovers: [{ id: "us.10", to: { x: 44, y: 46 } }],
    balanceMovers: [
      { id: "us.RB", to: { x: 22, y: 76 } },
      { id: "us.RW", to: { x: 64, y: 78 } },
    ],
    lastLineMovers: [{ id: "us.LB", to: { x: 26, y: 20 } }],
    opponentReact: [
      { id: "opp.9", to: { x: 38, y: 38 } },
      { id: "opp.11", to: { x: 42, y: 48 } },
    ],
    endZones: [{ x: 28, y: 34, w: 14, h: 14, label: "Veilig" }],
    complexity: "situation",
    teachingPoints: {
      situatie: "Keeper met bal",
      herken: "LCV vrij",
      speel: "Korte opbouw",
      reactie: "Lijn schuift",
      gevolg: "Veilig uit",
    },
  }),

  "ta-lcv-buildup": ANIM_TA_LCV,

  "ta-rb-alone": buildAnimation(
    "anim.ta-rb-alone",
    "ta-rb-alone",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RB"] },
        { kind: "hold" },
      ], "RB staat laag"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RB"] },
        ...highlightSpace([{ x: 34, y: 72, w: 16, h: 16, label: "Alleen" }], ["us.RB"]),
        movePlayer("opp.11", { x: 44, y: 78 }),
      ], "Geen steun"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        movePlayer("opp.11", { x: 46, y: 82 }, "easeOut"),
        {
          kind: "ballMove",
          from: { x: 42, y: 82 },
          to: { x: 78, y: 88 },
          interceptProgress: 0.35,
          easing: "easeOut",
        },
        { kind: "possession", holderId: null },
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 42, y: 82 }, to: { x: 78, y: 88 }, dashed: true }],
        },
      ], "Lange bal"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        receiveBall("opp.11"),
        movePlayer("us.RCV", { x: 26, y: 68 }),
        moveGroup([{ id: "opp.11", to: { x: 72, y: 80 } }]),
        moveGroup([
          { id: "us.R6", to: { x: 36, y: 68 } },
          { id: "us.L6", to: { x: 32, y: 48 } },
          { id: "us.RB", to: { x: 22, y: 78 } },
          { id: "us.LB", to: { x: 20, y: 28 } },
          { id: "us.LCV", to: { x: 22, y: 42 } },
        ]),
        { kind: "highlight", playerIds: ["opp.11"] },
      ], "Bal kwijt"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 34, y: 72, w: 16, h: 16, label: "Alleen" }], ["us.RB", "opp.11"]),
        { kind: "hold" },
      ], "RB geïsoleerd"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "ta-rb-support": buildAnimation(
    "anim.ta-rb-support",
    "ta-rb-support",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RB"] },
        { kind: "hold" },
      ], "RB met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        moveGroup([
          { id: "us.RCV", to: { x: 28, y: 72 } },
          { id: "us.RW", to: { x: 60, y: 76 } },
          { id: "us.R6", to: { x: 46, y: 64 } },
        ]),
        moveGroup([{ id: "opp.11", to: { x: 46, y: 80 } }]),
        { kind: "highlight", playerIds: ["us.RB", "us.RCV", "us.RW"] },
      ], "Steun komt"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 42, y: 82 }, { x: 28, y: 72 }),
        moveGroup([{ id: "opp.11", to: { x: 48, y: 80 } }]),
      ], "Pass naar RCV"),
      animStep("vervolg", V3S.reactie, V3S.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        receiveBall("us.RCV"),
        moveGroup([
          { id: "us.RB", to: { x: 38, y: 78 } },
          { id: "us.RW", to: { x: 64, y: 72 } },
        ]),
        moveGroup([
          { id: "us.L6", to: { x: 38, y: 48 } },
          { id: "us.LCV", to: { x: 24, y: 44 } },
          { id: "us.LB", to: { x: 22, y: 24 } },
          { id: "us.R6", to: { x: 48, y: 60 } },
        ]),
      ], "RB sluit aan"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 24, y: 64, w: 12, h: 12, label: "Veilig" },
            { x: 54, y: 70, w: 12, h: 12, label: "Vooruit" },
          ],
          ["us.RCV", "us.RB"],
        ),
        { kind: "hold" },
      ], "Steun werkt"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "ta-moment-scan": buildAnimation(
    "anim.ta-moment-scan",
    "ta-moment-scan",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.L6"] },
        { kind: "hold" },
      ], "L6 centraal"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        showPassingLane({ x: 24, y: 40 }, { x: 42, y: 42 }),
        moveGroup([{ id: "opp.8", to: { x: 44, y: 50 } }]),
        { kind: "highlight", playerIds: ["us.L6", "us.LCV"] },
      ], "LCV speelbaar"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 24, y: 40 }, { x: 42, y: 42 }),
        moveGroup([{ id: "opp.6", to: { x: 40, y: 44 } }]),
      ], "Pass ontvangen"),
      animStep("reactie", V3M.reactie, V3M.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.L6"),
        ...highlightSpace([{ x: 36, y: 28, w: 14, h: 14, label: "Scan" }], ["us.L6"]),
        movePlayer("us.10", { x: 52, y: 42 }),
        movePlayer("opp.10", { x: 60, y: 56 }),
        moveGroup([
          { id: "us.R6", to: { x: 38, y: 56 } },
          { id: "us.RCV", to: { x: 22, y: 58 } },
          { id: "us.RB", to: { x: 22, y: 76 } },
        ]),
      ], "Scan voor pass"),
      animStep("vervolg", V3M.vervolg, V3M.dVe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        ...passBall({ x: 42, y: 42 }, { x: 24, y: 40 }),
      ], "Terug naar LCV"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        receiveBall("us.LCV"),
        ...highlightSpace(
          [
            { x: 20, y: 48, w: 12, h: 12, label: "Terug" },
            { x: 50, y: 28, w: 12, h: 12, label: "Kaats" },
          ],
          ["us.LCV", "us.L6"],
        ),
        { kind: "hold" },
      ], "Keuze gemaakt"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "ta-moment-after-pass": buildAnimation(
    "anim.ta-moment-after-pass",
    "ta-moment-after-pass",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien met bal"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        showPassingLane({ x: 56, y: 48 }, { x: 74, y: 20 }),
        moveGroup([{ id: "opp.rb", to: { x: 68, y: 24 } }]),
        { kind: "highlight", playerIds: ["us.10", "us.LW"] },
      ], "LW diep"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 56, y: 48 }, { x: 74, y: 20 }),
        moveGroup([{ id: "opp.6", to: { x: 76, y: 22 } }]),
      ], "Pass naar LW"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        receiveBall("us.LW"),
        moveGroup([
          { id: "us.10", to: { x: 66, y: 38 } },
          { id: "us.L6", to: { x: 52, y: 40 } },
          { id: "us.R6", to: { x: 40, y: 56 } },
          { id: "us.LCV", to: { x: 26, y: 36 } },
          { id: "us.RB", to: { x: 22, y: 76 } },
        ]),
        {
          kind: "setLines",
          lines: [
            { kind: "run", from: { x: 56, y: 48 }, to: { x: 66, y: 38 } },
            { kind: "pass", from: { x: 74, y: 20 }, to: { x: 66, y: 38 }, dashed: true },
          ],
        },
      ], "Tien sluit aan"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 60, y: 32, w: 12, h: 12, label: "Kaats" }], ["us.10", "us.LW"]),
        { kind: "hold" },
      ], "Kaats beschikbaar"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "ta-moment-press": buildAnimation(
    "anim.ta-moment-press",
    "ta-moment-press",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.SP"] },
        { kind: "hold" },
      ], "Spits vooraan"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.SP", "us.10"] },
        showPassingLane({ x: 78, y: 42 }, PRESS_BALL, "press", true),
        moveGroup([
          { id: "opp.cb", to: { x: 82, y: 46 } },
          { id: "opp.6", to: { x: 70, y: 50 } },
        ]),
      ], "Trigger zichtbaar"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        moveGroup([
          { id: "us.SP", to: { x: 80, y: 40 } },
          { id: "us.10", to: { x: 68, y: 50 } },
          { id: "us.LW", to: { x: 74, y: 34 } },
          { id: "us.RW", to: { x: 74, y: 58 } },
        ]),
      ], "Press start"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.L6", to: { x: 56, y: 42 } },
          { id: "us.R6", to: { x: 56, y: 56 } },
          { id: "us.LCV", to: { x: 36, y: 40 } },
          { id: "us.RCV", to: { x: 36, y: 58 } },
          { id: "us.LB", to: { x: 38, y: 26 } },
          { id: "us.RB", to: { x: 38, y: 74 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 78, y: 40 }, to: PRESS_BALL }],
        },
      ], "Lijn sluit"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 66, y: 44, w: 14, h: 14, label: "Gesloten" },
            { x: 52, y: 30, w: 22, h: 36, label: "Klein" },
          ],
          ["us.SP", "us.10", "us.L6"],
        ),
        { kind: "hold" },
      ], "Blok compact"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-10-loss": ANIM_GR_10_LOSS,

  "gr-l6-freeze": buildAnimation(
    "anim.gr-l6-freeze",
    "gr-l6-freeze",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.L6"] },
        { kind: "hold" },
      ], "L6 met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.L6", "us.10"] },
        showPassingLane(F.L6, { x: 58, y: 40 }, "fault", true),
        moveGroup([{ id: "opp.8", to: { x: 54, y: 44 } }]),
      ], "Passlijn dicht"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 44, y: 42 }, { x: 58, y: 40 }, { kind: "fault" }),
        moveGroup([
          { id: "opp.8", to: { x: 56, y: 42 } },
          { id: "opp.9", to: { x: 52, y: 46 } },
        ]),
      ], "Bal kwijt"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        receiveBall("opp.8"),
        movePlayer("opp.8", { x: 70, y: 42 }),
        moveGroup([
          { id: "us.R6", to: { x: 36, y: 58 } },
          { id: "us.LCV", to: { x: 20, y: 40 } },
          { id: "us.RB", to: { x: 20, y: 76 } },
        ]),
        { kind: "highlight", playerIds: ["us.L6", "us.10"] },
      ], "L6 bevriest"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 38, y: 34, w: 14, h: 14, label: "Stil" }], ["us.L6", "us.10"]),
        { kind: "hold" },
      ], "Team staat stil"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "gr-l6-recover": buildAnimation(
    "anim.gr-l6-recover",
    "gr-l6-recover",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.L6"] },
        { kind: "hold" },
      ], "L6 centraal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.L6", "us.10"] },
        moveGroup([
          { id: "opp.9", to: { x: 54, y: 44 } },
          { id: "opp.10", to: { x: 50, y: 48 } },
        ]),
      ], "Druk op komst"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 42, y: 42 }, { x: 58, y: 40 }, { kind: "fault" }),
        movePlayer("opp.8", { x: 58, y: 40 }, "easeOut"),
      ], "Bal verloren"),
      animStep("vervolg", V3S.reactie, V3S.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        receiveBall("opp.8"),
        moveGroup([
          { id: "us.L6", to: { x: 50, y: 40 } },
          { id: "us.10", to: { x: 52, y: 46 } },
          { id: "us.LCV", to: { x: 28, y: 38 } },
          { id: "us.RCV", to: { x: 28, y: 56 } },
          { id: "us.R6", to: { x: 42, y: 54 } },
          { id: "us.LB", to: { x: 24, y: 28 } },
          { id: "us.RB", to: { x: 24, y: 72 } },
        ]),
      ], "Direct herstel"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 44, y: 32, w: 12, h: 12, label: "Herstel" },
            { x: 50, y: 46, w: 12, h: 12, label: "Vertraag" },
          ],
          ["us.L6", "us.10"],
        ),
        { kind: "hold" },
      ], "Structuur terug"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "gr-moment-teammate": buildAnimation(
    "anim.gr-moment-teammate",
    "gr-moment-teammate",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RCV", "opp.9"] },
        { kind: "hold" },
      ], "Balverlies centraal"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RCV", "us.RB", "us.R6"] },
        showPassingLane({ x: 28, y: 58 }, { x: 48, y: 52 }, "fault", true),
        receiveBall("opp.9"),
      ], "RCV wijst — niemand beweegt"),
      animStep("freeze", V3M.speel, V3M.dSp, "FREEZE", [
        { kind: "phase", phase: "action" },
        { kind: "hold" },
        { kind: "highlight", playerIds: ["us.RB", "us.R6", "us.LCV"] },
      ], "Team blijft staan"),
      animStep("reactie", V3M.reactie, V3M.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        movePlayer("opp.9", { x: 58, y: 48 }, "easeOut"),
        movePlayer("opp.10", { x: 64, y: 42 }),
        ...passBall({ x: 48, y: 52 }, { x: 58, y: 44 }, { kind: "pass" }),
      ], "Tegenstander speelt door"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        receiveBall("opp.10"),
        ...highlightSpace(
          [
            { x: 36, y: 48, w: 14, h: 12, label: "Stil" },
            { x: 52, y: 40, w: 14, h: 14, label: "Vrij" },
          ],
          ["us.RB", "us.R6", "opp.10"],
        ),
        { kind: "hold" },
      ], "Gevaar groeit"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-moment-teammate-good": buildAnimation(
    "anim.gr-moment-teammate-good",
    "gr-moment-teammate-good",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RCV", "opp.9"] },
        { kind: "hold" },
      ], "Balverlies op 48,52"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RB", "us.R6", "us.LCV"] },
        showPassingLane({ x: 28, y: 58 }, { x: 48, y: 52 }, "fault", true),
        receiveBall("opp.9"),
      ], "Direct herkennen"),
      animStep("herstel", V3M.speel, V3M.dSp, "Herstel", [
        { kind: "phase", phase: "action" },
        moveGroup([
          { id: "us.RB", to: { x: 42, y: 64 } },
          { id: "us.R6", to: { x: 48, y: 54 } },
          { id: "us.LCV", to: { x: 32, y: 46 } },
        ]),
        {
          kind: "setLines",
          lines: [
            { kind: "run", from: { x: 34, y: 78 }, to: { x: 42, y: 64 } },
            { kind: "press", from: { x: 42, y: 62 }, to: { x: 48, y: 54 } },
            { kind: "run", from: { x: 24, y: 40 }, to: { x: 32, y: 46 }, dashed: true },
          ],
        },
      ], "RB / R6 / LCV sprinten"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        movePlayer("opp.9", { x: 52, y: 50 }),
        moveGroup([
          { id: "us.R6", to: { x: 50, y: 52 } },
          { id: "us.L6", to: { x: 40, y: 46 } },
          { id: "us.RB", to: { x: 44, y: 62 } },
        ]),
      ], "Vertragen en sluiten"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 36, y: 48, w: 14, h: 12, label: "Balverlies" },
            { x: 36, y: 68, w: 12, h: 12, label: "Herstel" },
          ],
          ["us.RB", "us.R6", "us.LCV"],
        ),
        { kind: "hold" },
      ], "Structuur terug"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-moment-sub": buildAnimation(
    "anim.gr-moment-sub",
    "gr-moment-sub",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RB"] },
        { kind: "hold" },
      ], "RB aan zijlijn"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RB", "us.in"] },
        ...highlightSpace([{ x: 2, y: 62, w: 12, h: 12, label: "IN" }], ["us.in"]),
      ], "Wissel klaar"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        movePlayer("us.RB", { x: 6, y: 94 }, "easeOut", [{ x: 14, y: 90 }]),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 22, y: 82 }, to: { x: 8, y: 92 }, dashed: true }],
        },
      ], "Boos weglopen"),
      animStep("reactie", V3M.reactie, V3M.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        movePlayer("us.in", { x: 18, y: 80 }),
        moveGroup([
          { id: "us.RCV", to: { x: 20, y: 62 } },
          { id: "us.R6", to: { x: 34, y: 66 } },
        ]),
        { kind: "highlight", playerIds: ["us.RB"] },
      ], "Geen info — gat blijft"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 2, y: 84, w: 14, h: 10, label: "Afhaken" },
            { x: 28, y: 72, w: 14, h: 12, label: "Gat" },
          ],
          ["us.RB"],
        ),
        { kind: "hold" },
      ], "Afgehakt"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-moment-sub-good": buildAnimation(
    "anim.gr-moment-sub-good",
    "gr-moment-sub-good",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RB"] },
        { kind: "hold" },
      ], "RB aan zijlijn"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RB", "us.in"] },
        ...highlightSpace([{ x: 2, y: 62, w: 12, h: 12, label: "Info" }], ["us.in"]),
      ], "Wissel klaar"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        movePlayer("us.RB", { x: 8, y: 88 }, "easeOut"),
        movePlayer("us.in", { x: 10, y: 76 }),
      ], "Naar IN toe"),
      animStep("reactie", V3M.reactie, V3M.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        movePlayer("us.in", { x: 20, y: 80 }),
        moveGroup([
          { id: "us.RCV", to: { x: 22, y: 64 } },
          { id: "us.R6", to: { x: 36, y: 60 } },
          { id: "us.L6", to: { x: 34, y: 42 } },
        ]),
        { kind: "highlight", playerIds: ["us.RB", "us.in"] },
      ], "Info + overdracht"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        movePlayer("us.RB", { x: 4, y: 86 }),
        ...highlightSpace(
          [
            { x: 2, y: 78, w: 14, h: 14, label: "Accepteer" },
            { x: 2, y: 62, w: 12, h: 12, label: "Info" },
            { x: 28, y: 72, w: 14, h: 12, label: "Steun" },
          ],
          ["us.in", "us.RB"],
        ),
        { kind: "hold" },
      ], "Blijft steunen"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-moment-disagree": buildAnimation(
    "anim.gr-moment-disagree",
    "gr-moment-disagree",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien gefrustreerd"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        movePlayer("us.10", { x: 46, y: 56 }, "easeInOut"),
        movePlayer("us.L6", { x: 42, y: 46 }),
        movePlayer("opp.10", { x: 60, y: 54 }),
        ...highlightSpace([{ x: 40, y: 52, w: 14, h: 12, label: "Discussie" }], ["us.10"]),
      ], "Spanning zichtbaar"),
      animStep("reactie", V3M.speel, V3M.dSp, "Reactie", [
        { kind: "phase", phase: "reaction" },
        { kind: "hold" },
        moveGroup([
          { id: "us.10", to: { x: 44, y: 58 } },
          { id: "us.L6", to: { x: 44, y: 48 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 54, y: 48 }, to: { x: 44, y: 58 }, dashed: true }],
        },
        { kind: "highlight", playerIds: ["us.10", "us.L6"] },
      ], "Blijven staan en discussiëren"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        movePlayer("opp.6", { x: 70, y: 48 }),
        movePlayer("opp.8", { x: 66, y: 34 }),
        movePlayer("opp.10", { x: 64, y: 56 }),
        moveGroup([
          { id: "us.SP", to: { x: 74, y: 48 } },
          { id: "us.LW", to: { x: 68, y: 22 } },
        ]),
      ], "Spel loopt door"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 40, y: 52, w: 14, h: 12, label: "Discussie" }], ["us.10", "us.L6"]),
        { kind: "hold" },
      ], "Focus kwijt"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "gr-moment-disagree-good": buildAnimation(
    "anim.gr-moment-disagree-good",
    "gr-moment-disagree-good",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien oneens"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        movePlayer("opp.6", { x: 64, y: 50 }),
        ...highlightSpace([{ x: 42, y: 58, w: 14, h: 12, label: "Later" }], ["us.10"]),
      ], "Oneensheid — taak eerst"),
      animStep("reactie", V3M.speel, V3M.dSp, "Reactie", [
        { kind: "phase", phase: "action" },
        movePlayer("us.10", { x: 62, y: 44 }, "easeOut"),
        moveGroup([
          { id: "us.L6", to: { x: 44, y: 42 } },
          { id: "us.R6", to: { x: 44, y: 56 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "run", from: { x: 54, y: 48 }, to: { x: 62, y: 44 } }],
        },
        { kind: "highlight", playerIds: ["us.10"] },
      ], "Tien gaat door"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        showPassingLane({ x: 62, y: 44 }, { x: 72, y: 48 }, "pass", true),
        moveGroup([
          { id: "us.SP", to: { x: 74, y: 48 } },
          { id: "us.LW", to: { x: 70, y: 28 } },
          { id: "us.LCV", to: { x: 22, y: 40 } },
          { id: "us.RCV", to: { x: 22, y: 60 } },
        ]),
      ], "Team blijft verbonden"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 56, y: 36, w: 14, h: 12, label: "Door" }], ["us.10"]),
        { kind: "hold" },
      ], "Taak uitgevoerd"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "in-r6-win": ANIM_IN_R6_WIN,

  "in-10-late": buildAnimation(
    "anim.in-10-late",
    "in-10-late",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.10"] },
        moveGroup([
          { id: "opp.6", to: { x: 62, y: 48 } },
          { id: "opp.8", to: { x: 64, y: 54 } },
        ]),
        ...highlightSpace([{ x: 52, y: 40, w: 14, h: 14, label: "Te lang" }], ["us.10"]),
      ], "Pass te traag"),
      animStep("keuze", V3S.speel, V3S.dSp, "Keuze", [
        { kind: "phase", phase: "prepare" },
        { kind: "hold" },
        movePlayer("us.RW", { x: F.RW.x + 2, y: F.RW.y - 2 }),
      ], "RW wacht"),
      animStep("speel", V3S.reactie, V3S.dRe, "Speel", [
        { kind: "phase", phase: "action" },
        {
          kind: "ballMove",
          from: { x: 58, y: 48 },
          to: { x: 74, y: 72 },
          interceptProgress: 0.45,
          easing: "easeOut",
        },
        { kind: "possession", holderId: null },
        moveGroup([
          { id: "opp.8", to: { x: 66, y: 58 } },
          { id: "opp.6", to: { x: 60, y: 52 } },
        ]),
        moveGroup([
          { id: "us.R6", to: { x: 40, y: 56 } },
          { id: "us.L6", to: { x: 38, y: 42 } },
          { id: "us.RCV", to: { x: 22, y: 60 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 58, y: 48 }, to: { x: 74, y: 72 }, dashed: true }],
        },
      ], "Pass te laat"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        receiveBall("opp.8"),
        ...highlightSpace([{ x: 68, y: 44, w: 16, h: 20, label: "Hersteld" }], ["opp.8"]),
        { kind: "hold" },
      ], "Zij herstellen"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "in-10-tempo": buildAnimation(
    "anim.in-10-tempo",
    "in-10-tempo",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.10", "us.RW", "us.SP"] },
        showPassingLane({ x: 58, y: 48 }, { x: 74, y: 72 }),
        movePlayer("us.RW", { x: F.RW.x + 2, y: F.RW.y - 4 }),
        moveGroup([{ id: "opp.cb", to: { x: 76, y: 50 } }]),
      ], "RW diep"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 58, y: 48 }, { x: 74, y: 72 }),
        moveGroup([
          { id: "us.RW", to: { x: 78, y: 72 } },
          { id: "us.SP", to: { x: 82, y: 48 } },
          { id: "us.LW", to: { x: 74, y: 26 } },
          { id: "opp.8", to: { x: 64, y: 54 } },
        ]),
      ], "Snelle pass"),
      animStep("vervolg", V3S.reactie, V3S.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        receiveBall("us.RW"),
        moveGroup([
          { id: "us.R6", to: { x: 52, y: 56 } },
          { id: "us.10", to: { x: 64, y: 52 } },
          { id: "us.L6", to: { x: 42, y: 44 } },
          { id: "us.RCV", to: { x: 26, y: 58 } },
          { id: "us.LB", to: { x: 22, y: 26 } },
        ]),
      ], "Team versnelt"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 70, y: 64, w: 12, h: 12, label: "Versnel" },
            { x: 46, y: 50, w: 12, h: 12, label: "Aansluiten" },
          ],
          ["us.RW", "us.10", "us.R6"],
        ),
        { kind: "hold" },
      ], "Tempo hoog"),
    ],
    { complexity: "situation", pauseAtEndMs: 2200 },
  ),

  "in-moment-turnover": buildLineFollowAnimation("in-moment-turnover", {
    ballFrom: { x: 48, y: 42 },
    ballTo: { x: 72, y: 22 },
    holderStart: "us.L6",
    holderEnd: "us.LW",
    prepareMovers: [{ id: "opp.lcm", to: { x: 66, y: 56 } }],
    movers: [
      { id: "us.LW", to: { x: 80, y: 22 } },
      { id: "us.10", to: { x: 58, y: 36 } },
    ],
    followMovers: [{ id: "us.SP", to: { x: 78, y: 44 } }],
    coverMovers: [{ id: "us.R6", to: { x: 42, y: 52 } }],
    balanceMovers: [{ id: "us.RB", to: { x: 24, y: 76 } }],
    lastLineMovers: [
      { id: "us.LCV", to: { x: 26, y: 40 } },
      { id: "us.RCV", to: { x: 26, y: 58 } },
    ],
    opponentReact: [{ id: "opp.7", to: { x: 74, y: 28 } }],
    endZones: [{ x: 68, y: 14, w: 14, h: 14, label: "Ruimte" }],
    complexity: "micro",
    teachingPoints: {
      situatie: "Bal verloren",
      herken: "LW vrij",
      speel: "Snelle omschakeling",
      reactie: "SP schuift",
      gevolg: "Ruimte achter",
    },
  }),

  "in-moment-press": buildAnimation(
    "anim.in-moment-press",
    "in-moment-press",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.SP"] },
        { kind: "hold" },
      ], "Spits vooraan"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.SP"] },
        ...highlightSpace([{ x: 78, y: 52, w: 12, h: 12, label: "Trigger" }], ["us.SP"]),
        moveGroup([{ id: "opp.6", to: { x: 84, y: 54 } }]),
      ], "Trigger zichtbaar"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        moveGroup([
          { id: "us.SP", to: { x: 82, y: 60 } },
          { id: "us.LW", to: { x: 84, y: 70 } },
          { id: "us.10", to: { x: 70, y: 52 } },
          { id: "us.L6", to: { x: 54, y: 46 } },
        ]),
      ], "Press start"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.R6", to: { x: 50, y: 54 } },
          { id: "us.RW", to: { x: 72, y: 68 } },
          { id: "us.LCV", to: { x: 34, y: 40 } },
          { id: "us.RCV", to: { x: 34, y: 58 } },
          { id: "us.LB", to: { x: 36, y: 26 } },
          { id: "us.RB", to: { x: 36, y: 74 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 80, y: 58 }, to: { x: 86, y: 56 } }],
        },
      ], "Lijn sluit"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 68, y: 36, w: 12, h: 12, label: "Sluit" }], ["us.SP", "us.LW"]),
        { kind: "hold" },
      ], "Blok dicht"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "in-moment-rest": ANIM_IN_REST,

  "me-spits-miss": ANIM_ME_SPITS,
  "me-10-refocus": ANIM_ME_10_REFOCUS,

  "me-10-hang": buildAnimation(
    "anim.me-10-hang",
    "me-10-hang",
    [
      animStep("situatie", V3S.situatie, V3S.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Tien met bal"),
      animStep("herken", V3S.herken, V3S.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.10"] },
        showPassingLane(F["10"], { x: 62, y: 46 }, "fault", true),
        moveGroup([{ id: "opp.8", to: { x: 58, y: 48 } }]),
      ], "Passlijn dicht"),
      animStep("speel", V3S.speel, V3S.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 54, y: 48 }, { x: 62, y: 46 }, { kind: "fault" }),
        moveGroup([
          { id: "opp.8", to: { x: 60, y: 46 } },
          { id: "opp.9", to: { x: 56, y: 50 } },
        ]),
      ], "Bal kwijt"),
      animStep("reactie", V3S.reactie, V3S.dRe, "Reactie", [
        { kind: "phase", phase: "reaction" },
        receiveBall("opp.8"),
        movePlayer("opp.8", { x: 72, y: 44 }),
        moveGroup([
          { id: "us.L6", to: { x: 40, y: 42 } },
          { id: "us.R6", to: { x: 40, y: 58 } },
          { id: "us.LCV", to: { x: 22, y: 40 } },
        ]),
        { kind: "highlight", playerIds: ["us.10"] },
      ], "Tien hangt"),
      animStep("gevolg", V3S.gevolg, V3S.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 48, y: 40, w: 12, h: 12, label: "Hangt" }], ["us.10"]),
        { kind: "hold" },
      ], "Geen reactie"),
    ],
    { complexity: "situation", pauseAtEndMs: 2000 },
  ),

  "me-moment-chance": buildAnimation(
    "anim.me-moment-chance",
    "me-moment-chance",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.SP"] },
        { kind: "hold" },
      ], "Kans gemist"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        ...highlightSpace([{ x: 86, y: 36, w: 10, h: 10, label: "Mis" }], ["us.SP"]),
        moveGroup([{ id: "opp.cb", to: { x: 84, y: 40 } }]),
      ], "Spits gefrustreerd"),
      animStep("reactie", V3M.speel, V3M.dSp, "Reactie", [
        { kind: "phase", phase: "reaction" },
        movePlayer("us.SP", { x: 80, y: 46 }),
        movePlayer("us.10", { x: 66, y: 50 }),
      ], "Team reageert"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.L6", to: { x: 48, y: 38 } },
          { id: "us.R6", to: { x: 48, y: 60 } },
          { id: "us.LCV", to: { x: 28, y: 40 } },
          { id: "us.RCV", to: { x: 28, y: 58 } },
          { id: "us.LB", to: { x: 26, y: 24 } },
          { id: "opp.lst", to: { x: 44, y: 36 } },
          { id: "opp.rst", to: { x: 44, y: 64 } },
        ]),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 78, y: 46 }, to: { x: 82, y: 44 } }],
        },
      ], "Direct druk"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 70, y: 40, w: 12, h: 12, label: "Druk" }], ["us.SP", "us.10"]),
        { kind: "hold" },
      ], "Mentaal herstel"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "me-moment-concede": buildAnimation(
    "anim.me-moment-concede",
    "me-moment-concede",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10"] },
        { kind: "hold" },
      ], "Goal tegen"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        moveGroup([
          { id: "us.10", to: { x: 52, y: 48 } },
          { id: "us.L6", to: { x: 40, y: 40 } },
          { id: "us.R6", to: { x: 40, y: 58 } },
        ]),
        { kind: "highlight", playerIds: ["us.10"] },
      ], "Team hergroepeert"),
      animStep("reactie", V3M.speel, V3M.dSp, "Reactie", [
        { kind: "phase", phase: "reaction" },
        moveGroup([
          { id: "us.LCV", to: { x: 22, y: 40 } },
          { id: "us.RCV", to: { x: 22, y: 60 } },
          { id: "us.LB", to: { x: 20, y: 24 } },
          { id: "us.RB", to: { x: 20, y: 76 } },
        ]),
        ...highlightSpace([{ x: 46, y: 40, w: 12, h: 12, label: "Blijf" }], ["us.10"]),
      ], "Even ademen"),
      animStep("speel", V3M.reactie, V3M.dRe, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 52, y: 48 }, { x: 64, y: 28 }),
        moveGroup([{ id: "opp.6", to: { x: 62, y: 30 } }]),
      ], "Opnieuw beginnen"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        receiveBall("us.LW"),
        ...highlightSpace([{ x: 46, y: 40, w: 12, h: 12, label: "Blijf" }], ["us.10", "us.LW"]),
        { kind: "hold" },
      ], "Focus terug"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),

  "me-moment-late": buildAnimation(
    "anim.me-moment-late",
    "me-moment-late",
    [
      animStep("situatie", V3M.situatie, V3M.dSit, "Situatie", [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.R6"] },
        { kind: "hold" },
      ], "Laat in wedstrijd"),
      animStep("herken", V3M.herken, V3M.dHer, "Herken", [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.R6", "us.10"] },
        ...highlightSpace([{ x: 42, y: 48, w: 12, h: 12, label: "Rust" }], ["us.R6"]),
        moveGroup([{ id: "opp.6", to: { x: 52, y: 50 } }]),
      ], "Tempo daalt"),
      animStep("speel", V3M.speel, V3M.dSp, "Speel", [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 48, y: 56 }, { x: 62, y: 48 }),
        moveGroup([
          { id: "us.RW", to: { x: 80, y: 68 } },
          { id: "us.SP", to: { x: 84, y: 44 } },
          { id: "opp.8", to: { x: 78, y: 46 } },
        ]),
      ], "Risico nemen"),
      animStep("vervolg", V3M.reactie, V3M.dRe, "Vervolg", [
        { kind: "phase", phase: "follow" },
        receiveBall("us.10"),
        moveGroup([
          { id: "us.L6", to: { x: 48, y: 46 } },
          { id: "us.RCV", to: { x: 32, y: 56 } },
          { id: "us.R6", to: { x: 44, y: 58 } },
          { id: "us.LCV", to: { x: 26, y: 42 } },
          { id: "us.LB", to: { x: 22, y: 26 } },
          { id: "us.RB", to: { x: 26, y: 74 } },
        ]),
      ], "Balans zoeken"),
      animStep("gevolg", V3M.gevolg, V3M.dGe, "Gevolg", [
        { kind: "phase", phase: "result" },
        ...highlightSpace(
          [
            { x: 68, y: 62, w: 12, h: 12, label: "Risico" },
            { x: 36, y: 36, w: 12, h: 12, label: "Balans" },
          ],
          ["us.R6", "us.10"],
        ),
        { kind: "hold" },
      ], "Keuze gemaakt"),
    ],
    { complexity: "micro", pauseAtEndMs: 2000 },
  ),
};

const resolvedCache = new Map<string, TacticalAnimationDefinition>();

export function getTacticalAnimation(situationId: string): TacticalAnimationDefinition | undefined {
  const raw = registry[situationId] ?? getDedicatedFilmRegistry().animations[situationId];
  if (!raw) return undefined;
  const cached = resolvedCache.get(situationId);
  if (cached) return cached;
  const sit = getTacticalSituation(situationId);
  if (!sit) return raw;
  try {
    const resolved = resolveAnimationIntelligence(sit, raw);
    resolvedCache.set(situationId, resolved);
    return resolved;
  } catch {
    return raw;
  }
}

export function listAnimatedSituationIds(): string[] {
  return [...Object.keys(registry), ...Object.keys(getDedicatedFilmRegistry().animations)];
}

/** Dev: clear intelligence cache after hot-reload edits. */
export function clearTacticalIntelligenceCache(): void {
  resolvedCache.clear();
}
