/**
 * Tactical Intelligence — collective shapes by ball zone + cluster resolver.
 * V2: delegates to Collective Organisation Engine for connected team blocks.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import {
  TACTICAL_DISTANCES,
  clampPitch,
  minDistanceForRoles,
} from "@/lib/academie/tactical-intelligence-roles";
import { avoidPlayerCollision, dist } from "@/lib/academie/tactical-animation-collision";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import type { TacticalSituationDefinition } from "@/lib/academie/tactical-visual-system";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  applyCollectiveShift,
  opponentCollectiveShape,
  usCollectiveShape,
} from "@/lib/academie/tactical-collective";
import { getCollectiveBrief } from "@/lib/academie/tactical-collective-briefs";

export type BallZoneId =
  | "own-third"
  | "middle"
  | "attacking-mid"
  | "final-third"
  | "left-flank"
  | "right-flank"
  | "central"
  | "transition";

export function ballZoneFromPoint(ball: TacticalPoint): BallZoneId {
  if (ball.x < 28) return "own-third";
  if (ball.x > 72) return "final-third";
  if (ball.y < 28) return "left-flank";
  if (ball.y > 72) return "right-flank";
  if (ball.x > 52) return "attacking-mid";
  if (Math.abs(ball.y - 50) < 16) return "central";
  return "middle";
}

/** Suggested us positions — collective connected block. */
export function usShapeForBall(ball: TacticalPoint): Record<string, TacticalPoint> {
  const zone = ballZoneFromPoint(ball);
  return usCollectiveShape({
    ball,
    phase: zone === "final-third" ? "final-third" : zone === "own-third" ? "build-up" : "progression",
    depthThreat: "limited",
    pressureOnBall: "controlled",
  });
}

/** Opponent block — collective shift toward ball. */
export function opponentShapeForBall(ball: TacticalPoint): Record<string, TacticalPoint> {
  const kw = opponentCollectiveShape({ ball, formation: "4-2-3-1", block: "mid", idStyle: "kw" });
  const press = opponentCollectiveShape({ ball, formation: "4-3-3", block: "low", idStyle: "press" });
  const box = opponentCollectiveShape({ ball, formation: "4-4-2", block: "mid", idStyle: "442" });
  // Merge id styles so enrich finds whatever the sequence uses
  return { ...box, ...press, ...kw };
}

const ROLE_PRIORITY: Record<string, number> = {
  "ball-carrier": 100,
  receiver: 95,
  "primary-pressure": 90,
  cover: 80,
  support: 75,
  "third-player": 70,
  screen: 65,
  mark: 60,
  balance: 50,
  "rest-defense": 45,
  width: 40,
  depth: 40,
  "far-side-balance": 35,
  decoy: 30,
  recovery: 55,
};

function collectTargetsFromActions(actions: TacticalAnimationAction[]): Map<string, TacticalPoint> {
  const map = new Map<string, TacticalPoint>();
  for (const a of actions) {
    if (a.kind === "playerMove") map.set(a.playerId, a.to);
    if (a.kind === "groupMove") {
      for (const m of a.moves) map.set(m.playerId, m.to);
    }
  }
  return map;
}

function rewriteTargets(
  actions: TacticalAnimationAction[],
  resolved: Map<string, TacticalPoint>,
): TacticalAnimationAction[] {
  return actions.map((a) => {
    if (a.kind === "playerMove" && resolved.has(a.playerId)) {
      return { ...a, to: resolved.get(a.playerId)! };
    }
    if (a.kind === "groupMove") {
      return {
        ...a,
        moves: a.moves.map((m) =>
          resolved.has(m.playerId) ? { ...m, to: resolved.get(m.playerId)! } : m,
        ),
      };
    }
    return a;
  });
}

/**
 * Resolve clusters by role priority — cover yields goal-side, balance away from ball.
 */
