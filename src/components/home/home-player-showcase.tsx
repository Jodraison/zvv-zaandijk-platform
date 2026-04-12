"use client";

import Link from "next/link";
import type { PlayerSeasonRankingRow } from "@/types";
import { PlayerCard } from "@/components/players/player-card";

export function HomePlayerShowcase({
  rows,
  seasonId,
}: {
  rows: PlayerSeasonRankingRow[];
  seasonId: string;
}) {
  const spotlightIds = new Set(rows.slice(0, 3).map((r) => r.player_id));
  const rankOneId = rows[0]?.player_id ?? null;
  const showcase = rows.slice(0, 6);
  const q = `?season=${encodeURIComponent(seasonId)}`;

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white via-slate-50/75 to-white px-5 py-7 shadow-[0_14px_44px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:px-6 sm:py-8 md:px-9 md:py-12"
      aria-labelledby="home-selectie-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(37,99,235,0.12),transparent_76%)]" />
      <header className="relative text-center md:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zvv-primary">Onze selectie</p>
        <h2
          id="home-selectie-heading"
          className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.98] tracking-wide text-zvv-ink"
        >
          Topniveau begint hier
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-relaxed text-zvv-muted md:mx-0 md:text-base">
          Kernspelers met impact in goals, assists en MVP. Samen beter, elke speelronde opnieuw.
        </p>
      </header>

      <ul className="relative mt-8 grid list-none grid-cols-1 items-stretch gap-7 md:mt-10 md:grid-cols-2 md:gap-8 xl:mt-12 xl:grid-cols-3 xl:gap-10">
        {showcase.map((row) => (
          <li key={row.player_id} className="flex min-h-0">
            <PlayerCard
              id={row.player_id}
              name={row.full_name}
              shirt={row.shirt_number}
              position={row.position}
              roleLabel={row.role_label}
              displayPosition={row.display_position}
              photoUrl={row.photo_url}
              goals={row.goals_total}
              assists={row.assists_total}
              wotm={row.wotm_total}
              seasonId={seasonId}
              isCaptain={row.is_captain}
              isViceCaptain={row.is_vice_captain}
              isSpotlightTop3={spotlightIds.has(row.player_id)}
              isRankOne={rankOneId != null && row.player_id === rankOneId}
              variant="homePremium"
            />
          </li>
        ))}
      </ul>

      <div className="relative mt-8 text-center md:text-left">
        <Link
          href={`/selectie${q}`}
          prefetch
          className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold uppercase tracking-wide text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline md:justify-start"
        >
          Bekijk volledige selectie →
        </Link>
      </div>
    </section>
  );
}
