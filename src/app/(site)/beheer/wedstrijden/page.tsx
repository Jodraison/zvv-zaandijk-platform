import Link from "next/link";
import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { seasonMatches } from "@/lib/queries/matches";
import { GlassCard } from "@/components/layout/glass-card";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { formatDateTimeNL } from "@/lib/utils/format-date";

export default async function BeheerWedstrijdenPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const list = seasonMatches(db, seasonId);
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const statusLabel: Record<string, string> = {
    scheduled: "Gepland",
    played: "Gespeeld",
    postponed: "Uitgesteld",
    cancelled: "Afgelast",
  };

  return (
    <div className="space-y-10">
      <header className="club-section-surface !rounded-2xl !px-6 !py-8 md:!px-8 md:!py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="club-page-eyebrow">Beheer · Wedstrijden</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Kalender</h1>
            <p className="mt-3 max-w-xl text-sm text-zvv-muted">Alle wedstrijden van het geselecteerde seizoen. Klik om te bewerken.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href={`/beheer/wedstrijd-toevoegen${q}`} className="club-btn-primary inline-flex justify-center text-center">
              Uitslag invoeren
            </Link>
            <Link href={`/beheer/wedstrijden/nieuw${q}`} className="club-btn-secondary inline-flex justify-center text-center">
              Nieuwe wedstrijd plannen
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {list.map((m) => {
          const score = resolveMatchScore(m);
          return (
            <Link key={m.id} href={`/beheer/wedstrijden/${m.id}${q}`}>
              <GlassCard className="transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-zvv-primary/25">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zvv-muted">{statusLabel[m.status] ?? m.status}</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">
                      {displayTeamLabel(score.homeTeam)} — {displayTeamLabel(score.awayTeam)}
                    </p>
                    <p className="mt-1 text-sm text-zvv-muted">{formatDateTimeNL(m.kickoff_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-zvv-ink md:text-4xl">
                      {score.homeScore}
                      <span className="mx-1 text-zvv-ink/30">:</span>
                      {score.awayScore}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <GlassCard className="club-empty-state !text-left">
          <p className="font-medium text-zvv-ink">Nog geen wedstrijden</p>
          <p className="mt-2 max-w-md">Voeg een geplande wedstrijd toe of werk direct een uitslag in.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/beheer/wedstrijden/nieuw${q}`} className="club-btn-primary club-btn-primary-sm">
              Wedstrijd plannen
            </Link>
            <Link href={`/beheer/wedstrijd-toevoegen${q}`} className="club-btn-secondary club-btn-primary-sm">
              Uitslag invoeren
            </Link>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
