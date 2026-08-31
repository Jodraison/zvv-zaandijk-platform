"use client";

import { useEffect, useState } from "react";
import type { CelebrationType } from "@/lib/home/homepage-celebration";
import { waitUntilCelebrationCanStart } from "@/lib/home/homepage-celebration";
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_REDUCED_DURATION_MS,
  CELEBRATION_START_DELAY_MS,
} from "@/lib/home/celebration-show";
import { CelebrationShow } from "@/components/home/celebration-show";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HomepageCelebration({
  type,
  calendarDay,
  preview = false,
  hold = false,
  forceReducedMotion = false,
}: {
  type: CelebrationType;
  calendarDay: string;
  preview?: boolean;
  hold?: boolean;
  forceReducedMotion?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!type) return;
    let cancelled = false;
    setReady(false);
    setDone(false);
    void waitUntilCelebrationCanStart(CELEBRATION_START_DELAY_MS).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [type, calendarDay, preview, hold, forceReducedMotion]);

  const reduced = forceReducedMotion || (mounted && prefersReducedMotion());

  useEffect(() => {
    if (!type || !ready || hold) return;
    const ms = reduced ? CELEBRATION_REDUCED_DURATION_MS : CELEBRATION_DURATION_MS[type];
    const id = window.setTimeout(() => setDone(true), ms);
    return () => window.clearTimeout(id);
  }, [type, ready, hold, reduced]);

  if (!mounted || !type || !ready || done) return null;

  return (
    <CelebrationShow
      type={type}
      seed={`${type}:${calendarDay}`}
      hold={hold}
      reduced={reduced}
    />
  );
}
