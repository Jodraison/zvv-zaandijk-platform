import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const URL = "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-celebration-v2");
mkdirSync(SHOT, { recursive: true });

function captureState() {
  const server = document.querySelector("[data-testid='celebration-server-type']");
  const show = document.querySelector("[data-testid='homepage-celebration-show']");
  const festive = document.querySelector("[data-testid='birthday-festive-state']");
  const marker = document.querySelector("[data-testid='celebration-fx-marker']");
  const style = show ? getComputedStyle(show) : null;
  const kids = show ? [...show.querySelectorAll("[data-testid='homepage-celebration-piece'], [data-testid='homepage-celebration-streamer'], [data-testid='homepage-celebration-burst']")] : [];
  const visibleKids = kids.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width >= 6 && r.height >= 6 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  });
  return {
    serverType: server?.getAttribute("data-celebration-server-type") ?? null,
    engine: show?.getAttribute("data-celebration-engine") ?? null,
    kind: show?.getAttribute("data-celebration-kind") ?? null,
    motion: show?.getAttribute("data-celebration-motion") ?? null,
    hasShow: Boolean(show),
    childCount: show?.childElementCount ?? 0,
    visibleKids: visibleKids.length,
    zIndex: style?.zIndex ?? null,
    pointerEvents: style?.pointerEvents ?? null,
    festive: Boolean(festive),
    fxMarker: Boolean(marker),
    jelisa: /jelisa/i.test(document.body.innerText),
    birthday: /vandaag jarig/i.test(document.body.innerText),
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
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
    await page.waitForTimeout(1800);
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

const times = [500, 1500, 3000, 6000, 10000, 15000];
const desktop = await run("desktop-1440", { width: 1440, height: 900 }, { times, refresh: true });
const mobile = await run("mobile-390", { width: 390, height: 844 }, { times: [500, 1500, 3000, 6000, 10000] });
const reduced = await run("reduced-1440", { width: 1440, height: 900 }, { times: [500, 1500, 3000], reducedMotion: "reduce" });

writeFileSync(join(SHOT, "report.json"), JSON.stringify({ desktop, mobile, reduced }, null, 2));
console.log("WROTE", join(SHOT, "report.json"));