export function resolveClusterTargets(
  targets: Map<string, TacticalPoint>,
  roles: Map<string, string>,
  minDist = TACTICAL_DISTANCES.visualClear,
  ball?: TacticalPoint,
): Map<string, TacticalPoint> {
  const ids = [...targets.keys()];
  const out = new Map(targets);

  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        const roleA = roles.get(a) ?? "";
        const roleB = roles.get(b) ?? "";
        const need = Math.max(minDist, minDistanceForRoles(roleA, roleB));
        const pa = out.get(a)!;
        const pb = out.get(b)!;
        const d = dist(pa, pb);
        if (d >= need) continue;
        const priA = ROLE_PRIORITY[roleA] ?? 20;
        const priB = ROLE_PRIORITY[roleB] ?? 20;
        const yieldId = priA >= priB ? b : a;
        const keepId = priA >= priB ? a : b;
        const keep = out.get(keepId)!;
        let next = avoidPlayerCollision(out.get(yieldId)!, keep, need);
        const yieldRole = roles.get(yieldId) ?? "";
        // Tactical yield direction: cover/screen deeper (higher x), balance away from ball.
        if (ball && (yieldRole === "cover" || yieldRole === "screen")) {
          next = {
            x: Math.max(next.x, keep.x + need * 0.55),
            y: next.y + (next.y >= keep.y ? need * 0.25 : -need * 0.25),
          };
        } else if (ball && (yieldRole === "balance" || yieldRole === "far-side-balance")) {
          const awayY = next.y >= ball.y ? 1 : -1;
          next = { x: next.x - need * 0.2, y: next.y + awayY * need * 0.35 };
        }
        out.set(yieldId, clampPitch(next));
      }
    }
  }
  return out;
}

const ENRICH_SKIP_IDS = new Set([
  "press-bad",
  "solo-solve",
  "always-forward",
  "blind-run",
  "kw-choice-force", // negative: forceert centrale lijn — blok mag statisch blijven
]);

/** All sequences get collective enrich except intentional negative examples. */
function shouldEnrichCollective(situationId: string): boolean {
  return !ENRICH_SKIP_IDS.has(situationId);
}

const LAST_LINE_IDS = new Set([
  "us.LB",
  "us.LCV",
  "us.RCV",
  "us.RB",
  "us.GK",
  "us.L6",
]);

/**
 * Enrich step: collective shift for missing movers + stronger last-line connection.
 * Then resolve clusters on all targets.
 *
 * AUTHORTED MODE: positions are source of truth — no rewrite, no compress, no shape pull.
 */
