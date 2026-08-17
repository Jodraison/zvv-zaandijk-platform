"use client";

import { useEffect, useState } from "react";
import {
  computeCountdown,
  countdownRefreshIntervalMs,
  type CountdownResult,
} from "@/lib/operations/countdown";

/**
 * Hydration-safe countdown label. Server renders a stable placeholder;
 * client updates after mount with adaptive interval.
 */
export function OperationsCountdownLabel({
  targetIso,
  durationMs,
  expectedLabel,
  className,
}: {
  targetIso: string | null;
  durationMs?: number;
  expectedLabel?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<CountdownResult>(() =>
    computeCountdown(targetIso, new Date(0), { durationMs, expectedLabel }),
  );

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      setResult(computeCountdown(targetIso, now, { durationMs, expectedLabel }));
    };
    tick();
    const intervalMs = countdownRefreshIntervalMs(targetIso, new Date());
    if (intervalMs == null) return;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [targetIso, durationMs, expectedLabel]);

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
      {result.secondaryLabel ? (
        <span className="mt-0.5 block text-sm font-normal text-zvv-muted">{result.secondaryLabel}</span>
      ) : null}
    </span>
  );
}

export function urgencyBadgeLabel(urgency: CountdownResult["urgency"] | "action"): string {
  if (urgency === "overdue" || urgency === "action") return "Actie nodig";
  if (urgency === "today") return "Vandaag";
  if (urgency === "upcoming") return "Binnenkort";
  return "Gepland";
}
