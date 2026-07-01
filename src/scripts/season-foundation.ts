/**
 * Phase 2 — Season Foundation (Stap 1)
 *
 * Bereidt het platform voor op seizoen 2026/27:
 * - maakt het seizoen aan of werkt het bij (upsert)
 * - archiveert 2025/26 (is_active = false)
 * - stelt 2026/27 in als actief seizoen
 *
 * Geen wijzigingen aan spelers, memberships, wedstrijden of andere data.
 *
 * Env (platform/.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Runnen:
 *   cd platform && npm run season:foundation
 *
 * Alternatief: voer supabase/migrations/018_season_foundation_2026_27.sql uit in Supabase SQL Editor.
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";

/** Canoniek 2025/26-seizoen (`seed:club`). */
const SEASON_2025_26_ID = "c0ffee00-0001-4000-8000-000000000001";

/** Nieuw 2026/27-seizoen. */
const SEASON_2026_27_ID = "c0ffee00-0002-4000-8000-000000000001";

async function main() {
  assertSupabaseServiceRoleEnv();

  const supabase = createClient(getSupabaseUrl(), getServiceRoleKey());

  console.log("[season:foundation] Stap 1 — seizoen 2026/27 voorbereiden…");

  const { error: eArchivePrev } = await supabase.from("seasons").upsert(
    {
      id: SEASON_2025_26_ID,
      name: "2025/26 Competitie",
      starts_on: "2025-08-01",
      ends_on: "2026-06-30",
      is_active: false,
    },
    { onConflict: "id" },
  );
  if (eArchivePrev) throw eArchivePrev;

  const { error: eDeactivate } = await supabase
    .from("seasons")
    .update({ is_active: false })
    .neq("id", SEASON_2026_27_ID);
  if (eDeactivate) throw eDeactivate;

  const { error: eActivate } = await supabase.from("seasons").upsert(
    {
      id: SEASON_2026_27_ID,
      name: "2026/27 Competitie",
      starts_on: "2026-08-01",
      ends_on: "2027-06-30",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (eActivate) throw eActivate;

  const { data: seasons, error: eList } = await supabase
    .from("seasons")
    .select("id,name,is_active")
    .order("starts_on", { ascending: false });
  if (eList) throw eList;

  const active = (seasons ?? []).filter((s) => s.is_active);
  if (active.length !== 1 || active[0]?.id !== SEASON_2026_27_ID) {
    throw new Error(
      `Verwacht precies één actief seizoen (${SEASON_2026_27_ID}); gevonden: ${JSON.stringify(active)}`,
    );
  }

  console.log("[season:foundation] Klaar.");
  console.log(`  • 2025/26 gearchiveerd: ${SEASON_2025_26_ID}`);
  console.log(`  • 2026/27 actief:       ${SEASON_2026_27_ID}`);
  console.log(`  • Totaal seizoenen:     ${seasons?.length ?? 0}`);
}

main().catch((e) => {
  console.error("[season:foundation] Mislukt:", e instanceof Error ? e.message : e);
  process.exit(1);
});
