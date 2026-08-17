import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { GlassCard } from "@/components/layout/glass-card";
import { FitnessBatchForm } from "@/components/admin/fitness-batch-form";
import { FitnessAdminTable, type FitnessAdminRow } from "@/components/admin/fitness-admin-table";
import { AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function BeheerFitheidLegacyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((mem) => {
      const player = db.players.find((p) => p.id === mem.player_id);
      return {
        id: mem.player_id,
        shirt: mem.shirt_number,
        name: player?.full_name ?? "—",
        is_guest: player?.is_guest ?? false,
      };
    })
    .filter((m) => !m.is_guest)
    .sort((a, b) => a.shirt - b.shirt);

  const adminRows: FitnessAdminRow[] = db.fitness_tests
    .filter((f) => f.season_id === seasonId)
    .map((f) => {
      const mem = db.player_season_memberships.find((m) => m.player_id === f.player_id && m.season_id === seasonId);
      return {
        id: f.id,
        player_id: f.player_id,
        playerName: db.players.find((p) => p.id === f.player_id)?.full_name ?? "—",
        shirt: mem?.shirt_number ?? 0,
        test_on: f.test_on,
        sprint_20m: f.sprint_20m,
        sprint_40m: f.sprint_40m,
        sprint_60m: f.sprint_60m,
      };
    })
    .sort((a, b) => b.test_on.localeCompare(a.test_on) || a.shirt - b.shirt);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Historische sprinttest 20 / 40 / 60 meter"
        description="Oud testprotocol. Alleen voor bestaande historie — niet verwarren met het nieuwe vierdelige protocol."
        actions={
          <Link href={`/beheer/fitheid${q}`} className="club-btn-primary club-btn-primary-sm">
            Naar nieuw protocol
          </Link>
        }
      />

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Dit is het oude protocol. Nieuwe trainingen gebruik je onder Fitheid → Nieuw testmoment (sprint, agility,
        plank, 6 min loop).
      </p>

      <AdminSection title="Legacy-invoer" description="Opslaan per speelster — lege velden wissen geen bestaande meting.">
        <GlassCard variant="elevated">
          {members.length === 0 ? (
            <p className="text-sm text-zvv-muted">Geen speelsters in dit seizoen.</p>
          ) : (
            <FitnessBatchForm seasonId={seasonId} members={members} />
          )}
        </GlassCard>
      </AdminSection>

      <AdminSection title="Opgeslagen metingen">
        {adminRows.length === 0 ? (
          <GlassCard className="club-empty-state !text-left">
            <p className="text-sm text-zvv-muted">Nog geen historische sprintmetingen voor dit seizoen.</p>
          </GlassCard>
        ) : (
          <FitnessAdminTable rows={adminRows} />
        )}
      </AdminSection>
    </div>
  );
}
