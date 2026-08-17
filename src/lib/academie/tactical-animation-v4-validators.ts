/**
 * Tactical Animation System V4 — development-only validators.
 * Collision · defensive spacing · pressing chain · local numbers · role integrity.
 *
 * Duelcontact (druk op balhouder) is toegestaan; echte pad-door-lichaam is niet.
 */

import type { TacticalSituationDefinition, TacticalPoint } from "@/lib/academie/tactical-visual-system";
import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { dist, samplePath } from "@/lib/academie/tactical-animation-collision";
import { lastLineHeight } from "@/lib/academie/tactical-animation-v4-state";
import type { RealismIssue } from "@/lib/academie/tactical-animation-realism";

/** Harde overlap — visueel door elkaar. */
const HARD_OVERLAP = 2.0;
/** Pad mag niet door centrum van tegenstander. */
const PATH_HIT = 1.8;

function usEntries(playerAt: Record<string, TacticalPoint>) {
  return Object.entries(playerAt).filter(([id]) => id.startsWith("us."));
}
function oppEntries(playerAt: Record<string, TacticalPoint>) {
  return Object.entries(playerAt).filter(([id]) => id.startsWith("opp."));
}

function midfieldXs(playerAt: Record<string, TacticalPoint>): number[] {
  return ["us.L6", "us.R6", "us.10"]
    .map((id) => playerAt[id]?.x)
    .filter((x): x is number => typeof x === "number");
}

function backXs(playerAt: Record<string, TacticalPoint>): number[] {
  return ["us.LB", "us.LCV", "us.RCV", "us.RB"]
    .map((id) => playerAt[id]?.x)
    .filter((x): x is number => typeof x === "number");
}

function isBallSideDuel(
  usId: string,
  oppId: string,
  ball: TacticalPoint | null,
  playerAt: Record<string, TacticalPoint>,
): boolean {
  if (!ball) return false;
  const up = playerAt[usId];
  const op = playerAt[oppId];
  if (!up || !op) return false;
  // Drukduel: beide dicht bij de bal
  return dist(up, ball) < 12 && dist(op, ball) < 10;
}

/** Speler loopt door tegenstander / harde overlap. */
export function validateAnimationCollision(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  const samples = [0.2, 0.4, 0.6, 0.8].map((p) => Math.floor(anim.durationMs * p));

  for (const t of samples) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const us = usEntries(frame.playerAt);
    const opp = oppEntries(frame.playerAt);

    for (const [uid, up] of us) {
      for (const [oid, op] of opp) {
        const d = dist(up, op);
        if (d >= HARD_OVERLAP) continue;
        if (isBallSideDuel(uid, oid, frame.ball, frame.playerAt)) continue;
        issues.push({
          level: "error",
          code: "collision-through-opponent",
          message: `${sit.id} @${t}ms: ${uid} through/on ${oid} (d=${d.toFixed(1)})`,
          situationId: sit.id,
          timeMs: t,
          playerId: uid,
        });
      }
    }

    for (let i = 0; i < us.length; i++) {
      for (let j = i + 1; j < us.length; j++) {
        if (dist(us[i]![1], us[j]![1]) < 1.6) {
          issues.push({
            level: "warn",
            code: "collision-same-team-overlap",
            message: `${sit.id} @${t}ms: ${us[i]![0]} overlaps ${us[j]![0]}`,
            situationId: sit.id,
            timeMs: t,
            playerId: us[i]![0],
          });
        }
      }
    }
  }

  // Path-level: alleen echte doorsteek door stilstaande opponent (niet duel / niet meebewegende opp)
  for (const step of anim.steps) {
    const startFrame = evaluateTacticalAnimation(sit, anim, step.startMs);
    const movingIds = new Set<string>();
    for (const action of step.actions) {
      if (action.kind === "playerMove") movingIds.add(action.playerId);
      if (action.kind === "groupMove") for (const m of action.moves) movingIds.add(m.playerId);
    }
    for (const action of step.actions) {
      if (action.kind !== "playerMove" && action.kind !== "groupMove") continue;
      const moves =
        action.kind === "playerMove"
          ? [{ playerId: action.playerId, to: action.to, via: action.via }]
          : action.moves.map((m) => ({ playerId: m.playerId, to: m.to, via: m.via }));
      for (const m of moves) {
        if (!m.playerId.startsWith("us.")) continue;
        const from = startFrame.playerAt[m.playerId];
        if (!from) continue;
        const path = samplePath(from, m.to, m.via, 12);
        const body = path.slice(1, Math.max(2, Math.floor(path.length * 0.8)));
        let hitCount = 0;
        let hitOpp = "";
        for (const [oid, op] of oppEntries(startFrame.playerAt)) {
          if (movingIds.has(oid)) continue; // tegenstander beweegt mee deze fase
          if (dist(m.to, op) < 6) continue;
          for (const p of body) {
            if (dist(p, op) < PATH_HIT) {
              hitCount++;
              hitOpp = oid;
            }
          }
        }
        // Meerdere samples door centrum = echte doorsteek
        if (hitCount >= 2) {
          issues.push({
            level: "error",
            code: "collision-path-through-opponent",
            message: `${sit.id} step=${step.id}: ${m.playerId} path through ${hitOpp}`,
            situationId: sit.id,
            timeMs: step.startMs,
            playerId: m.playerId,
          });
        }
      }
    }
  }

  return issues;
}

