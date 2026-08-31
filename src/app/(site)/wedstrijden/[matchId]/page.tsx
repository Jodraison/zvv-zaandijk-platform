import { notFound } from "next/navigation";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { WotmSpotlight } from "@/components/matches/wotm-spotlight";
import { matchdayShirtForPlayer } from "@/lib/queries/matchday-squad";
import { buildMatchLineupDisplay } from "@/lib/queries/match-lineup";
import { buildMatchTimeline } from "@/lib/queries/match-timeline";
import { matchResult } from "@/lib/queries/matches";
import { cn } from "@/lib/utils";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { matchTypeLabel } from "@/lib/match-type";
import { formatKickoffLongNl } from "@/lib/utils/format-date";
import { getMatchShapeAtMinute } from "@/lib/match/match-shape";
import { MatchCountdownLabel } from "@/components/match/match-countdown-label";
import { PublicMatchLineup } from "@/components/matches/public-match-lineup";
import { wotmPlayerIdsOf } from "@/lib/match/wotm-winners";

type Props = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function MatchDetailPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const m = db.matches.find((x) => x.id === matchId);
  if (!m) notFound();
  const seasonId = await readResolvedSeasonId(db, sp.season);

  const score = resolveMatchScore(m);
  const result = matchResult(db, m);
  const resultNl = result === "W" ? "Winst" : result === "L" ? "Verlies" : result === "D" ? "Gelijk" : null;

  const wotmWinners = wotmPlayerIdsOf(m)
    .map((id) => {
      const player = db.players.find((p) => p.id === id);
      if (!player) return null;
      return {
        name: player.full_name,
        shirt: matchdayShirtForPlayer(db, matchId, m.season_id, id),
        isGuest: !!player.is_guest,
        photoUrl: player.photo_url,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  const timeline = buildMatchTimeline(db, matchId);
  const lineup = buildMatchLineupDisplay(db, matchId, m.season_id);
  const startShape = getMatchShapeAtMinute(db, matchId, 0);
  const endShape = getMatchShapeAtMinute(db, matchId, 90);
  const hasFormationSlots = Object.values(startShape.slots).some(Boolean);
  const hasLineup = lineup.starters.length > 0 || lineup.bench.length > 0 || hasFormationSlots;
  const playersById = Object.fromEntries(
    db.players.map((p) => {
      const mem = db.player_season_memberships.find((x) => x.player_id === p.id && x.season_id === m.season_id);
      return [
        p.id,
        {
          player_id: p.id,
          name: p.full_name,
          shirt_number: mem?.shirt_number ?? null,
          photo_url: p.photo_url,
          is_captain: !!mem?.is_captain,
          is_vice_captain: !!mem?.is_vice_captain,
        },
      ];
    }),
  );

  const statusNl =
    m.status === "played"
      ? "Gespeeld"
      : m.status === "scheduled"
        ? "Gepland"
        : m.status === "postponed"
          ? "Uitgesteld"
          : m.status === "cancelled"
            ? "Afgelast"
            : m.status;

  return (
    <div className="space-y-8 md:space-y-10">
      <Link
        href={`/wedstrijden?season=${encodeURIComponent(seasonId)}`}
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-zvv-primary hover:text-zvv-primary-hover"
      >
        ← Alle wedstrijden
      </Link>

      <section className="relative overflow-hidden rounded-2xl border border-zvv-primary/20 bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8] px-5 py-10 text-white shadow-[0_24px_64px_rgba(15,23,42,0.28)] sm:rounded-3xl sm:px-10 sm:py-12 md:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(147,197,253,0.22),transparent_70%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider">
              {matchTypeLabel(m.match_type)} · {statusNl}
            </span>
            {m.status === "played" && result ? (
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
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

          <div className="text-center">
            <p className="text-sm font-medium text-blue-100/85">
              {formatKickoffLongNl(m.kickoff_at)}
              {" · "}
              {m.is_home ? "Thuis" : "Uit"}
              {m.location ? ` · ${m.location}` : ""}
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.6rem,4.5vw,2.8rem)] leading-tight tracking-wide">
              {displayTeamLabel(score.homeTeam)}
              {m.status === "played" ? (
                <span className="mx-3 tabular-nums text-blue-100">
                  {score.homeScore}–{score.awayScore}
                </span>
              ) : (
                <span className="mx-3 text-blue-200/70">—</span>
              )}
              {displayTeamLabel(score.awayTeam)}
            </p>
            <p className="mt-4 text-lg font-semibold text-white md:text-xl">
              <MatchCountdownLabel
                startsAt={m.kickoff_at}
                status={m.status}
                className="text-blue-50"
                secondaryClassName="mt-1 block text-sm font-normal text-blue-100/75"
              />
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 md:gap-8">
            <div className="min-w-0 pb-1 text-center md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/60">
                {m.is_home ? "Zaandijk" : "Tegenstander"}
              </p>
              <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.1rem,3vw,1.8rem)] leading-tight">
                {displayTeamLabel(score.homeTeam)}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline justify-center gap-2 px-1">
              <span className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,12vw,5.5rem)] leading-none tabular-nums">
                {m.status === "played" ? score.homeScore : "—"}
              </span>
              <span className="pb-1 text-2xl text-blue-200/50">:</span>
              <span className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,12vw,5.5rem)] leading-none tabular-nums">
                {m.status === "played" ? score.awayScore : "—"}
              </span>
            </div>
            <div className="min-w-0 pb-1 text-center md:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/60">
                {m.is_home ? "Tegenstander" : "Zaandijk"}
              </p>
              <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.1rem,3vw,1.8rem)] leading-tight">
                {displayTeamLabel(score.awayTeam)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {wotmWinners.length > 0 && m.status === "played" ? <WotmSpotlight winners={wotmWinners} /> : null}

      {hasLineup ? (
        <PublicMatchLineup
          played={m.status === "played"}
          confirmed={m.lineup_status === "confirmed"}
          startSlots={startShape.slots}
          endSlots={endShape.slots}
          playersById={playersById}
          starters={lineup.starters}
          bench={lineup.bench}
        />
      ) : null}

      <section className="rounded-2xl border border-zvv-border bg-white px-5 py-6 shadow-sm md:px-8 md:py-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
          Wedstrijdgebeurtenissen
        </h2>
        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-zvv-muted">Nog geen wedstrijdgebeurtenissen.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {timeline.map((row, i) => (
              <li
                key={`${row.kind}-${row.minute}-${i}`}
                className="flex flex-col gap-2 rounded-xl border border-zvv-border/80 bg-zvv-card-mid/40 px-4 py-3 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex shrink-0 items-baseline gap-2 sm:w-16 sm:justify-end">
                  <span className="font-[family-name:var(--font-display)] text-xl tabular-nums text-zvv-primary">
                    {row.minute}&apos;
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-[15px] font-medium text-zvv-ink">
                  {row.kind === "goal" ? (
                    <>
                      <span className="font-[family-name:var(--font-display)] text-lg tracking-wide">
                        {row.scorerName}
                      </span>
                      {row.assistName ? (
                        <span className="mt-0.5 block text-sm font-normal text-zvv-muted sm:mt-0 sm:inline">
                          {" "}
                          · Assist {row.assistName}
                        </span>
                      ) : null}
                    </>
                  ) : row.kind === "substitution" ? (
                    <span>
                      Wissel: {row.playerOutName} → {row.playerInName}
                    </span>
                  ) : (
                    <span>
                      {row.playerName}
                      <span className="ml-2 text-sm font-normal text-zvv-muted">
                        {row.kind === "yellow_card" ? "Gele kaart" : "Rode kaart"}
                      </span>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
