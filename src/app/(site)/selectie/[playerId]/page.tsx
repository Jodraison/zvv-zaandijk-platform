import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { buildPlayerDetail } from "@/lib/queries/player-detail";
import { Badge } from "@/components/layout/badge";
import { PlayerProfileHero } from "@/components/players/player-profile-hero";
import { PlayerProfilePowerStats } from "@/components/players/player-profile-power-stats";
import {
  PlayerFitnessProModule,
  type FitnessProRow,
} from "@/components/players/player-fitness-pro-module";
import { formatSprintSecondsNl } from "@/lib/import/fitness-time";
import { cn } from "@/lib/utils";
import { formatDateNL, formatKickoffLongNl } from "@/lib/utils/format-date";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import type { PlayerDetailAggregates } from "@/types";

type Props = { params: Promise<{ playerId: string }> };

function buildFitnessProRows(series: PlayerDetailAggregates["fitness_series"]): FitnessProRow[] {
  return series.map((f, i) => {
    const prev = i > 0 ? series[i - 1] : null;
    const delta = prev != null ? Math.round((f.total_time - prev.total_time) * 100) / 100 : null;
    let trend: string | null = null;
    if (delta != null) {
      if (Math.abs(delta) < 0.05) trend = "= gelijk";
      else if (delta < 0) trend = "↑ sneller";
      else trend = "↓ langzamer";
    }
    let trendClass = "text-blue-100/80";
    if (trend?.includes("sneller")) trendClass = "text-emerald-200";
    else if (trend?.includes("langzamer")) trendClass = "text-red-200";
    else if (trend?.includes("gelijk")) trendClass = "text-blue-100/75";

    const deltaFragment =
      delta != null && Math.abs(delta) >= 0.05
        ? `(${delta > 0 ? "+" : ""}${delta.toLocaleString("nl-NL", { maximumFractionDigits: 2 })} s)`
        : null;

    return {
      key: `${f.test_on}-${i}`,
      dateLabel: formatDateNL(f.test_on),
      timeLabel: formatSprintSecondsNl(f.total_time),
      trend,
      deltaFragment,
      trendClass,
    };
  });
}

