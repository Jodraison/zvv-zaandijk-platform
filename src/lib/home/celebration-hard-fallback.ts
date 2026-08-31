import type { CelebrationKind } from "@/lib/home/celebration-visual";

export const HARD_FALLBACK_COLORS = ["#FFFFFF", "#FFD84D", "#38BDF8", "#F59E0B", "#EAF2FF"] as const;
export const HARD_FALLBACK_Z_INDEX = 2_147_483_000;

export const HARD_FALLBACK_ROOT_STYLE = {
  position: "fixed",
  inset: "0",
  width: "100vw",
  height: "100vh",
  zIndex: HARD_FALLBACK_Z_INDEX,
  pointerEvents: "none",
  overflow: "hidden",
  opacity: 1,
} as const;

export type HardFallbackWave = {
  at: number;
  confetti: number;
  streamers: number;
  fireworks: number;
};

export function hardFallbackDurationMs(kind: CelebrationKind): number {
  if (kind === "birthday") return 12_000;
  if (kind === "victory") return 15_000;
  return 16_000;
}

export function hardFallbackWaves(kind: CelebrationKind, width: number): HardFallbackWave[] {
  const mobile = width <= 430;
  if (kind === "birthday") {
    return mobile
      ? [
          { at: 0, confetti: 18, streamers: 4, fireworks: 2 },
          { at: 1800, confetti: 12, streamers: 2, fireworks: 0 },
          { at: 3800, confetti: 12, streamers: 2, fireworks: 1 },
          { at: 6200, confetti: 10, streamers: 2, fireworks: 0 },
          { at: 8500, confetti: 10, streamers: 0, fireworks: 1 },
        ]
      : [
          { at: 0, confetti: 26, streamers: 6, fireworks: 2 },
          { at: 1750, confetti: 18, streamers: 3, fireworks: 0 },
          { at: 3750, confetti: 16, streamers: 3, fireworks: 1 },
          { at: 6250, confetti: 12, streamers: 2, fireworks: 0 },
          { at: 8500, confetti: 12, streamers: 2, fireworks: 1 },
        ];
  }
  if (kind === "victory") {
    return mobile
      ? [
          { at: 0, confetti: 22, streamers: 5, fireworks: 2 },
          { at: 1600, confetti: 14, streamers: 3, fireworks: 1 },
          { at: 3600, confetti: 14, streamers: 2, fireworks: 1 },
          { at: 6200, confetti: 12, streamers: 2, fireworks: 1 },
          { at: 9800, confetti: 12, streamers: 2, fireworks: 1 },
        ]
      : [
          { at: 0, confetti: 30, streamers: 8, fireworks: 3 },
          { at: 1600, confetti: 20, streamers: 4, fireworks: 1 },
          { at: 3600, confetti: 18, streamers: 3, fireworks: 1 },
          { at: 6200, confetti: 16, streamers: 3, fireworks: 1 },
          { at: 9800, confetti: 14, streamers: 2, fireworks: 1 },
        ];
  }
  return mobile
    ? [
        { at: 0, confetti: 20, streamers: 5, fireworks: 2 },
        { at: 1800, confetti: 14, streamers: 2, fireworks: 1 },
        { at: 4000, confetti: 14, streamers: 2, fireworks: 1 },
        { at: 7000, confetti: 12, streamers: 2, fireworks: 1 },
        { at: 11000, confetti: 12, streamers: 2, fireworks: 1 },
      ]
    : [
        { at: 0, confetti: 28, streamers: 7, fireworks: 3 },
        { at: 1800, confetti: 18, streamers: 3, fireworks: 1 },
        { at: 4000, confetti: 16, streamers: 3, fireworks: 1 },
        { at: 7000, confetti: 14, streamers: 2, fireworks: 1 },
        { at: 11000, confetti: 14, streamers: 2, fireworks: 1 },
      ];
}

export function hardFallbackPeakConfetti(kind: CelebrationKind, width: number): number {
  return Math.max(...hardFallbackWaves(kind, width).map((w) => w.confetti));
}

function pick<T>(items: readonly T[], rnd: () => number): T {
  return items[Math.floor(rnd() * items.length)]!;
}

