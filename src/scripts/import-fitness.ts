/**
 * Import 20-40-60 fitheidstest (één totaaltijd per regel; split op " / ").
 *
 *   cd platform && npm run import:fitness -- [bestand.txt] [season_id]
 *   Standaard: data/import-fitness.txt, actief seizoen.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (zie .env.local).
 */

import "./load-platform-env";

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizePlayerName, resolvePlayerId, type ImportPlayerRow } from "@/lib/import/normalize-player-name";
import { parseFitnessImportText } from "@/lib/import/parse-fitness-import";
import { parseSprintTimeToSeconds } from "@/lib/import/fitness-time";
import { recomputeFitnessAnalyticsForTests } from "@/lib/fitness-analytics";
import type { FitnessTest } from "@/types";

const SCHEMA_CHECK: { table: string; columns: string }[] = [
  {
    table: "fitness_tests",
    columns:
      "id,season_id,player_id,test_type,test_on,total_time,sprint_20m,sprint_40m,sprint_60m,recorded_at,note,progress_status,progress_delta,session_rank",
  },
];

async function assertSchema(client: SupabaseClient): Promise<void> {
  for (const { table, columns } of SCHEMA_CHECK) {
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) throw new Error(`Schema '${table}': ${error.message}`);
  }
}

async function bumpSchemaVersion(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.from("club_profile").select("schema_version").eq("id", "default").maybeSingle();
  if (error) {
    console.warn("[import-fitness] club_profile schema_version niet gelezen:", error.message);
    return;
  }
  const v = Number((data as { schema_version?: number })?.schema_version ?? 0);
  const { error: up } = await client.from("club_profile").update({ schema_version: v + 1 }).eq("id", "default");
  if (up) console.warn("[import-fitness] schema_version bump mislukt:", up.message);
  else console.log("[import-fitness] club_profile.schema_version →", v + 1);
}

async function getActiveSeasonId(client: SupabaseClient, explicit?: string): Promise<string> {
  if (explicit?.trim()) return explicit.trim();
  const { data, error } = await client.from("seasons").select("id").eq("is_active", true).limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Geen actief seizoen; geef season_id als tweede argument.");
  return data.id;
}

function mapRowToFitnessTest(r: Record<string, unknown>): FitnessTest {
  const testOn =
    typeof r.test_on === "string" ? r.test_on.slice(0, 10) : String(r.recorded_at ?? "").slice(0, 10);
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
  const { data, error } = await client
    .from("fitness_tests")
    .select("*")
    .eq("season_id", seasonId)
    .eq("test_type", "sprint_20_40_60");
  if (error) throw error;
  return (data ?? []).map((r) => mapRowToFitnessTest(r as Record<string, unknown>));
}

async function pushAnalyticsToSupabase(client: SupabaseClient, tests: FitnessTest[]): Promise<void> {
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
    if (error) throw new Error(`fitness_tests analytics update: ${error.message}`);
  }
}

async function main(): Promise<void> {
  assertSupabaseServiceRoleEnv();
  const fileArg = process.argv[2];
  const seasonArg = process.argv[3];

  const defaultFile = resolve(process.cwd(), "data/import-fitness.txt");
  const filePath = fileArg && fileArg !== "-" ? resolve(process.cwd(), fileArg) : defaultFile;

  if (!existsSync(filePath)) {
    console.error(`Bestand ontbreekt: ${filePath}`);
    process.exit(1);
  }

  const text = readFileSync(filePath, "utf8");
  if (!text.trim()) {
    console.error("Bestand is leeg.");
    process.exit(1);
  }

  const client = createClient(getSupabaseUrl(), getServiceRoleKey());
  await assertSchema(client);

  const seasonId = await getActiveSeasonId(client, seasonArg);
  console.log("[import-fitness] season_id:", seasonId);
  console.log("[import-fitness] bron:", filePath);

  const { data: plRows, error: plErr } = await client.from("players").select("id,full_name,is_guest");
  if (plErr) throw plErr;
  const players: ImportPlayerRow[] = (plRows ?? []) as ImportPlayerRow[];

  const { data: memRows, error: memErr } = await client
    .from("player_season_memberships")
    .select("player_id")
    .eq("season_id", seasonId);
  if (memErr) throw memErr;
  const memberIds = new Set((memRows ?? []).map((m: { player_id: string }) => m.player_id));

  const blocks = parseFitnessImportText(text);
  console.log("[import-fitness] datumblokken:", blocks.length);

  let upserted = 0;
  let skippedRows = 0;

  for (const block of blocks) {
    const seenPlayers = new Set<string>();
    console.log(`\n--- ${block.testOn} ---`);

    for (const row of block.rows) {
      const sec = parseSprintTimeToSeconds(row.timeRaw);
      if (sec === null) {
        console.warn(`SKIP regel: ongeldige tijd "${row.timeRaw}"`);
        skippedRows++;
        continue;
      }

      const resolved: { id: string; matchedAs: string; raw: string }[] = [];
      let rowOk = true;
      for (const rawName of row.nameParts) {
        const cleaned = normalizePlayerName(rawName);
        const r = resolvePlayerId(cleaned, players);
        if (!r) {
          console.warn(`SKIP regel: speelster niet gevonden: "${rawName}"`);
          rowOk = false;
          break;
        }
        if (!memberIds.has(r.id)) {
          console.warn(`SKIP regel: "${r.matchedAs}" zit niet in dit seizoen.`);
          rowOk = false;
          break;
        }
        resolved.push({ id: r.id, matchedAs: r.matchedAs, raw: rawName });
      }
      if (!rowOk) {
        skippedRows++;
        continue;
      }

      const uniqueIds = [...new Set(resolved.map((x) => x.id))];
      if (uniqueIds.length !== resolved.length) {
        console.warn(`SKIP regel: dubbele speelster op één regel (${row.nameParts.join(" / ")}).`);
        skippedRows++;
        continue;
      }

      for (const { id, matchedAs } of resolved) {
        if (seenPlayers.has(id)) {
          console.warn(`SKIP: "${matchedAs}" komt dubbel voor op ${block.testOn}.`);
          skippedRows++;
          continue;
        }
        seenPlayers.add(id);

        const payload = {
          season_id: seasonId,
          player_id: id,
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

        const { error: upErr } = await client.from("fitness_tests").upsert(payload as never, {
          onConflict: "player_id,season_id,test_on",
        });
        if (upErr) {
          console.warn(`SKIP ${matchedAs}: upsert ${upErr.message}`);
          skippedRows++;
          seenPlayers.delete(id);
          continue;
        }
        console.log(`  OK ${matchedAs}  ${sec.toFixed(2)}s (totaal)`);
        upserted++;
      }
    }
  }

  const allTests = await fetchSeasonFitnessTests(client, seasonId);
  recomputeFitnessAnalyticsForTests(allTests, seasonId);
  await pushAnalyticsToSupabase(client, allTests);

  console.log("\n========== SAMENVATTING ==========");
  console.log("Rijen opgeslagen/bijgewerkt (speelsters):", upserted);
  console.log("Overgeslagen (deelfouten):", skippedRows);
  console.log("Progressie + top-3 (laatste testdag) bijgewerkt voor seizoen.");
  console.log("Vernieuw /fitheid in de browser (of zet IMPORT_BUMP_SCHEMA_VERSION=true voor schema_version +1).");

  if (process.env.IMPORT_BUMP_SCHEMA_VERSION === "true") {
    await bumpSchemaVersion(client);
  }
}

main().catch((e) => {
  console.error("[import-fitness] Fataal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
