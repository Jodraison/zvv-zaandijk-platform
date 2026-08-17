"use client";

import { useEffect, useState } from "react";
import {
  getMatchLiveCountdown,
  padLiveUnit,
  type MatchLiveCountdownModel,
  type MatchLiveUnit,
} from "@/lib/match/match-countdown";
import { cn } from "@/lib/utils";

type Variant = "hero";

/**
 * Live seconden-countdown. Server/eerste paint toont een placeholder;
 * na mount telt de client lokaal af naar de doorgegeven kickoff-ISO.
 * Alleen de grote homepage-/next-match variant — geen compacte hero-teaser.
 */
export function MatchLiveCountdown({
  startsAt,
  status,
  durationMinutes,
  variant = "hero",
  slot,
  className,
}: {
  startsAt: string | null | undefined;
  status?: string | null;
  durationMinutes?: number;
  variant?: Variant;
  slot?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date(0));

  useEffect(() => {
    setMounted(true);
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const model = getMatchLiveCountdown({
    startsAt,
    status,
    durationMinutes,
    now: mounted ? now : new Date(0),
  });

  if (!mounted) {
    return (
      <div
        className={cn("min-w-0", className)}
        data-live-countdown={variant}
        data-live-slot={slot}
        data-countdown-pending="true"
        suppressHydrationWarning
      >
        <span className="sr-only">Aftellen naar aftrap…</span>
        <div aria-hidden="true">
          <ClockSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("min-w-0", className)}
      data-live-countdown={variant}
      data-live-slot={slot}
      data-countdown-kind={model.kind}
      data-countdown-seconds={
        model.units.find((u) => u.key === "sec")?.value ?? ""
      }
      role="group"
      aria-label={model.description}
    >
      {model.statusLabel ? (
        <StatusBlock label={model.statusLabel} />
      ) : (
        <ClockBlock model={model} />
      )}
    </div>
  );
}

function StatusBlock({ label }: { label: string }) {
  return (
    <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,3.4rem)] uppercase tracking-[0.16em] text-white">
      {label}
    </p>
  );
}

function ClockBlock({ model }: { model: MatchLiveCountdownModel }) {
  return (
    <div className="min-w-0">
      {model.eyebrow ? (
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/75">
          {model.eyebrow}
        </p>
      ) : null}
      <div
        aria-hidden="true"
        className={cn(
          "grid min-w-0",
          gridClass(model.units.length),
          model.kind === "soon" && "match-live-urgent-pulse motion-safe:animate-[match-live-urgent-pulse_2.4s_ease-in-out_infinite]",
        )}
      >
        {model.units.map((unit) => (
          <UnitCell key={unit.key} unit={unit} />
        ))}
      </div>
    </div>
  );
}

function gridClass(count: number) {
  if (count <= 2) return "mx-auto max-w-xs grid-cols-2 gap-2 sm:gap-3";
  if (count === 3) return "mx-auto max-w-lg grid-cols-3 gap-2 sm:gap-3";
  if (count === 4) return "grid-cols-4 gap-1.5 sm:gap-3";
  return "grid-cols-5 gap-1 sm:gap-2.5";
}

function UnitCell({ unit }: { unit: MatchLiveUnit }) {
  const isSec = unit.key === "sec";
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-white/14 bg-white/[0.07] px-1 py-3 text-center backdrop-blur-sm sm:px-2 sm:py-4 md:py-5">
      <span
        key={isSec ? unit.value : unit.key}
        data-countdown-unit={unit.key}
        className={cn(
          "font-[family-name:var(--font-display)] text-[clamp(1.55rem,5.4vw,3.35rem)] leading-none tracking-wide text-white tabular-nums",
          isSec && "match-live-sec-fade motion-safe:animate-[match-live-sec-fade_0.32s_ease-out]",
        )}
      >
        {padLiveUnit(unit.value)}
      </span>
      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/62 sm:text-[10px]">
        <span className="sm:hidden">{unit.shortLabel}</span>
        <span className="hidden sm:inline">{unit.label}</span>
      </span>
    </div>
  );
}

function ClockSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-5 gap-1 sm:gap-2.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-1 py-3 sm:py-4 md:py-5"
        >
          <span className="font-[family-name:var(--font-display)] text-[clamp(1.55rem,5.4vw,3.35rem)] leading-none text-white/40 tabular-nums">
            ··
          </span>
          <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-blue-100/35">
            —
          </span>
        </div>
      ))}
    </div>
  );
}
