/**
 * Tactical Animation System V3/V4 — football realism + offside + V4 teamblok validators (dev).
 */

import type { TacticalSituationDefinition, TacticalPoint } from "@/lib/academie/tactical-visual-system";
import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { validateAnimationV4 } from "@/lib/academie/tactical-animation-v4-validators";
import { validateCollectiveAnimation } from "@/lib/academie/tactical-collective-validate";

export type RealismIssue = {
  level: "error" | "warn";
  code: string;
  message: string;
  situationId?: string;
  timeMs?: number;
  playerId?: string;
};

const DIST_MIN = 3.5; // % field — roughly ~3–4m
const LINE_GAP_MAX = 22; // % vertical/horizontal between lines

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Attack left→right: offside if attacker is nearer goal (higher x) than ball AND than second-last defender. */
export function isOffsideAtPassMoment(opts: {
  attacker: TacticalPoint;
  ball: TacticalPoint;
  defenders: TacticalPoint[];
  attackDirection?: "left-to-right" | "right-to-left";
}): boolean {
  const dir = opts.attackDirection ?? "left-to-right";
  const attackingHalf = dir === "left-to-right" ? opts.attacker.x > 50 : opts.attacker.x < 50;
  if (!attackingHalf) return false;

  const nearerGoal = (a: TacticalPoint, b: TacticalPoint) =>
    dir === "left-to-right" ? a.x > b.x + 0.4 : a.x < b.x - 0.4;

  if (!nearerGoal(opts.attacker, opts.ball)) return false;

  if (opts.defenders.length < 2) return false;
  const sorted = [...opts.defenders].sort((a, b) => (dir === "left-to-right" ? b.x - a.x : a.x - b.x));
  const secondLast = sorted[1]!;
  return nearerGoal(opts.attacker, secondLast);
}

export function validateSituationFormation(sit: TacticalSituationDefinition): RealismIssue[] {
  const issues: RealismIssue[] = [];
  if (!sit.homeShape) {
    issues.push({
      level: "warn",
      code: "missing-home-shape",
      message: `Missing homeShape on ${sit.id}`,
      situationId: sit.id,
    });
  }
  if (!sit.opponentShape) {
    issues.push({
      level: "warn",
      code: "missing-opponent-shape",
      message: `Missing opponentShape on ${sit.id}`,
      situationId: sit.id,
    });
  }

  const us = sit.players.filter((p) => p.team === "us");
  const opp = sit.players.filter((p) => p.team === "opponent");
  if (opp.length < 4) {
    issues.push({
      level: "warn",
      code: "thin-opponent",
      message: `${sit.id}: only ${opp.length} opponents visible`,
      situationId: sit.id,
    });
  }

  for (let i = 0; i < sit.players.length; i++) {
    for (let j = i + 1; j < sit.players.length; j++) {
      const a = sit.players[i]!;
      const b = sit.players[j]!;
      if (a.team !== b.team) continue;
      if (dist(a.at, b.at) < DIST_MIN) {
        issues.push({
          level: "warn",
          code: "player-overlap",
          message: `${sit.id}: ${a.id} overlaps ${b.id}`,
          situationId: sit.id,
          playerId: a.id,
        });
      }
    }
  }

  const usXs = us.map((p) => p.at.x);
  if (usXs.length >= 2) {
    const span = Math.max(...usXs) - Math.min(...usXs);
    if (span > 85) {
      issues.push({
        level: "warn",
        code: "team-too-stretched",
        message: `${sit.id}: us x-span ${span.toFixed(0)}%`,
        situationId: sit.id,
      });
    }
  }

  void LINE_GAP_MAX;
  return issues;
}

