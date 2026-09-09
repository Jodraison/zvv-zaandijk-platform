/**
 * Eén tactisch wisselmoment: wissel(s) + positiewijzigingen op dezelfde minuut,
 * gekoppeld via change_group_id (geen string-hacks).
 */
import type { MatchPositionChange, MatchSubstitution } from "@/types";
import { isFormationSlotCode, type FormationSlotCode } from "@/lib/match/formation-4231";

function newGroupId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `g-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type MomentSubDraft = {
  id?: string;
  player_out_id: string;
  player_in_id: string;
  to_slot: string;
};

export type MomentPosDraft = {
  id?: string;
  player_id: string;
  from_slot: string;
  to_slot: string;
};

export type TacticalMomentDraft = {
  groupId: string;
  minute: number;
  substitutions: MomentSubDraft[];
  positionChanges: MomentPosDraft[];
};

function groupKey(minute: number, groupId: string | null | undefined, fallback: string): string {
  const g = groupId?.trim();
  if (g) return `${minute}::${g}`;
  return `${minute}::ungrouped::${fallback}`;
}

export function groupRowsIntoMoments(
  subs: MatchSubstitution[],
  pos: MatchPositionChange[],
): TacticalMomentDraft[] {
  const map = new Map<string, TacticalMomentDraft>();
  const order: string[] = [];

  const ensure = (key: string, minute: number, groupId: string) => {
    let row = map.get(key);
    if (!row) {
      row = { groupId, minute, substitutions: [], positionChanges: [] };
      map.set(key, row);
      order.push(key);
    }
    return row;
  };

  const sortedSubs = [...subs].sort(
    (a, b) => a.minute - b.minute || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id),
  );
  for (const s of sortedSubs) {
    const g = s.change_group_id?.trim() || newGroupId();
    const key = groupKey(s.minute, s.change_group_id, `sub-${s.id}`);
    const row = ensure(key, s.minute, g);
    row.substitutions.push({
      id: s.id,
      player_out_id: s.player_out_id,
      player_in_id: s.player_in_id,
      to_slot: s.to_slot ?? "",
    });
  }

  const sortedPos = [...pos].sort(
    (a, b) => a.minute - b.minute || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id),
  );
  for (const c of sortedPos) {
    const explicit = c.change_group_id?.trim();
    if (explicit) {
      const key = groupKey(c.minute, explicit, `pos-${c.id}`);
      const row = ensure(key, c.minute, explicit);
      row.positionChanges.push({
        id: c.id,
        player_id: c.player_id,
        from_slot: c.from_slot,
        to_slot: c.to_slot,
      });
      continue;
    }
    const sameMinuteSub = order.find((k) => {
      const m = map.get(k);
      return !!m && m.minute === c.minute && m.substitutions.length === 1 && !c.change_group_id;
    });
    const loneSubAtMinute = sortedSubs.filter((s) => s.minute === c.minute && !s.change_group_id?.trim());
    if (loneSubAtMinute.length === 1 && sameMinuteSub) {
      map.get(sameMinuteSub)!.positionChanges.push({
        id: c.id,
        player_id: c.player_id,
        from_slot: c.from_slot,
        to_slot: c.to_slot,
      });
      continue;
    }
    const g = newGroupId();
    const key = groupKey(c.minute, null, `pos-${c.id}`);
    const row = ensure(key, c.minute, g);
    row.positionChanges.push({
      id: c.id,
      player_id: c.player_id,
      from_slot: c.from_slot,
      to_slot: c.to_slot,
    });
  }

  return order.map((k) => map.get(k)!).filter(Boolean);
}

export function flattenMoments(moments: TacticalMomentDraft[]): {
  substitutions: Array<MomentSubDraft & { minute: number; change_group_id: string; sort_order: number }>;
  position_changes: Array<MomentPosDraft & { minute: number; change_group_id: string; sort_order: number }>;
} {
  const substitutions: Array<MomentSubDraft & { minute: number; change_group_id: string; sort_order: number }> = [];
  const position_changes: Array<MomentPosDraft & { minute: number; change_group_id: string; sort_order: number }> = [];
  let sort = 0;
  for (const m of moments) {
    const groupId = m.groupId.trim() || newGroupId();
    for (const s of m.substitutions) {
      if (!s.player_in_id || !s.player_out_id) continue;
      substitutions.push({
        ...s,
        minute: m.minute,
        change_group_id: groupId,
        sort_order: sort++,
      });
    }
    for (const c of m.positionChanges) {
      if (!c.player_id || !isFormationSlotCode(c.from_slot) || !isFormationSlotCode(c.to_slot)) continue;
      position_changes.push({
        ...c,
        minute: m.minute,
        change_group_id: groupId,
        sort_order: sort++,
      });
    }
  }
  return { substitutions, position_changes };
}

export function emptyMoment(minute = 75): TacticalMomentDraft {
  return {
    groupId: newGroupId(),
    minute,
    substitutions: [{ player_out_id: "", player_in_id: "", to_slot: "" }],
    positionChanges: [],
  };
}

export function slotCodeOrEmpty(value: string | null | undefined): FormationSlotCode | "" {
  return value && isFormationSlotCode(value) ? value : "";
}
