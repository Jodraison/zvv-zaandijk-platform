/**
 * Reality gate: https://zaandijkvrz1.nl — no query params, fresh context.
 * Screenshots + optional video. Particle counts are logged but NOT the pass criterion.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const URL = process.env.CELEBRATION_URL ?? "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-celebration-reality");
mkdirSync(SHOT, { recursive: true });

const TIMES = [0, 1000, 3000, 5000, 7000, 9000, 12000];

function captureState() {
  const overlay = document.querySelector("[data-testid='homepage-celebration']");
  const canvas = document.querySelector("[data-testid='homepage-celebration-canvas']");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const style = overlay ? getComputedStyle(overlay) : null;
  const canvasBox = canvas instanceof HTMLCanvasElement
    ? { w: canvas.width, h: canvas.height, cssW: canvas.clientWidth, cssH: canvas.clientHeight, particles: canvas.dataset.particleCount ?? null }
    : null;
  return {
    reduced,
    hasOverlay: Boolean(overlay),
    type: overlay?.getAttribute("data-celebration-type") ?? null,
    phase: overlay?.getAttribute("data-celebration-phase") ?? null,
    overlay: style
      ? {
          zIndex: style.zIndex,
          position: style.position,
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
          width: style.width,
          height: style.height,
          display: style.display,
        }
      : null,
    canvas: canvasBox,
    birthday: Boolean(document.body.innerText.includes("Vandaag jarig")),
    jelisa: Boolean(document.body.innerText.includes("Jelisa")),
  };
}

async function runViewport(browser, name, viewport, { video } = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "no-preference",
    ...(video
      ? { recordVideo: { dir: join(SHOT, "video"), size: viewport } }
      : {}),
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const csp = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text);
    if (/csp|content security policy/i.test(text)) csp.push(text);
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (res) => {
    if (res.status() >= 400) consoleErrors.push(`HTTP ${res.status()} ${res.url()}`);
  });

  const started = Date.now();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const states = [];
  for (const t of TIMES) {
    const wait = t - (Date.now() - started);
    if (wait > 0) await page.waitForTimeout(wait);
    const path = join(SHOT, `${name}-t${String(t).padStart(5, "0")}.png`);
    await page.screenshot({ path, animations: "disabled" === "x" ? "disabled" : "allow" });
    const state = await page.evaluate(captureState);
    states.push({ t, path, elapsed: Date.now() - started, ...state });
    console.log(JSON.stringify({ name, t, ...state, path }));
  }

  if (name.includes("desktop")) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1600);
    const refreshPath = join(SHOT, `${name}-refresh-t1600.png`);
    await page.screenshot({ path: refreshPath });
    const refresh = await page.evaluate(captureState);
    states.push({ t: "refresh-1600", path: refreshPath, ...refresh });
    console.log(JSON.stringify({ name, t: "refresh-1600", ...refresh, path: refreshPath }));
  }

  const videoPath = video ? await page.video()?.path() : null;
  await context.close();
  return { name, consoleErrors, pageErrors, csp, states, videoPath };
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });
const desktop = await runViewport(browser, "desktop-1440", { width: 1440, height: 900 });
const mobile = await runViewport(browser, "mobile-390", { width: 390, height: 844 });
await browser.close();

const report = { url: URL, desktop, mobile, generatedAt: new Date().toISOString() };
writeFileSync(join(SHOT, "report.json"), JSON.stringify(report, null, 2));
console.log("WROTE", join(SHOT, "report.json"));
