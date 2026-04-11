/**
 * Productie-audit: leest Supabase (service role) en rapporteert inconsistenties.
 * Geen writes — alleen checks.
 *
 *   cd platform && npm run audit:club -- [season_id]
 *
 * Zonder season_id: gebruikt het actieve seizoen (`is_active`).
 *
 * Elke ❌ hieronder → exit 1 (productie-gate).
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import { fitnessTotalSeconds, progressFromTotals, round2 } from "@/lib/fitness-analytics";
import type { FitnessTest, FitnessProgressStatus } from "@/types";

const TABLES = [
  "club_profile",
  "seasons",
  "players",
  "player_season_memberships",
  "matches",
  "match_player_stats",
  "match_goal_events",
  "match_matchday_roster",
  "training_sessions",
  "training_attendance",
  "fitness_tests",
  "profiles",
  "admin_logs",
] as const;

/** Minimale kolommen per tabel (PostgREST select — faalt als kolom ontbreekt). */
const REQUIRED_COLUMNS: Record<string, string> = {
  club_profile: "id,team_photo_url,schema_version",
  seasons: "id,name,starts_on,ends_on,is_active",
  players: "id,full_name,photo_url,is_guest",
  player_season_memberships:
    "id,player_id,season_id,shirt_number,position,display_position,is_captain,is_vice_captain,is_guest",
  matches: "id,season_id,opponent,kickoff_at,is_home,goals_for,goals_against,status,wotm_player_id",
  match_player_stats: "match_id,player_id,goals,assists",
  match_goal_events: "id,match_id,scorer_player_id,assist_player_id,sort_order",
  match_matchday_roster: "match_id,player_id,match_shirt_number,position_label",
  training_sessions: "id,season_id,title,session_at,location",
  training_attendance: "session_id,player_id,present,note",
  fitness_tests:
    "id,season_id,player_id,test_type,test_on,sprint_20m,sprint_40m,sprint_60m,total_time,recorded_at,note,progress_status,progress_delta,session_rank",
  profiles: "id,role,created_at,updated_at",
  admin_logs: "id,user_id,action,entity,entity_id,created_at",
};

/** Canoniek voor `seed:club` (2025/26). */
const CANON_ROSTER_SIZE = 22;
const CANON_CAPTAIN_NAME = "Melissa Rietveld";
const CANON_VICE_NAME = "Dionne van Dijk";

type Row = Record<string, unknown>;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function asFitnessRow(r: Row): FitnessTest {
  const s20 = num(r.sprint_20m);
  const s40 = num(r.sprint_40m);
  const s60 = num(r.sprint_60m);
  const tt = r.total_time != null ? num(r.total_time) : s20 + s40 + s60;
  const ps = r.progress_status;
  const validPs: FitnessProgressStatus[] = ["improved", "declined", "equal", "no_previous"];
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    player_id: String(r.player_id),
    test_type: "sprint_20_40_60",
    test_on: typeof r.test_on === "string" ? r.test_on.slice(0, 10) : "",
    total_time: tt,
    sprint_20m: s20,
    sprint_40m: s40,
    sprint_60m: s60,
    recorded_at: String(r.recorded_at ?? ""),
    note: r.note != null ? String(r.note) : null,
    progress_status: typeof ps === "string" && validPs.includes(ps as FitnessProgressStatus) ? (ps as FitnessProgressStatus) : null,
    progress_delta: r.progress_delta != null ? num(r.progress_delta) : null,
    session_rank: r.session_rank != null ? num(r.session_rank) : null,
  };
}

