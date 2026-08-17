"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TacticalAnimationControls } from "@/components/academie/tactical-animation-controls";
import { useTacticalAnimation } from "@/components/academie/use-tactical-animation";
import {
  TacticalBall,
  TacticalLegend,
  TacticalLineLayer,
  TacticalPitchBase,
  TacticalPlayer,
  TacticalZoneLayer,
} from "@/components/academie/tactical-pitch";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { TacticalOrientationChrome } from "@/components/academie/tactical-orientation-chrome";
import {
  GS_ORIENTATION,
  type TacticalOrientationSpec,
} from "@/lib/academie/tactical-canonical-perspective";
import {
  TACTICAL_MOTION,
  TACTICAL_PRESETS,
  TACTICAL_SURFACES,
  TACTICAL_VIEWBOX,
  ballBesideHolder,
  fieldPointToSvg,
  type TacticalPoint,
  type TacticalSituationDefinition,
} from "@/lib/academie/tactical-visual-system";
import {
  computeFocusViewBox,
  fieldPercentRectToViewBox,
  fullViewBox,
  inferPresetId,
  interpolateViewBox,
  viewBoxToString,
  type CameraViewBox,
} from "@/lib/academie/tactical-camera";
import {
  lastLineHeight,
  teamCompactness,
} from "@/lib/academie/tactical-animation-v4-state";
import {
  auditCollectiveFrame,
  measureLineGapsUs,
} from "@/lib/academie/tactical-collective";
import { getCollectiveBrief } from "@/lib/academie/tactical-collective-briefs";
import { dist, SAFE_PLAYER_RADIUS } from "@/lib/academie/tactical-animation-collision";
import {
  evaluatePassLane,
  passLaneLabel,
} from "@/lib/academie/tactical-pass-lane";
import {
  getAuthoredBrief,
  getAuthoredOrientation,
  getAuthoredPassReleases,
  getAuthoredPhase,
} from "@/lib/academie/tactical-authored-lookup";
import { getPressV2Orientation, PRESS_V2_DETAIL_FIELD_RECT } from "@/lib/academie/tactical-press-reference-v2";
import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import { compileFilm, type LessonFilmSpec } from "@/lib/academie/tactical-engine";
import {
  evaluateOffsideAtRelease,
  formatOffsideLabel,
} from "@/lib/academie/tactical-offside-release";
import type { PresentationMode } from "@/lib/academie/tactical-film-types";
import { auditConnectedTeamMotionBoundaries } from "@/lib/academie/tactical-connected-team-motion-audit";
import { cn } from "@/lib/utils";

function resolvePresentationMode(
  author: boolean,
  debug: boolean,
  coachMode: string,
  forceCoach = false,
): PresentationMode {
  if (debug) return "debug";
  if (author) return "author";
  if (forceCoach || coachMode === "step") return "coach";
  return "academy";
}

function useForceCoachPresentation(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    try {
      setFlag(new URLSearchParams(window.location.search).get("presentation") === "coach");
    } catch {
      setFlag(false);
    }
  }, []);
  return flag;
}

function useAnimationDebugFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TACTICAL_ANIMATION_DEBUG === "true") {
      setFlag(true);
      return;
    }
    try {
      setFlag(new URLSearchParams(window.location.search).get("animationDebug") === "1");
    } catch {
      setFlag(false);
    }
  }, []);
  return flag;
}

function useAnimationAuthorFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    try {
      setFlag(new URLSearchParams(window.location.search).get("animationAuthor") === "1");
    } catch {
      setFlag(false);
    }
  }, []);
  return flag;
}

/** Mute visual test — hide captions/zones so structure must speak for itself. */
function useMuteVisualFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    try {
      setFlag(new URLSearchParams(window.location.search).get("muteVisual") === "1");
    } catch {
      setFlag(false);
    }
  }, []);
  return flag;
}