export function enrichStepWithIntelligence(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
  step: TacticalAnimationStep,
  opts?: { allowShapeExtras?: boolean },
): TacticalAnimationStep {
  const mode = anim.positioningMode ?? "generated";
  if (mode === "authored") {
    // Report-only path: never mutate authored coordinates.
    return step;
  }

  const frame = evaluateTacticalAnimation(sit, anim, step.startMs);
  const ball = frame.ball ?? sit.ball ?? { x: 50, y: 50 };
  const zone = ballZoneFromPoint(ball);
  const brief = getCollectiveBrief(anim.situationId);
  const shift = applyCollectiveShift({
    fromBallZone: zone,
    toBallZone: zone,
    ball,
    usState: {
      formation: brief.ourFormation,
      phase: brief.possessionPhase,
      pressureOnBall: "controlled",
      depthThreat: (brief.transitionThreatPlayerIds.length >= 2 ? "limited" : "none") as
        | "limited"
        | "none",
      transitionThreatPlayerIds: brief.transitionThreatPlayerIds,
    },
    opponentState: {
      formation: brief.opponentFormation,
      blockHeight: brief.opponentBrief.block,
    },
    opponentIdStyle:
      anim.situationId.startsWith("press-") || anim.situationId === "blind-press"
        ? "press"
        : anim.situationId === "connected-team" || anim.situationId.startsWith("ta-")
          ? "442"
          : "kw",
  });
  const usShape = { ...usShapeForBall(ball), ...shift.usTargets };
  const oppShape = { ...opponentShapeForBall(ball), ...shift.opponentTargets };

  const existing = collectTargetsFromActions(step.actions);
  const roles = new Map<string, string>();

  const ts = step.tacticalState;
  if (ts?.primaryPressurePlayerId) roles.set(ts.primaryPressurePlayerId, "primary-pressure");
  for (const id of ts?.coverPlayerIds ?? []) roles.set(id, "cover");
  for (const id of ts?.balancePlayerIds ?? []) roles.set(id, "balance");
  if (frame.holderId) roles.set(frame.holderId, "ball-carrier");
  if (shift.usState.frontFootCbId) roles.set(shift.usState.frontFootCbId, "rest-defense");
  if (shift.usState.coverCbId) roles.set(shift.usState.coverCbId, "protect-depth");

  const extras: Array<{ playerId: string; to: TacticalPoint }> = [];
  const allowExtras =
    opts?.allowShapeExtras !== false &&
    mode === "generated" &&
    shouldEnrichCollective(anim.situationId);
  const isPressBad = anim.situationId === "press-bad";

  if (allowExtras && !isPressBad) {
    // Collective: consider full roster within wider radius + always last line
    const relevantIds = new Set(
      Object.keys(frame.playerAt).filter((id) => {
        const p = frame.playerAt[id];
        if (!p) return false;
        if (LAST_LINE_IDS.has(id) || id.startsWith("opp.")) return true;
        return dist(p, ball) <= TACTICAL_DISTANCES.relevantBallRadius + 12;
      }),
    );

    for (const id of relevantIds) {
      const current = existing.get(id) ?? frame.playerAt[id];
      if (!current) continue;
      const suggested = id.startsWith("us.") ? usShape[id] : oppShape[id];
      if (!suggested) continue;

      // Rewrite authored last-line / GK when disconnected (even if already moving)
      const isLastLine = LAST_LINE_IDS.has(id);
      if (existing.has(id) && isLastLine) {
        const tooDeep = suggested.x - current.x > 4;
        const gkLag =
          id === "us.GK" &&
          (suggested.x - current.x > 2 || Math.abs(suggested.y - current.y) > 4);
        if (tooDeep || gkLag) {
          const blend = {
            x: current.x + (suggested.x - current.x) * 0.9,
            y: current.y + (suggested.y - current.y) * 0.75,
          };
          existing.set(id, clampPitch(blend));
          roles.set(id, id === "us.GK" ? "rest-defense" : "rest-defense");
        }
        continue;
      }

      if (existing.has(id)) continue;
      if (dist(current, suggested) < 3.5) continue;
      // Never pull a marker onto the ball carrier / receiver cell
      if (frame.holderId && id !== frame.holderId && dist(suggested, ball) < TACTICAL_DISTANCES.visualClear) {
        continue;
      }
      // Stronger blend for last line / GK / rest — soft for distant attackers
      const blendFactor = isLastLine || id === "opp.gk" ? 0.85 : id.startsWith("opp.") ? 0.65 : 0.55;
      const blend = {
        x: current.x + (suggested.x - current.x) * blendFactor,
        y: current.y + (suggested.y - current.y) * blendFactor,
      };
      extras.push({ playerId: id, to: clampPitch(blend) });
      if (!roles.has(id)) {
        roles.set(
          id,
          isLastLine ? "rest-defense" : id.startsWith("us.") ? "support" : "mark",
        );
      }
    }
  }

  const allTargets = new Map(existing);
  for (const e of extras) {
    allTargets.set(e.playerId, e.to);
    if (!roles.has(e.playerId)) roles.set(e.playerId, "support");
  }
  for (const [id] of allTargets) {
    if (!roles.has(id)) roles.set(id, id.startsWith("us.") ? "support" : "cover");
  }

  // Seed non-movers so separation sees the full frame
  for (const [id, p] of Object.entries(frame.playerAt)) {
    if (!allTargets.has(id)) allTargets.set(id, p);
  }

  const resolved = resolveClusterTargets(
    allTargets,
    roles,
    TACTICAL_DISTANCES.visualClear,
    ball,
  );

  // Apply EVERY resolved shift — including seeded players that had to yield
  const rewriteMap = new Map<string, TacticalPoint>();
  const separationExtras: Array<{ playerId: string; to: TacticalPoint }> = [];
  for (const [id, p] of resolved) {
    const baseline = existing.get(id) ?? extras.find((e) => e.playerId === id)?.to ?? frame.playerAt[id];
    if (!baseline) continue;
    if (dist(baseline, p) < 0.35) {
      if (existing.has(id) || extras.some((e) => e.playerId === id)) rewriteMap.set(id, p);
      continue;
    }
    rewriteMap.set(id, p);
    if (!existing.has(id) && !extras.some((e) => e.playerId === id)) {
      separationExtras.push({ playerId: id, to: p });
    }
  }

  let actions = rewriteTargets(step.actions, rewriteMap);

  const allExtras = [...extras, ...separationExtras];
  if (allExtras.length) {
    const extraMoves = allExtras
      .filter((e) => rewriteMap.has(e.playerId))
      .map((e) => ({
        playerId: e.playerId,
        to: rewriteMap.get(e.playerId)!,
        easing: "easeInOut" as const,
      }));
    if (extraMoves.length) {
      actions = [...actions, { kind: "groupMove", moves: extraMoves }];
    }
  }

  // Final collective compress — ONLY for generated mode (never authored/assisted)
  if (allowExtras && !isPressBad && mode === "generated") {
    const preview = new Map(Object.entries(frame.playerAt));
    for (const [id, p] of rewriteMap) preview.set(id, p);
    for (const e of allExtras) {
      if (rewriteMap.has(e.playerId)) preview.set(e.playerId, rewriteMap.get(e.playerId)!);
    }
    const xs = [...preview.entries()]
      .filter(([id]) => id.startsWith("us.") && id !== "us.GK")
      .map(([, p]) => p.x);
    if (xs.length >= 4) {
      const length = Math.max(...xs) - Math.min(...xs);
      if (length > 46) {
        const raise = Math.min(16, length - 40);
        const compressMoves: Array<{ playerId: string; to: TacticalPoint; easing: "easeInOut" }> = [];
        for (const id of LAST_LINE_IDS) {
          const p = preview.get(id);
          if (!p) continue;
          const next = clampPitch({
            x: p.x + (id === "us.GK" ? raise * 0.75 : raise),
            y: id === "us.GK" ? 50 + (ball.y - 50) * 0.35 : p.y,
          });
          compressMoves.push({ playerId: id, to: next, easing: "easeInOut" });
          rewriteMap.set(id, next);
        }
        // Soft-drop highest attackers if still stretched
        for (const id of ["us.SP", "us.LW", "us.RW"] as const) {
          const p = preview.get(id);
          if (!p) continue;
          if (p.x - (preview.get("us.LCV")?.x ?? 30) > 42) {
            const next = clampPitch({ x: p.x - Math.min(8, raise * 0.4), y: p.y });
            compressMoves.push({ playerId: id, to: next, easing: "easeInOut" });
            rewriteMap.set(id, next);
          }
        }
        if (compressMoves.length) {
          actions = rewriteTargets(actions, rewriteMap);
          actions = [...actions, { kind: "groupMove", moves: compressMoves }];
        }
      }
    }
  }

  return { ...step, actions };
}

export function resolveAnimationIntelligence(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): TacticalAnimationDefinition {
  // Authored: pass through unchanged — engine only interpolates approved phase positions.
  if ((anim.positioningMode ?? "generated") === "authored") {
    return anim;
  }

  let working: TacticalAnimationDefinition = { ...anim, steps: [...anim.steps] };
  const newSteps: TacticalAnimationStep[] = [];

  for (let i = 0; i < anim.steps.length; i++) {
    const step = anim.steps[i]!;
    const enriched = enrichStepWithIntelligence(sit, working, step);
    newSteps.push(enriched);
    working = { ...working, steps: [...newSteps, ...anim.steps.slice(i + 1)] };
  }

  return { ...anim, steps: newSteps };
}
