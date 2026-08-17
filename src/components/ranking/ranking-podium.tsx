"use client";

import { cn } from "@/lib/utils";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";

export type PodiumEntry = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  positionLabel: string;
  valueLabel: string;
  photo_url?: string | null;
  rank: number;
};

/**
 * Sportpodium: #1 midden hoger, #2 links, #3 rechts — met pedestal-hoogte en motion.
 */
export function RankingPodium({
  entries,
  unitHint,
}: {
  entries: PodiumEntry[];
  unitHint?: string;
}) {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank).slice(0, 3);
  if (sorted.length === 0) return null;

  const byRank = (r: number) => sorted.find((e) => e.rank === r) ?? null;
  const first = byRank(1);
  const second = byRank(2);
  const third = byRank(3);

  type Slot = { entry: PodiumEntry; place: 1 | 2 | 3; desktopOrder: string; pedestal: string; delay: string };
  const slots: Slot[] = (
    [
      {
        entry: second,
        place: 2 as const,
        desktopOrder: "md:order-1",
        pedestal: "h-16 md:h-24 bg-gradient-to-t from-slate-300 to-slate-100",
        delay: "motion-safe:[animation-delay:60ms]",
      },
      {
        entry: first,
        place: 1 as const,
        desktopOrder: "md:order-2",
        pedestal:
          "h-24 md:h-36 bg-gradient-to-t from-amber-400 to-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.35)]",
        delay: "motion-safe:[animation-delay:180ms]",
      },
      {
        entry: third,
        place: 3 as const,
        desktopOrder: "md:order-3",
        pedestal: "h-14 md:h-20 bg-gradient-to-t from-orange-400/90 to-orange-200",
        delay: "motion-safe:[animation-delay:120ms]",
      },
    ] as const
  ).flatMap((s) =>
    s.entry
      ? [
          {
            entry: s.entry,
            place: s.place,
            desktopOrder: s.desktopOrder,
            pedestal: s.pedestal,
            delay: s.delay,
          },
        ]
      : [],
  );

  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] border border-zvv-border bg-gradient-to-b from-zvv-night via-[#132a4a] to-zvv-night p-5 text-white md:p-8"
      data-testid="ranking-podium"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(29,111,234,0.45), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.15), transparent 40%)",
        }}
        aria-hidden
      />
      {unitHint ? <p className="relative mb-5 text-sm text-white/70">{unitHint}</p> : null}
      <ol className="relative flex flex-col items-stretch gap-4 md:flex-row md:items-end md:justify-center md:gap-5">
        {slots.map(({ entry, place, desktopOrder, pedestal, delay }) => {
          const photo = entry.photo_url?.trim() || null;
          const initials = entry.full_name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <li
              key={entry.player_id}
              data-podium-place={place}
              className={cn(
                "flex flex-1 flex-col items-center text-center motion-safe:animate-podium-rise",
                desktopOrder,
                delay,
                place === 1 ? "order-first md:-translate-y-3" : "",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black shadow-lg",
                  place === 1 && "bg-amber-300 text-amber-950 ring-4 ring-amber-200/40",
                  place === 2 && "bg-slate-200 text-slate-800",
                  place === 3 && "bg-orange-300 text-orange-950",
                )}
              >
                {place}
              </span>
              <div
                className={cn(
                  "relative mt-3 overflow-hidden rounded-full border-4 bg-zvv-card-mid shadow-xl",
                  place === 1 ? "h-24 w-24 border-amber-300 md:h-28 md:w-28" : "h-20 w-20 border-white/40",
                )}
              >
                <PhotoOrFallback
                  url={photo}
                  alt={entry.full_name}
                  className="h-full w-full object-cover"
                  fallback={<span className="text-base font-bold text-zvv-muted">{initials}</span>}
                />
              </div>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl leading-tight tracking-wide md:text-2xl">
                {entry.full_name}
              </p>
              <p className="mt-1 text-sm text-white/65">
                #{entry.shirt_number} · {entry.positionLabel}
              </p>
              <p className="mt-2 text-lg font-bold tabular-nums text-amber-200">{entry.valueLabel}</p>
              <div className={cn("mt-4 w-full max-w-[11rem] rounded-t-lg", pedestal)} aria-hidden />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
