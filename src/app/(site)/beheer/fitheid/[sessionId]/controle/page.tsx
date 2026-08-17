import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { FitnessSessionReview } from "@/components/admin/fitness/fitness-session-review";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function BeheerFitheidControlePage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.season_id !== seasonId) notFound();

  const results = db.fitness_test_results.filter((r) => r.session_id === sessionId);
  const rows = results
    .map((r) => {
      const mem = db.player_season_memberships.find(
        (m) => m.player_id === r.player_id && m.season_id === seasonId,
      );
      const p = db.players.find((x) => x.id === r.player_id);
      return {
        player_id: r.player_id,
        name: p?.full_name ?? "—",
        shirt_number: mem?.shirt_number ?? null,
        flying_sprint_30m_seconds: r.flying_sprint_30m_seconds,
        agility_10_20_10_seconds: r.agility_10_20_10_seconds,
        plank_seconds: r.plank_seconds,
        six_minute_run_meters: r.six_minute_run_meters,
        participation_status: r.participation_status,
      };
    })
    .sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Controle"
        description={`Controleer alle vier onderdelen voor ${session.test_on} vóór je het testmoment definitief maakt.`}
      />
      <FitnessSessionReview
        sessionId={session.id}
        seasonId={seasonId}
        testOn={session.test_on}
        status={session.status}
        rows={rows}
      />
    </div>
  );
}
