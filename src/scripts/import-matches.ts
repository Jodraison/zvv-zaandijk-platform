/**
 * Professionele wedstrijd-import uit gestructureerde tekst (geen handmatige admin per wedstrijd).
 *
 * Formaat: blokken gescheiden door een regel met alleen ===
 * Zie `src/lib/import/parse-match-blocks.ts` voor volledige syntax.
 *
 * Gebruik:
 *   cd platform && npm run import:matches -- [bestand.txt] [season_id]
 *   Standaard bestand: data/import-matches.txt
 *
 * Env: zelfde als seed (.env.local) — SUPABASE_SERVICE_ROLE_KEY verplicht.
 *
 * Na import: Next.js cache — vernieuw de site of herstart `npm run dev`.
 * Optioneel: IMPORT_BUMP_SCHEMA_VERSION=true om club_profile.schema_version +1 te zetten
 * (helpt bij optimistic lock / bewust cache-invalideren).
 */

import "./load-platform-env";

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { aggregateStatsFromGoals, type GoalRowInput } from "@/lib/match-goal-helpers";
import {
  normalizePlayerName,
  resolvePlayerId,
  parseMvpPrimaryName,
  type ImportPlayerRow,
} from "@/lib/import/normalize-player-name";
import {
  splitMatchBlocks,
  parseMatchBlock,
  countGoalsFromLines,
  type ParsedMatchBlock,
  type ParsedGoalLine,
} from "@/lib/import/parse-match-blocks";

const SCHEMA_CHECK: { table: string; columns: string }[] = [
  { table: "matches", columns: "id,season_id,opponent,kickoff_at,is_home,goals_for,goals_against,status,wotm_player_id" },
  { table: "match_player_stats", columns: "match_id,player_id,goals,assists" },
  { table: "match_goal_events", columns: "id,match_id,scorer_player_id,assist_player_id,sort_order" },
  { table: "players", columns: "id,full_name,is_guest" },
];

async function assertSchema(client: SupabaseClient): Promise<void> {
  for (const { table, columns } of SCHEMA_CHECK) {
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) throw new Error(`Schema '${table}': ${error.message}`);
  }
}

function expandGoalLines(
  lines: ParsedGoalLine[],
  resolveName: (raw: string) => { id: string; matchedAs: string } | null,
): { goals: GoalRowInput[]; errors: string[]; matchedNames: Map<string, string> } {
  const goals: GoalRowInput[] = [];
  const errors: string[] = [];
  const matchedNames = new Map<string, string>();

  const track = (id: string, as: string) => matchedNames.set(id, as);

  for (const l of lines) {
    if (l.type === "bulk") {
      const r = resolveName(l.scorerRaw);
      if (!r) {
        errors.push(`Onbekende speelster (doelpunt): "${l.scorerRaw}"`);
        continue;
      }
      track(r.id, r.matchedAs);
      for (let i = 0; i < l.count; i++) {
        goals.push({ scorer_player_id: r.id });
      }
    } else {
      const sr = resolveName(l.scorerRaw);
      const ar = resolveName(l.assistRaw);
      if (!sr) errors.push(`Onbekende scorer: "${l.scorerRaw}"`);
      if (!ar) errors.push(`Onbekende assist: "${l.assistRaw}"`);
      if (sr && ar) {
        if (sr.id === ar.id) {
          errors.push(`Scorer en assist identiek: "${l.scorerRaw}" / "${l.assistRaw}"`);
          continue;
        }
        track(sr.id, sr.matchedAs);
        track(ar.id, ar.matchedAs);
        goals.push({ scorer_player_id: sr.id, assist_player_id: ar.id });
      }
    }
  }
  return { goals, errors, matchedNames };
}

async function getActiveSeasonId(client: SupabaseClient, explicit?: string): Promise<string> {
  if (explicit?.trim()) return explicit.trim();
  const { data, error } = await client.from("seasons").select("id").eq("is_active", true).limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Geen actief seizoen; geef season_id als tweede argument of zet is_active in Supabase.");
  return data.id;
}

async function findExistingMatchId(
  client: SupabaseClient,
  seasonId: string,
  opponent: string,
  kickoffIso: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("matches")
    .select("id,kickoff_at")
    .eq("season_id", seasonId)
    .eq("opponent", opponent.trim());
  if (error) throw error;
  const t = new Date(kickoffIso).getTime();
  const row = (data ?? []).find((m) => new Date(String(m.kickoff_at)).getTime() === t);
  return row?.id ?? null;
}