function applyInline(el: HTMLElement, styles: Record<string, string | number>): void {
  for (const [key, value] of Object.entries(styles)) {
    el.style.setProperty(key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`), String(value));
  }
}

function runAnimate(
  el: HTMLElement,
  frames: Keyframe[],
  opts: KeyframeAnimationOptions,
): { cancel: () => void } {
  if (typeof el.animate === "function") {
    const anim = el.animate(frames, opts);
    return { cancel: () => anim.cancel() };
  }
  el.style.transform = String(frames[frames.length - 1]?.transform ?? "");
  el.style.opacity = String(frames[frames.length - 1]?.opacity ?? "1");
  return { cancel: () => undefined };
}

export type HardFallbackHandle = {
  stop: () => void;
  childCount: () => number;
};

/**
 * Native DOM celebration. Visibility is 100% inline styles + WAAPI.
 * No CSS classes, keyframes, Tailwind, or canvas required.
 */
export function runHardFallback(
  root: HTMLElement,
  opts: {
    kind: CelebrationKind;
    width?: number;
    height?: number;
    hold?: boolean;
    random?: () => number;
  },
): HardFallbackHandle {
  const rnd = opts.random ?? Math.random;
  const width = opts.width ?? (typeof window !== "undefined" ? window.innerWidth : 1440);
  const height = opts.height ?? (typeof window !== "undefined" ? window.innerHeight : 900);
  const waves = hardFallbackWaves(opts.kind, width);
  const timers: number[] = [];
  const running: Array<{ cancel: () => void }> = [];
  let stopped = false;

  const spawnConfetti = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      const fromCannon = i < Math.round(count * 0.45);
      const fromLeft = i % 2 === 0;
      const el = document.createElement("div");
      const w = 10 + Math.round(rnd() * 6);
      const h = 16 + Math.round(rnd() * 10);
      const startX = fromCannon ? (fromLeft ? width * 0.08 : width * 0.9) : width * (0.04 + rnd() * 0.92);
      const startY = fromCannon ? height * 0.42 : -30 - rnd() * 40;
      const drift = (rnd() - 0.5) * 220;
      const rot = 220 + rnd() * 420;
      applyInline(el, {
        position: "absolute",
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: pick(HARD_FALLBACK_COLORS, rnd),
        borderRadius: `${2 + Math.round(rnd() * 2)}px`,
        opacity: 1,
        willChange: "transform, opacity",
        pointerEvents: "none",
      });
      root.appendChild(el);
      const duration = 4200 + rnd() * 2800;
      running.push(
        runAnimate(
          el,
          [
            { transform: "translate3d(0,-24px,0) rotate(0deg)", opacity: 1 },
            { transform: `translate3d(${drift}px,${height + 160}px,0) rotate(${rot}deg)`, opacity: 1 },
          ],
          { duration, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
        ),
      );
    }
  };

  const spawnStreamers = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      const fromLeft = i % 2 === 0;
      const el = document.createElement("div");
      const startX = fromLeft ? width * (0.04 + rnd() * 0.16) : width * (0.78 + rnd() * 0.16);
      applyInline(el, {
        position: "absolute",
        left: `${startX}px`,
        top: "-20px",
        width: `${8 + Math.round(rnd() * 4)}px`,
        height: `${90 + Math.round(rnd() * 50)}px`,
        backgroundColor: pick(HARD_FALLBACK_COLORS, rnd),
        borderRadius: "999px",
        opacity: 1,
        willChange: "transform, opacity",
        pointerEvents: "none",
      });
      root.appendChild(el);
      const drift = (fromLeft ? 1 : -1) * (40 + rnd() * 70);
      running.push(
        runAnimate(
          el,
          [
            { transform: "translate3d(0,0,0) rotate(-8deg)", opacity: 1 },
            { transform: `translate3d(${drift}px,${height + 140}px,0) rotate(14deg)`, opacity: 1 },
          ],
          { duration: 5200 + rnd() * 2200, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" },
        ),
      );
    }
  };

  const spawnFirework = (originX: number, originY: number) => {
    const core = document.createElement("div");
    applyInline(core, {
      position: "absolute",
      left: `${originX - 22}px`,
      top: `${originY - 22}px`,
      width: "44px",
      height: "44px",
      backgroundColor: "#FFFFFF",
      borderRadius: "999px",
      opacity: 1,
      pointerEvents: "none",
    });
    root.appendChild(core);
    running.push(
      runAnimate(
        core,
        [
          { transform: "scale(0.2)", opacity: 1 },
          { transform: "scale(2.4)", opacity: 0 },
        ],
        { duration: 720, easing: "ease-out", fill: "forwards" },
      ),
    );

    const sparks = 12;
    const reach = 70 + rnd() * 50;
    for (let i = 0; i < sparks; i += 1) {
      const spark = document.createElement("div");
      const angle = (i / sparks) * Math.PI * 2;
      applyInline(spark, {
        position: "absolute",
        left: `${originX - 3}px`,
        top: `${originY - 10}px`,
        width: "6px",
        height: "22px",
        backgroundColor: pick(["#FFFFFF", "#FFD84D", "#38BDF8"], rnd),
        borderRadius: "999px",
        opacity: 1,
        willChange: "transform, opacity",
        pointerEvents: "none",
      });
      root.appendChild(spark);
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach;
      running.push(
        runAnimate(
          spark,
          [
            { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
            { transform: `translate3d(${dx}px,${dy}px,0) scale(0.4)`, opacity: 0 },
          ],
          { duration: 780 + rnd() * 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
        ),
      );
    }
  };

  const runWave = (wave: HardFallbackWave) => {
    if (stopped) return;
    spawnConfetti(wave.confetti);
    spawnStreamers(wave.streamers);
    const spots = [
      { x: width * 0.16, y: height * 0.22 },
      { x: width * 0.78, y: height * 0.24 },
      { x: width * 0.52, y: height * 0.3 },
    ];
    for (let i = 0; i < wave.fireworks; i += 1) {
      const spot = spots[i % spots.length]!;
      spawnFirework(spot.x, spot.y);
    }
  };

  if (opts.hold) {
    runWave(waves[0]!);
    return {
      stop: () => {
        stopped = true;
      },
      childCount: () => root.childElementCount,
    };
  }

  for (const wave of waves) {
    if (wave.at === 0) runWave(wave);
    else timers.push(window.setTimeout(() => runWave(wave), wave.at));
  }

  const stop = () => {
    if (stopped) return;
    stopped = true;
    for (const id of timers) window.clearTimeout(id);
    for (const anim of running) anim.cancel();
    root.replaceChildren();
  };

  return {
    stop,
    childCount: () => root.childElementCount,
  };
}
