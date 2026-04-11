import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { computeRanking } from "@/lib/queries/ranking";
import { SelectieClient } from "@/components/players/selectie-client";

function SelectieFallback() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <p className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Selectie niet beschikbaar</p>
      <p className="mt-2 text-sm text-zvv-muted">Probeer de pagina te verversen.</p>
    </div>
  );
}

export default async function SelectiePage() {
  try {
    const db = await readDb();
    const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
    const seasonId = resolveSeasonId(db, cookieSeason);
    const ranking = computeRanking(db, seasonId);
    return <SelectieClient rows={ranking} seasonId={seasonId} />;
  } catch {
    return <SelectieFallback />;
  }
}
