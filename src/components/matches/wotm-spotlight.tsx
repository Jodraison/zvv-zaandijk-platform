"use client";

import { PhotoOrFallback } from "@/components/media/photo-with-fallback";

export function WotmSpotlight({
  name,
  shirt,
  isGuest,
  photoUrl,
}: {
  name: string;
  shirt: number | null;
  isGuest?: boolean;
  photoUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-white to-zvv-card-mid p-0 shadow-[0_20px_56px_rgba(180,83,9,0.12)] md:p-0">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-300/15 blur-2xl" aria-hidden />
      <div className="relative grid gap-0 md:grid-cols-[minmax(0,280px)_1fr] md:items-stretch">
        <div className="relative aspect-[4/5] w-full min-h-[14rem] max-h-[22rem] bg-zvv-card-mid md:max-h-none md:min-h-[20rem]">
          <div className="absolute inset-0 z-0">
            <PhotoOrFallback
              url={photoUrl ?? null}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 280px"
              fallback={
                <span className="font-[family-name:var(--font-display)] text-6xl tracking-wide text-amber-600/25 md:text-7xl">{initials}</span>
              }
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>
        <div className="flex flex-col justify-center px-7 py-8 md:px-10 md:py-12">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-800">Player of the match</p>
          <h3 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,7vw,4rem)] leading-[0.95] tracking-wide text-zvv-ink">
            {name}
            {isGuest ? <span className="ml-2 text-xl font-normal text-zvv-muted md:text-2xl">(gast)</span> : null}
          </h3>
          <p className="mt-4 text-[15px] font-medium text-zvv-muted">
            {shirt != null ? <>Rugnummer {shirt}</> : <span>Rugnummer volgt</span>}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 self-start rounded-full border border-amber-300/60 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-900 club-mvp-badge-glow">
            <span aria-hidden>⭐</span> MVP
          </div>
        </div>
      </div>
    </div>
  );
}
