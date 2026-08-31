/**
 * Reality gate: https://zaandijkvrz1.nl — no query params, fresh context.
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
  const canvasBox =
    canvas instanceof HTMLCanvasElement
      ? {
          w: canvas.width,
          h: canvas.height,
          cssW: canvas.clientWidth,
          cssH: canvas.clientHeight,
          particles: canvas.dataset.particleCount ?? null,
        }
      : null;
  const text = document.body.innerText;
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
        }
      : null,
    canvas: canvasBox,
    birthday: /vandaag jarig/i.test(text),
    jelisa: /jelisa/i.test(text),
  };
}

async function shotAt(page, name, label) {
  const path = join(SHOT, `${name}-${label}.png`);
  await page.screenshot({ path, animations: "allow" });
  const state = await page.evaluate(captureState);
  console.log(JSON.stringify({ name, label, ...state, path }));
  return { label, path, ...state };
}

async function runViewport(browser, name, viewport, extras = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: extras.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (res) => {
    if (res.status() >= 400) httpErrors.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(URL, { waitUntil: "commit", timeout: 60_000 });
  const started = Date.now();
  const states = [];
  for (const t of TIMES) {
    const wait = t - (Date.now() - started);
    if (wait > 16) await page.waitForTimeout(wait);
    states.push(await shotAt(page, name, `t${String(t).padStart(5, "0")}`));
  }

  if (name.includes("desktop") && !extras.reducedMotion) {
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("text=Vandaag jarig", { timeout: 30_000 });
    await page.waitForTimeout(1600);
    states.push(await shotAt(page, name, "refresh-t1600"));
  }

  await context.close();
  return { name, consoleErrors, pageErrors, httpErrors, states };
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });
const desktop = await runViewport(browser, "desktop-1440", { width: 1440, height: 900 });
const mobile = await runViewport(browser, "mobile-390", { width: 390, height: 844 });
const reduced = await runViewport(browser, "reduced-1440", { width: 1440, height: 900 }, { reducedMotion: "reduce" });
await browser.close();

const report = { url: URL, desktop, mobile, reduced, generatedAt: new Date().toISOString() };
writeFileSync(join(SHOT, "report.json"), JSON.stringify(report, null, 2));
console.log("WROTE", join(SHOT, "report.json"));
