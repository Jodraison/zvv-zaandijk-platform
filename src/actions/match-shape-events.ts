"use server";

import { randomUUID } from "crypto";
import { mutateDb } from "@/lib/data/mutate";
import { FORMATION_SLOT_CODES, isFormationSlotCode } from "@/lib/match/formation-4231";
import type { MatchPositionChange, MatchSubstitution } from "@/types";

export type ShapeSubInput = {
  id?: string;
  player_in_id: string;
  player_out_id: string;
  minute: number;
  to_slot?: string | null;
  stoppage_time?: number;
  sort_order?: number;
  change_group_id?: string | null;
  notes?: string | null;
};

export type ShapePosInput = {
  id?: string;
  player_id: string;
  minute: number;
  stoppage_time?: number;
  from_slot: string;
  to_slot: string;
  change_group_id?: string | null;
  notes?: string | null;
  sort_order?: number;
};

/** Slaat wissels (met slot) en positiewijzigingen op zonder de rest van de wedstrijd te herschrijven. */
export async function saveMatchShapeEventsAction(raw: {
  match_id: string;
  substitutions: ShapeSubInput[];
  position_changes: ShapePosInput[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const matchId = String(raw.match_id ?? "").trim();
  if (!matchId) return { ok: false, error: "Wedstrijd ontbreekt." };

  const subs = raw.substitutions ?? [];
  const pos = raw.position_changes ?? [];

  for (const s of subs) {
    if (!s.player_in_id || !s.player_out_id) {
      return { ok: false, error: "Elke wissel heeft speelster erin en eruit nodig." };
    }
    if (s.player_in_id === s.player_out_id) {
      return { ok: false, error: "Wissel: zelfde speelster erin en eruit." };
    }
    if (s.to_slot && !isFormationSlotCode(s.to_slot)) {
      return { ok: false, error: `Ongeldig wissel-slot: ${s.to_slot}` };
    }
  }
  for (const c of pos) {
    if (!c.player_id || !isFormationSlotCode(c.from_slot) || !isFormationSlotCode(c.to_slot)) {
      return { ok: false, error: "Positiewijziging: speelster en geldige slots vereist." };
    }
    if (c.from_slot === c.to_slot) {
      return { ok: false, error: "Positiewijziging: oud en nieuw slot zijn gelijk." };
    }
  }

  try {
    await mutateDb(
      (db) => {
        const match = db.matches.find((m) => m.id === matchId);
        if (!match) throw new Error("Wedstrijd niet gevonden.");

        const squad = new Set(
          db.player_season_memberships.filter((m) => m.season_id === match.season_id).map((m) => m.player_id),
        );
        for (const s of subs) {
          if (!squad.has(s.player_in_id) || !squad.has(s.player_out_id)) {
            throw new Error("Wissel alleen voor selectiespeelsters van dit seizoen.");
          }
        }
        for (const c of pos) {
          if (!squad.has(c.player_id)) {
            throw new Error("Positiewijziging alleen voor selectiespeelsters.");
          }
        }

        db.match_substitutions = db.match_substitutions.filter((e) => e.match_id !== matchId);
        const subRows: MatchSubstitution[] = subs.map((s, i) => ({
          id: s.id?.trim() || randomUUID(),
          match_id: matchId,
          player_in_id: s.player_in_id,
          player_out_id: s.player_out_id,
          minute: Math.max(0, Math.min(130, Number(s.minute) || 0)),
          to_slot: s.to_slot && isFormationSlotCode(s.to_slot) ? s.to_slot : null,
          stoppage_time: Math.max(0, Number(s.stoppage_time) || 0),
          sort_order: s.sort_order ?? i,
          change_group_id: s.change_group_id?.trim() || null,
          notes: s.notes?.trim() || null,
        }));
        db.match_substitutions.push(...subRows);

        db.match_position_changes = (db.match_position_changes ?? []).filter((e) => e.match_id !== matchId);
        const posRows: MatchPositionChange[] = pos.map((c, i) => ({
          id: c.id?.trim() || randomUUID(),
          match_id: matchId,
          player_id: c.player_id,
          minute: Math.max(0, Math.min(130, Number(c.minute) || 0)),
          stoppage_time: Math.max(0, Number(c.stoppage_time) || 0),
          from_slot: c.from_slot,
          to_slot: c.to_slot,
          change_group_id: c.change_group_id?.trim() || null,
          notes: c.notes?.trim() || null,
          sort_order: c.sort_order ?? i,
        }));
        db.match_position_changes = [...(db.match_position_changes ?? []), ...posRows];

        void FORMATION_SLOT_CODES;
      },
      {
        action: () => "update",
        entity: "match",
        entity_id: () => matchId,
      },
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Opslaan mislukt." };
  }
  return { ok: true };
}
