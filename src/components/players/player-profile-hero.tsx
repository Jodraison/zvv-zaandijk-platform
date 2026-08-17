"use client";

import type { ReactNode } from "react";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { cn } from "@/lib/utils";

function MetaTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PlayerProfileHero({
  fullName,
  photoUrl,
  shirtNumber,
  positionLabel,
  seasonName,
  isCaptain,
  isViceCaptain,
  isGuest,
  roleLabel,
  tagline,
}: {
  fullName: string;
  photoUrl: string | null;
  shirtNumber: number;
  positionLabel: string;
  seasonName: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isGuest: boolean;
  roleLabel?: string | null;
  tagline?: string | null;
}) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0F2F5F] via-[#1D5FD1] to-sky-500 shadow-[0_20px_50px_rgba(29,95,209,0.28)] md:rounded-[2rem]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.85)_0.7px,transparent_0.7px)] [background-size:4px_4px]"
        aria-hidden
      />
      <div className="relative z-[1] grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,18rem)_1fr] md:items-end md:gap-10 md:p-10">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-2xl border-4 border-white/90 bg-sky-900/40 shadow-xl">
          <PhotoOrFallback
            url={photoUrl}
            alt={fullName}
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            sizes="288px"
            priority
            fallback={
              <span className="font-[family-name:var(--font-display)] text-7xl font-black tracking-tight text-white/70">
                {initials}
              </span>
            }
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-xl bg-white px-3 py-1 font-[family-name:var(--font-display)] text-3xl tabular-nums text-zvv-primary">
            #{shirtNumber}
          </span>
        </div>

        <div className="min-w-0 space-y-4 text-white md:pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">{seasonName}</p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] tracking-[0.02em]">
            {fullName}
          </h1>
          <div className="flex flex-wrap gap-2">
            <MetaTag>{positionLabel}</MetaTag>
            <MetaTag>{TEAM_DISPLAY_LABEL}</MetaTag>
            {isCaptain ? <MetaTag className="border-amber-200/50 bg-amber-300/25">Aanvoerder</MetaTag> : null}
            {isViceCaptain ? <MetaTag className="border-slate-200/50 bg-slate-200/20">Vice-aanvoerder</MetaTag> : null}
            {isGuest ? <MetaTag>Gast</MetaTag> : null}
          </div>
          {roleLabel || tagline ? (
            <p className="max-w-xl text-base leading-relaxed text-sky-50/95 md:text-lg">
              {[roleLabel, tagline].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
