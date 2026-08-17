"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type {
  TacticalAnimationPreference,
  TacticalCoachMode,
  TacticalPlaybackRate,
} from "@/lib/academie/tactical-animation-types";

function CtrlBtn({
  active,
  disabled,
  onClick,
  testId,
  ariaLabel,
  children,
  className,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  testId?: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 min-h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-35",
        active
          ? "bg-sky-500/25 text-sky-100 ring-1 ring-sky-400/40"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TacticalAnimationControls({
  playing,
  progress,
  statusLabel,
  teachingPoint,
  animationOn,
  userAnimationPreference,
  systemPrefersReducedMotion,
  playbackRate,
  coachMode,
  showStepControls,
  durationMs,
  timeMs,
  isTrigger,
  onToggle,
  onReplay,
  onSetPreference,
  onSetPlaybackRate,
  onSetCoachMode,
  onPrevStep,
  onNextStep,
  onSeekMs,
  className,
}: {
  playing: boolean;
  progress: number;
  statusLabel: string;
  teachingPoint?: string | null;
  animationOn: boolean;
  userAnimationPreference: TacticalAnimationPreference;
  systemPrefersReducedMotion: boolean;
  playbackRate: TacticalPlaybackRate;
  coachMode?: TacticalCoachMode;
  showStepControls?: boolean;
  /** Total film duration for scrub (ms). */
  durationMs?: number;
  /** Current playhead (ms). */
  timeMs?: number;
  /** Active trigger / decision beat. */
  isTrigger?: boolean;
  onToggle: () => void;
  onReplay: () => void;
  onSetPreference: (preference: TacticalAnimationPreference) => void;
  onSetPlaybackRate: (rate: TacticalPlaybackRate) => void;
  onSetCoachMode?: (mode: TacticalCoachMode) => void;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  onSeekMs?: (ms: number) => void;
  className?: string;
}) {
  const showSystemHint =
    systemPrefersReducedMotion && userAnimationPreference === "system" && !animationOn;
  const canScrub = Boolean(animationOn && onSeekMs && durationMs && durationMs > 0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!animationOn) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        onToggle();
      } else if (e.key === "ArrowLeft" && onSeekMs && durationMs) {
        e.preventDefault();
        onSeekMs(Math.max(0, (timeMs ?? 0) - 250));
      } else if (e.key === "ArrowRight" && onSeekMs && durationMs) {
        e.preventDefault();
        onSeekMs(Math.min(durationMs, (timeMs ?? 0) + 250));
      } else if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onReplay();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [animationOn, onToggle, onReplay, onSeekMs, durationMs, timeMs]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className={cn(
        "mt-2 space-y-2 rounded-2xl border border-slate-800 bg-[#0B1524] px-2.5 py-2.5 text-slate-100 shadow-[0_8px_28px_rgba(15,23,42,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
        className,
      )}
      data-animation-enabled={animationOn ? "true" : "false"}
      data-animation-playing={playing ? "true" : "false"}
      data-animation-progress={progress.toFixed(3)}
      data-animation-phase={statusLabel}
      data-animation-trigger={isTrigger ? "true" : "false"}
      data-system-reduced-motion={systemPrefersReducedMotion ? "true" : "false"}
      data-user-animation-preference={userAnimationPreference}
      data-playback-rate={String(playbackRate)}
      data-coach-mode={coachMode ?? "auto"}
      data-controls-style="v2-premium"
      aria-label="Animatiebediening. Spatie: play/pauze. Pijltjes: scrub. R: opnieuw."
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5" role="group" aria-label="Afspelen">
          <CtrlBtn
            testId="animation-play"
            ariaLabel={playing ? "Pauzeer animatie" : "Speel animatie"}
            disabled={!animationOn}
            active={playing}
            onClick={onToggle}
          >
            {playing ? "Pauze" : "Play"}
          </CtrlBtn>
          <CtrlBtn
            testId="animation-replay"
            ariaLabel="Speel animatie opnieuw"
            disabled={!animationOn}
            onClick={onReplay}
          >
            Opnieuw
          </CtrlBtn>
        </div>

        {onSetCoachMode ? (
          <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5" role="group" aria-label="Coachmodus">
            {([
              ["auto", "Auto"],
              ["step", "Stap"],
            ] as const).map(([mode, label]) => (
              <CtrlBtn
                key={mode}
                testId={`animation-coach-${mode}`}
                ariaLabel={mode === "auto" ? "Automatisch" : "Per stap"}
                disabled={!animationOn}
                active={(coachMode ?? "auto") === mode}
                onClick={() => onSetCoachMode(mode)}
              >
                {label}
              </CtrlBtn>
            ))}
          </div>
        ) : null}

        {showStepControls ? (
          <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5" role="group" aria-label="Stappen">
            <CtrlBtn
              testId="animation-prev-step"
              ariaLabel="Vorige stap"
              disabled={!animationOn}
              onClick={onPrevStep}
            >
              ←
            </CtrlBtn>
            <CtrlBtn
              testId="animation-next-step"
              ariaLabel="Volgende stap"
              disabled={!animationOn}
              onClick={onNextStep}
            >
              →
            </CtrlBtn>
          </div>
        ) : null}

        <div className="min-w-[8rem] flex-1 px-1" aria-hidden={!animationOn}>
          {canScrub ? (
            <label className="block">
              <span className="sr-only">Tijdlijn</span>
              <input
                type="range"
                min={0}
                max={durationMs}
                step={16}
                value={Math.max(0, Math.min(durationMs ?? 0, timeMs ?? 0))}
                disabled={!animationOn}
                data-testid="animation-scrub"
                aria-label="Scrub tijdlijn"
                aria-valuemin={0}
                aria-valuemax={durationMs}
                aria-valuenow={Math.round(timeMs ?? 0)}
                className="h-5 w-full cursor-pointer appearance-none rounded-full accent-sky-400 disabled:opacity-40 touch-manipulation [&::-webkit-slider-runnable-track]:h-[4px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/10 [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400"
                style={{
                  backgroundImage: `linear-gradient(to right, rgb(14 165 233 / 0.85) ${progress * 100}%, rgb(255 255 255 / 0.12) ${progress * 100}%)`,
                  backgroundSize: "100% 4px",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "transparent",
                }}
                onChange={(e) => onSeekMs?.(Number(e.target.value))}
              />
            </label>
          ) : (
            <div
              className="h-[3px] overflow-hidden rounded-full bg-white/10"
              data-testid="animation-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-[width] duration-75"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
          <div className="mt-1.5 flex items-baseline gap-2">
            <p
              className={cn(
                "text-[9px] font-bold uppercase tracking-[0.18em]",
                isTrigger ? "text-amber-300" : "text-slate-400",
              )}
              data-testid="animation-status-label"
            >
              {animationOn ? statusLabel : "Statisch"}
            </p>
            {animationOn && teachingPoint ? (
              <p
                className="truncate text-[11px] font-medium leading-snug text-slate-200"
                data-testid="animation-teaching-point"
              >
                {teachingPoint}
              </p>
            ) : null}
          </div>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5" role="group" aria-label="Afspeelsnelheid">
          {([0.75, 1, 1.25] as TacticalPlaybackRate[]).map((rate) => (
            <CtrlBtn
              key={rate}
              testId={`animation-speed-${rate}`}
              ariaLabel={`Snelheid ${rate}`}
              disabled={!animationOn}
              active={playbackRate === rate}
              onClick={() => onSetPlaybackRate(rate)}
            >
              {rate === 1 ? "1×" : `${rate}×`}
            </CtrlBtn>
          ))}
        </div>

        <label className="inline-flex h-10 min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-sky-400"
            checked={animationOn}
            data-testid="animation-toggle"
            onChange={(e) => onSetPreference(e.target.checked ? "enabled" : "disabled")}
            aria-label={animationOn ? "Animatie aan" : "Animatie uit"}
          />
          Animatie
        </label>
      </div>

      {showSystemHint ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-100">
          <p>Statische weergave vanwege je bewegingsvoorkeur.</p>
          <button
            type="button"
            className="mt-1.5 inline-flex h-10 min-h-10 items-center rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 text-[11px] font-bold text-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            onClick={() => onSetPreference("enabled")}
          >
            Toch animatie gebruiken
          </button>
        </div>
      ) : null}
    </div>
  );
}