export default async function PlayerDetailPage({ params }: Props) {
  const { playerId } = await params;
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const player = db.players.find((p) => p.id === playerId);
  if (!player || player.is_guest) notFound();
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) notFound();
  const detail = buildPlayerDetail(db, playerId, seasonId);
  if (!detail) notFound();

  const season = db.seasons.find((s) => s.id === seasonId);
  const fitnessRows = buildFitnessProRows(detail.fitness_series);

  const q = `?season=${encodeURIComponent(seasonId)}`;

  return (
    <div className="space-y-10 md:space-y-12">
      <Link
        href={`/selectie${q}`}
        prefetch
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors duration-200 hover:border-[#1D5FD1]/30 hover:text-[#0F2F5F]"
      >
        <span aria-hidden>←</span> Terug naar selectie
      </Link>

      <PlayerProfileHero
        fullName={player.full_name}
        photoUrl={player.photo_url}
        shirtNumber={mem.shirt_number}
        positionLabel={membershipPositionLabel(mem.display_position, mem.position)}
        seasonName={season?.name ?? "Seizoen"}
        isCaptain={mem.is_captain}
        isViceCaptain={mem.is_vice_captain}
        isGuest={mem.is_guest}
        roleLabel={player.role_label}
        tagline={player.tagline}
      />

      <div className="space-y-8 rounded-2xl border border-white/10 bg-gradient-to-b from-[#050b18] via-[#0a1628] to-[#060d16] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:space-y-10 sm:rounded-3xl sm:p-6 md:space-y-14 md:rounded-[32px] md:p-10 md:px-12">
        <PlayerProfilePowerStats goals={detail.goals_total} assists={detail.assists_total} wotm={detail.wotm_total} />

        <section
          className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.12] p-6 shadow-2xl sm:rounded-3xl sm:p-8 md:p-10"
          aria-labelledby="player-story-heading"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">Profiel</p>
          <h2 id="player-story-heading" className="mt-2 text-3xl font-bold tracking-tight text-white">
            Rol in het team
          </h2>
          {player.bio ? (
            <p className="mt-6 text-xl leading-relaxed text-white/85">{player.bio}</p>
          ) : (
            <p className="mt-6 text-lg leading-relaxed text-white/55">Nog geen verhaal toegevoegd voor deze speler.</p>
          )}
          {(player.preferred_foot || player.strengths || player.card_note) && (
            <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
              {player.preferred_foot ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Voorkeursvoet</p>
                  <p className="mt-2 text-lg font-semibold text-white">{player.preferred_foot}</p>
                </div>
              ) : null}
              {player.strengths ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Sterktes</p>
                  <p className="mt-2 text-lg leading-snug text-white/90">{player.strengths}</p>
                </div>
              ) : null}
              {player.card_note ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Notitie</p>
                  <p className="mt-2 text-lg leading-snug text-white/90">{player.card_note}</p>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <section
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-[#0F2F5F]/80 to-[#1D5FD1]/50 p-6 shadow-xl md:p-8"
            aria-labelledby="training-heading"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl"
              aria-hidden
            />
            <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-sky-200/70">Training</p>
            <h2 id="training-heading" className="relative mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Aanwezigheid
            </h2>
            <div className="relative mt-5 text-base leading-relaxed text-sky-100/90 md:text-[17px]">
              {detail.sessions_considered > 0 ? (
                <>
                  <p>
                    <span className="text-4xl font-bold text-white">{detail.attendance_rate}%</span>
                    <span className="ml-2 text-lg font-semibold text-white/90">aanwezig</span>
                  </p>
                  <p className="mt-3 text-sky-100/85">
                    Over <span className="font-semibold text-white">{detail.sessions_considered}</span> geregistreerde
                    trainingen dit seizoen.
                  </p>
                  <p className="mt-4 text-sm text-sky-100/80">
                    {detail.attendance_present_count} aanwezig · {detail.attendance_absent_count} afwezig
                  </p>
                </>
              ) : (
                <p className="text-white/75">Nog geen trainingssessies of aanwezigheden voor dit seizoen.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg md:p-8" aria-labelledby="fitness-heading">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Performance</p>
            <h2 id="fitness-heading" className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Sprinttotaal (20+40+60m)
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-base">
              Chronologisch overzicht. Een lagere tijd betekent sneller, inclusief trend t.o.v. vorige meting.
            </p>
            <PlayerFitnessProModule rows={fitnessRows} />
          </section>
        </div>
      </div>

      <section
        className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1628] to-[#050b18] shadow-[0_28px_70px_rgba(0,0,0,0.3)]"
        aria-labelledby="matches-heading"
      >
        <div className="border-b border-white/10 bg-white/[0.04] px-6 py-8 md:px-10 md:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">Competitie</p>
          <h2 id="matches-heading" className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Recente wedstrijden
          </h2>
          <p className="mt-3 text-base text-white/65">Laatste optredens in dit seizoen.</p>
        </div>
        <div className="space-y-3 p-5 md:space-y-4 md:p-8">
          {detail.recent_matches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">Nog geen wedstrijden</p>
              <p className="mx-auto mt-2 max-w-md text-base text-white/60">
                In dit seizoen zijn er nog geen gespeelde wedstrijden gekoppeld aan dit profiel.
              </p>
            </div>
          ) : (
            detail.recent_matches.map((m) => (
              <div
                key={m.match_id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-md transition-[border-color,transform] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-white/15 motion-safe:hover:bg-white/[0.08] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-6 md:py-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold tracking-tight text-white md:text-2xl">vs {m.opponent}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {formatKickoffLongNl(m.kickoff_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-sm tabular-nums text-white/70">
                    <span className="font-bold text-white">{m.goals}</span> goals ·{" "}
                    <span className="font-bold text-white">{m.assists}</span> assists
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-bold",
                      m.result === "W" && "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
                      m.result === "L" && "border-red-400/40 bg-red-500/15 text-red-200",
                      m.result === "D" && "border-white/20 bg-white/10 text-white/80",
                    )}
                  >
                    {m.result === "W" ? "W" : m.result === "L" ? "V" : "G"}
                  </span>
                  {m.is_wotm ? (
                    <Badge tone="gold" className="!border-amber-400/50 !bg-amber-500/20 !text-amber-100">
                      WOTM
                    </Badge>
                  ) : null}
                  <Link
                    href={`/wedstrijden/${m.match_id}${q}`}
                    className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300 transition-colors hover:text-white hover:underline"
                  >
                    Wedstrijd →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
