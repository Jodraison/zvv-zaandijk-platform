/**
 * Canonieke reconstructie van wedstrijdopstelling op een minuut.
 */
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";
import {
  FORMATION_SLOT_CODES,
  type FormationSlotCode,
  emptyFormationMap,
  isFormationSlotCode,
} from "@/lib/match/formation-4231";

export type MatchShapeAtMinute = {
  minute: number;
  slots: Record<FormationSlotCode, string | null>;
  onPitch: string[];
  bench: string[];
  substitutedOut: string[];
  vacantSlots: FormationSlotCode[];
  warnings: string[];
};

type TimelineEvent =
  | { kind: "sub"; minute: number; stoppage: number; sort: number; id: string; sub: MatchSubstitution }
  | {
      kind: "pos";
      minute: number;
      stoppage: number;
      sort: number;
      id: string;
      change: MatchPositionChange;
    };

function eventOrder(a: TimelineEvent, b: TimelineEvent): number {
  if (a.minute !== b.minute) return a.minute - b.minute;
  if (a.stoppage !== b.stoppage) return a.stoppage - b.stoppage;
  if (a.sort !== b.sort) return a.sort - b.sort;
  return a.id.localeCompare(b.id);
}

function starterSlots(entries: MatchLineupEntry[]): {
  slots: Record<FormationSlotCode, string | null>;
  warnings: string[];
} {
  const slots = emptyFormationMap();
  const warnings: string[] = [];
  const starters = entries.filter((e) => e.role === "starter");
  for (const e of starters) {
    const code = e.position?.trim() ?? "";
    if (!isFormationSlotCode(code)) {
      warnings.push(`Starter zonder geldig slot: ${e.player_id}`);
      continue;
    }
    if (slots[code]) {
      warnings.push(`Dubbel bezet slot ${code}`);
      continue;
    }
    slots[code] = e.player_id;
  }
  return { slots, warnings };
}

export function getMatchShapeAtMinute(
  db: ClubDatabase,
  matchId: string,
  minute: number,
): MatchShapeAtMinute {
  const entries = db.match_lineup_entries.filter((e) => e.match_id === matchId);
  const { slots, warnings } = starterSlots(entries);
  const bench = new Set(entries.filter((e) => e.role === "bench").map((e) => e.player_id));
  const substitutedOut = new Set<string>();

  const subs = (db.match_substitutions ?? []).filter((s) => s.match_id === matchId);
  const posChanges = (db.match_position_changes ?? []).filter((c) => c.match_id === matchId);

  const events: TimelineEvent[] = [
    ...subs.map((sub) => ({
      kind: "sub" as const,
      minute: sub.minute,
      stoppage: sub.stoppage_time ?? 0,
      sort: sub.sort_order ?? 0,
      id: sub.id,
      sub,
    })),
    ...posChanges.map((change) => ({
      kind: "pos" as const,
      minute: change.minute,
      stoppage: change.stoppage_time ?? 0,
      sort: change.sort_order ?? 0,
      id: change.id,
      change,
    })),
  ].sort(eventOrder);

  for (const ev of events) {
    // Inclusive: “op minuut N” = na alle events met minute <= N (deterministisch gesorteerd).
    if (ev.minute > minute) break;

    if (ev.kind === "pos") {
      const from = ev.change.from_slot;
      const to = ev.change.to_slot;
      if (!isFormationSlotCode(from) || !isFormationSlotCode(to)) {
        warnings.push(`Ongeldige positiewijziging ${ev.id}`);
        continue;
      }
      if (slots[from] !== ev.change.player_id) {
        warnings.push(`Positiewijziging ${ev.id}: speelster stond niet op ${from}`);
      }
      const occupantTo = slots[to];
      slots[from] = occupantTo;
      slots[to] = ev.change.player_id;
    } else {
      const outId = ev.sub.player_out_id;
      const inId = ev.sub.player_in_id;
      let outSlot: FormationSlotCode | null = null;
      for (const code of FORMATION_SLOT_CODES) {
        if (slots[code] === outId) {
          outSlot = code;
          break;
        }
      }
      const toSlot =
        (ev.sub.to_slot && isFormationSlotCode(ev.sub.to_slot) ? ev.sub.to_slot : null) ?? outSlot;
      if (!toSlot) {
        warnings.push(`Wissel ${ev.id}: geen slot voor inkomende speelster`);
        continue;
      }
      if (outSlot) slots[outSlot] = null;
      if (slots[toSlot] && slots[toSlot] !== outId) {
        // vacated differently — clear previous
      }
      slots[toSlot] = inId;
      substitutedOut.add(outId);
      bench.delete(inId);
      bench.add(outId);
    }
  }

  const onPitch = FORMATION_SLOT_CODES.map((c) => slots[c]).filter((id): id is string => !!id);
  const vacantSlots = FORMATION_SLOT_CODES.filter((c) => !slots[c]);

  return {
    minute,
    slots,
    onPitch,
    bench: [...bench],
    substitutedOut: [...substitutedOut],
    vacantSlots,
    warnings,
  };
}

