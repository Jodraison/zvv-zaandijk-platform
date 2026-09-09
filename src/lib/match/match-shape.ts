/**
 * Canonieke reconstructie van wedstrijdopstelling op een minuut.
 * Startopstelling + gebeurtenissen in minuutvolgorde.
 * Meerdere mutaties met dezelfde change_group_id op dezelfde minuut
 * worden atomair als één wisselmoment toegepast (geen onmogelijke tussenstate).
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
  | {
      kind: "sub";
      minute: number;
      stoppage: number;
      sort: number;
      id: string;
      groupId: string | null;
      sub: MatchSubstitution;
    }
  | {
      kind: "pos";
      minute: number;
      stoppage: number;
      sort: number;
      id: string;
      groupId: string | null;
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

export function slotOfShape(
  slots: Record<FormationSlotCode, string | null>,
  playerId: string,
): FormationSlotCode | null {
  for (const code of FORMATION_SLOT_CODES) {
    if (slots[code] === playerId) return code;
  }
  return null;
}

type ShapeState = {
  slots: Record<FormationSlotCode, string | null>;
  bench: Set<string>;
  substitutedOut: Set<string>;
  warnings: string[];
};

function collectEvents(db: ClubDatabase, matchId: string): TimelineEvent[] {
  const subs = (db.match_substitutions ?? []).filter((s) => s.match_id === matchId);
  const posChanges = (db.match_position_changes ?? []).filter((c) => c.match_id === matchId);
  return [
    ...subs.map((sub) => ({
      kind: "sub" as const,
      minute: sub.minute,
      stoppage: sub.stoppage_time ?? 0,
      sort: sub.sort_order ?? 0,
      id: sub.id,
      groupId: sub.change_group_id?.trim() || null,
      sub,
    })),
    ...posChanges.map((change) => ({
      kind: "pos" as const,
      minute: change.minute,
      stoppage: change.stoppage_time ?? 0,
      sort: change.sort_order ?? 0,
      id: change.id,
      groupId: change.change_group_id?.trim() || null,
      change,
    })),
  ].sort(eventOrder);
}

/** Groepeer events met dezelfde change_group_id op dezelfde minuut+stoppage. */
export function clusterShapeEvents(events: TimelineEvent[]): TimelineEvent[][] {
  const clusters: TimelineEvent[][] = [];
  for (const ev of events) {
    const last = clusters[clusters.length - 1];
    const last0 = last?.[0];
    if (
      last &&
      last0 &&
      ev.groupId &&
      last0.groupId &&
      ev.groupId === last0.groupId &&
      ev.minute === last0.minute &&
      ev.stoppage === last0.stoppage
    ) {
      last.push(ev);
    } else {
      clusters.push([ev]);
    }
  }
  return clusters;
}

function applySinglePos(state: ShapeState, change: MatchPositionChange): void {
  const from = change.from_slot;
  const to = change.to_slot;
  if (!isFormationSlotCode(from) || !isFormationSlotCode(to)) {
    state.warnings.push(`Ongeldige positiewijziging ${change.id}`);
    return;
  }
  if (state.slots[from] !== change.player_id) {
    state.warnings.push(`Positiewijziging ${change.id}: speelster stond niet op ${from}`);
  }
  const occupantTo = state.slots[to];
  state.slots[from] = occupantTo;
  state.slots[to] = change.player_id;
}

function applySingleSub(state: ShapeState, sub: MatchSubstitution): void {
  const outId = sub.player_out_id;
  const inId = sub.player_in_id;
  let outSlot: FormationSlotCode | null = slotOfShape(state.slots, outId);
  const toSlot =
    (sub.to_slot && isFormationSlotCode(sub.to_slot) ? sub.to_slot : null) ?? outSlot;
  if (!toSlot) {
    state.warnings.push(`Wissel ${sub.id}: geen slot voor inkomende speelster`);
    return;
  }
  if (outSlot) state.slots[outSlot] = null;
  state.slots[toSlot] = inId;
  state.substitutedOut.add(outId);
  state.bench.delete(inId);
  state.bench.add(outId);
}

