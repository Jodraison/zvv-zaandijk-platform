import type { ClubDatabase } from "@/types";
import type { MatchSubstitutionInput } from "@/lib/validations/match-substitutions";
import type { MatchLineupPayload } from "@/lib/validations/match-lineup";

/** Bepaal wie op het veld staat vóór een wissel (basis + eerdere wissels). */
export function computeOnFieldBeforeSubstitution(
  lineup: MatchLineupPayload,
  substitutions: MatchSubstitutionInput[],
  subIndex: number,
): Set<string> {
  const starters = lineup.filter((e) => e.role === "starter").map((e) => e.player_id);
  const onField = new Set(starters);
  const indexed = substitutions.map((s, index) => ({ ...s, index }));
  const sorted = [...indexed].sort((a, b) => a.minute - b.minute || a.index - b.index);

  for (const sub of sorted) {
    if (sub.index === subIndex) break;
    onField.delete(sub.player_out_id);
    onField.add(sub.player_in_id);
  }
  return onField;
}

export function validateMatchSubstitutions(
  db: ClubDatabase,
  selectedPlayerIds: string[],
  lineup: MatchLineupPayload,
  substitutions: MatchSubstitutionInput[],
): { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  const sel = new Set(selectedPlayerIds);
  const seen = new Set<string>();
  const indexed = substitutions.map((s, index) => ({ ...s, index }));
  const sorted = [...indexed].sort((a, b) => a.minute - b.minute || a.index - b.index);

  for (const sub of sorted) {
    const path = `substitutions.${sub.index}`;

    if (!db.players.some((p) => p.id === sub.player_in_id)) {
      return {
        ok: false,
        error: "Onbekende speelster erin bij wissel.",
        fieldErrors: { [path]: ["Speelster erin bestaat niet."] },
      };
    }
    if (!db.players.some((p) => p.id === sub.player_out_id)) {
      return {
        ok: false,
        error: "Onbekende speelster eruit bij wissel.",
        fieldErrors: { [path]: ["Speelster eruit bestaat niet."] },
      };
    }

    if (sub.player_in_id === sub.player_out_id) {
      return {
        ok: false,
        error: "Speelster erin en eruit mogen niet dezelfde zijn.",
        fieldErrors: { [path]: ["Kies twee verschillende speelsters."] },
      };
    }

    if (!sel.has(sub.player_in_id)) {
      return {
        ok: false,
        error: "Wissels alleen voor speelsters in de wedstrijdselectie.",
        fieldErrors: { [path]: ["Speelster erin niet in selectie."] },
      };
    }
    if (!sel.has(sub.player_out_id)) {
      return {
        ok: false,
        error: "Wissels alleen voor speelsters in de wedstrijdselectie.",
        fieldErrors: { [path]: ["Speelster eruit niet in selectie."] },
      };
    }

    const key = `${sub.player_in_id}:${sub.player_out_id}:${sub.minute}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: "Dubbele identieke wissel.",
        fieldErrors: {
          substitutions: ["Elke wissel (erin, eruit, minuut) mag maar één keer voorkomen."],
        },
      };
    }
    seen.add(key);

    const onField = computeOnFieldBeforeSubstitution(lineup, substitutions, sub.index);
    if (!onField.has(sub.player_out_id)) {
      return {
        ok: false,
        error: "Speelster eruit staat niet op het veld op dit moment.",
        fieldErrors: { [path]: ["Speelster eruit moet in de basis staan of eerder zijn ingewisseld."] },
      };
    }
    if (onField.has(sub.player_in_id)) {
      return {
        ok: false,
        error: "Speelster erin staat al op het veld.",
        fieldErrors: { [path]: ["Speelster erin mag nog niet op het veld staan."] },
      };
    }
  }

  return { ok: true };
}
