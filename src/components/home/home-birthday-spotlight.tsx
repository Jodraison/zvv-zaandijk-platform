"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PhotoOrFallback, isValidImageUrl } from "@/components/media/photo-with-fallback";
import {
  birthdayCongratsNl,
  birthdayHeadlineNl,
  firstNameFromFullName,
  type BirthdayPerson,
} from "@/lib/players/birthdays";

export type HomeBirthdayPlayer = BirthdayPerson & {
  href: string;
};

type PortraitSize = "hero" | "duo" | "multi";

const PORTRAIT: Record<PortraitSize, string> = {
  hero: "h-[9.5rem] w-[9.5rem] sm:h-[10.5rem] sm:w-[10.5rem] xl:h-[12.5rem] xl:w-[12.5rem]",
  duo: "h-[7rem] w-[7rem] sm:h-[8rem] sm:w-[8rem] xl:h-[9.5rem] xl:w-[9.5rem]",
  multi: "h-[6.5rem] w-[6.5rem] sm:h-[7.25rem] sm:w-[7.25rem]",
};

function PlayerStage({
  player,
  size,
  layout = "stack",
}: {
  player: HomeBirthdayPlayer;
  size: PortraitSize;
  layout?: "stack" | "row";
}) {
  const safePhoto = isValidImageUrl(player.photo_url) ? player.photo_url : null;
  const initials = (player.full_name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const meta = [
    player.shirt_number != null ? `#${player.shirt_number}` : null,
    player.position_label || null,
  ]
    .filter(Boolean)
    .join(" · ");
  const leadership = player.is_captain
    ? "Aanvoerder"
    : player.is_vice_captain
      ? "Vice-aanvoerder"
      : null;

  return (
    <div
      className={cn(
        "flex min-w-0",
        layout === "stack" ? "flex-col items-center text-center" : "flex-row items-center gap-4 text-left",
        size === "multi" && "min-w-[14.5rem] snap-start",
      )}
      data-birthday-player={player.id}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[1.35rem] border-2 border-amber-200/55 bg-gradient-to-br from-amber-200/25 via-[#1e3a8a]/50 to-[#0f172a] shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_18px_40px_rgba(2,6,23,0.45)]",
          "motion-safe:animate-[birthdayPortraitIn_0.9s_cubic-bezier(0.22,1,0.36,1)_both]",
          PORTRAIT[size],
        )}
        data-birthday-portrait
        data-portrait-size={size}
      >
        <div
          className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.35),transparent_65%)] blur-md"
          aria-hidden="true"
        />
        <PhotoOrFallback
          url={safePhoto}
          alt={`Portret van ${player.full_name}`}
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          sizes={size === "hero" ? "200px" : size === "duo" ? "152px" : "116px"}
          fallback={
            <span
              className={cn(
                "font-[family-name:var(--font-display)] tracking-wide text-amber-50",
                size === "hero" ? "text-5xl" : size === "duo" ? "text-4xl" : "text-3xl",
              )}
            >
              {initials}
            </span>
          }
        />
      </div>

      <div className={cn("min-w-0", layout === "stack" ? "mt-4 w-full" : "flex-1")}>
        <p
          className={cn(
            "font-[family-name:var(--font-display)] leading-[1.05] tracking-wide text-white",
            "whitespace-normal break-words",
            size === "hero"
              ? "text-[clamp(1.65rem,2.6vw,2.15rem)]"
              : size === "duo"
                ? "text-[clamp(1.25rem,1.9vw,1.65rem)]"
                : "text-[1.35rem]",
          )}
          data-birthday-fullname
        >
          {player.full_name}
        </p>
        {meta ? (
          <p className="mt-1.5 text-sm font-semibold tracking-wide text-amber-100/90 sm:text-[15px]">{meta}</p>
        ) : null}
        {leadership ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50/75">{leadership}</p>
        ) : null}
        <Link
          href={player.href}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-amber-200/40 hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          Bekijk profiel
        </Link>
      </div>
    </div>
  );
}

