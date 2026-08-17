import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { CancelTrainingForm } from "@/components/admin/operations/trainer-task-forms";
import { generateMonWedDates, getSeasonOperations, todayInClubTz } from "@/lib/season/season-operations-2026-27";
import { withSeason } from "@/lib/admin/beheer-nav";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function TaakTrainingAfgelastenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const ops = getSeasonOperations(seasonId);
  const today = todayInClubTz();
  const cancelled = new Set(
    db.training_sessions
      .filter((s) => s.season_id === seasonId && s.status === "cancelled")
      .map((s) => s.session_at.slice(0, 10)),
  );
  const dates = (ops ? generateMonWedDates(ops.operationalStartOn, ops.operationalEndOn) : [])
    .filter((d) => d >= today && !cancelled.has(d))
    .slice(0, 24);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Training afgelasten"
        description="Kies een toekomstige ma/wo-training. De sessie blijft zichtbaar als afgelast; aanwezigheid is niet nodig."
        actions={
          <Link href={withSeason("/beheer", seasonId)} className="club-btn-secondary club-btn-primary-sm">
            Terug
          </Link>
        }
      />
      <CancelTrainingForm seasonId={seasonId} dates={dates} />
    </div>
  );
}
