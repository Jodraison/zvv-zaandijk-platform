import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const URL = "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-hard-fallback");
mkdirSync(SHOT, { recursive: true });

function captureState() {
  const server = document.querySelector("[data-testid='celebration-server-type']");
  const fallback = document.querySelector("[data-testid='celebration-hard-fallback']");
  const style = fallback ? getComputedStyle(fallback) : null;
  return {
    serverType: server?.getAttribute("data-celebration-server-type") ?? null,
    hasFallback: Boolean(fallback),
    fallbackChildren: fallback?.childElementCount ?? 0,
    engine: fallback?.getAttribute("data-celebration-engine") ?? null,
    type: fallback?.getAttribute("data-celebration-type") ?? null,
    zIndex: style?.zIndex ?? null,
    position: style?.position ?? null,
    opacity: style?.opacity ?? null,
    pointerEvents: style?.pointerEvents ?? null,
    visibility: document.visibilityState,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    jelisa: /jelisa/i.test(document.body.innerText),
    birthday: /vandaag jarig/i.test(document.body.innerText),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}

async function run(name, viewport, extras = {}) {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const context = await browser.newContext({
    viewport,
    reducedMotion: extras.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const started = Date.now();
  const states = [];
  for (const t of extras.times) {
    const wait = t - (Date.now() - started);
    if (wait > 16) await page.waitForTimeout(wait);
    const path = join(SHOT, `${name}-t${String(t).padStart(5, "0")}.png`);
    await page.screenshot({ path, animations: "allow" });
    const state = await page.evaluate(captureState);
    states.push({ t, path, ...state });
    console.log(JSON.stringify({ name, t, ...state }));
  }
  if (extras.refresh) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2200);
    const path = join(SHOT, `${name}-refresh.png`);
    await page.screenshot({ path, animations: "allow" });
    const state = await page.evaluate(captureState);
    states.push({ t: "refresh", path, ...state });
    console.log(JSON.stringify({ name, t: "refresh", ...state }));
  }
  await context.close();
  await browser.close();
  return { name, consoleErrors, states };
}

const desktopA = await run("A-fresh-1440", { width: 1440, height: 900 }, { times: [400, 1500, 3000, 5000, 7000, 9000, 11000] });
const desktopB = await run("B-refresh-1440", { width: 1440, height: 900 }, { times: [3000], refresh: true });
const desktopC = await run("C-newtab-1440", { width: 1440, height: 900 }, { times: [1500, 3000] });
const mobile = await run("mobile-390", { width: 390, height: 844 }, { times: [1500, 3000, 5000, 7000] });

writeFileSync(join(SHOT, "report.json"), JSON.stringify({ desktopA, desktopB, desktopC, mobile }, null, 2));
console.log("WROTE", join(SHOT, "report.json"));
