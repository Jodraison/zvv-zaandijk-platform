/**
 * Phase 2 — Season Foundation (Stap 4)
 *
 * Werkt seizoensgebonden teammetadata bij voor 2026/27 (enige beschikbare DB-structuur).
 * Rapporteert staf- en teamgaten; wijzigt geen staf (geen opslag) en geen 2025/26-data.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 *   cd platform && npm run season:team
 *
 * Vereist: Stap 1 (`season:foundation`) al uitgevoerd.
 * Alternatief: supabase/migrations/020_season_foundation_team_2026_27.sql
 */

import "./load-platform-env";

import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import {
  SEASON_2025_26_ID,
  SEASON_2025_26_REFERENCE,
  SEASON_2026_27_ID,
  SEASON_2026_27_TEAM_METADATA,
  STAFF_2026_27,
  TEAM_2026_27_DATA_GAPS,
  TEAM_INFO_KNOWN_FROM_CODE,
} from "@/lib/season-foundation/team-2026-27-spec";

type SeasonRow = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};

function seasonMatchesRef(row: SeasonRow, ref: { name: string; starts_on: string; ends_on: string }): boolean {
  return row.name === ref.name && row.starts_on === ref.starts_on && row.ends_on === ref.ends_on;
}

async function main() {
  assertSupabaseServiceRoleEnv();
  const supabase = createClient(getSupabaseUrl(), getServiceRoleKey());

  console.log("[season:team] Stap 4 — staf + teaminfo 2026/27…\n");

  const { data: prevSeason, error: ePrev } = await supabase
    .from("seasons")
    .select("id,name,starts_on,ends_on,is_active")
    .eq("id", SEASON_2025_26_ID)
    .maybeSingle();
  if (ePrev) throw ePrev;
  if (!prevSeason) {
    console.warn(`  ⚠ 2025/26 (${SEASON_2025_26_ID}) niet gevonden — historische referentie ontbreekt.`);
  } else if (!seasonMatchesRef(prevSeason as SeasonRow, SEASON_2025_26_REFERENCE)) {
    console.log("  • 2025/26 ongewijzigd gelaten (afwijkende waarden in DB t.o.v. referentie):");
    console.log(`      name:      ${prevSeason.name}`);
    console.log(`      periode:   ${prevSeason.starts_on} → ${prevSeason.ends_on}`);
  } else {
    console.log("  • 2025/26 intact (referentie bevestigd).");
  }

  const { data: seasonRow, error: eSeason } = await supabase
    .from("seasons")
    .select("id,name,starts_on,ends_on,is_active")
    .eq("id", SEASON_2026_27_ID)
    .maybeSingle();
  if (eSeason) throw eSeason;
  if (!seasonRow) {
    throw new Error(
      `Seizoen 2026/27 (${SEASON_2026_27_ID}) ontbreekt. Voer eerst npm run season:foundation uit.`,
    );
  }

  const meta = SEASON_2026_27_TEAM_METADATA;
  const needsUpdate =
    seasonRow.name !== meta.name ||
    seasonRow.starts_on !== meta.starts_on ||
    seasonRow.ends_on !== meta.ends_on;

  if (needsUpdate) {
    const { error: eUpdate } = await supabase
      .from("seasons")
      .update({
        name: meta.name,
        starts_on: meta.starts_on,
        ends_on: meta.ends_on,
      })
      .eq("id", SEASON_2026_27_ID);
    if (eUpdate) throw eUpdate;
    console.log("\n  • 2026/27 teammetadata bijgewerkt in `seasons`:");
    console.log(`      name:      ${meta.name}`);
    console.log(`      periode:   ${meta.starts_on} → ${meta.ends_on}`);
  } else {
    console.log("\n  • 2026/27 teammetadata al actueel in `seasons`.");
    console.log(`      name:      ${seasonRow.name}`);
    console.log(`      periode:   ${seasonRow.starts_on} → ${seasonRow.ends_on}`);
  }

  console.log("\n[season:team] Teamgegevens (clubbreed, uit constants/club.ts — niet gewijzigd):");
  console.log(`  • Club:              ${TEAM_INFO_KNOWN_FROM_CODE.club_name}`);
  console.log(`  • Teamnaam (UI):     ${TEAM_INFO_KNOWN_FROM_CODE.teamnaam_ui}`);
  console.log(`  • Teamnaam (intern): ${TEAM_INFO_KNOWN_FROM_CODE.teamnaam_internal}`);
  console.log(`  • Competitie (DB):   afgeleid uit seasons.name → "${meta.name}"`);

  const activeStaff = STAFF_2026_27.filter((s) => s.status === "active");
  const archivedStaff = STAFF_2026_27.filter((s) => s.status === "archived");

  console.log("\n[season:team] Staf 2026/27:");
  if (STAFF_2026_27.length === 0) {
    console.log("  • Geen stafleden gedefinieerd (geen opslagstructuur in platform).");
  } else {
    console.log(`  • Actief:    ${activeStaff.map((s) => s.full_name).join(", ") || "—"}`);
    console.log(`  • Gearchiveerd: ${archivedStaff.map((s) => s.full_name).join(", ") || "—"}`);
  }

  console.log("\n[season:team] Samenvatting wijzigingen:");
  console.log(`  • Staf toegevoegd:     0`);
  console.log(`  • Staf gewijzigd:      0`);
  console.log(`  • Staf gearchiveerd:   0`);
  console.log(`  • Team-DB bijgewerkt:  ${needsUpdate ? "ja (seasons.name/periode)" : "nee (al actueel)"}`);
  console.log(`  • Constants gewijzigd: nee (clubbreed; buiten seizoenscope)`);

  console.log("\n[season:team] Ontbrekende gegevens:");
  for (const gap of TEAM_2026_27_DATA_GAPS) console.log(`    - ${gap}`);

  console.log("\n[season:team] Klaar.");
}

main().catch((e) => {
  console.error("[season:team] Mislukt:", e instanceof Error ? e.message : e);
  process.exit(1);
});
