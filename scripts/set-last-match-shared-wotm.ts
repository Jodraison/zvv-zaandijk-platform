/**
 * Zet Danique + Mandy als gedeelde POTM op de laatste gespeelde wedstrijd.
 * Alleen als match + player IDs exact overeenkomen met de geauditte productie-rij.
 */
import "../src/scripts/load-platform-env";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const MATCH_ID = "c1ccbec0-3619-4c5f-adb0-3111b6055a7e";
const DANIQUE = "f1000001-0000-4000-8000-000000000011";
const MANDY = "f1000001-0000-4000-8000-00000000000a";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: match, error: matchErr } = await sb
    .from("matches")
    .select("id,opponent,kickoff_at,status,wotm_player_id")
    .eq("id", MATCH_ID)
    .maybeSingle();
  if (matchErr || !match) throw new Error(matchErr?.message ?? "Wedstrijd niet gevonden");
  if (match.opponent !== "WSV 1930 VR1") throw new Error(`Onverwachte tegenstander: ${match.opponent}`);
  if (!String(match.kickoff_at).startsWith("2026-08-29")) throw new Error(`Onverwachte kickoff: ${match.kickoff_at}`);
  if (match.status !== "played") throw new Error(`Onverwachte status: ${match.status}`);
  if (match.wotm_player_id !== DANIQUE) throw new Error("Legacy POTM is niet Danique — afgebroken.");

  const { data: before } = await sb.from("match_wotm_winners").select("player_id").eq("match_id", MATCH_ID);
  const beforeIds = (before ?? []).map((r) => r.player_id).sort();
  if (!beforeIds.includes(DANIQUE)) throw new Error("Danique ontbreekt in junction — afgebroken.");

  const { error: insErr } = await sb.from("match_wotm_winners").upsert(
    { match_id: MATCH_ID, player_id: MANDY },
    { onConflict: "match_id,player_id" },
  );
  if (insErr) throw new Error(insErr.message);

  const { data: after } = await sb.from("match_wotm_winners").select("player_id").eq("match_id", MATCH_ID);
  const afterIds = (after ?? []).map((r) => r.player_id).sort();
  const expected = [MANDY, DANIQUE].sort();
  if (afterIds.join() !== expected.join()) {
    throw new Error(`Onverwachte winnaars na write: ${afterIds.join(",")}`);
  }

  const outDir = resolve(process.cwd(), ".review-backups/wotm-multi-028");
  mkdirSync(outDir, { recursive: true });
  const proof = {
    at: new Date().toISOString(),
    match_id: MATCH_ID,
    opponent: match.opponent,
    kickoff_at: match.kickoff_at,
    before_ids: beforeIds,
    after_ids: afterIds,
    legacy_wotm_player_id: match.wotm_player_id,
  };
  writeFileSync(resolve(outDir, "last-match-shared-wotm.json"), JSON.stringify(proof, null, 2), "utf8");
  console.log(JSON.stringify({ ok: true, ...proof }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
