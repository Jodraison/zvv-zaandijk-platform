/**
 * Productie-datafix: canonieke selectie (22), strikte namen, wedstrijd-MVP + stats + events,
 * aanvoerders, gasten Esmee/Micah, fitheid 2026-01-26 / 2026-02-11.
 *
 * Vereist: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (.env.local)
 *
 *   cd platform && npm run fix:club-data
 *
 * Stopt bij elke validatiefout (geen half-applied state binnen één wedstrijd na delete).
 */

import "./load-platform-env";

import { randomUUID } from "crypto";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ImportPlayerRow } from "@/lib/import/normalize-player-name";
import {
  resolvePlayerStrict,
  validateCanonicalRoster,
  GUEST_FULL_NAMES,
} from "@/lib/import/resolve-player-strict";
import { goalRowsFromPlayerCounts, aggregateStatsFromGoals, type PlayerMatchCountInput } from "@/lib/match-goal-helpers";
import { parseFitnessImportText } from "@/lib/import/parse-fitness-import";
import { parseSprintTimeToSeconds } from "@/lib/import/fitness-time";
import { recomputeFitnessAnalyticsForTests } from "@/lib/fitness-analytics";
import type { FitnessTest } from "@/types";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  ATOMIC_MATCH_SPECS,
  tallySumGoals,
  tallySumAssists,
  type ClubAtomicMatchSpec,
  type ClubMatchTally,
} from "@/lib/data/club-atomic-match-specs";

const DEFAULT_SEASON_ID = "c0ffee00-0001-4000-8000-000000000001";

function talliesToCounts(players: ImportPlayerRow[], tallies: Record<string, ClubMatchTally>): { orderedIds: string[]; counts: PlayerMatchCountInput; idToName: Map<string, string> } {
  const counts: PlayerMatchCountInput = {};
  const idToName = new Map<string, string>();

  for (const [name, { g, a }] of Object.entries(tallies)) {
    const r = resolvePlayerStrict(players, name);
    const cur = counts[r.id] ?? { goals: 0, assists: 0 };
    counts[r.id] = { goals: cur.goals + g, assists: cur.assists + a };
    idToName.set(r.id, r.full_name);
  }

  const orderedIds = Object.keys(counts).sort((idA, idB) => {
    const na = idToName.get(idA) ?? idA;
    const nb = idToName.get(idB) ?? idB;
    return na.localeCompare(nb, "nl");
  });

  return { orderedIds, counts, idToName };
}

async function ensureGuests(client: SupabaseClient): Promise<void> {
  for (const name of GUEST_FULL_NAMES) {
    const { data: existing, error: e1 } = await client.from("players").select("id").eq("full_name", name).eq("is_guest", true).maybeSingle();
    if (e1) throw e1;
    if (existing) continue;
    const id = randomUUID();
    const { error: e2 } = await client.from("players").insert({ id, full_name: name, is_guest: true, photo_url: null } as never);
    if (e2) throw new Error(`Gast aanmaken "${name}": ${e2.message}`);
    console.log(`[fix] Gast aangemaakt: ${name} (${id})`);
  }
}

async function renamePitouIfNeeded(client: SupabaseClient): Promise<void> {
  const { data: wrong, error } = await client.from("players").select("id").eq("full_name", "Pitou").eq("is_guest", false).maybeSingle();
  if (error) throw error;
  if (!wrong) return;
  const { data: clash } = await client.from("players").select("id").eq("full_name", "Pitou Ludding").maybeSingle();
  if (clash) {
    throw new Error('[fix] Zowel "Pitou" als "Pitou Ludding" bestaan — handmatig samenvoegen.');
  }
  const { error: up } = await client.from("players").update({ full_name: "Pitou Ludding" }).eq("id", (wrong as { id: string }).id);
  if (up) throw up;
  console.log('[fix] Hernoemd: "Pitou" → "Pitou Ludding"');
}

