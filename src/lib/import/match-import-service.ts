/**
 * Fault-tolerant wedstrijd-import: events als bron van waarheid, stats afgeleid,
 * matchday-roster voor gasten (admin-compatibel met isPlayerAllowedOnMatchday).
 */

import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Service-role client zonder gegenereerde Database-typen (scripts). */
export type ServiceSb = SupabaseClient<any, "public", any>;
import { aggregateStatsFromGoals, type GoalRowInput } from "@/lib/match-goal-helpers";
import {
  normalizePlayerName,
  resolvePlayerIdIncludingGuests,
  parseMvpPrimaryName,
  stripGuestAnnotation,
  type ImportPlayerRow,
} from "@/lib/import/normalize-player-name";
import type { MatchGoalEvent } from "@/types";

export type MatchGoalSpec = { scorerName: string; assistName?: string };

export type MatchImportSpec = {
  /** Wedstrijd-datum/tijd UTC. Ontbreekt bij draftPlaceholder → placeholder kickoff. */
  kickoffIso?: string;
  /** Geen echte kickoff: gebruik vaste placeholder + extra logging. */
  draftPlaceholder?: boolean;
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  goalRows: MatchGoalSpec[];
  mvpRaw: string;
};

export type MatchImportLog = (msg: string) => void;
export type MatchImportWarn = (msg: string) => void;

const PLACEHOLDER_DRAFT_KICKOFF = "2099-12-31T12:00:00.000Z";

export type SingleMatchImportResult =
  | { ok: true; matchId: string; createdMatch: boolean }
  | { ok: false; error: string };

export type EnsureGuestResult = { id: string; created: boolean };

/** Gast aanmaken of ophaliën op exacte `full_name` + `is_guest`. */
export async function ensureGuestPlayerByName(
  client: ServiceSb,
  fullName: string,
): Promise<EnsureGuestResult> {
  const trimmed = fullName.trim();
  const { data: existing } = await client
    .from("players")
    .select("id,is_guest")
    .eq("full_name", trimmed)
    .maybeSingle();

  if (existing?.id) {
    const row = existing as { id: string; is_guest: boolean };
    if (!row.is_guest) {
      throw new Error(`Naam "${trimmed}" bestaat al als club-speelster (geen gast).`);
    }
    return { id: row.id, created: false };
  }

  const id = randomUUID();
  const { error } = await client.from("players").insert({
    id,
    full_name: trimmed,
    is_guest: true,
    photo_url: null,
  } as never);
  if (error) throw new Error(`Gast "${trimmed}" aanmaken mislukt: ${error.message}`);
  return { id, created: true };
}

async function loadImportPlayerRows(client: ServiceSb): Promise<ImportPlayerRow[]> {
  const { data, error } = await client.from("players").select("id,full_name,is_guest");
  if (error) throw error;
  return (data ?? []) as ImportPlayerRow[];
}

async function loadSeasonCorePlayerIds(client: ServiceSb, seasonId: string): Promise<string[]> {
  const { data: mem, error: e1 } = await client
    .from("player_season_memberships")
    .select("player_id")
    .eq("season_id", seasonId);
  if (e1) throw e1;
  const ids = [...new Set((mem ?? []).map((m: { player_id: string }) => m.player_id))];
  if (!ids.length) return [];
  const { data: pl, error: e2 } = await client.from("players").select("id,is_guest").in("id", ids);
  if (e2) throw e2;
  const guest = new Set(
    (pl ?? []).filter((p: { is_guest: boolean }) => p.is_guest).map((p: { id: string }) => p.id),
  );
  return ids.filter((id) => !guest.has(id));
}

export async function findExistingMatchId(
  client: ServiceSb,
  seasonId: string,
  opponent: string,
  kickoffIso: string,
  isHome: boolean,
): Promise<string | null> {
  const { data, error } = await client
    .from("matches")
    .select("id,kickoff_at")
    .eq("season_id", seasonId)
    .eq("opponent", opponent.trim())
    .eq("is_home", isHome);
  if (error) throw error;
  const t = new Date(kickoffIso).getTime();
  const row = (data ?? []).find((m) => new Date(String(m.kickoff_at)).getTime() === t);
  return row?.id ?? null;
}

