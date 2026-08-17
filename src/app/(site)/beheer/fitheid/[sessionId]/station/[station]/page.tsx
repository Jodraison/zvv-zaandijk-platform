import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { FitnessStationEntry } from "@/components/admin/fitness/fitness-station-entry";
import { activeSeasonMembers } from "@/lib/players/season-squad";
import { membershipPositionLabel } from "@/lib/match-lineup";

type Props = {
  params: Promise<{ sessionId: string; station: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function BeheerFitheidStationPage({ params, searchParams }: Props) {
  const { sessionId, station } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.season_id !== seasonId) notFound();

  const meta = FITNESS_COMPONENTS.find((c) => c.tabId === station);
  if (!meta) notFound();

  const members = activeSeasonMembers(db, seasonId).map(({ player, membership }) => ({
    player_id: player.id,
    name: player.full_name,
    shirt_number: membership.shirt_number,
    position_label:
      membership.display_position?.trim() ||
      membership.position ||
      membershipPositionLabel(db, seasonId, player.id) ||
      null,
  }));

  const results = db.fitness_test_results.filter((r) => r.session_id === sessionId);
  const initialRows = members.map((m) => {
    const r = results.find((x) => x.player_id === m.player_id);
    return {
      player_id: m.player_id,
      flying_sprint_30m_seconds: r?.flying_sprint_30m_seconds ?? null,
      agility_10_20_10_seconds: r?.agility_10_20_10_seconds ?? null,
      plank_seconds: r?.plank_seconds ?? null,
      six_minute_run_meters: r?.six_minute_run_meters ?? null,
      participation_status: r?.participation_status ?? ("pending" as const),
      participation_reason: r?.participation_reason ?? null,
      note: r?.note ?? null,
    };
  });

  return (
    <FitnessStationEntry
      sessionId={session.id}
      seasonId={seasonId}
      testOn={session.test_on}
      status={session.status}
      stationTab={meta.tabId}
      players={members}
      initialRows={initialRows}
      readOnly={session.status === "published"}
    />
  );
}