async function bumpSchemaVersion(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.from("club_profile").select("schema_version").eq("id", "default").maybeSingle();
  if (error) {
    console.warn("[import] club_profile schema_version niet gelezen:", error.message);
    return;
  }
  const v = Number((data as { schema_version?: number })?.schema_version ?? 0);
  const { error: up } = await client.from("club_profile").update({ schema_version: v + 1 }).eq("id", "default");
  if (up) console.warn("[import] schema_version bump mislukt:", up.message);
  else console.log("[import] club_profile.schema_version →", v + 1);
}

async function importOneMatch(
  client: SupabaseClient,
  seasonId: string,
  block: ParsedMatchBlock,
  players: ImportPlayerRow[],
  log: (m: string) => void,
  warn: (m: string) => void,
): Promise<boolean> {
  const kick = new Date(block.kickoffRaw);
  if (Number.isNaN(kick.getTime())) {
    log(`SKIP: ongeldige kickoff "${block.kickoffRaw}"`);
    return false;
  }
  const kickoffIso = kick.toISOString();

  const resolveName = (raw: string) => resolvePlayerId(normalizePlayerName(raw), players);

  const expectedGoals = countGoalsFromLines(block.goalLines);
  if (expectedGoals !== block.goalsFor) {
    log(
      `SKIP: aantal doelpunten in tekst (${expectedGoals}) komt niet overeen met score (${block.goalsFor} voor).`,
    );
    return false;
  }

  const { goals: goalInputs, errors: goalErrors, matchedNames } = expandGoalLines(block.goalLines, resolveName);
  if (goalErrors.length) {
    goalErrors.forEach((e) => log(`  ${e}`));
    log("SKIP: onopgeloste speelsters in doelpunten");
    return false;
  }

  if (goalInputs.length !== block.goalsFor) {
    log(`SKIP: intern: goalInputs.length ${goalInputs.length} ≠ goalsFor ${block.goalsFor}`);
    return false;
  }

  const mvpPrimary = parseMvpPrimaryName(block.mvpRaw, (m) => warn(`[mvp] ${m}`));
  const mvpResolved = resolveName(mvpPrimary);
  if (!mvpResolved) {
    log(`SKIP: MVP niet gevonden: "${mvpPrimary}" (uit "${block.mvpRaw}")`);
    return false;
  }
  matchedNames.set(mvpResolved.id, mvpResolved.matchedAs);

  const selectedSet = new Set<string>();
  for (const g of goalInputs) {
    selectedSet.add(g.scorer_player_id);
    if (g.assist_player_id) selectedSet.add(g.assist_player_id);
  }
  selectedSet.add(mvpResolved.id);

  for (const raw of block.squadRaw) {
    const r = resolveName(raw);
    if (!r) {
      log(`SKIP: squad onbekend: "${raw}"`);
      return false;
    }
    matchedNames.set(r.id, r.matchedAs);
    selectedSet.add(r.id);
  }

  const selectedPlayerIds = [...selectedSet];

  let matchId = block.explicitMatchId?.trim() || null;
  if (!matchId) {
    matchId = await findExistingMatchId(client, seasonId, block.opponent, kickoffIso);
  }
  if (!matchId) {
    matchId = randomUUID();
  }

  const { goals_for: gf, stats: statsFinal, events: eventsFinal } = aggregateStatsFromGoals(
    matchId,
    selectedPlayerIds,
    goalInputs,
  );

  if (gf !== block.goalsFor) {
    log(`SKIP: aggregate goals_for ${gf} ≠ ${block.goalsFor}`);
    return false;
  }

  const pairAssistCount = block.goalLines.filter((l) => l.type === "pair").length;
  const assistTotal = statsFinal.reduce((a, s) => a + s.assists, 0);
  if (assistTotal !== pairAssistCount) {
    log(`SKIP: assists in stats (${assistTotal}) ≠ aantal scorer+assist regels (${pairAssistCount})`);
    return false;
  }

  const matchRow = {
    id: matchId,
    season_id: seasonId,
    opponent: block.opponent.trim(),
    kickoff_at: kickoffIso,
    is_home: block.isHome,
    goals_for: block.goalsFor,
    goals_against: block.goalsAgainst,
    status: "played" as const,
    wotm_player_id: mvpResolved.id,
  };

  const { error: eDelSt } = await client.from("match_player_stats").delete().eq("match_id", matchId);
  if (eDelSt) {
    log(`SKIP: stats wissen mislukt: ${eDelSt.message}`);
    return false;
  }
  const { error: eDelEv } = await client.from("match_goal_events").delete().eq("match_id", matchId);
  if (eDelEv) {
    log(`SKIP: events wissen mislukt: ${eDelEv.message}`);
    return false;
  }

  const { error: eM } = await client.from("matches").upsert(matchRow as never, { onConflict: "id" });
  if (eM) {
    log(`SKIP: match upsert: ${eM.message}`);
    return false;
  }

  if (statsFinal.length) {
    const { error: eS } = await client.from("match_player_stats").upsert(statsFinal as never[], {
      onConflict: "match_id,player_id",
    });
    if (eS) {
      log(`SKIP: match_player_stats: ${eS.message}`);
      return false;
    }
  }

  const eventsWithIds = eventsFinal.map((e) => ({
    id: randomUUID(),
    match_id: e.match_id,
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id,
    sort_order: e.sort_order,
  }));

  if (eventsWithIds.length) {
    const { error: eE } = await client.from("match_goal_events").insert(eventsWithIds as never[]);
    if (eE) {
      log(`SKIP: match_goal_events: ${eE.message}`);
      return false;
    }
  }

  log(
    `OK  ${block.opponent} ${kickoffIso.slice(0, 10)}  ${block.goalsFor}-${block.goalsAgainst}  MVP=${mvpResolved.matchedAs}  match_id=${matchId}`,
  );
  const names = [...new Set(matchedNames.values())];
  log(`    spelers: ${names.sort((a, b) => a.localeCompare(b, "nl")).join(", ")}`);
  return true;
}

