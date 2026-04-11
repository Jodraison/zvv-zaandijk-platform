/**
 * ⚠️  LEGACY / DEMO-SEED — NIET voor productie naast `seed:club`.
 *
 * - Slechts 18 speelsters, andere UUIDs en seizoen-id dan `seed:club` (22 + canonieke namen).
 * - Overschrijft actief seizoen en kan data conflicteren met import-fitness / import-matches.
 *
 * Productie: gebruik `npm run seed:club` en daarna Beheer of imports voor wedstrijden.
 *
 * ---
 * Vult Supabase: spelers, seizoen, wedstrijden, match_player_stats, WOTM → matches.wotm_player_id.
 *
 * Env (platform/.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (alleen service role)
 *
 * Runnen:
 *   cd platform && npm run seed:real
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

assertSupabaseServiceRoleEnv();
console.log("Using service role key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

const supabase = createClient(getSupabaseUrl(), getServiceRoleKey());

const SEASON_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

const PLAYER_NAMES = [
  "Nienke",
  "Melissa Rietveld",
  "Emma",
  "Andrada",
  "Pitou",
  "Shura",
  "Dionne",
  "Kyra",
  "Esmee",
  "Mandy",
  "Renée",
  "Anouk",
  "Tess",
  "Marisha",
  "Melissa Donkers",
  "Jelisa",
  "Micah",
  "Danique",
] as const;

const PLAYER_IDS: Record<string, string> = {
  Nienke: "b0000001-0000-4000-8000-000000000001",
  "Melissa Rietveld": "b0000001-0000-4000-8000-000000000002",
  Emma: "b0000001-0000-4000-8000-000000000003",
  Andrada: "b0000001-0000-4000-8000-000000000004",
  Pitou: "b0000001-0000-4000-8000-000000000005",
  Shura: "b0000001-0000-4000-8000-000000000006",
  Dionne: "b0000001-0000-4000-8000-000000000007",
  Kyra: "b0000001-0000-4000-8000-000000000008",
  Esmee: "b0000001-0000-4000-8000-000000000009",
  Mandy: "b0000001-0000-4000-8000-000000000010",
  "Renée": "b0000001-0000-4000-8000-000000000011",
  Anouk: "b0000001-0000-4000-8000-000000000012",
  Tess: "b0000001-0000-4000-8000-000000000013",
  Marisha: "b0000001-0000-4000-8000-000000000014",
  "Melissa Donkers": "b0000001-0000-4000-8000-000000000015",
  Jelisa: "b0000001-0000-4000-8000-000000000016",
  Micah: "b0000001-0000-4000-8000-000000000017",
  Danique: "b0000001-0000-4000-8000-000000000018",
};

type StatRow = { player: string; goals: number; assists: number };

/** Exact de gevraagde vorm + id/kickoff voor de database (geen goals_for: alleen uit stats afgeleid). */
type MatchSeed = {
  id: string;
  kickoff_at: string;
  opponent: string;
  is_home: boolean;
  goals_against: number;
  stats: StatRow[];
  mvp: string | null;
};

/**
 * Echte wedstrijddata (clubperspectief Zaandijk).
 */
const MATCHES: MatchSeed[] = [
  {
    id: "c0000001-0000-4000-8000-000000000001",
    kickoff_at: "2025-09-07T12:30:00.000Z",
    opponent: "WSV",
    is_home: true,
    goals_against: 0,
    stats: [],
    mvp: "Marisha",
  },
  {
    id: "c0000001-0000-4000-8000-000000000002",
    kickoff_at: "2025-09-14T14:00:00.000Z",
    opponent: "ZOB",
    is_home: false,
    goals_against: 3,
    stats: [{ player: "Emma", goals: 1, assists: 0 }],
    mvp: null,
  },
  {
    id: "c0000001-0000-4000-8000-000000000003",
    kickoff_at: "2025-09-21T13:15:00.000Z",
    opponent: "Egmond",
    is_home: false,
    goals_against: 2,
    stats: [
      { player: "Nienke", goals: 1, assists: 0 },
      { player: "Andrada", goals: 0, assists: 1 },
    ],
    mvp: "Mandy",
  },
  {
    id: "c0000001-0000-4000-8000-000000000004",
    kickoff_at: "2025-09-28T12:00:00.000Z",
    opponent: "Velserbroek",
    is_home: false,
    goals_against: 1,
    stats: [
      { player: "Nienke", goals: 1, assists: 0 },
      { player: "Shura", goals: 2, assists: 0 },
      { player: "Tess", goals: 0, assists: 1 },
    ],
    mvp: "Melissa Donkers",
  },
  {
    id: "c0000001-0000-4000-8000-000000000005",
    kickoff_at: "2025-10-05T14:00:00.000Z",
    opponent: "Stormvogels",
    is_home: false,
    goals_against: 0,
    stats: [
      { player: "Andrada", goals: 2, assists: 0 },
      { player: "Melissa Rietveld", goals: 2, assists: 2 },
      { player: "Emma", goals: 2, assists: 0 },
      { player: "Nienke", goals: 2, assists: 0 },
      { player: "Dionne", goals: 1, assists: 3 },
      { player: "Renée", goals: 0, assists: 1 },
      { player: "Anouk", goals: 0, assists: 1 },
      { player: "Shura", goals: 0, assists: 1 },
    ],
    mvp: "Andrada",
  },
  {
    id: "c0000001-0000-4000-8000-000000000006",
    kickoff_at: "2025-10-12T11:00:00.000Z",
    opponent: "Sporting Andijk",
    is_home: true,
    goals_against: 2,
    stats: [
      { player: "Pitou", goals: 1, assists: 0 },
      { player: "Nienke", goals: 1, assists: 0 },
      { player: "Emma", goals: 1, assists: 0 },
    ],
    mvp: "Jelisa",
  },
  {
    id: "c0000001-0000-4000-8000-000000000007",
    kickoff_at: "2025-10-19T13:30:00.000Z",
    opponent: "Wieringermeer VR2",
    is_home: false,
    goals_against: 1,
    stats: [{ player: "Pitou", goals: 1, assists: 0 }],
    mvp: "Marisha",
  },
  {
    id: "c0000001-0000-4000-8000-000000000008",
    kickoff_at: "2025-10-26T12:15:00.000Z",
    opponent: "Wieringermeer VR3",
    is_home: false,
    goals_against: 2,
    stats: [
      { player: "Melissa Rietveld", goals: 1, assists: 0 },
      { player: "Mandy", goals: 0, assists: 1 },
    ],
    mvp: "Marisha",
  },
  {
    id: "c0000001-0000-4000-8000-000000000009",
    kickoff_at: "2025-11-02T14:00:00.000Z",
    opponent: "ZVC'22",
    is_home: true,
    goals_against: 0,
    stats: [
      { player: "Andrada", goals: 1, assists: 1 },
      { player: "Melissa Rietveld", goals: 3, assists: 1 },
      { player: "Nienke", goals: 3, assists: 0 },
      { player: "Mandy", goals: 0, assists: 3 },
      { player: "Esmee", goals: 2, assists: 0 },
      { player: "Pitou", goals: 2, assists: 0 },
      { player: "Renée", goals: 0, assists: 1 },
      { player: "Kyra", goals: 1, assists: 0 },
    ],
    mvp: "Nienke",
  },
];

