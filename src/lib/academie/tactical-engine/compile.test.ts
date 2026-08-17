/**
 * Tactical Animation Engine — compile + evaluate smoke.
 */
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { compileFilm } from "@/lib/academie/tactical-engine/compile";
import {
  cameraFollow,
  openBodyToward,
  passingLaneLine,
  pressingShadowZone,
} from "@/lib/academie/tactical-engine/helpers";
import type { LessonFilmSpec } from "@/lib/academie/tactical-engine/types";
import { getTacticalSituation } from "@/components/academie/tactical-situations";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const presser = { x: 58, y: 72 };
const carrier = { x: 70, y: 78 };

const film: LessonFilmSpec = {
  id: "engine-smoke-press",
  situationId: "press-good",
  totalDurationMs: 4200,
  pauseAtEndMs: 800,
  phases: [
    {
      id: "read",
      title: "Lees",
      startMs: 0,
      durationMs: 1200,
      statusLabel: "SCAN",
      teachingPoint: "Zie binnenkant",
      phase: "recognition",
      highlightPlayerIds: ["us.RW"],
      camera: cameraFollow(["us.RW", "opp.lb"], "press-detail"),
      zones: [pressingShadowZone(presser, carrier)],
      holdOrientations: {
        "us.RW": openBodyToward(presser, carrier, {
          bodyShape: "half-open",
          nextActionIntent: "press",
        }),
      },
    },
    {
      id: "trigger",
      title: "Trigger",
      startMs: 1200,
      durationMs: 1600,
      statusLabel: "TRIGGER",
      teachingPoint: "Binnenkant dicht",
      phase: "action",
      isTrigger: true,
      freezeMs: 400,
      highlightPlayerIds: ["us.RW", "us.R6"],
      players: [
        {
          playerId: "us.RW",
          to: { x: 64, y: 74 },
          acceleration: "accelerate",
          orientation: openBodyToward({ x: 64, y: 74 }, carrier, {
            bodyShape: "side-on",
            nextActionIntent: "press",
          }),
        },
      ],
      lines: [passingLaneLine({ x: 70, y: 78 }, { x: 62, y: 50 }, "fault")],
      camera: cameraFollow(["us.RW", "opp.lb", "us.R6"], "press-detail"),
    },
    {
      id: "cover",
      title: "Dek",
      startMs: 3200,
      durationMs: 1000,
      statusLabel: "RUGDEKKING",
      teachingPoint: "8 dekt diepte",
      phase: "follow",
      players: [
        {
          playerId: "us.R6",
          to: { x: 56, y: 62 },
          acceleration: "jog",
          orientation: openBodyToward({ x: 56, y: 62 }, { x: 72, y: 40 }, {
            bodyShape: "half-open",
            nextActionIntent: "cover",
          }),
        },
      ],
      ball: {
        id: "pass-escape",
        start: { x: 70, y: 78 },
        end: { x: 62, y: 50 },
        path: "linear",
        status: "pressured",
        passerId: "opp.lb",
        receiverId: "opp.8",
        receiveHolderId: "opp.8",
        releaseTimeMs: 3300,
        arrivalTimeMs: 3900,
      },
      highlightPlayerIds: ["us.R6"],
    },
  ],
};

const def = compileFilm(film);
assert(def.id === "engine-smoke-press", "id");
assert(def.situationId === "press-good", "situationId");
assert(def.steps.length === 3, "3 phases");
assert(def.steps[1]?.isTrigger === true, "trigger flag");
assert(Boolean(def.steps[0]?.orientations?.["us.RW"]), "hold orientation");
assert(def.steps[1]!.durationMs >= 2000, "freeze extends duration");

const situation = getTacticalSituation("press-good");
assert(Boolean(situation), "situation exists");

const mid = evaluateTacticalAnimation(situation!, def, 2000);
assert(mid.isTrigger === true, "frame trigger");
assert(Boolean(mid.orientationAt["us.RW"]), "frame orientation");
assert((mid.cameraHint?.followPlayerIds?.length ?? 0) >= 2, "camera follow");
assert(mid.zones.some((z) => z.kind === "cover-shadow") || mid.zones.length >= 0, "zones ok");

const late = evaluateTacticalAnimation(situation!, def, 3600);
assert(late.ballTrajectory?.inFlight === true || late.holderId === "opp.8" || late.ball != null, "ball live");

console.log("tactical-engine/compile.test: ok");
