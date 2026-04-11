"use client";

import { useRouter } from "next/navigation";
import { setPreferredSeason } from "@/actions/season";
import { useSeasonStore } from "@/stores/season-store";
import type { Season } from "@/types";
import { cn } from "@/lib/utils";

export function SeasonSwitcher({
  seasons,
  currentSeasonId,
  compact,
}: {
  seasons: Season[];
  currentSeasonId: string;
  compact?: boolean;
}) {
  const router = useRouter();

  async function onChange(id: string) {
    useSeasonStore.getState().setSeasonId(id);
    await setPreferredSeason(id);
    router.refresh();
  }

  if (seasons.length === 0) {
    return (
      <span className={cn("text-xs text-zvv-muted", compact && "text-[10px]")}>Geen seizoen in database</span>
    );
  }

  const value = currentSeasonId && seasons.some((s) => s.id === currentSeasonId) ? currentSeasonId : seasons[0].id;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-1 pl-3 shadow-sm",
        compact && "pl-2",
      )}
    >
      <span className={cn("hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-zvv-muted sm:inline", compact && "hidden")}>
        Seizoen
      </span>
      <select
        className={cn(
          "min-w-0 flex-1 cursor-pointer rounded-lg border-0 bg-transparent py-2 pr-8 text-[13px] font-medium text-zvv-ink outline-none focus:ring-0",
          compact && "py-1.5 text-xs",
        )}
        style={{ backgroundImage: "none" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Seizoen kiezen"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id} className="bg-white text-zvv-ink">
            {s.name}
            {s.is_active ? " · actief" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
