/**
 * Academy Tactical Film Standard V1 — validator + Chapter-1 audit.
 *
 * Reports and blocks. Never rewrites authored coordinates.
 * Run: npm run academy:validate-tactical-standard-v1
 */
import fs from "node:fs";
import path from "node:path";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { listAnimatedSituationIds, getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  ACADEMY_SITUATION_STANDARD_META,
  ACADEMY_SPACING,
  ACADEMY_TACTICAL_FILM_STANDARD_V1,
  academyDisplayRole,
  isForbiddenDisplayLabel,
  isValidOppDisplayRole,
  isValidUsDisplayRole,
  type AcademyOpponentModelId,
} from "@/lib/academie/tactical-film-standard-v1";
import {
  distanceMeters,
  teamSpacingMeters,
  lineGapsMeters,
  US_OUTFIELD,
  US_DEF_FRONT,
  US_DEF_MID,
  US_DEF_BACK,
} from "@/lib/academie/tactical-pitch-meters";
import { FORMATION_PRESS_BASE, PRESS_OPPONENTS, PRESS_BALL } from "@/lib/academie/tactical-visual-system";
import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";

const OUT = path.resolve(".review-screenshots/tactical-standard-v1");
fs.mkdirSync(OUT, { recursive: true });

type AuditStatus = "COMPLIANT" | "REQUIRES_REAUTHORING" | "BLOCKED";

type AuditRow = {
  id: string;
  lesson: string;
  goodBad: "good" | "bad" | "hero" | "other";
  usFormation: string | null;
  opponentModel: string | null;
  roleCompliance: boolean;
  spacingCompliance: boolean | null;
  pressingCompliance: boolean | null;
  overlapCount: number;
  labelProblems: string[];
  markerVersion: string;
  status: AuditStatus;
  reasons: string[];
};

function lessonForSituation(id: string): string {
  for (const lesson of ACADEMY_LESSON_DEFINITIONS) {
    const std = lesson.standard;
    if (!std) continue;
    if (std.situation?.fieldPreset === id || std.situation?.situationId === id) return lesson.slug;
    if (std.recognizeCompare?.badSituationId === id || std.recognizeCompare?.goodSituationId === id) {
      return lesson.slug;
    }
    for (const m of std.mistakes ?? []) {
      if (m.badSituationId === id || m.goodSituationId === id) return lesson.slug;
    }
  }
  return "unknown";
}

function goodBadFor(id: string): AuditRow["goodBad"] {
  const meta = ACADEMY_SITUATION_STANDARD_META[id];
  if (meta?.kind === "comparison-good") return "good";
  if (meta?.kind === "comparison-bad") return "bad";
  if (id === "connected-team") return "hero";
  return "other";
}

function playerPoints(sitId: string) {
  const sit = getTacticalSituation(sitId);
  if (!sit) return null;
  const map: Record<string, { x: number; y: number; team: string; label: string }> = {};
  for (const p of sit.players) {
    map[p.id] = { x: p.at.x, y: p.at.y, team: p.team, label: p.label };
  }
  return { sit, map };
}

function countOverlaps(map: Record<string, { x: number; y: number }>, minM = ACADEMY_SPACING.markerMinM) {
  const ids = Object.keys(map);
  let n = 0;
  const pairs: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = map[ids[i]!]!;
      const b = map[ids[j]!]!;
      if (distanceMeters(a, b) < minM) {
        n++;
        pairs.push(`${ids[i]}↔${ids[j]}`);
      }
    }
  }
  return { n, pairs };
}

function auditRoles(map: Record<string, { team: string; label: string }>) {
  const problems: string[] = [];
  for (const [id, p] of Object.entries(map)) {
    const display = academyDisplayRole(id);
    const shown = academyDisplayRole(p.label);
    if (isForbiddenDisplayLabel(p.label) || isForbiddenDisplayLabel(shown)) {
      problems.push(`${id}: forbidden label "${p.label}"`);
    }
    if (p.team === "us" && !isValidUsDisplayRole(display)) {
      problems.push(`${id}: invalid us role ${display}`);
    }
    if (p.team === "opponent" && !isValidOppDisplayRole(display)) {
      problems.push(`${id}: invalid opp role ${display}`);
    }
  }
  return problems;
}

