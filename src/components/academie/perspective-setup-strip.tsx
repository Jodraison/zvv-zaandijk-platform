"use client";

import { ZVV_CANONICAL } from "@/lib/academie/tactical-canonical-perspective";
import { cn } from "@/lib/utils";

/** Perspective strip — full cards on md+, compact one-line on mobile (C-010). */
export function PerspectiveSetupStrip({
  className,
  compactOnMobile = true,
}: {
  className?: string;
  compactOnMobile?: boolean;
}) {
  return (
    <div className={cn(className)} data-testid="perspective-setup-strip">
      {compactOnMobile ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-zvv-ink ring-1 ring-zvv-border/70 sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ZVV_CANONICAL.ourColor }}
              aria-hidden
            />
            WIJ: ZVV · BLAUW
          </span>
          <span className="text-zvv-muted">·</span>
          <span>ROL: RW</span>
          <span className="text-zvv-muted">·</span>
          <span>AANVAL: →</span>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-3",
          compactOnMobile && "hidden sm:grid",
        )}
      >
        <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-zvv-border/70">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: ZVV_CANONICAL.ourColor }}
            aria-hidden
          >
            Z
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">Wij</p>
            <p className="mt-0.5 text-base font-semibold text-zvv-ink">ZVV Zaandijk · Blauw</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-zvv-border/70">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white"
            aria-hidden
          >
            →
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">
              Speelrichting
            </p>
            <p className="mt-0.5 text-base font-semibold text-zvv-ink">Wij vallen aan →</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-zvv-border/70">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zvv-primary text-xs font-bold text-white"
            aria-hidden
          >
            RW
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">Jouw rol</p>
            <p className="mt-0.5 text-base font-semibold text-zvv-ink">Rechtsbuiten · RW</p>
          </div>
        </div>
      </div>
    </div>
  );
}
