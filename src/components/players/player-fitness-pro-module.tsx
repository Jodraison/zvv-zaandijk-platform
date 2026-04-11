"use client";

import { cn } from "@/lib/utils";

export type FitnessProRow = {
  key: string;
  dateLabel: string;
  timeLabel: string;
  trend: string | null;
  deltaFragment: string | null;
  trendClass: string;
};

export function PlayerFitnessProModule({ rows }: { rows: FitnessProRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-base text-white/70">
        Nog geen fitheidstests dit seizoen.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-lg ring-1 ring-white/10 transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)]"
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/8 opacity-70 transition-opacity group-hover:opacity-90"
            aria-hidden
          />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-blue-100/80">{row.dateLabel}</p>
          <p className="relative mt-3 font-mono text-4xl font-bold tabular-nums text-white">{row.timeLabel}</p>
          {row.trend ? (
            <p className={cn("relative mt-3 text-sm font-semibold", row.trendClass)}>
              {row.trend}
              {row.deltaFragment ? (
                <span className="ml-1.5 font-mono text-xs font-normal text-blue-100/85">{row.deltaFragment}</span>
              ) : null}
            </p>
          ) : (
            <p className="relative mt-3 text-sm text-blue-100/75">Eerste meting</p>
          )}
        </div>
      ))}
    </div>
  );
}