/** Te grote linieafstand / lijn te laag bij druk / dubbele 6. */
export function validateDefensiveSpacing(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  const samples = [0.45, 0.7].map((p) => Math.floor(anim.durationMs * p));

  for (const t of samples) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const mid = midfieldXs(frame.playerAt);
    const back = backXs(frame.playerAt);
    if (mid.length && back.length && sit.id === "press-good") {
      const midAvg = mid.reduce((a, b) => a + b, 0) / mid.length;
      const backAvg = back.reduce((a, b) => a + b, 0) / back.length;
      const gap = midAvg - backAvg;
      if (gap > 30) {
        issues.push({
          level: "error",
          code: "defensive-spacing-gap",
          message: `${sit.id} @${t}ms: mid–back gap ${gap.toFixed(0)}%`,
          situationId: sit.id,
          timeMs: t,
        });
      }
    }

    // Alleen hard op press-good: onnodige dubbele 6 op spits
    if (sit.id === "press-good") {
      const l6 = frame.playerAt["us.L6"];
      const r6 = frame.playerAt["us.R6"];
      const st = frame.playerAt["opp.st"];
      const intentional = frame.tacticalState?.intentionalDoubleMark;
      if (l6 && r6 && st && !intentional) {
        if (dist(l6, st) < 9 && dist(r6, st) < 9 && dist(l6, r6) < 14) {
          issues.push({
            level: "error",
            code: "double-mark-both-sixes",
            message: `${sit.id} @${t}ms: L6 and R6 both on same striker zone`,
            situationId: sit.id,
            timeMs: t,
          });
        }
      }
    }
  }

  if (sit.id === "press-good") {
    const late = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.72));
    const ll = lastLineHeight(late.playerAt);
    if (ll !== undefined && ll < 34) {
      issues.push({
        level: "error",
        code: "last-line-stays-low-under-press",
        message: `${sit.id}: last line x≈${ll.toFixed(0)} stays low under effective press`,
        situationId: sit.id,
        timeMs: Math.floor(anim.durationMs * 0.72),
      });
    }
  }

  return issues;
}

