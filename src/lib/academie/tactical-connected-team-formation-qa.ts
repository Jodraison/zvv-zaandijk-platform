/**
 * connected-team Pass 4 — formation QA (true 4-2-3-1 vs false 4-2-1-3).
 * Report only. Run: npm run academy:validate-connected-team-formation
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; message: string };

function meanX(pts: TacticalPoint[]): number {
  return pts.reduce((s, p) => s + p.x, 0) / pts.length;
}

export function runConnectedTeamFormationQa(timeMs = 800): {
  ok: boolean;
  classified: "4-2-3-1" | "4-2-1-3" | "other";
  errorCount: number;
  warnCount: number;
  issues: Issue[];
  stats: Record<string, number>;
} {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const issues: Issue[] = [];
  if (!sit || !anim) {
    return {
      ok: false,
      classified: "other",
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error", code: "missing", message: "connected-team missing" }],
      stats: {},
    };
  }

  const f = evaluateTacticalAnimation(sit, anim, timeMs);
  const lw = f.playerAt["us.LW"]!;
  const ten = f.playerAt["us.10"]!;
  const rw = f.playerAt["us.RW"]!;
  const sp = f.playerAt["us.SP"]!;
  const l6 = f.playerAt["us.L6"]!;
  const r6 = f.playerAt["us.R6"]!;

  const amMean = meanX([lw, ten, rw]);
  const amSpreadX = Math.max(lw.x, ten.x, rw.x) - Math.min(lw.x, ten.x, rw.x);
  const spAhead = sp.x - amMean;
  const tenBehindWingers = (lw.x + rw.x) / 2 - ten.x;
  const sixMean = meanX([l6, r6]);
  const sixBelowAm = amMean - sixMean;

  // True 4-2-3-1: SP clearly ahead of AM line; 10 near winger depth
  if (spAhead < 7) {
    issues.push({
      severity: "error",
      code: "sp-not-ahead",
      message: `SP only ${spAhead.toFixed(1)} ahead of LW/10/RW (need ≥7)`,
    });
  }
  if (spAhead > 14) {
    issues.push({
      severity: "warn",
      code: "sp-too-far",
      message: `SP ${spAhead.toFixed(1)} ahead (prefer 7–12)`,
    });
  }
  if (amSpreadX > 8) {
    issues.push({
      severity: "error",
      code: "am-line-not-flat",
      message: `LW/10/RW x-spread=${amSpreadX.toFixed(1)} (need ≤8 for one line)`,
    });
  }
  if (tenBehindWingers > 6) {
    issues.push({
      severity: "error",
      code: "reads-as-4213",
      message: `10 is ${tenBehindWingers.toFixed(1)} behind wingers → classifies as 4-2-1-3`,
    });
  }
  if (sixBelowAm < 8) {
    issues.push({
      severity: "error",
      code: "double-6-not-below",
      message: `L6/R6 only ${sixBelowAm.toFixed(1)} behind AM line`,
    });
  }

  const classified: "4-2-3-1" | "4-2-1-3" | "other" =
    tenBehindWingers > 6
      ? "4-2-1-3"
      : spAhead >= 7 && amSpreadX <= 8
        ? "4-2-3-1"
        : "other";

  if (classified === "4-2-1-3") {
    issues.push({
      severity: "error",
      code: "classified-4213",
      message: "Formation classifies as 4-2-1-3",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return {
    ok: errors.length === 0 && classified === "4-2-3-1",
    classified,
    errorCount: errors.length,
    warnCount: warns.length,
    issues,
    stats: { amMean, amSpreadX, spAhead, tenBehindWingers, sixBelowAm },
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-formation-qa");
if (isMain) {
  const r = runConnectedTeamFormationQa();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