export type ParticipationInterval = {
  player_id: string;
  from_minute: number;
  to_minute: number | null;
};

/**
 * Speelintervallen tot en met `untilMinute` (null = nog actief op het veld).
 * Ondersteunt vrij wisselen (meerdere periodes per speelster).
 */
export function computeParticipationIntervals(
  db: ClubDatabase,
  matchId: string,
  untilMinute = 90,
): ParticipationInterval[] {
  const start = getMatchShapeAtMinute(db, matchId, 0);
  const open = new Map<string, number>();
  for (const id of start.onPitch) open.set(id, 0);

  const subs = (db.match_substitutions ?? [])
    .filter((s) => s.match_id === matchId && s.minute <= untilMinute)
    .sort(
      (a, b) =>
        a.minute - b.minute ||
        (a.stoppage_time ?? 0) - (b.stoppage_time ?? 0) ||
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.id.localeCompare(b.id),
    );

  const closed: ParticipationInterval[] = [];
  for (const sub of subs) {
    const from = open.get(sub.player_out_id);
    if (from != null) {
      closed.push({ player_id: sub.player_out_id, from_minute: from, to_minute: sub.minute });
      open.delete(sub.player_out_id);
    }
    if (!open.has(sub.player_in_id)) open.set(sub.player_in_id, sub.minute);
  }

  for (const [player_id, from_minute] of open) {
    closed.push({ player_id, from_minute, to_minute: null });
  }
  return closed.sort(
    (a, b) => a.from_minute - b.from_minute || a.player_id.localeCompare(b.player_id),
  );
}

export function deriveStarterIds(db: ClubDatabase, matchId: string): Set<string> {
  return new Set(getMatchShapeAtMinute(db, matchId, 0).onPitch);
}

/** Heeft invalbeurt: minstens één entry-event na minuut 0. */
export function deriveCameOnAsSub(db: ClubDatabase, matchId: string, playerId: string): boolean {
  return (db.match_substitutions ?? []).some(
    (s) => s.match_id === matchId && s.player_in_id === playerId && s.minute > 0,
  );
}

export function sumPlayingMinutes(
  intervals: ParticipationInterval[],
  playerId: string,
  matchEndMinute = 90,
): number {
  let total = 0;
  for (const iv of intervals.filter((x) => x.player_id === playerId)) {
    const end = iv.to_minute ?? matchEndMinute;
    total += Math.max(0, end - iv.from_minute);
  }
  return total;
}

export function validateConfirmedFormation(
  slotToPlayer: Partial<Record<FormationSlotCode, string | null>>,
  benchIds: string[],
): { ok: true } | { ok: false; error: string } {
  const starters: string[] = [];
  for (const code of FORMATION_SLOT_CODES) {
    const id = slotToPlayer[code];
    if (!id) return { ok: false, error: `Slot ${code} is leeg — elf starters vereist.` };
    starters.push(id);
  }
  if (starters.length !== 11) return { ok: false, error: "Exact elf starters vereist." };
  if (new Set(starters).size !== 11) return { ok: false, error: "Dubbele speelster in de basis." };
  if (!slotToPlayer.GK) return { ok: false, error: "Keeper is verplicht." };
  for (const b of benchIds) {
    if (starters.includes(b)) return { ok: false, error: "Starter kan niet ook wissel zijn." };
  }
  return { ok: true };
}
