"use client";

import Link from "next/link";
import type { PlayerSeasonRankingRow } from "@/types";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import { cn } from "@/lib/utils";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";

function pickTop(rows: PlayerSeasonRankingRow[], score: (r: PlayerSeasonRankingRow) => number): PlayerSeasonRankingRow | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const d = score(b) - score(a);
    if (d !== 0) return d;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });
  const best = sorted[0];
  return score(best) > 0 ? best : null;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StandoutPlinth({
  row,
  seasonId,
  label,
  value,
  tier,
}: {
  row: PlayerSeasonRankingRow;
  seasonId: string;
  label: string;
  value: number;
  tier: "center" | "side";
}) {
  const q = `?season=${encodeURIComponent(seasonId)}`;
  const href = `/selectie/${row.player_id}${q}`;
  const pos = membershipPositionLabel(row.display_position, row.position);
  const ini = initialsOf(row.full_name);

  return (
    <div className={cn("flex h-full flex-col items-stretch", tier === "center" ? "z-[2] md:-mt-6" : "z-[1]")}>
      <Link
        href={href}
        prefetch
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-zvv-card text-zvv-ink shadow-[var(--shadow-zvv-card)] transition-[transform,box-shadow,border-color] duration-300 motion-safe:hover:-translate-y-0.5",
          tier === "center"
            ? "border-zvv-primary/40 shadow-[0_20px_50px_rgba(29,78,216,0.18)] ring-2 ring-zvv-primary/15 motion-safe:hover:shadow-[0_28px_60px_rgba(29,78,216,0.22)]"
            : "border-zvv-border motion-safe:hover:border-zvv-primary/25 motion-safe:hover:shadow-[var(--shadow-zvv-card-hover)]",
        )}
      >
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden bg-zvv-night",
            tier === "center" ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[5/6] sm:aspect-[4/5]",
          )}
        >
          <PhotoOrFallback
            url={row.photo_url}
            alt={row.full_name}
            className="h-full w-full object-cover object-top transition-transform duration-200 motion-safe:group-hover:scale-[1.01]"
            sizes={tier === "center" ? "(max-width:768px) 100vw, 400px" : "(max-width:768px) 50vw, 280px"}
            fallback={
              <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-5xl text-white/40 md:text-6xl">
                {ini}
              </span>
            }
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zvv-night via-zvv-night/40 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            <span className="rounded-lg border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {label}
            </span>
            <span
              className={cn(
                "font-[family-name:var(--font-display)] leading-none tabular-nums text-white drop-shadow-md",
                tier === "center" ? "text-[clamp(3rem,10vw,4.5rem)]" : "text-[clamp(2.25rem,7vw,3.25rem)]",
              )}
            >
              {value}
            </span>
          </div>
        </div>
        <div className={cn("flex flex-1 flex-col p-5", tier === "center" && "md:p-7")}>
          <h3
            className={cn(
              "font-[family-name:var(--font-display)] leading-[1.02] tracking-wide text-zvv-ink",
              tier === "center" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
            )}
          >
            {row.full_name}
          </h3>
          <p className="mt-2 text-sm font-medium text-zvv-muted">
            #{row.shirt_number} · {pos}
          </p>
          <span className="mt-auto pt-3 text-xs font-bold uppercase tracking-wider text-zvv-primary transition-colors group-hover:text-zvv-primary-hover">
            Profiel →
          </span>
        </div>
      </Link>
    </div>
  );
}

export function SeasonStandoutsPodium({ ranking, seasonId }: { ranking: PlayerSeasonRankingRow[]; seasonId: string }) {
  const goals = pickTop(ranking, (r) => r.goals_total);
  const assists = pickTop(ranking, (r) => r.assists_total);
  const mvp = pickTop(ranking, (r) => r.wotm_total);
  const any = goals || assists || mvp;

  if (!any) return null;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-24 bg-gradient-to-t from-zvv-deep/80 to-transparent md:h-32" aria-hidden />
      {/* Mobile: center (goals) first */}
      <div className="flex flex-col gap-8 md:hidden">
        {goals ? <StandoutPlinth row={goals} seasonId={seasonId} label="Topscorer" value={goals.goals_total} tier="center" /> : null}
        <div className="grid grid-cols-2 gap-5 items-stretch">
          {assists ? (
            <StandoutPlinth row={assists} seasonId={seasonId} label="Meeste assists" value={assists.assists_total} tier="side" />
          ) : null}
          {mvp ? <StandoutPlinth row={mvp} seasonId={seasonId} label="MVP" value={mvp.wotm_total} tier="side" /> : null}
        </div>
      </div>
      {/* Desktop podium: assist | topscorer | MVP */}
      <div className="hidden items-end gap-5 pb-2 md:grid md:grid-cols-12 md:gap-7">
        {assists ? (
          <div className="col-span-3 flex min-h-[420px] items-end">
            <StandoutPlinth row={assists} seasonId={seasonId} label="Meeste assists" value={assists.assists_total} tier="side" />
          </div>
        ) : null}
        {goals ? (
          <div className="col-span-6 flex min-h-[480px] items-end">
            <StandoutPlinth row={goals} seasonId={seasonId} label="Topscorer" value={goals.goals_total} tier="center" />
          </div>
        ) : null}
        {mvp ? (
          <div className="col-span-3 flex min-h-[420px] items-end">
            <StandoutPlinth row={mvp} seasonId={seasonId} label="MVP" value={mvp.wotm_total} tier="side" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
