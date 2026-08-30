/**
 * Runtime proof for remaining league program 2026/27.
 * Public shots: live production (same DB).
 * Admin shots: local Beheer with existing admin storage (same DB).
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC = process.env.PUBLIC_BASE_URL ?? "https://zaandijkvrz1.nl";
const ADMIN = process.env.ADMIN_BASE_URL ?? "http://localhost:3013";
const OUT = ".review-screenshots/remaining-league-program-2026-27";
const AUTH = ".review-auth/admin-storage.json";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const FUTURE_ID = "adc6e3fb-7fcd-4360-8f35-4a97824a503e";
const q = `season=${encodeURIComponent(SEASON)}`;

mkdirSync(OUT, { recursive: true });
const notes = [];

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true, channel: "chrome" }),
);

async function shot(page, name, opts = {}) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: opts.fullPage !== false });
  notes.push({ name, url: page.url(), path });
}

const publicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pub = await publicCtx.newPage();
const wed = `${PUBLIC}/wedstrijden?${q}`;
const res = await pub.goto(wed, { waitUntil: "networkidle", timeout: 90000 });
if ((res?.status() ?? 500) >= 400) throw new Error(`public wedstrijden ${res?.status()}`);
await pub.waitForTimeout(800);
await shot(pub, "01-public-programma-top", { fullPage: false });

async function clipAround(label, name) {
  const loc = pub.getByText(label, { exact: false }).first();
  await loc.scrollIntoViewIfNeeded();
  await pub.waitForTimeout(250);
  const box = await loc.boundingBox();
  if (!box) {
    await shot(pub, name, { fullPage: false });
    return;
  }
  await pub.screenshot({
    path: join(OUT, `${name}.png`),
    clip: {
      x: 0,
      y: Math.max(0, box.y - 80),
      width: 1440,
      height: Math.min(900, 820),
    },
  });
  notes.push({ name, url: pub.url(), around: label });
}

await clipAround("24-10-2026", "02-oktober-november");
await clipAround("05-12-2026", "03-december-januari");
await clipAround("06-02-2027", "04-februari-maart");
await clipAround("03-04-2027", "05-april-mei");

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const mob = await mobile.newPage();
const mobRes = await mob.goto(wed, { waitUntil: "networkidle", timeout: 90000 });
if ((mobRes?.status() ?? 500) >= 400) throw new Error(`mobile wedstrijden ${mobRes?.status()}`);
await mob.waitForTimeout(800);
await mob.screenshot({ path: join(OUT, "08-mobiel-programma.png"), fullPage: false });
notes.push({ name: "08-mobiel-programma", url: mob.url() });

if (!existsSync(AUTH)) {
  writeFileSync(join(OUT, "notes.json"), JSON.stringify({ notes, admin: "missing auth" }, null, 2));
  await browser.close();
  throw new Error("Missing .review-auth/admin-storage.json");
}

const adminCtx = await browser.newContext({
  storageState: AUTH,
  viewport: { width: 1440, height: 900 },
});
const adm = await adminCtx.newPage();
const adminList = `${ADMIN}/beheer/wedstrijden?${q}`;
const aRes = await adm.goto(adminList, { waitUntil: "networkidle", timeout: 90000 });
const adminPath = new URL(adm.url()).pathname;
if ((aRes?.status() ?? 500) >= 400 || adminPath.includes("/login")) {
  throw new Error(`admin list failed status=${aRes?.status()} path=${adminPath}`);
}
await adm.waitForTimeout(800);
await shot(adm, "06-beheer-wedstrijden");

const future = `${ADMIN}/beheer/wedstrijden/${FUTURE_ID}?${q}`;
const fRes = await adm.goto(future, { waitUntil: "networkidle", timeout: 90000 });
const fPath = new URL(adm.url()).pathname;
if ((fRes?.status() ?? 500) >= 400 || fPath.includes("/login")) {
  throw new Error(`admin future failed status=${fRes?.status()} path=${fPath}`);
}
await adm.waitForTimeout(800);
await shot(adm, "07-toekomst-zonder-opstelling");

writeFileSync(join(OUT, "notes.json"), JSON.stringify({ notes, public: PUBLIC, admin: ADMIN }, null, 2));
await browser.close();
console.log(JSON.stringify({ out: OUT, shots: notes.map((n) => n.name) }, null, 2));
