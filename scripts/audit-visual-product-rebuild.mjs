/**
 * Fase A — visuele audit + lineup runtime diagnostics (echte routes).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const ART = join(process.cwd(), ".review-artifacts", "visual-product-rebuild-lineup-reality");
const SHOT = join(process.cwd(), ".review-screenshots", "visual-product-rebuild-lineup-reality");
const BAK = join(process.cwd(), ".review-backups", "visual-product-rebuild-lineup-reality");
mkdirSync(ART, { recursive: true });
mkdirSync(SHOT, { recursive: true });
mkdirSync(BAK, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

async function shot(name) {
  await page.screenshot({ path: join(SHOT, `${name}.png`), fullPage: true });
}

const routes = [
  { id: "home", path: `/?season=${SEASON}`, shot: "audit-home" },
  { id: "wedstrijden", path: `/wedstrijden?season=${SEASON}`, shot: "audit-wedstrijden" },
  { id: "ranking", path: `/ranking?season=${SEASON}`, shot: "audit-ranking" },
  { id: "statistieken", path: `/statistieken?season=${SEASON}`, shot: "audit-statistieken" },
  { id: "beheer-wedstrijden", path: `/beheer/wedstrijden?season=${SEASON}`, shot: "audit-beheer-wedstrijden" },
];

const auditRows = [];
for (const r of routes) {
  await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(500);
  await shot(r.shot);
  const body = await page.locator("body").innerText();
  const cards = await page.locator("a, article, section").count();
  const whiteCards = await page.locator(".bg-white, [class*='rounded-2xl']").count();
  auditRows.push({
    route: r.path,
    title: await page.title(),
    bodyChars: body.length,
    hasOWF: /OWF (Accept|Debug)/i.test(body),
    hasDemoBadge: /\bDEMO\b/.test(body),
    whiteCardish: whiteCards,
    cardish: cards,
    scoreGuess: /OWF|vfdvgs|3\s*[–-]\s*1/i.test(body) ? "polluted_or_demo_visible" : "check_empty",
    snip: body.replace(/\s+/g, " ").slice(0, 280),
  });
  console.log("audited", r.id, auditRows.at(-1).hasOWF ? "HAS OWF" : "no-owf");
}

// Find a match for lineup diagnostics
await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
const matchHref = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a[href*="/beheer/wedstrijden/"]')].find((el) =>
    /\/beheer\/wedstrijden\/[0-9a-f-]{8,}/i.test(el.getAttribute("href") || ""),
  );
  return a?.getAttribute("href") || null;
});

let lineupDiagnostics = { matchHref: null, error: "no match found" };
if (matchHref) {
  const opstellingUrl = matchHref.includes("step=")
    ? matchHref
    : `${matchHref}${matchHref.includes("?") ? "&" : "?"}step=opstelling`;
  await page.goto(`${BASE}${opstellingUrl.startsWith("http") ? opstellingUrl.replace(BASE, "") : opstellingUrl}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  // ensure step
  if (!page.url().includes("step=opstelling")) {
    const u = new URL(page.url());
    u.searchParams.set("step", "opstelling");
    await page.goto(u.toString(), { waitUntil: "networkidle", timeout: 90_000 });
  }
  await page.waitForTimeout(800);
  await shot("audit-lineup-opstelling");

  lineupDiagnostics = await page.evaluate(() => {
    const pitch = document.querySelector('[data-testid="formation-pitch"]');
    const wrappers = [...document.querySelectorAll('[data-testid="formation-pitch"], .relative.mx-auto')];
    const cs = pitch ? getComputedStyle(pitch) : null;
    const rect = pitch?.getBoundingClientRect();
    const parent = pitch?.parentElement;
    const parentCs = parent ? getComputedStyle(parent) : null;
    const parentRect = parent?.getBoundingClientRect();
    const slots = [...document.querySelectorAll('button[aria-label*="leeg"], button[aria-label*=":"]')].slice(0, 20);
    const absChildren = pitch
      ? [...pitch.querySelectorAll(".absolute")].slice(0, 5).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            className: el.className?.toString?.().slice(0, 80),
            w: Math.round(r.width),
            h: Math.round(r.height),
            top: Math.round(r.top),
          };
        })
      : [];
    const spacer = pitch?.querySelector('[aria-hidden="true"]');
    const spacerRect = spacer?.getBoundingClientRect();
    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      pitchFound: !!pitch,
      pitch: pitch
        ? {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            display: cs.display,
            visibility: cs.visibility,
            opacity: cs.opacity,
            overflow: cs.overflow,
            position: cs.position,
            aspectRatio: cs.aspectRatio,
            maxWidth: cs.maxWidth,
            heightCss: cs.height,
            minHeight: cs.minHeight,
            paddingBottom: cs.paddingBottom,
          }
        : null,
      spacer: spacer
        ? {
            width: Math.round(spacerRect.width),
            height: Math.round(spacerRect.height),
            paddingBottom: getComputedStyle(spacer).paddingBottom,
          }
        : null,
      parent: parent
        ? {
            tag: parent.tagName,
            className: parent.className?.toString?.().slice(0, 120),
            width: Math.round(parentRect.width),
            height: Math.round(parentRect.height),
            display: parentCs.display,
            gridTemplateColumns: parentCs.gridTemplateColumns,
            overflow: parentCs.overflow,
          }
        : null,
      absChildren,
      slotSample: slots.map((b) => {
        const r = b.getBoundingClientRect();
        return {
          label: (b.getAttribute("aria-label") || b.textContent || "").slice(0, 60),
          w: Math.round(r.width),
          h: Math.round(r.height),
          visible: r.height > 2 && r.width > 2,
        };
      }),
      opVeldButtons: [...document.querySelectorAll("button")].filter((b) =>
        /^Op veld$/i.test((b.textContent || "").trim()),
      ).length,
      bankButtons: [...document.querySelectorAll("button")].filter((b) =>
        /^Bank$/i.test((b.textContent || "").trim()),
      ).length,
      blackLineSuspect: pitch ? rect.height > 0 && rect.height < 8 : true,
      bodyHasLineupHeading: /Opstelling|1-4-2-3-1/i.test(document.body.innerText),
    };
  });

  // Also open finish step if possible
  const finishUrl = page.url().replace("step=opstelling", "step=na-de-wedstrijd") + (page.url().includes("finish=") ? "" : "&finish=1");
  await page.goto(finishUrl.includes("finish=") ? finishUrl : finishUrl.replace("na-de-wedstrijd", "na-de-wedstrijd&finish=1").replace("&&", "&"), {
    waitUntil: "networkidle",
    timeout: 90_000,
  }).catch(() => null);
  if (!page.url().includes("finish=1")) {
    const u = new URL(page.url());
    u.searchParams.set("step", "na-de-wedstrijd");
    u.searchParams.set("finish", "1");
    await page.goto(u.toString(), { waitUntil: "networkidle", timeout: 90_000 }).catch(() => null);
  }
  await page.waitForTimeout(400);
  await shot("audit-na-de-wedstrijd");
}

// Demo data impact from admin list + public pages text
const demoImpact = {
  routesWithOWF: auditRows.filter((r) => r.hasOWF).map((r) => r.route),
  consoleErrors: consoleErrors.slice(0, 40),
  note: "Name-based detection only in this audit pass; structural data_scope comes next.",
};

writeFileSync(join(ART, "lineup-runtime-diagnostics.json"), JSON.stringify(lineupDiagnostics, null, 2));
writeFileSync(join(ART, "demo-data-impact.json"), JSON.stringify(demoImpact, null, 2));
writeFileSync(join(ART, "audit-raw.json"), JSON.stringify({ auditRows, lineupDiagnostics }, null, 2));

console.log("\nLINEUP DIAG", JSON.stringify(lineupDiagnostics, null, 2));
console.log("\nDEMO IMPACT", JSON.stringify(demoImpact, null, 2));
await browser.close();
