/**
 * connected-team Pass 6 — collective choreography QA (report only).
 * Run: npm run academy:validate-connected-team-pass6
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  CONNECTED_TEAM_PASS6_SEEKS,
  CONNECTED_TEAM_TRAJECTORIES,
} from "@/lib/academie/tactical-connected-team-production";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

type Issue = { severity: "error" | "warn"; code: string; message: string };

function dist(a: TacticalPoint, b: TacticalPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function moved(a: TacticalPoint, b: TacticalPoint, min = 1.2) {
  return dist(a, b) >= min;
}

function runFrame(ms: number) {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  if (!sit || !anim) return null;
  return evaluateTacticalAnimation(sit, anim, ms);
}

export function runRwSupportQa() {
  const issues: Issue[] = [];
  const pre = runFrame(CONNECTED_TEAM_PASS6_SEEKS["01-rw-pre-arrival-team-starts-moving"]);
  const arrival = runFrame(CONNECTED_TEAM_PASS6_SEEKS["02-rw-first-touch-half-open"]);
  const support = runFrame(CONNECTED_TEAM_PASS6_SEEKS["08-five-options-around-rw-clean"]);
  if (!pre || !arrival || !support) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }

  const layApprox = runFrame(22000)!;
  const movers = ["us.RB", "us.R6", "us.10", "us.SP", "us.LW", "us.L6", "us.RCV"] as const;
  let movingPre = 0;
  for (const id of movers) {
    if (moved(layApprox.playerAt[id]!, pre.playerAt[id]!, 0.8)) movingPre += 1;
  }
  if (movingPre < 4) {
    issues.push({
      severity: "error",
      code: "pre-arrival-static",
      message: `only ${movingPre}/7 support players moving before RW arrival`,
    });
  }

  const rw = support.playerAt["us.RW"]!;
  const rb = support.playerAt["us.RB"]!;
  const eight = support.playerAt["us.R6"]!;
  const ten = support.playerAt["us.10"]!;
  const st = support.playerAt["us.SP"]!;
  const lw = support.playerAt["us.LW"]!;
  const six = support.playerAt["us.L6"]!;

  const rbDist = dist(rw, rb);
  const eightDist = dist(rw, eight);
  if (rbDist > 14) {
    issues.push({
      severity: "error",
      code: "rb-too-far",
      message: `RB support distance ${rbDist.toFixed(1)} > 14`,
    });
  }
  if (eightDist > 22) {
    issues.push({
      severity: "error",
      code: "eight-too-far",
      message: `8 support distance ${eightDist.toFixed(1)} > 22`,
    });
  }
  if (!(rb.x < rw.x && rb.y <= rw.y + 2)) {
    issues.push({
      severity: "warn",
      code: "rb-not-below",
      message: `RB not clearly support-below (rb=${rb.x.toFixed(0)},${rb.y.toFixed(0)} rw=${rw.x.toFixed(0)},${rw.y.toFixed(0)})`,
    });
  }
  if (!(eight.x < rw.x && eight.y < rw.y)) {
    issues.push({
      severity: "error",
      code: "eight-not-inner",
      message: "8 should be inside and under RW",
    });
  }
  if (!(ten.x > six.x && ten.y < rw.y && ten.y > st.y - 8)) {
    issues.push({
      severity: "error",
      code: "ten-not-halfspace",
      message: `10 not in right halfspace (10=${ten.x.toFixed(0)},${ten.y.toFixed(0)})`,
    });
  }
  if (st.x < rw.x - 4) {
    issues.push({ severity: "warn", code: "st-not-binding", message: "ST should stay high/binding" });
  }
  if (lw.y > 28) {
    issues.push({
      severity: "warn",
      code: "lw-not-far",
      message: `LW far-post y=${lw.y.toFixed(0)} expected ≤28`,
    });
  }

  const options = [
    { id: "forward", ok: rw.x >= 78 },
    { id: "10", ok: dist(rw, ten) < 36 && ten.y < rw.y - 12 },
    { id: "8", ok: dist(rw, eight) < 24 },
    { id: "RB", ok: dist(rw, rb) < 16 },
    { id: "recycle", ok: dist(rw, six) < 52 || dist(rw, support.playerAt["us.RCV"]!) < 48 },
  ];
  const optionCount = options.filter((o) => o.ok).length;
  if (optionCount < 5) {
    issues.push({
      severity: "error",
      code: "options-incomplete",
      message: `only ${optionCount}/5 options around RW`,
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    metrics: {
      movingPre,
      rbDist,
      eightDist,
      optionCount,
      atMs: CONNECTED_TEAM_PASS6_SEEKS["08-five-options-around-rw-clean"],
    },
  };
}

export function runCollectiveShiftQa() {
  const issues: Issue[] = [];
  const before = runFrame(22000);
  const during = runFrame(CONNECTED_TEAM_PASS6_SEEKS["01-rw-pre-arrival-team-starts-moving"]);
  const after = runFrame(CONNECTED_TEAM_PASS6_SEEKS["09-live-3241-clean"]);
  if (!before || !during || !after) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }

  const usIds = [
    "us.GK",
    "us.LB",
    "us.LCV",
    "us.RCV",
    "us.RB",
    "us.L6",
    "us.R6",
    "us.10",
    "us.LW",
    "us.RW",
    "us.SP",
  ];
  const oppIds = [
    "opp.rb",
    "opp.rcb",
    "opp.rm",
    "opp.rcm",
    "opp.lcm",
    "opp.lm",
    "opp.lb",
    "opp.lcb",
    "opp.lst",
    "opp.rst",
  ];

  let usMoved = 0;
  for (const id of usIds) {
    if (moved(before.playerAt[id]!, after.playerAt[id]!, 1.5)) usMoved += 1;
  }
  let oppMoved = 0;
  for (const id of oppIds) {
    if (moved(before.playerAt[id]!, after.playerAt[id]!, 1.2)) oppMoved += 1;
  }

  if (usMoved < 6) {
    issues.push({
      severity: "error",
      code: "us-shift-weak",
      message: `only ${usMoved} us players shifted (≥6 required)`,
    });
  }
  if (oppMoved < 7) {
    issues.push({
      severity: "error",
      code: "opp-block-weak",
      message: `only ${oppMoved} opponents shifted (≥7 required)`,
    });
  }

  // Ballside RCB should be higher/righter than LCB after shift
  const lcb = after.playerAt["us.LCV"]!;
  const rcb = after.playerAt["us.RCV"]!;
  if (!(rcb.x >= lcb.x && rcb.y >= lcb.y - 2)) {
    issues.push({
      severity: "error",
      code: "rcb-not-ballside",
      message: "RCB should sit ballside/higher than LCB",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    metrics: { usMoved, oppMoved },
  };
}

export function runRestDefenceQa() {
  const issues: Issue[] = [];
  const f = runFrame(CONNECTED_TEAM_PASS6_SEEKS["11-rest-defence-lb-lcb-rcb-six"]);
  if (!f) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }
  const lb = f.playerAt["us.LB"]!;
  const lcb = f.playerAt["us.LCV"]!;
  const rcb = f.playerAt["us.RCV"]!;
  const six = f.playerAt["us.L6"]!;
  const gk = f.playerAt["us.GK"]!;

  const dLbLcb = dist(lb, lcb);
  const dLcbRcb = dist(lcb, rcb);
  const dSixLcb = dist(six, lcb);
  if (dLbLcb > 19) {
    issues.push({
      severity: "error",
      code: "lb-lcb-wide",
      message: `LB–LCB ${dLbLcb.toFixed(1)} > 19`,
    });
  }
  if (dLcbRcb > 19) {
    issues.push({
      severity: "error",
      code: "lcb-rcb-wide",
      message: `LCB–RCB ${dLcbRcb.toFixed(1)} > 19`,
    });
  }
  if (dSixLcb < 5 || dSixLcb > 18) {
    issues.push({
      severity: "warn",
      code: "six-spacing",
      message: `6–LCB ${dSixLcb.toFixed(1)} (prefer 6–14)`,
    });
  }
  if (!(rcb.y > lcb.y - 1)) {
    issues.push({ severity: "warn", code: "rcb-not-ballside-y", message: "RCB should lean ballside" });
  }
  if (!(gk.x < lcb.x - 8)) {
    issues.push({
      severity: "warn",
      code: "gk-not-sweeper",
      message: "GK should sit behind back three",
    });
  }
  if (six.x < lcb.x) {
    issues.push({ severity: "error", code: "six-behind-line", message: "6 should be ahead of CBs" });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    metrics: { dLbLcb, dLcbRcb, dSixLcb, gkX: gk.x },
  };
}

export function runRecycleDecisionQa() {
  const issues: Issue[] = [];
  const closed = runFrame(CONNECTED_TEAM_PASS6_SEEKS["13-forward-options-closed"]);
  if (!closed) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
      evaluation: null,
    };
  }
  const rw = closed.playerAt["us.RW"]!;
  const ten = closed.playerAt["us.10"]!;
  const st = closed.playerAt["us.SP"]!;
  const eight = closed.playerAt["us.R6"]!;
  const oppRb = closed.playerAt["opp.rb"]!;
  const oppRm = closed.playerAt["opp.rm"]!;
  const oppRcm = closed.playerAt["opp.rcm"]!;

  const pressOnRw = dist(rw, oppRb) < 10;
  const tenClosed = dist(ten, oppRcm) < 12;
  const flankHelp = dist(rw, oppRm) < 16;
  const eightOpen = dist(rw, eight) < 22 && dist(eight, closed.playerAt["opp.lcm"]!) > 4;

  if (!pressOnRw) {
    issues.push({ severity: "error", code: "no-press", message: "opp RB not pressing RW" });
  }
  if (!tenClosed) {
    issues.push({ severity: "error", code: "ten-open", message: "10 should be closed before recycle" });
  }
  if (!flankHelp) {
    issues.push({ severity: "warn", code: "rm-far", message: "opp RM should help close flank" });
  }
  if (!eightOpen) {
    issues.push({ severity: "error", code: "eight-not-open", message: "8 must remain recycle option" });
  }

  const trajRw8 = CONNECTED_TEAM_TRAJECTORIES.find((t) => t.id === "ct.pass.rw-8");
  const traj8Rcb = CONNECTED_TEAM_TRAJECTORIES.find((t) => t.id === "ct.pass.8-rcb");
  if (!trajRw8 || trajRw8.passerId !== "us.RW" || trajRw8.receiverId !== "us.R6") {
    issues.push({ severity: "error", code: "traj-rw-8", message: "missing RW→8 trajectory" });
  }
  if (!traj8Rcb || traj8Rcb.passerId !== "us.R6" || traj8Rcb.receiverId !== "us.RCV") {
    issues.push({ severity: "error", code: "traj-8-rcb", message: "missing 8→RCB trajectory" });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    evaluation: {
      pressOnRw,
      tenClosed,
      flankHelp,
      eightOpen,
      stHigh: st.x > 80,
      route: "RW→8→RCB",
    },
  };
}

export function runHighFidelityMotionQa() {
  const issues: Issue[] = [];
  const anim = getTacticalAnimation("connected-team");
  if (!anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }
  const toRw = anim.steps.find((s) => s.id === "to-rw");
  const lossA = anim.steps.find((s) => s.id === "loss-a");
  if (!toRw || !lossA) {
    issues.push({ severity: "error", code: "steps-missing", message: "to-rw or loss-a missing" });
  } else {
    const moves = toRw.actions.filter((a) => a.kind === "playerMove");
    const withVia = moves.filter((a) => a.kind === "playerMove" && a.via && a.via.length > 0);
    if (withVia.length < 4) {
      issues.push({
        severity: "error",
        code: "motion-profile-sparse",
        message: `only ${withVia.length} profiled moves in to-rw (need ≥4)`,
      });
    }
    const easings = new Set(
      moves.filter((a) => a.kind === "playerMove").map((a) => (a.kind === "playerMove" ? a.easing : "")),
    );
    if (easings.size < 2) {
      issues.push({
        severity: "warn",
        code: "uniform-easing",
        message: "to-rw easings look uniform",
      });
    }
    const lossSprint = lossA.actions.some(
      (a) => a.kind === "groupMove" || (a.kind === "playerMove" && a.easing === "easeOut"),
    );
    if (!lossSprint) {
      issues.push({ severity: "warn", code: "loss-no-urgency", message: "loss-a lacks urgent moves" });
    }
  }

  const recycleScenes = ["recycle-8", "recycle-rcb"];
  for (const id of recycleScenes) {
    if (!anim.steps.some((s) => s.id === id)) {
      issues.push({ severity: "error", code: "recycle-scene", message: `missing step ${id}` });
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

export function runTransitionSpeedQa() {
  const issues: Issue[] = [];
  const loss = runFrame(CONNECTED_TEAM_PASS6_SEEKS["18-loss-frame"]);
  const t400 = runFrame(CONNECTED_TEAM_PASS6_SEEKS["19-counterpress-400ms"]);
  const t1000 = runFrame(CONNECTED_TEAM_PASS6_SEEKS["20-counterpress-1000ms"]);
  const t1800 = runFrame(CONNECTED_TEAM_PASS6_SEEKS["21-recovery-1800ms"]);
  const final442 = runFrame(CONNECTED_TEAM_PASS6_SEEKS["22-final-442"]);
  if (!loss || !t400 || !t1000 || !t1800 || !final442) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "animation missing" }],
    };
  }

  const early = ["us.RW", "us.R6", "us.10", "us.SP"] as const;
  let earlyMovers = 0;
  for (const id of early) {
    if (moved(loss.playerAt[id]!, t400.playerAt[id]!, 0.6)) earlyMovers += 1;
  }
  if (earlyMovers < 2) {
    issues.push({
      severity: "error",
      code: "press-late",
      message: `only ${earlyMovers} pressers moved within 400ms`,
    });
  }

  if (!moved(loss.playerAt["us.L6"]!, t1000.playerAt["us.L6"]!, 0.8)) {
    issues.push({ severity: "warn", code: "six-slow", message: "6 slow to protect centre by 1000ms" });
  }
  if (!moved(loss.playerAt["us.RB"]!, t1800.playerAt["us.RB"]!, 2)) {
    issues.push({ severity: "error", code: "rb-recover-slow", message: "RB not recovering by 1800ms" });
  }

  const backY = ["us.LB", "us.LCV", "us.RCV", "us.RB"].map((id) => final442.playerAt[id]!.x);
  const midY = ["us.LW", "us.L6", "us.R6", "us.RW"].map((id) => final442.playerAt[id]!.x);
  const backMean = backY.reduce((a, b) => a + b, 0) / 4;
  const midMean = midY.reduce((a, b) => a + b, 0) / 4;
  if (!(midMean > backMean + 8)) {
    issues.push({
      severity: "error",
      code: "not-442",
      message: `final shape not layered 4-4-2 (back=${backMean.toFixed(0)} mid=${midMean.toFixed(0)})`,
    });
  }
  const ten = final442.playerAt["us.10"]!;
  const st = final442.playerAt["us.SP"]!;
  if (Math.abs(ten.x - st.x) > 8) {
    issues.push({
      severity: "warn",
      code: "front-two-split",
      message: "10/ST not clearly front two",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
    issues,
    metrics: { earlyMovers, backMean, midMean },
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-pass6-qa");
if (isMain) {
  const out = {
    rwSupport: runRwSupportQa(),
    collectiveShift: runCollectiveShiftQa(),
    restDefence: runRestDefenceQa(),
    recycleDecision: runRecycleDecisionQa(),
    highFidelityMotion: runHighFidelityMotionQa(),
    transitionSpeed: runTransitionSpeedQa(),
  };
  console.log(JSON.stringify(out, null, 2));
  const ok = Object.values(out).every((r) => r.ok);
  process.exit(ok ? 0 : 1);
}
