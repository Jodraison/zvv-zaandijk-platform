import {
  FORMATION_4231_US,
  FORMATION_4231_US_COMPACT,
  FORMATION_KW_R6,
  FORMATION_PRESS_BASE,
  KW_R6_OPPONENTS,
  PRESS_BALL,
  PRESS_OPPONENTS,
  usPlayersFromFormation,
  type TacticalOurPosition,
  type TacticalPlayerMarker,
  type TacticalPoint,
  type TacticalSituationDefinition,
  type TacticalSituationId,
} from "@/lib/academie/tactical-visual-system";
import {
  opponents4231MidBlock,
  opponents433BuildUp,
  opponents442MidBlock,
  PRESET_US_4231_PROGRESSION,
  type TacticalTeamShape,
} from "@/lib/academie/tactical-formation-presets";
import { CONNECTED_TEAM_AUTHORED } from "@/lib/academie/tactical-authored-connected-team";
import { KW_R6_AUTHORED } from "@/lib/academie/tactical-authored-kw-r6";
import { playersFromAuthoredPhase } from "@/lib/academie/tactical-authored-types";
import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";
import { connectedTeamDisplayLabel } from "@/lib/academie/tactical-connected-team-roles";
import {
  FDL_GS_INSIDE_CLOSE_SITUATION,
  FDL_GS_INSIDE_CLOSE_SITUATION_BAD,
  FDL_GS_INSIDE_CLOSE_SITUATION_GOOD,
} from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";
import { getDedicatedFilmRegistry } from "@/lib/decision-lab/films/dedicated/build-dedicated-films";

function authoredLabel(id: string): string {
  return academyDisplayRole(id);
}

function withPositions(
  base: Record<TacticalOurPosition, TacticalPoint>,
  overrides: Partial<Record<TacticalOurPosition, TacticalPoint>>,
): Record<TacticalOurPosition, TacticalPoint> {
  return { ...base, ...overrides };
}

function thickenOpponents(
  key: TacticalPlayerMarker[],
  preset: TacticalPlayerMarker[],
): TacticalPlayerMarker[] {
  const ids = new Set(key.map((p) => p.id));
  return [...key, ...preset.filter((p) => !ids.has(p.id))];
}

function opp(
  id: string,
  label: string,
  at: TacticalPoint,
  hasBall?: boolean,
): TacticalPlayerMarker {
  return { id, team: "opponent", label, at, ...(hasBall ? { hasBall: true } : {}) };
}

const US_BUILDUP: TacticalTeamShape = { formation: "4-2-3-1", phase: "build-up", direction: "left-to-right" };
const US_PROG: TacticalTeamShape = { formation: "4-2-3-1", phase: "progression", direction: "left-to-right" };
const US_PRESS: TacticalTeamShape = { formation: "4-2-3-1", phase: "high-press", direction: "left-to-right" };
const US_TRANS: TacticalTeamShape = { formation: "4-2-3-1", phase: "transition", direction: "left-to-right" };
const US_FINAL: TacticalTeamShape = { formation: "4-2-3-1", phase: "final-third", direction: "left-to-right" };
const OPP_433_BU: TacticalTeamShape = { formation: "4-3-3", phase: "build-up", direction: "right-to-left" };
const OPP_433_HP: TacticalTeamShape = { formation: "4-3-3", phase: "high-press", direction: "right-to-left" };
const OPP_442_MB: TacticalTeamShape = { formation: "4-4-2", phase: "mid-block", direction: "right-to-left" };
const OPP_442_HP: TacticalTeamShape = { formation: "4-4-2", phase: "high-press", direction: "right-to-left" };
const OPP_4231_MB: TacticalTeamShape = { formation: "4-2-3-1", phase: "mid-block", direction: "right-to-left" };

/**
 * Canonieke Academy-situaties — echte wedstrijdmomenten in 4-2-3-1.
 * Iedere situatie beantwoordt: bal / wie / wij / tegenstander / wat gebeurt er.
 */
