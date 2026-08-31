/**
 * Eén canvas, korte choreografie, daarna volledig stil.
 * Geen permanente rAF, geen honderden DOM-nodes.
 */
import type { CelebrationKind } from "@/lib/home/celebration-visual";
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_HOLD_AT_MS,
  celebrationColors,
  celebrationParticleBudget,
} from "@/lib/home/celebration-visual";

type ParticleKind = "confetti" | "streamer" | "spark";

type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  maxLife: number;
  wobble: number;
  wobbleSpeed: number;
};

export type CelebrationEngineHandle = {
  stop: () => void;
  particleCount: () => number;
};

function pick<T>(items: readonly T[], rnd: () => number): T {
  return items[Math.floor(rnd() * items.length)]!;
}

function spawnConfetti(
  list: Particle[],
  x: number,
  y: number,
  colors: readonly string[],
  count: number,
  power: number,
  angle: number,
  spread: number,
  rnd: () => number,
): void {
  for (let i = 0; i < count; i += 1) {
    const a = angle + (rnd() - 0.5) * spread;
    const spd = power * (0.55 + rnd() * 0.7);
    list.push({
      kind: "confetti",
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      rot: rnd() * Math.PI * 2,
      vr: (rnd() - 0.5) * 0.28,
      w: 5 + rnd() * 7,
      h: 8 + rnd() * 11,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 2200 + rnd() * 2400,
      wobble: rnd() * Math.PI * 2,
      wobbleSpeed: 0.04 + rnd() * 0.05,
    });
  }
}

function spawnStreamers(
  list: Particle[],
  width: number,
  colors: readonly string[],
  count: number,
  rnd: () => number,
): void {
  for (let i = 0; i < count; i += 1) {
    const fromLeft = rnd() < 0.5;
    list.push({
      kind: "streamer",
      x: fromLeft ? width * (0.04 + rnd() * 0.18) : width * (0.78 + rnd() * 0.18),
      y: -20 - rnd() * 40,
      vx: (fromLeft ? 1 : -1) * (0.4 + rnd() * 0.7),
      vy: 1.6 + rnd() * 1.4,
      rot: rnd() * Math.PI,
      vr: (rnd() - 0.5) * 0.08,
      w: 3 + rnd() * 2,
      h: 42 + rnd() * 36,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 3200 + rnd() * 1800,
      wobble: rnd() * Math.PI * 2,
      wobbleSpeed: 0.06 + rnd() * 0.05,
    });
  }
}

function spawnSparks(
  list: Particle[],
  x: number,
  y: number,
  colors: readonly string[],
  count: number,
  rnd: () => number,
): void {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.2;
    const spd = 2.4 + rnd() * 3.4;
    list.push({
      kind: "spark",
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      rot: 0,
      vr: 0,
      w: 2 + rnd() * 2.2,
      h: 2 + rnd() * 2.2,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 700 + rnd() * 500,
      wobble: 0,
      wobbleSpeed: 0,
    });
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const t = p.life / p.maxLife;
  const fade = t < 0.72 ? 1 : 1 - (t - 0.72) / 0.28;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = Math.max(0, fade);
  if (p.kind === "spark") {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, fade) * 0.28;
    ctx.beginPath();
    ctx.arc(0, 0, p.w * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.beginPath();
    ctx.arc(0, 0, p.w, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "streamer") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 1.5);
    ctx.fill();
  }
  ctx.restore();
}

function stepParticle(p: Particle, dt: number): void {
  p.life += dt;
  p.wobble += p.wobbleSpeed;
  const drag = p.kind === "spark" ? 0.985 : 0.992;
  p.vx *= drag;
  p.vy *= drag;
  p.vy += p.kind === "spark" ? 0.018 : 0.042;
  p.x += p.vx + (p.kind === "streamer" ? Math.sin(p.wobble) * 0.7 : Math.sin(p.wobble) * 0.18);
  p.y += p.vy;
  p.rot += p.vr;
}

type Cue = { at: number; run: () => void };

