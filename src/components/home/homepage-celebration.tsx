"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { CelebrationType } from "@/lib/home/homepage-celebration";
import {
  celebrationSessionKey,
  markHomepageCelebrationStarted,
  shouldReplayHomepageCelebration,
} from "@/lib/home/homepage-celebration";
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_START_DELAY_MS,
  celebrationOverlayClassName,
} from "@/lib/home/celebration-visual";
import {
  buildCelebrationDomLayout,
  CELEBRATION_CANVAS_ENHANCEMENT_DELAY_MS,
  type CelebrationDomPiece,
} from "@/lib/home/celebration-dom";
import { runClubCelebration, type CelebrationEngineHandle } from "@/lib/home/celebration-engine";
import { CelebrationDomLayer } from "@/components/home/celebration-dom-layer";

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
  const [domPieces, setDomPieces] = useState<CelebrationDomPiece[] | null>(null);

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

    if (hold) {
      setPhase("hold");
      return;
    }

    const startId = window.setTimeout(() => {
      setPhase("play");
      markHomepageCelebrationStarted(key);
    }, CELEBRATION_START_DELAY_MS);

    return () => window.clearTimeout(startId);
  }, [type, calendarDay, preview, hold]);

  useEffect(() => {
    if (!type) return;
    if (phase !== "play" && phase !== "hold") return;
    setDomPieces(
      buildCelebrationDomLayout({
        kind: type,
        width: window.innerWidth,
        seed: `${type}:${calendarDay}`,
      }),
    );
  }, [type, calendarDay, phase]);

  useEffect(() => {
    if (!type || phase !== "play") return;
    const id = window.setTimeout(() => setPhase("done"), CELEBRATION_DURATION_MS[type]);
    return () => window.clearTimeout(id);
  }, [type, phase]);

  useLayoutEffect(() => {
    if (!type) return;
    if (phase !== "play" && phase !== "hold") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: CelebrationEngineHandle | null = null;
    const startCanvas = () => {
      handle = runClubCelebration(canvas, {
        type,
        hold: phase === "hold",
      });
    };

    if (phase === "hold") {
      startCanvas();
      return () => {
        handle?.stop();
        handle = null;
      };
    }

    const id = window.setTimeout(startCanvas, CELEBRATION_CANVAS_ENHANCEMENT_DELAY_MS);
    return () => {
      window.clearTimeout(id);
      handle?.stop();
      handle = null;
    };
  }, [type, phase]);

  if (!mounted || !type || phase === "skip" || phase === "done" || phase === "pending") {
    return null;
  }

  return createPortal(
    <div
      id="homepage-celebration-root"
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
          {domPieces ? <CelebrationDomLayer pieces={domPieces} /> : null}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full"
            data-testid="homepage-celebration-canvas"
          />
        </>
      )}
    </div>,
    document.body,
  );
}