export function validatePressingChain(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  if (sit.id !== "press-good") return issues;

  const states = anim.steps
    .map((s) => s.tacticalState)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const hasPrimary = states.some((s) => s.primaryPressurePlayerId);
  const hasCover = states.some((s) => (s.coverPlayerIds?.length ?? 0) >= 1);
  const hasBalance = states.some((s) => (s.balancePlayerIds?.length ?? 0) >= 1);
  const stepsUp = states.some((s) => s.defensiveBlock === "high" || (s.lastLineHeight ?? 0) >= 36);

  if (!hasPrimary) {
    issues.push({
      level: "error",
      code: "press-chain-no-primary",
      message: `${sit.id}: missing primary pressure in tacticalState`,
      situationId: sit.id,
    });
  }
  if (!hasCover) {
    issues.push({
      level: "error",
      code: "press-chain-no-cover",
      message: `${sit.id}: first press without cover/rugdekking state`,
      situationId: sit.id,
    });
  }
  if (!hasBalance) {
    issues.push({
      level: "warn",
      code: "press-chain-no-balance",
      message: `${sit.id}: missing balance players in chain`,
      situationId: sit.id,
    });
  }
  if (!stepsUp) {
    issues.push({
      level: "error",
      code: "press-chain-no-line-step",
      message: `${sit.id}: last line never steps in pressing chain`,
      situationId: sit.id,
    });
  }

  // Flankfase: LB moet aangesloten zijn op LW
  const flankT = Math.floor(anim.durationMs * 0.5);
  const flank = evaluateTacticalAnimation(sit, anim, flankT);
  const lw = flank.playerAt["us.LW"];
  const lb = flank.playerAt["us.LB"];
  if (lw && lb && dist(lw, lb) > 38) {
    issues.push({
      level: "error",
      code: "press-chain-winger-no-back",
      message: `${sit.id}: LW press without LB connection (d=${dist(lw, lb).toFixed(0)})`,
      situationId: sit.id,
      timeMs: flankT,
    });
  }

  return issues;
}

export function validateLocalNumbers(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  if (sit.id !== "press-good") return issues;

  const t = Math.floor(anim.durationMs * 0.52);
  const frame = evaluateTacticalAnimation(sit, anim, t);
  const zone = { x: 68, y: 8, w: 28, h: 30 };
  const inZone = (p: TacticalPoint) =>
    p.x >= zone.x && p.x <= zone.x + zone.w && p.y >= zone.y && p.y <= zone.y + zone.h;

  const usN = usEntries(frame.playerAt).filter(([, p]) => inZone(p)).length;
  const oppN = oppEntries(frame.playerAt).filter(([, p]) => inZone(p)).length;
  const lw = frame.playerAt["us.LW"];
  const support = ["us.LB", "us.L6", "us.10"]
    .map((id) => frame.playerAt[id])
    .filter((p): p is TacticalPoint => Boolean(p) && Boolean(lw) && dist(p!, lw!) < 26);

  if (oppN >= usN + 1 && usN <= 1 && support.length === 0) {
    issues.push({
      level: "error",
      code: "local-numbers-1v2",
      message: `${sit.id} @${t}ms: zone=left-flank us=${usN} opponent=${oppN} supportDistance=tooLarge`,
      situationId: sit.id,
      timeMs: t,
    });
  }

  return issues;
}

export function validateRoleIntegrity(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  if (sit.id !== "press-good") return issues;

  const end = evaluateTacticalAnimation(sit, anim, anim.durationMs);
  const rw = end.playerAt["us.RW"];
  if (rw && rw.y < 45) {
    issues.push({
      level: "warn",
      code: "role-far-side-abandoned",
      message: `${sit.id}: RW abandoned far side (y=${rw.y.toFixed(0)})`,
      situationId: sit.id,
      playerId: "us.RW",
    });
  }

  for (const step of anim.steps) {
    const st = step.tacticalState;
    if (!st) continue;
    if (
      st.primaryPressurePlayerId &&
      !(st.coverPlayerIds?.length) &&
      (step.id.includes("druk") || step.id.includes("eerste"))
    ) {
      issues.push({
        level: "error",
        code: "role-pressure-without-cover",
        message: `${sit.id} step=${step.id}: pressure without cover ids`,
        situationId: sit.id,
      });
    }
  }

  return issues;
}

export function validateAnimationV4(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  return [
    ...validateAnimationCollision(sit, anim),
    ...validateDefensiveSpacing(sit, anim),
    ...validatePressingChain(sit, anim),
    ...validateLocalNumbers(sit, anim),
    ...validateRoleIntegrity(sit, anim),
  ];
}
