"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  evaluateTacticalAnimation,
  getAnimationStepEndMs,
  getAnimationStepStartMs,
} from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  TACTICAL_ANIMATION_PREF_KEY,
  TACTICAL_ANIMATION_SPEED_KEY,
  TACTICAL_COACH_MODE_KEY,
  effectiveTacticalAnimationEnabled,
  parseTacticalAnimationPreference,
  parseTacticalCoachMode,
  parseTacticalPlaybackRate,
  type TacticalAnimationDefinition,
  type TacticalAnimationFrame,
  type TacticalAnimationPreference,
  type TacticalCoachMode,
  type TacticalPlaybackRate,
} from "@/lib/academie/tactical-animation-types";
import { claimAnimationSlot, releaseAnimationSlot } from "@/lib/academie/tactical-animation-slot";
import type { TacticalSituationDefinition } from "@/lib/academie/tactical-visual-system";

const PREF_EVENT = "zvv-tactical-animation-pref";
const SPEED_EVENT = "zvv-tactical-animation-speed";
const COACH_EVENT = "zvv-tactical-coach-mode";

function readSystemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readUserAnimationPreference(): TacticalAnimationPreference {
  if (typeof window === "undefined") return "system";
  try {
    return parseTacticalAnimationPreference(window.localStorage.getItem(TACTICAL_ANIMATION_PREF_KEY));
  } catch {
    return "system";
  }
}

function readPlaybackRate(): TacticalPlaybackRate {
  if (typeof window === "undefined") return 1;
  try {
    return parseTacticalPlaybackRate(window.localStorage.getItem(TACTICAL_ANIMATION_SPEED_KEY));
  } catch {
    return 1;
  }
}

function readCoachMode(): TacticalCoachMode {
  if (typeof window === "undefined") return "auto";
  try {
    return parseTacticalCoachMode(window.localStorage.getItem(TACTICAL_COACH_MODE_KEY));
  } catch {
    return "auto";
  }
}

export function setTacticalAnimationPreference(preference: TacticalAnimationPreference): void {
  try {
    window.localStorage.setItem(TACTICAL_ANIMATION_PREF_KEY, preference);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(PREF_EVENT));
}

export function setTacticalPlaybackRate(rate: TacticalPlaybackRate): void {
  try {
    window.localStorage.setItem(TACTICAL_ANIMATION_SPEED_KEY, String(rate));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SPEED_EVENT));
}