/**
 * Atomair wisselmoment: eindbestemmingen, geen sequentiële tussenstates.
 * Losse (ongegroepeerde) events blijven de bestaande swap/sub-semantiek gebruiken.
 */
function applyAtomicGroup(state: ShapeState, cluster: TimelineEvent[]): void {
  const leaving = new Set<string>();
  const entering: { id: string; to: FormationSlotCode | null; eventId: string }[] = [];
  const moves: { id: string; to: FormationSlotCode; eventId: string }[] = [];

  for (const ev of cluster) {
    if (ev.kind === "sub") {
      leaving.add(ev.sub.player_out_id);
      const hinted =
        ev.sub.to_slot && isFormationSlotCode(ev.sub.to_slot) ? ev.sub.to_slot : null;
      entering.push({ id: ev.sub.player_in_id, to: hinted, eventId: ev.id });
    } else if (isFormationSlotCode(ev.change.to_slot)) {
      moves.push({ id: ev.change.player_id, to: ev.change.to_slot, eventId: ev.id });
    } else {
      state.warnings.push(`Ongeldige positiewijziging ${ev.id}`);
    }
  }

  for (const outId of leaving) {
    if (!slotOfShape(state.slots, outId)) {
      state.warnings.push(`Wisselmoment: ${outId} stond niet op het veld`);
    }
  }
  for (const inn of entering) {
    if (slotOfShape(state.slots, inn.id) && !leaving.has(inn.id)) {
      state.warnings.push(`Wisselmoment: ${inn.id} stond al op het veld`);
    }
  }

  const destinations = new Map<string, FormationSlotCode>();
  for (const code of FORMATION_SLOT_CODES) {
    const pid = state.slots[code];
    if (pid && !leaving.has(pid)) destinations.set(pid, code);
  }
  for (const move of moves) {
    if (leaving.has(move.id)) {
      state.warnings.push(`Positiewijziging ${move.eventId}: speelster gaat ook eruit`);
      continue;
    }
    destinations.set(move.id, move.to);
  }
  for (const inn of entering) {
    const outForThis = cluster.find((ev) => ev.kind === "sub" && ev.sub.player_in_id === inn.id);
    const outId = outForThis && outForThis.kind === "sub" ? outForThis.sub.player_out_id : null;
    const vacated = outId ? slotOfShape(state.slots, outId) : null;
    const to = inn.to ?? vacated;
    if (!to) {
      state.warnings.push(`Wissel ${inn.eventId}: geen slot voor inkomende speelster`);
      continue;
    }
    destinations.set(inn.id, to);
  }

  const next = emptyFormationMap();
  const usedSlots = new Set<FormationSlotCode>();
  const usedPlayers = new Set<string>();
  for (const [pid, slot] of destinations) {
    if (usedPlayers.has(pid)) state.warnings.push(`Wisselmoment: ${pid} dubbel toegewezen`);
    if (usedSlots.has(slot)) state.warnings.push(`Wisselmoment: slot ${slot} dubbel bezet`);
    usedPlayers.add(pid);
    usedSlots.add(slot);
    next[slot] = pid;
  }
  state.slots = next;

  for (const outId of leaving) {
    state.substitutedOut.add(outId);
    state.bench.add(outId);
  }
  for (const inn of entering) {
    state.bench.delete(inn.id);
  }
}

function applyCluster(state: ShapeState, cluster: TimelineEvent[]): void {
  if (cluster.length === 1) {
    const ev = cluster[0]!;
    if (ev.kind === "pos") applySinglePos(state, ev.change);
    else applySingleSub(state, ev.sub);
    return;
  }
  applyAtomicGroup(state, cluster);
}

function initialState(db: ClubDatabase, matchId: string): ShapeState {
  const entries = db.match_lineup_entries.filter((e) => e.match_id === matchId);
  const { slots, warnings } = starterSlots(entries);
  return {
    slots,
    bench: new Set(entries.filter((e) => e.role === "bench").map((e) => e.player_id)),
    substitutedOut: new Set<string>(),
    warnings,
  };
}

