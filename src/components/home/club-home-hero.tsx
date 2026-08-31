"use client";

import Link from "next/link";
import type { Match } from "@/types";
import { TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";
import {
  HomeBirthdaySpotlight,
  type HomeBirthdayPlayer,
} from "@/components/home/home-birthday-spotlight";
import { HomeTeamSpotlight } from "@/components/home/home-team-spotlight";
import type { HomeTeamSpotlightModel } from "@/lib/home/team-spotlight";
import { cn } from "@/lib/utils";

const TAGLINE = "Een team. Een standaard.";

function seasonQuery(seasonId: string) {
  return `?season=${encodeURIComponent(seasonId)}`;
}

export function ClubHomeHero({
  seasonId,
  nextM,
  birthdayPlayers = [],
  teamSpotlight,
  showBuildMarker = false,
}: {
  seasonId: string;
  nextM: Match | null;
  birthdayPlayers?: HomeBirthdayPlayer[];
  teamSpotlight: HomeTeamSpotlightModel;
  showBuildMarker?: boolean;
}) {
  const q = seasonQuery(seasonId);
  const hasBirthday = birthdayPlayers.length > 0;

  const spotlight = hasBirthday ? (
    <HomeBirthdaySpotlight players={birthdayPlayers} showBuildMarker={showBuildMarker} />
  ) : (
    <HomeTeamSpotlight model={teamSpotlight} />
  );

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8]"
      aria-label="Club"
      data-hero-birthday={hasBirthday ? "true" : "false"}
      data-hero-spotlight={hasBirthday ? "birthday" : "team"}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_18%_12%,rgba(147,197,253,0.28),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_32%,rgba(2,6,23,0.26)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -right-28 top-16 h-72 w-72 rounded-full bg-blue-300/20 blur-[90px]" />
      {hasBirthday ? (
        <div
          className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-amber-300/15 blur-[100px]"
          aria-hidden="true"
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-[min(100dvh,800px)] max-w-[114rem] flex-col px-5 pb-16 pt-[4.5rem] md:px-8 md:pb-20 md:pt-24 xl:min-h-[88vh] xl:items-end xl:gap-10 xl:px-16 xl:pb-24 xl:pt-28",
          "xl:grid xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,0.95fr)]",
        )}
      >
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

          <div className="mt-10 xl:hidden">{spotlight}</div>
        </div>

        <aside className="mt-14 hidden w-full max-w-none justify-self-end translate-y-[-8px] xl:mt-0 xl:block xl:max-w-[min(46vw,620px)]">
          <div className="space-y-3">
            {spotlight}
            {hasBirthday && nextM ? (
              <p className="px-1 text-xs leading-relaxed text-blue-100/55">
                <a
                  href="#wedstrijd-focus"
                  className="font-semibold text-blue-100/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Wedstrijddetail hieronder ↓
                </a>
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
