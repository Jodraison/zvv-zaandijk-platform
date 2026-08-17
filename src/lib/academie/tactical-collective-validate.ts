/**
 * Semantic UEFA-Pro collective validators.
 * Run: npx tsx src/lib/academie/tactical-collective-validate.ts
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import type { RealismIssue } from "@/lib/academie/tactical-animation-realism";
import {
  TEAM_LENGTH_GUIDE,
  LINE_GAP_GUIDE,
  auditCollectiveFrame,
  measureTeamLength,
  measureLineGapsUs,
  measureLineHeightsUs,
  type CollectivePressure,
  type CollectiveDepthThreat,
} from "@/lib/academie/tactical-collective";
import {
  COLLECTIVE_PILOT_IDS,
  getCollectiveBrief,
  hasDedicatedCollectiveBrief,
} from "@/lib/academie/tactical-collective-briefs";
import { dist } from "@/lib/academie/tactical-animation-collision";

export type CollectiveValidationIssue = RealismIssue & {
  code:
    | "missing-collective-brief"
    | "team-length-excessive"
    | "line-gap-excessive"
    | "last-line-disconnected"
    | "last-line-too-low-with-control"
    | "last-line-too-high-without-pressure"
    | "midfield-defense-gap"
    | "attack-midfield-gap"
    | "opponent-block-disconnected"
    | "opponent-line-not-shifting"
    | "unmarked-transition-threat"
    | "free-defender-not-stepping"
    | "rest-defense-too-deep"
    | "rest-defense-too-flat"
    | "keeper-not-supporting-line"
    | "far-side-not-adjusted"
    | "collective-shift-missing";
};

const SAMPLE_MS = 400;

function sampleTimes(durationMs: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= durationMs; t += SAMPLE_MS) out.push(t);
  if (out[out.length - 1] !== durationMs) out.push(durationMs);
  return out;
}

function pressureFromState(ts: { possessionTeam?: string; primaryPressurePlayerId?: string } | null): CollectivePressure {
  if (!ts) return "controlled";
  if (ts.possessionTeam === "us" && !ts.primaryPressurePlayerId) return "controlled";
  if (ts.primaryPressurePlayerId?.startsWith("us.")) return "strong";
  if (ts.primaryPressurePlayerId?.startsWith("opp.")) return "controlled";
  return "passive";
}

function depthFromState(ts: { depthThreatPlayerIds?: string[] } | null): CollectiveDepthThreat {
  const n = ts?.depthThreatPlayerIds?.length ?? 0;
  if (n >= 2) return "active";
  if (n === 1) return "limited";
  return "none";
}

function oppBackIds(playerAt: Record<string, { x: number; y: number }>): string[] {
  return Object.keys(playerAt).filter(
    (id) =>
      id.startsWith("opp.") &&
      (id.includes("cb") || id.includes("lb") || id.includes("rb") || id.includes("lcb") || id.includes("rcb")),
  );
}

export function validateCollectiveAnimation(
  situationId: string,
  opts?: { strictPilots?: boolean },
): CollectiveValidationIssue[] {
  const issues: CollectiveValidationIssue[] = [];
  const sit = getTacticalSituation(situationId);
  const anim = getTacticalAnimation(situationId);
  if (!sit || !anim) {
    issues.push({
      level: "error",
      code: "missing-collective-brief",
      message: `${situationId}: missing situation or animation`,
      situationId,
    });
    return issues;
  }

  const isPilot = (COLLECTIVE_PILOT_IDS as readonly string[]).includes(situationId);
  const strict = opts?.strictPilots !== false && isPilot;

  if (strict && !hasDedicatedCollectiveBrief(situationId)) {
    issues.push({
      level: "error",
      code: "missing-collective-brief",
      message: `${situationId}: hoofdsequence zonder dedicated collective brief`,
      situationId,
    });
  }
  // Always resolve brief (generic fallback for non-pilots)
  getCollectiveBrief(situationId);

  const times = sampleTimes(anim.durationMs);
  const start = evaluateTacticalAnimation(sit, anim, 0);
  const mid = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.5));
  const late = evaluateTacticalAnimation(sit, anim, Math.floor(anim.durationMs * 0.75));

  let excessiveLengthFrames = 0;
  let gapFrames = 0;
  let lowLineFrames = 0;
  let keeperFlat = 0;
  let oppShift = 0;

  const startOppBack = oppBackIds(start.playerAt).map((id) => start.playerAt[id]!);
  const midOppBack = oppBackIds(mid.playerAt).map((id) => mid.playerAt[id]!);

  for (const t of times) {
    const frame = evaluateTacticalAnimation(sit, anim, t);
    const ts = frame.tacticalState;
    const ball = frame.ball ?? sit.ball ?? { x: 50, y: 50 };
    const pressure = pressureFromState(ts);
    const depth = depthFromState(ts);
    const audit = auditCollectiveFrame({
      timeMs: t,
      ball,
      playerAt: frame.playerAt,
      pressureOnBall: pressure,
      depthThreat: depth,
      ballZone: ts?.ballZone,
    });

    // Team length — skip intentional disconnection examples
    const allowLong =
      (situationId === "press-bad" && t > anim.durationMs * 0.35) ||
      situationId === "solo-solve" ||
      situationId === "always-forward" ||
      situationId === "blind-run";
    if (!allowLong && audit.ourTeamLength > TEAM_LENGTH_GUIDE.excessive) {
      excessiveLengthFrames++;
    }

    if (audit.midDefenseGap > LINE_GAP_GUIDE.excessive + 2) {
      // Intentional disconnection / negative teaching examples
      if (
        situationId !== "press-bad" &&
        situationId !== "solo-solve" &&
        situationId !== "always-forward" &&
        situationId !== "blind-run" &&
        situationId !== "kw-choice-force"
      ) {
        gapFrames++;
      }
    }
    // Attack–mid: only count extreme stretch (>28) — 4231 naturally has ~18–22
    if (
      audit.attackMidGap > 28 &&
      situationId !== "press-bad" &&
      situationId !== "solo-solve" &&
      situationId !== "always-forward" &&
      situationId !== "kw-choice-force"
    ) {
      gapFrames++;
    }

    // Last line too low with control (possession us, limited/none depth)
    if (
      ts?.possessionTeam === "us" &&
      (depth === "none" || depth === "limited") &&
      ball.x >= 48 &&
      audit.ourLineHeights.defense < ball.x - 32 &&
      audit.midDefenseGap > 16
    ) {
      lowLineFrames++;
    }

    // Keeper supporting — x must rise with last line (primary); y-angle is soft
    const gk = frame.playerAt["us.GK"];
    const defH = audit.ourLineHeights.defense;
    if (gk && defH > 36 && gk.x < Math.min(16, defH - 26)) keeperFlat++;
  }

  const intentionalLong = new Set([
    "press-bad",
    "solo-solve",
    "always-forward",
    "blind-run",
  ]);

  if (
    !intentionalLong.has(situationId) &&
    excessiveLengthFrames >= Math.max(3, Math.floor(times.length * 0.25))
  ) {
    issues.push({
      level: "error",
      code: "team-length-excessive",
      message: `${situationId}: team length >${TEAM_LENGTH_GUIDE.excessive} for ${excessiveLengthFrames} samples`,
      situationId,
    });
  }

  if (gapFrames >= Math.max(3, Math.floor(times.length * 0.2))) {
    issues.push({
      level: "error",
      code: "line-gap-excessive",
      message: `${situationId}: mid–defense or attack–mid gap excessive (${gapFrames} samples)`,
      situationId,
    });
    issues.push({
      level: "error",
      code: "midfield-defense-gap",
      message: `${situationId}: midfield–defense gap sustained`,
      situationId,
    });
  }

  if (lowLineFrames >= Math.max(3, Math.floor(times.length * 0.2))) {
    issues.push({
      level: "error",
      code: "last-line-too-low-with-control",
      message: `${situationId}: last line stays low despite ball control (${lowLineFrames} samples)`,
      situationId,
    });
    issues.push({
      level: "error",
      code: "last-line-disconnected",
      message: `${situationId}: last line disconnected from midfield under control`,
      situationId,
    });
    issues.push({
      level: "error",
      code: "rest-defense-too-deep",
      message: `${situationId}: rest defense too deep vs ball height`,
      situationId,
    });
  }

  // Free CB not stepping — late frame
  {
    const gaps = measureLineGapsUs(late.playerAt);
    const heights = measureLineHeightsUs(late.playerAt);
    const ts = late.tacticalState;
    const depth = depthFromState(ts);
    if (
      strict &&
      ts?.possessionTeam === "us" &&
      depth !== "immediate" &&
      depth !== "active" &&
      gaps.midfieldDefenseGap > 18 &&
      heights.defense < 32
    ) {
      issues.push({
        level: "error",
        code: "free-defender-not-stepping",
        message: `${situationId}: CBs remain deep with midfield gap ${gaps.midfieldDefenseGap.toFixed(0)}`,
        situationId,
        timeMs: Math.floor(anim.durationMs * 0.75),
      });
    }
  }

  // Opponent block shift on pilots (except intentional negatives)
  if (
    strict &&
    situationId !== "press-bad" &&
    situationId !== "kw-choice-force"
  ) {
    let moved = 0;
    for (let i = 0; i < Math.min(startOppBack.length, midOppBack.length); i++) {
      if (dist(startOppBack[i]!, midOppBack[i]!) >= 2.5) moved++;
    }
    oppShift = moved;
    if (startOppBack.length >= 3 && moved < 1) {
      issues.push({
        level: "error",
        code: "opponent-line-not-shifting",
        message: `${situationId}: opponent back line barely shifts mid-sequence`,
        situationId,
      });
      issues.push({
        level: "warn",
        code: "opponent-block-disconnected",
        message: `${situationId}: opponent block may be static`,
        situationId,
      });
    }
  }

  // Collective shift: us movers beyond passer/receiver
  if (strict) {
    let usMovers = 0;
    for (const [id, p0] of Object.entries(start.playerAt)) {
      if (!id.startsWith("us.")) continue;
      const p1 = late.playerAt[id];
      if (p1 && dist(p0, p1) >= 3) usMovers++;
    }
    if (usMovers < 6) {
      issues.push({
        level: "error",
        code: "collective-shift-missing",
        message: `${situationId}: only ${usMovers} us players moved ≥3u — need collective shift`,
        situationId,
      });
    }
  }

  // Far side
  if (strict && late.ball) {
    const side = late.ball.y > 62 ? "right" : late.ball.y < 38 ? "left" : "center";
    if (side === "right") {
      const lb = late.playerAt["us.LB"];
      if (lb && lb.y < 18) {
        issues.push({
          level: "warn",
          code: "far-side-not-adjusted",
          message: `${situationId}: far-side LB still glued to touchline`,
          situationId,
        });
      }
    }
  }

  // Keeper — pilots only, require sustained failure
  if (strict && keeperFlat >= Math.max(6, Math.floor(times.length * 0.45))) {
    issues.push({
      level: "error",
      code: "keeper-not-supporting-line",
      message: `${situationId}: GK does not support rising last line / ball angle`,
      situationId,
    });
  } else if (!strict && keeperFlat >= Math.max(8, Math.floor(times.length * 0.55))) {
    issues.push({
      level: "warn",
      code: "keeper-not-supporting-line",
      message: `${situationId}: GK infrequently supports line`,
      situationId,
    });
  }

  // Rest defense flatness (all four backs same x within 2)
  {
    const backs = ["us.LB", "us.LCV", "us.RCV", "us.RB"]
      .map((id) => late.playerAt[id])
      .filter(Boolean) as Array<{ x: number; y: number }>;
    if (backs.length === 4) {
      const xs = backs.map((p) => p.x);
      if (Math.max(...xs) - Math.min(...xs) < 2.5 && late.ball && late.ball.y > 60) {
        issues.push({
          level: "warn",
          code: "rest-defense-too-flat",
          message: `${situationId}: back four perfectly flat despite ball on flank`,
          situationId,
        });
      }
    }
  }

  // Transition threats marked (state presence on pilots with threats)
  const brief = getCollectiveBrief(situationId);
  if (strict && brief.transitionThreatPlayerIds.length && situationId !== "press-bad") {
    const anyMark = anim.steps.some(
      (s) =>
        (s.tacticalState?.depthThreatPlayerIds?.length ?? 0) > 0 ||
        (s.tacticalState?.markedOpponentIds?.length ?? 0) > 0 ||
        (s.tacticalState?.balancePlayerIds?.length ?? 0) > 0,
    );
    if (!anyMark) {
      issues.push({
        level: "warn",
        code: "unmarked-transition-threat",
        message: `${situationId}: no depth/mark/balance state for transition threats`,
        situationId,
      });
    }
  }

  // Last line too high without pressure (our press on opp ball)
  if (situationId === "press-bad") {
    // intentional — skip
  } else if (late.tacticalState?.possessionTeam === "opponent") {
    const ll = measureLineHeightsUs(late.playerAt).defense;
    const hasPress = Boolean(late.tacticalState?.primaryPressurePlayerId);
    if (ll > 48 && !hasPress) {
      issues.push({
        level: "warn",
        code: "last-line-too-high-without-pressure",
        message: `${situationId}: last line high without pressure chain`,
        situationId,
      });
    }
  }

  // Non-pilots: downgrade structural length/gap to warnings (enrich still applied)
  if (!strict) {
    for (const issue of issues) {
      if (
        issue.level === "error" &&
        (issue.code === "team-length-excessive" ||
          issue.code === "line-gap-excessive" ||
          issue.code === "midfield-defense-gap" ||
          issue.code === "attack-midfield-gap")
      ) {
        issue.level = "warn";
      }
    }
  }

  void oppShift;
  void measureTeamLength;

  return issues;
}

export function validateAllCollective(opts?: { pilotsOnly?: boolean }): {
  issues: CollectiveValidationIssue[];
  checked: string[];
  errors: number;
  warns: number;
} {
  const ids = opts?.pilotsOnly
    ? [...COLLECTIVE_PILOT_IDS]
    : listAnimatedSituationIds();
  const issues: CollectiveValidationIssue[] = [];
  for (const id of ids) {
    issues.push(...validateCollectiveAnimation(id, { strictPilots: true }));
  }
  return {
    issues,
    checked: ids,
    errors: issues.filter((i) => i.level === "error").length,
    warns: issues.filter((i) => i.level === "warn").length,
  };
}

// CLI
const isMain = process.argv[1]?.includes("tactical-collective-validate");
if (isMain) {
  const all = validateAllCollective({ pilotsOnly: false });
  const pilots = validateAllCollective({ pilotsOnly: true });
  console.log(`Collective validation — ${all.checked.length} sequences`);
  console.log(`Pilots: ${pilots.checked.length} | errors=${pilots.errors} warns=${pilots.warns}`);
  console.log(`All: errors=${all.errors} warns=${all.warns}`);
  for (const i of all.issues.filter((x) => x.level === "error").slice(0, 40)) {
    console.log(`  ERROR [${i.code}] ${i.message}`);
  }
  for (const i of all.issues.filter((x) => x.level === "warn").slice(0, 20)) {
    console.log(`  WARN  [${i.code}] ${i.message}`);
  }
  if (pilots.errors > 0) process.exit(1);
}
