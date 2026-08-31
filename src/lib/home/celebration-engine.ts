/**
 * Eén canvas, zichtbare choreografie, daarna volledig stil.
 * Geen permanente rAF, geen honderden DOM-nodes.
 */
import type { CelebrationKind } from "@/lib/home/celebration-visual";
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_HOLD_AT_MS,
  celebrationColors,
  celebrationParticleBudget,
} from "@/lib/home/celebration-visual";

type ParticleKind = "confetti" | "streamer" | "spark" | "flash" | "ember";

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
    const spd = power * (0.55 + rnd() * 0.75);
    list.push({
      kind: "confetti",
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      rot: rnd() * Math.PI * 2,
      vr: (rnd() - 0.5) * 0.32,
      w: 13 + rnd() * 16,
      h: 18 + rnd() * 16,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 3600 + rnd() * 2800,
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
      x: fromLeft ? width * (0.03 + rnd() * 0.2) : width * (0.76 + rnd() * 0.2),
      y: -24 - rnd() * 50,
      vx: (fromLeft ? 1 : -1) * (0.45 + rnd() * 0.75),
      vy: 1.5 + rnd() * 1.2,
      rot: rnd() * Math.PI,
      vr: (rnd() - 0.5) * 0.09,
      w: 7 + rnd() * 5,
      h: 96 + rnd() * 70,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 4200 + rnd() * 2200,
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
  power = 1,
): void {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.18;
    const spd = (3.8 + rnd() * 5.2) * power;
    list.push({
      kind: "spark",
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      rot: 0,
      vr: 0,
      w: 3.6 + rnd() * 3.2,
      h: 3.6 + rnd() * 3.2,
      color: pick(colors, rnd),
      life: 0,
      maxLife: 1100 + rnd() * 700,
      wobble: 0,
      wobbleSpeed: 0,
    });
  }
}

function spawnFirework(
  list: Particle[],
  x: number,
  y: number,
  colors: readonly string[],
  sparks: number,
  rnd: () => number,
  intensity = 1,
): void {
  list.push({
    kind: "flash",
    x,
    y,
    vx: 0,
    vy: 0,
    rot: 0,
    vr: 0,
    w: 42 * intensity,
    h: 42 * intensity,
    color: "#fff7d6",
    life: 0,
    maxLife: 260 + rnd() * 90,
    wobble: 0,
    wobbleSpeed: 0,
  });
  spawnSparks(list, x, y, colors, sparks, rnd, intensity);
  const embers = Math.max(10, Math.round(sparks * 0.4));
  for (let i = 0; i < embers; i += 1) {
    const a = rnd() * Math.PI * 2;
    const spd = (1.1 + rnd() * 2.8) * intensity;
    list.push({
      kind: "ember",
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd * 0.55 + 0.4,
      rot: 0,
      vr: 0,
      w: 2.6 + rnd() * 2.2,
      h: 2.6 + rnd() * 2.2,
      color: pick(["#ffffff", "#fde68a", "#fbbf24", "#fdba74"], rnd),
      life: 0,
      maxLife: 1400 + rnd() * 900,
      wobble: rnd() * Math.PI * 2,
      wobbleSpeed: 0.03,
    });
  }
}

function fillRounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, w, h);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const t = p.life / p.maxLife;
  const fade = t < 0.68 ? 1 : 1 - (t - 0.68) / 0.32;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = Math.max(0, fade);
  if (p.kind === "flash") {
    const r = p.w * (1.15 - t * 0.35);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.28, "rgba(253,230,138,0.75)");
    glow.addColorStop(1, "rgba(253,230,138,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "spark" || p.kind === "ember") {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, fade) * (p.kind === "spark" ? 0.42 : 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, p.w * (p.kind === "spark" ? 4.6 : 3.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.beginPath();
    ctx.arc(0, 0, p.w * 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "streamer") {
    ctx.fillStyle = p.color;
    fillRounded(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 2);
  } else {
    ctx.fillStyle = p.color;
    fillRounded(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 2);
  }
  ctx.restore();
}