export function setTacticalCoachMode(mode: TacticalCoachMode): void {
  try {
    window.localStorage.setItem(TACTICAL_COACH_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(COACH_EVENT));
}

/** @deprecated Prefer setTacticalAnimationPreference */
export function setTacticalAnimationEnabled(on: boolean): void {
  setTacticalAnimationPreference(on ? "enabled" : "disabled");
}

export function useTacticalAnimation(
  situation: TacticalSituationDefinition,
  opts?: {
    autoplay?: boolean;
    enabled?: boolean;
    /** Engine override — compiled LessonFilmSpec or authored definition. */
    definition?: TacticalAnimationDefinition | null;
  },
) {
  const definitionOverride = opts?.definition ?? null;
  const animation = useMemo(
    () => definitionOverride ?? getTacticalAnimation(situation.id),
    [situation.id, definitionOverride],
  );
  const instanceId = useId();
  const slotId = `${situation.id}:${animation?.id ?? "none"}:${instanceId}`;

  // Stabilize optional flags — always booleans (no conditional deps).
  const propEnabled = opts?.enabled !== false;
  const propAutoplay = opts?.autoplay !== false;

  const [userAnimationPreference, setUserAnimationPreference] =
    useState<TacticalAnimationPreference>("system");
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false);
  const [prefHydrated, setPrefHydrated] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState<TacticalPlaybackRate>(1);
  const [coachMode, setCoachModeState] = useState<TacticalCoachMode>("auto");
  const [playing, setPlaying] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [inView, setInView] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const timeRef = useRef(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const hasAutoplayedRef = useRef(false);
  const userPausedRef = useRef(false);
  const animationRef = useRef(animation);
  const animationOnRef = useRef(false);
  const coachModeRef = useRef<TacticalCoachMode>("auto");
  const coachStepIndexRef = useRef(0);
  const playbackRateRef = useRef<TacticalPlaybackRate>(1);
  const pauseRef = useRef<(reason?: "user" | "system") => void>(() => {});
  const playRef = useRef<(optsPlay?: { userInitiated?: boolean }) => void>(() => {});

  animationRef.current = animation;
  playbackRateRef.current = playbackRate;
  coachModeRef.current = coachMode;

  const effectiveAnimationEnabled = effectiveTacticalAnimationEnabled(
    userAnimationPreference,
    systemPrefersReducedMotion,
  );
  const animationOn = propEnabled && prefHydrated && effectiveAnimationEnabled && !!animation;
  animationOnRef.current = animationOn;

  useEffect(() => {
    setSystemPrefersReducedMotion(readSystemPrefersReducedMotion());
    setUserAnimationPreference(readUserAnimationPreference());
    setPlaybackRateState(readPlaybackRate());
    setCoachModeState(readCoachMode());
    setPrefHydrated(true);

    const mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const onMq = () => setSystemPrefersReducedMotion(mq?.matches ?? false);
    mq?.addEventListener("change", onMq);

    const onPref = () => setUserAnimationPreference(readUserAnimationPreference());
    const onSpeed = () => setPlaybackRateState(readPlaybackRate());
    const onCoach = () => setCoachModeState(readCoachMode());
    window.addEventListener(PREF_EVENT, onPref);
    window.addEventListener(SPEED_EVENT, onSpeed);
    window.addEventListener(COACH_EVENT, onCoach);

    return () => {
      mq?.removeEventListener("change", onMq);
      window.removeEventListener(PREF_EVENT, onPref);
      window.removeEventListener(SPEED_EVENT, onSpeed);
      window.removeEventListener(COACH_EVENT, onCoach);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.15),
      { threshold: [0, 0.15, 0.35, 0.6], rootMargin: "40px 0px 40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const pause = useCallback(
    (reason?: "user" | "system") => {
      if (reason === "user") userPausedRef.current = true;
      playingRef.current = false;
      setPlaying(false);
      stopRaf();
      releaseAnimationSlot(slotId);
    },
    [slotId, stopRaf],
  );
  pauseRef.current = pause;

  // Reset clock when the compiled film / registry definition changes.
  useEffect(() => {
    timeRef.current = 0;
    setTimeMs(0);
    coachStepIndexRef.current = 0;
    hasAutoplayedRef.current = false;
    if (playingRef.current) pauseRef.current("system");
  }, [animation?.id]);

  const tick = useCallback(
    (ts: number) => {
      const anim = animationRef.current;
      if (!anim || !playingRef.current) {
        rafRef.current = null;
        return;
      }
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const rawDt = Math.min(48, ts - lastTsRef.current);
      lastTsRef.current = ts;
      const dt = rawDt * playbackRateRef.current;
      const total = anim.durationMs + (anim.pauseAtEndMs ?? 0);
      let next = timeRef.current + dt;

      if (coachModeRef.current === "step") {
        const stepEnd = getAnimationStepEndMs(anim, coachStepIndexRef.current);
        const lastIdx = Math.max(0, anim.steps.length - 1);
        if (coachStepIndexRef.current < lastIdx && next >= stepEnd - 8) {
          next = stepEnd;
          timeRef.current = next;
          setTimeMs(next);
          pauseRef.current("system");
          return;
        }
      }

      if (next >= total) {
        if (anim.loop) {
          next = 0;
          coachStepIndexRef.current = 0;
        } else {
          next = total;
          timeRef.current = next;
          setTimeMs(next);
          pauseRef.current("system");
          return;
        }
      }
      timeRef.current = next;
      setTimeMs(next);
      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const play = useCallback(
    (optsPlay?: { userInitiated?: boolean }) => {
      const anim = animationRef.current;
      if (!anim || !animationOnRef.current) return;

      const userInitiated = optsPlay?.userInitiated === true;
      if (userInitiated) userPausedRef.current = false;

      const total = anim.durationMs + (anim.pauseAtEndMs ?? 0);
      if (timeRef.current >= anim.durationMs || timeRef.current >= total - 16) {
        timeRef.current = 0;
        setTimeMs(0);
        coachStepIndexRef.current = 0;
      } else if (coachModeRef.current === "step") {
        const frame = evaluateTacticalAnimation(situation, anim, timeRef.current);
        coachStepIndexRef.current = frame.activeStepIndex;
      }

      const claimed = claimAnimationSlot(
        slotId,
        () => {
          playingRef.current = false;
          setPlaying(false);
          stopRaf();
        },
        { userInitiated },
      );
      if (!claimed) return;

      playingRef.current = true;
      setPlaying(true);
      lastTsRef.current = null;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [slotId, stopRaf, tick, situation],
  );
  playRef.current = play;

  const replay = useCallback(() => {
    userPausedRef.current = false;
    coachStepIndexRef.current = 0;
    timeRef.current = 0;
    setTimeMs(0);
    play({ userInitiated: true });
  }, [play]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause("user");
    else play({ userInitiated: true });
  }, [pause, play]);

  const setPreference = useCallback(
    (preference: TacticalAnimationPreference) => {
      setTacticalAnimationPreference(preference);
      setUserAnimationPreference(preference);
      const nextOn = effectiveTacticalAnimationEnabled(preference, systemPrefersReducedMotion);
      if (!nextOn) pause("user");
    },
    [pause, systemPrefersReducedMotion],
  );

  const setRate = useCallback((rate: TacticalPlaybackRate) => {
    setTacticalPlaybackRate(rate);
    setPlaybackRateState(rate);
    playbackRateRef.current = rate;
  }, []);

  const setCoach = useCallback((mode: TacticalCoachMode) => {
    setTacticalCoachMode(mode);
    setCoachModeState(mode);
    coachModeRef.current = mode;
  }, []);

  const seekToStep = useCallback(
    (stepIndex: number) => {
      const anim = animationRef.current;
      if (!anim) return;
      const clamped = Math.max(0, Math.min(anim.steps.length - 1, stepIndex));
      coachStepIndexRef.current = clamped;
      const start = getAnimationStepStartMs(anim, clamped);
      timeRef.current = start;
      setTimeMs(start);
      if (!playingRef.current && animationOnRef.current) {
        play({ userInitiated: true });
      }
    },
    [play],
  );

  const seekToMs = useCallback(
    (ms: number) => {
      const anim = animationRef.current;
      if (!anim) return;
      const clamped = Math.max(0, Math.min(anim.durationMs, ms));
      timeRef.current = clamped;
      setTimeMs(clamped);
      playingRef.current = false;
      setPlaying(false);
      stopRaf();
    },
    [stopRaf],
  );

  const goToPrevStep = useCallback(() => {
    const anim = animationRef.current;
    if (!anim) return;
    const frame = evaluateTacticalAnimation(situation, anim, timeRef.current);
    seekToStep(Math.max(0, frame.activeStepIndex - 1));
  }, [seekToStep, situation]);

  const goToNextStep = useCallback(() => {
    const anim = animationRef.current;
    if (!anim) return;
    const frame = evaluateTacticalAnimation(situation, anim, timeRef.current);
    seekToStep(Math.min(anim.steps.length - 1, frame.activeStepIndex + 1));
  }, [seekToStep, situation]);

  // Autoplay once when in view — FIXED-SIZE dependency array (always 6 entries).
  useEffect(() => {
    if (!animationOn) {
      if (playingRef.current) pauseRef.current("system");
      return;
    }
    if (!inView) return;
    if (systemPrefersReducedMotion) return;
    if (!propAutoplay) return;
    if (animation?.autoplay === false) return;
    if (hasAutoplayedRef.current) return;
    if (playingRef.current) return;
    if (userPausedRef.current) return;
    hasAutoplayedRef.current = true;
    playRef.current({ userInitiated: false });
  }, [animationOn, inView, systemPrefersReducedMotion, propAutoplay, animation, situation.id]);

  useEffect(() => {
    if (!inView && playingRef.current) pauseRef.current("system");
  }, [inView]);

  useEffect(() => {
    if (playing && animationOn && rafRef.current == null && playingRef.current) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [playing, animationOn, timeMs, tick]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      stopRaf();
      releaseAnimationSlot(slotId);
    };
  }, [slotId, stopRaf]);

  const frame: TacticalAnimationFrame | null = useMemo(() => {
    if (!animation || !animationOn) return null;
    return evaluateTacticalAnimation(situation, animation, timeMs);
  }, [animation, animationOn, situation, timeMs]);

  const showStepControls =
    !!animation &&
    (coachMode === "step" || (animation.complexity !== "micro" && animation.steps.length >= 4));

  return {
    rootRef,
    animation,
    animationOn,
    effectiveAnimationEnabled,
    systemPrefersReducedMotion,
    userAnimationPreference,
    setUserAnimationPreference: setPreference,
    userEnabled: userAnimationPreference !== "disabled",
    setUserEnabled: (on: boolean) => setPreference(on ? "enabled" : "disabled"),
    reducedMotion: systemPrefersReducedMotion,
    playing,
    play: () => play({ userInitiated: true }),
    pause: () => pause("user"),
    replay,
    toggle,
    frame,
    timeMs,
    inView,
    slotId,
    playbackRate,
    setPlaybackRate: setRate,
    coachMode,
    setCoachMode: setCoach,
    goToPrevStep,
    goToNextStep,
    seekToMs,
    showStepControls,
  };
}
