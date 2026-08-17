import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { seasonMatches } from "@/lib/queries/matches";
import { MatchCard } from "@/components/matches/match-card";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";
import {
  SEASON_2026_27_ID,
  seasonOperations2026_27,
} from "@/lib/season/season-operations-2026-27";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function WedstrijdenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const list = seasonMatches(db, seasonId);
  const isAdmin = await isCurrentUserAdmin();
  const upcoming = list
    .filter((m) => m.status === "scheduled" || m.status === "postponed")
    .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
  const played = list
    .filter((m) => m.status === "played")
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at));

  const bekerMilestone = seasonOperations2026_27.milestones.find((m) => m.id === "beker-programma");
  const showPreProgramEmpty =
    list.length === 0 && seasonId === SEASON_2026_27_ID && !!bekerMilestone?.on;

  return (
    <div className="space-y-8 md:space-y-12">
      <header className="club-section-surface club-reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zvv-primary">Wedstrijden</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,4.25rem)] tracking-wide text-zvv-ink md:text-6xl">
            Programma
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zvv-muted">
            Uitslagen, tegenstanders en speelmomenten in een strak en direct scanbaar wedstrijdarchief.
          </p>
        </div>
        {isAdmin ? (
          <Link
            href={`/beheer/wedstrijden/nieuw?season=${encodeURIComponent(seasonId)}`}
            className="club-btn-primary club-btn-primary-sm shrink-0"
          >
            Wedstrijd toevoegen
          </Link>
        ) : null}
      </header>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zvv-border bg-zvv-card-mid/60 px-8 py-16 text-center">
          {showPreProgramEmpty ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
                Het wedstrijdprogramma is nog niet bekend
              </p>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-zvv-muted">
                Het officiële bekerprogramma wordt vanaf 8 augustus verwacht.
              </p>
            </>
          ) : (
            <>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
                Nog geen wedstrijden
              </p>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-zvv-muted">
                Voor dit seizoen staan er nog geen duels in het programma.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 ? (
            <section className="space-y-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
                {upcoming.length === 1 ? "Volgende wedstrijd" : "Komend programma"}
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
                {upcoming.map((m, idx) => (
                  <MatchCard
                    key={m.id}
                    db={db}
                    m={m}
                    seasonId={seasonId}
                    featured={idx === 0}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {played.length > 0 ? (
            <section className="space-y-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Gespeeld</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
                {played.map((m) => (
                  <MatchCard key={m.id} db={db} m={m} seasonId={seasonId} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
