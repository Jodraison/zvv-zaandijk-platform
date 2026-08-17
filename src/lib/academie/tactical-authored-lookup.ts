/**
 * Resolve authored phase / orientation for runtime rendering.
 */

import {
  CONNECTED_TEAM_AUTHORED,
  CONNECTED_TEAM_RECOVERY,
  CONNECTED_TEAM_RECYCLE,
  CONNECTED_TEAM_SWITCH,
} from "@/lib/academie/tactical-authored-connected-team";
import { KW_R6_AUTHORED } from "@/lib/academie/tactical-authored-kw-r6";
import type {
  AuthoredScenarioBrief,
  AuthoredScenarioPhase,
} from "@/lib/academie/tactical-authored-types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";

const BRIEFS: Record<string, AuthoredScenarioBrief> = {
  "connected-team": CONNECTED_TEAM_AUTHORED,
  "kw-r6-ball": KW_R6_AUTHORED,
};

/** Map animation step id → authored phase id. */
const STEP_TO_PHASE: Record<string, Record<string, string>> = {
  "connected-team": {
    situatie: "start",
    start: "start",
    scan: "free-10",
    "scan-a": "free-10",
    "scan-b": "free-10",
    "pass-10": "recv-10",
    "sp-comes": "pass-sp",
    "pass-sp": "pass-sp",
    kaats: "lay-off",
    "to-rw": "to-rw",
    end: "end",
    "end-clean": "end",
    "rw-join": "end",
    "opp-close": "end",
    "recycle-1": "end",
    "recycle-2": "end",
    "recycle-8": "recycle-8",
    "recycle-rcb": "recycle-rcb",
    "switch-6": "switch-6",
    "switch-lcb": "switch-lcb",
    "switch-lb": "switch-lb",
    "switch-lw": "switch-lw",
    balverlies: "loss",
    "loss-a": "loss",
    "loss-b": "loss",
    "loss-c": "loss",
    "loss-d": "loss",
  },
  "kw-r6-ball": {
    situatie: "start",
    vrijmaken: "free-10",
    "pass-10": "recv-10",
    opties: "options",
    "pass-rw": "to-rw",
    "ontvangst-rw": "to-rw",
    terugleg: "lay-off",
    eind: "end",
  },
};

export function getAuthoredBrief(situationId: string): AuthoredScenarioBrief | undefined {
  return BRIEFS[situationId];
}

export function getAuthoredPhase(
  situationId: string,
  activeStepId?: string | null,
): AuthoredScenarioPhase | undefined {
  const brief = BRIEFS[situationId];
  if (!brief) return undefined;
  if (!activeStepId) return brief.phases[0];
  if (brief.id === "connected-team") {
    if (activeStepId === "recycle-8" || activeStepId === "recycle-rcb") {
      const key = activeStepId === "recycle-8" ? "via-8" : "via-rcb";
      const state = CONNECTED_TEAM_RECYCLE[key];
      return {
        id: activeStepId,
        ballHolder: state.ballHolder,
        ballAt: state.ballAt,
        ballZone: key === "via-8" ? "right-flank" : "middle-third",
        coachingPoint: key === "via-8" ? "Recycle via 8" : "Recycle via RCB",
        usShape: state.usShape,
        opponentShape: state.opponentShape,
      };
    }
    if (
      activeStepId === "switch-6" ||
      activeStepId === "switch-lcb" ||
      activeStepId === "switch-lb" ||
      activeStepId === "switch-lw"
    ) {
      const key =
        activeStepId === "switch-6"
          ? "via-6"
          : activeStepId === "switch-lcb"
            ? "via-lcb"
            : activeStepId === "switch-lb"
              ? "via-lb"
              : "via-lw";
      const state = CONNECTED_TEAM_SWITCH[key];
      const coachingPoints: Record<typeof key, string> = {
        "via-6": "Kantwissel via 6",
        "via-lcb": "Kantwissel via LCB",
        "via-lb": "Kantwissel via LB",
        "via-lw": "Kantwissel compleet",
      };
      return {
        id: activeStepId,
        ballHolder: state.ballHolder,
        ballAt: state.ballAt,
        ballZone: key === "via-lw" ? "left-flank" : "middle-third",
        coachingPoint: coachingPoints[key],
        usShape: state.usShape,
        opponentShape: state.opponentShape,
      };
    }
    const recoveryKey =
      activeStepId === "balverlies"
        ? "loss-d"
        : activeStepId === "loss-a" ||
            activeStepId === "loss-b" ||
            activeStepId === "loss-c" ||
            activeStepId === "loss-d"
          ? activeStepId
          : null;
    if (recoveryKey) {
      const state = CONNECTED_TEAM_RECOVERY[recoveryKey];
      return {
        id: recoveryKey,
        ballHolder: state.ballHolder,
        ballAt: state.ballAt,
        ballZone: "middle-third",
        coachingPoint: "Balverlies",
        usShape: state.usShape,
        opponentShape: state.opponentShape,
      };
    }
  }
  if (activeStepId === "balverlies" && brief.defensiveTransitionShape) {
    return {
      id: "loss",
      ballHolder: brief.defensiveTransitionShape.ballHolder,
      ballAt: brief.defensiveTransitionShape.ballAt,
      ballZone: "middle-third",
      coachingPoint: "Balverlies",
      usShape: brief.defensiveTransitionShape.usShape,
      opponentShape: brief.defensiveTransitionShape.opponentShape,
    };
  }
  const phaseId = STEP_TO_PHASE[situationId]?.[activeStepId] ?? activeStepId;
  return brief.phases.find((p) => p.id === phaseId) ?? brief.phases[0];
}

export function getAuthoredOrientation(
  situationId: string,
  playerId: string,
  activeStepId?: string | null,
): PlayerOrientation | undefined {
  const phase = getAuthoredPhase(situationId, activeStepId);
  return phase?.usShape[playerId]?.orientation ?? phase?.opponentShape[playerId]?.orientation;
}

/** Pass release times from authored plannedPasses (for author jump / overlay). */
export function getAuthoredPassReleases(situationId: string): Array<{
  phaseId: string;
  fromId: string;
  toId: string;
  releaseTimeMs: number;
}> {
  const brief = BRIEFS[situationId];
  if (!brief) return [];
  const out: Array<{ phaseId: string; fromId: string; toId: string; releaseTimeMs: number }> = [];
  for (const phase of brief.phases) {
    for (const pass of phase.plannedPasses ?? []) {
      if (pass.releaseTimeMs == null) continue;
      if (pass.toId === "shot-closed") continue;
      out.push({
        phaseId: phase.id,
        fromId: pass.fromId,
        toId: pass.toId,
        releaseTimeMs: pass.releaseTimeMs,
      });
    }
  }
  return out;
}
