import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const URL = "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-celebration-reality");
mkdirSync(SHOT, { recursive: true });

function captureState() {
  const overlay = document.querySelector("[data-testid='homepage-celebration']");
  const canvas = document.querySelector("[data-testid='homepage-celebration-canvas']");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const style = overlay ? getComputedStyle(overlay) : null;
  const root = document.getElementById("homepage-celebration-root");
  return {
    reduced,
    hasOverlay: Boolean(overlay),
    id: root?.id ?? null,
    type: overlay?.getAttribute("data-celebration-type") ?? null,
    phase: overlay?.getAttribute("data-celebration-phase") ?? null,
    zIndex: style?.zIndex ?? null,
    pointerEvents: style?.pointerEvents ?? null,
    canvas: canvas instanceof HTMLCanvasElement
      ? { w: canvas.width, h: canvas.height, cssW: canvas.clientWidth, cssH: canvas.clientHeight, particles: canvas.dataset.particleCount ?? null }
      : null,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });

async function run(name, viewport, fn) {
  const context = await browser.newContext({ viewport, reducedMotion: name.includes("reduced") ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) httpErrors.push(`${res.status()} ${res.url()}`);
  });
  await fn(page);
  console.log(JSON.stringify({ name, consoleErrors, pageErrors, httpErrors }));
  await context.close();
}

await run("desktop-extra", { width: 1440, height: 900 }, async (page) => {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(SHOT, "desktop-1440-t01400.png"), animations: "allow" });
  console.log("t01400", await page.evaluate(captureState));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: join(SHOT, "desktop-1440-refresh-t1800.png"), animations: "allow" });
  console.log("refresh", await page.evaluate(captureState));
});

await run("mobile-390", { width: 390, height: 844 }, async (page) => {
  await page.goto(URL, { waitUntil: "commit" });
  const started = Date.now();
  for (const t of [0, 1000, 3000, 5000, 7000, 9000, 12000]) {
    const wait = t - (Date.now() - started);
    if (wait > 16) await page.waitForTimeout(wait);
    await page.screenshot({ path: join(SHOT, `mobile-390-t${String(t).padStart(5, "0")}.png`), animations: "allow" });
    console.log("mobile", t, await page.evaluate(captureState));
  }
});

await run("reduced-1440", { width: 1440, height: 900 }, async (page) => {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(SHOT, "reduced-1440-t1200.png"), animations: "allow" });
  console.log("reduced", await page.evaluate(captureState));
});

await browser.close();