async function applyCaptains(client: SupabaseClient, seasonId: string, players: ImportPlayerRow[]): Promise<void> {
  const cap = resolvePlayerStrict(players, "Melissa Rietveld");
  const vice = resolvePlayerStrict(players, "Dionne van Dijk");
  if (cap.id === vice.id) throw new Error("Aanvoerder en vice hetzelfde");

  const { error: z } = await client.from("player_season_memberships").update({ is_captain: false, is_vice_captain: false }).eq("season_id", seasonId);
  if (z) throw z;

  const { error: c1 } = await client.from("player_season_memberships").update({ is_captain: true }).eq("season_id", seasonId).eq("player_id", cap.id);
  if (c1) throw c1;
  const { error: c2 } = await client.from("player_season_memberships").update({ is_vice_captain: true }).eq("season_id", seasonId).eq("player_id", vice.id);
  if (c2) throw c2;

  const { data: check, error: cErr } = await client
    .from("player_season_memberships")
    .select("player_id,is_captain,is_vice_captain")
    .eq("season_id", seasonId);
  if (cErr) throw cErr;
  const caps = (check ?? []).filter((r: { is_captain: boolean }) => r.is_captain);
  const vices = (check ?? []).filter((r: { is_vice_captain: boolean }) => r.is_vice_captain);
  if (caps.length !== 1 || vices.length !== 1) {
    throw new Error(`[fix] Aanvoerders-check: ${caps.length} captain(s), ${vices.length} vice(s) (verwacht 1 en 1).`);
  }
  console.log("[fix] Aanvoerder: Melissa Rietveld · Vice: Dionne van Dijk");
}

async function importOneMatchSpec(client: SupabaseClient, seasonId: string, players: ImportPlayerRow[], spec: ClubAtomicMatchSpec): Promise<void> {
  const sumG = tallySumGoals(spec.tallies);
  const sumA = tallySumAssists(spec.tallies);
  if (sumG !== spec.goals_for) {
    throw new Error(`[${spec.matchId}] Som doelpunten in tallies (${sumG}) ≠ goals_for (${spec.goals_for})`);
  }
  if (sumA > spec.goals_for) {
    throw new Error(`[${spec.matchId}] Som assists (${sumA}) > goals_for (${spec.goals_for})`);
  }

  const mvp = resolvePlayerStrict(players, spec.mvp);
  const tallies = { ...spec.tallies };
  if (!tallies[spec.mvp]) {
    tallies[spec.mvp] = { g: 0, a: 0 };
  }

  const { orderedIds, counts } = talliesToCounts(players, tallies);
  const gr = goalRowsFromPlayerCounts(orderedIds, counts);
  if (!gr.ok) {
    throw new Error(`[${spec.matchId}] goalRowsFromPlayerCounts: ${gr.error}`);
  }

  const agg = aggregateStatsFromGoals(spec.matchId, orderedIds, gr.goals);
  if (agg.goals_for !== spec.goals_for) {
    throw new Error(`[${spec.matchId}] aggregate goals_for ${agg.goals_for} ≠ ${spec.goals_for}`);
  }

  const assistFromStats = agg.stats.reduce((s, r) => s + r.assists, 0);
  const assistFromEvents = agg.events.filter((e) => e.assist_player_id).length;
  if (assistFromStats !== assistFromEvents) {
    throw new Error(`[${spec.matchId}] assists stats (${assistFromStats}) ≠ events met assist (${assistFromEvents})`);
  }

  const { error: eDelSt } = await client.from("match_player_stats").delete().eq("match_id", spec.matchId);
  if (eDelSt) throw eDelSt;
  const { error: eDelEv } = await client.from("match_goal_events").delete().eq("match_id", spec.matchId);
  if (eDelEv) throw eDelEv;

  const matchRow = {
    id: spec.matchId,
    season_id: seasonId,
    opponent: spec.opponent,
    kickoff_at: spec.kickoff_at,
    is_home: spec.is_home,
    goals_for: spec.goals_for,
    goals_against: spec.goals_against,
    status: "played" as const,
    wotm_player_id: mvp.id,
  };

  const { error: eM } = await client.from("matches").upsert(matchRow as never, { onConflict: "id" });
  if (eM) throw new Error(`match upsert: ${eM.message}`);

  if (agg.stats.length) {
    const { error: eS } = await client.from("match_player_stats").upsert(agg.stats as never[], { onConflict: "match_id,player_id" });
    if (eS) throw new Error(`match_player_stats: ${eS.message}`);
  }

  const eventsWithIds = agg.events.map((e) => ({
    id: randomUUID(),
    match_id: e.match_id,
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id,
    sort_order: e.sort_order,
  }));

  if (eventsWithIds.length) {
    const { error: eE } = await client.from("match_goal_events").insert(eventsWithIds as never[]);
    if (eE) throw new Error(`match_goal_events: ${eE.message}`);
  }

  await validateMatchInDb(client, spec.matchId, mvp.id, spec.goals_for);
  console.log(`[fix] OK wedstrijd ${spec.opponent} ${spec.kickoff_at.slice(0, 10)} (${spec.goals_for}-${spec.goals_against}) MVP=${spec.mvp}`);
}

