import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { seasonMatches } from "@/lib/queries/matches";
import { MatchCard } from "@/components/matches/match-card";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";

export default async function WedstrijdenPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const list = seasonMatches(db, seasonId);
  const isAdmin = await isCurrentUserAdmin();

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
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Nog geen wedstrijden</p>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-zvv-muted">Voor dit seizoen staan er nog geen duels in het programma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
          {list.map((m) => (
            <MatchCard key={m.id} db={db} m={m} seasonId={seasonId} />
          ))}
        </div>
      )}
    </div>
  );
}
