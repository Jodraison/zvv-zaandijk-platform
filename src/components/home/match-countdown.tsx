"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";
import { formatHumanDateNL, formatTimeNl } from "@/lib/utils/format-date";
import { MatchLiveCountdown } from "@/components/match/match-live-countdown";
import { matchTypeLabel } from "@/lib/match-type";
import type { MatchType } from "@/types";

export function MatchCountdown({
  kickoffIso,
  opponent,
  isHome,
  matchId,
  seasonId,
  status = "scheduled",
  matchType,
}: {
  kickoffIso: string;
  opponent: string;
  isHome: boolean;
  matchId: string;
  seasonId: string;
  status?: string;
  matchType?: MatchType;
}) {
  const dateLabel = useMemo(() => formatHumanDateNL(kickoffIso, { includeYear: true }), [kickoffIso]);
  const timeLabel = useMemo(() => formatTimeNl(kickoffIso), [kickoffIso]);
  const detailHref = `/wedstrijden/${matchId}?season=${encodeURIComponent(seasonId)}`;
  const homeName = TEAM_DISPLAY_LABEL;

  return (
    <section
      id="wedstrijd-focus"
      className="scroll-mt-28 relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#153ea8] text-white shadow-[0_20px_48px_rgba(15,23,42,0.28)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(147,197,253,0.2),transparent_72%)]" />
      <div className="relative flex flex-col gap-3 border-b border-white/12 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-8 md:px-10 md:py-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/85">VOLGENDE WEDSTRIJD</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-xl border border-white/22 bg-white/14 px-3.5 py-2 text-[11px] font-bold text-white">Gepland</span>
          <span className="rounded-xl border border-white/22 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase text-white/90">
            {isHome ? "Thuis" : "Uit"}
          </span>
          {matchType ? (
            <span className="rounded-xl border border-white/22 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase text-white/90">
              {matchTypeLabel(matchType)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="text-center">
          <p className="break-words font-[family-name:var(--font-display)] text-[clamp(1.7rem,5vw,3rem)] leading-[0.98] tracking-[0.03em] text-white">
            {opponent}
          </p>
          <p className="mt-2 text-sm font-semibold text-blue-100/80">
            {homeName} {isHome ? "thuis" : "uit"}
          </p>
          <p className="mt-3 text-sm font-semibold capitalize text-blue-100/90">{dateLabel}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{timeLabel}</p>
          <div className="mx-auto mt-8 max-w-3xl">
            <MatchLiveCountdown
              startsAt={kickoffIso}
              status={status}
              variant="hero"
              slot="next-match"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/12 bg-black/15 px-5 py-5 sm:px-8 md:px-10 md:py-6">
        <Link
          href={detailHref}
          prefetch
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-white text-center text-[15px] font-bold tracking-wide text-[#0b1f5f] shadow-md transition-colors hover:bg-blue-50"
        >
          Naar wedstrijddetail
        </Link>
      </div>
    </section>
  );
}
