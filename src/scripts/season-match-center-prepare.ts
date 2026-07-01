/**
 * Phase 2 — Match Center Foundation (Stap 1)
 *
 * Verifieert of wedstrijdarchitectuur klaar is voor seizoen 2026/27:
 * - schema-tabellen en matches-kolommen
 * - seizoen 2026/27 aanwezig
 * - capability-matrix (geen data-invoer)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 *   cd platform && npm run season:match-center
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import {
  MATCH_ADMIN_ENTRY_PATHS,
  MATCH_CENTER_2026_27_DATA_GAPS,
  MATCH_CENTER_CAPABILITIES,
  MATCH_CENTER_SCHEMA_TABLES,
  MATCHES_EXPECTED_COLUMNS,
  SEASON_2026_27_ID,
} from "@/lib/season-foundation/match-center-2026-27-spec";

function statusIcon(status: "ready" | "partial" | "missing"): string {
  if (status === "ready") return "✓";
  if (status === "partial") return "~";
  return "✗";
}

async function main() {
  assertSupabaseServiceRoleEnv();
  const supabase = createClient(getSupabaseUrl(), getServiceRoleKey());

  console.log("[season:match-center] Stap 1 — wedstrijdarchitectuur 2026/27 verifiëren…\n");

  const schemaOk: string[] = [];
  const schemaFail: string[] = [];

  for (const table of MATCH_CENTER_SCHEMA_TABLES) {
    const cols =
      table === "matches"
        ? MATCHES_EXPECTED_COLUMNS
        : table === "player_season_memberships"
          ? "id,player_id,season_id,shirt_number,position,display_position,is_captain,is_vice_captain,is_guest"
          : "*";
    const { error } = await supabase.from(table).select(cols).limit(0);
    if (error) schemaFail.push(`${table}: ${error.message}`);
    else schemaOk.push(table);
  }

  console.log("[season:match-center] Schema:");
  for (const t of schemaOk) console.log(`  ✓ ${t}`);
  for (const f of schemaFail) console.log(`  ✗ ${f}`);

  const { data: seasonRow, error: eSeason } = await supabase
    .from("seasons")
    .select("id,name,is_active,starts_on,ends_on")
    .eq("id", SEASON_2026_27_ID)
    .maybeSingle();
  if (eSeason) throw eSeason;

  if (!seasonRow) {
    console.warn(`\n  ⚠ Seizoen 2026/27 (${SEASON_2026_27_ID}) ontbreekt. Voer eerst npm run season:foundation uit.`);
  } else {
    console.log(`\n[season:match-center] Seizoen 2026/27:`);
    console.log(`  • name:      ${seasonRow.name}`);
    console.log(`  • periode:   ${seasonRow.starts_on} → ${seasonRow.ends_on}`);
    console.log(`  • is_active: ${seasonRow.is_active}`);
  }

  const { count: matchCount, error: eCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", SEASON_2026_27_ID);
  if (eCount) throw eCount;

  console.log(`\n[season:match-center] Wedstrijden 2026/27 in DB: ${matchCount ?? 0} (invoer volgt via beheer)`);

  console.log("\n[season:match-center] Capabilities:");
  for (const cap of MATCH_CENTER_CAPABILITIES) {
    console.log(`  ${statusIcon(cap.status)} ${cap.label.padEnd(22)} [${cap.status}]`);
    console.log(`      ${cap.evidence}`);
    if (cap.notes) console.log(`      → ${cap.notes}`);
  }

  const ready = MATCH_CENTER_CAPABILITIES.filter((c) => c.status === "ready");
  const partial = MATCH_CENTER_CAPABILITIES.filter((c) => c.status === "partial");
  const missing = MATCH_CENTER_CAPABILITIES.filter((c) => c.status === "missing");

  console.log("\n[season:match-center] Beheer — handmatige KNVB-invoer (routes):");
  for (const p of MATCH_ADMIN_ENTRY_PATHS) {
    console.log(`  • ${p.path.padEnd(32)} ${p.purpose}`);
  }

  console.log("\n[season:match-center] Samenvatting:");
  console.log(`  • Schema OK:           ${schemaFail.length === 0 ? "ja" : "nee"}`);
  console.log(`  • Seizoen 2026/27:     ${seasonRow ? "aanwezig" : "ontbreekt"}`);
  console.log(`  • Volledig gereed:     ${ready.map((c) => c.label).join(", ") || "—"}`);
  console.log(`  • Gedeeltelijk:        ${partial.map((c) => c.label).join(", ") || "—"}`);
  console.log(`  • Ontbreekt:           ${missing.map((c) => c.label).join(", ") || "—"}`);
  console.log(`  • Codewijzigingen:     geen (architectuur seizoensgebonden via season_id)`);

  console.log("\n[season:match-center] Openstaande punten:");
  for (const gap of MATCH_CENTER_2026_27_DATA_GAPS) console.log(`    - ${gap}`);

  if (schemaFail.length > 0) {
    throw new Error(`Schema-check mislukt voor ${schemaFail.length} tabel(len).`);
  }

  console.log("\n[season:match-center] Klaar.");
}

main().catch((e) => {
  console.error("[season:match-center] Mislukt:", e instanceof Error ? e.message : e);
  process.exit(1);
});