/** Volwaardige hero-verjaardagsstage — premium, warm, geen klein zijvakje. */
export function HomeBirthdaySpotlight({
  players,
  className,
  showBuildMarker = false,
}: {
  players: HomeBirthdayPlayer[];
  className?: string;
  showBuildMarker?: boolean;
}) {
  if (players.length === 0) return null;

  const firstNames = players.map((p) => firstNameFromFullName(p.full_name));
  const headline = birthdayHeadlineNl(firstNames);
  const congrats = birthdayCongratsNl(firstNames);
  const sr = `Vandaag ${players.length === 1 ? `is ${players[0]!.full_name}` : `zijn ${players.map((p) => p.full_name).join(" en ")}`} jarig.`;

  return (
    <div
      className={cn(
        "birthday-hero-spotlight relative w-full overflow-hidden rounded-[1.75rem] text-white",
        "border border-amber-200/40",
        "bg-gradient-to-br from-[#1e3a8a]/95 via-[#1d4ed8]/82 to-[#0b1228]/95",
        "shadow-[0_28px_70px_rgba(2,6,23,0.5),0_0_0_1px_rgba(251,191,36,0.12),0_-8px_40px_rgba(251,191,36,0.08)]",
        "backdrop-blur-md",
        "min-h-[300px] p-6 sm:min-h-[340px] sm:p-7 xl:min-h-[400px] xl:w-[min(46vw,620px)] xl:p-8",
        "motion-safe:animate-[birthdayStageIn_0.85s_cubic-bezier(0.22,1,0.36,1)_both]",
        className,
      )}
      aria-labelledby="home-birthday-heading"
      data-testid="birthday-hero-spotlight"
      data-birthday-count={players.length}
    >
      <span className="sr-only">{sr}</span>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-testid="birthday-festive-state">
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:18px_18px]" />
        <span className="absolute right-8 top-7 h-1.5 w-1.5 rounded-full bg-amber-200/90 motion-safe:animate-[birthdaySpark_1.1s_ease-out_both]" />
        <span className="absolute right-16 top-14 h-1 w-1 rounded-full bg-white/70 motion-safe:animate-[birthdaySpark_1.1s_ease-out_0.15s_both]" />
        <span className="absolute bottom-10 right-12 h-1.5 w-1.5 rounded-full bg-amber-100/70 motion-safe:animate-[birthdaySpark_1.1s_ease-out_0.28s_both]" />
        <div className="absolute inset-x-6 top-0 h-10 bg-gradient-to-b from-amber-100/10 to-transparent motion-safe:animate-[birthdaySheen_1s_ease-out_both]" />
        <span className="absolute left-7 top-[4.6rem] h-3 w-2 rotate-12 rounded-sm bg-amber-200/90" data-festive-accent />
        <span className="absolute right-10 top-24 h-2.5 w-2.5 rotate-45 rounded-sm bg-white/85" data-festive-accent />
        <span className="absolute left-12 bottom-16 h-2 w-3 -rotate-12 rounded-sm bg-sky-300/80" data-festive-accent />
        <span className="absolute right-16 bottom-12 h-3 w-2 rotate-6 rounded-sm bg-amber-300/85" data-festive-accent />
      </div>

      <div className="relative z-10 flex h-full min-h-[inherit] flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100/90">Vandaag jarig</p>
        <h2
          id="home-birthday-heading"
          className="mt-3 max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.2vw,2.35rem)] leading-[1.02] tracking-wide"
        >
          {headline}
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-blue-50/92 sm:text-base">{congrats}</p>

        <div className="mt-6 flex flex-1 flex-col justify-end xl:mt-8">
          {players.length === 1 ? (
            <PlayerStage player={players[0]!} size="hero" layout="stack" />
          ) : players.length === 2 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5" data-birthday-duo>
              {players.map((p) => (
                <PlayerStage key={p.id} player={p} size="duo" layout="stack" />
              ))}
            </div>
          ) : (
            <div
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              data-birthday-multi
            >
              {players.map((p) => (
                <PlayerStage key={p.id} player={p} size="multi" layout="stack" />
              ))}
            </div>
          )}
        </div>
        {showBuildMarker ? (
          <p
            data-testid="celebration-fx-marker"
            className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/50"
          >
            FX v2
          </p>
        ) : null}
      </div>
    </div>
  );
}