async function validateMatchInDb(client: SupabaseClient, matchId: string, mvpId: string, expectedGoalsFor: number): Promise<void> {
  const { data: st, error } = await client.from("match_player_stats").select("player_id,goals,assists").eq("match_id", matchId);
  if (error) throw error;
  const rows = st ?? [];
  if (rows.length === 0) throw new Error(`[validate] Geen stats voor match ${matchId}`);
  const ids = new Set(rows.map((r: { player_id: string }) => r.player_id));
  if (ids.size !== rows.length) throw new Error(`[validate] Dubbele player_id in stats voor ${matchId}`);
  if (!ids.has(mvpId)) throw new Error(`[validate] MVP ontbreekt in stats voor ${matchId}`);
  const sumG = rows.reduce((s: number, r: { goals: number }) => s + Number(r.goals ?? 0), 0);
  if (sumG !== expectedGoalsFor) {
    throw new Error(`[validate] SUM(goals) ${sumG} ≠ goals_for ${expectedGoalsFor} voor ${matchId}`);
  }
}

async function validateAllPlayedMatches(client: SupabaseClient, seasonId: string): Promise<void> {
  const { data: ms, error } = await client.from("matches").select("id,goals_for,status,wotm_player_id").eq("season_id", seasonId);
  if (error) throw error;
  const played = (ms ?? []).filter((m: { status: string }) => m.status === "played");
  for (const m of played) {
    const mid = (m as { id: string }).id;
    const gf = Number((m as { goals_for: number }).goals_for);
    const wotm = (m as { wotm_player_id: string | null }).wotm_player_id;
    if (!wotm) throw new Error(`[validate] Geen wotm voor match ${mid}`);
    const { data: st } = await client.from("match_player_stats").select("player_id,goals,assists").eq("match_id", mid);
    const rows = st ?? [];
    const sumG = rows.reduce((s: number, r: { goals: number }) => s + Number(r.goals ?? 0), 0);
    if (sumG !== gf) throw new Error(`[validate] Match ${mid}: sum stats goals ${sumG} ≠ goals_for ${gf}`);
    const hasMvp = rows.some((r: { player_id: string }) => r.player_id === wotm);
    if (!hasMvp) throw new Error(`[validate] Match ${mid}: MVP niet in stats`);
    const pidSet = new Set(rows.map((r: { player_id: string }) => r.player_id));
    if (pidSet.size !== rows.length) throw new Error(`[validate] Match ${mid}: dubbele stats-rij`);
  }
  console.log(`[validate] Alle ${played.length} gespeelde wedstrijden in seizoen OK.`);
}