async function main(): Promise<void> {
  assertSupabaseServiceRoleEnv();
  const seasonArg = process.argv[2]?.trim();
  const client = createClient(getSupabaseUrl(), getServiceRoleKey());

  const broken: string[] = [];
  const risk: string[] = [];
  const ok: string[] = [];

  for (const table of TABLES) {
    const { error } = await client.from(table).select("*").limit(0);
    if (error) broken.push(`Tabel '${table}': ${error.message}`);
    else ok.push(`Tabel '${table}': OK`);
  }

  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    const { error } = await client.from(table).select(cols).limit(0);
    if (error) broken.push(`Kolommen '${table}' (${cols}): ${error.message}`);
    else ok.push(`Kolommen '${table}': OK`);
  }

  const { data: activeSeason, error: eAct } = await client
    .from("seasons")
    .select("id,name")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (eAct) broken.push(`Actief seizoen lezen: ${eAct.message}`);

  const seasonId = seasonArg || (activeSeason as { id?: string } | null)?.id;
  if (!seasonId) {
    broken.push("Geen season_id (geen actief seizoen en geen argument).");
    printReport(ok, risk, broken);
    process.exit(1);
  }

  const { data: playersRaw, error: ePl } = await client.from("players").select("id,full_name,is_guest");
  if (ePl) broken.push(`players: ${ePl.message}`);
  const players = (playersRaw ?? []) as { id: string; full_name: string; is_guest: boolean }[];
  const playerById = new Map(players.map((p) => [p.id, p]));

  const nameBuckets = new Map<string, string[]>();
  for (const p of players) {
    const k = p.full_name.trim().toLowerCase();
    if (!nameBuckets.has(k)) nameBuckets.set(k, []);
    nameBuckets.get(k)!.push(p.id);
  }
  for (const [name, ids] of nameBuckets) {
    if (ids.length > 1) broken.push(`Dubbele spelersnaam (${ids.length}x): "${name}"`);
  }

  const { data: memRaw, error: eMem } = await client.from("player_season_memberships").select("*").eq("season_id", seasonId);
  if (eMem) broken.push(`Lidmaatschappen: ${eMem.message}`);
  const memberships = (memRaw ?? []) as Row[];

  const nonGuestMembers = memberships.filter((m) => !m.is_guest);
  if (nonGuestMembers.length !== CANON_ROSTER_SIZE) {
    broken.push(`Selectie (niet-gast): ${nonGuestMembers.length} speelsters (verwacht exact ${CANON_ROSTER_SIZE}).`);
  }

  const nonGuestPlayersTotal = players.filter((p) => !p.is_guest).length;
  if (nonGuestPlayersTotal !== CANON_ROSTER_SIZE) {
    broken.push(`Totaal niet-gast in 'players': ${nonGuestPlayersTotal} (verwacht exact ${CANON_ROSTER_SIZE}).`);
  }

  const shirtMap = new Map<number, string[]>();
  for (const m of memberships) {
    const sn = num(m.shirt_number);
    if (!Number.isInteger(sn) || sn < 1) {
      broken.push(`Ongeldig rugnummer bij player_id ${m.player_id}`);
      continue;
    }
    if (!shirtMap.has(sn)) shirtMap.set(sn, []);
    shirtMap.get(sn)!.push(String(m.player_id));
  }
  for (const [sn, ids] of shirtMap) {
    if (ids.length > 1) broken.push(`Dubbel rugnummer ${sn} in seizoen`);
  }

  const captains = memberships.filter((m) => m.is_captain);
  const vices = memberships.filter((m) => m.is_vice_captain);
  if (captains.length !== 1) broken.push(`is_captain: ${captains.length} rijen (verwacht 1)`);
  else {
    const nm = playerById.get(String(captains[0].player_id))?.full_name ?? "?";
    if (nm !== CANON_CAPTAIN_NAME) {
      broken.push(`Aanvoerder = "${nm}" (verwacht exact "${CANON_CAPTAIN_NAME}").`);
    }
  }
  if (vices.length !== 1) broken.push(`is_vice_captain: ${vices.length} rijen (verwacht 1)`);
  else {
    const nm = playerById.get(String(vices[0].player_id))?.full_name ?? "?";
    if (nm !== CANON_VICE_NAME) {
      broken.push(`Assistent = "${nm}" (verwacht exact "${CANON_VICE_NAME}").`);
    }
  }

  for (const m of memberships) {
    if (!playerById.has(String(m.player_id))) {
      broken.push(`Orphan lidmaatschap: onbekende player_id ${m.player_id}`);
    }
  }

  const { data: matchesRaw, error: eM } = await client.from("matches").select("*").eq("season_id", seasonId);
  if (eM) broken.push(`matches: ${eM.message}`);
  const matches = (matchesRaw ?? []) as Row[];
  if (matches.length === 0) {
    broken.push("Geen wedstrijden voor dit seizoen.");
  }
  const matchIds = new Set(matches.map((m) => String(m.id)));

  const { data: allMatchRows, error: eAllM } = await client.from("matches").select("id");
  if (eAllM) broken.push(`matches (alle id's): ${eAllM.message}`);
  const globalMatchIds = new Set((allMatchRows ?? []).map((r: Row) => String(r.id)));

  const { data: statsRaw, error: eS } = await client.from("match_player_stats").select("*");
  if (eS) broken.push(`match_player_stats: ${eS.message}`);
  const allStats = (statsRaw ?? []) as Row[];
  const statsForSeason = allStats.filter((s) => matchIds.has(String(s.match_id)));

  for (const s of allStats) {
    if (!globalMatchIds.has(String(s.match_id))) {
      broken.push(`Orphan match_player_stats: onbekende match_id ${s.match_id}`);
    }
  }

  for (const m of matches) {
    if (String(m.status) !== "played") continue;
    const mid = String(m.id);
    const rows = statsForSeason.filter((s) => String(s.match_id) === mid);
    const sumGoals = rows.reduce((a, r) => a + num(r.goals), 0);
    const gf = num(m.goals_for);
    if (sumGoals !== gf) {
      broken.push(`Wedstrijd ${m.opponent} (${mid.slice(0, 8)}…): goals_for=${gf} ≠ som(stats.goals)=${sumGoals}`);
    }
    if (gf > 0 && rows.length === 0) {
      broken.push(`Wedstrijd ${m.opponent}: goals_for=${gf} maar geen match_player_stats`);
    }
    const wotm = m.wotm_player_id ? String(m.wotm_player_id) : "";
    if (wotm && !playerById.has(wotm)) {
      broken.push(`Wedstrijd ${m.opponent}: wotm_player_id onbekend`);
    }
    if (wotm && rows.length && !rows.some((r) => String(r.player_id) === wotm)) {
      broken.push(`Wedstrijd ${m.opponent}: MVP staat niet in match_player_stats (geen stats-rij voor MVP).`);
    }
  }

  const { data: eventsRaw, error: eE } = await client.from("match_goal_events").select("*");
  if (eE) broken.push(`match_goal_events: ${eE.message}`);
  const events = (eventsRaw ?? []) as Row[];
  const evForSeason = events.filter((e) => matchIds.has(String(e.match_id)));
  const evKeys = new Set<string>();
  for (const e of evForSeason) {
    const k = `${e.match_id}:${e.sort_order}`;
    if (evKeys.has(k)) broken.push(`Dubbel goal-event sort_order ${k}`);
    evKeys.add(k);
    if (!playerById.has(String(e.scorer_player_id))) broken.push(`Goal-event onbekende scorer ${e.scorer_player_id}`);
    if (e.assist_player_id && !playerById.has(String(e.assist_player_id))) {
      broken.push(`Goal-event onbekende assist ${e.assist_player_id}`);
    }
  }

  const assistFromEvents = evForSeason.filter((e) => e.assist_player_id).length;
  const assistFromStats = statsForSeason.reduce((a, r) => a + num(r.assists), 0);
  if (evForSeason.length > 0 && assistFromEvents !== assistFromStats) {
    broken.push(
      `Assists-sync: ${assistFromEvents} goal_events met assist vs ${assistFromStats} som(assists) in match_player_stats (dit seizoen).`,
    );
  }

  const { data: rosterRaw, error: eR } = await client.from("match_matchday_roster").select("*");
  if (eR) broken.push(`match_matchday_roster: ${eR.message}`);
  for (const r of (rosterRaw ?? []) as Row[]) {
    if (!globalMatchIds.has(String(r.match_id))) {
      broken.push(`Roster onbekende match_id ${r.match_id}`);
    }
    if (!playerById.has(String(r.player_id))) broken.push(`Roster onbekende player ${r.player_id}`);
  }

  const { data: sessRaw, error: eSe } = await client.from("training_sessions").select("id").eq("season_id", seasonId);
  if (eSe) broken.push(`training_sessions: ${eSe.message}`);
  const sessionIds = new Set((sessRaw ?? []).map((r: Row) => String(r.id)));

  const { data: attRaw, error: eAt } = await client.from("training_attendance").select("*");
  if (eAt) broken.push(`training_attendance: ${eAt.message}`);
  for (const a of (attRaw ?? []) as Row[]) {
    if (!sessionIds.has(String(a.session_id))) continue;
    if (!playerById.has(String(a.player_id))) broken.push(`Aanwezigheid onbekende speler ${a.player_id}`);
  }

  const { data: fitRaw, error: eF } = await client.from("fitness_tests").select("*").eq("season_id", seasonId);
  if (eF) broken.push(`fitness_tests: ${eF.message}`);
  const fitRows = (fitRaw ?? []) as Row[];
  for (const r of fitRows) {
    if (!playerById.has(String(r.player_id))) broken.push(`Fitness onbekende speler ${r.player_id}`);
    const f = asFitnessRow(r);
    if (f.test_type !== "sprint_20_40_60") broken.push(`Fitness ${f.id}: onverwacht test_type`);
    const sec = fitnessTotalSeconds(f);
    if (!Number.isFinite(sec) || sec <= 0) broken.push(`Fitness speler ${f.player_id} op ${f.test_on}: ongeldige totaaltijd`);
  }

  const sprintTests = fitRows.filter((r) => String(r.test_type) === "sprint_20_40_60").map(asFitnessRow);
  if (sprintTests.length === 0) {
    broken.push("Geen fitness_tests (sprint_20_40_60) voor dit seizoen.");
  }
  const fitKeys = new Map<string, number>();
  for (const t of sprintTests) {
    const k = `${t.player_id}:${t.test_on}`;
    fitKeys.set(k, (fitKeys.get(k) ?? 0) + 1);
  }
  for (const [k, c] of fitKeys) {
    if (c > 1) broken.push(`Dubbele fitness voor speler+datum: ${k} (${c}x)`);
  }
  const distinctFitDates = new Set(sprintTests.map((t) => t.test_on));
  if (distinctFitDates.size > 0 && distinctFitDates.size < 2) {
    broken.push(`Fitheid: slechts ${distinctFitDates.size} testdag(en); minimaal 2 datums vereist.`);
  }

  const byPlayer = new Map<string, FitnessTest[]>();
  for (const t of sprintTests) {
    if (!byPlayer.has(t.player_id)) byPlayer.set(t.player_id, []);
    byPlayer.get(t.player_id)!.push(t);
  }

  let latestOn = "";
  for (const t of sprintTests) {
    if (t.test_on > latestOn) latestOn = t.test_on;
  }
  const rankExpected = new Map<string, number | null>();
  if (latestOn) {
    const bucket = sprintTests.filter((t) => t.test_on === latestOn);
    bucket.sort((a, b) => {
      const ta = fitnessTotalSeconds(a);
      const tb = fitnessTotalSeconds(b);
      if (ta !== tb) return ta - tb;
      return a.player_id.localeCompare(b.player_id);
    });
    for (let i = 0; i < bucket.length; i++) {
      rankExpected.set(bucket[i].id, i < 3 ? i + 1 : null);
    }
  }

  let fitnessRowsMissingProgress = 0;
  for (const t of sprintTests) {
    const arr = byPlayer.get(t.player_id)!.slice().sort((a, b) => a.test_on.localeCompare(b.test_on));
    const idx = arr.findIndex((x) => x.id === t.id);
    const prev = idx > 0 ? arr[idx - 1] : null;
    const prevTotal = prev ? fitnessTotalSeconds(prev) : null;
    const curTotal = fitnessTotalSeconds(t);
    const { status, delta } = progressFromTotals(prevTotal, curTotal);
    const st = t.progress_status;
    const d = t.progress_delta;
    if (st === null) {
      fitnessRowsMissingProgress++;
    } else if (st !== status) {
      broken.push(`Fitness progress_status DB="${st}" verwacht="${status}" (${t.player_id} ${t.test_on})`);
    }
    if (st !== null) {
      if (status === "no_previous") {
        if (d !== null) broken.push(`progress_delta moet NULL zijn bij no_previous (${t.id})`);
      } else if (delta === null) {
        if (d !== null) broken.push(`progress_delta inconsistent (${t.id})`);
      } else if (round2(Number(d)) !== round2(delta)) {
        broken.push(`progress_delta DB=${d} verwacht=${delta} (${t.player_id} ${t.test_on})`);
      }
    }

    const expRank = rankExpected.get(t.id);
    if (expRank !== undefined && (t.session_rank ?? null) !== (expRank ?? null)) {
      broken.push(`session_rank DB=${t.session_rank} verwacht=${expRank} (${t.player_id} ${t.test_on}, laatste dag)`);
    }
    if (!latestOn && t.session_rank != null) {
      broken.push(`session_rank gezet zonder testdata (id ${t.id})`);
    }
    if (latestOn && t.test_on !== latestOn && t.session_rank != null) {
      broken.push(`session_rank moet NULL zijn op oudere testdag (${t.test_on} id ${t.id})`);
    }
  }
  if (fitnessRowsMissingProgress > 0) {
    broken.push(
      `${fitnessRowsMissingProgress} fitness-rijen zonder progress_status (Beheer fitheid opslaan of import + migratie 008).`,
    );
  }

  const { data: profile, error: eP } = await client.from("club_profile").select("id,team_photo_url,schema_version").eq("id", "default").maybeSingle();
  if (eP) broken.push(`club_profile: ${eP.message}`);
  else if (!profile) {
    broken.push("club_profile: ontbrekende rij id='default' (draai migratie 001/003).");
  } else {
    ok.push("club_profile: rij default aanwezig");
    if ((profile as Row).schema_version === undefined || (profile as Row).schema_version === null) {
      broken.push("club_profile.schema_version ontbreekt (migratie 003).");
    }
    if (!(profile as Row)?.team_photo_url) {
      risk.push("club_profile.team_photo_url is leeg (homepage toont fallback / public/team.jpg).");
    }
  }

  const { data: teamFiles, error: stErr } = await client.storage.from("team").list("", { limit: 100 });
  if (stErr) {
    risk.push(`Storage bucket 'team': ${stErr.message} (migratie 004 uitgevoerd?)`);
  } else {
    const hasCanonical = (teamFiles ?? []).some((f) => f.name === "team-photo.jpg");
    if (hasCanonical) ok.push("Storage team/team-photo.jpg: object aanwezig");
    else risk.push("Storage bucket 'team' heeft geen 'team-photo.jpg' — upload via Beheer (club-instellingen).");
  }

  printReport(ok, risk, broken);
  process.exit(broken.length ? 1 : 0);
}

function printReport(ok: string[], risk: string[], broken: string[]): void {
  console.log("\n========== ZVV PLATFORM AUDIT ==========\n");
  console.log("OK (" + ok.length + "):");
  ok.forEach((l) => console.log("  ✅", l));
  if (risk.length) {
    console.log("\n⚠️  RISICO / AFWIJKING (" + risk.length + "):");
    risk.forEach((l) => console.log("  ⚠️ ", l));
  }
  if (broken.length) {
    console.log("\n❌ FOUT (" + broken.length + "):");
    broken.forEach((l) => console.log("  ❌", l));
  }
  console.log("\n========================================\n");
  if (broken.length) console.log("Exit 1 — repareer fouten hierboven.\n");
  else if (risk.length) console.log("Exit 0 — geen harde fouten; controleer waarschuwingen.\n");
  else console.log("Exit 0 — geen problemen gedetecteerd.\n");
}

main().catch((e) => {
  console.error("[audit] Fataal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
