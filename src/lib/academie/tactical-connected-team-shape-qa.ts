/**
 * connected-team shape + overlap QA — report only, never rewrite.
 * Run: npm run academy:validate-connected-team-shapes
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export type ShapeLine = string[];

export type ExpectedShape = {
  team: string;
  lines: ShapeLine[];
};

export type ShapeExpectation = {
  keyframeId: string;
  timeMs: number;
  us: ExpectedShape;
  opponent?: ExpectedShape;
  minDistance: number;
  minLineSpreadY: number;
  minLineGapX: number;
};

/** Explicit authored expectations per keyframe (Pass 2). */
export const CONNECTED_TEAM_SHAPE_EXPECTATIONS: ShapeExpectation[] = [
  {
    keyframeId: "start-4231",
    timeMs: 800,
    us: {
      team: "4-2-3-1",
      lines: [
        ["us.LB", "us.LCV", "us.RCV", "us.RB"],
        ["us.L6", "us.R6"],
        ["us.LW", "us.10", "us.RW"],
        ["us.SP"],
      ],
    },
    opponent: {
      team: "4-4-2",
      lines: [
        ["opp.lb", "opp.lcb", "opp.rcb", "opp.rb"],
        ["opp.lm", "opp.lcm", "opp.rcm", "opp.rm"],
        ["opp.lst", "opp.rst"],
      ],
    },
    minDistance: 4.2,
    minLineSpreadY: 40,
    minLineGapX: 8,
  },
  {
    keyframeId: "end-3241",
    timeMs: 28400,
    us: {
      team: "3-2-4-1",
      lines: [
        ["us.LB", "us.LCV", "us.RCV"],
        ["us.L6", "us.R6"],
        ["us.LW", "us.10", "us.RW", "us.RB"],
        ["us.SP"],
      ],
    },
    minDistance: 4.0,
    minLineSpreadY: 42,
    minLineGapX: 8,
  },
  {
    keyframeId: "loss-442",
    timeMs: 39500,
    us: {
      team: "4-4-2",
      lines: [
        ["us.LB", "us.LCV", "us.RCV", "us.RB"],
        ["us.LW", "us.L6", "us.R6", "us.RW"],
        ["us.SP", "us.10"],
      ],
    },
    minDistance: 4.2,
    minLineSpreadY: 60,
    minLineGapX: 12,
  },
];

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lineYs(playerAt: Record<string, TacticalPoint>, ids: string[]): number[] {
  return ids.map((id) => playerAt[id]?.y).filter((y): y is number => typeof y === "number");
}

function lineXs(playerAt: Record<string, TacticalPoint>, ids: string[]): number[] {
  return ids.map((id) => playerAt[id]?.x).filter((x): x is number => typeof x === "number");
}

export type ShapeIssue = {
  severity: "error" | "warn";
  keyframeId: string;
  code: string;
  message: string;
};

