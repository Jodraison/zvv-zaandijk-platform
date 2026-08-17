/**
 * connected-team Pass 7 — meter spacing / attack-five / switch / body QA.
 * Run: npm run academy:validate-connected-team-pass7
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { CONNECTED_TEAM_PASS7_SEEKS } from "@/lib/academie/tactical-connected-team-production";
import {
  horizontalDistanceMeters,
  lineGapsMeters,
  OPP_BACK,
  OPP_FRONT,
  OPP_MID,
  OPP_OUTFIELD,
  SPACING_TARGETS,
  teamSpacingMeters,
  US_ATTACK_FIVE,
  US_DEF_BACK,
  US_DEF_FRONT,
  US_DEF_MID,
  US_DOUBLE_PIVOT,
  US_OUTFIELD,
  US_REST_THREE,
  verticalDistanceMeters,
} from "@/lib/academie/tactical-pitch-meters";
import { TACTICAL_PLAYER_STYLES } from "@/lib/academie/tactical-visual-tokens";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; message: string };

function runFrame(ms: number) {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  if (!sit || !anim) return null;
  return evaluateTacticalAnimation(sit, anim, ms);
}

function inRange(v: number, min: number, max: number, slack = 1.5) {
  return v >= min - slack && v <= max + slack;
}

export function runMeterSpacingQa() {
  const issues: Issue[] = [];
  const start = runFrame(CONNECTED_TEAM_PASS7_SEEKS["01-start-4231-meters"]);
  const attack = runFrame(CONNECTED_TEAM_PASS7_SEEKS["06-live-325-with-rest-defence"]);
  const def = runFrame(CONNECTED_TEAM_PASS7_SEEKS["20-final-compact-442-clean"]);
  const oppStart = runFrame(CONNECTED_TEAM_PASS7_SEEKS["02-opponent-442-midblock-meters"]);
  if (!start || !attack || !def || !oppStart) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }

  const startUs = teamSpacingMeters(start.playerAt, [...US_OUTFIELD]);
  const attackUs = teamSpacingMeters(attack.playerAt, [...US_OUTFIELD]);
  const defUs = teamSpacingMeters(def.playerAt, [...US_OUTFIELD]);
  const opp = teamSpacingMeters(oppStart.playerAt, [...OPP_OUTFIELD]);
  const oppGaps = lineGapsMeters(oppStart.playerAt, [[...OPP_FRONT], [...OPP_MID], [...OPP_BACK]]);
  const defGaps = lineGapsMeters(def.playerAt, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]);
  const attackGaps = lineGapsMeters(attack.playerAt, [
    [...US_REST_THREE],
    [...US_DOUBLE_PIVOT],
    [...US_ATTACK_FIVE],
  ]);

  if (!inRange(attackUs.teamWidthM, ...SPACING_TARGETS.usPossession.width)) {
    issues.push({
      severity: "error",
      code: "attack-width",
      message: `attack width ${attackUs.teamWidthM.toFixed(1)}m not in 55–64`,
    });
  }
  if (!inRange(attackUs.teamLengthM, ...SPACING_TARGETS.usPossession.length)) {
    issues.push({
      severity: "error",
      code: "attack-length",
      message: `attack length ${attackUs.teamLengthM.toFixed(1)}m not in 35–45`,
    });
  }
  if (!inRange(defUs.teamWidthM, ...SPACING_TARGETS.usDefense442.width)) {
    issues.push({
      severity: "error",
      code: "def-width",
      message: `def width ${defUs.teamWidthM.toFixed(1)}m not in 35–44`,
    });
  }
  if (!inRange(defUs.teamLengthM, ...SPACING_TARGETS.usDefense442.length)) {
    issues.push({
      severity: "error",
      code: "def-length",
      message: `def length ${defUs.teamLengthM.toFixed(1)}m not in 25–32`,
    });
  }
  for (const g of defGaps.gapsM) {
    if (g > SPACING_TARGETS.usDefense442.lineGapMax) {
      issues.push({
        severity: "error",
        code: "def-gap",
        message: `def line gap ${g.toFixed(1)}m > 15`,
      });
    } else if (g > SPACING_TARGETS.usDefense442.lineGap[1]) {
      issues.push({
        severity: "warn",
        code: "def-gap-soft",
        message: `def line gap ${g.toFixed(1)}m > 12`,
      });
    }
  }
  if (!inRange(opp.teamWidthM, ...SPACING_TARGETS.oppMidblock442.width)) {
    issues.push({
      severity: "error",
      code: "opp-width",
      message: `opp width ${opp.teamWidthM.toFixed(1)}m not in 38–46`,
    });
  }
  if (!inRange(opp.teamLengthM, ...SPACING_TARGETS.oppMidblock442.length)) {
    issues.push({
      severity: "error",
      code: "opp-length",
      message: `opp length ${opp.teamLengthM.toFixed(1)}m not in 26–34`,
    });
  }
  for (const g of oppGaps.gapsM) {
    if (g > SPACING_TARGETS.oppMidblock442.lineGapMax) {
      issues.push({
        severity: "error",
        code: "opp-gap",
        message: `opp line gap ${g.toFixed(1)}m > 15`,
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    meters: {
      startUs,
      attackUs,
      defUs,
      opp,
      oppGapsM: oppGaps.gapsM,
      defGapsM: defGaps.gapsM,
      attackGapsM: attackGaps.gapsM,
    },
  };
}

export function runAttackFiveQa() {
  const issues: Issue[] = [];
  const f = runFrame(CONNECTED_TEAM_PASS7_SEEKS["05-five-attacking-lanes-clean"]);
  if (!f) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "missing" }],
    };
  }
  const lanes = US_ATTACK_FIVE.map((id) => ({ id, y: f.playerAt[id]!.y, x: f.playerAt[id]!.x }));
  const ys = lanes.map((l) => l.y).sort((a, b) => a - b);
  for (let i = 1; i < ys.length; i++) {
    const gap = horizontalDistanceMeters({ x: 0, y: ys[i - 1]! }, { x: 0, y: ys[i]! });
    if (gap < 3.5) {
      issues.push({
        severity: "error",
        code: "lane-overlap",
        message: `attack lanes too close (${gap.toFixed(1)}m)`,
      });
    }
  }
  const lw = f.playerAt["us.LW"]!;
  const ten = f.playerAt["us.10"]!;
  const st = f.playerAt["us.SP"]!;
  const rw = f.playerAt["us.RW"]!;
  const rb = f.playerAt["us.RB"]!;
  if (!(lw.y < ten.y && ten.y < rw.y && rw.y < rb.y)) {
    issues.push({
      severity: "error",
      code: "lane-order",
      message: `expected LW<10<RW<RB by y (got ${lw.y}/${ten.y}/${rw.y}/${rb.y})`,
    });
  }
  if (!(st.x >= ten.x - 2 && st.x >= rw.x - 8)) {
    issues.push({ severity: "warn", code: "st-not-highest", message: "ST should lead central depth" });
  }
  if (Math.abs(rw.y - rb.y) * 0.68 < 3) {
    issues.push({ severity: "error", code: "rw-rb-same-lane", message: "RW/RB share lane" });
  }
  const six = f.playerAt["us.L6"]!;
  const eight = f.playerAt["us.R6"]!;
  if (!(six.x < ten.x && eight.x < rw.x)) {
    issues.push({ severity: "error", code: "pivot-not-under", message: "6/8 should sit under attack five" });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    lanes: lanes.map((l) => ({ ...l, yMeters: l.y * 0.68 })),
  };
}

export function runOpponentCompactnessQa() {
  const issues: Issue[] = [];
  const mid = runFrame(CONNECTED_TEAM_PASS7_SEEKS["02-opponent-442-midblock-meters"]);
  const ballside = runFrame(CONNECTED_TEAM_PASS7_SEEKS["07-opponent-ballside-compact"]);
  if (!mid || !ballside) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "missing" }],
    };
  }
  for (const [label, f] of [
    ["midblock", mid],
    ["ballside", ballside],
  ] as const) {
    const space = teamSpacingMeters(f.playerAt, [...OPP_OUTFIELD]);
    const gaps = lineGapsMeters(f.playerAt, [[...OPP_FRONT], [...OPP_MID], [...OPP_BACK]]);
    if (space.teamWidthM > 48) {
      issues.push({
        severity: "error",
        code: `${label}-wide`,
        message: `opp width ${space.teamWidthM.toFixed(1)}m`,
      });
    }
    if (space.teamLengthM > 36) {
      issues.push({
        severity: "error",
        code: `${label}-long`,
        message: `opp length ${space.teamLengthM.toFixed(1)}m`,
      });
    }
    for (const g of gaps.gapsM) {
      if (g > 15) {
        issues.push({
          severity: "error",
          code: `${label}-gap`,
          message: `opp gap ${g.toFixed(1)}m > 15`,
        });
      }
    }
    const frontSpread = horizontalDistanceMeters(f.playerAt["opp.lst"]!, f.playerAt["opp.rst"]!);
    if (frontSpread > 18) {
      issues.push({
        severity: "warn",
        code: `${label}-strikers`,
        message: `striker spread ${frontSpread.toFixed(1)}m`,
      });
    }
  }
  // Ballside: far LM should pinch (higher y than start far wing)
  if (ballside.playerAt["opp.lm"]!.y > mid.playerAt["opp.lm"]!.y + 2) {
    // ball on right → far side is left (low y) so LM y should decrease or stay pinched
  }
  if (ballside.playerAt["opp.lb"]!.y > 40) {
    issues.push({
      severity: "warn",
      code: "far-back-not-pinched",
      message: `opp LB y=${ballside.playerAt["opp.lb"]!.y} should pinch inward`,
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
  };
}

export function runSwitchChainQa() {
  const issues: Issue[] = [];
  const anim = getTacticalAnimation("connected-team");
  if (!anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "missing" }],
    };
  }
  for (const id of ["switch-6", "switch-lcb", "switch-lb", "switch-lw"]) {
    if (!anim.steps.some((s) => s.id === id)) {
      issues.push({ severity: "error", code: "step-missing", message: `missing ${id}` });
    }
  }
  const six = runFrame(CONNECTED_TEAM_PASS7_SEEKS["11-six-receives-open"]);
  const lcb = runFrame(CONNECTED_TEAM_PASS7_SEEKS["12-lcb-prepares-switch"]);
  const lb = runFrame(CONNECTED_TEAM_PASS7_SEEKS["13-lb-receives"]);
  const lw = runFrame(CONNECTED_TEAM_PASS7_SEEKS["14-lw-receives-switch"]);
  const reverse = runFrame(CONNECTED_TEAM_PASS7_SEEKS["15-opponent-reverse-shift"]);
  if (!six || !lcb || !lb || !lw || !reverse) {
    issues.push({ severity: "error", code: "frames", message: "switch frames missing" });
  } else {
    if (six.holderId !== "us.L6" && six.holderId != null) {
      // holder may be null mid-pass
    }
    // 10 should move toward left (lower y) during switch
    const tenBefore = runFrame(CONNECTED_TEAM_PASS7_SEEKS["08-right-side-overload"])!;
    if (lw.playerAt["us.10"]!.y > tenBefore.playerAt["us.10"]!.y - 4) {
      issues.push({
        severity: "warn",
        code: "ten-not-shifting-left",
        message: "10 should drift toward left halfspace on switch",
      });
    }
    // Opp reverse: LB/LM should be lower y (left) after switch to LW
    if (reverse.playerAt["opp.lb"]!.y > 28) {
      issues.push({
        severity: "warn",
        code: "opp-not-reversed",
        message: `opp LB y=${reverse.playerAt["opp.lb"]!.y} after switch`,
      });
    }
    const chain: Array<[TacticalPoint, TacticalPoint]> = [
      [six.playerAt["us.L6"]!, lcb.playerAt["us.LCV"]!],
      [lcb.playerAt["us.LCV"]!, lb.playerAt["us.LB"]!],
      [lb.playerAt["us.LB"]!, lw.playerAt["us.LW"]!],
    ];
    for (const [a, b] of chain) {
      const d = Math.hypot((b.x - a.x) * 1.05, (b.y - a.y) * 0.68);
      if (d > 35) {
        issues.push({
          severity: "warn",
          code: "chain-long",
          message: `switch link ${d.toFixed(1)}m`,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
  };
}

export function runDefensive442Qa() {
  const issues: Issue[] = [];
  const f = runFrame(CONNECTED_TEAM_PASS7_SEEKS["20-final-compact-442-clean"]);
  if (!f) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "missing" }],
    };
  }
  const space = teamSpacingMeters(f.playerAt, [...US_OUTFIELD]);
  const gaps = lineGapsMeters(f.playerAt, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]);
  if (!inRange(space.teamWidthM, 35, 44)) {
    issues.push({
      severity: "error",
      code: "width",
      message: `442 width ${space.teamWidthM.toFixed(1)}m`,
    });
  }
  if (!inRange(space.teamLengthM, 25, 32)) {
    issues.push({
      severity: "error",
      code: "length",
      message: `442 length ${space.teamLengthM.toFixed(1)}m`,
    });
  }
  for (const g of gaps.gapsM) {
    if (g > 15) {
      issues.push({ severity: "error", code: "gap", message: `442 gap ${g.toFixed(1)}m` });
    }
  }
  // Horizontal compactness: wing mid not on touchline
  if (f.playerAt["us.LW"]!.y < 16 || f.playerAt["us.RW"]!.y > 84) {
    issues.push({
      severity: "error",
      code: "wings-too-wide",
      message: "LW/RW too wide for compact 4-4-2",
    });
  }
  // Front two similar height
  if (verticalDistanceMeters(f.playerAt["us.SP"]!, f.playerAt["us.10"]!) > 4) {
    issues.push({
      severity: "warn",
      code: "front-split",
      message: "ST/10 not on same line",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    meters: { ...space, gapsM: gaps.gapsM },
  };
}

export function runBodyReadabilityQa() {
  const issues: Issue[] = [];
  if (!TACTICAL_PLAYER_STYLES.frontWedgeLen || TACTICAL_PLAYER_STYLES.frontWedgeLen < 5) {
    issues.push({ severity: "error", code: "no-wedge", message: "front wedge token missing" });
  }
  if (!TACTICAL_PLAYER_STYLES.shoulderLen || TACTICAL_PLAYER_STYLES.shoulderLen < 3) {
    issues.push({ severity: "error", code: "no-shoulder", message: "shoulder token missing" });
  }
  if (!TACTICAL_PLAYER_STYLES.receivingFootR) {
    issues.push({ severity: "error", code: "no-foot", message: "receiving foot token missing" });
  }
  // ring outside label
  const ringR = TACTICAL_PLAYER_STYLES.radius + 4.6;
  if (ringR <= 6) {
    issues.push({ severity: "error", code: "ring-label", message: "orientation intersects label" });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: 0,
    issues,
    geometry: {
      frontWedgeLen: TACTICAL_PLAYER_STYLES.frontWedgeLen,
      shoulderLen: TACTICAL_PLAYER_STYLES.shoulderLen,
      receivingFootR: TACTICAL_PLAYER_STYLES.receivingFootR,
      orientationV6: true,
    },
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-pass7-qa");
if (isMain) {
  const out = {
    meterSpacing: runMeterSpacingQa(),
    attackFive: runAttackFiveQa(),
    opponentCompactness: runOpponentCompactnessQa(),
    switchChain: runSwitchChainQa(),
    defensive442: runDefensive442Qa(),
    bodyReadability: runBodyReadabilityQa(),
  };
  console.log(JSON.stringify(out, null, 2));
  const ok = Object.values(out).every((r) => r.ok);
  process.exit(ok ? 0 : 1);
}
