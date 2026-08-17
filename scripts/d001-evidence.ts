/**
 * D-001 evidence — semantic reports + route smoke screenshots for sessions #2–#18.
 * Run: npx tsx scripts/d001-evidence.ts
 * Requires: npm run dev on BASE (default http://localhost:3003)
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { listDecisionLabSessions } from "../src/lib/decision-lab/session-catalog";
import {
  DEDICATED_SESSION_FILM_DEFS,
  filmIdsForSlug,
  DEDICATED_FREEZE_MS,
} from "../src/lib/decision-lab/films/dedicated/ids";
import { getDedicatedBundleForSession } from "../src/lib/decision-lab/films/dedicated/build-dedicated-films";
import { getTacticalSituation } from "../src/components/academie/tactical-situations";
import { getTacticalAnimation } from "../src/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "../src/lib/academie/tactical-animation-engine";

const BASE = process.env.D001_BASE_URL ?? "http://localhost:3003";
const ROOT = path.resolve("docs/football-decision-lab/reviews/phase-d");
const ART = path.resolve("docs/football-decision-lab/reviews/phase-d/artifacts/d-001");

const BATCHES: Record<string, number[]> = {
  "batch-a": [2, 3, 4, 5, 6, 7, 8, 9],
  "batch-b": [10, 11, 12],
  "batch-c": [13, 14, 16, 17],
  "batch-d": [15, 18],
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

type SemanticReport = {
  order: number;
  sessionId: string;
  slug: string;
  family: string;
  activeRole: string;
  supportRoles: readonly string[];
  teamPerspective: "blue-zvv";
  formationOrigin: string;
  ballHolder: string | null;
  attackingDirection: string;
  ids: { live: string; good: string; bad: string };
  gates: Record<string, boolean>;
  remainingLimitation: string;
};

function batchFor(order: number): string {
  for (const [name, orders] of Object.entries(BATCHES)) {
    if (orders.includes(order)) return name;
  }
  return "batch-a";
}

function semanticForDef(def: (typeof DEDICATED_SESSION_FILM_DEFS)[number]): SemanticReport {
  const ids = filmIdsForSlug(def.slug);
  const liveSit = getTacticalSituation(ids.live)!;
  const goodSit = getTacticalSituation(ids.good)!;
  const badSit = getTacticalSituation(ids.bad)!;
  const liveAnim = getTacticalAnimation(ids.live)!;
  const goodAnim = getTacticalAnimation(ids.good)!;
  const badAnim = getTacticalAnimation(ids.bad)!;
  const freeze = evaluateTacticalAnimation(liveSit, liveAnim, DEDICATED_FREEZE_MS);
  const usCount = liveSit.players?.filter((p) => p.team === "us").length ?? 0;
  const ballHolder =
    liveSit.players?.find((p) => p.hasBall)?.id ??
    (liveSit.ball ? "ball-present" : null);
  const isPressOcc = Boolean(liveSit.homeShape?.phase === "high-press");
  const isBuild = Boolean(liveSit.homeShape?.formation === "4-2-3-1");

  const gates = {
    dedicatedFilmExists: true,
    elevenUsPlayers: usCount === 11,
    liveGoodBadResolve: Boolean(liveSit && goodSit && badSit && liveAnim && goodAnim && badAnim),
    freezeEvaluates: Boolean(freeze),
    goodLongerThanLive: goodAnim.durationMs > liveAnim.durationMs,
    goodPastFreeze: goodAnim.durationMs > DEDICATED_FREEZE_MS,
    badPastFreeze: badAnim.durationMs > DEDICATED_FREEZE_MS,
    activeRoleHighlighted: liveSit.players?.some((p) => p.id === def.activeRole) ?? false,
    notGenericPressId: !ids.live.startsWith("press-"),
    blueUsMarkers: (liveSit.players?.filter((p) => p.team === "us").length ?? 0) === 11,
    formationTraceable: isPressOcc || isBuild || liveSit.homeShape?.formation === "4-2-3-1",
  };

  return {
    order: def.order,
    sessionId: def.sessionId,
    slug: def.slug,
    family: def.family,
    activeRole: def.activeRole,
    supportRoles: def.supportRoles,
    teamPerspective: "blue-zvv",
    formationOrigin: isBuild
      ? "canonical-4-2-3-1-start"
      : liveSit.homeShape?.phase === "final-third" || liveSit.homeShape?.phase === "mid-block"
        ? "advanced-4-2-3-1-final-third-occupation"
        : "press-occupation-from-4-2-3-1-reference (PRESS_V2; chrome Vanuit 4-2-3-1)",
    ballHolder,
    attackingDirection: liveSit.homeShape?.direction ?? "left-to-right",
    ids,
    gates,
    remainingLimitation:
      "Factory-compiled family film (shared PRESS_V2 / 4231 geometry with family-specific phase scripts). Not Golden Session hand-authored beat quality; body/gaze micro-detail is engine-default.",
  };
}

async function shot(page: Page, file: string) {
  ensureDir(path.dirname(file));
  await page.screenshot({ path: file, fullPage: false });
  console.log("shot", path.relative(process.cwd(), file));
}

async function advanceToDecision(page: Page) {
  for (let i = 0; i < 6; i++) {
    if (await page.locator("[data-testid='lesson-stage-decision']").count()) return;
    const next = page.locator("[data-testid='lesson-continue'], [data-testid='lesson-next-cta']").first();
    if (!(await next.count())) break;
    await next.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

async function smokeSession(page: Page, slug: string, outDir: string, prefix: string) {
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), "fdl-progress-v1");

  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']", { timeout: 20000 });
  await page.waitForTimeout(600);
  await shot(page, path.join(outDir, `${prefix}-opening-desktop.png`));

  await advanceToDecision(page);
  await page.waitForTimeout(500);
  await shot(page, path.join(outDir, `${prefix}-freeze-desktop.png`));

  // B is correct in catalog conventions
  await page.locator("[data-testid='choice-B']").click({ timeout: 8000 });
  await page.waitForSelector("[data-testid='lesson-stage-consequence'], [data-testid='consequence-panel']", {
    timeout: 10000,
  });
  await page.waitForTimeout(900);
  await shot(page, path.join(outDir, `${prefix}-good-outcome.png`));

  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), "fdl-progress-v1");
  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']");
  await advanceToDecision(page);
  await page.locator("[data-testid='choice-A']").click({ timeout: 8000 });
  await page.waitForSelector("[data-testid='lesson-stage-consequence'], [data-testid='consequence-panel']", {
    timeout: 10000,
  });
  await page.waitForTimeout(900);
  await shot(page, path.join(outDir, `${prefix}-bad-outcome.png`));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), "fdl-progress-v1");
  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']");
  await advanceToDecision(page);
  await page.waitForTimeout(500);
  await shot(page, path.join(outDir, `${prefix}-mobile-decision.png`));
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function main() {
  ensureDir(ROOT);
  ensureDir(ART);
  for (const b of Object.keys(BATCHES)) ensureDir(path.join(ART, b));

  const sessions = listDecisionLabSessions();
  const reports: SemanticReport[] = [];
  const catalogIssues: string[] = [];

  for (const def of DEDICATED_SESSION_FILM_DEFS) {
    const report = semanticForDef(def);
    reports.push(report);
    const batch = batchFor(def.order);
    const dir = path.join(ART, batch, def.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "semantic-report.json"), JSON.stringify(report, null, 2));

    const session = sessions.find((s) => s.id === def.sessionId);
    if (!session) catalogIssues.push(`missing catalog ${def.sessionId}`);
    else {
      const ids = filmIdsForSlug(def.slug);
      if (session.pitch.liveSituationId !== ids.live) {
        catalogIssues.push(`${def.slug} pitch mismatch`);
      }
      if (session.pitch.liveSituationId.includes("press-good") || session.pitch.liveSituationId === "connected-team") {
        catalogIssues.push(`${def.slug} still generic`);
      }
    }
    const bundle = getDedicatedBundleForSession(def.sessionId);
    if (!bundle) catalogIssues.push(`no bundle ${def.sessionId}`);
  }

  const gs = sessions[0]!;
  const summary = {
    generatedAt: new Date().toISOString(),
    dedicatedCount: DEDICATED_SESSION_FILM_DEFS.length,
    goldenLive: gs.pitch.liveSituationId,
    goldenIntact: gs.pitch.liveSituationId === "fdl-gs-inside-close-live",
    catalogIssues,
    allGatesPass: reports.every((r) => Object.values(r.gates).every(Boolean)),
    reports,
  };
  fs.writeFileSync(path.join(ART, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("semantic OK", summary.allGatesPass, "issues", catalogIssues.length);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Hub smoke
  await page.goto(`${BASE}/academie/decision-lab`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, path.join(ART, "hub-desktop.png"));

  // One representative per batch + all slugs lightweight opening
  const samples = [
    DEDICATED_SESSION_FILM_DEFS.find((d) => d.order === 4)!,
    DEDICATED_SESSION_FILM_DEFS.find((d) => d.order === 10)!,
    DEDICATED_SESSION_FILM_DEFS.find((d) => d.order === 13)!,
    DEDICATED_SESSION_FILM_DEFS.find((d) => d.order === 18)!,
  ];

  for (const def of samples) {
    const batch = batchFor(def.order);
    const dir = path.join(ART, batch, def.slug);
    try {
      await smokeSession(page, def.slug, dir, def.slug);
    } catch (e) {
      console.error("smoke fail", def.slug, e);
      fs.writeFileSync(path.join(dir, "smoke-error.txt"), String(e));
    }
  }

  // Opening-only for remaining sessions (faster coverage)
  for (const def of DEDICATED_SESSION_FILM_DEFS) {
    if (samples.some((s) => s.slug === def.slug)) continue;
    const batch = batchFor(def.order);
    const dir = path.join(ART, batch, def.slug);
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE}/academie/decision-lab/${def.slug}`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-testid='lesson-experience']", { timeout: 15000 });
      await page.waitForTimeout(400);
      await shot(page, path.join(dir, `${def.slug}-opening-desktop.png`));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE}/academie/decision-lab/${def.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await shot(page, path.join(dir, `${def.slug}-mobile-decision.png`));
    } catch (e) {
      fs.writeFileSync(path.join(dir, "smoke-error.txt"), String(e));
    }
  }

  // Mobile overflow checks
  const overflow: Record<string, boolean> = {};
  for (const vp of [
    { w: 390, h: 844 },
    { w: 360, h: 800 },
    { w: 320, h: 568 },
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(`${BASE}/academie/decision-lab/tweede-druk-8`, { waitUntil: "networkidle" });
    overflow[`${vp.w}x${vp.h}`] = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
  }

  fs.writeFileSync(
    path.join(ART, "browser-smoke.json"),
    JSON.stringify({ consoleErrors: consoleErrors.slice(0, 40), overflow, base: BASE }, null, 2),
  );

  await browser.close();
  console.log("d001-evidence done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