function mapRowToFitnessTest(r: Record<string, unknown>): FitnessTest {
  const testOn = typeof r.test_on === "string" ? r.test_on.slice(0, 10) : String(r.recorded_at ?? "").slice(0, 10);
  const s20 = Number(r.sprint_20m ?? 0);
  const s40 = Number(r.sprint_40m ?? 0);
  const s60 = Number(r.sprint_60m ?? 0);
  const tt = r.total_time != null ? Number(r.total_time) : s20 + s40 + s60;
  const ps = r.progress_status;
  const validPs = ["improved", "declined", "equal", "no_previous"];
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    player_id: String(r.player_id),
    test_type: "sprint_20_40_60",
    test_on: testOn,
    total_time: tt,
    sprint_20m: s20,
    sprint_40m: s40,
    sprint_60m: s60,
    recorded_at: String(r.recorded_at),
    note: r.note != null ? String(r.note) : null,
    progress_status: typeof ps === "string" && validPs.includes(ps) ? (ps as FitnessTest["progress_status"]) : null,
    progress_delta: r.progress_delta != null ? Number(r.progress_delta) : null,
    session_rank: r.session_rank != null ? Number(r.session_rank) : null,
  };
}

async function fetchSeasonFitnessTests(client: SupabaseClient, seasonId: string): Promise<FitnessTest[]> {
  const { data, error } = await client.from("fitness_tests").select("*").eq("season_id", seasonId).eq("test_type", "sprint_20_40_60");
  if (error) throw error;
  return (data ?? []).map((r) => mapRowToFitnessTest(r as Record<string, unknown>));
}

async function pushFitnessAnalytics(client: SupabaseClient, tests: FitnessTest[]): Promise<void> {
  const chunk = 80;
  for (let i = 0; i < tests.length; i += chunk) {
    const slice = tests.slice(i, i + chunk).map((f) => ({
      id: f.id,
      season_id: f.season_id,
      player_id: f.player_id,
      test_type: f.test_type,
      test_on: f.test_on,
      total_time: f.total_time,
      sprint_20m: f.sprint_20m,
      sprint_40m: f.sprint_40m,
      sprint_60m: f.sprint_60m,
      recorded_at: f.recorded_at,
      note: f.note,
      progress_status: f.progress_status,
      progress_delta: f.progress_delta,
      session_rank: f.session_rank,
    }));
    const { error } = await client.from("fitness_tests").upsert(slice as never[], { onConflict: "id" });
    if (error) throw new Error(`fitness analytics push: ${error.message}`);
  }
}

async function importFitnessFromFile(client: SupabaseClient, seasonId: string, players: ImportPlayerRow[]): Promise<void> {
  const path = resolve(process.cwd(), "data/import-fitness.txt");
  if (!existsSync(path)) throw new Error(`Ontbreekt: ${path}`);
  const text = readFileSync(path, "utf8");
  const blocks = parseFitnessImportText(text);
  const requiredDates = new Set(["2026-01-26", "2026-02-11"]);
  const seenDates = new Set(blocks.map((b) => b.testOn));
  for (const d of requiredDates) {
    if (!seenDates.has(d)) throw new Error(`Fitheid: datum ${d} ontbreekt in import-fitness.txt`);
  }

  const { data: memRows, error: memErr } = await client.from("player_season_memberships").select("player_id").eq("season_id", seasonId);
  if (memErr) throw memErr;
  const memberIds = new Set((memRows ?? []).map((m: { player_id: string }) => m.player_id));

  let upserted = 0;
  for (const block of blocks) {
    if (!requiredDates.has(block.testOn)) continue;
    const seenPlayers = new Set<string>();
    for (const row of block.rows) {
      const sec = parseSprintTimeToSeconds(row.timeRaw);
      if (sec === null) throw new Error(`Ongeldige tijd: "${row.timeRaw}" op ${block.testOn}`);

      for (const rawName of row.nameParts) {
        const r = resolvePlayerStrict(players, rawName.trim());
        if (r.isGuest) throw new Error(`Geen gasten in fitheid-import: ${rawName}`);
        if (!memberIds.has(r.id)) throw new Error(`Fitheid: ${r.full_name} zit niet in seizoen ${seasonId}`);
        if (seenPlayers.has(r.id)) throw new Error(`Dubbel op ${block.testOn}: ${r.full_name}`);
        seenPlayers.add(r.id);

        const payload = {
          season_id: seasonId,
          player_id: r.id,
          test_type: "sprint_20_40_60" as const,
          test_on: block.testOn,
          total_time: sec,
          sprint_20m: 0,
          sprint_40m: 0,
          sprint_60m: 0,
          recorded_at: `${block.testOn}T12:00:00.000Z`,
          note: null,
          progress_status: null as string | null,
          progress_delta: null as number | null,
          session_rank: null as number | null,
        };

        const { error: upErr } = await client.from("fitness_tests").upsert(payload as never, { onConflict: "player_id,season_id,test_on" });
        if (upErr) throw new Error(`Fitheid upsert ${r.full_name}: ${upErr.message}`);
        upserted++;
      }
    }
  }

  const allTests = await fetchSeasonFitnessTests(client, seasonId);
  recomputeFitnessAnalyticsForTests(allTests, seasonId);
  await pushFitnessAnalytics(client, allTests);
  console.log(`[fix] Fitheid: ${upserted} metingen geüpsert + progressie/rank herberekend.`);
}

