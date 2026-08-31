"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CelebrationType } from "@/lib/home/homepage-celebration";
import { celebrationSessionKey } from "@/lib/home/homepage-celebration";
import { celebrationOverlayClassName } from "@/lib/home/celebration-visual";
import { runClubCelebration, type CelebrationEngineHandle } from "@/lib/home/celebration-engine";

const OVERLAY_CLASS = cn(celebrationOverlayClassName(), "pointer-events-none");

type Phase = "pending" | "play" | "hold" | "reduced" | "skip" | "done";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sessionHasSeen(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function sessionMarkSeen(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}

export function HomepageCelebration({
  type,
  calendarDay,
  preview = false,
  hold = false,
}: {
  type: CelebrationType;
  calendarDay: string;
  preview?: boolean;
  hold?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    if (!type) {
      setPhase("skip");
      return;
    }

    if (prefersReducedMotion()) {
      setPhase("reduced");
      const id = window.setTimeout(() => setPhase("done"), 1400);
      return () => window.clearTimeout(id);
    }

    const key = celebrationSessionKey(type, calendarDay);
    if (!preview && !hold && sessionHasSeen(key)) {
      setPhase("skip");
      return;
    }
    if (!preview && !hold) sessionMarkSeen(key);

    setPhase(hold ? "hold" : "play");
  }, [type, calendarDay, preview, hold]);

  useEffect(() => {
    if (!type) return;
    if (phase !== "play" && phase !== "hold") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: CelebrationEngineHandle | null = runClubCelebration(canvas, {
      type,
      hold: phase === "hold",
      onDone: () => setPhase("done"),
    });

    return () => {
      handle?.stop();
      handle = null;
    };
  }, [type, phase]);

  if (!type || phase === "skip" || phase === "done" || phase === "pending") {
    if (!type) return null;
    if (phase === "pending") {
      return (
        <div
          className={OVERLAY_CLASS}
          data-testid="homepage-celebration"
          data-celebration-type={type}
          data-celebration-phase="pending"
          aria-hidden="true"
        />
      );
    }
    return null;
  }

  return (
    <div
      className={OVERLAY_CLASS}
      data-testid="homepage-celebration"
      data-celebration-type={type}
      data-celebration-phase={phase}
      data-celebration-preview={preview ? "true" : "false"}
      data-celebration-hold={hold ? "true" : "false"}
      aria-hidden="true"
    >
      {phase === "reduced" ? (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_28%,rgba(251,191,36,0.14),transparent_52%),radial-gradient(ellipse_at_18%_18%,rgba(147,197,253,0.12),transparent_48%)]"
          data-testid="homepage-celebration-reduced"
        />
      ) : (
        <canvas ref={canvasRef} className="h-full w-full" data-testid="homepage-celebration-canvas" />
      )}
    </div>
  );
}
