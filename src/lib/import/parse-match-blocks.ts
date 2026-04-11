import { parseScoreForZaandijk } from "@/lib/import/zaandijk-score";

/**
 * Tekstformaat — blokken gescheiden door een regel die alleen === bevat.
 *
 * Verplicht per blok:
 * - kickoff: ISO (of date: alias)
 * - opponent: tekst
 * - home: true | false | thuis | uit
 * - score: X-Y  (thuis: Zaandijk–tegenstander; uit: tegenstander–Zaandijk)
 * - mvp: naam
 *
 * Sectie goals: (na regel "goals:")
 * - Nienke (3)     → drie doelpunten zonder assist
 * - Emma           → één doelpunt
 * - Emma + Mandy   → één doelpunt Emma, assist Mandy
 * - Pitou en Kyra  → idem met "en"
 *
 * Optioneel:
 * squad: naam1, naam2   (speelsters op de wedstrijd met 0 goals/0 assists in de stats)
 */

export type ParsedGoalLine =
  | { type: "bulk"; scorerRaw: string; count: number }
  | { type: "pair"; scorerRaw: string; assistRaw: string };

export type ParsedMatchBlock = {
  /** Optioneel vast id voor idempotente her-import */
  explicitMatchId?: string;
  kickoffRaw: string;
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  mvpRaw: string;
  goalLines: ParsedGoalLine[];
  squadRaw: string[];
  rawBlock: string;
};

function parseBoolHome(v: string): boolean | null {
  const s = v.trim().toLowerCase();
  if (s === "true" || s === "thuis" || s === "home" || s === "1" || s === "ja") return true;
  if (s === "false" || s === "uit" || s === "away" || s === "0" || s === "nee") return false;
  return null;
}

function parseGoalLine(line: string): ParsedGoalLine | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;

  const bulk = t.match(/^(.+?)\s*\(\s*(\d+)\s*\)\s*$/);
  if (bulk) {
    const count = Number(bulk[2]);
    if (!Number.isFinite(count) || count < 1 || count > 99) return null;
    return { type: "bulk", scorerRaw: bulk[1].trim(), count };
  }

  const pair = t.match(/^(.+?)\s*(?:\+|\s+en\s+)\s*(.+)$/i);
  if (pair) {
    return { type: "pair", scorerRaw: pair[1].trim(), assistRaw: pair[2].trim() };
  }

  return { type: "bulk", scorerRaw: t, count: 1 };
}

export function splitMatchBlocks(fullText: string): string[] {
  return fullText
    .split(/^\s*===\s*$/gm)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

export function parseMatchBlock(block: string): ParsedMatchBlock | { error: string } {
  const lines = block.split(/\n/).map((l) => l.replace(/\r$/, ""));
  const rawBlock = block;

  let explicitMatchId: string | undefined;
  let kickoffRaw = "";
  let opponent = "";
  let isHome: boolean | null = null;
  let scoreRaw = "";
  let goalsFor = -1;
  let goalsAgainst = -1;
  let mvpRaw = "";
  const goalLines: ParsedGoalLine[] = [];
  const squadRaw: string[] = [];

  let section: "none" | "goals" | "squad" = "none";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const keyMatch = trimmed.match(/^([a-zA-Z_]+)\s*:\s*(.*)$/);
    if (keyMatch && section === "none") {
      const key = keyMatch[1].toLowerCase();
      const val = keyMatch[2].trim();

      if (key === "id" || key === "match_id") {
        explicitMatchId = val.trim();
        continue;
      }
      if (key === "kickoff" || key === "date" || key === "datetime") {
        kickoffRaw = val;
        continue;
      }
      if (key === "opponent" || key === "tegenstander") {
        opponent = val;
        continue;
      }
      if (key === "home" || key === "thuis" || key === "is_home") {
        isHome = parseBoolHome(val);
        continue;
      }
      if (key === "score" || key === "uitslag") {
        scoreRaw = val;
        continue;
      }
      if (key === "mvp" || key === "wotm") {
        mvpRaw = val;
        continue;
      }
      if (key === "goals" || key === "doelpunten") {
        section = "goals";
        if (val) {
          const g = parseGoalLine(val);
          if (g) goalLines.push(g);
        }
        continue;
      }
      if (key === "squad" || key === "selectie") {
        section = "squad";
        if (val) {
          val.split(",").forEach((x) => {
            const s = x.trim();
            if (s) squadRaw.push(s);
          });
        }
        continue;
      }
      return { error: `Onbekende sleutel: "${key}"` };
    }

    if (section === "goals") {
      const nextKey = trimmed.match(/^([a-zA-Z_]+)\s*:/);
      if (nextKey) {
        const k = nextKey[1].toLowerCase();
        if (k === "squad" || k === "selectie") {
          section = "squad";
          const rest = trimmed.replace(/^[^:]+:\s*/, "").trim();
          if (rest) {
            rest.split(",").forEach((x) => {
              const s = x.trim();
              if (s) squadRaw.push(s);
            });
          }
          continue;
        }
        return { error: `Onverwachte sleutel in goals-sectie: "${trimmed}"` };
      }
      const g = parseGoalLine(trimmed);
      if (g) goalLines.push(g);
      continue;
    }

    if (section === "squad") {
      const nextKey = trimmed.match(/^([a-zA-Z_]+)\s*:/);
      if (nextKey) {
        return { error: `Onverwachte sleutel in squad-sectie: "${trimmed}"` };
      }
      trimmed.split(",").forEach((x) => {
        const s = x.trim();
        if (s) squadRaw.push(s);
      });
      continue;
    }
  }

  if (!kickoffRaw) return { error: "kickoff / date ontbreekt" };
  if (!opponent) return { error: "opponent ontbreekt" };
  if (isHome === null) return { error: "home ontbreekt (true/false of thuis/uit)" };
  if (!scoreRaw.trim()) return { error: "score ontbreekt" };
  const scParsed = parseScoreForZaandijk(scoreRaw, isHome);
  if (!scParsed) return { error: `Ongeldige score: "${scoreRaw}"` };
  goalsFor = scParsed.goalsFor;
  goalsAgainst = scParsed.goalsAgainst;
  if (!mvpRaw.trim()) return { error: "mvp ontbreekt" };
  if (goalsFor === 0) {
    if (goalLines.length > 0) return { error: "goals_for is 0 maar goals-sectie is niet leeg" };
  } else if (goalLines.length === 0) {
    return { error: "geen doelpunten (goals: sectie leeg)" };
  }

  return {
    explicitMatchId,
    kickoffRaw,
    opponent,
    isHome,
    goalsFor,
    goalsAgainst,
    mvpRaw,
    goalLines,
    squadRaw,
    rawBlock,
  };
}

export function countGoalsFromLines(lines: ParsedGoalLine[]): number {
  let n = 0;
  for (const l of lines) {
    if (l.type === "bulk") n += l.count;
    else n += 1;
  }
  return n;
}