async function assertFitnessExists(client: SupabaseClient, seasonId: string): Promise<void> {
  const { data, error } = await client
    .from("fitness_tests")
    .select("id,test_on")
    .eq("season_id", seasonId)
    .eq("test_type", "sprint_20_40_60")
    .in("test_on", ["2026-01-26", "2026-02-11"]);
  if (error) throw error;
  const rows = data ?? [];
  for (const d of ["2026-01-26", "2026-02-11"] as const) {
    const n = rows.filter((r: { test_on: string }) => r.test_on === d).length;
    if (n === 0) throw new Error(`[validate] Geen fitheid op ${d}`);
  }
  console.log(`[validate] Fitheid op 2026-01-26 en 2026-02-11: ${rows.length} rijen totaal.`);
}

async function main(): Promise<void> {
  assertSupabaseServiceRoleEnv();
  const seasonId = process.argv[2]?.trim() || DEFAULT_SEASON_ID;
  const client = createClient(getSupabaseUrl(), getServiceRoleKey());

  console.log("[fix] Start production-club-data-fix, season_id:", seasonId);

  await renamePitouIfNeeded(client);
  await ensureGuests(client);

  const { data: plRows, error: plErr } = await client.from("players").select("id,full_name,is_guest");
  if (plErr) throw plErr;
  const players: ImportPlayerRow[] = (plRows ?? []) as ImportPlayerRow[];

  const roster = validateCanonicalRoster(players);
  if (!roster.ok) {
    console.error("[fix] Roster-validatie GEFAALD:");
    roster.errors.forEach((e) => console.error("  -", e));
    throw new Error("STOP: canonieke selectie klopt niet.");
  }
  console.log("[fix] Canonieke roster: 22 speelsters OK (exacte namen).");

  for (const spec of ATOMIC_MATCH_SPECS) {
    await importOneMatchSpec(client, seasonId, players, spec);
  }

  await applyCaptains(client, seasonId, players);
  await importFitnessFromFile(client, seasonId, players);
  await validateAllPlayedMatches(client, seasonId);
  await assertFitnessExists(client, seasonId);

  console.log("\n========== KLAAR ==========");
  console.log("- 22 niet-gast spelers, exact canoniek");
  console.log("- Gasten Esmee & Micah aanwezig");
  console.log("- 14 wedstrijden: stats + events + MVP consistent");
  console.log("- 1 captain / 1 vice");
  console.log("- Fitheid 2026-01-26 & 2026-02-11 geïmporteerd");
  console.log("Vernieuw de site (cache) na afloop.");
}

main().catch((e) => {
  console.error("[fix] FATAAL — gestopt:", e instanceof Error ? e.message : e);
  process.exit(1);
});
