"use client";

import { PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { formatWotmNamesNl, wotmHeadingNl } from "@/lib/match/wotm-winners";

export type WotmSpotlightWinner = {
  name: string;
  shirt: number | null;
  isGuest?: boolean;
  photoUrl?: string | null;
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function WinnerPhoto({ winner, compact = false }: { winner: WotmSpotlightWinner; compact?: boolean }) {
  return (
    <div className={compact ? "relative aspect-square w-full min-h-[7.5rem] bg-zvv-card-mid" : "relative aspect-[4/5] w-full min-h-[14rem] max-h-[22rem] bg-zvv-card-mid md:max-h-none md:min-h-[20rem]"}>
      <div className="absolute inset-0 z-0">
        <PhotoOrFallback
          url={winner.photoUrl ?? null}
          alt={winner.name}
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          sizes={compact ? "(max-width: 768px) 45vw, 180px" : "(max-width: 768px) 100vw, 280px"}
          fallback={
            <span className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-amber-600/25 md:text-6xl">
              {initialsOf(winner.name)}
            </span>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}

export function WotmSpotlight({
  winners,
}: {
  winners: WotmSpotlightWinner[];
}) {
  if (winners.length === 0) return null;

  if (winners.length === 1) {
    const winner = winners[0]!;
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-white to-zvv-card-mid p-0 shadow-[0_20px_56px_rgba(180,83,9,0.12)] md:p-0">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-300/15 blur-2xl" aria-hidden />
        <div className="relative grid gap-0 md:grid-cols-[minmax(0,280px)_1fr] md:items-stretch">
          <WinnerPhoto winner={winner} />
          <div className="flex flex-col justify-center px-7 py-8 md:px-10 md:py-12">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-800">Speelster van de wedstrijd</p>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,7vw,4rem)] leading-[0.95] tracking-wide text-zvv-ink">
              {winner.name}
              {winner.isGuest ? <span className="ml-2 text-xl font-normal text-zvv-muted md:text-2xl">(gast)</span> : null}
            </h3>
            <p className="mt-4 text-[15px] font-medium text-zvv-muted">
              {winner.shirt != null ? <>Rugnummer {winner.shirt}</> : <span>Rugnummer volgt</span>}
            </p>
            <div className="mt-8 inline-flex items-center gap-2 self-start rounded-full border border-amber-300/60 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-900 club-mvp-badge-glow">
              <span aria-hidden>⭐</span> MVP
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-white to-zvv-card-mid p-5 shadow-[0_20px_56px_rgba(180,83,9,0.12)] md:p-8"
      data-testid="wotm-shared"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-800">{wotmHeadingNl(winners.length)}</p>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,5vw,3.1rem)] leading-[0.95] tracking-wide text-zvv-ink">
        {formatWotmNamesNl(winners.map((w) => w.name))}
      </h3>
      <ul className="mt-6 flex flex-wrap gap-3">
        {winners.map((winner, index) => (
          <li
            key={`${winner.name}-${winner.shirt ?? "x"}-${index}`}
            className="min-w-[9.5rem] max-w-full flex-1 basis-[9.5rem] overflow-hidden rounded-2xl border border-amber-200/80 bg-white"
          >
            <WinnerPhoto winner={winner} compact />
            <div className="px-3 py-3">
              <p className="font-semibold text-zvv-ink">{winner.name}</p>
              <p className="mt-1 text-xs text-zvv-muted">
                {winner.shirt != null ? `Rugnummer ${winner.shirt}` : "Rugnummer volgt"}
                {winner.isGuest ? " · gast" : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-900 club-mvp-badge-glow">
        <span aria-hidden>⭐</span> MVP
      </div>
    </div>
  );
}