function buildCues(
  kind: CelebrationKind,
  width: number,
  height: number,
  particles: Particle[],
  rnd: () => number,
): Cue[] {
  const colors = celebrationColors(kind);
  const budget = celebrationParticleBudget(kind, width);
  const spotlightX = width * 0.74;
  const spotlightY = height * 0.36;
  const left = width * 0.08;
  const right = width * 0.92;
  const midY = height * 0.42;
  const top = height * 0.08;

  const rain = (count: number, y = -12) => {
    for (let i = 0; i < count; i += 1) {
      spawnConfetti(
        particles,
        width * (0.06 + rnd() * 0.88),
        y,
        colors,
        1,
        2.2 + rnd() * 1.6,
        Math.PI / 2,
        0.7,
        rnd,
      );
    }
  };

  const cannon = (x: number, dir: number, count: number, power: number) => {
    spawnConfetti(particles, x, midY, colors, count, power, dir, 0.9, rnd);
  };

  const cues: Cue[] = [];

  if (kind === "birthday") {
    cues.push(
      {
        at: 0,
        run: () => {
          cannon(left, -0.35, Math.round(budget.confetti * 0.18), 7.2);
          cannon(right, Math.PI + 0.35, Math.round(budget.confetti * 0.18), 7.2);
          rain(Math.round(budget.confetti * 0.16));
          spawnStreamers(particles, width, colors, budget.streamers, rnd);
        },
      },
      {
        at: 380,
        run: () =>
          spawnConfetti(
            particles,
            spotlightX,
            spotlightY,
            colors,
            Math.round(budget.confetti * 0.2),
            6.4,
            -Math.PI / 2,
            2.4,
            rnd,
          ),
      },
      {
        at: 920,
        run: () => {
          spawnSparks(particles, spotlightX, spotlightY - 24, colors, budget.burstSparks, rnd);
          rain(Math.round(budget.confetti * 0.1));
        },
      },
      {
        at: 1880,
        run: () => spawnSparks(particles, width * 0.32, height * 0.38, colors, budget.burstSparks, rnd),
      },
      {
        at: 2860,
        run: () => {
          spawnSparks(particles, width * 0.7, height * 0.3, colors, budget.burstSparks, rnd);
          spawnConfetti(
            particles,
            spotlightX,
            spotlightY + 20,
            colors,
            Math.round(budget.confetti * 0.12),
            5.2,
            -Math.PI / 2,
            2.1,
            rnd,
          );
        },
      },
    );
  } else if (kind === "victory") {
    cues.push(
      {
        at: 0,
        run: () => {
          spawnConfetti(
            particles,
            width * 0.5,
            top,
            colors,
            Math.round(budget.confetti * 0.28),
            9.2,
            Math.PI / 2,
            2.8,
            rnd,
          );
          cannon(left, -0.2, Math.round(budget.confetti * 0.16), 8.6);
          cannon(right, Math.PI + 0.2, Math.round(budget.confetti * 0.16), 8.6);
          spawnStreamers(particles, width, colors, budget.streamers, rnd);
        },
      },
      {
        at: 220,
        run: () => rain(Math.round(budget.confetti * 0.18)),
      },
      {
        at: 620,
        run: () => spawnSparks(particles, width * 0.28, height * 0.34, colors, budget.burstSparks, rnd),
      },
      {
        at: 1180,
        run: () => spawnSparks(particles, width * 0.74, height * 0.3, colors, budget.burstSparks, rnd),
      },
      {
        at: 1960,
        run: () => {
          cannon(left, -0.4, Math.round(budget.confetti * 0.1), 7.4);
          cannon(right, Math.PI + 0.4, Math.round(budget.confetti * 0.1), 7.4);
        },
      },
      {
        at: 2680,
        run: () => spawnSparks(particles, width * 0.5, height * 0.28, colors, budget.burstSparks, rnd),
      },
      {
        at: 3900,
        run: () => spawnSparks(particles, width * 0.62, height * 0.4, colors, budget.burstSparks, rnd),
      },
    );
  } else {
    cues.push(
      {
        at: 0,
        run: () => {
          spawnConfetti(
            particles,
            width * 0.5,
            top,
            colors,
            Math.round(budget.confetti * 0.22),
            8.8,
            Math.PI / 2,
            2.6,
            rnd,
          );
          cannon(left, -0.25, Math.round(budget.confetti * 0.14), 8.2);
          cannon(right, Math.PI + 0.25, Math.round(budget.confetti * 0.14), 8.2);
        },
      },
      {
        at: 360,
        run: () => {
          spawnConfetti(
            particles,
            spotlightX,
            spotlightY,
            colors,
            Math.round(budget.confetti * 0.16),
            6.6,
            -Math.PI / 2,
            2.3,
            rnd,
          );
          spawnStreamers(particles, width, colors, budget.streamers, rnd);
        },
      },
      {
        at: 880,
        run: () => spawnSparks(particles, width * 0.3, height * 0.32, colors, budget.burstSparks, rnd),
      },
      {
        at: 1680,
        run: () => spawnSparks(particles, spotlightX, spotlightY - 16, colors, budget.burstSparks, rnd),
      },
      {
        at: 2740,
        run: () => {
          rain(Math.round(budget.confetti * 0.12));
          spawnSparks(particles, width * 0.52, height * 0.26, colors, budget.burstSparks, rnd);
        },
      },
      {
        at: 4200,
        run: () => spawnSparks(particles, width * 0.68, height * 0.38, colors, budget.burstSparks, rnd),
      },
    );
  }

  if (budget.burstCount < cues.filter((c) => c.at > 500).length) {
    return cues.slice(0, Math.max(3, budget.burstCount + 2));
  }
  return cues;
}

