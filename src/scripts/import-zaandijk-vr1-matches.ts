/**
 * Import Zaandijk VR1 gespeelde wedstrijden (bron: goal events → afgeleide stats).
 *
 *   cd platform && npm run import:zaandijk-vr1 -- [optioneel season_id]
 *
 * Vereist: SUPABASE_SERVICE_ROLE_KEY (+ URL) in .env.local
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import {
  ensureGuestPlayerByName,
  importSingleMatch,
  prepareImportContext,
  verifyMatchGoalSync,
  type ServiceSb,
} from "@/lib/import/match-import-service";
import { ZAANDIJK_VR1_2025_26_SPECS } from "@/lib/import/zaandijk-vr1-match-specs";

const SCHEMA_TABLES = [
  "matches",
  "match_player_stats",
  "match_goal_events",
  "match_matchday_roster",
  "players",
  "player_season_memberships",
] as const;

async function assertSchema(client: ServiceSb): Promise<void> {
  for (const table of SCHEMA_TABLES) {
    const { error } = await client.from(table).select("*").limit(0);
    if (error) throw new Error(`Schema '${table}': ${error.message}`);
  }
}

async function getActiveSeasonId(client: ServiceSb, explicit?: string): Promise<string> {
  if (explicit?.trim()) return explicit.trim();
  const { data, error } = await client
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const row = data as { id: string } | null;
  if (!row?.id) {
    throw new Error("Geen actief seizoen; geef season_id als argument of zet seasons.is_active in Supabase.");
  }
  return row.id;
}

async function main(): Promise<void> {
  assertSupabaseServiceRoleEnv();
  const seasonArg = process.argv[2];

  const client = createClient(getSupabaseUrl(), getServiceRoleKey()) as ServiceSb;
  await assertSchema(client);

  const seasonId = await getActiveSeasonId(client, seasonArg);
  console.log("[import zaandijk-vr1] season_id:", seasonId);

  const guestsCreated: string[] = [];
  for (const g of ["Esmee", "Micah"]) {
    const r = await ensureGuestPlayerByName(client, g);
    if (r.created) {
      guestsCreated.push(g);
      console.log("[import zaandijk-vr1] gast aangemaakt:", g);
    }
  }

  const { coreSeasonPlayerIds, players } = await prepareImportContext(client, seasonId);

  let created = 0;
  let updated = 0;
  const matchIds: string[] = [];

  const log = (m: string) => console.log(m);
  const warn = (m: string) => console.warn(m);

  for (let i = 0; i < ZAANDIJK_VR1_2025_26_SPECS.length; i++) {
    const spec = ZAANDIJK_VR1_2025_26_SPECS[i];
    console.log(`\n--- ${i + 1}/${ZAANDIJK_VR1_2025_26_SPECS.length} ${spec.opponent} ---`);
    const res = await importSingleMatch(client, seasonId, spec, players, coreSeasonPlayerIds, null, log, warn);
    if (!res.ok) {
      console.error("FOUT:", res.error);
      process.exitCode = 1;
      return;
    }
    if (res.createdMatch) created++;
    else updated++;
    matchIds.push(res.matchId);

    const ver = await verifyMatchGoalSync(client, res.matchId);
    if (!ver.ok) {
      console.error(`Verify mislukt match ${res.matchId}: goals_for=${ver.goalsFor} events=${ver.eventCount}`);
      process.exitCode = 1;
      return;
    }
  }

  console.log("\n========== SAMENVATTING ==========");
  console.log("Wedstrijden OK:", matchIds.length);
  console.log("Nieuw aangemaakt:", created);
  console.log("Bijgewerkt (bestaande id):", updated);
  console.log("Gast-spelers nu aangemaakt:", guestsCreated.length ? guestsCreated.join(", ") : "(geen nieuwe)");
  console.log(
    "[LET OP] Zie [DRAFT]-warnings voor Sporting Andijk — kickoff nog placeholder 2099-12-31.",
  );
  console.log("Match 3 (VV Egmond): één goal i.k.v. 2–1 uit; controleer in beheer indien Andrada ook scoorde.");
}

main().catch((e) => {
  console.error("[import zaandijk-vr1] Fataal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
