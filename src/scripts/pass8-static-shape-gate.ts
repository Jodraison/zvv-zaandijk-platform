/**
 * Pass 8 — static shape gate for CONNECTED_TEAM_CANONICAL A1/A2/A3.
 * Writes platform/.review-screenshots/.../static-shape-gate.json + meter-spacing-report.json
 */
import fs from "node:fs";
import path from "node:path";
import { CONNECTED_TEAM_CANONICAL } from "@/lib/academie/tactical-authored-connected-team";
import {
  teamSpacingMeters,
  lineGapsMeters,
  distanceMeters,
  US_OUTFIELD,
  US_ATTACK_FIVE,
  US_DEF_FRONT,
  US_DEF_MID,
  US_DEF_BACK,
  US_REST_THREE,
  OPP_OUTFIELD,
  OPP_FRONT,
  OPP_MID,
  OPP_BACK,
  SPACING_TARGETS,
} from "@/lib/academie/tactical-pitch-meters";

const OUT = path.resolve(
  ".review-screenshots/canonical-film/canonical-match-model-pass-8",
);
fs.mkdirSync(OUT, { recursive: true });

function pts(shape: Record<string, { at: { x: number; y: number } }>) {
  const o: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(shape)) o[k] = v.at;
  return o;
}

function inRange(v: number, [lo, hi]: readonly [number, number], eps = 0.35) {
  return v >= lo - eps && v <= hi + eps;
}

const a1 = CONNECTED_TEAM_CANONICAL.A1;
const a2 = CONNECTED_TEAM_CANONICAL.A2;
const a3 = CONNECTED_TEAM_CANONICAL.A3;
const us1 = pts(a1.usShape);
const opp1 = pts(a1.opponentShape);
const us3 = pts(a3.usShape);
const opp3 = pts(a3.opponentShape);

const a1Us = teamSpacingMeters(us1, [...US_OUTFIELD]);
const a1Rest = teamSpacingMeters(us1, [...US_REST_THREE]);
const a1Opp = teamSpacingMeters(opp1, [...OPP_OUTFIELD]);
const a1OppGaps = lineGapsMeters(opp1, [[...OPP_FRONT], [...OPP_MID], [...OPP_BACK]]);
const a3Us = teamSpacingMeters(us3, [...US_OUTFIELD]);
const a3Gaps = lineGapsMeters(us3, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]);
const a3Opp = teamSpacingMeters(opp3, [...OPP_OUTFIELD]);

const fiveYs = US_ATTACK_FIVE.map((id) => us1[id]!.y);
const uniqueLanes = new Set(fiveYs.map((y) => Math.round(y / 4) * 4)).size === 5;

