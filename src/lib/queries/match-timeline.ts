import type { ClubDatabase } from "@/types";
import type { MatchCardEventInput } from "@/lib/validations/match-events";

export type MatchTimelineSubstitution = {
  playerInId: string;
  playerInName: string;
  playerOutId: string;
  playerOutName: string;
};

export type MatchTimelinePosChange = {
  playerId: string;
  playerName: string;
  fromSlot: string;
  toSlot: string;
};

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
    }
  | {
      kind: "tactical_moment";
      minute: number;
      sortOrder: number;
      substitutions: MatchTimelineSubstitution[];
      positionChanges: MatchTimelinePosChange[];
    };

function playerName(db: ClubDatabase, playerId: string): string {
  return db.players.find((p) => p.id === playerId)?.full_name ?? "—";
}

/** Chronologische wedstrijdgebeurtenissen (doelpunten, kaarten, wisselmomenten) voor publieke weergave. */
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

  const shapeRows = buildTacticalTimeline(db, matchId);

  return [...goals, ...cards, ...shapeRows].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    if (a.kind === "goal" && b.kind === "goal") return a.sortOrder - b.sortOrder;
    if (
      (a.kind === "substitution" || a.kind === "tactical_moment") &&
      (b.kind === "substitution" || b.kind === "tactical_moment")
    ) {
      return a.sortOrder - b.sortOrder;
    }
    const order = { goal: 0, yellow_card: 1, red_card: 2, substitution: 3, tactical_moment: 3 };
    return order[a.kind] - order[b.kind];
  });
}

function buildTacticalTimeline(db: ClubDatabase, matchId: string): MatchTimelineRow[] {
  const subs = (db.match_substitutions ?? []).filter((e) => e.match_id === matchId);
  const pos = (db.match_position_changes ?? []).filter((e) => e.match_id === matchId);
  type Bucket = {
    minute: number;
    sortOrder: number;
    substitutions: MatchTimelineSubstitution[];
    positionChanges: MatchTimelinePosChange[];
  };
  const buckets = new Map<string, Bucket>();
  const order: string[] = [];

  const keyFor = (minute: number, groupId: string | null | undefined, fallback: string) => {
    const g = groupId?.trim();
    return g ? `${minute}::${g}` : `${minute}::${fallback}`;
  };

  const ensure = (key: string, minute: number, sortOrder: number) => {
    let b = buckets.get(key);
    if (!b) {
      b = { minute, sortOrder, substitutions: [], positionChanges: [] };
      buckets.set(key, b);
      order.push(key);
    }
    return b;
  };

  const sortedSubs = [...subs].sort(
    (a, b) => a.minute - b.minute || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id),
  );
  for (const [i, s] of sortedSubs.entries()) {
    const key = keyFor(s.minute, s.change_group_id, `sub-${s.id}`);
    const b = ensure(key, s.minute, s.sort_order ?? i);
    b.substitutions.push({
      playerInId: s.player_in_id,
      playerInName: playerName(db, s.player_in_id),
      playerOutId: s.player_out_id,
      playerOutName: playerName(db, s.player_out_id),
    });
  }

  const sortedPos = [...pos].sort(
    (a, b) => a.minute - b.minute || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id),
  );
  for (const c of sortedPos) {
    const explicit = c.change_group_id?.trim();
    let key = explicit ? keyFor(c.minute, explicit, `pos-${c.id}`) : null;
    if (!key) {
      const ungroupedSubs = sortedSubs.filter((s) => s.minute === c.minute && !s.change_group_id?.trim());
      if (ungroupedSubs.length === 1) {
        key = keyFor(c.minute, null, `sub-${ungroupedSubs[0]!.id}`);
      } else {
        key = keyFor(c.minute, null, `ungrouped-pos-${c.minute}`);
      }
    }
    const b = ensure(key, c.minute, c.sort_order ?? 0);
    b.positionChanges.push({
      playerId: c.player_id,
      playerName: playerName(db, c.player_id),
      fromSlot: c.from_slot,
      toSlot: c.to_slot,
    });
  }

  return order.map((k) => {
    const b = buckets.get(k)!;
    if (b.substitutions.length === 1 && b.positionChanges.length === 0) {
      const s = b.substitutions[0]!;
      return {
        kind: "substitution" as const,
        minute: b.minute,
        sortOrder: b.sortOrder,
        playerInId: s.playerInId,
        playerInName: s.playerInName,
        playerOutId: s.playerOutId,
        playerOutName: s.playerOutName,
      };
    }
    return {
      kind: "tactical_moment" as const,
      minute: b.minute,
      sortOrder: b.sortOrder,
      substitutions: b.substitutions,
      positionChanges: b.positionChanges,
    };
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
