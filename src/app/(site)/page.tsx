import Link from "next/link";
import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { computeRanking } from "@/lib/queries/ranking";
import { nextScheduledMatch, teamFormLast5 } from "@/lib/queries/matches";
import { TeamFormStrip } from "@/components/home/team-form-strip";
import { MatchCountdown } from "@/components/home/match-countdown";
import { ClubHomeHero } from "@/components/home/club-home-hero";
import { TeamPhotoBlock } from "@/components/home/team-photo-block";
import { SeasonStandoutsPodium } from "@/components/home/season-standouts-podium";
import { HomePlayerShowcase } from "@/components/home/home-player-showcase";

export default async function HomePage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const ranking = computeRanking(db, seasonId);
  const nextM = nextScheduledMatch(db, seasonId);
  const form = teamFormLast5(db, seasonId);

  const q = (sid: string) => `?season=${encodeURIComponent(sid)}`;
  const navTiles = [
    { href: `/selectie${q(seasonId)}`, title: "Selectie", subtitle: "Speelsters en profielen", icon: "🛡️" },
    { href: `/wedstrijden${q(seasonId)}`, title: "Wedstrijden", subtitle: "Programma en uitslagen", icon: "⚽" },
    { href: `/ranking${q(seasonId)}`, title: "Ranking", subtitle: "Goals, assists en WOTM", icon: "🏆" },
    { href: `/training${q(seasonId)}`, title: "Training", subtitle: "Opkomst en ritme", icon: "📈" },
    { href: `/fitheid${q(seasonId)}`, title: "Fitheid", subtitle: "Sprintdata en progressie", icon: "⚡" },
  ] as const;

  return (
    <>
      <ClubHomeHero seasonId={seasonId} nextM={nextM} />

      <main className="mx-auto max-w-[114rem] space-y-14 px-4 pb-14 pt-12 md:space-y-20 md:px-0 md:pb-16 md:pt-14">
        {/* Match focus: één blok — geen dubbele witte card eromheen op mobiel */}
        <section className="mx-auto max-w-[110rem] md:px-8" aria-label="Volgende wedstrijd">
          {nextM ? (
            <MatchCountdown
              kickoffIso={nextM.kickoff_at}
              opponent={nextM.opponent}
              isHome={nextM.is_home}
              matchId={nextM.id}
              seasonId={seasonId}
            />
          ) : (
            <div className="rounded-2xl border border-zvv-border bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.1)] md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zvv-primary">Volgende wedstrijd</p>
              <p className="mt-3 text-base text-zvv-muted">Nog geen aankomende wedstrijd ingepland.</p>
            </div>
          )}
        </section>

        {/* 3. TEAM PHOTO FEATURE */}
        <section className="club-reveal mx-auto max-w-[110rem]">
          <TeamPhotoBlock dbUrl={db.team_photo_url} seasonId={seasonId} />
        </section>

        {/* 4. PLAYER SHOWCASE */}
        <section className="club-reveal mx-auto max-w-[106rem]">
          <HomePlayerShowcase rows={ranking} seasonId={seasonId} />
        </section>

        {/* 5. CLEAN HIGHLIGHT / CTA */}
        <section className="club-reveal mx-auto max-w-[110rem] rounded-2xl bg-gradient-to-br from-zvv-ink via-zvv-blue-deep to-zvv-primary p-5 text-white shadow-[0_28px_74px_rgba(15,23,42,0.35)] sm:rounded-[2.2rem] sm:p-6 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.12fr_1fr] xl:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/85">Seizoensspotlight</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.1rem,4.7vw,3.4rem)] leading-[0.96] tracking-wide">
                Vorm, cijfers en momenten
              </h2>
              <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:mt-7 md:p-7">
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/80">Laatste vijf</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-blue-100/90">
                    <span className="font-semibold text-emerald-200">W</span> winst · <span className="font-semibold text-amber-200">G</span> gelijk ·{" "}
                    <span className="font-semibold text-rose-200">V</span> verlies
                  </p>
                </div>
                <TeamFormStrip form={form} />
                <Link href={`/ranking${q(seasonId)}`} className="mt-6 inline-block text-sm font-semibold text-white transition-colors hover:text-blue-100 hover:underline">
                  Volledige ranking →
                </Link>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-white/18 bg-white/10 p-4 md:p-6" aria-labelledby="standouts-heading">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/85">Podium</p>
                <h3 id="standouts-heading" className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-wide text-white">
                  Seizoenspodium
                </h3>
                <div className="mt-5">
                  <SeasonStandoutsPodium ranking={ranking} seasonId={seasonId} />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {navTiles.map((tile) => (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group rounded-2xl border border-white/18 bg-white/95 p-4 text-zvv-ink shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.2)] md:hover:scale-[1.02]"
                  >
                    <p className="font-[family-name:var(--font-display)] text-xl tracking-wide">{tile.title}</p>
                    <p className="mt-1 text-xs text-zvv-muted">{tile.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
