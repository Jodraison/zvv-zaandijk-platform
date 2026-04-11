"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import type { PlayerSeasonRankingRow } from "@/types";
import { cn } from "@/lib/utils";
import { membershipPositionLabel } from "@/lib/membership-position-label";

// ─── Rank badge ───────────────────────────────────────────────────────────────

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-100 text-amber-700";
  if (rank === 2) return "bg-slate-200 text-slate-600";
  if (rank === 3) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-500";
}

// ─── Row card background — top 3 get a tinted card ───────────────────────────

function rowCardClass(rank: number): string {
  if (rank === 1) return "bg-yellow-50 border border-yellow-200";
  if (rank === 2) return "bg-gray-100 border border-gray-300";
  if (rank === 3) return "bg-orange-50 border border-orange-200";
  return "bg-white border border-transparent shadow-sm";
}

// ─── Single row ───────────────────────────────────────────────────────────────

const RankingRowCard = memo(function RankingRowCard({
  r,
  rank,
  href,
  adminMode,
  disputesHref,
}: {
  r: PlayerSeasonRankingRow;
  rank: number;
  href: string;
  adminMode: boolean;
  disputesHref: string;
}) {
  const posLine = membershipPositionLabel(r.display_position, r.position);
  // "1 Assist" vs "2 Assists" — only Goals uses plural difference worth noting;
  // keeping it simple and matching spec exactly: Goals · Assists · WOTM
  const statsLine = `${r.goals_total} Goals · ${r.assists_total} Assists · ${r.wotm_total} WOTM`;

  return (
    <li className="list-none [contain:layout]">
      <Link
        href={href}
        prefetch
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl px-4 py-3",
          "transition-transform duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary focus-visible:ring-offset-2",
          "motion-safe:hover:-translate-y-px",
          "active:scale-[0.99]",
          rowCardClass(rank),
        )}
      >
        {/* LEFT — badge + player info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Rank badge — identical w/h on every row */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              "text-sm font-bold leading-none tabular-nums",
              rankBadgeClass(rank),
            )}
            aria-hidden
          >
            {rank}
          </div>

          {/* Player info */}
          <div className="flex min-w-0 flex-col leading-tight">
            {/* Name + captain badges on same line */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-base font-semibold text-zvv-ink">
                {r.full_name}
              </span>
              {r.is_captain ? (
                <span className="shrink-0 rounded border border-amber-300/70 bg-amber-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-800">
                  C
                </span>
              ) : null}
              {r.is_vice_captain ? (
                <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  VC
                </span>
              ) : null}
            </div>

            {/* Position / shirt */}
            <span className="truncate text-sm text-gray-500">
              #{r.shirt_number} · {posLine}
            </span>

            {/* Stats — single non-wrapping line */}
            <span className="whitespace-nowrap text-sm text-gray-600 tabular-nums">
              {statsLine}
            </span>
          </div>
        </div>

        {/* RIGHT — CTA */}
        <div className="shrink-0 text-sm font-semibold text-blue-600">
          {adminMode ? (
            // Admin: show disputes link styled as secondary, Profiel as primary
            <span className="flex items-center gap-3">
              <Link
                href={disputesHref}
                prefetch={false}
                onClick={(e) => e.stopPropagation()}
                className="hidden text-xs font-semibold text-slate-400 hover:text-zvv-primary sm:block"
              >
                Disputes
              </Link>
              <span>Profiel →</span>
            </span>
          ) : (
            "Profiel →"
          )}
        </div>
      </Link>
    </li>
  );
});

// ─── Board ────────────────────────────────────────────────────────────────────

export function RankingBoard({
  rows,
  seasonId,
  adminMode = false,
}: {
  rows: PlayerSeasonRankingRow[];
  seasonId: string;
  adminMode?: boolean;
}) {
  const q = useMemo(() => `?season=${encodeURIComponent(seasonId)}`, [seasonId]);

  if (rows.length === 0) {
    return (
      <div className="club-empty-state">
        <p className="text-lg font-semibold text-zvv-ink">Geen speelsters</p>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed">
          Voor dit seizoen zijn nog geen speelsters met lidmaatschap gevonden.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {adminMode ? (
        <div className="mb-6 rounded-2xl border border-zvv-border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Databron</p>
          <p className="mt-2 text-sm text-zvv-ink">
            Goals en assists komen uitsluitend uit geverifieerde `match_goal_events`. WOTM telt uit `matches.wotm_player_id`.
          </p>
          <p className="mt-1 text-xs text-zvv-muted">
            Wedstrijden met integrity-status invalid worden automatisch uitgesloten van ranking.
          </p>
        </div>
      ) : null}

      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zvv-primary">
            Klassement
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
            Speelsters
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tabular-nums text-slate-500">
          {rows.length}
        </span>
      </div>

      {/* List */}
      <ul className="flex flex-col gap-3" role="list">
        {rows.map((r, i) => {
          const rank = i + 1;
          const href = `/selectie/${r.player_id}${q}`;
          const disputesHref = `/beheer/disputes?player=${encodeURIComponent(r.player_id)}&season=${encodeURIComponent(seasonId)}`;
          return (
            <RankingRowCard
              key={r.player_id}
              r={r}
              rank={rank}
              href={href}
              adminMode={adminMode}
              disputesHref={disputesHref}
            />
          );
        })}
      </ul>
    </div>
  );
}
