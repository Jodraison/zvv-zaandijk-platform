/**
 * Zaandijk clubdata: 1 seizoen, exacte selectie (22), exacte competitiewedstrijden (14).
 *
 * Bron van waarheid: vaste UUIDs + rugnummers 1–22 + `display_position` (NL) + enum `position`.
 * Teamscores staan op `matches`; géén verzonnen `match_player_stats` (ranking vult zich na echte invoer).
 *
 * Database: voer migrations uit in Supabase (zie platform/supabase/migrations/).
 *
 * Env (platform/.env.local — zie .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (alleen service role; geen anon fallback)
 *
 * Runnen:
 *   cd platform && npm run seed:club
 *
 * Na seed zijn `match_player_stats` leeg tenzij je import draait:
 *   SEED_AUTO_IMPORT_MATCHES=true npm run seed:club
 *   (vereist data/import-matches.txt; seizoen-id = dit script.)
 *
 * Tijdelijk negeren (niet aanbevolen):
 *   SEED_ALLOW_EMPTY_MATCH_STATS=true npm run seed:club
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

/** Minimale kolommen die dit script en de app verwachten (fout vóór destructieve stappen). */
const SCHEMA_TABLE_CHECKS: { table: string; columns: string }[] = [
  { table: "seasons", columns: "id,name,starts_on,ends_on,is_active" },
  { table: "players", columns: "id,full_name,photo_url,is_guest" },
  { table: "match_matchday_roster", columns: "match_id,player_id,match_shirt_number,position_label" },
  {
    table: "player_season_memberships",
    columns: "id,player_id,season_id,shirt_number,position,display_position,is_captain,is_vice_captain,is_guest",
  },
  {
    table: "matches",
    columns: "id,season_id,opponent,kickoff_at,is_home,goals_for,goals_against,status,wotm_player_id",
  },
  { table: "match_player_stats", columns: "match_id,player_id,goals,assists" },
];

async function assertSchemaBeforeSeed(client: SupabaseClient): Promise<void> {
  console.log("Controleren of tabellen en kolommen bestaan…");
  for (const { table, columns } of SCHEMA_TABLE_CHECKS) {
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) {
      console.error(`[seed] Schema-check mislukt voor '${table}':`, error.message);
      console.error("[seed] Voer platform/supabase/migrations/ uit in Supabase, daarna opnieuw seeden.");
      throw new Error(`Schema onvolledig (tabel '${table}'): ${error.message}`);
    }
  }
}

const SEASON_ID = "c0ffee00-0001-4000-8000-000000000001";

type Pos = "GK" | "DEF" | "MID" | "ATT";

