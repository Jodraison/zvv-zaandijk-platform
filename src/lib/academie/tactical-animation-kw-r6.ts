/**
 * Kernwaarden — Game Model animation (authored only).
 * R6 → free 10 → options (shot blocked) → RW → lay → end 3-2-4-1.
 */

import {
  animStep,
  buildAnimation,
  moveGroup,
  movePlayer,
  movePlayerCurved,
  passBall,
  receiveBall,
  showPassingLane,
} from "@/lib/academie/tactical-animation-sequences";
import { KW_R6_AUTHORED } from "@/lib/academie/tactical-authored-kw-r6";
import { shapeToMoves } from "@/lib/academie/tactical-authored-types";

const P = KW_R6_AUTHORED.phases;
const start = P[0]!;
const free = P[1]!;
const recv = P[2]!;
const opt = P[3]!;
const toRw = P[4]!;
const lay = P[5]!;
const end = P[6]!;

const SHOT_CLOSED = { x: 90, y: 50 };

export const ANIM_KW_R6_BALL = buildAnimation(
  "anim.kw-r6-ball",
  "kw-r6-ball",
  [
    animStep(
      "situatie",
      0,
      3000,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.R6", "us.10"] },
        moveGroup([...shapeToMoves(start.usShape), ...shapeToMoves(start.opponentShape)]),
        { kind: "setZones", zones: [] },
        { kind: "hold" },
      ],
      "4-2-3-1 vs zone 4-2-3-1",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
        coverPlayerIds: ["us.LCV", "us.RCV"],
        depthThreatPlayerIds: ["opp.st"],
        lastLineHeight: 25,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "vrijmaken",
      3000,
      2800,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        moveGroup([...shapeToMoves(free.usShape), ...shapeToMoves(free.opponentShape)]),
        showPassingLane(free.ballAt, free.usShape["us.10"]!.at, "pass", true),
        { kind: "highlight", playerIds: ["us.R6", "us.10", "opp.rdm"] },
      ],
      "10 vrijmaken — lane open",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["opp.rdm"],
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 29,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "pass-10",
      5800,
      3600,
      "Schuif",
      [
        { kind: "phase", phase: "prepare" },
        movePlayerCurved("us.10", free.usShape["us.10"]!.at, recv.usShape["us.10"]!.at, {
          bulge: 3,
          side: "left",
        }),
        ...passBall(free.ballAt, recv.ballAt),
        moveGroup([...shapeToMoves(recv.usShape), ...shapeToMoves(recv.opponentShape)]),
        { kind: "highlight", playerIds: ["us.10", "opp.10"] },
      ],
      "Pass R6→10 — niet door blok",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "opp.10",
        coverPlayerIds: ["opp.rdm", "us.LCV"],
        balancePlayerIds: ["us.L6", "us.R6"],
        depthThreatPlayerIds: ["opp.st"],
        closedPassLanes: [{ fromId: "us.10", toId: "us.SP" }],
        lastLineHeight: 33,
        lastLineAction: "step",
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "opties",
      9400,
      3400,
      "Keuze",
      [
        { kind: "phase", phase: "prepare" },
        receiveBall("us.10"),
        { kind: "highlight", playerIds: ["us.10", "us.RW", "us.SP"] },
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: opt.ballAt, to: SHOT_CLOSED, dashed: true },
            { kind: "pass", from: opt.ballAt, to: opt.usShape["us.RW"]!.at },
          ],
        },
        moveGroup([...shapeToMoves(opt.usShape), ...shapeToMoves(opt.opponentShape)]),
      ],
      "Schot dicht — RW open",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
        coverPlayerIds: ["us.R6", "us.RCV"],
        depthThreatPlayerIds: ["us.SP", "opp.st"],
        lastLineHeight: 37,
        localNumbers: [{ zone: "right-flank", us: 2, opponent: 1 }],
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "pass-rw",
      12800,
      3800,
      "Actie",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.10", "us.RW", "us.RB", "opp.rb"] },
        movePlayerCurved("us.RW", opt.usShape["us.RW"]!.at, toRw.usShape["us.RW"]!.at, {
          bulge: 4,
          side: "right",
        }),
        ...passBall(opt.ballAt, toRw.ballAt),
        moveGroup([...shapeToMoves(toRw.usShape), ...shapeToMoves(toRw.opponentShape)]),
      ],
      "Pass breed onside — RB andere hoogte",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.R6", "us.RB", "opp.rcb"],
        balancePlayerIds: ["us.L6", "us.LB"],
        depthThreatPlayerIds: ["us.SP", "opp.st"],
        markedOpponentIds: ["opp.st"],
        lastLineHeight: 41,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "ontvangst-rw",
      16600,
      2800,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.RW"),
        { kind: "highlight", playerIds: ["us.RW", "us.10", "us.RB"] },
        showPassingLane(toRw.ballAt, toRw.usShape["us.10"]!.at, "pass", true),
        showPassingLane(toRw.ballAt, toRw.usShape["us.RB"]!.at, "pass", true),
        moveGroup([
          { id: "us.10", to: lay.usShape["us.10"]!.at },
          { id: "us.RB", to: toRw.usShape["us.RB"]!.at },
          { id: "opp.rb", to: toRw.opponentShape["opp.rb"]!.at },
        ]),
      ],
      "RW onside — recycle klaar",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.RB"],
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 41,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "terugleg",
      19400,
      3600,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall(toRw.ballAt, lay.ballAt),
        movePlayer("us.10", lay.ballAt),
        moveGroup([...shapeToMoves(lay.usShape), ...shapeToMoves(lay.opponentShape)]),
        showPassingLane(lay.ballAt, lay.usShape["us.SP"]!.at, "pass", true),
        showPassingLane(lay.ballAt, lay.usShape["us.RW"]!.at, "pass", true),
      ],
      "Terugleg — ruimte door shift",
      {
        ballZone: "final-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.R6", "us.RCV"],
        balancePlayerIds: ["us.L6", "us.LB"],
        depthThreatPlayerIds: ["us.SP", "opp.st"],
        lastLineHeight: 41,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "eind",
      23000,
      4200,
      "Gevolg",
      [
        { kind: "phase", phase: "result" },
        receiveBall("us.10"),
        { kind: "highlight", playerIds: ["us.10", "us.RW", "us.RB", "us.L6", "us.LB", "us.LCV", "us.RCV"] },
        moveGroup([...shapeToMoves(end.usShape), ...shapeToMoves(end.opponentShape)]),
        { kind: "setZones", zones: [] },
        { kind: "hold" },
      ],
      "3-2-4-1 — rest 3+1 — breedte",
      {
        ballZone: "final-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6", "us.LB"],
        coverPlayerIds: ["us.R6", "us.RCV"],
        depthThreatPlayerIds: ["opp.st"],
        lastLineHeight: 40,
        restDefenseStructure: "2+1",
        teamCompactness: { width: 70, length: 42 },
      },
    ),
  ],
  { complexity: "pattern", pauseAtEndMs: 2400, positioningMode: "authored" },
);
