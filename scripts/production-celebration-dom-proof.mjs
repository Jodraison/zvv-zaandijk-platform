/**
 * Production visual proof: DOM celebration on https://zaandijkvrz1.nl
 */
import { chromium, firefox, webkit } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { inflateSync } from "zlib";

const URL = process.env.CELEBRATION_URL ?? "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-celebration-dom");
mkdirSync(SHOT, { recursive: true });

const TIMES = [500, 1500, 3000, 5000, 7000, 10000, 13000];

function captureState() {
  const root = document.getElementById("homepage-celebration-root");
  const dom = document.querySelector("[data-testid='homepage-celebration-dom']");
  const canvas = document.querySelector("[data-testid='homepage-celebration-canvas']");
  const style = root ? getComputedStyle(root) : null;
  const piece = document.querySelector("[data-testid='homepage-celebration-piece']");
  const pieceAnim = piece ? getComputedStyle(piece).animationName : null;
  const rect = root?.getBoundingClientRect();
  return {
    type: root?.getAttribute("data-celebration-type") ?? null,
    phase: root?.getAttribute("data-celebration-phase") ?? null,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hasRoot: Boolean(root),
    domChildren: dom?.querySelectorAll("*").length ?? 0,
    opacity: style?.opacity ?? null,
    zIndex: style?.zIndex ?? null,
    animation: pieceAnim,
    viewport: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    canvas: canvas instanceof HTMLCanvasElement ? { w: canvas.width, h: canvas.height } : null,
    jelisa: /jelisa/i.test(document.body.innerText),
    birthday: /vandaag jarig/i.test(document.body.innerText),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readPngRgba(buf) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const idats = [];
  while (offset + 8 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const start = offset + 8;
    if (type === "IHDR") {
      width = buf.readUInt32BE(start);
      height = buf.readUInt32BE(start + 4);
    } else if (type === "IDAT") {
      idats.push(buf.subarray(start, start + len));
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + len;
  }
  const inflated = inflateSync(Buffer.concat(idats));
  const stride = width * 4;
  const out = Buffer.alloc(stride * height);
  let i = 0;
  let o = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[i];
    i += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[i + x];
      const left = x >= 4 ? out[o + x - 4] : 0;
      const up = y > 0 ? out[o + x - stride] : 0;
      const ul = x >= 4 && y > 0 ? out[o + x - stride - 4] : 0;
      let val = raw;
      if (filter === 1) val = (raw + left) & 255;
      else if (filter === 2) val = (raw + up) & 255;
      else if (filter === 3) val = (raw + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) val = (raw + paeth(left, up, ul)) & 255;
      out[o + x] = val;
    }
    i += stride;
    o += stride;
  }
  return { width, height, data: out };
}

function zoneDelta(aBuf, bBuf, x0, y0, x1, y1) {
  const a = readPngRgba(aBuf);
  const b = readPngRgba(bBuf);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  let changed = 0;
  let total = 0;
  const left = Math.floor(w * x0);
  const top = Math.floor(h * y0);
  const right = Math.floor(w * x1);
  const bottom = Math.floor(h * y1);
  for (let y = top; y < bottom; y += 3) {
    for (let x = left; x < right; x += 3) {
      const i = (w * y + x) << 2;
      total += 1;
      const d =
        Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]);
      if (d > 40) changed += 1;
    }
  }
  return total ? changed / total : 0;
}

async function runBrowser(launcher, name, viewport, extras = {}) {
  let browser;
  try {
    browser = await launcher.launch({ headless: true, ...(name === "chromium" ? { channel: "msedge" } : {}) });
  } catch {
    browser = await launcher.launch({ headless: true });
  }
  const context = await browser.newContext({
    viewport,
    reducedMotion: extras.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const started = Date.now();
  const states = [];
  for (const t of TIMES) {
    const wait = t - (Date.now() - started);
    if (wait > 16) await page.waitForTimeout(wait);
    const label = `t${String(t).padStart(5, "0")}`;
    const path = join(SHOT, `${name}-${viewport.width}-${label}.png`);
    await page.screenshot({ path, animations: "allow" });
    const state = await page.evaluate(captureState);
    states.push({ t, path, ...state });
    console.log(JSON.stringify({ name, t, ...state }));
  }
  if (!extras.reducedMotion && viewport.width >= 1200) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const refreshPath = join(SHOT, `${name}-${viewport.width}-refresh.png`);
    await page.screenshot({ path: refreshPath, animations: "allow" });
    const refresh = await page.evaluate(captureState);
    states.push({ t: "refresh", path: refreshPath, ...refresh });
    console.log(JSON.stringify({ name, t: "refresh", ...refresh }));
  }
  await context.close();
  await browser.close();
  return { name, consoleErrors, pageErrors, states };
}

const desktop = await runBrowser(chromium, "chromium", { width: 1440, height: 900 });
const mobile = await runBrowser(chromium, "chromium-mobile", { width: 390, height: 844 });
const reduced = await runBrowser(chromium, "reduced", { width: 1440, height: 900 }, { reducedMotion: "reduce" });

let firefoxRun = null;
try {
  firefoxRun = await runBrowser(firefox, "firefox", { width: 1440, height: 900 });
} catch (err) {
  console.log("firefox skip", String(err).slice(0, 180));
}

let webkitRun = null;
try {
  webkitRun = await runBrowser(webkit, "webkit", { width: 1440, height: 900 });
} catch (err) {
  console.log("webkit skip", String(err).slice(0, 180));
}

const quiet = desktop.states.find((s) => s.t === 500)?.path;
const peak = desktop.states.find((s) => s.t === 3000)?.path;
const deltas = {};
if (quiet && peak && existsSync(quiet) && existsSync(peak)) {
  const a = readFileSync(quiet);
  const b = readFileSync(peak);
  deltas.leftTop = zoneDelta(a, b, 0.02, 0.08, 0.32, 0.38);
  deltas.center = zoneDelta(a, b, 0.35, 0.22, 0.65, 0.62);
  deltas.card = zoneDelta(a, b, 0.62, 0.16, 0.96, 0.72);
  deltas.bottom = zoneDelta(a, b, 0.1, 0.7, 0.9, 0.96);
  console.log("PIXEL_DELTA", deltas);
}

const report = { url: URL, desktop, mobile, reduced, firefoxRun, webkitRun, deltas, generatedAt: new Date().toISOString() };
writeFileSync(join(SHOT, "report.json"), JSON.stringify(report, null, 2));
console.log("WROTE", join(SHOT, "report.json"));
