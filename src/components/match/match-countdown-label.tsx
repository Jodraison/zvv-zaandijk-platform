"use client";

import { useEffect, useState } from "react";
import {
  getMatchCountdownState,
  matchCountdownRefreshIntervalMs,
  type MatchCountdownState,
} from "@/lib/match/match-countdown";

/**
 * Hydration-safe wedstrijd-countdown. Server toont stabiele placeholder;
 * client actualiseert na mount (geen seconden, reduced-motion vriendelijk).
 */
export function MatchCountdownLabel({
  startsAt,
  status,
  durationMinutes,
  className,
  secondaryClassName,
  showSecondary = true,
}: {
  startsAt: string | null | undefined;
  status?: string | null;
  durationMinutes?: number;
  className?: string;
  secondaryClassName?: string;
  showSecondary?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<MatchCountdownState>(() =>
    getMatchCountdownState({
      startsAt,
      status,
      durationMinutes,
      now: new Date(0),
    }),
  );

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setResult(
        getMatchCountdownState({
          startsAt,
          status,
          durationMinutes,
          now: new Date(),
        }),
      );
    };
    tick();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = matchCountdownRefreshIntervalMs(startsAt, new Date());
    if (intervalMs == null || reduceMotion) return;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [startsAt, status, durationMinutes]);

  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        …
      </span>
    );
  }

  return (
    <span className={className}>
      {result.primaryLabel}
      {showSecondary && result.secondaryLabel ? (
        <span className={secondaryClassName ?? "mt-0.5 block text-sm font-normal opacity-80"}>
          {result.secondaryLabel}
        </span>
      ) : null}
    </span>
  );
}
