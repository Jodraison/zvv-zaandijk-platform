"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import { FORMATION_TEACH_FRAMES } from "@/lib/decision-lab/formation-teach-frames";
import { GS_ORIENTATION } from "@/lib/academie/tactical-canonical-perspective";
import { cn } from "@/lib/utils";

/**
 * Visible 4-2-3-1 → trigger → press transform (C-010).
 * Full-screen pitch for mobile readability.
 */
export function FormationTeachSequence({
  className,
  large = true,
  autoAdvance = true,
}: {
  className?: string;
  large?: boolean;
  autoAdvance?: boolean;
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const frame = FORMATION_TEACH_FRAMES[frameIdx]!;

  useEffect(() => {
    if (!autoAdvance) return;
    if (frameIdx >= FORMATION_TEACH_FRAMES.length - 1) return;
    const t = window.setTimeout(
      () => setFrameIdx((i) => Math.min(i + 1, FORMATION_TEACH_FRAMES.length - 1)),
      3200,
    );
    return () => window.clearTimeout(t);
  }, [frameIdx, autoAdvance]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const field = (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/15 bg-slate-950",
        large && "min-h-[300px] md:min-h-[480px] lg:min-h-[560px]",
        !large && "min-h-[220px]",
        expanded && "min-h-[min(70vh,640px)] rounded-none border-0 md:min-h-[min(78vh,720px)]",
      )}
      data-testid="formation-teach-field"
      data-frame={frame.id}
    >
      <TacticalIllustration
        key={frame.id}
        situation={frame.situation}
        className="w-full [&_figcaption]:px-3 [&_figcaption]:pt-3 [&_figcaption_p:first-child]:text-[11px] [&_figcaption_p:nth-child(2)]:text-lg md:[&_figcaption_p:nth-child(2)]:text-2xl"
        autoplay={false}
        cameraMode={frame.cameraMode}
        hierarchyQuiet={frame.id === "press"}
        compact={false}
        showControls={expanded}
        showLegend={false}
        orientation={
          frame.id === "press"
            ? { ...GS_ORIENTATION, baseFormationNote: frame.orientationNote, phase: frame.phase }
            : {
                phase: frame.phase,
                activeRole: "RW",
                showAttackDirection: true,
                baseFormationNote: frame.orientationNote,
              }
        }
        showOrientation
      />
    </div>
  );

  const controls = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-white md:text-base" id={titleId}>
        {frame.title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FORMATION_TEACH_FRAMES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFrameIdx(i)}
            className={cn(
              "min-h-11 rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5",
              i === frameIdx ? "bg-white text-zvv-ink" : "bg-white/10 text-white/80 hover:bg-white/20",
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFrameIdx(0)}
          className="min-h-11 rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 sm:min-h-0 sm:py-1.5"
        >
          Terug naar basis
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 md:hidden"
          onClick={() => setExpanded(true)}
          data-testid="expand-pitch"
        >
          Bekijk volledige opstelling
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {controls}
      {field}

      {expanded ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-zvv-night pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-modal
          aria-labelledby={titleId}
          data-testid="pitch-fullscreen"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="text-sm font-semibold text-white">
              {frame.title} · Rol: RW · Aanval →
            </p>
            <button
              ref={closeRef}
              type="button"
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-zvv-ink"
              onClick={() => setExpanded(false)}
            >
              Sluiten
            </button>
          </div>
          <div className="min-h-0 flex-1 px-2 pb-2">{field}</div>
          <div className="flex flex-wrap justify-center gap-2 px-3 pb-3">
            {FORMATION_TEACH_FRAMES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrameIdx(i)}
                className={cn(
                  "min-h-12 rounded-full px-4 text-sm font-semibold",
                  i === frameIdx ? "bg-white text-zvv-ink" : "bg-white/15 text-white",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
