import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { WotmSpotlight } from "@/components/matches/wotm-spotlight";
import { matchdayShirtForPlayer } from "@/lib/queries/matchday-squad";
import { matchResult } from "@/lib/queries/matches";
import { matchGoalLines } from "@/lib/queries/match-goal-lines";
import { cn } from "@/lib/utils";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { formatKickoffLongNl } from "@/lib/utils/format-date";

type Props = { params: Promise<{ matchId: string }> };

export default async function MatchDetailPage({ params }: Props) {
  const { matchId } = await params;
  const db = await readDb();
  const m = db.matches.find((x) => x.id === matchId);
  if (!m) notFound();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);

  const score = resolveMatchScore(m);
  const result = matchResult(db, m);
  const resultNl = result === "W" ? "Winst" : result === "L" ? "Verlies" : result === "D" ? "Gelijk" : null;

  const wotm = m.wotm_player_id ? db.players.find((p) => p.id === m.wotm_player_id) : null;
  const wotmMem = m.wotm_player_id
    ? db.player_season_memberships.find((x) => x.player_id === m.wotm_player_id && x.season_id === m.season_id)
    : null;
  const wotmPl = m.wotm_player_id ? db.players.find((p) => p.id === m.wotm_player_id) : null;
  const wotmIsGuest = !!wotmPl?.is_guest;
  const wotmShirt = m.wotm_player_id ? matchdayShirtForPlayer(db, matchId, m.season_id, m.wotm_player_id) : null;

  const goalLines = matchGoalLines(db, matchId);

  return (
    <div className="space-y-8 md:space-y-12">
      <Link
        href={`/wedstrijden?season=${encodeURIComponent(seasonId)}`}
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-zvv-primary hover:text-zvv-primary-hover"
      >
        ← Alle wedstrijden
      </Link>

      <section className="relative overflow-hidden rounded-2xl border-2 border-zvv-primary/15 bg-white px-4 py-10 shadow-[0_24px_64px_rgba(29,78,216,0.12)] sm:rounded-3xl sm:px-8 sm:py-12 md:px-14 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zvv-primary/[0.07] via-transparent to-zvv-card-mid/40" />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-[min(80%,420px)] w-[min(100%,480px)] -translate-y-1/2 rounded-full bg-zvv-primary/[0.06] blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-between">
            <span className="rounded-full border border-zvv-border bg-zvv-card px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zvv-ink">
              {m.status === "played" ? "Live board" : m.status === "scheduled" ? "Gepland" : m.status}
            </span>
            {m.status === "played" && result ? (
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none text-white",
                  result === "W" && "bg-green-500",
                  result === "L" && "bg-red-500",
                  result === "D" && "bg-gray-400",
                )}
                aria-label={resultNl ?? undefined}
              >
                {result === "W" ? "W" : result === "L" ? "V" : "G"}
              </span>
            ) : null}
          </div>

          <p className="mt-8 text-center text-sm font-medium text-zvv-muted md:mt-10">
            {formatKickoffLongNl(m.kickoff_at)}
            {" · "}
            {m.is_home ? "Thuis" : "Uit"}
          </p>

          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-2 md:mt-12 md:gap-8">
            <div className="min-w-0 pb-2 text-center md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zvv-muted">{m.is_home ? "Zaandijk" : "Tegenstander"}</p>
              <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.25rem,3.8vw,2.35rem)] leading-tight tracking-wide text-zvv-ink">
                {displayTeamLabel(score.homeTeam)}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline justify-center gap-1 px-0 sm:gap-3">
              <span className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,14vw,9rem)] leading-none tabular-nums tracking-tight text-zvv-primary drop-shadow-sm">
                {m.status === "played" ? score.homeScore : "—"}
              </span>
              <span className="font-[family-name:var(--font-display)] text-[clamp(1.25rem,5vw,3.5rem)] leading-none pb-1 text-zvv-border-bright md:pb-2">
                :
              </span>
              <span className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,14vw,9rem)] leading-none tabular-nums tracking-tight text-zvv-ink drop-shadow-sm">
                {m.status === "played" ? score.awayScore : "—"}
              </span>
            </div>
            <div className="min-w-0 pb-2 text-center md:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zvv-muted">{m.is_home ? "Tegenstander" : "Zaandijk"}</p>
              <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.25rem,3.8vw,2.35rem)] leading-tight tracking-wide text-zvv-ink">
                {displayTeamLabel(score.awayTeam)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {wotm && (wotmMem || wotmIsGuest) ? (
        <WotmSpotlight name={wotm.full_name} shirt={wotmShirt} isGuest={wotmIsGuest} photoUrl={wotm.photo_url} />
      ) : m.status === "played" ? (
        <div className="rounded-2xl border border-zvv-border bg-zvv-card-mid/50 px-6 py-8 text-center text-[15px] text-zvv-muted">
          Nog geen MVP gekozen voor deze wedstrijd.
        </div>
      ) : null}

      <section className="rounded-2xl border border-zvv-border bg-zvv-card px-6 py-9 shadow-[var(--shadow-zvv-card)] md:px-10 md:py-11">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] tracking-wide text-zvv-ink">Doelpuntentijdlijn</h2>
        <p className="mt-2 text-[15px] text-zvv-muted">Voor Zaandijk — met assist waar bekend.</p>
        {goalLines.length === 0 ? (
          <p className="mt-8 text-[15px] text-zvv-muted">Geen doelpunten geregistreerd voor deze wedstrijd.</p>
        ) : (
          <ul className="mt-10 space-y-4">
            {goalLines.map((line, i) => (
              <li key={`${line.scorerName}-${line.displayMinute}-${i}`}>
                <div className="flex flex-col gap-3 rounded-xl border border-zvv-border/90 bg-zvv-card-mid/50 px-4 py-4 transition-[border-color,box-shadow] duration-300 hover:border-zvv-primary/25 hover:shadow-md sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-5">
                  <div className="flex shrink-0 items-baseline gap-2 sm:w-[5.5rem] sm:justify-end sm:text-right">
                    <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-tight text-zvv-primary md:text-3xl">
                      {line.displayMinute}&apos;
                    </span>
                    <span className="text-xl" aria-hidden>
                      ⚽
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-[17px] font-medium leading-snug text-zvv-ink md:text-lg">
                    <span className="font-[family-name:var(--font-display)] text-xl tracking-wide md:text-2xl">{line.scorerName}</span>
                    {line.assistName ? (
                      <span className="mt-1 block text-[15px] font-normal text-zvv-muted sm:mt-0 sm:inline">
                        {" "}
                        (assist {line.assistName})
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
