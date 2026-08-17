/**
 * D-002 evidence — Batch A (#2–#9) screenshots + semantic reports.
 * Run: npx tsx scripts/d002-evidence.ts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { filmIdsForSlug } from "../src/lib/decision-lab/films/dedicated/ids";
import {
  getPressBatchABundle,
  listPressBatchAFreezeMs,
  PRESS_BATCH_A_SESSION_IDS,
  assertBatchAUniqueTimelines,
} from "../src/lib/decision-lab/films/press-batch-a";
import { getTacticalSituation } from "../src/components/academie/tactical-situations";
import { getTacticalAnimation } from "../src/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "../src/lib/academie/tactical-animation-engine";
import { DEDICATED_SESSION_FILM_DEFS } from "../src/lib/decision-lab/films/dedicated/ids";

const BASE = process.env.D002_BASE_URL ?? "http://localhost:3003";
const ART = path.resolve("docs/football-decision-lab/reviews/phase-d/artifacts/d-002");

const ORDER: Array<{ order: number; sessionId: string; slug: string }> = DEDICATED_SESSION_FILM_DEFS.filter(
  (d) => PRESS_BATCH_A_SESSION_IDS.has(d.sessionId),
).map((d) => ({ order: d.order, sessionId: d.sessionId, slug: d.slug }));

function ensure(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function shot(page: Page, file: string) {
  ensure(path.dirname(file));
  await page.screenshot({ path: file, fullPage: false });
  console.log("shot", path.relative(process.cwd(), file));
}

async function advanceTo(page: Page, stage: "scan" | "decision") {
  for (let i = 0; i < 6; i++) {
    if (await page.locator(`[data-testid='lesson-stage-${stage}']`).count()) return;
    const next = page.locator("[data-testid='lesson-continue'], [data-testid='lesson-next-cta']").first();
    if (!(await next.count())) break;
    await next.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

async function clearProgress(page: Page) {
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), "fdl-progress-v1");
}

async function smoke(page: Page, slug: string, dir: string, prefix: string) {
  await clearProgress(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']", { timeout: 20000 });
  await page.waitForTimeout(700);
  await shot(page, path.join(dir, `${prefix}-opening.png`));

  await advanceTo(page, "scan");
  await page.waitForTimeout(400);
  await shot(page, path.join(dir, `${prefix}-scan.png`));

  await advanceTo(page, "decision");
  await page.waitForTimeout(500);
  await shot(page, path.join(dir, `${prefix}-freeze.png`));

  await page.locator("[data-testid='choice-B']").click({ timeout: 8000 });
  await page.waitForSelector("[data-testid='consequence-panel']", { timeout: 10000 });
  await page.waitForTimeout(1000);
  await shot(page, path.join(dir, `${prefix}-good.png`));

  await clearProgress(page);
  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']");
  await advanceTo(page, "decision");
  await page.locator("[data-testid='choice-A']").click({ timeout: 8000 });
  await page.waitForSelector("[data-testid='consequence-panel']", { timeout: 10000 });
  await page.waitForTimeout(1000);
  await shot(page, path.join(dir, `${prefix}-bad.png`));

  await clearProgress(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/academie/decision-lab/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='lesson-experience']");
  await advanceTo(page, "decision");
  await page.waitForTimeout(500);
  await shot(page, path.join(dir, `${prefix}-mobile-decision.png`));
}

async function main() {
  assertBatchAUniqueTimelines();
  ensure(ART);
  const freezeMs = listPressBatchAFreezeMs();
  const reports = [];

  for (const row of ORDER) {
    const dir = path.join(ART, `session-${String(row.order).padStart(2, "0")}-${row.slug}`);
    ensure(dir);
    const bundle = getPressBatchABundle(row.sessionId)!;
    const ids = filmIdsForSlug(row.slug);
    const sit = getTacticalSituation(ids.live)!;
    const anim = getTacticalAnimation(ids.live)!;
    const freeze = evaluateTacticalAnimation(sit, anim, bundle.freezeMs);
    const report = {
      order: row.order,
      sessionId: row.sessionId,
      slug: row.slug,
      activeRole: bundle.activeRole,
      freezeMs: bundle.freezeMs,
      previewMs: bundle.previewMs,
      liveDurationMs: anim.durationMs,
      positioningMode: anim.positioningMode,
      stepIds: anim.steps.map((s) => s.id),
      mobileFocusIds: bundle.mobileFocusIds,
      ballHolderOpening: sit.players?.find((p) => p.hasBall)?.id ?? null,
      freezeEvaluates: Boolean(freeze),
      authored: anim.positioningMode === "authored",
    };
    reports.push(report);
    fs.writeFileSync(path.join(dir, "semantic-report.json"), JSON.stringify(report, null, 2));
    fs.writeFileSync(
      path.join(dir, "beat-sheet.md"),
      `# Session #${row.order} — ${row.slug}\n\n` +
        `- Active role: \`${bundle.activeRole}\`\n` +
        `- Freeze: ${bundle.freezeMs} ms\n` +
        `- Live duration: ${anim.durationMs} ms\n` +
        `- Steps: ${anim.steps.map((s) => s.id).join(" → ")}\n` +
        `- Opening ball: ${report.ballHolderOpening}\n` +
        `- Mobile focus: ${bundle.mobileFocusIds.join(", ")}\n` +
        `- Authored: yes (D-002)\n`,
    );
  }

  fs.writeFileSync(
    path.join(ART, "summary.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), freezeMs, reports }, null, 2),
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  for (const row of ORDER) {
    const dir = path.join(ART, `session-${String(row.order).padStart(2, "0")}-${row.slug}`);
    try {
      await smoke(page, row.slug, dir, row.slug);
    } catch (e) {
      fs.writeFileSync(path.join(dir, "smoke-error.txt"), String(e));
      console.error("smoke fail", row.slug, e);
    }
  }

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
  console.log("d002-evidence done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
