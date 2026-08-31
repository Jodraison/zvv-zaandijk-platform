"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CelebrationType } from "@/lib/home/homepage-celebration";
import { waitUntilCelebrationCanStart } from "@/lib/home/homepage-celebration";
import { CELEBRATION_START_DELAY_MS } from "@/lib/home/celebration-visual";
import { runClubCelebration, type CelebrationEngineHandle } from "@/lib/home/celebration-engine";
import { CelebrationHardFallback } from "@/components/home/celebration-hard-fallback";

type Phase = "pending" | "play" | "hold" | "reduced" | "skip" | "done";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (hold) {
      setPhase("hold");
      return;
    }

    let cancelled = false;
    void waitUntilCelebrationCanStart(CELEBRATION_START_DELAY_MS).then(() => {
      if (!cancelled) setPhase("play");
    });
    return () => {
      cancelled = true;
    };
  }, [type, calendarDay, preview, hold]);

  useLayoutEffect(() => {
    if (!type) return;
    if (phase !== "play" && phase !== "hold") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: CelebrationEngineHandle | null = runClubCelebration(canvas, {
      type,
      hold: phase === "hold",
    });
    return () => {
      handle?.stop();
      handle = null;
    };
  }, [type, phase]);

  if (!mounted || !type || phase === "skip" || phase === "done" || phase === "pending") {
    return null;
  }

  if (phase === "reduced") {
    return createPortal(
      <div
        data-testid="homepage-celebration-reduced"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2147483000,
          background:
            "radial-gradient(ellipse at 72% 28%, rgba(251,191,36,0.22), transparent 50%), radial-gradient(ellipse at 18% 18%, rgba(56,189,248,0.16), transparent 46%)",
        }}
      />,
      document.body,
    );
  }

  return (
    <>
      <CelebrationHardFallback type={type} hold={phase === "hold"} onDone={() => setPhase("done")} />
      {createPortal(
        <canvas
          ref={canvasRef}
          data-testid="homepage-celebration-canvas"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 2147482990,
          }}
        />,
        document.body,
      )}
    </>
  );
}
