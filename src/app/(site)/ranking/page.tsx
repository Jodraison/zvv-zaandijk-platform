import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { computeRanking } from "@/lib/queries/ranking";
import { RankingBoard } from "@/components/ranking/ranking-board";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";

export default async function RankingPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const rows = computeRanking(db, seasonId);
  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="space-y-12 md:space-y-16">
      <header className="club-section-surface club-reveal border-b-0 pb-11 md:pb-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <span
            className="hidden h-28 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-zvv-primary via-zvv-primary/45 to-zvv-primary/10 sm:block md:h-32"
            aria-hidden
          />
          <div className="min-w-0 max-w-3xl">
            <p className="club-page-eyebrow-strong">Ranking</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.85rem,7vw,4.65rem)] leading-[0.93] tracking-[0.02em] text-zvv-ink">
              Leaderboard
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-zvv-muted md:text-lg">
              Goals, assists en WOTM in een helder klassement. Meteen zichtbaar wie het verschil maakt voor Zaandijk VRZ1.
            </p>
          </div>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="club-empty-state">
          <p className="text-lg font-semibold text-zvv-ink">Nog geen ranking</p>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
            Voor dit seizoen zijn er nog geen speelsters met lidmaatschap om te tonen.
          </p>
        </div>
      ) : (
        <RankingBoard rows={rows} seasonId={seasonId} adminMode={isAdmin} />
      )}
    </div>
  );
}
