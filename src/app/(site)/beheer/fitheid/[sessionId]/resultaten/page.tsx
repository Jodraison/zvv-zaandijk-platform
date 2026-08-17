import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
} from "@/lib/fitness/parse-values";
import { COMPLETENESS_LABEL, derivePlayerCompleteness } from "@/lib/fitness/completeness";
import { formatDateNL } from "@/lib/utils/format-date";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function BeheerFitheidResultatenPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.season_id !== seasonId) notFound();
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const results = db.fitness_test_results
    .filter((r) => r.session_id === sessionId)
    .map((r) => {
      const mem = db.player_season_memberships.find(
        (m) => m.player_id === r.player_id && m.season_id === seasonId,
      );
      const p = db.players.find((x) => x.id === r.player_id);
      return {
        ...r,
        name: p?.full_name ?? "—",
        shirt_number: mem?.shirt_number ?? null,
      };
    })
    .sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resultaten"
        description={`${formatDateNL(session.test_on)} · ${session.status === "published" ? "Definitief" : "Concept"} — vier onderdelen, geen totale tijd.`}
        actions={
          <>
            <Link href={`/beheer/fitheid${q}`} className="club-btn-secondary club-btn-primary-sm">
              Overzicht
            </Link>
            <Link href={`/beheer/fitheid/${sessionId}/controle${q}`} className="club-btn-primary club-btn-primary-sm">
              Controle
            </Link>
          </>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-zvv-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zvv-border bg-zvv-card-mid/60 text-zvv-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Speelster</th>
              <th className="px-3 py-2 font-medium">Sprint</th>
              <th className="px-3 py-2 font-medium">Agility</th>
              <th className="px-3 py-2 font-medium">Plank</th>
              <th className="px-3 py-2 font-medium">6 min loop</th>
              <th className="px-3 py-2 font-medium">Volledigheid</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b border-zvv-border/70">
                <td className="px-3 py-2 font-medium text-zvv-ink">
                  {r.shirt_number != null ? `#${r.shirt_number} ` : ""}
                  {r.name}
                </td>
                <td className="px-3 py-2">{formatSecondsNl(r.flying_sprint_30m_seconds)}</td>
                <td className="px-3 py-2">{formatSecondsNl(r.agility_10_20_10_seconds)}</td>
                <td className="px-3 py-2">{formatPlankDisplay(r.plank_seconds)}</td>
                <td className="px-3 py-2">{formatMetersNl(r.six_minute_run_meters)}</td>
                <td className="px-3 py-2">{COMPLETENESS_LABEL[derivePlayerCompleteness(r)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
