"use client";

import Link from "next/link";
import { memo } from "react";
import type { PlayerPosition } from "@/types";
import { cn } from "@/lib/utils";
import { isValidImageUrl, PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import {
  leadershipLabelNl,
  leadershipRoleFromFlags,
} from "@/lib/squad/season-leadership";

const positionTheme: Record<PlayerPosition, { shell: string; glow: string; badge: string }> = {
  GK: {
    shell: "from-emerald-950 via-emerald-800 to-emerald-600",
    glow: "from-emerald-300/20 via-transparent to-transparent",
    badge: "border-emerald-200/60 bg-emerald-200/20 text-emerald-50",
  },
  DEF: {
    shell: "from-sky-950 via-blue-800 to-blue-600",
    glow: "from-sky-300/20 via-transparent to-transparent",
    badge: "border-blue-200/60 bg-blue-200/20 text-blue-50",
  },
  MID: {
    shell: "from-violet-950 via-violet-800 to-indigo-600",
    glow: "from-violet-300/20 via-transparent to-transparent",
    badge: "border-violet-200/60 bg-violet-200/20 text-violet-50",
  },
  ATT: {
    shell: "from-rose-950 via-red-800 to-orange-600",
    glow: "from-rose-300/20 via-transparent to-transparent",
    badge: "border-rose-200/60 bg-rose-200/20 text-rose-50",
  },
};

/**
 * Publieke spelerskaart.
 * Hardcoded FIFA-achtige PAC/SHO/… ratings zijn verwijderd — die waren niet onderhouden
 * en niet uitlegbaar als trainerbeoordeling. Alleen echte seizoensprestaties + positie/rugnummer.
 */
export const PlayerCard = memo(function PlayerCard({
  id,
  name,
  shirt,
  position,
  displayPosition,
  photoUrl,
  goals,
  assists,
  wotm,
  seasonId,
  isCaptain,
  isViceCaptain,
  isSpotlightTop3,
  isRankOne,
  variant = "default",
}: {
  id: string;
  name: string;
  shirt: number;
  position: PlayerPosition;
  roleLabel?: string | null;
  displayPosition: string;
  photoUrl: string | null;
  goals: number;
  assists: number;
  wotm: number;
  seasonId: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isSpotlightTop3?: boolean;
  isRankOne?: boolean;
  variant?: "default" | "homePremium";
}) {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "Speelster";
  const safePhoto = isValidImageUrl(photoUrl) ? photoUrl : null;
  const safeShirt = Number.isFinite(shirt) ? shirt : 0;
  const safeDisplayPosition =
    typeof displayPosition === "string" && displayPosition.trim() ? displayPosition : "—";

  const href = `/selectie/${id}?season=${encodeURIComponent(seasonId)}`;
  const posLine = membershipPositionLabel(safeDisplayPosition, position);
  const leadershipRole = leadershipRoleFromFlags(!!isCaptain, !!isViceCaptain);
  const leadershipNl = leadershipLabelNl(leadershipRole);
  const metaLine = leadershipNl ? `${posLine} · ${leadershipNl}` : posLine;
  const theme = positionTheme[position] ?? positionTheme.MID;
  const initials = safeName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex min-h-0",
        variant === "homePremium" ? "h-full w-full flex-1" : "h-full",
        isRankOne && variant === "homePremium" && "motion-safe:md:[transform:scale(1.01)] motion-safe:md:origin-top",
      )}
    >
      <Link
        href={href}
        prefetch
        className={cn(
          "group relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white via-white to-zvv-card-mid/25 shadow-[0_12px_28px_rgba(15,23,42,0.1)] transition-transform duration-200 will-change-transform motion-safe:hover:-translate-y-0.5",
          variant === "homePremium" ? "h-full flex-1" : "h-full min-h-[26rem]",
          isSpotlightTop3 &&
            variant === "homePremium" &&
            "club-player-card-spotlight ring-2 ring-white/80 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_12px_40px_rgba(29,78,216,0.12)]",
          variant === "homePremium" && isCaptain && "ring-1 ring-amber-300/55",
          variant === "homePremium" && isViceCaptain && !isCaptain && "ring-1 ring-slate-300/70",
          (!isCaptain || variant !== "homePremium") &&
            (!isViceCaptain || variant !== "homePremium") &&
            (!isSpotlightTop3 || variant !== "homePremium") &&
            "ring-1 ring-black/5",
        )}
      >
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden rounded-[inherit] bg-gradient-to-br [clip-path:inset(0_round_inherit)]",
            variant === "homePremium"
              ? "h-[17.5rem] sm:h-[18.5rem] xl:h-[19.5rem]"
              : "aspect-[4/5] sm:min-h-[18rem]",
            theme.shell,
          )}
        >
          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", theme.glow)} />
          <span className="pointer-events-none absolute -bottom-6 -left-2 z-[1] font-[family-name:var(--font-display)] text-[8rem] leading-none tracking-tight text-white/14 md:text-[10rem]">
            {safeShirt}
          </span>
          <div className="absolute inset-0 z-0">
            <PhotoOrFallback
              url={safePhoto}
              alt={safeName}
              className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
              fallback={
                <span className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-white/70 md:text-6xl">
                  {initials}
                </span>
              }
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute right-3 top-3 z-[2] flex min-h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-2xl border-2 border-white/90 bg-white shadow-md">
            <span className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,2.75rem)] leading-none tabular-nums tracking-tight text-zvv-primary">
              {safeShirt}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-[2] p-4">
            <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.2vw,1.78rem)] font-bold uppercase leading-[1.02] tracking-[0.04em] text-white">
              {safeName}
            </h3>
            <p
              className={cn(
                "mt-2 inline-flex w-fit max-w-full truncate rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
                theme.badge,
              )}
            >
              {metaLine}
            </p>
          </div>
          <div className="absolute left-3 top-3 z-[2] flex flex-wrap items-center gap-2">
            {isCaptain ? (
              <span className="rounded-md border border-amber-300/80 bg-gradient-to-b from-amber-300 to-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-950">
                Aanvoerder
              </span>
            ) : null}
            {isViceCaptain ? (
              <span className="rounded-md border border-slate-300/90 bg-gradient-to-b from-slate-200 to-slate-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-900">
                Vice-aanvoerder
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col bg-white px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6",
            variant === "homePremium" && "min-h-[10rem] justify-between",
          )}
        >
          <div className="grid grid-cols-3 gap-2.5 border-t border-zvv-border pt-5 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Doelpunten</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums text-zvv-ink sm:text-2xl">
                {goals}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Assists</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums text-zvv-ink sm:text-2xl">
                {assists}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">MVP</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums text-zvv-mvp sm:text-2xl">
                {wotm}
              </p>
            </div>
          </div>

          <span className="mt-auto border-t border-zvv-border pt-4 text-xs font-bold uppercase tracking-wider text-zvv-primary transition-colors group-hover:text-zvv-primary-hover sm:pt-5">
            Profiel →
          </span>
        </div>
      </Link>
    </div>
  );
});
