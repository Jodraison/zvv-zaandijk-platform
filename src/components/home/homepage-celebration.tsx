"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { CelebrationType } from "@/lib/home/homepage-celebration";
import {
  celebrationSessionKey,
  markHomepageCelebrationStarted,
  shouldReplayHomepageCelebration,
} from "@/lib/home/homepage-celebration";
import { celebrationOverlayClassName } from "@/lib/home/celebration-visual";
import { runClubCelebration, type CelebrationEngineHandle } from "@/lib/home/celebration-engine";

const OVERLAY_CLASS = cn(celebrationOverlayClassName(), "pointer-events-none");

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

    const key = celebrationSessionKey(type, calendarDay);
    if (!preview && !hold && !shouldReplayHomepageCelebration(key)) {
      setPhase("skip");
      return;
    }

    setPhase(hold ? "hold" : "play");

    if (preview || hold) return;
    const markId = window.setTimeout(() => markHomepageCelebrationStarted(key), 400);
    return () => window.clearTimeout(markId);
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

  if (!mounted || !type || phase === "skip" || phase === "done" || phase === "pending") {
    return null;
  }

  return createPortal(
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
          className="zvv-celebration-wash zvv-celebration-wash-reduced"
          data-testid="homepage-celebration-reduced"
        />
      ) : (
        <>
          <div className="zvv-celebration-wash" data-testid="homepage-celebration-wash" />
          <canvas ref={canvasRef} className="h-full w-full" data-testid="homepage-celebration-canvas" />
        </>
      )}
    </div>,
    document.body,
  );
}