/** Canonieke selectie — volgorde = rugnummer 1..22; vaste player-UUIDs (historische ids waar mogelijk). */
const SQUAD: {
  id: string;
  full_name: string;
  shirt_number: number;
  display_position: string;
  position: Pos;
}[] = [
  { id: "f1000001-0000-4000-8000-000000000001", full_name: "Jelisa De Jonge", shirt_number: 1, display_position: "Keeper", position: "GK" },
  { id: "f1000001-0000-4000-8000-00000000000a", full_name: "Mandy Kalmeijer", shirt_number: 2, display_position: "Middenveld (CM / LCM / RCM)", position: "MID" },
  { id: "f1000001-0000-4000-8000-000000000003", full_name: "Yente Oud", shirt_number: 3, display_position: "Centrale verdediger", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000006", full_name: "Tess Luijting", shirt_number: 4, display_position: "Centrale verdediger", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000004", full_name: "Marisha Prins", shirt_number: 5, display_position: "Linksback", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000015", full_name: "Isa Oosterhoorn", shirt_number: 6, display_position: "RCM / Rechtsback", position: "MID" },
  { id: "f1000001-0000-4000-8000-000000000011", full_name: "Danique van Heeringen", shirt_number: 7, display_position: "Linksbuiten", position: "ATT" },
  { id: "f1000001-0000-4000-8000-000000000009", full_name: "Renée Koopman", shirt_number: 8, display_position: "Rechts middenveld / Links middenveld", position: "MID" },
  { id: "f1000001-0000-4000-8000-00000000000b", full_name: "Melissa Rietveld", shirt_number: 9, display_position: "Links middenveld / Spits", position: "ATT" },
  { id: "f1000001-0000-4000-8000-00000000000c", full_name: "Dionne van Dijk", shirt_number: 10, display_position: "Middenveld (CM / RCM)", position: "MID" },
  { id: "f1000001-0000-4000-8000-00000000000f", full_name: "Nienke Hoffman", shirt_number: 11, display_position: "Spits / Rechtsbuiten", position: "ATT" },
  { id: "f1000001-0000-4000-8000-000000000010", full_name: "Andrada Timmer", shirt_number: 12, display_position: "Linksbuiten / Rechtsbuiten / Spits", position: "ATT" },
  { id: "f1000001-0000-4000-8000-000000000014", full_name: "Maura Hoffman", shirt_number: 13, display_position: "Linksback / Rechtsback", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000002", full_name: "Melissa Donkers", shirt_number: 14, display_position: "Rechtsback", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000016", full_name: "Pitou Ludding", shirt_number: 15, display_position: "Aanval", position: "ATT" },
  { id: "f1000001-0000-4000-8000-000000000013", full_name: "Mariska Oosterhuis", shirt_number: 16, display_position: "Centrale verdediger", position: "DEF" },
  { id: "f1000001-0000-4000-8000-000000000008", full_name: "Kyra De Bakker", shirt_number: 17, display_position: "Rechts middenveld / Links middenveld", position: "MID" },
  { id: "f1000001-0000-4000-8000-000000000007", full_name: "Lorelai Bakker", shirt_number: 18, display_position: "Rechts middenveld / Links middenveld / Back", position: "MID" },
  { id: "f1000001-0000-4000-8000-000000000005", full_name: "Anouk Aafjes", shirt_number: 19, display_position: "Centrale verdediger", position: "DEF" },
  { id: "f1000001-0000-4000-8000-00000000000d", full_name: "Emma de Mie", shirt_number: 20, display_position: "Rechtsbuiten / Linksbuiten", position: "ATT" },
  { id: "f1000001-0000-4000-8000-00000000000e", full_name: "Shura Nieboer", shirt_number: 21, display_position: "Overal inzetbaar / Rechtsback / Aanval", position: "ATT" },
  { id: "f1000001-0000-4000-8000-000000000012", full_name: "Demi Luijting", shirt_number: 22, display_position: "Linksbuiten", position: "ATT" },
];

const EXPECT_SQUAD = 22;
const ids = new Set(SQUAD.map((p) => p.id));
const shirts = new Set(SQUAD.map((p) => p.shirt_number));
if (SQUAD.length !== EXPECT_SQUAD || ids.size !== SQUAD.length || shirts.size !== SQUAD.length) {
  throw new Error("[seed:club] SQUAD moet exact 22 unieke ids en rugnummers hebben.");
}

type MatchRow = {
  id: string;
  kickoff_at: string;
  opponent: string;
  is_home: boolean;
  goals_for: number;
  goals_against: number;
};

/**
 * Exacte uitslagen (Zaandijk-perspectief).
 * Seizoen 2025/26: sep–dec 2025, jan–mrt 2026.
 */
const MATCHES: MatchRow[] = [
  { id: "f2000001-0000-4000-8000-000000000001", kickoff_at: "2025-09-20T14:00:00.000Z", opponent: "WSV", is_home: true, goals_for: 0, goals_against: 0 },
  { id: "f2000001-0000-4000-8000-000000000002", kickoff_at: "2025-10-01T14:00:00.000Z", opponent: "ZOB", is_home: false, goals_for: 1, goals_against: 3 },
  { id: "f2000001-0000-4000-8000-000000000003", kickoff_at: "2025-10-04T14:00:00.000Z", opponent: "Egmond", is_home: false, goals_for: 1, goals_against: 2 },
  { id: "f2000001-0000-4000-8000-000000000004", kickoff_at: "2025-10-11T14:00:00.000Z", opponent: "Velserbroek", is_home: false, goals_for: 3, goals_against: 1 },
  { id: "f2000001-0000-4000-8000-000000000005", kickoff_at: "2025-11-08T14:00:00.000Z", opponent: "Stormvogels", is_home: false, goals_for: 9, goals_against: 0 },
  { id: "f2000001-0000-4000-8000-000000000006", kickoff_at: "2025-11-29T14:00:00.000Z", opponent: "Sporting Andijk", is_home: true, goals_for: 3, goals_against: 2 },
  { id: "f2000001-0000-4000-8000-000000000007", kickoff_at: "2025-12-06T14:00:00.000Z", opponent: "Wieringermeer VR2", is_home: false, goals_for: 1, goals_against: 1 },
  { id: "f2000001-0000-4000-8000-000000000008", kickoff_at: "2025-12-13T14:00:00.000Z", opponent: "Wieringermeer VR3", is_home: false, goals_for: 1, goals_against: 2 },
  { id: "f2000001-0000-4000-8000-000000000009", kickoff_at: "2026-01-24T14:00:00.000Z", opponent: "ZVC'22", is_home: true, goals_for: 12, goals_against: 0 },
  { id: "f2000001-0000-4000-8000-00000000000a", kickoff_at: "2026-01-31T14:00:00.000Z", opponent: "WSV", is_home: false, goals_for: 4, goals_against: 1 },
  { id: "f2000001-0000-4000-8000-00000000000b", kickoff_at: "2026-02-07T14:00:00.000Z", opponent: "ZOB", is_home: true, goals_for: 1, goals_against: 3 },
  { id: "f2000001-0000-4000-8000-00000000000c", kickoff_at: "2026-03-07T14:00:00.000Z", opponent: "Velserbroek", is_home: true, goals_for: 3, goals_against: 0 },
  { id: "f2000001-0000-4000-8000-00000000000d", kickoff_at: "2026-03-11T14:00:00.000Z", opponent: "Egmond", is_home: true, goals_for: 1, goals_against: 2 },
  { id: "f2000001-0000-4000-8000-00000000000e", kickoff_at: "2026-03-14T14:00:00.000Z", opponent: "Wieringermeer VR3", is_home: false, goals_for: 4, goals_against: 3 },
];

async function verifyPlayedGoalsMatchStats(client: SupabaseClient): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { data: ms, error } = await client.from("matches").select("id,opponent,goals_for,status").eq("season_id", SEASON_ID);
  if (error) throw error;
  const played = (ms ?? []).filter((m: { status: string }) => m.status === "played");
  if (played.length === 0) return { ok: true, errors: [] };
  const mids = played.map((m: { id: string }) => m.id);
  const { data: st, error: stErr } = await client.from("match_player_stats").select("match_id,goals").in("match_id", mids);
  if (stErr) throw stErr;
  const sumBy = new Map<string, number>();
  for (const r of st ?? []) {
    const id = String((r as { match_id: string }).match_id);
    sumBy.set(id, (sumBy.get(id) ?? 0) + Number((r as { goals: number }).goals ?? 0));
  }
  for (const m of played) {
    const id = String((m as { id: string }).id);
    const gf = Number((m as { goals_for: number }).goals_for ?? 0);
    const s = sumBy.get(id) ?? 0;
    if (gf !== s) {
      errors.push(`${(m as { opponent: string }).opponent}: goals_for=${gf} ≠ som(stats.goals)=${s}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function runMatchImportAfterSeed(): void {
  const importFile = resolve(process.cwd(), "data/import-matches.txt");
  if (!existsSync(importFile)) {
    console.error("[seed:club] SEED_AUTO_IMPORT_MATCHES=true maar data/import-matches.txt ontbreekt.");
    process.exit(1);
  }
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(cmd, ["tsx", "src/scripts/import-matches.ts", importFile, SEASON_ID], {
    cwd: resolve(process.cwd()),
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("[seed:club] import:matches is mislukt.");
    process.exit(1);
  }
  console.log("[seed:club] import:matches voltooid.");
}

function logPermissionHint(msg: string): void {
  const m = msg.toLowerCase();
  if (
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("rls") ||
    m.includes("42501")
  ) {
    console.error(
      "[seed] Toegang geweigerd — gebruik de service_role key uit Supabase (Project Settings → API), niet de anon key.",
    );
  }
}

async function main() {
  assertSupabaseServiceRoleEnv();
  console.log("Using service role key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  const supabase = createClient(url, key);

  await assertSchemaBeforeSeed(supabase);

  console.log("Seizoen upserten, overige seizoenen deactiveren…");
  const { error: eDeactivate } = await supabase.from("seasons").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (eDeactivate) throw eDeactivate;

  const { error: eSeason } = await supabase.from("seasons").upsert(
    {
      id: SEASON_ID,
      name: "2025/26 Competitie",
      starts_on: "2025-08-01",
      ends_on: "2026-06-30",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (eSeason) throw eSeason;

  console.log("Spelers upserten…");
  const { error: ePlayers } = await supabase.from("players").upsert(
    SQUAD.map((p) => ({ id: p.id, full_name: p.full_name, photo_url: null as string | null, is_guest: false })),
    { onConflict: "id" },
  );
  if (ePlayers) throw ePlayers;

  console.log("Lidmaatschappen vernieuwen…");
  const { error: eMemDel } = await supabase.from("player_season_memberships").delete().eq("season_id", SEASON_ID);
  if (eMemDel) throw eMemDel;

  const CAPTAIN_ID = "f1000001-0000-4000-8000-00000000000b"; // Melissa Rietveld
  const VICE_ID = "f1000001-0000-4000-8000-00000000000c"; // Dionne van Dijk

  const memberships = SQUAD.map((p) => ({
    id: randomUUID(),
    player_id: p.id,
    season_id: SEASON_ID,
    shirt_number: p.shirt_number,
    position: p.position,
    display_position: p.display_position,
    is_captain: p.id === CAPTAIN_ID,
    is_vice_captain: p.id === VICE_ID,
    is_guest: false,
  }));

  const { error: eMem } = await supabase.from("player_season_memberships").insert(memberships);
  if (eMem) throw eMem;

  console.log("Wedstrijden voor dit seizoen vervangen…");
  const { data: existingMatches, error: eList } = await supabase.from("matches").select("id").eq("season_id", SEASON_ID);
  if (eList) throw eList;
  const oldIds = (existingMatches ?? []).map((r: { id: string }) => r.id);
  if (oldIds.length) {
    const { error: eSt } = await supabase.from("match_player_stats").delete().in("match_id", oldIds);
    if (eSt) throw eSt;
    const { error: eMd } = await supabase.from("matches").delete().eq("season_id", SEASON_ID);
    if (eMd) throw eMd;
  }

  const matchUpserts = MATCHES.map((m) => ({
    id: m.id,
    season_id: SEASON_ID,
    opponent: m.opponent,
    kickoff_at: m.kickoff_at,
    is_home: m.is_home,
    goals_for: m.goals_for,
    goals_against: m.goals_against,
    status: "played" as const,
    wotm_player_id: null as string | null,
  }));

  const { error: eM } = await supabase.from("matches").upsert(matchUpserts, { onConflict: "id" });
  if (eM) throw eM;

  if (process.env.SEED_AUTO_IMPORT_MATCHES === "true") {
    runMatchImportAfterSeed();
    const afterImport = await verifyPlayedGoalsMatchStats(supabase);
    if (!afterImport.ok) {
      console.error("[seed:club] Na import nog steeds inconsistent:\n", afterImport.errors.join("\n"));
      process.exit(1);
    }
  } else {
    const check = await verifyPlayedGoalsMatchStats(supabase);
    if (!check.ok) {
      if (process.env.SEED_ALLOW_EMPTY_MATCH_STATS === "true") {
        console.warn("[seed:club] SEED_ALLOW_EMPTY_MATCH_STATS=true — overslaan stats-check (niet voor productie):");
        check.errors.forEach((e) => console.warn("  ·", e));
      } else {
        console.error(
          "\n[seed:club] ═══ BLOKKADE ═══\n" +
            "Gespeelde wedstrijden: goals_for komt niet overeen met som(match_player_stats.goals).\n" +
            check.errors.map((e) => `  · ${e}`).join("\n") +
            "\n\nOplossing:\n" +
            "  SEED_AUTO_IMPORT_MATCHES=true npm run seed:club\n" +
            "  (bestand data/import-matches.txt, zelfde seizoen)\n" +
            "of tijdelijk: SEED_ALLOW_EMPTY_MATCH_STATS=true\n",
        );
        process.exit(1);
      }
    }
  }

  console.log(
    "Klaar — seizoen:",
    SEASON_ID,
    "| speelsters:",
    SQUAD.length,
    "| wedstrijden:",
    MATCHES.length,
    "| actief seizoen = 2025/26. Countdown: voeg een geplande wedstrijd toe in Beheer (status gepland) voor kick-off teller.",
  );
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const details = err && typeof err === "object" && "details" in err ? String((err as { details?: string }).details) : "";
  const hint = err && typeof err === "object" && "hint" in err ? String((err as { hint?: string }).hint) : "";
  console.error("[seed] Mislukt:", msg);
  logPermissionHint(msg);
  if (details) console.error("[seed] Details:", details);
  if (hint) console.error("[seed] Hint:", hint);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
