/**
 * Faalt wanneer bekende QA-patronen in de actieve seizoen-DB bestaan.
 * Run: npm run test:database-fixture-hygiene
 */
import assert from "node:assert/strict";
import "@/scripts/load-platform-env";
import { isQaMatchOpponent, isQaFixtureNotes } from "@/lib/match/qa-fixture-patterns";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

console.log("→ database-fixture-hygiene");

async function main() {
  assert.equal(isQaMatchOpponent("UX Final 1"), true);
  assert.equal(isQaMatchOpponent("Ketenherstel 99"), true);
  assert.equal(isQaMatchOpponent("Debug FC x"), true);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.log("database-fixture-hygiene.test.ts: skip live DB (no Supabase env)");
    return;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("database-fixture-hygiene.test.ts: skip live DB (no service role)");
    return;
  }

  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("matches")
    .select("id,opponent,notes,kickoff_at,status,season_id")
    .eq("season_id", SEASON_2026_27_ID);
  if (error) throw new Error(error.message);

  const active = data ?? [];
  const polluted = active.filter(
    (m) => isQaMatchOpponent(m.opponent) || isQaFixtureNotes(m.notes),
  );
  const zcfcTest = active.filter(
    (m) =>
      String(m.opponent).trim().toUpperCase() === "ZCFC" &&
      String(m.kickoff_at).startsWith("2026-07-31") &&
      m.status === "scheduled",
  );

  if (polluted.length > 0 || zcfcTest.length > 0) {
    const names = [...polluted, ...zcfcTest].map((m) => `${m.id} · ${m.opponent}`);
    assert.fail(`QA/testwedstrijden in actief seizoen: ${names.join("; ")}`);
  }

  console.log("database-fixture-hygiene.test.ts: ok (live DB clean)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
