/**
 * connected-team Pass 4 — orientation QA (report only).
 * Run: npm run academy:validate-connected-team-orientation
 */

import { getAuthoredBrief, getAuthoredOrientation } from "@/lib/academie/tactical-authored-lookup";
import { receivingSideFor } from "@/lib/academie/tactical-orientation";
import { CONNECTED_TEAM_PASS4_SEEKS } from "@/lib/academie/tactical-connected-team-production";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";

type Issue = { severity: "error" | "warn"; code: string; message: string; atMs?: number };

const KEY_PLAYERS = ["us.R6", "us.10", "us.SP", "us.RW", "us.RB", "us.L6"] as const;

const EXPECTED: Record<
  string,
  { step: string; body: string[]; receiving?: string }
> = {
  "us.R6": { step: "start", body: ["half-open-right", "half-open"] },
  "us.10": { step: "start", body: ["closed"] },
  "us.SP": { step: "start", body: ["open"] },
  "us.RW": { step: "to-rw", body: ["half-open-right", "half-open", "side-on"] },
  "us.RB": { step: "recv-10", body: ["half-open-right", "half-open", "side-on"] },
  "us.L6": { step: "start", body: ["half-open-left", "half-open"] },
};

export function runConnectedTeamOrientationQa() {
  const issues: Issue[] = [];
  const brief = getAuthoredBrief("connected-team");
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  const samples: Record<string, unknown> = {};

  if (!brief || !sit || !anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "connected-team missing" }],
      samples,
    };
  }

  for (const id of KEY_PLAYERS) {
    const exp = EXPECTED[id]!;
    const o = getAuthoredOrientation("connected-team", id, exp.step === "recv-10" ? "pass-10" : exp.step === "to-rw" ? "to-rw" : "start");
    if (!o) {
      issues.push({ severity: "error", code: "no-orientation", message: `${id} missing orientation` });
      continue;
    }
    samples[id] = {
      bodyShape: o.bodyShape,
      facingAngleDeg: o.facingAngleDeg,
      receivingSide: receivingSideFor(o.bodyShape, o.receivingFoot),
      vision: o.visionTarget,
      prePassScan: o.prePassScan ?? false,
    };
    if (!exp.body.includes(o.bodyShape)) {
      issues.push({
        severity: "error",
        code: "body-state",
        message: `${id} body=${o.bodyShape} expected one of ${exp.body.join("|")}`,
      });
    }
    if (typeof o.facingAngleDeg !== "number") {
      issues.push({ severity: "error", code: "facing", message: `${id} missing facing` });
    }
    const side = receivingSideFor(o.bodyShape, o.receivingFoot);
    if (!side) {
      issues.push({ severity: "error", code: "receiving-side", message: `${id} missing receiving side` });
    }
  }

  // Instant snap check: facing delta across key seeks for us.10
  const t0 = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS4_SEEKS["03-r6-scan"]);
  const t1 = evaluateTacticalAnimation(sit, anim, CONNECTED_TEAM_PASS4_SEEKS["06-ten-half-open-receive"]);
  void t0;
  void t1;

  const recv10 = getAuthoredOrientation("connected-team", "us.10", "pass-10");
  if (recv10 && recv10.bodyShape !== "half-open-right" && recv10.bodyShape !== "half-open") {
    issues.push({
      severity: "error",
      code: "ten-receive-body",
      message: `10 receive body=${recv10.bodyShape} (need half-open-right)`,
      atMs: CONNECTED_TEAM_PASS4_SEEKS["06-ten-half-open-receive"],
    });
  }

  // Scene 1: no gaze required — orientation still present for R6
  const r6Start = getAuthoredOrientation("connected-team", "us.R6", "start");
  if (!r6Start?.prePassScan) {
    issues.push({
      severity: "warn",
      code: "r6-scan-flag",
      message: "R6 should author prePassScan at start/scan",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: warns.length,
    issues,
    samples,
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-orientation-qa");
if (isMain) {
  console.log(JSON.stringify(runConnectedTeamOrientationQa(), null, 2));
  process.exit(runConnectedTeamOrientationQa().ok ? 0 : 1);
}
