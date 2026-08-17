/**
 * Dedicated Decision Session film IDs (Orders #2–#18).
 * Pattern: fdl-ds-{slug}-{live|good|bad}
 */

export const DEDICATED_SESSION_FILM_DEFS = [
  { order: 2, sessionId: "FDL-DS-INSIDE-CLOSE-LW-PRESS-V1", slug: "binnenkant-dicht-lw", family: "press-mirror", activeRole: "us.LW", supportRoles: ["us.L6", "us.LB", "us.10"] },
  { order: 3, sessionId: "FDL-DS-INSIDE-CLOSE-RW-DECISION-V1", slug: "binnenkant-dicht-decision", family: "press-stable", activeRole: "us.RW", supportRoles: ["us.R6", "us.RB", "us.L6"] },
  { order: 4, sessionId: "FDL-DS-SECOND-PRESS-8-V1", slug: "tweede-druk-8", family: "press-second", activeRole: "us.R6", supportRoles: ["us.RW", "us.L6", "us.RB"] },
  { order: 5, sessionId: "FDL-DS-DEPTH-COVER-RB-V1", slug: "rugdekking-rb", family: "press-depth", activeRole: "us.RB", supportRoles: ["us.RW", "us.R6", "us.RCV"] },
  { order: 6, sessionId: "FDL-DS-ST-STEER-PIN-V1", slug: "spits-stuurt", family: "press-steer", activeRole: "us.SP", supportRoles: ["us.RW", "us.10", "us.R6"] },
  { order: 7, sessionId: "FDL-DS-FAR-SIDE-SQUEEZE-V1", slug: "verre-zijde-knijpt", family: "press-farside", activeRole: "us.LW", supportRoles: ["us.L6", "us.LB", "us.SP"] },
  { order: 8, sessionId: "FDL-DS-PRESS-ABORT-RECOVER-V1", slug: "niet-doordrukken", family: "press-abort", activeRole: "us.RW", supportRoles: ["us.R6", "us.RB", "us.RCV"] },
  { order: 9, sessionId: "FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1", slug: "binnenkant-onder-druk", family: "press-pressure", activeRole: "us.RW", supportRoles: ["us.R6", "us.RB", "us.10"] },
  { order: 10, sessionId: "FDL-DS-COUNTERPRESS-FIRST-ACTION-V1", slug: "balverlies-direct-druk", family: "transition-counter", activeRole: "us.R6", supportRoles: ["us.RW", "us.10", "us.RB"] },
  { order: 11, sessionId: "FDL-DS-REST-DEFENCE-AFTER-BEATEN-V1", slug: "restverdediging", family: "transition-rest", activeRole: "us.RB", supportRoles: ["us.RCV", "us.R6", "us.GK"] },
  { order: 12, sessionId: "FDL-DS-FIRST-PASS-AFTER-WIN-V1", slug: "eerste-pass-na-win", family: "transition-firstpass", activeRole: "us.R6", supportRoles: ["us.L6", "us.10", "us.RW"] },
  { order: 13, sessionId: "FDL-DS-BUILD-UNDER-PRESS-SAFE-V1", slug: "opbouw-speel-veilig", family: "build-safe", activeRole: "us.RCV", supportRoles: ["us.LCV", "us.R6", "us.RB"] },
  { order: 14, sessionId: "FDL-DS-BUILD-BREAK-LINE-V1", slug: "opbouw-lijn-open", family: "build-break", activeRole: "us.LCV", supportRoles: ["us.R6", "us.10", "us.SP"] },
  { order: 15, sessionId: "FDL-DS-WIDE-1V1-FORCE-OUTSIDE-V1", slug: "flank-1v1-stuur-buiten", family: "flank-1v1", activeRole: "us.RB", supportRoles: ["us.RCV", "us.R6", "us.RW"] },
  { order: 16, sessionId: "FDL-DS-HALFSPACE-RECEIVE-NEXT-ACTION-V1", slug: "halfspace-volgende-actie", family: "possession-halfspace", activeRole: "us.10", supportRoles: ["us.RW", "us.SP", "us.R6"] },
  { order: 17, sessionId: "FDL-DS-SWITCH-PLAY-WHEN-V1", slug: "switch-nu", family: "possession-switch", activeRole: "us.L6", supportRoles: ["us.R6", "us.LW", "us.LB"] },
  { order: 18, sessionId: "FDL-DS-BOX-RUN-NEAR-POST-V1", slug: "voorzet-near-post", family: "final-nearpost", activeRole: "us.SP", supportRoles: ["us.RW", "us.10", "us.LW"] },
] as const;

export type DedicatedFilmDef = (typeof DEDICATED_SESSION_FILM_DEFS)[number];

export function filmIdsForSlug(slug: string) {
  return {
    live: `fdl-ds-${slug}-live`,
    good: `fdl-ds-${slug}-good`,
    bad: `fdl-ds-${slug}-bad`,
  } as const;
}

export function dedicatedPitchForSlug(slug: string, titles: {
  badTitle: string;
  goodTitle: string;
  badConsequence: string;
  goodConsequence: string;
}) {
  const ids = filmIdsForSlug(slug);
  return {
    liveSituationId: ids.live,
    goodSituationId: ids.good,
    badSituationId: ids.bad,
    ...titles,
  };
}

export const DEDICATED_FREEZE_MS = 6800;
export const DEDICATED_PREVIEW_MS = 2400;