export function runConnectedTeamShapeQa(): {
  ok: boolean;
  issues: ShapeIssue[];
  overlapPairs: Array<{ a: string; b: string; d: number; atMs: number }>;
  shapeReport: Array<Record<string, unknown>>;
} {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const issues: ShapeIssue[] = [];
  const overlapPairs: Array<{ a: string; b: string; d: number; atMs: number }> = [];
  const shapeReport: Array<Record<string, unknown>> = [];

  if (!sit || !anim) {
    return {
      ok: false,
      issues: [
        {
          severity: "error",
          keyframeId: "missing",
          code: "missing-definition",
          message: "connected-team missing",
        },
      ],
      overlapPairs,
      shapeReport,
    };
  }

  for (const exp of CONNECTED_TEAM_SHAPE_EXPECTATIONS) {
    const frame = evaluateTacticalAnimation(sit, anim, exp.timeMs);
    const playerAt = frame.playerAt;
    const ids = Object.keys(playerAt);

    // Overlap within us / within opp / across
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        const pa = playerAt[a]!;
        const pb = playerAt[b]!;
        const d = dist(pa, pb);
        const sameTeam =
          (a.startsWith("us.") && b.startsWith("us.")) ||
          (a.startsWith("opp.") && b.startsWith("opp."));
        const threshold = sameTeam ? exp.minDistance : Math.min(3.2, exp.minDistance);
        if (d < threshold) {
          overlapPairs.push({ a, b, d, atMs: exp.timeMs });
          issues.push({
            severity: "error",
            keyframeId: exp.keyframeId,
            code: "player-overlap",
            message: `${a}↔${b} d=${d.toFixed(1)} < ${threshold}`,
          });
        }
      }
    }

    // RW/RB double occupation
    const rw = playerAt["us.RW"];
    const rb = playerAt["us.RB"];
    if (rw && rb && Math.abs(rw.x - rb.x) < 4 && Math.abs(rw.y - rb.y) < 6) {
      issues.push({
        severity: "error",
        keyframeId: exp.keyframeId,
        code: "winger-back-overlap",
        message: `RW/RB too close dx=${Math.abs(rw.x - rb.x).toFixed(1)} dy=${Math.abs(rw.y - rb.y).toFixed(1)}`,
      });
    }

    // L6/R6 role separation
    const l6 = playerAt["us.L6"];
    const r6 = playerAt["us.R6"];
    if (l6 && r6) {
      if (Math.abs(l6.y - r6.y) < 8) {
        issues.push({
          severity: "warn",
          keyframeId: exp.keyframeId,
          code: "l6-r6-same-lane",
          message: `L6/R6 dy=${Math.abs(l6.y - r6.y).toFixed(1)}`,
        });
      }
      if (dist(l6, r6) < 8) {
        issues.push({
          severity: "error",
          keyframeId: exp.keyframeId,
          code: "l6-r6-cluster",
          message: `L6/R6 d=${dist(l6, r6).toFixed(1)}`,
        });
      }
    }

    const lineStats = exp.us.lines.map((line, idx) => {
      const ys = lineYs(playerAt, line);
      const xs = lineXs(playerAt, line);
      const spreadY = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
      const meanX = xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;
      if (line.length >= 3 && spreadY < exp.minLineSpreadY * 0.55) {
        issues.push({
          severity: "error",
          keyframeId: exp.keyframeId,
          code: "line-not-spread",
          message: `us line ${idx} (${exp.us.team}) spreadY=${spreadY.toFixed(1)}`,
        });
      }
      return { line, spreadY, meanX };
    });

    // Vertical separation between consecutive lines
    for (let i = 0; i < lineStats.length - 1; i++) {
      const a = lineStats[i]!;
      const b = lineStats[i + 1]!;
      const gap = b.meanX - a.meanX;
      if (gap < exp.minLineGapX * 0.6) {
        issues.push({
          severity: "warn",
          keyframeId: exp.keyframeId,
          code: "line-gap-small",
          message: `us lines ${i}→${i + 1} gapX=${gap.toFixed(1)}`,
        });
      }
    }

    if (exp.opponent) {
      for (const [idx, line] of exp.opponent.lines.entries()) {
        const ys = lineYs(playerAt, line);
        const spreadY = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
        if (line.length >= 3 && spreadY < exp.minLineSpreadY * 0.5) {
          issues.push({
            severity: "error",
            keyframeId: exp.keyframeId,
            code: "opp-line-not-spread",
            message: `opp line ${idx} spreadY=${spreadY.toFixed(1)}`,
          });
        }
      }
    }

    shapeReport.push({
      keyframeId: exp.keyframeId,
      timeMs: exp.timeMs,
      expectedUs: exp.us.team,
      expectedOpp: exp.opponent?.team ?? null,
      lineStats,
      overlapCount: overlapPairs.filter((p) => p.atMs === exp.timeMs).length,
    });
  }

  return {
    ok: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    overlapPairs,
    shapeReport,
  };
}

function main() {
  const result = runConnectedTeamShapeQa();
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        errorCount: result.issues.filter((i) => i.severity === "error").length,
        warnCount: result.issues.filter((i) => i.severity === "warn").length,
        issues: result.issues,
        overlapPairs: result.overlapPairs,
        shapeReport: result.shapeReport,
      },
      null,
      2,
    ),
  );
  if (!result.ok) process.exit(1);
}

const isMain = process.argv[1]?.includes("tactical-connected-team-shape-qa");
if (isMain) main();