function useBallTrail(ball: TacticalPoint | null | undefined, active: boolean): TacticalPoint[] {
  const [trail, setTrail] = useState<TacticalPoint[]>([]);
  const lastRef = useRef<string>("");
  useEffect(() => {
    if (!active || !ball) {
      lastRef.current = "";
      setTrail((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const key = `${ball.x.toFixed(2)},${ball.y.toFixed(2)}`;
    if (key === lastRef.current) return;
    lastRef.current = key;
    setTrail((prev) => [...prev.slice(-(TACTICAL_MOTION.trailMax - 1)), { ...ball }]);
  }, [ball, active]);
  return trail;
}

function facingToward(from: TacticalPoint, to: TacticalPoint): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

/** Dev/author offside line at pass release. */
function OffsideReleaseOverlay({
  receiverAt,
  ballAt,
  secondLastX,
  label,
}: {
  receiverAt: TacticalPoint;
  ballAt: TacticalPoint;
  secondLastX: number;
  label: string;
}) {
  const { field } = TACTICAL_VIEWBOX;
  const lineX = field.x + (secondLastX / 100) * field.w;
  const rx = fieldPointToSvg(receiverAt);
  const bx = fieldPointToSvg(ballAt);
  return (
    <g data-offside-overlay pointerEvents="none">
      <line
        x1={lineX}
        y1={field.y}
        x2={lineX}
        y2={field.y + field.h}
        stroke="rgba(250,204,21,0.85)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <circle cx={rx.cx} cy={rx.cy} r={16} fill="none" stroke="rgba(56,189,248,0.9)" strokeWidth={1.4} />
      <circle cx={bx.cx} cy={bx.cy} r={10} fill="none" stroke="rgba(251,146,60,0.95)" strokeWidth={1.4} />
      <text
        x={lineX + 4}
        y={field.y + 18}
        fill="rgba(250,204,21,0.95)"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}

/** Dev-only lane/third grid — ?animationAuthor=1 */
function TacticalAuthoringGrid() {
  const { field } = TACTICAL_VIEWBOX;
  const laneYs = [0.22, 0.4, 0.6, 0.78];
  const thirdXs = [0.22, 0.38, 0.55, 0.72, 0.88];
  return (
    <g data-authoring-grid opacity={0.45} pointerEvents="none">
      {laneYs.map((t, i) => {
        const y = field.y + t * field.h;
        return (
          <line
            key={`lane-${i}`}
            x1={field.x}
            y1={y}
            x2={field.x + field.w}
            y2={y}
            stroke="rgba(250,204,21,0.55)"
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        );
      })}
      {thirdXs.map((t, i) => {
        const x = field.x + t * field.w;
        return (
          <line
            key={`zone-${i}`}
            x1={x}
            y1={field.y}
            x2={x}
            y2={field.y + field.h}
            stroke="rgba(56,189,248,0.4)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        );
      })}
      <text
        x={field.x + 8}
        y={field.y + 14}
        fill="rgba(250,204,21,0.9)"
        fontSize={10}
        fontFamily="ui-monospace, monospace"
      >
        AUTHOR lanes+zones
      </text>
    </g>
  );
}

function viewBoxNearlyEqual(a: CameraViewBox, b: CameraViewBox, eps = 0.04): boolean {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.w - b.w) < eps &&
    Math.abs(a.h - b.h) < eps
  );
}

function viewBoxKey(v: CameraViewBox): string {
  return `${v.x.toFixed(2)}|${v.y.toFixed(2)}|${v.w.toFixed(2)}|${v.h.toFixed(2)}`;
}

function useSmoothedViewBox(target: CameraViewBox, reducedMotion: boolean): CameraViewBox {
  const [current, setCurrent] = useState<CameraViewBox>(() => target);
  const fromRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;
  const key = viewBoxKey(target);

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(targetRef.current);
      fromRef.current = targetRef.current;
      return;
    }
    if (viewBoxNearlyEqual(fromRef.current, targetRef.current)) {
      fromRef.current = targetRef.current;
      setCurrent(targetRef.current);
      return;
    }
    const from = fromRef.current;
    const to = targetRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / Math.max(TACTICAL_MOTION.cameraEaseMs, 1);
      if (t >= 1) {
        setCurrent(to);
        fromRef.current = to;
        return;
      }
      setCurrent(interpolateViewBox(from, to, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, reducedMotion]);

  return reducedMotion ? target : current;
}

/**
 * Canonieke Academy-illustratie — Tactical Visual System V2 Premium Analysis.
 */
export function TacticalIllustration({
  situation,
  situationId,
  className,
  showLegend = true,
  compact = false,
  animated = true,
  autoplay,
  cameraMode = "auto",
  hierarchyQuiet = false,
  showControls = true,
  /** Compiled engine definition override (registry bypass). */
  definition,
  /** Lesson film — compiled by the engine before playback. */
  filmSpec,
  /** Seek playhead after mount (ms) — e.g. decision freeze frame. */
  seekMs,
  /** Compact orientation chrome (team / direction / phase / role). */
  orientation,
  showOrientation,
}: {
  situation?: TacticalSituationDefinition;
  situationId?: string;
  className?: string;
  showLegend?: boolean;
  compact?: boolean;
  animated?: boolean;
  autoplay?: boolean;
  /** full = no zoom; press-detail = crop on pressing zone; auto = existing heuristics */
  cameraMode?: "auto" | "full" | "press-detail";
  /** Dim non-primary markers (Academy hierarchy). */
  hierarchyQuiet?: boolean;
  /** Hide playback chrome (e.g. dual-view overview mirror). */
  showControls?: boolean;
  definition?: TacticalAnimationDefinition | null;
  filmSpec?: LessonFilmSpec | null;
  seekMs?: number;
  orientation?: TacticalOrientationSpec | null;
  /** Default true for Golden Session situations when orientation omitted. */
  showOrientation?: boolean;
}) {
  const resolved = situation ?? (situationId ? getTacticalSituation(situationId) : undefined);
  if (!resolved) return null;

  const isGs = resolved.id.startsWith("fdl-gs-inside-close");
  const resolvedOrientation =
    orientation === null
      ? null
      : (orientation ?? (isGs && showOrientation !== false ? GS_ORIENTATION : null));
  const shouldShowOrientation = showOrientation !== false && resolvedOrientation != null;

  return (
    <TacticalIllustrationInner
      resolved={resolved}
      className={className}
      showLegend={showLegend}
      compact={compact}
      animated={animated}
      autoplay={autoplay}
      cameraMode={cameraMode}
      hierarchyQuiet={hierarchyQuiet}
      showControls={showControls}
      definition={definition}
      filmSpec={filmSpec}
      seekMs={seekMs}
      orientation={shouldShowOrientation ? resolvedOrientation : null}
    />
  );
}

function TacticalIllustrationInner({
  resolved,
  className,
  showLegend,
  compact,
  animated,
  autoplay,
  cameraMode,
  hierarchyQuiet,
  showControls,
  definition,
  filmSpec,
  seekMs,
  orientation,
}: {
  resolved: TacticalSituationDefinition;
  className?: string;
  showLegend: boolean;
  compact: boolean;
  animated: boolean;
  autoplay?: boolean;
  cameraMode: "auto" | "full" | "press-detail";
  hierarchyQuiet: boolean;
  showControls: boolean;
  definition?: TacticalAnimationDefinition | null;
  filmSpec?: LessonFilmSpec | null;
  seekMs?: number;
  orientation?: TacticalOrientationSpec | null;
}) {
  const showDebug = useAnimationDebugFlag();
  const showAuthor = useAnimationAuthorFlag();
  const muteVisual = useMuteVisualFlag();
  const forceCoach = useForceCoachPresentation();
  const compiledDefinition = useMemo(() => {
    if (definition) return definition;
    if (filmSpec) return compileFilm(filmSpec);
    return null;
  }, [definition, filmSpec]);
  const anim = useTacticalAnimation(resolved, {
    autoplay: autoplay ?? !compact,
    enabled: animated,
    definition: compiledDefinition,
  });
  const presentationMode = resolvePresentationMode(
    showAuthor,
    showDebug,
    anim.coachMode,
    forceCoach,
  );
  const showStructuralZones = (presentationMode === "debug" || presentationMode === "author") && !muteVisual;

  const frame = anim.frame;
  const uid = resolved.id;
  const useAnim = Boolean(animated && anim.animationOn && frame);

  useEffect(() => {
    try {
      const fromProp = typeof seekMs === "number" && Number.isFinite(seekMs) ? seekMs : null;
      const raw = new URLSearchParams(window.location.search).get("seekMs");
      const fromUrl = raw != null ? Number(raw) : NaN;
      const ms = fromProp ?? (Number.isFinite(fromUrl) && fromUrl >= 0 ? fromUrl : null);
      if (ms == null || ms < 0) return;
      const seek = anim.seekToMs;
      const t = window.setTimeout(() => seek(ms), fromProp != null ? 120 : 400);
      return () => window.clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [anim.seekToMs, resolved.id, seekMs]);

  // Proof/QA seek helpers — broadcast to every mounted instance of the film
  useEffect(() => {
    const seek = anim.seekToMs;
    const w = window as unknown as {
      __ZVV_SEEK__?: (ms: number) => void;
      __ZVV_SEEK_CONNECTED_TEAM__?: (ms: number) => void;
      __ZVV_SEEK_PRESS_BAD__?: (ms: number) => void;
      __ZVV_SEEK_PRESS_GOOD__?: (ms: number) => void;
      __ZVV_SEEK_PRESS_BAD_BAG__?: Set<(ms: number) => void>;
      __ZVV_SEEK_PRESS_GOOD_BAG__?: Set<(ms: number) => void>;
    };
    const fn = (ms: number) => seek(ms);
    if (resolved.id.startsWith("fdl-gs-inside-close") || resolved.id === "connected-team") {
      w.__ZVV_SEEK__ = fn;
      if (resolved.id === "connected-team") w.__ZVV_SEEK_CONNECTED_TEAM__ = fn;
      return () => {
        if (w.__ZVV_SEEK__ === fn) delete w.__ZVV_SEEK__;
        if (resolved.id === "connected-team" && w.__ZVV_SEEK_CONNECTED_TEAM__ === fn) {
          delete w.__ZVV_SEEK_CONNECTED_TEAM__;
        }
      };
    }
    if (resolved.id === "press-bad") {
      const bag = (w.__ZVV_SEEK_PRESS_BAD_BAG__ ??= new Set());
      bag.add(fn);
      w.__ZVV_SEEK_PRESS_BAD__ = (ms: number) => {
        for (const f of bag) f(ms);
      };
      return () => {
        bag.delete(fn);
        if (bag.size === 0) {
          delete w.__ZVV_SEEK_PRESS_BAD__;
          delete w.__ZVV_SEEK_PRESS_BAD_BAG__;
        }
      };
    }
    if (resolved.id === "press-good") {
      const bag = (w.__ZVV_SEEK_PRESS_GOOD_BAG__ ??= new Set());
      bag.add(fn);
      w.__ZVV_SEEK_PRESS_GOOD__ = (ms: number) => {
        for (const f of bag) f(ms);
      };
      return () => {
        bag.delete(fn);
        if (bag.size === 0) {
          delete w.__ZVV_SEEK_PRESS_GOOD__;
          delete w.__ZVV_SEEK_PRESS_GOOD_BAG__;
        }
      };
    }
  }, [anim.seekToMs, resolved.id]);

  // Author/debug only — motion continuity samples at scene boundaries (never Academy).
  useEffect(() => {
    if (resolved.id !== "connected-team") return;
    if (presentationMode !== "author" && presentationMode !== "debug") return;
    try {
      const samples = auditConnectedTeamMotionBoundaries(100);
      (window as unknown as { __ZVV_MOTION_AUDIT__?: unknown }).__ZVV_MOTION_AUDIT__ = samples;
    } catch {
      /* ignore */
    }
  }, [resolved.id, presentationMode]);

  const players = resolved.players.map((player) => {
    const at = useAnim && frame ? frame.playerAt[player.id] ?? player.at : player.at;
    const hasBall = useAnim && frame ? frame.holderId === player.id : player.hasBall;
    const highlighted =
      useAnim && frame ? frame.highlightedPlayerIds.includes(player.id) : false;
    return { ...player, at, hasBall, highlighted };
  });

  const holder = players.find((p) => p.hasBall);
  const ballAt =
    useAnim && frame
      ? frame.ball
      : holder
        ? ballBesideHolder(holder.at)
        : resolved.ball;

  const lines = useAnim && frame ? frame.lines : resolved.lines;
  const zones = useAnim && frame ? frame.zones : resolved.zones;
  const sampledTrail = useBallTrail(
    ballAt ?? null,
    useAnim && anim.playing && !frame?.ballTrajectory?.inFlight,
  );
  const trailPoints =
    frame?.ballTrajectory?.trail && frame.ballTrajectory.trail.length > 1
      ? frame.ballTrajectory.trail
      : sampledTrail;

  const highlightedIds = (useAnim && frame ? frame.highlightedPlayerIds : []).slice(
    0,
    hierarchyQuiet ? 1 : 3,
  );
  const primaryId = highlightedIds[0];
  const secondaryIds = new Set(hierarchyQuiet ? [] : highlightedIds.slice(1, 3));

  const presetId = inferPresetId(resolved.id, frame?.statusLabel);
  const preset = useMemo(() => {
    if (!compact) return TACTICAL_PRESETS[presetId];
    const isGood = [
      "solo-support",
      "blind-press",
      "forward-relocate",
      "press-good",
      "ta-rb-support",
      "gr-l6-recover",
      "in-10-tempo",
      "me-10-refocus",
      "kw-choice-relocate",
      "gr-moment-teammate-good",
      "gr-moment-sub-good",
      "gr-moment-disagree-good",
    ].includes(resolved.id);
    return TACTICAL_PRESETS[isGood ? "comparison-good" : "comparison-bad"];
  }, [compact, presetId, resolved.id]);

  const focusPoints = useMemo(() => {
    const pts: TacticalPoint[] = [];
    if (cameraMode === "full") return pts;

    const followIds = frame?.cameraHint?.followPlayerIds;
    if (followIds?.length) {
      if (ballAt) pts.push(ballAt);
      for (const id of followIds) {
        const p = players.find((x) => x.id === id);
        if (p) pts.push(p.at);
      }
      return pts;
    }

    if (cameraMode === "press-detail") {
      if (ballAt) pts.push(ballAt);
      for (const id of [
        "opp.lb",
        "opp.8",
        "opp.cbL",
        "opp.lw",
        "us.RW",
        "us.R6",
        "us.L6",
        "us.RB",
        "us.RCV",
        "us.10",
      ]) {
        const p = players.find((x) => x.id === id);
        if (p) pts.push(p.at);
      }
      return pts;
    }
    if (ballAt) pts.push(ballAt);
    // Keep back three + L6 in frame for academy head visuals
    if (resolved.id === "connected-team" || resolved.id === "kw-r6-ball") {
      for (const id of ["us.LB", "us.LCV", "us.RCV", "us.L6", "us.RW", "us.LW"]) {
        const p = players.find((x) => x.id === id);
        if (p) pts.push(p.at);
      }
    }
    for (const p of players) {
      if (p.highlighted || p.hasBall) pts.push(p.at);
    }
    const progress = frame?.progress ?? 0;
    if (progress > 0.88 || !useAnim || !anim.playing) {
      if (resolved.id === "connected-team" || resolved.id === "kw-r6-ball") return pts;
      return pts.slice(0, 1);
    }
    return pts;
  }, [
    ballAt,
    players,
    frame?.progress,
    frame?.cameraHint?.followPlayerIds,
    useAnim,
    anim.playing,
    resolved.id,
    cameraMode,
  ]);

  const targetVb = useMemo(() => {
    if (cameraMode === "full") return fullViewBox();
    if (cameraMode === "press-detail" && !frame?.cameraHint?.followPlayerIds?.length) {
      // Fixed teaching crop — not computed from all markers (that collapses to full pitch).
      return fieldPercentRectToViewBox(PRESS_V2_DETAIL_FIELD_RECT);
    }
    if (!useAnim || anim.systemPrefersReducedMotion) return fullViewBox();
    return computeFocusViewBox(focusPoints, preset, anim.systemPrefersReducedMotion);
  }, [
    focusPoints,
    preset,
    useAnim,
    anim.systemPrefersReducedMotion,
    cameraMode,
    frame?.cameraHint?.followPlayerIds,
  ]);

  const viewBox = useSmoothedViewBox(targetVb, anim.systemPrefersReducedMotion || !useAnim);

  const phaseLabel = (frame?.statusLabel ?? "Situatie").toUpperCase();
  const teaching = frame?.teachingPoint;

  return (
    <figure
      ref={anim.rootRef}
      className={cn("space-y-2.5", className)}
      data-situation-id={resolved.id}
      data-visual-system="v2-premium"
      data-visual-preset={preset.id}
      data-presentation-mode={presentationMode}
      data-ball-trajectory-count={String(frame?.activeBallTrajectoryCount ?? 0)}
      data-ball-trajectory-id={frame?.ballTrajectory?.id ?? ""}
      data-anim-playing={anim.playing ? "1" : "0"}
      data-animation-enabled={anim.animationOn ? "true" : "false"}
      data-animation-playing={anim.playing ? "true" : "false"}
      data-animation-progress={(frame?.progress ?? 0).toFixed(3)}
      data-animation-phase={frame?.statusLabel ?? "Begin"}
      data-animation-trigger={frame?.isTrigger ? "true" : "false"}
      data-engine="tactical-animation-engine"
      data-system-reduced-motion={anim.systemPrefersReducedMotion ? "true" : "false"}
      data-user-animation-preference={anim.userAnimationPreference}
    >
      <figcaption className={resolved.id === "fdl-gs-inside-close-live" ? "sr-only" : undefined}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{resolved.eyebrow}</p>
        <p
          className={cn(
            "mt-1 font-[family-name:var(--font-display)] tracking-wide text-zvv-ink",
            compact ? "text-lg md:text-xl" : "text-xl md:text-2xl",
          )}
        >
          {resolved.title}
        </p>
        {!compact && resolved.subtitle ? (
          <p className="mt-1 max-w-2xl text-sm leading-snug text-zvv-muted">{resolved.subtitle}</p>
        ) : null}
      </figcaption>

      <div className={cn(TACTICAL_SURFACES.analysisPanel, compact && "rounded-xl")}>
        <div className={cn(TACTICAL_SURFACES.analysisInset, "relative")}>
          {orientation ? (
            <TacticalOrientationChrome orientation={orientation} compact={compact} />
          ) : null}
          {/* Phase caption — muted on Golden Session live film (mute-test: animation teaches). */}
          {!muteVisual &&
          animated &&
          anim.animationOn &&
          (phaseLabel || teaching) &&
          resolved.id !== "fdl-gs-inside-close-live" ? (
            <div
              className={cn(
                "pointer-events-none absolute left-2 top-2 z-10 max-w-[min(100%,18rem)]",
                TACTICAL_SURFACES.phaseChip,
              )}
              data-testid="animation-phase-caption"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{phaseLabel}</p>
              {teaching ? (
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-100">{teaching}</p>
              ) : null}
            </div>
          ) : null}

          <svg
            viewBox={viewBoxToString(viewBox)}
            role="img"
            aria-label={`${resolved.eyebrow}: ${resolved.title}${useAnim && frame ? ` — ${frame.statusLabel}` : ""}`}
            className="h-auto w-full"
            style={{ aspectRatio: `${TACTICAL_VIEWBOX.width} / ${TACTICAL_VIEWBOX.height}` }}
          >
            <TacticalPitchBase uid={uid} />
            <TacticalZoneLayer
              zones={zones}
              highlightedIndexes={useAnim && frame ? frame.highlightedZoneIndexes : undefined}
              showStructuralZones={showStructuralZones}
            />
            {showAuthor ? <TacticalAuthoringGrid /> : null}
            <TacticalLineLayer lines={lines} uid={uid} />
            {players.map((player) => {
              const engineOrientation = frame?.orientationAt?.[player.id];
              const authored =
                engineOrientation ??
                getAuthoredOrientation(resolved.id, player.id, frame?.activeStepId) ??
                (() => {
                  const pressO = getPressV2Orientation(resolved.id, player.id);
                  if (!pressO) return undefined;
                  return {
                    facingAngleDeg: pressO.facingAngleDeg,
                    bodyShape: pressO.bodyShape,
                    visionTarget: { type: "ball" as const },
                    receivingFoot: pressO.receivingFoot,
                  };
                })();
              const faceTarget =
                ballAt ?? { x: player.at.x + (player.team === "us" ? 8 : -8), y: player.at.y };
              const facing =
                authored?.facingAngleDeg ??
                facingToward(
                  player.at,
                  player.hasBall ? { x: player.at.x + 12, y: player.at.y } : faceTarget,
                );
              const isGoldenFilm = resolved.id.startsWith("fdl-gs-inside-close");
              /** Golden Session: gaze only on decision cast — never all 22. */
              const goldenGazeIds = new Set(["us.RW", "opp.lb", "opp.8", "opp.cbL"]);
              const showGaze = isGoldenFilm
                ? Boolean(
                    frame &&
                      frame.phase !== "initial" &&
                      goldenGazeIds.has(player.id) &&
                      (player.id === "us.RW" ||
                        player.hasBall ||
                        frame.highlightedPlayerIds.includes(player.id)),
                  )
                : frame?.phase !== "initial" &&
                  (presentationMode === "academy" ||
                    presentationMode === "coach" ||
                    presentationMode === "author" ||
                    presentationMode === "debug") &&
                  (player.id === primaryId || Boolean(player.hasBall)) &&
                  !(hierarchyQuiet && player.id !== primaryId && !player.hasBall);
              const showFoot =
                Boolean(authored?.receivingFoot) &&
                (Boolean(player.hasBall) ||
                  player.id === primaryId ||
                  (isGoldenFilm && player.id === "opp.lb" && frame?.activeStepId?.includes("touch")));
              return (
                <TacticalPlayer
                  key={player.id}
                  player={player}
                  highlighted={
                    player.id === primaryId ||
                    (player.highlighted && (!hierarchyQuiet || isGoldenFilm))
                  }
                  secondary={
                    hierarchyQuiet && !isGoldenFilm
                      ? player.id !== primaryId && !player.hasBall
                      : secondaryIds.has(player.id)
                  }
                  facingDeg={facing}
                  showGazeCone={showGaze}
                  bodyShape={authored?.bodyShape}
                  receivingFoot={authored?.receivingFoot}
                  showReceivingFoot={showFoot}
                />
              );
            })}
            {(showDebug || showAuthor) &&
            (() => {
              const releases = getAuthoredPassReleases(resolved.id);
              const near = releases.find((r) => Math.abs((anim.timeMs ?? 0) - r.releaseTimeMs) < 400);
              if (!near || !frame) return null;
              const phase = getAuthoredPhase(resolved.id, frame.activeStepId);
              const brief = getAuthoredBrief(resolved.id);
              if (!phase || !brief) return null;
              const recv = frame.playerAt[near.toId];
              if (!recv) return null;
              const opps = Object.entries(frame.playerAt)
                .filter(([id]) => id.startsWith("opp."))
                .map(([id, at]) => ({ id, at }));
              const ev = evaluateOffsideAtRelease({
                sequenceId: resolved.id,
                phaseId: near.phaseId,
                releaseTimeMs: near.releaseTimeMs,
                passerId: near.fromId,
                receiverId: near.toId,
                ballPosition: frame.ball ?? recv,
                receiverPosition: recv,
                opponentPositions: opps,
                attackDirection: brief.attackDirection,
              });
              return (
                <OffsideReleaseOverlay
                  receiverAt={recv}
                  ballAt={frame.ball ?? recv}
                  secondLastX={ev.secondLastDefenderX}
                  label={`${formatOffsideLabel(ev)} @${near.releaseTimeMs}ms`}
                />
              );
            })()}
            {ballAt ? (
              <TacticalBall at={ballAt} trail={useAnim && anim.playing} trailPoints={trailPoints} />
            ) : null}
          </svg>
        </div>
      </div>

      {animated && anim.animation && showControls ? (
        <TacticalAnimationControls
          playing={anim.playing}
          progress={frame?.progress ?? 0}
          statusLabel={frame?.statusLabel ?? "Begin"}
          teachingPoint={frame?.teachingPoint}
          animationOn={anim.animationOn}
          userAnimationPreference={anim.userAnimationPreference}
          systemPrefersReducedMotion={anim.systemPrefersReducedMotion}
          playbackRate={anim.playbackRate}
          coachMode={anim.coachMode}
          showStepControls={anim.showStepControls}
          durationMs={anim.animation.durationMs}
          timeMs={anim.timeMs}
          isTrigger={frame?.isTrigger}
          onToggle={anim.toggle}
          onReplay={anim.replay}
          onSetPreference={anim.setUserAnimationPreference}
          onSetPlaybackRate={anim.setPlaybackRate}
          onSetCoachMode={anim.setCoachMode}
          onPrevStep={anim.goToPrevStep}
          onNextStep={anim.goToNextStep}
          onSeekMs={anim.seekToMs}
        />
      ) : null}

      {showAuthor && animated && frame ? (
        <div
          className="rounded-lg border border-sky-500/50 bg-sky-950/90 p-2 font-mono text-[10px] text-sky-50"
          data-animation-author="1"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-sky-300">
              Authoring — {resolved.id} / {frame.statusLabel} @ {anim.timeMs}ms
            </span>
            <button
              type="button"
              className="rounded border border-sky-400/60 px-2 py-0.5 text-sky-100 hover:bg-sky-800"
              onClick={() => {
                const map = Object.fromEntries(
                  Object.entries(frame.playerAt).map(([id, at]) => [
                    id,
                    { x: Math.round(at.x * 10) / 10, y: Math.round(at.y * 10) / 10 },
                  ]),
                );
                void navigator.clipboard.writeText(JSON.stringify(map, null, 2));
              }}
            >
              Copy position JSON
            </button>
            <button
              type="button"
              className="rounded border border-sky-400/60 px-2 py-0.5 text-sky-100 hover:bg-sky-800"
              onClick={() => {
                const phase = getAuthoredPhase(resolved.id, frame.activeStepId);
                if (!phase) return;
                const payload = {
                  phaseId: phase.id,
                  ballHolder: phase.ballHolder,
                  ballAt: phase.ballAt,
                  usShape: Object.fromEntries(
                    Object.entries(phase.usShape).map(([id, p]) => [
                      id,
                      { at: p.at, lane: p.lane, zone: p.zone, role: p.role, orientation: p.orientation },
                    ]),
                  ),
                };
                void navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
              }}
            >
              Export phase JSON
            </button>
            <span className="text-sky-400/80">mode={anim.animation?.positioningMode ?? "—"}</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {getAuthoredPassReleases(resolved.id).map((r) => (
              <button
                key={`${r.phaseId}-${r.releaseTimeMs}`}
                type="button"
                className="rounded border border-amber-400/50 px-2 py-0.5 text-amber-100 hover:bg-amber-900/60"
                onClick={() => anim.seekToMs(r.releaseTimeMs)}
              >
                Ga naar passmoment {r.fromId}→{r.toId} ({r.releaseTimeMs}ms)
              </button>
            ))}
          </div>
          {(() => {
            const phase = getAuthoredPhase(resolved.id, frame.activeStepId);
            const primary = primaryId ? frame.playerAt[primaryId] : null;
            const o = primaryId
              ? getAuthoredOrientation(resolved.id, primaryId, frame.activeStepId)
              : undefined;
            const lb = frame.playerAt["us.LB"];
            const lcv = frame.playerAt["us.LCV"];
            const rcv = frame.playerAt["us.RCV"];
            const six = frame.playerAt["us.L6"];
            return (
              <div className="mb-2 grid gap-2 border-b border-sky-700/60 pb-2 md:grid-cols-2">
                {primaryId && primary && o ? (
                  <div className="space-y-0.5 text-sky-100">
                    <p className="font-bold text-sky-300">PLAYER {primaryId}</p>
                    <p>
                      Pos {primary.x.toFixed(1)},{primary.y.toFixed(1)} · {phase?.usShape[primaryId]?.lane} ·{" "}
                      {phase?.usShape[primaryId]?.zone}
                    </p>
                    <p>Facing {o.facingAngleDeg}° · {o.bodyShape}</p>
                    <p>Vision {JSON.stringify(o.visionTarget)}</p>
                    <p>
                      Foot {o.receivingFoot ?? "—"} · Next {o.nextActionIntent ?? "—"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sky-400">Selecteer highlight voor player inspect</p>
                )}
                {lb && lcv && rcv ? (
                  <div className="space-y-0.5 text-sky-100">
                    <p className="font-bold text-sky-300">REST DEFENCE</p>
                    <p>
                      LB–LCV {dist(lb, lcv).toFixed(1)} · LCV–RCV {dist(lcv, rcv).toFixed(1)}
                    </p>
                    <p>
                      Width y {(Math.max(lb.y, lcv.y, rcv.y) - Math.min(lb.y, lcv.y, rcv.y)).toFixed(1)}
                    </p>
                    {six ? (
                      <p>6-to-line {(six.x - (lcv.x + rcv.x) / 2).toFixed(1)}</p>
                    ) : null}
                    <p>Threats {(getAuthoredBrief(resolved.id)?.transitionThreats ?? []).join(", ")}</p>
                  </div>
                ) : null}
              </div>
            );
          })()}
          {(() => {
            const holder = frame.holderId;
            const from = holder ? frame.playerAt[holder] : frame.ball;
            if (!from || !holder) return null;
            const opps = Object.entries(frame.playerAt)
              .filter(([id]) => id.startsWith("opp."))
              .map(([id, at]) => ({ id, at }));
            const targets = ["us.10", "us.SP", "us.RW", "us.LW", "us.R6", "us.L6", "us.RB", "us.RCV"].filter(
              (id) => id !== holder && frame.playerAt[id],
            );
            return (
              <div className="mb-2 space-y-0.5 border-b border-sky-700/60 pb-2 text-sky-100">
                <p className="font-bold text-sky-300">PASS LANE from {holder}</p>
                {targets.map((toId) => {
                  const ev = evaluatePassLane(from, frame.playerAt[toId]!, opps);
                  return (
                    <p key={toId}>
                      → {toId}:{" "}
                      <span
                        className={
                          ev.status === "blocked" || ev.status === "interceptable"
                            ? "text-rose-300"
                            : ev.status === "pressured"
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }
                      >
                        {passLaneLabel(ev.status)}
                      </span>
                      {ev.nearestOpponentId
                        ? ` (${ev.nearestOpponentId} d=${ev.nearestDistance.toFixed(1)})`
                        : ""}
                    </p>
                  );
                })}
              </div>
            );
          })()}
          <pre className="max-h-40 overflow-auto leading-snug">
            {Object.entries(frame.playerAt)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(
                ([id, at]) =>
                  `${id.padEnd(12)} ${at.x.toFixed(1).padStart(5)},${at.y.toFixed(1).padStart(5)}`,
              )
              .join("\n")}
          </pre>
        </div>
      ) : null}

      {showDebug && animated && anim.animation ? (
        <pre
          className="overflow-auto rounded-lg border border-amber-500/40 bg-amber-50/95 p-2 font-mono text-[10px] leading-snug text-amber-950"
          data-anim-debug={resolved.id}
          data-tactical-audit="1"
        >
          {(() => {
            const ts = frame?.tacticalState;
            const compactN = frame ? teamCompactness(frame.playerAt) : { width: 0, length: 0 };
            const ll = frame ? lastLineHeight(frame.playerAt) : undefined;
            const ball = frame?.ball ?? resolved.ball ?? { x: 50, y: 50 };
            const gaps = frame ? measureLineGapsUs(frame.playerAt) : { attackMidfieldGap: 0, midfieldDefenseGap: 0 };
            const brief = getCollectiveBrief(resolved.id);
            const audit = frame
              ? auditCollectiveFrame({
                  timeMs: Math.round((frame.progress ?? 0) * (anim.animation?.durationMs ?? 0)),
                  ball,
                  playerAt: frame.playerAt,
                  pressureOnBall: ts?.primaryPressurePlayerId ? "controlled" : "passive",
                  depthThreat: (ts?.depthThreatPlayerIds?.length ?? 0) > 1 ? "active" : (ts?.depthThreatPlayerIds?.length ?? 0) === 1 ? "limited" : "none",
                  ballZone: ts?.ballZone,
                })
              : null;
            const collisions: string[] = [];
            if (frame) {
              const ids = Object.keys(frame.playerAt);
              for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                  const a = ids[i]!;
                  const b = ids[j]!;
                  if (a.startsWith("us.") === b.startsWith("us.")) continue;
                  const d = dist(frame.playerAt[a]!, frame.playerAt[b]!);
                  if (d < SAFE_PLAYER_RADIUS * 0.75) collisions.push(`${a}~${b}`);
                }
              }
            }
            return `id=${resolved.id} visual=v2 preset=${preset.id} vb=${viewBoxToString(viewBox)}
playing=${anim.playing} phase=${frame?.statusLabel ?? "—"}
collisionWarnings=${collisions.length ? collisions.slice(0, 6).join("; ") : "none"}
lastLine=${ll?.toFixed(1) ?? "—"} compact=${compactN.length.toFixed(0)}x${compactN.width.toFixed(0)}
lineGaps mid-def=${gaps.midfieldDefenseGap.toFixed(0)} atk-mid=${gaps.attackMidfieldGap.toFixed(0)}
pressure=${audit?.pressureOnBall ?? "—"} depth=${audit?.depthThreat ?? "—"}
lastLineDecision=${audit?.lastLineDecision ?? "—"} rest=${audit?.restDefenseStructure ?? "—"}
oppForm=${brief.opponentFormation} block=${brief.opponentBrief.block}
threats=${brief.transitionThreatPlayerIds.join(",") || "—"}
shift=${frame && compactN.length <= 45 && gaps.midfieldDefenseGap <= 18 ? "ok" : "check"}
primary=${ts?.primaryPressurePlayerId ?? "—"}`;
          })()}
        </pre>
      ) : null}

      {showLegend ? <TacticalLegend /> : null}
    </figure>
  );
}