export function runClubCelebration(
  canvas: HTMLCanvasElement,
  opts: {
    type: CelebrationKind;
    hold?: boolean;
    width?: number;
    height?: number;
    random?: () => number;
    onDone?: () => void;
  },
): CelebrationEngineHandle {
  const ctx = canvas.getContext("2d");
  const particles: Particle[] = [];
  const timers: number[] = [];
  let raf = 0;
  let stopped = false;
  const rnd = opts.random ?? Math.random;

  const cssW = opts.width ?? (canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1440));
  const cssH = opts.height ?? (canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 900));
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
  }

  const duration = CELEBRATION_DURATION_MS[opts.type];
  const cues = buildCues(opts.type, cssW, cssH, particles, rnd);

  const drawFrame = (elapsed: number) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);
    for (const p of particles) {
      if (p.life >= p.maxLife) continue;
      if (!opts.hold) stepParticle(p, 16);
      else {
        // hold: één fysica-stap-reeks tot het freeze-moment, daarna stil
        void elapsed;
      }
      drawParticle(ctx, p);
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
    particles.length = 0;
    if (ctx) ctx.clearRect(0, 0, cssW, cssH);
    canvas.width = 0;
    canvas.height = 0;
  };

  if (opts.hold) {
    for (const cue of cues) {
      if (cue.at <= CELEBRATION_HOLD_AT_MS) cue.run();
    }
    const steps = Math.round(CELEBRATION_HOLD_AT_MS / 16);
    for (let i = 0; i < steps; i += 1) {
      for (const p of particles) stepParticle(p, 16);
    }
    drawFrame(CELEBRATION_HOLD_AT_MS);
    return {
      stop,
      particleCount: () => particles.length,
    };
  }

  const started = performance.now();
  let last = started;
  let cueIndex = 0;

  const tick = (now: number) => {
    if (stopped) return;
    const elapsed = now - started;
    const dt = Math.min(32, now - last);
    last = now;
    while (cueIndex < cues.length && cues[cueIndex]!.at <= elapsed) {
      cues[cueIndex]!.run();
      cueIndex += 1;
    }
    if (ctx) {
      ctx.clearRect(0, 0, cssW, cssH);
      let i = 0;
      while (i < particles.length) {
        const p = particles[i]!;
        stepParticle(p, dt);
        if (p.life >= p.maxLife || p.y > cssH + 80) {
          particles[i] = particles[particles.length - 1]!;
          particles.pop();
          continue;
        }
        drawParticle(ctx, p);
        i += 1;
      }
    }
    if (elapsed >= duration) {
      stop();
      opts.onDone?.();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return {
    stop,
    particleCount: () => particles.length,
  };
}
