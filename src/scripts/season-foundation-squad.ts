/**
 * Phase 2 — Season Foundation (Stap 3)
 *
 * Bereidt de selectie voor seizoen 2026/27 voor:
 * - kloont 2025/26-lidmaatschappen (shirt + positie) naar 2026/27
 * - slaat vertrekkende speelsters over (geen membership = archief)
 * - voegt nieuwe speelsters toe als player-rij; membership alleen bij bekende data
 * - laat 2025/26-data en player-rijen intact
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 *   cd platform && npm run season:squad
 *
 * Vereist: Stap 1 (`season:foundation`) al uitgevoerd.
 */

import "./load-platform-env";

import { randomUUID } from "crypto";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";
import { createClient } from "@supabase/supabase-js";
import {
  isDepartingPlayerName,
  NEW_PLAYERS_2026_27,
  SEASON_2025_26_ID,
  SEASON_2026_27_ID,
  SQUAD_2026_27_DATA_GAPS,
} from "@/lib/season-foundation/squad-2026-27-spec";

type PrevMembership = {
  id: string;
  player_id: string;
  shirt_number: number;
  position: string;
  display_position: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_guest: boolean;
  full_name: string;
};

function playerNameFromJoin(players: unknown): string {
  if (Array.isArray(players)) {
    const first = players[0] as { full_name?: string } | undefined;
    return first?.full_name?.trim() ?? "";
  }
  if (players && typeof players === "object" && "full_name" in players) {
    return String((players as { full_name?: string }).full_name ?? "").trim();
  }
  return "";
}

