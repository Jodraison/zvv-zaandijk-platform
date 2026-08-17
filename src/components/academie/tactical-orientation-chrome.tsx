"use client";

import { ZVV_CANONICAL, type TacticalOrientationSpec } from "@/lib/academie/tactical-canonical-perspective";
import { cn } from "@/lib/utils";

/** Compact orientation chrome — color is never the only signal. */
export function TacticalOrientationChrome({
  orientation,
  compact = false,
  className,
}: {
  orientation: TacticalOrientationSpec;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-1.5 p-1.5 sm:p-2",
        className,
      )}
      data-testid="tactical-orientation-chrome"
    >
      <div className="flex max-w-[70%] flex-col gap-1">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm sm:text-[10px]",
            compact && "px-1.5 py-0.5 text-[8px]",
          )}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: ZVV_CANONICAL.ourColor }}
            aria-hidden
          />
          <span>{ZVV_CANONICAL.teamLabel}</span>
        </div>
        <div
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-sm sm:text-[10px]",
            compact && "px-1.5 py-0.5 text-[8px]",
          )}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: ZVV_CANONICAL.opponentColor }}
            aria-hidden
          />
          <span>{ZVV_CANONICAL.opponentLabel}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {orientation.showAttackDirection !== false ? (
          <div
            className={cn(
              "rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold tracking-wide text-emerald-100 backdrop-blur-sm sm:text-[10px]",
              compact && "px-1.5 py-0.5 text-[8px]",
            )}
            title="Wij vallen naar rechts aan"
          >
            {ZVV_CANONICAL.attackDirectionLabel}
          </div>
        ) : null}
        <div
          className={cn(
            "rounded-md bg-black/70 px-2 py-1 text-[9px] font-medium text-slate-100 backdrop-blur-sm sm:text-[10px]",
            compact && "px-1.5 py-0.5 text-[8px]",
          )}
        >
          {orientation.phase}
        </div>
        {orientation.activeRole ? (
          <div
            className={cn(
              "rounded-md bg-zvv-primary/90 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-sm sm:text-[10px]",
              compact && "px-1.5 py-0.5 text-[8px]",
            )}
          >
            Jouw rol: {orientation.activeRole}
          </div>
        ) : null}
        {orientation.baseFormationNote ? (
          <div
            className={cn(
              "rounded-md bg-black/50 px-2 py-0.5 text-[8px] font-medium text-slate-300 backdrop-blur-sm sm:text-[9px]",
              compact && "text-[7px]",
            )}
          >
            {orientation.baseFormationNote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
