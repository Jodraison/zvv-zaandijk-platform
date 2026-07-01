import type { ClubDatabase } from "@/types";
import type { MatchCardEventInput } from "@/lib/validations/match-events";

export type MatchTimelineRow =
  | {
      kind: "goal";
      minute: number;
      sortOrder: number;
      scorerPlayerId: string;
      scorerName: string;
      assistPlayerId: string | null;
      assistName: string | null;
    }
  | {
      kind: "yellow_card" | "red_card";
      minute: number;
      playerId: string;
      playerName: string;
    }
  | {
      kind: "substitution";
      minute: number;
      sortOrder: number;
      playerInId: string;
      playerInName: string;
      playerOutId: string;
      playerOutName: string;
    };

function playerName(db: ClubDatabase, playerId: string): string {
  return db.players.find((p) => p.id === playerId)?.full_name ?? "—";
}

/** Chronologische wedstrijdgebeurtenissen (doelpunten, kaarten, wissels) voor publieke weergave. */
export function buildMatchTimeline(db: ClubDatabase, matchId: string): MatchTimelineRow[] {
  const goals = db.match_goal_events
    .filter((e) => e.match_id === matchId)
    .map((e) => ({
      kind: "goal" as const,
      minute: e.minute,
      sortOrder: e.sort_order,
      scorerPlayerId: e.scorer_player_id,
      scorerName: playerName(db, e.scorer_player_id),
      assistPlayerId: e.assist_player_id,
      assistName: e.assist_player_id ? playerName(db, e.assist_player_id) : null,
    }));

  const cards = db.match_card_events
    .filter((e) => e.match_id === matchId)
    .map((e) => ({
      kind: e.card_type === "yellow" ? ("yellow_card" as const) : ("red_card" as const),
      minute: e.minute,
      playerId: e.player_id,
      playerName: playerName(db, e.player_id),
    }));

  const substitutions = db.match_substitutions
    .filter((e) => e.match_id === matchId)
    .map((e, sortOrder) => ({
      kind: "substitution" as const,
      minute: e.minute,
      sortOrder,
      playerInId: e.player_in_id,
      playerInName: playerName(db, e.player_in_id),
      playerOutId: e.player_out_id,
      playerOutName: playerName(db, e.player_out_id),
    }));

  return [...goals, ...cards, ...substitutions].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    if (a.kind === "goal" && b.kind === "goal") return a.sortOrder - b.sortOrder;
    if (a.kind === "substitution" && b.kind === "substitution") return a.sortOrder - b.sortOrder;
    const order = { goal: 0, yellow_card: 1, red_card: 2, substitution: 3 };
    return order[a.kind] - order[b.kind];
  });
}

export function getMatchSubstitutionInitial(
  db: ClubDatabase,
  matchId: string,
): { player_in_id: string; player_out_id: string; minute: number }[] {
  return db.match_substitutions
    .filter((e) => e.match_id === matchId)
    .sort((a, b) => a.minute - b.minute || a.player_out_id.localeCompare(b.player_out_id))
    .map((e) => ({
      player_in_id: e.player_in_id,
      player_out_id: e.player_out_id,
      minute: e.minute,
    }));
}

export function getMatchCardInitial(
  db: ClubDatabase,
  matchId: string,
): { player_id: string; card_type: "yellow" | "red"; minute: number }[] {
  return db.match_card_events
    .filter((e) => e.match_id === matchId)
    .sort((a, b) => a.minute - b.minute || a.player_id.localeCompare(b.player_id))
    .map((e) => ({
      player_id: e.player_id,
      card_type: e.card_type,
      minute: e.minute,
    }));
}

export function validateMatchCardEvents(
  db: ClubDatabase,
  selectedPlayerIds: string[],
  cards: MatchCardEventInput[],
): { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  const sel = new Set(selectedPlayerIds);
  const seen = new Set<string>();

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const path = `cards.${i}`;

    if (!db.players.some((p) => p.id === c.player_id)) {
      return {
        ok: false,
        error: "Onbekende speelster bij kaart.",
        fieldErrors: { [path]: ["Speelster bestaat niet."] },
      };
    }

    if (!sel.has(c.player_id)) {
      return {
        ok: false,
        error: "Kaarten alleen voor speelsters in de wedstrijdselectie.",
        fieldErrors: { [path]: ["Speelster niet in selectie."] },
      };
    }

    const key = `${c.player_id}:${c.card_type}:${c.minute}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: "Dubbele kaart op dezelfde minuut.",
        fieldErrors: { cards: ["Elke kaart-combinatie (speelster, type, minuut) mag maar één keer voorkomen."] },
      };
    }
    seen.add(key);
  }

  return { ok: true };
}
