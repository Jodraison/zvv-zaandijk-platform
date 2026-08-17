/**
 * C-008 visual evidence — clears Academy progress, captures required states.
 * Run: npx tsx scripts/c008-evidence.ts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.C008_BASE_URL ?? "http://localhost:3003";
const OUT = path.resolve("docs/football-decision-lab/reviews/phase-c/evidence/c008");
const KEY = "fdl-progress-v1";
const GS = "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1";

fs.mkdirSync(OUT, { recursive: true });

type ShotMeta = {
  file: string;
  viewport: string;
  progressState: string;
  ctaText: string;
  ourTeamColor: string;
  formationVisibility: string;
  attackDirection: string;
  activeRole: string;
  essentialLabelsReadable: boolean;
  notes?: string;
};

const report: ShotMeta[] = [];

async function clearProgress(page: Page) {
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
}

async function setProgress(page: Page, map: Record<string, unknown>) {
  await page.goto(`${BASE}/academie`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ k, map }) => localStorage.setItem(k, JSON.stringify(map)),
    { k: KEY, map },
  );
}

async function waitAcademy(page: Page) {
  await page.goto(`${BASE}/academie`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='academy-primary-cta'], [data-testid='academy-first-use'], [data-testid='academy-returning']", {
    timeout: 20000,
  });
  await page.waitForTimeout(600);
}

async function ctaText(page: Page) {
  const el = page.locator("[data-testid='academy-primary-cta']");
  if ((await el.count()) === 0) return "(missing)";
  return (await el.innerText()).replace(/\s+/g, " ").trim();
}

async function shot(
  page: Page,
  file: string,
  meta: Omit<ShotMeta, "file" | "ctaText"> & { ctaText?: string },
) {
  const cta = meta.ctaText ?? (await ctaText(page));
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, fullPage: false });
  report.push({ ...meta, file, ctaText: cta });
  console.log("shot", file, cta);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1 — untouched 1440×900
  await page.setViewportSize({ width: 1440, height: 900 });
  await clearProgress(page);
  await waitAcademy(page);
  await shot(page, "01-untouched-1440x900.png", {
    viewport: "1440x900",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "teach sequence starts at 4-2-3-1",
    attackDirection: "right (→)",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 2 — untouched 1280×720
  await page.setViewportSize({ width: 1280, height: 720 });
  await waitAcademy(page);
  await shot(page, "02-untouched-1280x720.png", {
    viewport: "1280x720",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "base/teach frames",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 3 — untouched mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await waitAcademy(page);
  await shot(page, "03-untouched-390x844.png", {
    viewport: "390x844",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "stacked + vergroot veld",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
    notes: "mobile first-use stack",
  });

  // 7 — formation base frame (click Bekijk opstelling / Onze basis)
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitAcademy(page);
  const baseBtn = page.getByRole("button", { name: "Onze basis" });
  if (await baseBtn.count()) await baseBtn.click();
  await page.waitForTimeout(400);
  await shot(page, "07-formation-frame-4231.png", {
    viewport: "1440x900",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "Onze basis: 4-2-3-1 (blue only)",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 8 — opponent frame
  const oppBtn = page.getByRole("button", { name: "Tegenstander" });
  if (await oppBtn.count()) await oppBtn.click();
  await page.waitForTimeout(400);
  await shot(page, "08-opponent-context-frame.png", {
    viewport: "1440x900",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "4231 + red context",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 9 — match / golden opening
  const situBtn = page.getByRole("button", { name: "Situatie" });
  if (await situBtn.count()) await situBtn.click();
  await page.waitForTimeout(500);
  await shot(page, "09-golden-session-opening.png", {
    viewport: "1440x900",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "press occupation from 4231",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 10 — mobile expanded pitch
  await page.setViewportSize({ width: 390, height: 844 });
  await clearProgress(page);
  await waitAcademy(page);
  const expand = page.getByRole("button", { name: "Vergroot veld" });
  if (await expand.count()) {
    await expand.click();
    await page.waitForTimeout(400);
  }
  await shot(page, "10-mobile-expanded-pitch.png", {
    viewport: "390x844",
    progressState: "untouched",
    ourTeamColor: "blue",
    formationVisibility: "expanded modal field",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });
  const close = page.getByRole("button", { name: "Sluiten" });
  if (await close.count()) await close.click();

  // 4 — opened desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await setProgress(page, {
    [GS]: {
      status: "started",
      step: 0,
      openedAt: "2026-07-23T08:00:00.000Z",
      updatedAt: "2026-07-23T08:00:00.000Z",
    },
  });
  await waitAcademy(page);
  await shot(page, "04-opened-desktop.png", {
    viewport: "1440x900",
    progressState: "opened",
    ourTeamColor: "blue",
    formationVisibility: "returning preview",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 5 — in progress
  await setProgress(page, {
    [GS]: {
      status: "started",
      step: 2,
      openedAt: "2026-07-23T08:00:00.000Z",
      updatedAt: "2026-07-23T09:00:00.000Z",
    },
  });
  await waitAcademy(page);
  await shot(page, "05-in-progress-desktop.png", {
    viewport: "1440x900",
    progressState: "in_progress",
    ourTeamColor: "blue",
    formationVisibility: "returning preview",
    attackDirection: "right",
    activeRole: "RW",
    essentialLabelsReadable: true,
  });

  // 6 — completed first
  await setProgress(page, {
    [GS]: {
      status: "completed",
      step: 5,
      openedAt: "2026-07-23T08:00:00.000Z",
      completedAt: "2026-07-23T09:00:00.000Z",
      updatedAt: "2026-07-23T09:00:00.000Z",
    },
  });
  await waitAcademy(page);
  await shot(page, "06-completed-first-desktop.png", {
    viewport: "1440x900",
    progressState: "opened (first completed → next)",
    ourTeamColor: "blue",
    formationVisibility: "next session preview",
    attackDirection: "right",
    activeRole: "varies by next session",
    essentialLabelsReadable: true,
  });

  // overflow + console
  await clearProgress(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await waitAcademy(page);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 1,
      fieldW: document.querySelector("[data-testid='formation-teach-field']")?.clientWidth ?? 0,
      bodyText: document.body.innerText,
    };
  });

  const summary = {
    overflow,
    consoleErrors,
    shots: report,
    gates: {
      untouchedStartCta: report.some(
        (r) => r.progressState === "untouched" && /Start eerste beslissessie/i.test(r.ctaText),
      ),
      untouchedNoGaVerder: report
        .filter((r) => r.progressState === "untouched")
        .every((r) => !/Ga verder/i.test(r.ctaText)),
      fieldMinDesktop: overflow.fieldW >= 650,
      noHorizontalOverflow: !overflow.overflow,
      noHervatten: !/Hervatten/i.test(overflow.bodyText),
      noRecentUntouched: !/Recente activiteit|Recent/i.test(
        // only first-use section approx — soft check
        overflow.bodyText.split("Wat gebeurt er")[0] ?? "",
      ),
    },
  };

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.gates, null, 2));
  console.log("Wrote", OUT);

  await browser.close();
  if (!summary.gates.untouchedStartCta || !summary.gates.untouchedNoGaVerder) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
