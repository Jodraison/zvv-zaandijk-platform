/**
 * connected-team Pass 4 — perception cue QA (report only).
 * Run: npm run academy:validate-connected-team-perception
 */

import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { CONNECTED_TEAM_PASS4_SEEKS } from "@/lib/academie/tactical-connected-team-production";

type Issue = { severity: "error" | "warn"; code: string; message: string; atMs: number };

function softZones(zones: { kind?: string }[] | undefined) {
  return (zones ?? []).filter(
    (z) => z.kind === "cover-shadow" || z.kind === "pocket" || z.kind === "scan",
  );
}

export function runConnectedTeamPerceptionQa() {
  const issues: Issue[] = [];
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  if (!sit || !anim) {
    return {
      ok: false,
      errorCount: 1,
      warnCount: 0,
      issues: [{ severity: "error" as const, code: "missing", message: "missing", atMs: 0 }],
      frames: {},
    };
  }

  const frames: Record<string, { softCount: number; kinds: string[] }> = {};

  const checks: { key: keyof typeof CONNECTED_TEAM_PASS4_SEEKS; expect: string[]; maxSoft: number }[] =
    [
      { key: "01-true-4231-clean", expect: [], maxSoft: 0 },
      { key: "03-r6-scan", expect: ["cover-shadow"], maxSoft: 1 },
      { key: "04-ten-cover-shadow", expect: ["cover-shadow"], maxSoft: 1 },
      { key: "05-ten-free-pocket", expect: ["pocket"], maxSoft: 1 },
      { key: "06-ten-half-open-receive", expect: [], maxSoft: 0 },
      { key: "09-space-behind-stepping-cv", expect: ["pocket"], maxSoft: 1 },
      { key: "11-wall-pass-ten", expect: ["pocket"], maxSoft: 1 },
    ];

  for (const c of checks) {
    const ms = CONNECTED_TEAM_PASS4_SEEKS[c.key];
    const f = evaluateTacticalAnimation(sit, anim, ms);
    const soft = softZones(f.zones);
    const kinds = soft.map((z) => z.kind ?? "unknown");
    frames[c.key] = { softCount: soft.length, kinds };
    if (soft.length > c.maxSoft) {
      issues.push({
        severity: "error",
        code: "academy-multi-zone",
        message: `${c.key}: ${soft.length} soft zones (max ${c.maxSoft}) kinds=${kinds.join(",")}`,
        atMs: ms,
      });
    }
    for (const k of c.expect) {
      if (!kinds.includes(k)) {
        issues.push({
          severity: "error",
          code: "missing-cue",
          message: `${c.key}: expected kind ${k}`,
          atMs: ms,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warnCount: warns.length,
    issues,
    frames,
  };
}

const isMain = process.argv[1]?.includes("tactical-connected-team-perception-qa");
if (isMain) {
  const r = runConnectedTeamPerceptionQa();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