async function main() {
  assertSupabaseServiceRoleEnv();
  const supabase = createClient(getSupabaseUrl(), getServiceRoleKey());

  console.log("[season:squad] Stap 3 — selectie 2026/27 voorbereiden…");

  const { data: seasonRow, error: eSeason } = await supabase
    .from("seasons")
    .select("id,name")
    .eq("id", SEASON_2026_27_ID)
    .maybeSingle();
  if (eSeason) throw eSeason;
  if (!seasonRow) {
    throw new Error(
      `Seizoen 2026/27 (${SEASON_2026_27_ID}) ontbreekt. Voer eerst npm run season:foundation uit.`,
    );
  }

  const { data: prevRaw, error: ePrev } = await supabase
    .from("player_season_memberships")
    .select(
      "id,player_id,shirt_number,position,display_position,is_captain,is_vice_captain,is_guest,players(full_name)",
    )
    .eq("season_id", SEASON_2025_26_ID);
  if (ePrev) throw ePrev;

  const prev: PrevMembership[] = (prevRaw ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      player_id: String(r.player_id),
      shirt_number: Number(r.shirt_number),
      position: String(r.position),
      display_position: String(r.display_position ?? ""),
      is_captain: Boolean(r.is_captain),
      is_vice_captain: Boolean(r.is_vice_captain),
      is_guest: Boolean(r.is_guest),
      full_name: playerNameFromJoin(r.players),
    };
  });
  if (prev.length === 0) {
    console.warn(`[season:squad] Geen lidmaatschappen in 2025/26 (${SEASON_2025_26_ID}). Clone stap overgeslagen.`);
  }

  const departing: { name: string; player_id: string }[] = [];
  const toClone: PrevMembership[] = [];

  for (const m of prev) {
    const name = m.full_name;
    if (!name) {
      console.warn(`[season:squad] Lidmaatschap ${m.id} zonder spelernaam — overgeslagen.`);
      continue;
    }
    if (isDepartingPlayerName(name)) {
      departing.push({ name, player_id: m.player_id });
      continue;
    }
    if (m.is_guest) {
      console.warn(`[season:squad] Gast ${name} niet gekloond naar vaste selectie.`);
      continue;
    }
    toClone.push(m);
  }

  const isabelMatched = departing.some((d) => d.name.toLowerCase().includes("isabel"));
  if (!isabelMatched) {
    console.warn(
      "[season:squad] Geen speelster met 'Isabel' in de naam gevonden in 2025/26 — controleer productiedata handmatig.",
    );
  }

  console.log("\n[season:squad] Nieuwe speelsters (player-rijen)…");
  for (const np of NEW_PLAYERS_2026_27) {
    const { error } = await supabase.from("players").upsert(
      {
        id: np.id,
        full_name: np.full_name,
        photo_url: null,
        is_guest: false,
        role_label: np.role_label ?? null,
        card_note: np.card_note ?? null,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    console.log(`  • player: ${np.full_name} (${np.id})`);

    if (np.membership) {
      const { error: eMem } = await supabase.from("player_season_memberships").upsert(
        {
          id: randomUUID(),
          player_id: np.id,
          season_id: SEASON_2026_27_ID,
          shirt_number: np.membership.shirt_number,
          position: np.membership.position,
          display_position: np.membership.display_position,
          is_captain: false,
          is_vice_captain: false,
          is_guest: false,
        },
        { onConflict: "player_id,season_id" },
      );
      if (eMem) throw eMem;
      console.log(`    → membership: #${np.membership.shirt_number} ${np.membership.position}`);
    } else {
      console.log("    → membership: uitgesteld (ontbrekende gegevens)");
    }
  }

  console.log("\n[season:squad] Klonen 2025/26 → 2026/27…");
  let cloned = 0;
  for (const m of toClone) {
    const name = m.full_name || m.player_id;
    const { data: existing, error: eFind } = await supabase
      .from("player_season_memberships")
      .select("id")
      .eq("season_id", SEASON_2026_27_ID)
      .eq("player_id", m.player_id)
      .maybeSingle();
    if (eFind) throw eFind;

    const row = {
      id: existing?.id ?? randomUUID(),
      player_id: m.player_id,
      season_id: SEASON_2026_27_ID,
      shirt_number: m.shirt_number,
      position: m.position,
      display_position: m.display_position,
      is_captain: false,
      is_vice_captain: false,
      is_guest: false,
    };

    const { error: eUpsert } = await supabase
      .from("player_season_memberships")
      .upsert(row as never, { onConflict: "player_id,season_id" });
    if (eUpsert) throw eUpsert;
    cloned++;
    console.log(`  • ${name}: #${m.shirt_number} ${m.display_position}`);
  }

  const { data: finalMembers, error: eFinal } = await supabase
    .from("player_season_memberships")
    .select("player_id,shirt_number,position,display_position,players(full_name)")
    .eq("season_id", SEASON_2026_27_ID)
    .order("shirt_number", { ascending: true });
  if (eFinal) throw eFinal;

  const activeNames = (finalMembers ?? []).map((r) => {
    const p = r as { players?: { full_name?: string } | null; shirt_number: number; display_position: string };
    return `${p.players?.full_name ?? "?"} (#${p.shirt_number}, ${p.display_position})`;
  });

  const conceptOnly = NEW_PLAYERS_2026_27.filter((np) => !np.membership).map((np) => np.full_name);

  console.log("\n[season:squad] Samenvatting");
  console.log(`  • Gekloond naar 2026/27:     ${cloned}`);
  console.log(`  • Vertrokken (geen 26/27):   ${departing.map((d) => d.name).join(", ") || "—"}`);
  console.log(`  • Concept zonder membership: ${conceptOnly.join(", ") || "—"}`);
  console.log(`  • Totaal 2026/27 selectie:   ${finalMembers?.length ?? 0}`);

  console.log("\n[season:squad] Actieve selectie 2026/27:");
  for (const line of activeNames) console.log(`    - ${line}`);

  console.log("\n[season:squad] Gearchiveerd (wel player, geen 2026/27 membership):");
  for (const d of departing) console.log(`    - ${d.name}`);

  console.log("\n[season:squad] Ontbrekende gegevens:");
  for (const gap of SQUAD_2026_27_DATA_GAPS) console.log(`    - ${gap}`);
  if (!isabelMatched) {
    console.log("    - Isabel: niet gevonden in 2025/26-database — handmatig controleren of naam afwijkt.");
  }

  console.log("\n[season:squad] Klaar.");
}

main().catch((e) => {
  console.error("[season:squad] Mislukt:", e instanceof Error ? e.message : e);
  process.exit(1);
});