function finishShape(state: ShapeState, minute: number): MatchShapeAtMinute {
  const onPitch = FORMATION_SLOT_CODES.map((c) => state.slots[c]).filter((id): id is string => !!id);
  return {
    minute,
    slots: state.slots,
    onPitch,
    bench: [...state.bench],
    substitutedOut: [...state.substitutedOut],
    vacantSlots: FORMATION_SLOT_CODES.filter((c) => !state.slots[c]),
    warnings: state.warnings,
  };
}

export function getMatchShapeAtMinute(
  db: ClubDatabase,
  matchId: string,
  minute: number,
): MatchShapeAtMinute {
  const state = initialState(db, matchId);
  const clusters = clusterShapeEvents(collectEvents(db, matchId));
  for (const cluster of clusters) {
    if ((cluster[0]?.minute ?? 999) > minute) break;
    applyCluster(state, cluster);
  }
  return finishShape(state, minute);
}

export function validateShapeOccupancy(shape: MatchShapeAtMinute): string[] {
  const errors: string[] = [];
  if (shape.onPitch.length > 11) errors.push("Meer dan 11 speelsters op het veld.");
  if (new Set(shape.onPitch).size !== shape.onPitch.length) {
    errors.push("Een speelster staat dubbel op het veld.");
  }
  const filled = FORMATION_SLOT_CODES.filter((c) => !!shape.slots[c]);
  if (filled.length !== shape.onPitch.length) {
    errors.push("Een veldpositie is dubbel bezet.");
  }
  return errors;
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

export type PlayerSlotInterval = {
  player_id: string;
  slot: FormationSlotCode;
  from_minute: number;
  to_minute: number | null;
};

function snapshotSlots(slots: Record<FormationSlotCode, string | null>): Map<string, FormationSlotCode> {
  const map = new Map<string, FormationSlotCode>();
  for (const code of FORMATION_SLOT_CODES) {
    const id = slots[code];
    if (id) map.set(id, code);
  }
  return map;
}

/**
 * Gespeelde rollen per speelster, afgeleid uit startopstelling + gebeurtenissen.
 * Geen verzonnen minuten: alleen wat reconstrueerbaar is.
 */
export function computePlayerSlotIntervals(
  db: ClubDatabase,
  matchId: string,
  untilMinute = 90,
): PlayerSlotInterval[] {
  const state = initialState(db, matchId);
  const closed: PlayerSlotInterval[] = [];
  const open = new Map<string, { slot: FormationSlotCode; from: number }>();

  const openFrom = (occupancy: Map<string, FormationSlotCode>, minute: number) => {
    for (const [pid, slot] of occupancy) {
      open.set(pid, { slot, from: minute });
    }
  };
  const closeDiff = (next: Map<string, FormationSlotCode>, minute: number) => {
    for (const [pid, cur] of open) {
      const nxt = next.get(pid);
      if (nxt === cur.slot) continue;
      closed.push({ player_id: pid, slot: cur.slot, from_minute: cur.from, to_minute: minute });
      open.delete(pid);
    }
    for (const [pid, slot] of next) {
      if (!open.has(pid)) open.set(pid, { slot, from: minute });
    }
  };

  openFrom(snapshotSlots(state.slots), 0);

  const clusters = clusterShapeEvents(collectEvents(db, matchId));
  let i = 0;
  while (i < clusters.length) {
    const minute = clusters[i]![0]!.minute;
    if (minute > untilMinute) break;
    const sameMinute: TimelineEvent[][] = [];
    while (i < clusters.length && clusters[i]![0]!.minute === minute) {
      sameMinute.push(clusters[i]!);
      i += 1;
    }
    for (const cluster of sameMinute) applyCluster(state, cluster);
    closeDiff(snapshotSlots(state.slots), minute);
  }

  for (const [player_id, cur] of open) {
    closed.push({ player_id, slot: cur.slot, from_minute: cur.from, to_minute: null });
  }
  return closed.sort(
    (a, b) =>
      a.from_minute - b.from_minute ||
      a.player_id.localeCompare(b.player_id) ||
      a.slot.localeCompare(b.slot),
  );
}

export function matchHasReconstructableSlots(db: ClubDatabase, matchId: string): boolean {
  return computePlayerSlotIntervals(db, matchId, 90).length > 0;
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
