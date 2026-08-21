import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { buildTrainingPerformanceCenter, trainerTrainingPerformanceView } from "@/lib/training/training-performance";
import { PlayerAttendanceRank } from "@/components/training/player-attendance-rank";

/** Alleen ADMIN_UI_PREVIEW — dezelfde trainer-cards als /training, echte DB, geen auth. */
export const dynamic = "force-dynamic";

export default async function TrainingPerformancePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const view = trainerTrainingPerformanceView(buildTrainingPerformanceCenter(db, seasonId));
  return (
    <div className="space-y-4 p-4 md:p-8">
      <p className="text-xs text-zvv-muted">Review-preview · trainer view van /training · echte productiedata</p>
      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <p className="club-page-eyebrow">Selectie</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Aanwezigheidsranglijst
        </h2>
        <p className="mt-1 text-sm text-zvv-muted">
          Beheerweergave: per speelster de laatste trainingen en redenen. Alleen zichtbaar voor teambeheer.
        </p>
        <div className="mt-4">
          <PlayerAttendanceRank rows={view.ranking} trainerView />
        </div>
      </section>
    </div>
  );
}