function goalsFromStats(stats: StatRow[]): number {
  return stats.reduce((s, r) => s + r.goals, 0);
}

function playerId(name: string): string {
  const id = PLAYER_IDS[name];
  if (!id) throw new Error(`Onbekende speler in data: "${name}"`);
  return id;
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
  if (process.env.NODE_ENV !== "development") {
    console.error(
      "[seed:real] GEBLOKKEERD: alleen toegestaan met NODE_ENV=development.\n" +
        "Productie / staging: gebruik `npm run seed:club` (+ optioneel SEED_AUTO_IMPORT_MATCHES=true).",
    );
    process.exit(1);
  }
  console.warn("⚠️  seed:real is LEGACY — niet gebruiken naast seed:club; alleen voor lokale demo.\n");

  console.log("Seizoen en spelers upserten…");

  const { error: eSeason } = await supabase.from("seasons").upsert(
    {
      id: SEASON_ID,
      name: "2024/25 Competitie",
      starts_on: "2025-08-01",
      ends_on: "2026-06-30",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (eSeason) throw eSeason;

  await supabase.from("seasons").update({ is_active: false }).neq("id", SEASON_ID);

  const players = PLAYER_NAMES.map((full_name) => ({
    id: PLAYER_IDS[full_name],
    full_name,
    photo_url: null as string | null,
    is_guest: false,
  }));

  const { error: ePlayers } = await supabase.from("players").upsert(players, { onConflict: "id" });
  if (ePlayers) throw ePlayers;

  const memberships = PLAYER_NAMES.map((full_name, i) => {
    const pos = (i === 0 ? "GK" : i < 5 ? "DEF" : i < 12 ? "MID" : "ATT") as "GK" | "DEF" | "MID" | "ATT";
    const display =
      pos === "GK"
        ? "Keeper"
        : pos === "DEF"
          ? "Verdediging"
          : pos === "MID"
            ? "Middenveld"
            : "Aanval";
    return {
      id: randomUUID(),
      player_id: PLAYER_IDS[full_name],
      season_id: SEASON_ID,
      shirt_number: i + 1,
      position: pos,
      display_position: display,
      is_captain: full_name === "Melissa Rietveld",
      is_vice_captain: full_name === "Dionne",
      is_guest: false,
    };
  });

  const { error: eMemDel } = await supabase.from("player_season_memberships").delete().eq("season_id", SEASON_ID);
  if (eMemDel) throw eMemDel;

  const { error: eMem } = await supabase.from("player_season_memberships").insert(memberships);
  if (eMem) throw eMem;

  console.log("Wedstrijden, stats, WOTM…");

  for (const m of MATCHES) {
    const goals_for = goalsFromStats(m.stats);
    const wotmId = m.mvp ? playerId(m.mvp) : null;

    const { error: eM } = await supabase.from("matches").upsert(
      {
        id: m.id,
        season_id: SEASON_ID,
        opponent: m.opponent,
        kickoff_at: m.kickoff_at,
        is_home: m.is_home,
        goals_for,
        goals_against: m.goals_against,
        status: "played" as const,
        wotm_player_id: wotmId,
      },
      { onConflict: "id" },
    );
    if (eM) throw eM;

    const { error: eDel } = await supabase.from("match_player_stats").delete().eq("match_id", m.id);
    if (eDel) throw eDel;

    if (m.stats.length) {
      const rows = m.stats.map((s) => ({
        match_id: m.id,
        player_id: playerId(s.player),
        goals: s.goals,
        assists: s.assists,
      }));
      const { error: eS } = await supabase.from("match_player_stats").insert(rows);
      if (eS) throw eS;
    }
  }

  console.log("Klaar:", MATCHES.length, "wedstrijden,", PLAYER_NAMES.length, "speelsters. Seizoen-id:", SEASON_ID);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(err);
  logPermissionHint(msg);
  process.exit(1);
});
