"use client";

import Link from "next/link";
import type { Match } from "@/types";
import { TEAM_DISPLAY_LABEL, TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";
import { formatKickoffLongNl, formatKickoffShortNl } from "@/lib/utils/format-date";

const TAGLINE = "Een team. Een standaard.";

function seasonQuery(seasonId: string) {
  return `?season=${encodeURIComponent(seasonId)}`;
}

/** Alleen context — wedstrijd-actie zit in MatchCountdown (één primaire flow). */
function HomeMatchTeaser({ nextM, seasonId, className }: { nextM: Match | null; seasonId: string; className?: string }) {
  const q = seasonQuery(seasonId);
  if (!nextM) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur-sm md:px-5 md:py-5 ${className ?? ""}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/60">Volgende wedstrijd</p>
        <p className="mt-2 text-[15px] font-medium leading-snug text-white/88">Nog geen wedstrijd gepland.</p>
        <Link
          href={`/wedstrijden${q}`}
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          Naar programma →
        </Link>
      </div>
    );
  }

  const when = formatKickoffShortNl(nextM.kickoff_at);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur-sm md:px-5 md:py-5 ${className ?? ""}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/60">Volgende wedstrijd</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-base font-bold leading-snug tracking-wide text-white md:text-lg">
        {TEAM_DISPLAY_LABEL} <span className="font-medium text-blue-200/75">vs</span> {nextM.opponent}
      </p>
      <p className="mt-1.5 text-sm text-blue-100/80">{when}</p>
      <p className="mt-4 text-xs leading-relaxed text-blue-100/50">
        <a href="#wedstrijd-focus" className="font-semibold text-blue-100/70 underline-offset-4 transition-colors hover:text-white hover:underline">
          Aftelling en detail hieronder ↓
        </a>
      </p>
    </div>
  );
}

export function ClubHomeHero({ seasonId, nextM }: { seasonId: string; nextM: Match | null }) {
  const q = seasonQuery(seasonId);

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8]"
      aria-label="Club"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_18%_12%,rgba(147,197,253,0.28),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_32%,rgba(2,6,23,0.26)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -right-28 top-16 h-72 w-72 rounded-full bg-blue-300/20 blur-[90px]" />

      <div className="relative z-10 mx-auto flex min-h-[min(100dvh,800px)] max-w-[114rem] flex-col px-5 pb-16 pt-[4.5rem] md:px-8 md:pb-20 md:pt-24 xl:grid xl:min-h-[88vh] xl:grid-cols-[1.05fr_0.95fr] xl:items-end xl:gap-12 xl:px-16 xl:pb-24 xl:pt-28">
        <div className="max-w-3xl text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/72 md:text-[11px] md:tracking-[0.32em]">
            ZVV Zaandijk · vrouwen 1
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(3rem,11.5vw,7.2rem)] leading-[0.86] tracking-[0.03em] md:mt-6 md:tracking-[0.05em]">
            {TEAM_DISPLAY_LABEL_UPPER}
          </h1>
          <p className="mt-5 max-w-lg text-[14px] font-semibold uppercase tracking-[0.1em] text-blue-100/90 md:text-[clamp(1rem,1.8vw,1.2rem)] md:tracking-[0.08em]">
            {TAGLINE}
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-blue-100/78 md:text-[15px]">
            Samen strijden. Samen groeien. Alles volgen in één platform.
          </p>

          <div className="mt-12 flex w-full max-w-md flex-col gap-3 sm:max-w-xl">
            <Link
              href={`/selectie${q}`}
              prefetch
              className="club-btn-primary club-btn-hero flex min-h-[52px] w-full items-center justify-center !rounded-2xl bg-white text-zvv-blue-deep shadow-lg transition-transform duration-200 motion-safe:active:scale-[0.99] motion-safe:hover:bg-white/95 motion-safe:hover:text-zvv-primary-hover"
            >
              Bekijk selectie
            </Link>
            <Link
              href={`/wedstrijden${q}`}
              prefetch
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-white/30 bg-white/[0.08] px-6 py-3.5 text-center text-[15px] font-semibold tracking-wide text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/45 hover:bg-white/14"
            >
              Programma en uitslagen
            </Link>
          </div>

          <div className="mt-10 xl:hidden">
            <HomeMatchTeaser nextM={nextM} seasonId={seasonId} />
          </div>
        </div>

        <aside className="mt-14 hidden w-full max-w-lg justify-self-end xl:mt-0 xl:block xl:max-w-md">
          <div className="rounded-2xl border border-blue-200/18 bg-gradient-to-br from-white/12 via-white/6 to-white/4 p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,0.38)] backdrop-blur-md md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/75">Matchday</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.45rem,2.2vw,2rem)] leading-tight tracking-wide">
              {nextM ? `${TEAM_DISPLAY_LABEL} vs ${nextM.opponent}` : `${TEAM_DISPLAY_LABEL} in focus`}
            </p>
            {nextM ? (
              <p className="mt-3 text-sm leading-relaxed text-blue-100/85">
                {formatKickoffLongNl(nextM.kickoff_at)}
              </p>
            ) : (
              <p className="mt-3 text-sm text-blue-100/78">Topniveau begint bij standaard.</p>
            )}
            <p className="mt-5 text-xs leading-relaxed text-blue-100/48">
              <a href="#wedstrijd-focus" className="font-semibold text-blue-100/70 underline-offset-4 transition-colors hover:text-white hover:underline">
                Aftelling en wedstrijddetail hieronder ↓
              </a>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
