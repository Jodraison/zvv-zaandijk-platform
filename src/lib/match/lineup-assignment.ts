/**
 * Atomaire concept-opstelling: verplaatsen, verwisselen, vervangen, bank.
 * Geen tijdelijke 12-tal of dubbele speelster.
 */
import {
  FORMATION_4231_SLOTS,
  FORMATION_SLOT_CODES,
  emptyFormationMap,
  type FormationSlotCode,
} from "@/lib/match/formation-4231";

export type LineupDraft = {
  slots: Record<FormationSlotCode, string | null>;
  bench: string[];
  absent: string[];
};

export type LineupLocation =
  | { kind: "field"; slot: FormationSlotCode }
  | { kind: "bench" }
  | { kind: "absent" }
  | { kind: "unassigned" };

export function emptyLineupDraft(): LineupDraft {
  return { slots: emptyFormationMap(), bench: [], absent: [] };
}

export function cloneLineupDraft(draft: LineupDraft): LineupDraft {
  return {
    slots: { ...draft.slots },
    bench: [...draft.bench],
    absent: [...draft.absent],
  };
}

export function slotOfPlayer(draft: LineupDraft, playerId: string): FormationSlotCode | null {
  for (const code of FORMATION_SLOT_CODES) {
    if (draft.slots[code] === playerId) return code;
  }
  return null;
}

export function locationOfPlayer(draft: LineupDraft, playerId: string): LineupLocation {
  const slot = slotOfPlayer(draft, playerId);
  if (slot) return { kind: "field", slot };
  if (draft.bench.includes(playerId)) return { kind: "bench" };
  if (draft.absent.includes(playerId)) return { kind: "absent" };
  return { kind: "unassigned" };
}

function stripPlayer(draft: LineupDraft, playerId: string): void {
  for (const code of FORMATION_SLOT_CODES) {
    if (draft.slots[code] === playerId) draft.slots[code] = null;
  }
  draft.bench = draft.bench.filter((id) => id !== playerId);
  draft.absent = draft.absent.filter((id) => id !== playerId);
}

function addBench(draft: LineupDraft, playerId: string): void {
  if (!draft.bench.includes(playerId)) draft.bench.push(playerId);
}

export function lineupInvariants(draft: LineupDraft): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  const mark = (playerId: string, where: string) => {
    const prev = seen.get(playerId);
    if (prev) errors.push(`${playerId} staat dubbel (${prev} + ${where})`);
    else seen.set(playerId, where);
  };
  for (const code of FORMATION_SLOT_CODES) {
    const id = draft.slots[code];
    if (id) mark(id, code);
  }
  for (const id of draft.bench) mark(id, "bank");
  for (const id of draft.absent) mark(id, "afwezig");
  return errors;
}

export function moveToBench(draft: LineupDraft, playerId: string): LineupDraft {
  const next = cloneLineupDraft(draft);
  stripPlayer(next, playerId);
  addBench(next, playerId);
  return next;
}

export function moveToAbsent(draft: LineupDraft, playerId: string): LineupDraft {
  const next = cloneLineupDraft(draft);
  stripPlayer(next, playerId);
  if (!next.absent.includes(playerId)) next.absent.push(playerId);
  return next;
}

export function unassignPlayer(draft: LineupDraft, playerId: string): LineupDraft {
  const next = cloneLineupDraft(draft);
  stripPlayer(next, playerId);
  return next;
}

export function clearSlot(draft: LineupDraft, slot: FormationSlotCode): LineupDraft {
  const next = cloneLineupDraft(draft);
  next.slots[slot] = null;
  return next;
}

/** Verplaats naar een leeg slot. Bij bezet slot: geen mutatie — caller kiest swap/replace. */
export function moveToEmptySlot(
  draft: LineupDraft,
  playerId: string,
  target: FormationSlotCode,
): { ok: true; draft: LineupDraft } | { ok: false; reason: "occupied"; occupantId: string; draft: LineupDraft } {
  const occupant = draft.slots[target];
  if (occupant && occupant !== playerId) {
    return { ok: false, reason: "occupied", occupantId: occupant, draft };
  }
  const next = cloneLineupDraft(draft);
  stripPlayer(next, playerId);
  next.slots[target] = playerId;
  return { ok: true, draft: next };
}

/** Twee veldslots omwisselen. Leeg slot = gewone verplaatsing. */
export function swapSlots(draft: LineupDraft, from: FormationSlotCode, to: FormationSlotCode): LineupDraft {
  const next = cloneLineupDraft(draft);
  const a = next.slots[from];
  const b = next.slots[to];
  next.slots[from] = b;
  next.slots[to] = a;
  return next;
}

/**
 * Vervangen: incoming naar target, huidige bezetter naar bank.
 * Incoming verdwijnt uit haar oude plek (veld/bank/afwezig).
 */
export function replaceSlot(draft: LineupDraft, target: FormationSlotCode, incomingId: string): LineupDraft {
  const next = cloneLineupDraft(draft);
  const occupant = next.slots[target];
  stripPlayer(next, incomingId);
  next.slots[target] = incomingId;
  if (occupant && occupant !== incomingId) addBench(next, occupant);
  return next;
}

export type AssignMode = "move" | "swap" | "replace";

export type AssignResult =
  | { ok: true; draft: LineupDraft; action: AssignMode | "noop" }
  | { ok: false; reason: "occupied"; occupantId: string; draft: LineupDraft };

/**
 * Zet speelster op een slot.
 * - leeg: verplaatsen
 * - zelfde speelster: noop
 * - bezet + mode swap: verwisselen (incoming moet op het veld staan; anders replace)
 * - bezet + mode replace: incoming op slot, bezetter bank
 * - bezet zonder mode: occupied, geen mutatie
 */
export function assignPlayerToSlot(
  draft: LineupDraft,
  playerId: string,
  target: FormationSlotCode,
  mode?: AssignMode,
): AssignResult {
  const occupant = draft.slots[target];
  if (!occupant || occupant === playerId) {
    const moved = moveToEmptySlot(draft, playerId, target);
    if (!moved.ok) return moved;
    return { ok: true, draft: moved.draft, action: occupant === playerId ? "noop" : "move" };
  }
  if (!mode) {
    return { ok: false, reason: "occupied", occupantId: occupant, draft };
  }
  if (mode === "swap") {
    const from = slotOfPlayer(draft, playerId);
    if (!from) {
      return { ok: true, draft: replaceSlot(draft, target, playerId), action: "replace" };
    }
    return { ok: true, draft: swapSlots(draft, from, target), action: "swap" };
  }
  return { ok: true, draft: replaceSlot(draft, target, playerId), action: "replace" };
}

export function occupiedFieldSlots(draft: LineupDraft): FormationSlotCode[] {
  return FORMATION_4231_SLOTS.filter((s) => !!draft.slots[s.code]).map((s) => s.code);
}

export function freeFieldSlots(draft: LineupDraft): FormationSlotCode[] {
  return FORMATION_4231_SLOTS.filter((s) => !draft.slots[s.code]).map((s) => s.code);
}
