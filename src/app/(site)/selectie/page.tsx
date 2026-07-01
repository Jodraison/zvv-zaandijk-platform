import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
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

export default async function SelectiePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  try {
    const sp = await searchParams;
    const db = await readDb();
    const seasonId = await readResolvedSeasonId(db, sp.season);
    const ranking = computeRanking(db, seasonId);
    return <SelectieClient rows={ranking} seasonId={seasonId} />;
  } catch {
    return <SelectieFallback />;
  }
}
