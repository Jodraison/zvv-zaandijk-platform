"use server";

import { randomUUID } from "crypto";
import { mutateDb } from "@/lib/data/mutate";
import { FORMATION_SLOT_CODES, type FormationSlotCode } from "@/lib/match/formation-4231";
import { validateConfirmedFormation } from "@/lib/match/match-shape";
import { isSeasonSquadPlayer } from "@/lib/match-lineup";
import { isGuestPlayer } from "@/lib/players/season-squad";
import { revalidatePath } from "next/cache";

export async function saveMatchFormationAction(raw: {
  match_id: string;
  season_id: string;
  slots: Partial<Record<FormationSlotCode, string | null>>;
  bench: string[];
  absent?: string[];
  confirm: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const matchId = String(raw.match_id ?? "").trim();
  const seasonId = String(raw.season_id ?? "").trim();
  if (!matchId || !seasonId) return { ok: false, error: "Wedstrijd of seizoen ontbreekt." };

  const slots = raw.slots ?? {};
  const bench = [...new Set(raw.bench ?? [])];
  const absent = [...new Set(raw.absent ?? [])];

  if (raw.confirm) {
    const v = validateConfirmedFormation(slots, bench);
    if (!v.ok) return { ok: false, error: v.error };
  }

  const allIds = [
    ...FORMATION_SLOT_CODES.map((c) => slots[c]).filter((id): id is string => !!id),
    ...bench,
    ...absent,
  ];
  if (new Set(allIds).size !== allIds.length) {
    return { ok: false, error: "Een speelster kan maar in één groep staan (basis/bank/afwezig)." };
  }

  try {
    await mutateDb(
      (db) => {
        const match = db.matches.find((m) => m.id === matchId);
        if (!match) throw new Error("Wedstrijd niet gevonden.");
        if (match.season_id !== seasonId) throw new Error("Seizoen komt niet overeen.");

        const rosterGuestIds = new Set(
          db.match_matchday_roster.filter((r) => r.match_id === matchId).map((r) => r.player_id),
        );

        for (const id of allIds) {
          const okSquad = isSeasonSquadPlayer(db, seasonId, id);
          const okGuest = isGuestPlayer(db, id, seasonId) && rosterGuestIds.has(id);
          if (!okSquad && !okGuest) {
            throw new Error("Alleen actieve selectie of gekoppelde gasten in de opstelling.");
          }
        }

        db.match_lineup_entries = db.match_lineup_entries.filter((e) => e.match_id !== matchId);
        let sort = 0;
        for (const code of FORMATION_SLOT_CODES) {
          const playerId = slots[code];
          if (!playerId) continue;
          db.match_lineup_entries.push({
            id: randomUUID(),
            match_id: matchId,
            player_id: playerId,
            role: "starter",
            position: code,
            absence_reason: null,
            sort_order: sort++,
          });
        }
        for (const playerId of bench) {
          db.match_lineup_entries.push({
            id: randomUUID(),
            match_id: matchId,
            player_id: playerId,
            role: "bench",
            position: null,
            absence_reason: null,
            sort_order: sort++,
          });
        }
        for (const playerId of absent) {
          db.match_lineup_entries.push({
            id: randomUUID(),
            match_id: matchId,
            player_id: playerId,
            role: "absent",
            position: null,
            absence_reason: null,
            sort_order: sort++,
          });
        }

        match.lineup_status = raw.confirm ? "confirmed" : "draft";
        match.lineup_confirmed_at = raw.confirm ? new Date().toISOString() : null;
      },
      {
        action: () => "update",
        entity: "match",
        entity_id: () => matchId,
      },
    );
    revalidatePath(`/beheer/wedstrijden/${matchId}`);
    revalidatePath("/beheer/wedstrijden");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Opslaan mislukt." };
  }
  return { ok: true };
}