export const TACTICAL_SITUATIONS: Record<TacticalSituationId, TacticalSituationDefinition> = {
  "connected-team": {
    id: "connected-team",
    eyebrow: "SITUATIE",
    title: "Wij bouwen samen op vanuit 4-2-3-1",
    subtitle: "Voorste, middelste en achterste linie blijven met elkaar verbonden — veld groot, zone 4-4-2 middenblok.",
    homeShape: { formation: "4-2-3-1", phase: "progression", direction: "left-to-right" },
    opponentShape: { formation: "4-4-2", phase: "mid-block", direction: "right-to-left" },
    players: playersFromAuthoredPhase(CONNECTED_TEAM_AUTHORED.phases[0]!, connectedTeamDisplayLabel),
    ball: CONNECTED_TEAM_AUTHORED.phases[0]!.ballAt,
    lines: [],
    zones: [],
  },

  "press-good": {
    id: "press-good",
    eyebrow: "GOED",
    title: "Team sluit aan achter de druk",
    subtitle: "RW zet eerste druk; 8, 6 en de lijn sluiten aan — één principe.",
    homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
    players: [...usPlayersFromFormation(FORMATION_PRESS_BASE), ...PRESS_OPPONENTS],
    ball: PRESS_BALL,
    // Identical start with press-bad: no static lines (film adds cues after trigger).
    lines: [],
    zones: [],
  },

  "press-bad": {
    id: "press-bad",
    eyebrow: "NIET GOED",
    title: "RW jaagt alleen door",
    subtitle: "Zelfde start — alleen RW jaagt; team sluit niet aan.",
    homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
    players: [...usPlayersFromFormation(FORMATION_PRESS_BASE), ...PRESS_OPPONENTS],
    ball: PRESS_BALL,
    lines: [],
    zones: [],
  },

  /** Golden Session only — ball starts at LCB; trigger pass to LB. */
  "fdl-gs-inside-close-live": FDL_GS_INSIDE_CLOSE_SITUATION,
  "fdl-gs-inside-close-good": FDL_GS_INSIDE_CLOSE_SITUATION_GOOD,
  "fdl-gs-inside-close-bad": FDL_GS_INSIDE_CLOSE_SITUATION_BAD,

  "solo-solve": {
    id: "solo-solve",
    eyebrow: "FOUT",
    title: "Linksbuiten stapt alleen uit",
    subtitle: "Bal bij hun 7 links — LW jaagt alleen; vrije 8 ontstaat centraal.",
    homeShape: US_PRESS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LW: { x: 52, y: 16 },
          LB: { x: 22, y: 22 },
          L6: { x: 30, y: 42 },
          "10": { x: 44, y: 52 },
          SP: { x: 70, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.7", "7", { x: 56, y: 14 }, true),
          opp("opp.8", "8", { x: 50, y: 40 }),
          opp("opp.9", "9", { x: 48, y: 56 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 56, y: 14 },
    lines: [
      { kind: "fault", from: { x: 44, y: 24 }, to: { x: 54, y: 16 } },
      { kind: "pass", from: { x: 56, y: 14 }, to: { x: 50, y: 38 }, dashed: true },
    ],
    zones: [{ x: 40, y: 32, w: 20, h: 28, label: "Vrije tegenstander" }],
  },

  "blind-run": {
    id: "blind-run",
    eyebrow: "FOUT",
    title: "Speelster rent blind op de bal af",
    subtitle: "RW rent recht op hun LB — bal speelt om haar heen; flank achter haar open.",
    homeShape: US_PROG,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RW: { x: 70, y: 80 },
          R6: { x: 40, y: 62 },
          RB: { x: 22, y: 78 },
          "10": { x: 48, y: 52 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.lb", "LB", { x: 78, y: 84 }, true),
          opp("opp.cb", "CB", { x: 82, y: 60 }),
          opp("opp.8", "8", { x: 60, y: 56 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 78, y: 84 },
    lines: [
      { kind: "fault", from: { x: 58, y: 78 }, to: { x: 76, y: 84 } },
      { kind: "pass", from: { x: 78, y: 84 }, to: { x: 60, y: 58 }, dashed: true },
    ],
    zones: [{ x: 50, y: 66, w: 24, h: 20, label: "Open ruimte" }],
  },

  "always-forward": {
    id: "always-forward",
    eyebrow: "FOUT",
    title: "LCV forceert een gesloten vooruitpass",
    subtitle: "Vooruitlijn dicht; veilige optie naar R6 blijft open.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_433_HP,
    players: [
      ...usPlayersFromFormation(FORMATION_4231_US, "LCV"),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 30, y: 48 }),
          opp("opp.11", "11", { x: 42, y: 28 }),
          opp("opp.10", "10", { x: 46, y: 52 }),
          opp("opp.6", "6", { x: 58, y: 44 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: FORMATION_4231_US.LCV,
    lines: [
      { kind: "fault", from: FORMATION_4231_US.LCV, to: FORMATION_4231_US.SP },
      { kind: "pass", from: FORMATION_4231_US.LCV, to: FORMATION_4231_US.R6, dashed: true },
      { kind: "pass", from: FORMATION_4231_US.LCV, to: FORMATION_4231_US.RCV, dashed: true },
    ],
    zones: [
      { x: 36, y: 36, w: 28, h: 28, label: "Gesloten passlijn" },
      { x: 28, y: 56, w: 18, h: 18, label: "Veilige optie" },
    ],
  },

  /** Zelfde start als solo-solve — LW met steun en timing. */
  "solo-support": {
    id: "solo-support",
    eyebrow: "BETER",
    title: "Links buiten start met steun en timing",
    subtitle: "Zelfde bal bij hun 7 — LW scant; LB/10 sluiten aan vóór de actie.",
    homeShape: US_PRESS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LW: { x: 52, y: 16 },
          LB: { x: 22, y: 22 },
          L6: { x: 30, y: 42 },
          "10": { x: 44, y: 52 },
          SP: { x: 70, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.7", "7", { x: 56, y: 14 }, true),
          opp("opp.8", "8", { x: 50, y: 40 }),
          opp("opp.9", "9", { x: 48, y: 56 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 56, y: 14 },
    lines: [
      { kind: "press", from: { x: 52, y: 16 }, to: { x: 56, y: 14 } },
      { kind: "run", from: { x: 22, y: 22 }, to: { x: 40, y: 18 } },
      { kind: "run", from: { x: 44, y: 52 }, to: { x: 48, y: 36 } },
      { kind: "pass", from: { x: 56, y: 14 }, to: { x: 50, y: 38 }, dashed: true },
    ],
    zones: [{ x: 40, y: 14, w: 24, h: 28, label: "Steun + timing" }],
  },

  /** Zelfde start als blind-run — druk met richting en rugdekking. */
  "blind-press": {
    id: "blind-press",
    eyebrow: "BETER",
    title: "Drukzetten met richting en rugdekking",
    subtitle: "Zelfde bal bij hun LB — RW wacht trigger; R6/RB sluiten aan.",
    homeShape: US_PROG,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RW: { x: 70, y: 80 },
          R6: { x: 40, y: 62 },
          RB: { x: 22, y: 78 },
          "10": { x: 48, y: 52 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.lb", "LB", { x: 78, y: 84 }, true),
          opp("opp.cb", "CB", { x: 82, y: 60 }),
          opp("opp.8", "8", { x: 60, y: 56 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 78, y: 84 },
    lines: [
      { kind: "press", from: { x: 70, y: 80 }, to: { x: 78, y: 84 } },
      { kind: "run", from: { x: 40, y: 62 }, to: { x: 58, y: 68 } },
      { kind: "run", from: { x: 22, y: 78 }, to: { x: 48, y: 82 } },
      { kind: "pass", from: { x: 78, y: 84 }, to: { x: 60, y: 58 }, dashed: true },
    ],
    zones: [{ x: 54, y: 62, w: 28, h: 24, label: "Compacte druk" }],
  },

  /** Zelfde start als always-forward — eerst verplaatsen. */
  "forward-relocate": {
    id: "forward-relocate",
    eyebrow: "BETER",
    title: "Eerst verplaatsen, daarna vooruit",
    subtitle: "Zelfde opbouw — LCV ziet gesloten lijn; speelt veilig; daarna opent vooruit.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_433_HP,
    players: [
      ...usPlayersFromFormation(FORMATION_4231_US, "LCV"),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 30, y: 48 }),
          opp("opp.11", "11", { x: 42, y: 28 }),
          opp("opp.10", "10", { x: 46, y: 52 }),
          opp("opp.6", "6", { x: 58, y: 44 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: FORMATION_4231_US.LCV,
    lines: [
      { kind: "fault", from: FORMATION_4231_US.LCV, to: FORMATION_4231_US.SP, dashed: true },
      { kind: "pass", from: FORMATION_4231_US.LCV, to: FORMATION_4231_US.R6 },
      { kind: "pass", from: FORMATION_4231_US.R6, to: FORMATION_4231_US["10"], dashed: true },
    ],
    zones: [
      { x: 36, y: 36, w: 28, h: 28, label: "Nog gesloten" },
      { x: 40, y: 48, w: 22, h: 18, label: "Nieuwe lijn" },
    ],
  },

  "buildup-gk": {
    id: "buildup-gk",
    eyebrow: "SITUATIE",
    title: "Onze keeper heeft de bal",
    subtitle: "LCV en RCV bieden steun; LB geeft breedte voor de opening.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_442_HP,
    players: [
      ...usPlayersFromFormation(FORMATION_4231_US, "GK"),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 28, y: 48 }),
          opp("opp.11", "11", { x: 32, y: 22 }),
          opp("opp.7", "7", { x: 32, y: 78 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: FORMATION_4231_US.GK,
    lines: [
      { kind: "pass", from: FORMATION_4231_US.GK, to: FORMATION_4231_US.LCV, dashed: true },
      { kind: "pass", from: FORMATION_4231_US.GK, to: FORMATION_4231_US.RCV, dashed: true },
      { kind: "pass", from: FORMATION_4231_US.GK, to: FORMATION_4231_US.LB, dashed: true },
      { kind: "run", from: FORMATION_4231_US.LB, to: { x: 24, y: 14 } },
    ],
  },

  "kw-r6-ball": {
    id: "kw-r6-ball",
    eyebrow: "SITUATIE",
    title: "Wij hebben de bal bij onze R6",
    subtitle: "Pass naar 10 lijkt open — 6/8 staan klaar om te onderscheppen.",
    homeShape: { formation: "4-2-3-1", phase: "progression", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "mid-block", direction: "right-to-left" },
    players: playersFromAuthoredPhase(KW_R6_AUTHORED.phases[0]!, authoredLabel),
    ball: KW_R6_AUTHORED.phases[0]!.ballAt,
    lines: [
      {
        kind: "pass",
        from: KW_R6_AUTHORED.phases[0]!.ballAt,
        to: KW_R6_AUTHORED.phases[0]!.usShape["us.10"]!.at,
        dashed: true,
      },
      {
        kind: "pass",
        from: KW_R6_AUTHORED.phases[0]!.ballAt,
        to: KW_R6_AUTHORED.phases[0]!.usShape["us.RB"]!.at,
        dashed: true,
      },
      {
        kind: "pass",
        from: KW_R6_AUTHORED.phases[0]!.ballAt,
        to: KW_R6_AUTHORED.phases[0]!.usShape["us.L6"]!.at,
        dashed: true,
      },
    ],
    zones: [],
  },

  "kw-choice-force": {
    id: "kw-choice-force",
    eyebrow: "KEUZE A",
    title: "Direct vooruit",
    subtitle: "In deze situatie: 6/10 controleren de lijn naar onze 10.",
    homeShape: { formation: "4-2-3-1", phase: "progression", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "mid-block", direction: "right-to-left" },
    players: [...usPlayersFromFormation(FORMATION_KW_R6, "R6"), ...KW_R6_OPPONENTS],
    ball: FORMATION_KW_R6.R6,
    lines: [
      { kind: "fault", from: FORMATION_KW_R6.R6, to: FORMATION_KW_R6["10"] },
      { kind: "press", from: { x: 64, y: 60 }, to: { x: 60, y: 52 } },
      { kind: "press", from: { x: 54, y: 50 }, to: { x: 58, y: 50 } },
    ],
    zones: [
      { x: 48, y: 48, w: 12, h: 10, label: "Onderschepping" },
      { x: 26, y: 52, w: 18, h: 20, label: "Risico" },
    ],
  },

  "kw-choice-relocate": {
    id: "kw-choice-relocate",
    eyebrow: "KEUZE B",
    title: "Eerst verplaatsen",
    subtitle: "Naar vrije RB — tegenstander schuift; ruimte naar RW kan groter.",
    homeShape: { formation: "4-2-3-1", phase: "progression", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "mid-block", direction: "right-to-left" },
    players: [...usPlayersFromFormation(FORMATION_KW_R6, "R6"), ...KW_R6_OPPONENTS],
    ball: FORMATION_KW_R6.R6,
    lines: [
      { kind: "pass", from: FORMATION_KW_R6.R6, to: FORMATION_KW_R6.RB },
      { kind: "pass", from: FORMATION_KW_R6.R6, to: FORMATION_KW_R6.L6, dashed: true },
      { kind: "run", from: FORMATION_KW_R6.RW, to: { x: 78, y: 74 } },
      { kind: "pass", from: FORMATION_KW_R6.RB, to: FORMATION_KW_R6.RW, dashed: true },
    ],
    zones: [{ x: 66, y: 64, w: 20, h: 18, label: "Ruimte" }],
  },

  "kw-moment-hold": {
    id: "kw-moment-hold",
    eyebrow: "KEUZE",
    title: "Vooruit of bal houden",
    subtitle: "LCV: 10 dicht — R6 vrij; daarna kan tegenstander verschuiven.",
    homeShape: US_PROG,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LCV: { x: 24, y: 40 },
          R6: { x: 42, y: 66 },
          "10": { x: 56, y: 46 },
          RW: { x: 72, y: 78 },
        }),
        "LCV",
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 32, y: 48 }),
          opp("opp.8", "8", { x: 48, y: 38 }),
          opp("opp.10", "10", { x: 54, y: 52 }),
          opp("opp.6", "6", { x: 46, y: 50 }),
          opp("opp.7", "7", { x: 62, y: 62 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 24, y: 40 },
    lines: [
      { kind: "fault", from: { x: 24, y: 40 }, to: { x: 56, y: 46 }, dashed: true },
      { kind: "pass", from: { x: 24, y: 40 }, to: { x: 42, y: 66 } },
      { kind: "pass", from: { x: 42, y: 66 }, to: { x: 72, y: 78 }, dashed: true },
    ],
    zones: [
      { x: 42, y: 34, w: 20, h: 24, label: "Gesloten lijn" },
      { x: 34, y: 60, w: 14, h: 14, label: "Vrije R6" },
      { x: 58, y: 68, w: 16, h: 16, label: "Daarna" },
    ],
  },

  "kw-moment-wing": {
    id: "kw-moment-wing",
    eyebrow: "KEUZE",
    title: "Actie of samenspelen",
    subtitle: "LW 1v1 — check verdediger, ruimte buitenom en steun binnenin.",
    homeShape: US_FINAL,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LW: { x: 70, y: 16 },
          LB: { x: 56, y: 8 },
          "10": { x: 58, y: 34 },
          L6: { x: 40, y: 36 },
          SP: { x: 72, y: 38 },
          RW: { x: 74, y: 72 },
        }),
        "LW",
      ),
      ...thickenOpponents(
        [
          opp("opp.rb", "RB", { x: 76, y: 22 }),
          opp("opp.cb", "CB", { x: 84, y: 34 }),
          opp("opp.6", "6", { x: 66, y: 38 }),
          opp("opp.cb2", "CB", { x: 88, y: 50 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 70, y: 16 },
    lines: [
      { kind: "run", from: { x: 70, y: 16 }, to: { x: 86, y: 12 } },
      { kind: "run", from: { x: 56, y: 8 }, to: { x: 78, y: 6 } },
      { kind: "pass", from: { x: 70, y: 16 }, to: { x: 58, y: 32 }, dashed: true },
      { kind: "pass", from: { x: 70, y: 16 }, to: { x: 78, y: 8 }, dashed: true },
    ],
    zones: [
      { x: 78, y: 6, w: 14, h: 14, label: "Ruimte" },
      { x: 52, y: 28, w: 14, h: 14, label: "Steun" },
    ],
  },

  "kw-moment-finish": {
    id: "kw-moment-finish",
    eyebrow: "KEUZE",
    title: "Schieten of doorspelen",
    subtitle: "10 tussen de linies — ruimte op doel of vrije RW/SP?",
    homeShape: US_FINAL,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 68, y: 48 },
          RW: { x: 78, y: 72 },
          LW: { x: 78, y: 24 },
          SP: { x: 72, y: 44 },
          R6: { x: 48, y: 56 },
          L6: { x: 48, y: 40 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.gk", "GK", { x: 94, y: 50 }),
          opp("opp.cbL", "CB", { x: 84, y: 36 }),
          opp("opp.cbR", "CB", { x: 84, y: 58 }),
          opp("opp.6", "6", { x: 72, y: 52 }),
          opp("opp.rb", "RB", { x: 80, y: 78 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 68, y: 48 },
    lines: [
      { kind: "pass", from: { x: 68, y: 48 }, to: { x: 90, y: 50 }, dashed: true },
      { kind: "pass", from: { x: 68, y: 48 }, to: { x: 78, y: 70 } },
      { kind: "pass", from: { x: 68, y: 48 }, to: { x: 86, y: 44 }, dashed: true },
    ],
    zones: [
      { x: 78, y: 40, w: 14, h: 20, label: "Blok" },
      { x: 72, y: 66, w: 14, h: 14, label: "Vrije RW" },
    ],
  },

  "ta-lcv-buildup": {
    id: "ta-lcv-buildup",
    eyebrow: "SITUATIE",
    title: "Onze LCV bouwt op onder druk",
    subtitle: "Korte steun, oplossing vooruit en bescherming achter de actie.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_433_HP,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LCV: { x: 22, y: 38 },
          LB: { x: 28, y: 14 },
          L6: { x: 36, y: 42 },
          "10": { x: 52, y: 36 },
          LW: { x: 66, y: 16 },
          R6: { x: 38, y: 62 },
          RCV: { x: 20, y: 58 },
          RB: { x: 26, y: 80 },
          RW: { x: 68, y: 78 },
          SP: { x: 72, y: 48 },
        }),
        "LCV",
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 34, y: 36 }),
          opp("opp.7", "7", { x: 40, y: 22 }),
          opp("opp.8", "8", { x: 48, y: 48 }),
          opp("opp.11", "11", { x: 56, y: 28 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 22, y: 38 },
    lines: [
      { kind: "pass", from: { x: 22, y: 38 }, to: { x: 36, y: 42 } },
      { kind: "pass", from: { x: 22, y: 38 }, to: { x: 52, y: 36 }, dashed: true },
      { kind: "pass", from: { x: 22, y: 38 }, to: { x: 28, y: 14 }, dashed: true },
      { kind: "run", from: { x: 52, y: 36 }, to: { x: 58, y: 30 } },
      { kind: "press", from: { x: 34, y: 36 }, to: { x: 26, y: 37 } },
    ],
    zones: [
      { x: 30, y: 38, w: 12, h: 12, label: "Korte steun" },
      { x: 48, y: 28, w: 12, h: 12, label: "Vooruit" },
      { x: 34, y: 56, w: 12, h: 12, label: "Balans" },
      { x: 60, y: 10, w: 12, h: 12, label: "Breedte" },
    ],
  },

  "ta-rb-alone": {
    id: "ta-rb-alone",
    eyebrow: "NIET GOED",
    title: "RB staat alleen",
    subtitle: "RW te hoog, R6 afgedekt, RCV te ver — één moeilijke optie.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RB: { x: 42, y: 82 },
          RW: { x: 72, y: 86 },
          R6: { x: 50, y: 60 },
          RCV: { x: 18, y: 70 },
          "10": { x: 58, y: 52 },
          SP: { x: 70, y: 50 },
          L6: { x: 34, y: 44 },
          LCV: { x: 18, y: 42 },
        }),
        "RB",
      ),
      ...thickenOpponents(
        [
          opp("opp.11", "11", { x: 50, y: 80 }),
          opp("opp.8", "8", { x: 52, y: 62 }),
          opp("opp.7", "7", { x: 64, y: 86 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 42, y: 82 },
    lines: [{ kind: "fault", from: { x: 42, y: 82 }, to: { x: 78, y: 88 }, dashed: true }],
    zones: [
      { x: 34, y: 72, w: 16, h: 16, label: "Alleen" },
      { x: 46, y: 54, w: 14, h: 14, label: "Afgedekt" },
    ],
  },

  "ta-rb-support": {
    id: "ta-rb-support",
    eyebrow: "GOED",
    title: "RB krijgt twee oplossingen",
    subtitle: "Veilig naar RCV; vooruit/combineer via RW — team coacht vóór.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RB: { x: 42, y: 82 },
          RW: { x: 60, y: 76 },
          R6: { x: 46, y: 64 },
          RCV: { x: 28, y: 72 },
          "10": { x: 56, y: 54 },
          SP: { x: 72, y: 50 },
          L6: { x: 34, y: 44 },
          LCV: { x: 18, y: 42 },
        }),
        "RB",
      ),
      ...thickenOpponents(
        [
          opp("opp.11", "11", { x: 50, y: 80 }),
          opp("opp.8", "8", { x: 58, y: 62 }),
          opp("opp.7", "7", { x: 68, y: 78 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 42, y: 82 },
    lines: [
      { kind: "pass", from: { x: 42, y: 82 }, to: { x: 28, y: 72 } },
      { kind: "pass", from: { x: 42, y: 82 }, to: { x: 60, y: 76 }, dashed: true },
      { kind: "run", from: { x: 60, y: 76 }, to: { x: 70, y: 80 } },
    ],
    zones: [
      { x: 24, y: 64, w: 12, h: 12, label: "Veilig" },
      { x: 54, y: 70, w: 12, h: 12, label: "Vooruit" },
    ],
  },

  "ta-moment-scan": {
    id: "ta-moment-scan",
    eyebrow: "SITUATIE",
    title: "Voor de bal komt",
    subtitle: "Bal onderweg — 8 in rug; zonder scan geen veilige keuze.",
    homeShape: US_BUILDUP,
    opponentShape: OPP_433_HP,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          LCV: { x: 24, y: 40 },
          L6: { x: 42, y: 42 },
          "10": { x: 56, y: 36 },
          R6: { x: 42, y: 60 },
          LB: { x: 28, y: 18 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 32, y: 34 }),
          opp("opp.8", "8", { x: 46, y: 52 }),
          opp("opp.10", "10", { x: 54, y: 44 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 33, y: 41 },
    lines: [
      { kind: "pass", from: { x: 24, y: 40 }, to: { x: 42, y: 42 } },
      { kind: "press", from: { x: 46, y: 52 }, to: { x: 43, y: 45 } },
      { kind: "pass", from: { x: 42, y: 42 }, to: { x: 24, y: 40 }, dashed: true },
      { kind: "pass", from: { x: 42, y: 42 }, to: { x: 56, y: 36 }, dashed: true },
    ],
    zones: [
      { x: 36, y: 28, w: 14, h: 14, label: "Scan" },
      { x: 20, y: 48, w: 12, h: 12, label: "Terug" },
      { x: 50, y: 28, w: 12, h: 12, label: "Kaats" },
    ],
  },

  "ta-moment-after-pass": {
    id: "ta-moment-after-pass",
    eyebrow: "SITUATIE",
    title: "Na je pass",
    subtitle: "10 → LW, dan 10 naar binnen voor kaats — nieuwe combinatie.",
    homeShape: US_PROG,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 66, y: 38 },
          LW: { x: 74, y: 20 },
          L6: { x: 46, y: 42 },
          R6: { x: 48, y: 58 },
          LB: { x: 54, y: 14 },
          SP: { x: 72, y: 42 },
        }),
        "LW",
      ),
      ...thickenOpponents(
        [
          opp("opp.rb", "RB", { x: 78, y: 26 }),
          opp("opp.6", "6", { x: 68, y: 48 }),
          opp("opp.cb", "CB", { x: 84, y: 38 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 74, y: 20 },
    lines: [
      { kind: "pass", from: { x: 56, y: 48 }, to: { x: 74, y: 20 } },
      { kind: "run", from: { x: 56, y: 48 }, to: { x: 66, y: 38 } },
      { kind: "pass", from: { x: 74, y: 20 }, to: { x: 66, y: 38 }, dashed: true },
      { kind: "run", from: { x: 46, y: 42 }, to: { x: 52, y: 40 } },
    ],
    zones: [
      { x: 60, y: 32, w: 12, h: 12, label: "Kaats" },
      { x: 42, y: 50, w: 12, h: 12, label: "Balans" },
    ],
  },

  "ta-moment-press": {
    id: "ta-moment-press",
    eyebrow: "SITUATIE",
    title: "Druk is nooit alleen",
    subtitle: "SP start — 10 sluit hun 6; vleugels en 6’en maken veld klein.",
    homeShape: US_PRESS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_PRESS_BASE, {
          SP: { x: 74, y: 40 },
          "10": { x: 64, y: 50 },
          LW: { x: 68, y: 28 },
          RW: { x: 68, y: 64 },
          L6: { x: 50, y: 40 },
          R6: { x: 50, y: 58 },
          LCV: { x: 30, y: 40 },
          RCV: { x: 30, y: 58 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.cb", "CB", { x: 84, y: 38 }, true),
          opp("opp.cb2", "CB", { x: 84, y: 60 }),
          opp("opp.6", "6", { x: 74, y: 52 }),
          opp("opp.gk", "GK", { x: 94, y: 50 }),
        ],
        opponents433BuildUp("cbL"),
      ),
    ],
    ball: { x: 84, y: 38 },
    lines: [
      { kind: "press", from: { x: 74, y: 40 }, to: { x: 82, y: 39 } },
      { kind: "press", from: { x: 64, y: 50 }, to: { x: 72, y: 52 } },
      { kind: "run", from: { x: 68, y: 28 }, to: { x: 74, y: 34 } },
      { kind: "run", from: { x: 68, y: 64 }, to: { x: 74, y: 58 } },
      { kind: "run", from: { x: 50, y: 40 }, to: { x: 58, y: 44 } },
      { kind: "run", from: { x: 50, y: 58 }, to: { x: 58, y: 54 } },
    ],
    zones: [
      { x: 66, y: 44, w: 14, h: 14, label: "Gesloten" },
      { x: 52, y: 30, w: 22, h: 36, label: "Klein" },
    ],
  },

  "gr-10-loss": {
    id: "gr-10-loss",
    eyebrow: "SITUATIE",
    title: "Onze 10 verliest de bal",
    subtitle: "De fout is voorbij. De volgende actie begint meteen.",
    homeShape: US_TRANS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 48, y: 46 },
          L6: { x: 40, y: 36 },
          R6: { x: 40, y: 58 },
          LCV: { x: 22, y: 38 },
          RCV: { x: 22, y: 58 },
          LW: { x: 62, y: 22 },
          RW: { x: 64, y: 74 },
          SP: { x: 72, y: 48 },
          LB: { x: 26, y: 18 },
          RB: { x: 26, y: 80 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 56, y: 44 }, true),
          opp("opp.9", "9", { x: 66, y: 40 }),
          opp("opp.10", "10", { x: 60, y: 56 }),
          opp("opp.7", "7", { x: 70, y: 28 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 56, y: 44 },
    lines: [
      { kind: "fault", from: { x: 48, y: 46 }, to: { x: 56, y: 44 }, dashed: true },
      { kind: "run", from: { x: 48, y: 46 }, to: { x: 54, y: 44 } },
      { kind: "press", from: { x: 40, y: 36 }, to: { x: 52, y: 42 } },
      { kind: "run", from: { x: 40, y: 58 }, to: { x: 48, y: 52 } },
      { kind: "run", from: { x: 22, y: 38 }, to: { x: 30, y: 40 } },
      { kind: "run", from: { x: 22, y: 58 }, to: { x: 30, y: 54 } },
    ],
    zones: [
      { x: 50, y: 38, w: 14, h: 12, label: "Balverlies" },
      { x: 46, y: 48, w: 12, h: 10, label: "Herstel" },
      { x: 36, y: 28, w: 12, h: 12, label: "Vertraag" },
      { x: 24, y: 42, w: 14, h: 16, label: "Aansluiten" },
    ],
  },

  "gr-l6-freeze": {
    id: "gr-l6-freeze",
    eyebrow: "NIET GOED",
    title: "Blijven staan en verwijten",
    subtitle: "L6 blijft staan; niemand vertraagt — tegenstander loopt door.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          L6: { x: 44, y: 42 },
          R6: { x: 38, y: 62 },
          "10": { x: 52, y: 56 },
          LCV: { x: 20, y: 36 },
          RCV: { x: 20, y: 60 },
          LW: { x: 58, y: 20 },
          RW: { x: 60, y: 78 },
          SP: { x: 66, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 58, y: 40 }, true),
          opp("opp.9", "9", { x: 70, y: 44 }),
          opp("opp.10", "10", { x: 64, y: 56 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 58, y: 40 },
    lines: [
      { kind: "fault", from: { x: 44, y: 42 }, to: { x: 58, y: 40 }, dashed: true },
      { kind: "fault", from: { x: 52, y: 56 }, to: { x: 44, y: 42 }, dashed: true },
      { kind: "run", from: { x: 58, y: 40 }, to: { x: 70, y: 42 } },
    ],
    zones: [
      { x: 38, y: 34, w: 14, h: 14, label: "Blijft staan" },
      { x: 48, y: 58, w: 12, h: 12, label: "Wijst" },
      { x: 62, y: 32, w: 16, h: 16, label: "Open" },
    ],
  },

  "gr-l6-recover": {
    id: "gr-l6-recover",
    eyebrow: "GOED",
    title: "Herstellen en helpen",
    subtitle: "L6 sprint terug; dichtstbijzijnde vertraagt; team sluit aan.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          L6: { x: 50, y: 40 },
          R6: { x: 44, y: 54 },
          "10": { x: 48, y: 50 },
          LCV: { x: 28, y: 38 },
          RCV: { x: 28, y: 56 },
          LW: { x: 56, y: 24 },
          RW: { x: 56, y: 72 },
          SP: { x: 66, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 58, y: 40 }, true),
          opp("opp.9", "9", { x: 70, y: 44 }),
          opp("opp.10", "10", { x: 64, y: 56 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 58, y: 40 },
    lines: [
      { kind: "run", from: { x: 42, y: 42 }, to: { x: 50, y: 40 } },
      { kind: "press", from: { x: 48, y: 50 }, to: { x: 56, y: 42 } },
      { kind: "run", from: { x: 38, y: 58 }, to: { x: 44, y: 54 } },
      { kind: "run", from: { x: 20, y: 36 }, to: { x: 28, y: 38 } },
      { kind: "run", from: { x: 20, y: 60 }, to: { x: 28, y: 56 } },
    ],
    zones: [
      { x: 44, y: 32, w: 12, h: 12, label: "Herstel" },
      { x: 50, y: 46, w: 12, h: 12, label: "Vertraag" },
      { x: 26, y: 40, w: 14, h: 16, label: "Aansluiten" },
    ],
  },

  "gr-moment-teammate": {
    id: "gr-moment-teammate",
    eyebrow: "VERKEERD",
    title: "Blijven staan en wijzen",
    subtitle: "RCV verliest — armen omhoog; niemand herstelt.",
    homeShape: US_TRANS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RCV: { x: 28, y: 58 },
          RB: { x: 34, y: 78 },
          R6: { x: 42, y: 62 },
          LCV: { x: 24, y: 40 },
          L6: { x: 38, y: 42 },
          "10": { x: 50, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 48, y: 52 }, true),
          opp("opp.10", "10", { x: 58, y: 44 }),
          opp("opp.7", "7", { x: 56, y: 68 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 48, y: 52 },
    lines: [
      { kind: "fault", from: { x: 28, y: 58 }, to: { x: 48, y: 52 }, dashed: true },
      { kind: "pass", from: { x: 48, y: 52 }, to: { x: 58, y: 44 }, dashed: true },
    ],
    zones: [
      { x: 36, y: 48, w: 14, h: 12, label: "Balverlies" },
      { x: 52, y: 40, w: 14, h: 14, label: "Vrij" },
    ],
  },

  "gr-moment-teammate-good": {
    id: "gr-moment-teammate-good",
    eyebrow: "GEWENST",
    title: "Herstellen en helpen",
    subtitle: "Zelfde balverlies — sprint terug, vertraag, sluit; daarna kort coachen.",
    homeShape: US_TRANS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RCV: { x: 28, y: 58 },
          RB: { x: 34, y: 78 },
          R6: { x: 42, y: 62 },
          LCV: { x: 24, y: 40 },
          L6: { x: 38, y: 42 },
          "10": { x: 50, y: 48 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 48, y: 52 }, true),
          opp("opp.10", "10", { x: 58, y: 44 }),
          opp("opp.7", "7", { x: 56, y: 68 }),
        ],
        opponents433BuildUp(),
      ),
    ],
    ball: { x: 48, y: 52 },
    lines: [
      { kind: "fault", from: { x: 28, y: 58 }, to: { x: 48, y: 52 }, dashed: true },
      { kind: "run", from: { x: 34, y: 78 }, to: { x: 42, y: 64 } },
      { kind: "press", from: { x: 42, y: 62 }, to: { x: 48, y: 54 } },
      { kind: "run", from: { x: 24, y: 40 }, to: { x: 32, y: 46 } },
    ],
    zones: [
      { x: 36, y: 48, w: 14, h: 12, label: "Balverlies" },
      { x: 36, y: 68, w: 12, h: 12, label: "Herstel" },
      { x: 52, y: 40, w: 14, h: 14, label: "Gevaar" },
    ],
  },

  "gr-moment-sub": {
    id: "gr-moment-sub",
    eyebrow: "VERKEERD",
    title: "Boos wegdraaien",
    subtitle: "Je wordt gewisseld — afhaken; geen info; geen steun.",
    homeShape: US_PROG,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RW: { x: 8, y: 88 },
          RB: { x: 22, y: 82 },
          R6: { x: 36, y: 68 },
          "10": { x: 50, y: 52 },
          RCV: { x: 20, y: 60 },
          SP: { x: 72, y: 50 },
        }),
      ),
      { id: "us.in", team: "us", label: "IN", at: { x: 4, y: 72 } },
      ...thickenOpponents(
        [
          opp("opp.11", "11", { x: 62, y: 78 }),
          opp("opp.8", "8", { x: 58, y: 56 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 50, y: 52 },
    lines: [{ kind: "fault", from: { x: 22, y: 82 }, to: { x: 8, y: 92 }, dashed: true }],
    zones: [
      { x: 2, y: 84, w: 14, h: 10, label: "Afhaken" },
      { x: 28, y: 72, w: 14, h: 12, label: "Gat" },
    ],
  },

  "gr-moment-sub-good": {
    id: "gr-moment-sub-good",
    eyebrow: "GEWENST",
    title: "Accepteer en blijf steunen",
    subtitle: "Zelfde wissel — info aan IN, steun vanaf de kant; gesprek later.",
    homeShape: US_PROG,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RW: { x: 8, y: 88 },
          RB: { x: 22, y: 82 },
          R6: { x: 36, y: 68 },
          "10": { x: 50, y: 52 },
          RCV: { x: 20, y: 60 },
          SP: { x: 72, y: 50 },
        }),
      ),
      { id: "us.in", team: "us", label: "IN", at: { x: 4, y: 72 } },
      ...thickenOpponents(
        [
          opp("opp.11", "11", { x: 62, y: 78 }),
          opp("opp.8", "8", { x: 58, y: 56 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 50, y: 52 },
    lines: [
      { kind: "run", from: { x: 22, y: 82 }, to: { x: 8, y: 88 } },
      { kind: "pass", from: { x: 8, y: 88 }, to: { x: 4, y: 72 }, dashed: true },
    ],
    zones: [
      { x: 2, y: 78, w: 14, h: 14, label: "Accepteer" },
      { x: 2, y: 62, w: 12, h: 12, label: "Info" },
      { x: 28, y: 72, w: 14, h: 12, label: "Steun" },
    ],
  },

  "gr-moment-disagree": {
    id: "gr-moment-disagree",
    eyebrow: "VERKEERD",
    title: "Discussie tijdens het spel",
    subtitle: "Oneens — blijven staan en discussiëren terwijl het spel doorloopt.",
    homeShape: US_PROG,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 54, y: 48 },
          L6: { x: 40, y: 40 },
          R6: { x: 40, y: 58 },
          LW: { x: 66, y: 24 },
          SP: { x: 72, y: 48 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 66, y: 54 }),
          opp("opp.8", "8", { x: 60, y: 34 }),
          opp("opp.10", "10", { x: 62, y: 48 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 54, y: 48 },
    lines: [{ kind: "fault", from: { x: 54, y: 48 }, to: { x: 44, y: 58 }, dashed: true }],
    zones: [{ x: 40, y: 52, w: 14, h: 12, label: "Discussie" }],
  },

  "gr-moment-disagree-good": {
    id: "gr-moment-disagree-good",
    eyebrow: "GEWENST",
    title: "Taak uitvoeren, later praten",
    subtitle: "Zelfde oneensheid — voer de taak uit; praat wanneer stil.",
    homeShape: US_PROG,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 54, y: 48 },
          L6: { x: 40, y: 40 },
          R6: { x: 40, y: 58 },
          LW: { x: 66, y: 24 },
          SP: { x: 72, y: 48 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 66, y: 54 }),
          opp("opp.8", "8", { x: 60, y: 34 }),
          opp("opp.10", "10", { x: 62, y: 48 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 54, y: 48 },
    lines: [
      { kind: "run", from: { x: 54, y: 48 }, to: { x: 62, y: 44 } },
      { kind: "pass", from: { x: 62, y: 44 }, to: { x: 72, y: 48 }, dashed: true },
    ],
    zones: [
      { x: 42, y: 58, w: 14, h: 12, label: "Later" },
      { x: 56, y: 36, w: 14, h: 12, label: "Door" },
    ],
  },

  "in-r6-win": {
    id: "in-r6-win",
    eyebrow: "SITUATIE",
    title: "Wij winnen de bal bij onze R6",
    subtitle: "De tegenstander staat open. Dit is het moment om samen te versnellen.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          R6: { x: 46, y: 56 },
          L6: { x: 38, y: 42 },
          "10": { x: 58, y: 48 },
          RW: { x: 70, y: 74 },
          LW: { x: 66, y: 24 },
          SP: { x: 72, y: 46 },
          RB: { x: 52, y: 82 },
          RCV: { x: 24, y: 58 },
          LCV: { x: 22, y: 40 },
          LB: { x: 26, y: 20 },
        }),
        "R6",
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 40, y: 52 }),
          opp("opp.6", "6", { x: 54, y: 62 }),
          opp("opp.cb", "CB", { x: 82, y: 38 }),
          opp("opp.cb2", "CB", { x: 84, y: 58 }),
          opp("opp.rb", "RB", { x: 78, y: 78 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 46, y: 56 },
    lines: [
      { kind: "pass", from: { x: 46, y: 56 }, to: { x: 70, y: 74 } },
      { kind: "pass", from: { x: 46, y: 56 }, to: { x: 58, y: 48 }, dashed: true },
      { kind: "run", from: { x: 70, y: 74 }, to: { x: 82, y: 72 } },
      { kind: "run", from: { x: 58, y: 48 }, to: { x: 68, y: 52 } },
      { kind: "run", from: { x: 52, y: 82 }, to: { x: 62, y: 78 } },
      { kind: "run", from: { x: 78, y: 46 }, to: { x: 84, y: 44 } },
    ],
    zones: [
      { x: 40, y: 48, w: 12, h: 12, label: "Balwinst" },
      { x: 72, y: 64, w: 14, h: 14, label: "Ruimte" },
      { x: 64, y: 68, w: 12, h: 10, label: "Versnel" },
      { x: 54, y: 42, w: 14, h: 12, label: "Aansluiten" },
      { x: 30, y: 36, w: 12, h: 14, label: "Balans" },
    ],
  },

  "in-10-late": {
    id: "in-10-late",
    eyebrow: "NIET GOED",
    title: "Te laat versnellen",
    subtitle: "Ruimte was er — wij wachten tot zij weer georganiseerd staat.",
    homeShape: US_TRANS,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 58, y: 48 },
          LW: { x: 62, y: 28 },
          RW: { x: 64, y: 72 },
          SP: { x: 70, y: 50 },
          L6: { x: 42, y: 42 },
          R6: { x: 42, y: 58 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 66, y: 46 }),
          opp("opp.8", "8", { x: 68, y: 58 }),
          opp("opp.cb", "CB", { x: 80, y: 40 }),
          opp("opp.cb2", "CB", { x: 80, y: 60 }),
          opp("opp.rb", "RB", { x: 76, y: 74 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 58, y: 48 },
    lines: [
      { kind: "run", from: { x: 66, y: 46 }, to: { x: 62, y: 48 } },
      { kind: "run", from: { x: 68, y: 58 }, to: { x: 64, y: 54 } },
      { kind: "run", from: { x: 76, y: 74 }, to: { x: 70, y: 70 } },
    ],
    zones: [
      { x: 52, y: 40, w: 14, h: 14, label: "Te lang" },
      { x: 58, y: 22, w: 12, h: 12, label: "Stil" },
      { x: 68, y: 44, w: 16, h: 20, label: "Hersteld" },
    ],
  },

  "in-10-tempo": {
    id: "in-10-tempo",
    eyebrow: "GOED",
    title: "Samen op het juiste moment",
    subtitle: "Voordeel herkend — tempo omhoog vóór hun herstel.",
    homeShape: US_TRANS,
    opponentShape: OPP_4231_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 58, y: 48 },
          LW: { x: 72, y: 26 },
          RW: { x: 74, y: 72 },
          SP: { x: 72, y: 48 },
          R6: { x: 50, y: 56 },
          L6: { x: 42, y: 42 },
          RB: { x: 48, y: 78 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 62, y: 56 }),
          opp("opp.8", "8", { x: 54, y: 40 }),
          opp("opp.cb", "CB", { x: 86, y: 36 }),
          opp("opp.cb2", "CB", { x: 86, y: 60 }),
          opp("opp.rb", "RB", { x: 82, y: 78 }),
        ],
        opponents4231MidBlock(),
      ),
    ],
    ball: { x: 58, y: 48 },
    lines: [
      { kind: "pass", from: { x: 58, y: 48 }, to: { x: 74, y: 72 } },
      { kind: "pass", from: { x: 58, y: 48 }, to: { x: 80, y: 48 }, dashed: true },
      { kind: "run", from: { x: 64, y: 28 }, to: { x: 72, y: 26 } },
      { kind: "run", from: { x: 64, y: 72 }, to: { x: 74, y: 72 } },
      { kind: "run", from: { x: 70, y: 50 }, to: { x: 80, y: 48 } },
      { kind: "run", from: { x: 42, y: 58 }, to: { x: 50, y: 56 } },
    ],
    zones: [
      { x: 52, y: 40, w: 12, h: 12, label: "Vooruit" },
      { x: 70, y: 64, w: 12, h: 12, label: "Versnel" },
      { x: 46, y: 50, w: 12, h: 12, label: "Aansluiten" },
      { x: 36, y: 36, w: 12, h: 12, label: "Balans" },
    ],
  },

  "in-moment-turnover": {
    id: "in-moment-turnover",
    eyebrow: "SITUATIE",
    title: "Balwinst en ruimte",
    subtitle: "L6 onderschept — ruimte bestaat maar enkele seconden.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          L6: { x: 48, y: 42 },
          "10": { x: 58, y: 36 },
          LW: { x: 70, y: 22 },
          R6: { x: 46, y: 58 },
          SP: { x: 72, y: 46 },
          LCV: { x: 28, y: 40 },
        }),
        "L6",
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 40, y: 36 }),
          opp("opp.10", "10", { x: 56, y: 34 }),
          opp("opp.7", "7", { x: 64, y: 28 }),
          opp("opp.cb", "CB", { x: 84, y: 40 }),
          opp("opp.lcm", "CM", { x: 68, y: 50 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 48, y: 42 },
    lines: [
      { kind: "pass", from: { x: 48, y: 42 }, to: { x: 72, y: 22 } },
      { kind: "pass", from: { x: 48, y: 42 }, to: { x: 58, y: 36 }, dashed: true },
      { kind: "run", from: { x: 58, y: 36 }, to: { x: 66, y: 34 } },
      { kind: "run", from: { x: 72, y: 22 }, to: { x: 82, y: 24 } },
      { kind: "run", from: { x: 46, y: 58 }, to: { x: 54, y: 52 } },
    ],
    zones: [
      { x: 42, y: 34, w: 12, h: 12, label: "Balwinst" },
      { x: 68, y: 14, w: 14, h: 14, label: "Ruimte" },
      { x: 56, y: 36, w: 12, h: 12, label: "Versnel" },
    ],
  },

  "in-moment-press": {
    id: "in-moment-press",
    eyebrow: "SITUATIE",
    title: "Drukzetten",
    subtitle: "Slechte pass naar hun RCV — trigger om intensiteit omhoog te zetten.",
    homeShape: US_PRESS,
    opponentShape: OPP_433_BU,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_PRESS_BASE, {
          SP: { x: 74, y: 58 },
          LW: { x: 72, y: 42 },
          "10": { x: 62, y: 52 },
          RW: { x: 68, y: 72 },
          L6: { x: 48, y: 44 },
          R6: { x: 48, y: 60 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.rcv", "RCV", { x: 88, y: 64 }, true),
          opp("opp.lcv", "LCV", { x: 88, y: 36 }),
          opp("opp.rb", "RB", { x: 90, y: 78 }),
          opp("opp.6", "6", { x: 74, y: 52 }),
        ],
        opponents433BuildUp("cbR"),
      ),
    ],
    ball: { x: 88, y: 64 },
    lines: [
      { kind: "press", from: { x: 74, y: 58 }, to: { x: 84, y: 61 } },
      { kind: "press", from: { x: 72, y: 42 }, to: { x: 88, y: 74 } },
      { kind: "press", from: { x: 62, y: 52 }, to: { x: 72, y: 52 } },
      { kind: "run", from: { x: 48, y: 44 }, to: { x: 56, y: 48 } },
      { kind: "run", from: { x: 48, y: 60 }, to: { x: 56, y: 58 } },
    ],
    zones: [
      { x: 78, y: 52, w: 12, h: 12, label: "Trigger" },
      { x: 68, y: 36, w: 12, h: 12, label: "Sluit" },
      { x: 58, y: 46, w: 12, h: 12, label: "Door" },
    ],
  },

  "in-moment-rest": {
    id: "in-moment-rest",
    eyebrow: "SITUATIE",
    title: "Geen voordeel — wel rust",
    subtitle: "Compact blok; vooruitlijnen dicht — verplaats en wacht.",
    homeShape: US_PROG,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          RCV: { x: 28, y: 58 },
          RB: { x: 36, y: 78 },
          R6: { x: 42, y: 60 },
          "10": { x: 54, y: 48 },
          RW: { x: 64, y: 74 },
          LW: { x: 62, y: 26 },
          SP: { x: 68, y: 50 },
          LCV: { x: 26, y: 40 },
          L6: { x: 40, y: 42 },
        }),
        "RCV",
      ),
      ...thickenOpponents(
        [
          opp("opp.9", "9", { x: 48, y: 50 }),
          opp("opp.8", "8", { x: 54, y: 40 }),
          opp("opp.10", "10", { x: 54, y: 60 }),
          opp("opp.7", "7", { x: 60, y: 68 }),
          opp("opp.11", "11", { x: 58, y: 32 }),
          opp("opp.6", "6", { x: 56, y: 50 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 28, y: 58 },
    lines: [
      { kind: "pass", from: { x: 28, y: 58 }, to: { x: 36, y: 78 } },
      { kind: "pass", from: { x: 28, y: 58 }, to: { x: 42, y: 60 }, dashed: true },
      { kind: "fault", from: { x: 28, y: 58 }, to: { x: 54, y: 48 }, dashed: true },
    ],
    zones: [
      { x: 48, y: 38, w: 16, h: 28, label: "Gesloten" },
      { x: 32, y: 70, w: 12, h: 12, label: "Veilig" },
      { x: 22, y: 50, w: 12, h: 12, label: "Rust" },
    ],
  },

  "me-spits-miss": {
    id: "me-spits-miss",
    eyebrow: "SITUATIE",
    title: "Onze spits mist een grote kans",
    subtitle: "De kans is voorbij. De wedstrijd gaat door — herfocus.",
    homeShape: US_FINAL,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          SP: { x: 72, y: 48 },
          "10": { x: 58, y: 46 },
          LW: { x: 66, y: 28 },
          RW: { x: 66, y: 70 },
          L6: { x: 44, y: 40 },
          R6: { x: 44, y: 58 },
          LCV: { x: 26, y: 40 },
          RCV: { x: 26, y: 58 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.gk", "GK", { x: 94, y: 50 }),
          opp("opp.cb", "CB", { x: 82, y: 42 }, true),
          opp("opp.cb2", "CB", { x: 84, y: 60 }),
          opp("opp.6", "6", { x: 74, y: 52 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 82, y: 42 },
    lines: [
      { kind: "fault", from: { x: 86, y: 48 }, to: { x: 92, y: 42 }, dashed: true },
      { kind: "run", from: { x: 78, y: 48 }, to: { x: 72, y: 48 } },
      { kind: "press", from: { x: 72, y: 48 }, to: { x: 80, y: 44 } },
      { kind: "run", from: { x: 58, y: 46 }, to: { x: 66, y: 48 } },
      { kind: "run", from: { x: 44, y: 40 }, to: { x: 52, y: 44 } },
      { kind: "run", from: { x: 44, y: 58 }, to: { x: 52, y: 54 } },
    ],
    zones: [
      { x: 84, y: 36, w: 12, h: 12, label: "Gemiste kans" },
      { x: 68, y: 40, w: 12, h: 12, label: "Herfocus" },
      { x: 72, y: 52, w: 14, h: 12, label: "Volgende actie" },
      { x: 48, y: 40, w: 14, h: 16, label: "Samen" },
    ],
  },

  "me-10-hang": {
    id: "me-10-hang",
    eyebrow: "NIET GOED",
    title: "Blijven hangen na balverlies",
    subtitle: "Discussie en stilstand — positie kwijt, gevaar groeit.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 54, y: 48 },
          L6: { x: 40, y: 40 },
          R6: { x: 40, y: 60 },
          LW: { x: 62, y: 28 },
          RW: { x: 62, y: 72 },
          SP: { x: 66, y: 48 },
          LCV: { x: 22, y: 40 },
          RCV: { x: 22, y: 58 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 62, y: 46 }, true),
          opp("opp.9", "9", { x: 72, y: 42 }),
          opp("opp.10", "10", { x: 68, y: 58 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 62, y: 46 },
    lines: [
      { kind: "fault", from: { x: 54, y: 48 }, to: { x: 62, y: 46 }, dashed: true },
      { kind: "fault", from: { x: 54, y: 48 }, to: { x: 48, y: 58 }, dashed: true },
      { kind: "run", from: { x: 62, y: 46 }, to: { x: 72, y: 44 } },
    ],
    zones: [
      { x: 48, y: 40, w: 12, h: 12, label: "Hangt" },
      { x: 44, y: 54, w: 12, h: 12, label: "Discussie" },
      { x: 66, y: 36, w: 14, h: 14, label: "Open" },
    ],
  },

  "me-10-refocus": {
    id: "me-10-refocus",
    eyebrow: "GOED",
    title: "Accepteer en herfocus",
    subtitle: "Sprint terug, sluit aan, coach — nieuwe situatie.",
    homeShape: US_TRANS,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          "10": { x: 58, y: 46 },
          L6: { x: 46, y: 40 },
          R6: { x: 46, y: 56 },
          LW: { x: 60, y: 28 },
          RW: { x: 60, y: 70 },
          SP: { x: 66, y: 48 },
          LCV: { x: 28, y: 40 },
          RCV: { x: 28, y: 56 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.8", "8", { x: 62, y: 46 }, true),
          opp("opp.9", "9", { x: 72, y: 42 }),
          opp("opp.10", "10", { x: 68, y: 58 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 62, y: 46 },
    lines: [
      { kind: "run", from: { x: 50, y: 48 }, to: { x: 58, y: 46 } },
      { kind: "press", from: { x: 58, y: 46 }, to: { x: 62, y: 46 } },
      { kind: "run", from: { x: 40, y: 40 }, to: { x: 46, y: 40 } },
      { kind: "run", from: { x: 40, y: 60 }, to: { x: 46, y: 56 } },
      { kind: "run", from: { x: 22, y: 40 }, to: { x: 28, y: 40 } },
      { kind: "run", from: { x: 22, y: 58 }, to: { x: 28, y: 56 } },
    ],
    zones: [
      { x: 52, y: 38, w: 12, h: 12, label: "Accepteer" },
      { x: 54, y: 50, w: 12, h: 12, label: "Herfocus" },
      { x: 40, y: 44, w: 14, h: 14, label: "Aansluiten" },
    ],
  },

  "me-moment-chance": {
    id: "me-moment-chance",
    eyebrow: "SITUATIE",
    title: "Gemiste kans",
    subtitle: "Eerste reactie: druk zetten — niet blijven staan.",
    homeShape: US_FINAL,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          SP: { x: 72, y: 46 },
          "10": { x: 60, y: 48 },
          LW: { x: 68, y: 28 },
          RW: { x: 68, y: 68 },
        }),
      ),
      ...thickenOpponents(
        [
          opp("opp.gk", "GK", { x: 94, y: 50 }),
          opp("opp.cb", "CB", { x: 84, y: 44 }, true),
          opp("opp.cb2", "CB", { x: 84, y: 58 }),
          opp("opp.6", "6", { x: 76, y: 52 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 84, y: 44 },
    lines: [
      { kind: "press", from: { x: 74, y: 46 }, to: { x: 82, y: 45 } },
      { kind: "run", from: { x: 60, y: 48 }, to: { x: 68, y: 50 } },
      { kind: "run", from: { x: 68, y: 28 }, to: { x: 76, y: 36 } },
    ],
    zones: [
      { x: 86, y: 36, w: 10, h: 10, label: "Mis" },
      { x: 70, y: 40, w: 12, h: 12, label: "Druk" },
      { x: 62, y: 52, w: 12, h: 12, label: "Volgende" },
    ],
  },

  "me-moment-concede": {
    id: "me-moment-concede",
    eyebrow: "SITUATIE",
    title: "Tegengoal",
    subtitle: "Stand verandert — afspraken blijven hetzelfde.",
    homeShape: US_PROG,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US_COMPACT, {
          "10": { x: 52, y: 48 },
          L6: { x: 40, y: 40 },
          R6: { x: 40, y: 58 },
          SP: { x: 72, y: 48 },
          LW: { x: 64, y: 28 },
          RW: { x: 64, y: 70 },
        }),
        "10",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 60, y: 50 }),
          opp("opp.8", "8", { x: 56, y: 38 }),
          opp("opp.cb", "CB", { x: 80, y: 42 }),
          opp("opp.cb2", "CB", { x: 80, y: 58 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 52, y: 48 },
    lines: [
      { kind: "pass", from: { x: 52, y: 48 }, to: { x: 64, y: 28 } },
      { kind: "pass", from: { x: 52, y: 48 }, to: { x: 40, y: 40 }, dashed: true },
      { kind: "run", from: { x: 40, y: 58 }, to: { x: 48, y: 54 } },
      { kind: "run", from: { x: 72, y: 48 }, to: { x: 78, y: 46 } },
    ],
    zones: [
      { x: 46, y: 40, w: 12, h: 12, label: "Blijf" },
      { x: 58, y: 22, w: 12, h: 12, label: "Uitvoeren" },
      { x: 36, y: 50, w: 12, h: 12, label: "Samen" },
    ],
  },

  "me-moment-late": {
    id: "me-moment-late",
    eyebrow: "SITUATIE",
    title: "Laatste vijf minuten",
    subtitle: "2-1 achter — geen paniek, wel gecontroleerd risico.",
    homeShape: US_PROG,
    opponentShape: OPP_442_MB,
    players: [
      ...usPlayersFromFormation(
        withPositions(FORMATION_4231_US, {
          R6: { x: 48, y: 56 },
          "10": { x: 62, y: 48 },
          RW: { x: 74, y: 70 },
          SP: { x: 72, y: 46 },
          LW: { x: 72, y: 26 },
          L6: { x: 42, y: 42 },
          RB: { x: 50, y: 80 },
          RCV: { x: 28, y: 58 },
        }),
        "R6",
      ),
      ...thickenOpponents(
        [
          opp("opp.6", "6", { x: 58, y: 52 }),
          opp("opp.8", "8", { x: 66, y: 40 }),
          opp("opp.cb", "CB", { x: 84, y: 38 }),
          opp("opp.cb2", "CB", { x: 84, y: 58 }),
          opp("opp.rb", "RB", { x: 80, y: 74 }),
        ],
        opponents442MidBlock(),
      ),
    ],
    ball: { x: 48, y: 56 },
    lines: [
      { kind: "pass", from: { x: 48, y: 56 }, to: { x: 62, y: 48 } },
      { kind: "pass", from: { x: 62, y: 48 }, to: { x: 74, y: 70 }, dashed: true },
      { kind: "run", from: { x: 74, y: 70 }, to: { x: 82, y: 68 } },
      { kind: "run", from: { x: 80, y: 46 }, to: { x: 86, y: 44 } },
      { kind: "run", from: { x: 42, y: 42 }, to: { x: 50, y: 46 } },
    ],
    zones: [
      { x: 42, y: 48, w: 12, h: 12, label: "Rust" },
      { x: 68, y: 62, w: 12, h: 12, label: "Risico" },
      { x: 36, y: 36, w: 12, h: 12, label: "Balans" },
    ],
  },
};

export function getTacticalSituation(id: string): TacticalSituationDefinition | undefined {
  if (id in TACTICAL_SITUATIONS) {
    return TACTICAL_SITUATIONS[id as TacticalSituationId];
  }
  return getDedicatedFilmRegistry().situations[id];
}
