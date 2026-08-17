"use client";

import { useState } from "react";
import { FormationPitch, type PitchOccupant } from "@/components/match/formation-pitch";
import type { FormationSlotCode } from "@/lib/match/formation-4231";
import { cn } from "@/lib/utils";

type LineupRow = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position_label?: string | null;
  is_captain?: boolean;
  is_vice_captain?: boolean;
};

export function PublicMatchLineup({
  played,
  confirmed,
  startSlots,
  endSlots,
  playersById,
  starters,
  bench,
  absent,
  showCompareDefault = false,
}: {
  played: boolean;
  confirmed: boolean;
  startSlots: Record<FormationSlotCode, string | null>;
  endSlots: Record<FormationSlotCode, string | null>;
  playersById: Record<string, PitchOccupant>;
  starters: LineupRow[];
  bench: LineupRow[];
  absent?: LineupRow[];
  showCompareDefault?: boolean;
}) {
  const hasStart = Object.values(startSlots).some(Boolean);
  const hasEnd = Object.values(endSlots).some(Boolean);
  const [mode, setMode] = useState<"start" | "end">("start");
  const [compare, setCompare] = useState(showCompareDefault);

  const title = played
    ? mode === "end"
      ? "Eindopstelling"
      : "Startopstelling"
    : confirmed
      ? "Startopstelling"
      : "Verwachte opstelling";

  const activeSlots = played && mode === "end" && hasEnd ? endSlots : startSlots;

  if (!hasStart && starters.length === 0 && bench.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-zvv-border bg-white px-4 py-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:px-8 md:px-10 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-primary">Opstelling</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] tracking-wide text-zvv-ink">
            {compare ? "Start en eind" : title}
          </h2>
        </div>
        {played && hasStart && hasEnd ? (
          <div className="flex flex-wrap gap-2">
            {!compare ? (
              <>
                <div className="inline-flex rounded-xl border border-zvv-border bg-zvv-card p-1">
                  <button
                    type="button"
                    onClick={() => setMode("start")}
                    className={cn(
                      "min-h-10 rounded-lg px-4 text-sm font-semibold",
                      mode === "start" ? "bg-zvv-primary text-white" : "text-zvv-muted hover:text-zvv-ink",
                    )}
                  >
                    Startopstelling
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("end")}
                    className={cn(
                      "min-h-10 rounded-lg px-4 text-sm font-semibold",
                      mode === "end" ? "bg-zvv-primary text-white" : "text-zvv-muted hover:text-zvv-ink",
                    )}
                  >
                    Eindopstelling
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCompare(true)}
                  className="min-h-10 rounded-xl border border-zvv-border px-4 text-sm font-semibold text-zvv-ink hover:border-zvv-primary/40"
                >
                  Vergelijk start en eind
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCompare(false)}
                className="min-h-10 rounded-xl border border-zvv-border px-4 text-sm font-semibold text-zvv-ink"
              >
                Eén veld tonen
              </button>
            )}
          </div>
        ) : null}
      </div>

      {hasStart ? (
        compare && played && hasEnd ? (
          <div className="space-y-10">
            <FormationPitch slots={startSlots} playersById={playersById} title="Startopstelling" size="hero" />
            <FormationPitch slots={endSlots} playersById={playersById} title="Eindopstelling" size="hero" />
          </div>
        ) : (
          <FormationPitch slots={activeSlots} playersById={playersById} title="" size="hero" />
        )
      ) : null}

      <div className="grid gap-6 border-t border-zvv-border/80 pt-6 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zvv-muted">Bank</h3>
          {bench.length === 0 ? (
            <p className="mt-3 text-sm text-zvv-muted">Geen bankspeelsters vastgelegd.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {bench.map((row) => (
                <li key={row.player_id} className="flex items-center gap-3 text-sm text-zvv-ink">
                  <span className="w-8 shrink-0 font-[family-name:var(--font-display)] text-lg text-zvv-muted">
                    {row.shirt_number ?? "—"}
                  </span>
                  <span className="font-medium">{row.name}</span>
                  {row.is_captain || playersById[row.player_id]?.is_captain ? (
                    <span className="rounded border border-amber-300/70 bg-amber-50 px-1.5 py-px text-[9px] font-bold text-amber-900">
                      C
                    </span>
                  ) : null}
                  {row.is_vice_captain || playersById[row.player_id]?.is_vice_captain ? (
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-px text-[9px] font-bold text-slate-600">
                      VC
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {absent && absent.length > 0 ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zvv-muted">Afwezig</h3>
            <ul className="mt-3 space-y-2">
              {absent.map((row) => (
                <li key={row.player_id} className="flex items-center gap-3 text-sm text-zvv-muted">
                  <span className="w-8 shrink-0 font-[family-name:var(--font-display)] text-lg">
                    {row.shirt_number ?? "—"}
                  </span>
                  <span>{row.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : starters.length > 0 && !hasStart ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zvv-muted">Basis</h3>
            <ul className="mt-3 space-y-2">
              {starters.map((row) => (
                <li key={row.player_id} className="flex items-center gap-3 text-sm text-zvv-ink">
                  <span className="w-8 shrink-0 font-[family-name:var(--font-display)] text-lg text-zvv-primary">
                    {row.shirt_number ?? "—"}
                  </span>
                  <span className="font-medium">{row.name}</span>
                  {row.position_label ? (
                    <span className="text-xs uppercase tracking-wide text-zvv-muted">{row.position_label}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