function buildGoalPayload(
  spec: MatchImportSpec,
  players: ImportPlayerRow[],
): { ok: true; goals: GoalRowInput[] } | { ok: false; error: string } {
  if (spec.goalRows.length !== spec.goalsFor) {
    return {
      ok: false,
      error: `goalRows (${spec.goalRows.length}) ≠ goalsFor (${spec.goalsFor})`,
    };
  }

  const goals: GoalRowInput[] = [];
  for (const row of spec.goalRows) {
    const sName = stripGuestAnnotation(row.scorerName);
    const aName = row.assistName ? stripGuestAnnotation(row.assistName) : undefined;
    const sr = resolvePlayerIdIncludingGuests(normalizePlayerName(sName), players);
    if (!sr) {
      return { ok: false, error: `Onbekende scorer: "${row.scorerName}"` };
    }
    if (aName) {
      const ar = resolvePlayerIdIncludingGuests(normalizePlayerName(aName), players);
      if (!ar) {
        return { ok: false, error: `Onbekende assist: "${row.assistName}"` };
      }
      if (ar.id === sr.id) {
        return { ok: false, error: `Scorer en assist identiek: "${row.scorerName}"` };
      }
      goals.push({ scorer_player_id: sr.id, assist_player_id: ar.id });
    } else {
      goals.push({ scorer_player_id: sr.id });
    }
  }

  if (goals.length !== spec.goalsFor) {
    return { ok: false, error: "Intern: goals lengte mismatch" };
  }

  return { ok: true, goals };
}

/**
 * Importeert één wedstrijd idempotent op (season, opponent, is_home, kickoff).
 * Wist eerst stats/events/roster-gasten voor dit match_id en schrijft opnieuw.
 */