async function main(): Promise<void> {
  assertSupabaseServiceRoleEnv();
  const fileArg = process.argv[2];
  const seasonArg = process.argv[3];

  const defaultFile = resolve(process.cwd(), "data/import-matches.txt");
  const filePath = fileArg && fileArg !== "-" ? resolve(process.cwd(), fileArg) : defaultFile;

  if (!existsSync(filePath)) {
    console.error(`Bestand ontbreekt: ${filePath}`);
    console.error("Maak data/import-matches.txt aan of geef een pad: npm run import:matches -- pad/naar.txt");
    process.exit(1);
  }

  const text = readFileSync(filePath, "utf8");
  if (!text.trim()) {
    console.error("Bestand is leeg. Plak wedstrijdblokken (=== …) in data/import-matches.txt");
    process.exit(1);
  }

  const client = createClient(getSupabaseUrl(), getServiceRoleKey());
  await assertSchema(client);

  const seasonId = await getActiveSeasonId(client, seasonArg);
  console.log("[import] season_id:", seasonId);
  console.log("[import] bron:", filePath);

  const { data: plRows, error: plErr } = await client.from("players").select("id,full_name,is_guest");
  if (plErr) throw plErr;
  const players: ImportPlayerRow[] = (plRows ?? []) as ImportPlayerRow[];

  const blocks = splitMatchBlocks(text);
  console.log("[import] blokken:", blocks.length);
  if (blocks.length === 0) {
    console.error("Geen ===-blokken gevonden. Zie data/import-matches.txt en parse-match-blocks.ts.");
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;

  const log = (m: string) => console.log(m);
  const warn = (m: string) => console.warn(m);

  for (let i = 0; i < blocks.length; i++) {
    const parsed = parseMatchBlock(blocks[i]);
    if ("error" in parsed) {
      console.log(`BLOCK ${i + 1} SKIP parse: ${parsed.error}`);
      fail++;
      continue;
    }
    console.log(`\n--- Wedstrijd ${i + 1}: ${parsed.opponent || "(?) "} ---`);
    const success = await importOneMatch(client, seasonId, parsed, players, log, warn);
    if (success) ok++;
    else fail++;
  }

  console.log("\n========== SAMENVATTING ==========");
  console.log("Verwerkt OK:", ok);
  console.log("Overgeslagen:", fail);
  console.log("\nRoutes om te verversen in de browser: /, /ranking, /wedstrijden, /selectie");

  if (process.env.IMPORT_BUMP_SCHEMA_VERSION === "true") {
    await bumpSchemaVersion(client);
  }
}

main().catch((e) => {
  console.error("[import] Fataal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
