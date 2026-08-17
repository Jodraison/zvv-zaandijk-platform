/**
 * connected-team Pass 3 — transition QA (9A–9D). Report only.
 * Run: npm run academy:validate-connected-team-transition
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { CONNECTED_TEAM_PASS3_SEEKS } from "@/lib/academie/tactical-connected-team-production";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; atMs: number; message: string };

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function runConnectedTeamTransitionQa(): {
  ok: boolean;
  errorCount: number;
  warnCount: number;
  issues: Issue[];
  states: Record<string, unknown>;
} {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const issues: Issue[] = [];
  if (!sit || !anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error", code: "missing", atMs: 0, message: "connected-team missing" }],
      states: {},
    };
  }

  const a = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["09a-loss"]);
  const b = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["09b-delay"]);
  const c = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["09c-recover"]);
  const d = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"]);

  // Distinct authored states (not identical morph endpoints)
  const rbA = a.playerAt["us.RB"]!;
  const rbB = b.playerAt["us.RB"]!;
  const rbC = c.playerAt["us.RB"]!;
  const rbD = d.playerAt["us.RB"]!;
  const rwA = a.playerAt["us.RW"]!;
  const rwC = c.playerAt["us.RW"]!;
  const rwD = d.playerAt["us.RW"]!;

  if (dist(rbA, rbD) < 8) {
    issues.push({
      severity: "error",
      code: "no-distinct-recovery",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09a-loss"],
      message: "9A RB too close to final — likely instant morph",
    });
  }
  if (rbC.x > 40) {
    issues.push({
      severity: "error",
      code: "rb-not-on-back-line-9c",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09c-recover"],
      message: `RB x=${rbC.x.toFixed(1)} should be on last line by 9C`,
    });
  }
  if (rwC.x > 55) {
    issues.push({
      severity: "error",
      code: "rw-not-midfield-9c",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09c-recover"],
      message: `RW x=${rwC.x.toFixed(1)} should reach midfield by 9C`,
    });
  }
  if (Math.abs(rbA.x - rbB.x) < 2 && Math.abs(rwA.x - b.playerAt["us.RW"]!.x) < 2) {
    issues.push({
      severity: "warn",
      code: "9a-9b-too-similar",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09b-delay"],
      message: "9A and 9B look nearly identical",
    });
  }

  // Final 4-4-2 bands
  const back = ["us.LB", "us.LCV", "us.RCV", "us.RB"].map((id) => d.playerAt[id]!);
  const mid = ["us.LW", "us.L6", "us.R6", "us.RW"].map((id) => d.playerAt[id]!);
  const front = ["us.SP", "us.10"].map((id) => d.playerAt[id]!);
  const mean = (pts: TacticalPoint[]) => pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const spreadY = (pts: TacticalPoint[]) => Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
  const mxB = mean(back);
  const mxM = mean(mid);
  const mxF = mean(front);
  if (!(mxB < mxM - 8 && mxM < mxF - 8)) {
    issues.push({
      severity: "error",
      code: "final-line-order",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"],
      message: `line means x back=${mxB.toFixed(1)} mid=${mxM.toFixed(1)} front=${mxF.toFixed(1)}`,
    });
  }
  if (spreadY(back) < 60 || spreadY(mid) < 60) {
    issues.push({
      severity: "error",
      code: "final-spread",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"],
      message: `spreadY back=${spreadY(back).toFixed(1)} mid=${spreadY(mid).toFixed(1)}`,
    });
  }
  if (Math.abs(front[0]!.x - front[1]!.x) > 4) {
    issues.push({
      severity: "warn",
      code: "front-two-depth",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"],
      message: "SP/10 not on similar attack depth",
    });
  }
  if (d.holderId && !d.holderId.startsWith("opp.")) {
    issues.push({
      severity: "error",
      code: "final-ball-not-opp",
      atMs: CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"],
      message: `holder=${d.holderId}`,
    });
  }

  // Overlaps in each state
  for (const [label, frame, ms] of [
    ["9a", a, CONNECTED_TEAM_PASS3_SEEKS["09a-loss"]],
    ["9b", b, CONNECTED_TEAM_PASS3_SEEKS["09b-delay"]],
    ["9c", c, CONNECTED_TEAM_PASS3_SEEKS["09c-recover"]],
    ["9d", d, CONNECTED_TEAM_PASS3_SEEKS["09d-final-442"]],
  ] as const) {
    const ids = Object.keys(frame.playerAt);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const pa = frame.playerAt[ids[i]!]!;
        const pb = frame.playerAt[ids[j]!]!;
        const same =
          (ids[i]!.startsWith("us.") && ids[j]!.startsWith("us.")) ||
          (ids[i]!.startsWith("opp.") && ids[j]!.startsWith("opp."));
        const thr = same ? 4.0 : 3.0;
        const dd = dist(pa, pb);
        if (dd < thr) {
          issues.push({
            severity: "error",
            code: "transition-overlap",
            atMs: ms,
            message: `${label} ${ids[i]}↔${ids[j]} d=${dd.toFixed(1)}`,
          });
        }
      }
    }
  }

  const states = {
    "9a": { rb: rbA, rw: rwA, step: a.activeStepId, holder: a.holderId },
    "9b": { rb: rbB, rw: b.playerAt["us.RW"], step: b.activeStepId, holder: b.holderId },
    "9c": { rb: rbC, rw: rwC, step: c.activeStepId, holder: c.holderId },
    "9d": { rb: rbD, rw: rwD, step: d.activeStepId, holder: d.holderId, means: { mxB, mxM, mxF } },
  };

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: warns.length,
    issues,
    states,
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-transition-qa");
if (isMain) {
  const r = runConnectedTeamTransitionQa();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