function stepParticle(p: Particle, dt: number): void {
  p.life += dt;
  p.wobble += p.wobbleSpeed;
  if (p.kind === "flash") return;
  const drag = p.kind === "spark" ? 0.982 : p.kind === "ember" ? 0.988 : 0.993;
  p.vx *= drag;
  p.vy *= drag;
  p.vy += p.kind === "spark" ? 0.016 : p.kind === "ember" ? 0.028 : 0.034;
  p.x += p.vx + (p.kind === "streamer" ? Math.sin(p.wobble) * 0.75 : Math.sin(p.wobble) * 0.2);
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
  const spotlightX = width * 0.76;
  const spotlightY = height * 0.34;
  const left = width * 0.08;
  const right = width * 0.92;
  const midY = height * 0.58;
  const top = height * 0.05;
  const heroLeftX = width * 0.18;
  const heroLeftY = height * 0.2;

  const rain = (count: number, y = -14) => {
    for (let i = 0; i < count; i += 1) {
      spawnConfetti(
        particles,
        width * (0.04 + rnd() * 0.92),
        y,
        colors,
        1,
        2.4 + rnd() * 1.8,
        Math.PI / 2,
        0.75,
        rnd,
      );
    }
  };

  const cannon = (x: number, dir: number, count: number, power: number) => {
    spawnConfetti(particles, x, midY, colors, count, power, dir, 1.05, rnd);
  };

  const firework = (x: number, y: number, sparks: number, intensity = 1) => {
    spawnFirework(particles, x, y, colors, sparks, rnd, intensity);
  };

  const cues: Cue[] = [];

  if (kind === "birthday") {
    cues.push(
      {
        at: 0,
        run: () => {
          firework(heroLeftX, heroLeftY, Math.round(budget.burstSparks * 0.85), 0.95);
          firework(spotlightX, spotlightY - 28, Math.round(budget.burstSparks * 0.85), 0.95);
          cannon(left, -0.35, Math.round(budget.confetti * 0.16), 8.4);
          cannon(right, Math.PI + 0.35, Math.round(budget.confetti * 0.16), 8.4);
        },
      },
      {
        at: 420,
        run: () => {
          cannon(left, -0.5, Math.round(budget.confetti * 0.12), 8.2);
          cannon(right, Math.PI + 0.5, Math.round(budget.confetti * 0.12), 8.2);
          rain(Math.round(budget.confetti * 0.22), height * 0.02);
          spawnStreamers(particles, width, colors, Math.round(budget.streamers * 0.55), rnd);
        },
      },
      {
        at: 1100,
        run: () => {
          rain(Math.round(budget.confetti * 0.16));
          spawnConfetti(particles, width * 0.5, height * 0.18, colors, Math.round(budget.confetti * 0.1), 7.2, Math.PI / 2, 2.4, rnd);
        },
      },
      {
        at: 2200,
        run: () => rain(Math.round(budget.confetti * 0.12)),
      },
      {
        at: 3200,
        run: () => {
          spawnStreamers(particles, width, colors, Math.round(budget.streamers * 0.7), rnd);
          firework(width * 0.3, height * 0.3, budget.burstSparks, 0.9);
        },
      },
      {
        at: 4300,
        run: () => firework(spotlightX + 18, spotlightY - 36, budget.burstSparks, 0.95),
      },
      {
        at: 5400,
        run: () => {
          firework(width * 0.58, height * 0.26, Math.round(budget.burstSparks * 0.75), 0.85);
          rain(Math.round(budget.confetti * 0.1));
        },
      },
      {
        at: 6800,
        run: () => {
          rain(Math.round(budget.confetti * 0.1));
          firework(width * 0.22, height * 0.38, Math.round(budget.burstSparks * 0.7), 0.8);
        },
      },
      {
        at: 8200,
        run: () => firework(width * 0.7, height * 0.24, Math.round(budget.burstSparks * 0.65), 0.75),
      },
      {
        at: 9400,
        run: () => rain(Math.round(budget.confetti * 0.08)),
      },
    );
  } else if (kind === "victory") {
    cues.push(
      {
        at: 0,
        run: () => {
          spawnConfetti(particles, width * 0.5, top, colors, Math.round(budget.confetti * 0.22), 11.2, Math.PI / 2, 2.9, rnd);
          cannon(left, -0.55, Math.round(budget.confetti * 0.18), 10.4);
          cannon(right, Math.PI + 0.55, Math.round(budget.confetti * 0.18), 10.4);
          spawnStreamers(particles, width, colors, budget.streamers, rnd);
        },
      },
      {
        at: 280,
        run: () => rain(Math.round(budget.confetti * 0.16)),
      },
      {
        at: 700,
        run: () => firework(width * 0.26, height * 0.3, budget.burstSparks, 1.25),
      },
      {
        at: 1300,
        run: () => firework(width * 0.76, height * 0.26, budget.burstSparks, 1.25),
      },
      {
        at: 2100,
        run: () => {
          cannon(left, -0.45, Math.round(budget.confetti * 0.1), 8.6);
          cannon(right, Math.PI + 0.45, Math.round(budget.confetti * 0.1), 8.6);
        },
      },
      {
        at: 3000,
        run: () => firework(width * 0.5, height * 0.24, budget.burstSparks, 1.35),
      },
      {
        at: 4200,
        run: () => {
          rain(Math.round(budget.confetti * 0.12));
          firework(width * 0.18, height * 0.4, Math.round(budget.burstSparks * 0.85), 1.1);
        },
      },
      {
        at: 5600,
        run: () => firework(width * 0.68, height * 0.32, budget.burstSparks, 1.15),
      },
      {
        at: 7200,
        run: () => {
          cannon(left, -0.4, Math.round(budget.confetti * 0.08), 8.2);
          cannon(right, Math.PI + 0.4, Math.round(budget.confetti * 0.08), 8.2);
        },
      },
      {
        at: 8800,
        run: () => firework(width * 0.42, height * 0.28, budget.burstSparks, 1.2),
      },
      {
        at: 10400,
        run: () => {
          rain(Math.round(budget.confetti * 0.1));
          firework(width * 0.8, height * 0.36, Math.round(budget.burstSparks * 0.8), 1.05);
        },
      },
      {
        at: 12200,
        run: () => rain(Math.round(budget.confetti * 0.06)),
      },
    );
  } else {
    cues.push(
      {
        at: 0,
        run: () => {
          spawnConfetti(particles, width * 0.5, top, colors, Math.round(budget.confetti * 0.18), 10.4, Math.PI / 2, 2.8, rnd);
          cannon(left, -0.4, Math.round(budget.confetti * 0.14), 9.6);
          cannon(right, Math.PI + 0.4, Math.round(budget.confetti * 0.14), 9.6);
        },
      },
      {
        at: 360,
        run: () => {
          spawnStreamers(particles, width, colors, budget.streamers, rnd);
          firework(width * 0.28, height * 0.3, budget.burstSparks, 1.15);
        },
      },
      {
        at: 1400,
        run: () => firework(width * 0.72, height * 0.26, budget.burstSparks, 1.15),
      },
      {
        at: 2600,
        run: () => {
          spawnConfetti(particles, spotlightX, spotlightY, colors, Math.round(budget.confetti * 0.12), 7.4, -Math.PI / 2, 2.5, rnd);
          firework(spotlightX, spotlightY - 20, Math.round(budget.burstSparks * 0.8), 0.95);
        },
      },
      {
        at: 4200,
        run: () => rain(Math.round(budget.confetti * 0.12)),
      },
      {
        at: 5800,
        run: () => firework(width * 0.5, height * 0.24, budget.burstSparks, 1.2),
      },
      {
        at: 7600,
        run: () => {
          cannon(left, -0.35, Math.round(budget.confetti * 0.08), 8.4);
          cannon(right, Math.PI + 0.35, Math.round(budget.confetti * 0.08), 8.4);
        },
      },
      {
        at: 9400,
        run: () => firework(width * 0.64, height * 0.3, budget.burstSparks, 1.1),
      },
      {
        at: 11200,
        run: () => {
          rain(Math.round(budget.confetti * 0.14));
          spawnStreamers(particles, width, colors, Math.round(budget.streamers * 0.5), rnd);
        },
      },
      {
        at: 13200,
        run: () => rain(Math.round(budget.confetti * 0.08)),
      },
    );
  }

  void budget.burstCount;
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
  const ctx = canvas.getContext("2d", { alpha: true });
  const particles: Particle[] = [];
  const timers: number[] = [];
  let raf = 0;
  let stopped = false;
  const rnd = opts.random ?? Math.random;

  const readViewport = () => {
    if (typeof window === "undefined") {
      return { w: opts.width ?? 1440, h: opts.height ?? 900 };
    }
    return {
      w: opts.width ?? window.innerWidth,
      h: opts.height ?? window.innerHeight,
    };
  };
  let cssW = readViewport().w;
  let cssH = readViewport().h;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const applyCanvasSize = () => {
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.display = "block";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  applyCanvasSize();
  if (ctx) ctx.clearRect(0, 0, cssW, cssH);

  const duration = CELEBRATION_DURATION_MS[opts.type];
  const cues = buildCues(opts.type, cssW, cssH, particles, rnd);

  const drawFrame = (elapsed: number) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);
    for (const p of particles) {
      if (p.life >= p.maxLife) continue;
      if (!opts.hold) stepParticle(p, 16);
      else {
        void elapsed;
      }
      drawParticle(ctx, p);
    }
  };

  const publishCount = () => {
    canvas.dataset.particleCount = String(particles.length);
  };

  const onResize = () => {
    if (stopped || opts.width || opts.height) return;
    const next = readViewport();
    cssW = next.w;
    cssH = next.h;
    applyCanvasSize();
  };
  if (typeof window !== "undefined") window.addEventListener("resize", onResize);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (typeof window !== "undefined") window.removeEventListener("resize", onResize);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
    particles.length = 0;
    publishCount();
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
    publishCount();
    return {
      stop,
      particleCount: () => particles.length,
    };
  }

  const started = performance.now();
  let last = started;
  let cueIndex = 0;
  if (cues[0]?.at === 0) {
    cues[0].run();
    cueIndex = 1;
  }

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
        if (p.life >= p.maxLife || p.y > cssH + 90) {
          particles[i] = particles[particles.length - 1]!;
          particles.pop();
          continue;
        }
        drawParticle(ctx, p);
        i += 1;
      }
    }
    publishCount();
    if (elapsed >= duration) {
      stop();
      opts.onDone?.();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  publishCount();
  raf = requestAnimationFrame(tick);

  return {
    stop,
    particleCount: () => particles.length,
  };
}