const checks = [
  {
    id: "A1.us.3-2-5.width",
    ok: inRange(a1Us.teamWidthM, SPACING_TARGETS.usPossession.width),
    value: a1Us.teamWidthM,
    target: SPACING_TARGETS.usPossession.width,
  },
  {
    id: "A1.us.rest-three.width",
    ok: a1Rest.teamWidthM >= 37.5 && a1Rest.teamWidthM <= 51,
    value: a1Rest.teamWidthM,
    target: [38, 50],
  },
  {
    id: "A1.us.five-lanes",
    ok: uniqueLanes && us1["us.SP"]!.x >= us1["us.10"]!.x,
    value: fiveYs,
  },
  {
    id: "A1.6-LCB",
    ok: inRange(distanceMeters(us1["us.L6"]!, us1["us.LCV"]!), [7, 11]),
    value: distanceMeters(us1["us.L6"]!, us1["us.LCV"]!),
    target: [7, 11],
  },
  {
    id: "A1.8-above-6",
    ok: inRange((us1["us.R6"]!.x - us1["us.L6"]!.x) * 1.05, [4, 8.5]),
    value: (us1["us.R6"]!.x - us1["us.L6"]!.x) * 1.05,
    target: [4, 8],
  },
  {
    id: "A1.opp.442.width",
    ok: inRange(a1Opp.teamWidthM, SPACING_TARGETS.oppMidblock442.width),
    value: a1Opp.teamWidthM,
    target: SPACING_TARGETS.oppMidblock442.width,
  },
  {
    id: "A1.opp.line-gaps",
    ok: a1OppGaps.gapsM.every((g) => g <= 13.2),
    value: a1OppGaps.gapsM,
  },
  {
    id: "A2.switch-prep.ball-rcb",
    ok: a2.ballHolder === "us.RCV",
    value: a2.ballHolder,
  },
  {
    id: "A2.left-opening",
    ok: pts(a2.usShape)["us.LW"]!.y <= 12 && pts(a2.usShape)["us.10"]!.y <= 36,
    value: { lwY: pts(a2.usShape)["us.LW"]!.y, tenY: pts(a2.usShape)["us.10"]!.y },
  },
  {
    id: "A3.us.442.width",
    ok: inRange(a3Us.teamWidthM, [35, 42]),
    value: a3Us.teamWidthM,
    target: [35, 42],
  },
  {
    id: "A3.us.442.length",
    ok: inRange(a3Us.teamLengthM, [25, 30]),
    value: a3Us.teamLengthM,
    target: [25, 30],
  },
  {
    id: "A3.us.line-gaps-max13",
    ok: a3Gaps.gapsM.every((g) => g <= 13.2),
    value: a3Gaps.gapsM,
  },
  {
    id: "A3.front-same-height",
    ok: Math.abs(us3["us.SP"]!.x - us3["us.10"]!.x) <= 1,
    value: { stX: us3["us.SP"]!.x, tenX: us3["us.10"]!.x },
  },
  {
    id: "A3.no-overlap-10-rcm",
    ok:
      distanceMeters(us3["us.10"]!, opp3["opp.rcm"]!) >= 6 ||
      Math.hypot(us3["us.10"]!.x - opp3["opp.rcm"]!.x, us3["us.10"]!.y - opp3["opp.rcm"]!.y) >= 6,
    value: distanceMeters(us3["us.10"]!, opp3["opp.rcm"]!),
  },
  {
    id: "A3.opp.4231-st-higher-than-10",
    ok: opp3["opp.rst"]!.x > opp3["opp.lst"]!.x + 4,
    value: { stX: opp3["opp.rst"]!.x, tenX: opp3["opp.lst"]!.x },
  },
];

const failed = checks.filter((c) => !c.ok);
const report = {
  pass: "canonical-match-model-pass-8",
  gate: "A-static-shape",
  status: failed.length === 0 ? "PASS" : "WARN",
  classification: {
    A1: "us 3-2-5 / opponent 4-4-2",
    A2: "switch preparation",
    A3: "us 4-4-2 / opponent 4-2-3-1",
  },
  checks,
  failed: failed.map((c) => c.id),
  meters: {
    A1: {
      us: a1Us,
      restThree: a1Rest,
      opp: a1Opp,
      oppGaps: a1OppGaps,
      d6Lcb: distanceMeters(us1["us.L6"]!, us1["us.LCV"]!),
      d8Rw: distanceMeters(us1["us.R6"]!, us1["us.RW"]!),
      dRbRw: distanceMeters(us1["us.RB"]!, us1["us.RW"]!),
      eightAboveSix: (us1["us.R6"]!.x - us1["us.L6"]!.x) * 1.05,
    },
    A3: {
      us: a3Us,
      gaps: a3Gaps,
      opp: a3Opp,
      d68: distanceMeters(us3["us.L6"]!, us3["us.R6"]!),
      dSt10: distanceMeters(us3["us.SP"]!, us3["us.10"]!),
    },
  },
  note: "Validator PASS is not a substitute for browser visual review.",
};

fs.writeFileSync(path.join(OUT, "static-shape-gate.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(OUT, "meter-spacing-report.json"), JSON.stringify(report.meters, null, 2));
console.log(JSON.stringify({ status: report.status, failed: report.failed }, null, 2));
