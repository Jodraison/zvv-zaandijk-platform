"use client";

import type { ReactNode } from "react";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { cn } from "@/lib/utils";

function MetaTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base",
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
    <section className="relative min-h-[480px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0A192F] via-[#0F2F5F] to-[#1D5FD1] shadow-[0_28px_80px_rgba(10,25,47,0.45)] ring-1 ring-white/10">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:40px_40px]"
        aria-hidden
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_45%,rgba(0,0,0,0.5)_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.35)]" aria-hidden />

      {/* Jersey watermark */}
      <span
        className="pointer-events-none absolute right-4 top-0 z-0 select-none font-[family-name:var(--font-display)] text-[120px] font-black leading-none text-white opacity-[0.05] sm:text-[180px] md:text-[220px] lg:text-[260px]"
        aria-hidden
      >
        {shirtNumber}
      </span>

      <div className="relative z-[1] flex min-h-[480px] flex-col md:flex-row">
        {/* Left: photo + design layer */}
        <div className="relative w-full shrink-0 md:w-[min(100%,22rem)] lg:w-[min(100%,26rem)]">
          <div className="relative aspect-[4/5] min-h-[280px] w-full overflow-hidden md:aspect-auto md:min-h-[480px]">
            {/* Giant initials — design anchor */}
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-[family-name:var(--font-display)] text-[clamp(6rem,28vw,11rem)] font-black leading-none text-white/[0.07]"
              aria-hidden
            >
              {initials}
            </span>

            <PhotoOrFallback
              url={photoUrl}
              alt={fullName}
              className="relative z-[1] object-cover object-top"
              sizes="(max-width: 768px) 100vw, 360px"
              priority
              fallback={
                <span className="font-[family-name:var(--font-display)] text-7xl font-black tracking-tight text-white/50 sm:text-8xl">
                  {initials}
                </span>
              }
            />
            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#0A192F]/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-[#0A192F]/20 md:to-[#0A192F]/85" />
            <div
              className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)]"
              aria-hidden
            />
          </div>
        </div>

        {/* Right: identity */}
        <div className="relative z-[3] flex flex-1 flex-col justify-center px-5 pb-12 pt-10 md:px-10 md:pb-14 md:pt-12 lg:px-14 lg:py-14">
          {/* Radial spotlight behind name */}
          <div
            className="pointer-events-none absolute left-1/2 top-[28%] z-0 h-[min(100%,420px)] w-[min(140%,900px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14)_0%,transparent_68%)]"
            aria-hidden
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">{seasonName}</p>

            <h1 className="mt-3 max-w-[95vw] font-[family-name:var(--font-display)] text-[clamp(2.75rem,11vw,5.25rem)] font-black leading-[0.88] tracking-tight text-white sm:text-[clamp(3rem,8vw,4rem)] md:text-7xl lg:text-8xl">
              {fullName}
            </h1>

            {tagline ? (
              <p className="mt-4 max-w-2xl text-lg font-medium leading-snug text-sky-100/90 md:text-xl">{tagline}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <MetaTag>{positionLabel}</MetaTag>
              <MetaTag>{TEAM_DISPLAY_LABEL}</MetaTag>
              <MetaTag>#{shirtNumber}</MetaTag>
              {roleLabel ? <MetaTag className="border-white/15 bg-white/[0.07]">{roleLabel}</MetaTag> : null}
              {isCaptain ? (
                <MetaTag className="border-amber-400/35 bg-amber-500/15 text-amber-50">Aanvoerder</MetaTag>
              ) : null}
              {isViceCaptain ? (
                <MetaTag className="border-white/20 bg-white/[0.08]">Vice-aanvoerder</MetaTag>
              ) : null}
              {isGuest ? <MetaTag className="border-sky-300/30 bg-sky-400/15 text-sky-50">Gast</MetaTag> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