export function validateAnimationOffside(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues: RealismIssue[] = [];
  const dir = sit.homeShape?.direction ?? "left-to-right";

  for (const step of anim.steps) {
    for (const action of step.actions) {
      if (action.kind !== "ballMove") continue;
      // Alleen voorwaartse passes in de aanvallende helft beoordelen.
      const forward =
        dir === "left-to-right"
          ? action.to.x > action.from.x + 1.5
          : action.to.x < action.from.x - 1.5;
      if (!forward) continue;
      const inAttackHalf =
        dir === "left-to-right" ? action.from.x >= 45 || action.to.x >= 55 : action.from.x <= 55;
      if (!inAttackHalf) continue;

      const passTime = step.startMs + Math.floor(step.durationMs * 0.05);
      const frame = evaluateTacticalAnimation(sit, anim, passTime);
      const defenders = Object.entries(frame.playerAt)
        .filter(([id]) => id.startsWith("opp."))
        .map(([, at]) => at);

      // Zonder herkenbare achterste linie: geen harde offside-error (wel warn).
      const depthLine =
        dir === "left-to-right"
          ? defenders.filter((d) => d.x >= 58)
          : defenders.filter((d) => d.x <= 42);
      if (depthLine.length < 2) {
        issues.push({
          level: "warn",
          code: "thin-defensive-line",
          message: `${sit.id}: <2 defenders on depth line at pass ${passTime}ms`,
          situationId: sit.id,
          timeMs: passTime,
        });
        continue;
      }

      for (const [id, at] of Object.entries(frame.playerAt)) {
        if (!id.startsWith("us.")) continue;
        if (!/SP|LW|RW/.test(id)) continue; // 10 mag tussen linies; focus op front three
        if (
          isOffsideAtPassMoment({
            attacker: at,
            ball: action.from,
            defenders,
            attackDirection: dir,
          })
        ) {
          issues.push({
            level: "error",
            code: "unintended-offside",
            message: `Possible unintended offside: sequence=${sit.id} player=${id} timeMs=${passTime}`,
            situationId: sit.id,
            timeMs: passTime,
            playerId: id,
          });
        }
      }
    }
  }
  return issues;
}

export function validateAnimationRealism(
  sit: TacticalSituationDefinition,
  anim: TacticalAnimationDefinition,
): RealismIssue[] {
  const issues = [
    ...validateSituationFormation(sit),
    ...validateAnimationOffside(sit, anim),
    ...validateAnimationV4(sit, anim),
    ...validateCollectiveAnimation(sit.id),
  ];

  if (anim.durationMs < 5000 && anim.complexity !== "micro") {
    issues.push({
      level: "warn",
      code: "short-situation",
      message: `${sit.id}: duration ${anim.durationMs}ms short for ${anim.complexity}`,
      situationId: sit.id,
    });
  }

  // V4 duration guidance for main situation animations
  if (
    (sit.id === "press-good" || sit.id === "connected-team") &&
    anim.durationMs < 18000
  ) {
    issues.push({
      level: "warn",
      code: "short-v4-main",
      message: `${sit.id}: duration ${anim.durationMs}ms below V4 main target 18–28s`,
      situationId: sit.id,
    });
  }
  if ((sit.id === "press-bad" || sit.id === "press-good") && sit.id === "press-bad" && anim.durationMs < 15000) {
    issues.push({
      level: "warn",
      code: "short-v4-goed-niet",
      message: `${sit.id}: duration ${anim.durationMs}ms below 15–22s band`,
      situationId: sit.id,
    });
  }

  const end = evaluateTacticalAnimation(sit, anim, anim.durationMs);
  if (!end.ball) {
    issues.push({
      level: "error",
      code: "no-end-ball",
      message: `${sit.id}: no ball at end`,
      situationId: sit.id,
    });
  }

  // Sample mid frames for collapse
  for (const t of [0.25, 0.5, 0.75].map((p) => Math.floor(anim.durationMs * p))) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const us = Object.entries(frame.playerAt).filter(([id]) => id.startsWith("us."));
    for (let i = 0; i < us.length; i++) {
      for (let j = i + 1; j < us.length; j++) {
        if (dist(us[i]![1], us[j]![1]) < 2.5) {
          issues.push({
            level: "warn",
            code: "mid-overlap",
            message: `${sit.id} @${t}ms: ${us[i]![0]} / ${us[j]![0]} too close`,
            situationId: sit.id,
            timeMs: t,
          });
        }
      }
    }
  }

  return issues;
}
