import { readDb } from "@/lib/data/repository";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { AddPlayerToSeasonForm } from "@/components/admin/add-player-to-season-form";
import { SeasonCreateForm } from "@/components/admin/season-create-form";
import { SetActiveSeasonForm } from "@/components/admin/set-active-season-form";

export default async function BeheerSeizoenenPage() {
  const db = await readDb();

  return (
    <div className="space-y-10">
      <header className="border-b border-zvv-border pb-10">
        <p className="club-page-eyebrow">Beheer · Seizoenen</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Seizoenen</h1>
        <p className="mt-3 max-w-2xl text-sm text-zvv-muted">
          Alleen één actief seizoen tegelijk. Lidmaatschappen zijn per seizoen; bestaande club-speelsters kun je hieronder koppelen.
        </p>
      </header>

      <GlassCard>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Nieuw seizoen</h2>
        <SeasonCreateForm />
      </GlassCard>

      <div className="space-y-6">
        {db.seasons.map((s) => {
          const inSeason = new Set(db.player_season_memberships.filter((m) => m.season_id === s.id).map((m) => m.player_id));
          const candidates = db.players.filter((p) => !inSeason.has(p.id)).map((p) => ({ id: p.id, name: p.full_name }));

          return (
            <GlassCard key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zvv-border pb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">{s.name}</h3>
                    {s.is_active ? <Badge tone="gold">Actief</Badge> : <Badge tone="muted">Archief</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-zvv-muted">
                    {s.starts_on} → {s.ends_on}
                  </p>
                </div>
                <SetActiveSeasonForm seasonId={s.id} isActive={s.is_active} />
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zvv-muted">Speelster uit clubbestand koppelen</h4>
                <p className="mt-1 text-sm text-zvv-muted">Voor speelsters die al als clubrecord bestaan maar nog niet in dit seizoen zitten.</p>
                <div className="mt-4">
                  <AddPlayerToSeasonForm seasonId={s.id} candidates={candidates} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {db.seasons.length === 0 ? (
        <GlassCard className="club-empty-state !text-left">
          <p className="font-medium text-zvv-ink">Geen seizoenen</p>
          <p className="mt-2">Maak hierboven het eerste seizoen aan.</p>
        </GlassCard>
      ) : null}
    </div>
  );
}