function auditSituation(id: string): AuditRow {
  const meta = ACADEMY_SITUATION_STANDARD_META[id];
  const reasons: string[] = [];
  const data = playerPoints(id);
  if (!data) {
    return {
      id,
      lesson: lessonForSituation(id),
      goodBad: goodBadFor(id),
      usFormation: null,
      opponentModel: null,
      roleCompliance: false,
      spacingCompliance: null,
      pressingCompliance: null,
      overlapCount: 0,
      labelProblems: ["situation-missing"],
      markerVersion: ACADEMY_TACTICAL_FILM_STANDARD_V1.markerRules.version,
      status: "BLOCKED",
      reasons: ["situation definition missing"],
    };
  }

  const labelProblems = auditRoles(data.map);
  const overlaps = countOverlaps(data.map);
  if (overlaps.n > 0) reasons.push(`overlaps:${overlaps.n}`);
  if (labelProblems.length) reasons.push(...labelProblems);

  if (!meta) {
    reasons.push("no-declared-opponentModel");
    reasons.push("no-declared-usFormation");
    return {
      id,
      lesson: lessonForSituation(id),
      goodBad: goodBadFor(id),
      usFormation: data.sit.homeShape?.formation ?? null,
      opponentModel: null,
      roleCompliance: labelProblems.length === 0,
      spacingCompliance: null,
      pressingCompliance: null,
      overlapCount: overlaps.n,
      labelProblems,
      markerVersion: ACADEMY_TACTICAL_FILM_STANDARD_V1.markerRules.version,
      status: overlaps.n > 2 || labelProblems.length > 0 ? "BLOCKED" : "REQUIRES_REAUTHORING",
      reasons,
    };
  }

  let spacingOk: boolean | null = null;
  if (meta.usFormation === "4-4-2" && (meta.kind === "comparison-good" || meta.kind === "comparison-bad" || meta.kind === "defending")) {
    const usPts: Record<string, { x: number; y: number }> = {};
    for (const id2 of US_OUTFIELD) {
      if (data.map[id2]) usPts[id2] = data.map[id2]!;
    }
    const sp = teamSpacingMeters(usPts, [...US_OUTFIELD]);
    const gaps = lineGapsMeters(usPts, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]);
    const wOk =
      sp.teamWidthM >= ACADEMY_SPACING.usDefend442.teamWidth[0] - 0.5 &&
      sp.teamWidthM <= ACADEMY_SPACING.usDefend442.teamWidth[1] + 0.5;
    const lOk =
      sp.teamLengthM >= ACADEMY_SPACING.usDefend442.teamLength[0] - 0.5 &&
      sp.teamLengthM <= ACADEMY_SPACING.usDefend442.teamLength[1] + 0.5;
    const gOk = gaps.gapsM.every((g) => g <= ACADEMY_SPACING.usDefend442.lineGapMax + 0.3);
    spacingOk = wOk && lOk && gOk;
    if (!spacingOk) {
      reasons.push(
        `spacing w=${sp.teamWidthM.toFixed(1)} l=${sp.teamLengthM.toFixed(1)} gaps=${gaps.gapsM.map((g) => g.toFixed(1)).join("/")}`,
      );
    }
  }

  let pressingOk: boolean | null = null;
  if (meta.kind === "comparison-good" || meta.kind === "pressing") {
    const roles = meta.pressingRoles ?? {};
    const required = ["FIRST_PRESS", "SECOND_PRESS", "INSIDE_COVER", "DEPTH_COVER", "FAR_SIDE_COMPACTNESS"] as const;
    pressingOk = required.every((r) => Boolean(roles[r]));
    if (!pressingOk) reasons.push("pressing-roles-incomplete");
  }
  if (meta.kind === "comparison-bad") {
    pressingOk = Boolean(meta.pressingRoles?.FIRST_PRESS) && !meta.pressingRoles?.SECOND_PRESS;
    if (!pressingOk) reasons.push("bad-press-should-lack-second-press");
  }

  // Identical start for press pair
  if (id === "press-good" || id === "press-bad") {
    const otherId = meta.comparisonPair?.otherId;
    if (otherId) {
      const other = playerPoints(otherId);
      if (other) {
        for (const [pid, pt] of Object.entries(FORMATION_PRESS_BASE)) {
          const a = data.map[`us.${pid}`];
          const b = other.map[`us.${pid}`];
          if (!a || !b || a.x !== b.x || a.y !== b.y) {
            reasons.push(`start-mismatch:${pid}`);
          }
          void pt;
        }
      }
    }
  }

  const roleOk = labelProblems.length === 0;
  let status: AuditStatus = "COMPLIANT";
  if (!meta.opponentModel) {
    status = "BLOCKED";
    reasons.push("opponentModel-required");
  }
  if (!roleOk || overlaps.n > 0) status = "BLOCKED";
  else if (spacingOk === false || pressingOk === false) status = "REQUIRES_REAUTHORING";
  if (meta.blockedUntilCompliant) status = "BLOCKED";
  if (reasons.some((r) => r.startsWith("start-mismatch"))) status = "BLOCKED";
  // connected-team: contract-linked, but Gate A visual hold.
  if (id === "connected-team") {
    reasons.push("Gate-A-visual-not-approved");
    if (status === "COMPLIANT") status = "REQUIRES_REAUTHORING";
  }

  return {
    id,
    lesson: lessonForSituation(id),
    goodBad: goodBadFor(id),
    usFormation: meta.usFormation,
    opponentModel: meta.opponentModel as AcademyOpponentModelId,
    roleCompliance: roleOk,
    spacingCompliance: spacingOk,
    pressingCompliance: pressingOk,
    overlapCount: overlaps.n,
    labelProblems,
    markerVersion: ACADEMY_TACTICAL_FILM_STANDARD_V1.markerRules.version,
    status,
    reasons: [...new Set(reasons)],
  };
}

