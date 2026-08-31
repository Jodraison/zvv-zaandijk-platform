import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { inflateSync } from "zlib";

const URL = "https://zaandijkvrz1.nl";
const SHOT = join(process.cwd(), ".review-screenshots", "production-celebration-dom");
mkdirSync(SHOT, { recursive: true });

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
    } else if (type === "IEND") break;
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

function zoneDelta(a, b, x0, y0, x1, y1) {
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
      const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
      if (d > 40) changed += 1;
    }
  }
  return total ? Number((changed / total).toFixed(4)) : 0;
}

function captureState() {
  const root = document.getElementById("homepage-celebration-root");
  const dom = document.querySelector("[data-testid='homepage-celebration-dom']");
  const piece = document.querySelector("[data-testid='homepage-celebration-piece']");
  const style = root ? getComputedStyle(root) : null;
  return {
    type: root?.getAttribute("data-celebration-type") ?? null,
    phase: root?.getAttribute("data-celebration-phase") ?? null,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hasRoot: Boolean(root),
    domChildren: dom?.querySelectorAll("*").length ?? 0,
    opacity: style?.opacity ?? null,
    zIndex: style?.zIndex ?? null,
    animation: piece ? getComputedStyle(piece).animationName : null,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });

async function timed(name, viewport, extras = {}) {
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
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const started = Date.now();
  const states = [];
  for (const t of extras.times ?? [1500, 3000, 5000, 7000]) {
    const wait = t - (Date.now() - started);
    if (wait > 16) await page.waitForTimeout(wait);
    const path = join(SHOT, `${name}-t${String(t).padStart(5, "0")}.png`);
    await page.screenshot({ path, animations: "allow" });
    const state = await page.evaluate(captureState);
    states.push({ t, path, ...state });
    console.log(JSON.stringify({ name, t, ...state }));
  }
  await context.close();
  return { name, consoleErrors, states };
}

const mobile = await timed("mobile-390", { width: 390, height: 844 }, { times: [500, 1500, 3000, 5000, 7000, 10000] });
const reduced = await timed("reduced-1440", { width: 1440, height: 900 }, { reducedMotion: "reduce", times: [1200] });
await browser.close();

const quiet = join(SHOT, "chromium-1440-t00500.png");
const peak = join(SHOT, "chromium-1440-t03000.png");
let deltas = {};
if (existsSync(quiet) && existsSync(peak)) {
  const a = readPngRgba(readFileSync(quiet));
  const b = readPngRgba(readFileSync(peak));
  deltas = {
    leftTop: zoneDelta(a, b, 0.02, 0.08, 0.32, 0.38),
    center: zoneDelta(a, b, 0.35, 0.22, 0.65, 0.62),
    card: zoneDelta(a, b, 0.62, 0.16, 0.96, 0.72),
    bottom: zoneDelta(a, b, 0.1, 0.7, 0.9, 0.96),
  };
  console.log("PIXEL_DELTA", deltas);
}

writeFileSync(join(SHOT, "followup.json"), JSON.stringify({ mobile, reduced, deltas }, null, 2));
