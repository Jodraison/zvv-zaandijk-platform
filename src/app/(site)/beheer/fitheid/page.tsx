import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { GlassCard } from "@/components/layout/glass-card";
import { FitnessBatchForm } from "@/components/admin/fitness-batch-form";
import { FitnessAdminTable, type FitnessAdminRow } from "@/components/admin/fitness-admin-table";

export default async function BeheerFitheidPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((mem) => ({
      id: mem.player_id,
      shirt: mem.shirt_number,
      name: db.players.find((p) => p.id === mem.player_id)?.full_name ?? "—",
    }))
    .sort((a, b) => a.shirt - b.shirt);

  const recentTests = db.fitness_tests.filter((f) => f.season_id === seasonId);
  const adminRows: FitnessAdminRow[] = recentTests
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
    <div className="space-y-10">
      <header className="border-b border-zvv-border pb-10">
        <p className="club-page-eyebrow">Beheer · Fitheid</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Sprint 20 / 40 / 60m</h1>
        <p className="mt-3 max-w-xl text-sm text-zvv-muted">
          Eén datum, alle speelsters tegelijk. Tijden in seconden met twee decimalen. Pas metingen hieronder aan of verwijder ze.
        </p>
      </header>

      <GlassCard variant="elevated">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Nieuwe meting (tabel)</h2>
        {members.length === 0 ? (
          <p className="mt-4 text-sm text-zvv-muted">Geen speelsters in dit seizoen — voeg eerst selectie toe onder Beheer → Spelers.</p>
        ) : (
          <div className="mt-6">
            <FitnessBatchForm seasonId={seasonId} members={members} />
          </div>
        )}
      </GlassCard>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Metingen beheren</h2>
        {adminRows.length === 0 ? (
          <GlassCard className="club-empty-state !text-left">
            <p className="text-sm text-zvv-muted">Nog geen sprintmetingen voor dit seizoen.</p>
          </GlassCard>
        ) : (
          <FitnessAdminTable rows={adminRows} />
        )}
      </section>
    </div>
  );
}