function pressurePairReports() {
  const usPts: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(FORMATION_PRESS_BASE)) {
    usPts[`us.${k}`] = v;
  }
  const sp = teamSpacingMeters(usPts, [...US_OUTFIELD]);
  const gaps = lineGapsMeters(usPts, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]);
  const overlaps = countOverlaps({
    ...usPts,
    ...Object.fromEntries(PRESS_OPPONENTS.map((p) => [p.id, p.at])),
  });
  return {
    ball: PRESS_BALL,
    usSpacing: sp,
    usGaps: gaps,
    overlapCount: overlaps.n,
    overlapPairs: overlaps.pairs,
    roles: ACADEMY_SITUATION_STANDARD_META["press-good"]?.pressingRoles,
    identicalStart: true,
  };
}

const ids = listAnimatedSituationIds().sort();
const rows = ids.map(auditSituation);

const summary = {
  version: ACADEMY_TACTICAL_FILM_STANDARD_V1.version,
  total: rows.length,
  compliant: rows.filter((r) => r.status === "COMPLIANT").length,
  requiresReauthoring: rows.filter((r) => r.status === "REQUIRES_REAUTHORING").length,
  blocked: rows.filter((r) => r.status === "BLOCKED").length,
  topReasons: Object.entries(
    rows
      .flatMap((r) => r.reasons)
      .reduce<Record<string, number>>((acc, r) => {
        const key = r.split(":")[0]!;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12),
};

const pressGood = rows.find((r) => r.id === "press-good");
const pressBad = rows.find((r) => r.id === "press-bad");
const evidenceBlocked =
  !pressGood ||
  !pressBad ||
  pressGood.status !== "COMPLIANT" ||
  pressBad.status !== "COMPLIANT" ||
  !getTacticalAnimation("press-good") ||
  !getTacticalAnimation("press-bad");

const report = {
  standard: "ACADEMY_TACTICAL_FILM_STANDARD_V1",
  summary,
  rows,
  pressurePair: pressurePairReports(),
  evidenceGate: {
    blockEvidenceIfNonCompliantReferences: true,
    pressPairBlocked: evidenceBlocked,
    connectedTeamFilmBlocked: true,
    reason: "Gate A not approved; no connected-team film; press pair must stay compliant",
  },
  note: "Validator PASS/COMPLIANT is not a substitute for browser visual review.",
};

fs.writeFileSync(path.join(OUT, "chapter-1-tactical-standard-audit.json"), JSON.stringify({ summary, rows }, null, 2));
fs.writeFileSync(path.join(OUT, "tactical-standard-v1-report.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(OUT, "chapter-1-compliance-report.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(OUT, "pressure-pair-spacing-report.json"), JSON.stringify(report.pressurePair, null, 2));
fs.writeFileSync(
  path.join(OUT, "pressure-pair-role-report.json"),
  JSON.stringify(
    {
      good: ACADEMY_SITUATION_STANDARD_META["press-good"],
      bad: ACADEMY_SITUATION_STANDARD_META["press-bad"],
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(OUT, "pressure-pair-overlap-report.json"),
  JSON.stringify({ overlapCount: report.pressurePair.overlapCount, pairs: report.pressurePair.overlapPairs }, null, 2),
);

const md = [
  "# Chapter 1 — Tactical Film Standard V1 Audit",
  "",
  `Total: **${summary.total}** · COMPLIANT: **${summary.compliant}** · REQUIRES_REAUTHORING: **${summary.requiresReauthoring}** · BLOCKED: **${summary.blocked}**`,
  "",
  "## Top reason categories",
  ...summary.topReasons.map(([k, n]) => `- ${k}: ${n}`),
  "",
  "## Per animation",
  "| id | status | formation | opponent | overlaps | labels |",
  "|----|--------|-----------|----------|----------|--------|",
  ...rows.map(
    (r) =>
      `| ${r.id} | ${r.status} | ${r.usFormation ?? "—"} | ${r.opponentModel ?? "—"} | ${r.overlapCount} | ${r.labelProblems.length ? r.labelProblems.join("; ") : "ok"} |`,
  ),
  "",
  "## Policy",
  "- No automatic coordinate rewrite.",
  "- Undeclared situations → REQUIRES_REAUTHORING / BLOCKED.",
  "- Only `connected-team` + `press-good`/`press-bad` are V1 reference productions.",
  "- connected-team film remains held (Gate A not approved).",
  "",
].join("\n");

fs.writeFileSync(path.join(OUT, "chapter-1-tactical-standard-audit.md"), md);

const summaryMd = [
  "# Tactical Film Standard V1 — Summary",
  "",
  "## Roles (visible)",
  `- Us: ${ACADEMY_TACTICAL_FILM_STANDARD_V1.roleSystem.usRoles.join(", ")}`,
  `- Opp: ${ACADEMY_TACTICAL_FILM_STANDARD_V1.roleSystem.oppRoles.join(", ")}`,
  `- Forbidden: ${ACADEMY_TACTICAL_FILM_STANDARD_V1.roleSystem.forbidden.join(", ")}`,
  "",
  "## Formations",
  "- 4-2-3-1 (possession base)",
  "- 3-2-5 (attacking with high RB)",
  "- 4-4-2 (without ball)",
  "",
  "## Opponent models",
  ACADEMY_TACTICAL_FILM_STANDARD_V1.opponentModels.map((m) => `- ${m}`).join("\n"),
  "",
  "## Pressing roles",
  ACADEMY_TACTICAL_FILM_STANDARD_V1.pressingPrinciples.roles.map((r) => `- ${r}`).join("\n"),
  "",
  "## Spacing (meters)",
  "See `ACADEMY_SPACING` in `tactical-film-standard-v1.ts`.",
  "",
].join("\n");

fs.writeFileSync(path.join(OUT, "tactical-standard-summary.md"), summaryMd);

console.log(JSON.stringify(summary, null, 2));
console.log("Evidence pressPairBlocked:", evidenceBlocked);

// Exit non-zero only if reference press pair is broken (block gate).
if (evidenceBlocked) {
  console.error("BLOCKED: press-good/press-bad failed V1 compliance — evidence capture blocked.");
  process.exit(1);
}

process.exit(0);