export async function importSingleMatch(
  client: ServiceSb,
  seasonId: string,
  spec: MatchImportSpec,
  players: ImportPlayerRow[],
  coreSeasonPlayerIds: string[],
  explicitMatchId: string | null,
  log: MatchImportLog,
  warn: MatchImportWarn,
): Promise<SingleMatchImportResult> {
  const kickoffIso =
    spec.draftPlaceholder || !spec.kickoffIso?.trim()
      ? PLACEHOLDER_DRAFT_KICKOFF
      : new Date(spec.kickoffIso).toISOString();

  if (Number.isNaN(new Date(kickoffIso).getTime())) {
    return { ok: false, error: `Ongeldige kickoff` };
  }

  if (spec.draftPlaceholder || !spec.kickoffIso?.trim()) {
    warn(
      `[DRAFT] Placeholder kickoff ${kickoffIso} — ${spec.opponent}: zet echte aanvang in beheer vóór productie.`,
    );
  }

  const payloadResult = buildGoalPayload(spec, players);
  if (!payloadResult.ok) {
    return { ok: false, error: payloadResult.error };
  }
  const goalInputs = payloadResult.goals;

  const mvpPrimary = parseMvpPrimaryName(spec.mvpRaw, (m) => warn(m));
  if (!mvpPrimary.trim()) {
    return { ok: false, error: "MVP ontbreekt" };
  }
  const mvpResolved = resolvePlayerIdIncludingGuests(normalizePlayerName(mvpPrimary), players);
  if (!mvpResolved) {
    return { ok: false, error: `MVP niet gevonden: "${mvpPrimary}"` };
  }

  const involved = new Set<string>();
  for (const g of goalInputs) {
    involved.add(g.scorer_player_id);
    if (g.assist_player_id) involved.add(g.assist_player_id);
  }
  involved.add(mvpResolved.id);

  const guestIdsForRoster: string[] = [];
  for (const id of involved) {
    const p = players.find((x) => x.id === id);
    if (p?.is_guest) guestIdsForRoster.push(id);
  }

  const selectedPlayerIds = [...new Set([...coreSeasonPlayerIds, ...involved])];

  let matchId = explicitMatchId?.trim() || null;
  if (!matchId) {
    matchId = await findExistingMatchId(client, seasonId, spec.opponent, kickoffIso, spec.isHome);
  }
  const createdMatch = !matchId;
  if (!matchId) {
    matchId = randomUUID();
  }

  const { goals_for: gf, stats: statsFinal, events: eventsFinal } = aggregateStatsFromGoals(
    matchId,
    selectedPlayerIds,
    goalInputs,
  );

  if (gf !== spec.goalsFor) {
    return { ok: false, error: `aggregate goals_for ${gf} ≠ ${spec.goalsFor}` };
  }

  const sumGoals = statsFinal.reduce((a, s) => a + s.goals, 0);
  if (sumGoals !== spec.goalsFor) {
    return { ok: false, error: `Stats som goals ${sumGoals} ≠ ${spec.goalsFor}` };
  }

  const matchRow = {
    id: matchId,
    season_id: seasonId,
    opponent: spec.opponent.trim(),
    kickoff_at: kickoffIso,
    is_home: spec.isHome,
    goals_for: spec.goalsFor,
    goals_against: spec.goalsAgainst,
    status: "played" as const,
    wotm_player_id: mvpResolved.id,
  };

  const { error: eDelRoster } = await client.from("match_matchday_roster").delete().eq("match_id", matchId);
  if (eDelRoster) {
    return { ok: false, error: `Roster wissen: ${eDelRoster.message}` };
  }

  for (const gid of guestIdsForRoster) {
    const { error: eIns } = await client.from("match_matchday_roster").insert({
      match_id: matchId,
      player_id: gid,
      match_shirt_number: null,
      position_label: null,
    } as never);
    if (eIns) {
      return { ok: false, error: `Roster gast: ${eIns.message}` };
    }
  }

  const { error: eDelSt } = await client.from("match_player_stats").delete().eq("match_id", matchId);
  if (eDelSt) {
    return { ok: false, error: `Stats wissen: ${eDelSt.message}` };
  }
  const { error: eDelEv } = await client.from("match_goal_events").delete().eq("match_id", matchId);
  if (eDelEv) {
    return { ok: false, error: `Events wissen: ${eDelEv.message}` };
  }

  const { error: eM } = await client.from("matches").upsert(matchRow as never, { onConflict: "id" });
  if (eM) {
    return { ok: false, error: `Match upsert: ${eM.message}` };
  }

  if (statsFinal.length) {
    const { error: eS } = await client.from("match_player_stats").upsert(statsFinal as never[], {
      onConflict: "match_id,player_id",
    });
    if (eS) {
      return { ok: false, error: `match_player_stats: ${eS.message}` };
    }
  }

  const eventsWithIds: MatchGoalEvent[] = eventsFinal.map((e) => ({
    id: randomUUID(),
    match_id: e.match_id,
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id,
    sort_order: e.sort_order,
  }));

  if (eventsWithIds.length) {
    const { error: eE } = await client.from("match_goal_events").insert(eventsWithIds as never[]);
    if (eE) {
      return { ok: false, error: `match_goal_events: ${eE.message}` };
    }
  }

  const action = createdMatch ? "aangemaakt" : "bijgewerkt";
  log(
    `OK ${action}: ${spec.opponent} | ${kickoffIso.slice(0, 10)} | ${spec.goalsFor}-${spec.goalsAgainst} | MVP=${mvpResolved.matchedAs} | match_id=${matchId}`,
  );

  return { ok: true, matchId, createdMatch };
}

/** Herlaadt spelers na gast-creatie. */
export async function prepareImportContext(client: ServiceSb, seasonId: string) {
  const coreSeasonPlayerIds = await loadSeasonCorePlayerIds(client, seasonId);
  if (coreSeasonPlayerIds.length < 1) {
    throw new Error("Geen vaste selectie (player_season_memberships) voor dit seizoen.");
  }
  let players = await loadImportPlayerRows(client);
  return { coreSeasonPlayerIds, players };
}

export async function verifyMatchGoalSync(
  client: ServiceSb,
  matchId: string,
): Promise<{ ok: boolean; goalsFor: number; eventCount: number }> {
  const { data: m, error: eM } = await client
    .from("matches")
    .select("goals_for")
    .eq("id", matchId)
    .maybeSingle();
  if (eM || !m) return { ok: false, goalsFor: 0, eventCount: -1 };
  const { count, error: eC } = await client
    .from("match_goal_events")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId);
  if (eC) return { ok: false, goalsFor: Number((m as { goals_for: number }).goals_for), eventCount: -1 };
  const gf = Number((m as { goals_for: number }).goals_for);
  const n = count ?? 0;
  return { ok: gf === n, goalsFor: gf, eventCount: n };
}
