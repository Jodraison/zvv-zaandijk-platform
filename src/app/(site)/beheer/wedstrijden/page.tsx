import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { seasonMatches } from "@/lib/queries/matches";
import { GlassCard } from "@/components/layout/glass-card";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { matchTypeLabel } from "@/lib/match-type";
import { formatDateTimeNL } from "@/lib/utils/format-date";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { AdminMatchRowActions } from "@/components/admin/admin-match-row-actions";
import { matchPrepLabel, matchPrepStatus } from "@/lib/match/match-planning";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function BeheerWedstrijdenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const list = seasonMatches(db, seasonId, { includeNonProduction: true });
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const statusLabel: Record<string, string> = {
    scheduled: "Gepland",
    played: "Gespeeld",
    postponed: "Uitgesteld",
    cancelled: "Afgelast",
  };

  const upcoming = list
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
  const played = list.filter((m) => m.status === "played");
  const needsCheck = played.filter((m) => m.integrity_state !== "verified");

  function MatchRow({ m }: { m: (typeof list)[number] }) {
    const score = resolveMatchScore(m);
    const incomplete = m.status === "played" && m.integrity_state !== "verified";
    const hasStats =
      m.status === "played" ||
      (m.goals_for ?? 0) > 0 ||
      (m.goals_against ?? 0) > 0 ||
      db.match_goal_events.some((e) => e.match_id === m.id);
    const prep = matchPrepStatus(
      m,
      db.match_lineup_entries.filter((e) => e.match_id === m.id),
    );
    return (
      <GlassCard className="transition duration-200 hover:-translate-y-0.5 hover:border-zvv-primary/25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/beheer/wedstrijden/${m.id}${q}`} className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zvv-muted">
              {statusLabel[m.status] ?? m.status} · {matchTypeLabel(m.match_type)}
              {m.status === "scheduled" ? ` · ${matchPrepLabel(prep)}` : ""}
              {incomplete ? " · Nog af te ronden" : ""}
              {m.status === "played" && m.integrity_state === "verified" ? " · Afgerond" : ""}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">
              {displayTeamLabel(score.homeTeam)} — {displayTeamLabel(score.awayTeam)}
            </p>
            <p className="mt-1 text-sm text-zvv-muted">{formatDateTimeNL(m.kickoff_at)}</p>
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-zvv-ink md:text-4xl">
              {score.homeScore}
              <span className="mx-1 text-zvv-ink/30">:</span>
              {score.awayScore}
            </p>
            <AdminMatchRowActions
              matchId={m.id}
              seasonId={seasonId}
              opponent={m.opponent}
              kickoffAt={m.kickoff_at}
              status={m.status}
              hasStats={hasStats}
              showFinish={m.status === "scheduled" || m.status === "postponed"}
            />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Beheer · Wedstrijden"
        title="Wedstrijden"
        description="Plan nieuwe wedstrijden of werk een uitslag bij. Doelpunten, assists en MVP horen bij dezelfde opslag."
        actions={
          <>
            <Link href={`/beheer/wedstrijd-toevoegen${q}`} className="club-btn-primary club-btn-primary-sm">
              Uitslag invoeren
            </Link>
            <Link href={`/beheer/wedstrijden/nieuw${q}`} className="club-btn-secondary club-btn-primary-sm">
              Wedstrijd plannen
            </Link>
          </>
        }
      />

      {needsCheck.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          {needsCheck.length} gespeelde wedstrijd(en) vragen om controle. Open ze om doelpunten/MVP te bevestigen.
        </div>
      ) : null}

      {list.length === 0 ? (
        <AdminEmptyState
          title="Nog geen wedstrijden"
          description="Voeg een geplande wedstrijd toe of werk direct een uitslag in na de match."
          action={
            <>
              <Link href={`/beheer/wedstrijden/nieuw${q}`} className="club-btn-primary club-btn-primary-sm">
                Wedstrijd plannen
              </Link>
              <Link href={`/beheer/wedstrijd-toevoegen${q}`} className="club-btn-secondary club-btn-primary-sm">
                Uitslag invoeren
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Eerstvolgende</h2>
              {upcoming.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </section>
          ) : null}
          {played.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Gespeeld</h2>
              {played.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
