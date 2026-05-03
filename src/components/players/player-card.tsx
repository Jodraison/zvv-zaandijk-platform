"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import type { PlayerPosition } from "@/types";
import { cn } from "@/lib/utils";
import { isValidImageUrl, PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { membershipPositionLabel } from "@/lib/membership-position-label";

type CardStats = { pac: number; sho: number; pas: number; dri: number; def: number; phy: number };
type GkCardStats = {
  diving: number;
  handling: number;
  kicking: number;
  reflexes: number;
  speed: number;
  positioning: number;
};
type PlayerCardMeta = {
  overall: number;
  stats: CardStats;
  gkStats?: GkCardStats;
};

const playerCardData: Record<string, PlayerCardMeta> = {
  "mandy kalmeijer": { overall: 87, stats: { pac: 84, sho: 82, pas: 87, dri: 85, def: 83, phy: 86 } },
  "dionne van dijk": { overall: 87, stats: { pac: 86, sho: 84, pas: 86, dri: 87, def: 85, phy: 86 } },
  "melissa rietveld": { overall: 87, stats: { pac: 80, sho: 87, pas: 89, dri: 86, def: 76, phy: 83 } },
  "emma de mie": { overall: 86, stats: { pac: 87, sho: 85, pas: 84, dri: 88, def: 70, phy: 80 } },
  "nienke hoffman": { overall: 86, stats: { pac: 88, sho: 86, pas: 78, dri: 87, def: 65, phy: 78 } },
  "pitou ludding": { overall: 84, stats: { pac: 86, sho: 84, pas: 82, dri: 83, def: 84, phy: 85 } },
  "renee koopman": { overall: 82, stats: { pac: 83, sho: 78, pas: 82, dri: 81, def: 80, phy: 82 } },
  "isa oosterhoorn": { overall: 83, stats: { pac: 84, sho: 80, pas: 83, dri: 82, def: 85, phy: 83 } },
  "marisha prins": { overall: 83, stats: { pac: 85, sho: 72, pas: 75, dri: 77, def: 84, phy: 86 } },
  "yente oud": { overall: 85, stats: { pac: 82, sho: 75, pas: 83, dri: 78, def: 88, phy: 84 } },
  "anouk aafjes": { overall: 84, stats: { pac: 80, sho: 83, pas: 85, dri: 79, def: 87, phy: 84 } },
  "tess luijting": { overall: 84, stats: { pac: 76, sho: 82, pas: 84, dri: 80, def: 86, phy: 85 } },
  "shura nieboer": { overall: 83, stats: { pac: 88, sho: 84, pas: 78, dri: 85, def: 74, phy: 84 } },
  "andrada timmer": { overall: 84, stats: { pac: 86, sho: 82, pas: 78, dri: 83, def: 78, phy: 82 } },
  "melissa donkers": { overall: 80, stats: { pac: 82, sho: 72, pas: 76, dri: 75, def: 82, phy: 80 } },
  "maura hoffman": { overall: 79, stats: { pac: 80, sho: 70, pas: 74, dri: 73, def: 82, phy: 78 } },
  "mariska oosterhuis": { overall: 80, stats: { pac: 75, sho: 84, pas: 80, dri: 78, def: 83, phy: 84 } },
  "kyra de bakker": { overall: 75, stats: { pac: 78, sho: 70, pas: 72, dri: 71, def: 75, phy: 77 } },
  "lorelai bakker": { overall: 76, stats: { pac: 78, sho: 72, pas: 74, dri: 73, def: 78, phy: 76 } },
  "danique van heeringen": { overall: 74, stats: { pac: 76, sho: 70, pas: 74, dri: 72, def: 70, phy: 75 } },
  "demi luijting": { overall: 76, stats: { pac: 79, sho: 78, pas: 76, dri: 75, def: 74, phy: 77 } },
  "jelisa de jonge": {
    overall: 84,
    gkStats: { diving: 85, handling: 85, kicking: 88, reflexes: 82, speed: 45, positioning: 88 },
    stats: { pac: 45, sho: 88, pas: 80, dri: 60, def: 88, phy: 75 },
  },
};

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

function ratingCircleClass(value: number): string {
  if (value >= 85) return "bg-blue-100 text-blue-700";
  if (value >= 75) return "bg-slate-100 text-slate-700";
  return "bg-gray-100 text-gray-500";
}

function normalizePlayerName(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function hasAnyFiniteFieldStats(stats: CardStats | null | undefined): boolean {
  if (!stats) return false;
  return (["pac", "sho", "pas", "dri", "def", "phy"] as const).some(
    (k) => typeof stats[k] === "number" && Number.isFinite(stats[k]),
  );
}

function hasAnyFiniteGkStats(gk: GkCardStats | null | undefined): boolean {
  if (!gk) return false;
  return (["diving", "handling", "kicking", "reflexes", "speed", "positioning"] as const).some(
    (k) => typeof gk[k] === "number" && Number.isFinite(gk[k]),
  );
}

function getPlayerCardMeta(full_name: string): PlayerCardMeta | null {
  const normalized = normalizePlayerName(full_name);
  const meta = playerCardData[normalized] ?? null;
  console.log("MATCH CHECK:", {
    input: full_name,
    normalized,
    found: !!meta,
  });
  return meta;
}

function formatCardStatValue(v: number | null | undefined): number | string {
  return typeof v === "number" && Number.isFinite(v) ? v : "—";
}


export const PlayerCard = memo(function PlayerCard({
  id,
  name,
  shirt,
  position,
  roleLabel,
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

  const fifa = useMemo(() => getPlayerCardMeta(safeName), [safeName]);
  const overall = fifa?.overall ?? null;
  const trimmedRoleLabel = typeof roleLabel === "string" ? roleLabel.trim() : "";
  const isGoalkeeper = trimmedRoleLabel === "GK" || (!trimmedRoleLabel && position === "GK");
  const useGkStatColumns = Boolean(fifa && isGoalkeeper && hasAnyFiniteGkStats(fifa.gkStats));
  const showCardStatGrid =
    fifa != null &&
    variant !== "homePremium" &&
    (useGkStatColumns || hasAnyFiniteFieldStats(fifa.stats));

  const href = `/selectie/${id}?season=${encodeURIComponent(seasonId)}`;
  const posLine = membershipPositionLabel(safeDisplayPosition, position);
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
          variant === "homePremium" ? "h-full flex-1" : "h-full min-h-[28rem]",
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
              : "aspect-[4/5] sm:min-h-[20rem]",
            theme.shell,
          )}
        >
          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", theme.glow)} />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.08] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0%,transparent_60%)]" />
          <span className="pointer-events-none absolute -bottom-6 -left-2 z-[1] font-[family-name:var(--font-display)] text-[8rem] leading-none tracking-tight text-white/14 md:text-[10rem]">
            {safeShirt}
          </span>
          <div className="absolute inset-0 z-0">
            <PhotoOrFallback
              url={safePhoto}
              alt={safeName}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
              fallback={
                <span className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-white/70 md:text-6xl">{initials}</span>
              }
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute right-3 top-3 z-[2] flex min-h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-2xl border-2 border-white/90 bg-white shadow-md">
            <span className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,2.75rem)] leading-none tabular-nums tracking-tight text-zvv-primary">
              {safeShirt}
            </span>
          </div>
          {overall != null ? (
            <div
              className={cn(
                "absolute left-[10px] top-[10px] z-[2] flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                ratingCircleClass(overall),
              )}
              aria-label={`Rating ${overall}`}
            >
              {overall}
            </div>
          ) : null}

          <div className="absolute bottom-0 left-0 right-0 z-[2] p-4">
            <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.2vw,1.78rem)] font-bold uppercase leading-[1.02] tracking-[0.04em] text-white">
              {safeName}
            </h3>
            <p className={cn("mt-2 inline-flex w-fit rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em]", theme.badge)}>
              {posLine}
            </p>
          </div>
          <div className={cn("absolute left-3 z-[2] flex flex-wrap items-center gap-2", variant === "homePremium" || overall != null ? "top-14" : "top-3")}>
            {isCaptain ? (
              <span className="rounded-md border border-amber-300/80 bg-gradient-to-b from-amber-300 to-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-950 shadow-[0_3px_8px_rgba(251,191,36,0.3)]">
                Captain
              </span>
            ) : null}
            {isViceCaptain ? (
              <span className="rounded-md border border-slate-300/90 bg-gradient-to-b from-slate-200 to-slate-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 shadow-[0_3px_8px_rgba(51,65,85,0.22)]">
                Vice
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col bg-white px-5 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-6 sm:pb-6 sm:pt-6",
            variant === "homePremium" && "min-h-[11.5rem] justify-between",
          )}
        >
          <div className="grid grid-cols-3 gap-2.5 border-t border-zvv-border pt-5 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Goals</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums tracking-wide text-zvv-ink sm:text-2xl">{goals}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Assists</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums tracking-wide text-zvv-ink sm:text-2xl">{assists}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">MVP</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums tracking-wide text-zvv-mvp sm:text-2xl">{wotm}</p>
            </div>
          </div>
          {showCardStatGrid && fifa ? (
            <div className="stats mt-3 border-t border-white/10 pt-2.5 opacity-90">
              <div className="grid grid-cols-6 gap-1.5 text-center">
                {(useGkStatColumns
                  ? [
                      { k: "DIV", v: fifa.gkStats?.diving },
                      { k: "HAN", v: fifa.gkStats?.handling },
                      { k: "KIC", v: fifa.gkStats?.kicking },
                      { k: "REF", v: fifa.gkStats?.reflexes },
                      { k: "SPD", v: fifa.gkStats?.speed },
                      { k: "POS", v: fifa.gkStats?.positioning },
                    ]
                  : [
                      { k: "PAC", v: fifa.stats.pac },
                      { k: "SHO", v: fifa.stats.sho },
                      { k: "PAS", v: fifa.stats.pas },
                      { k: "DRI", v: fifa.stats.dri },
                      { k: "DEF", v: fifa.stats.def },
                      { k: "PHY", v: fifa.stats.phy },
                    ]
                ).map((s) => (
                  <div key={s.k} className="flex flex-col items-center">
                    <p className="text-[9px] tracking-[1px] text-zvv-muted/70">{s.k}</p>
                    <p className="text-[15px] font-extrabold text-zvv-ink">{formatCardStatValue(s.v)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <span className="mt-auto border-t border-zvv-border pt-4 text-xs font-bold uppercase tracking-wider text-zvv-primary transition-colors group-hover:text-zvv-primary-hover sm:pt-5">
            Profiel →
          </span>
        </div>
      </Link>
    </div>
  );
});
