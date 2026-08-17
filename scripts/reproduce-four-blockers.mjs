/**
 * Reproduceer 4 blockers + before screenshots/diagnostics.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const ART = join(process.cwd(), ".review-artifacts", "four-blockers-real-browser-recovery");
const BEFORE = join(process.cwd(), ".review-screenshots", "four-blockers-real-browser-recovery", "before");
mkdirSync(ART, { recursive: true });
mkdirSync(BEFORE, { recursive: true });

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}
loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: memberships } = await sb
  .from("player_season_memberships")
  .select("player_id, is_captain, is_vice_captain, shirt_number, display_position, players(full_name)")
  .eq("season_id", SEASON);

const leadership = (memberships || []).map((m) => ({
  name: m.players?.full_name ?? m.player_id,
  shirt: m.shirt_number,
  is_captain: !!m.is_captain,
  is_vice_captain: !!m.is_vice_captain,
}));
writeFileSync(join(ART, "participant-query-before.json"), JSON.stringify({ leadership }, null, 2));
console.log(
  "LEADERS",
  leadership.filter((x) => x.is_captain || x.is_vice_captain || /Melissa Rietveld|Dionne van Dijk/i.test(x.name)),
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const observations = [];

async function shot(name) {
  await page.screenshot({ path: join(BEFORE, `${name}.png`), fullPage: true });
}

// A selectie
await page.goto(`${BASE}/selectie?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
await shot("selectie");
const selectieText = await page.locator("body").innerText();
observations.push({
  area: "leadership-selectie",
  melissaVisible: /Melissa Rietveld/i.test(selectieText),
  melissaCaptainLabel: /Melissa Rietveld[\s\S]{0,80}Aanvoerder|Aanvoerder[\s\S]{0,80}Melissa/i.test(selectieText),
  dionneVisible: /Dionne van Dijk/i.test(selectieText),
  dionneViceLabel: /Dionne[\s\S]{0,80}Vice-aanvoerder|Vice-aanvoerder[\s\S]{0,80}Dionne|Vice\b/i.test(selectieText),
});

// B fitness — find a session
await page.goto(`${BASE}/beheer/fitheid?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
const stationHref = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a[href*="/station/"]')].find((el) =>
    /sprint/i.test(el.getAttribute("href") || ""),
  );
  return a?.getAttribute("href") || null;
});
let fitnessDiag = { stationHref };
if (stationHref) {
  await page.goto(`${BASE}${stationHref}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(500);
  // scroll a bit like human
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.waitForTimeout(200);
  fitnessDiag = await page.evaluate(() => {
    const sticky = document.querySelector("[data-station-root] header.sticky, [data-station-root] header");
    const colHeader = [...document.querySelectorAll("li")].find((li) =>
      /SPEELSTER|Speelster/i.test(li.textContent || ""),
    );
    const firstPlayer = [...document.querySelectorAll("ul li p.font-semibold")].find((p) =>
      /Jelisa|De Jonge|#1/i.test(p.textContent || ""),
    );
    const firstRow = firstPlayer?.closest("li");
    const h = sticky?.getBoundingClientRect();
    const c = colHeader?.getBoundingClientRect();
    const r = firstRow?.getBoundingClientRect();
    const overlapSticky = h && r ? Math.max(0, h.bottom - r.top) : null;
    const overlapCol = c && r ? Math.max(0, c.bottom - r.top) : null;
    return {
      sticky: h ? { top: h.top, bottom: h.bottom, height: h.height, className: sticky.className } : null,
      colHeader: c ? { top: c.top, bottom: c.bottom, height: c.height } : null,
      firstRow: r ? { top: r.top, bottom: r.bottom, text: firstPlayer?.textContent } : null,
      overlapStickyPixels: overlapSticky,
      overlapColPixels: overlapCol,
      jelisaVisible: !!firstPlayer && (firstPlayer.getBoundingClientRect().top > (h?.bottom ?? 0) - 2),
    };
  });
  await shot("fitness-sprint");
  writeFileSync(join(ART, "fitness-header-before.json"), JSON.stringify(fitnessDiag, null, 2));
}
observations.push({ area: "fitness", ...fitnessDiag });

// C create match for lineup + finish
await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
const stamp = Date.now();
await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(`OWF FourBlock ${stamp}`);
await page.locator('input[type="datetime-local"]').fill("2026-08-22T15:00");
await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
const matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1];
await page.waitForTimeout(800);
await shot("lineup-opstelling");
const lineupDiag = await page.evaluate(() => {
  const pitch = document.querySelector('[data-testid="formation-pitch"]');
  const r = pitch?.getBoundingClientRect();
  const cs = pitch ? getComputedStyle(pitch) : null;
  const empty = document.querySelectorAll('button[aria-label$="leeg — speelster kiezen"]').length;
  const opVeld = [...document.querySelectorAll("button")].filter((b) =>
    /^Op veld$/i.test((b.textContent || "").trim()),
  ).length;
  const blackLineSuspect = !pitch || (r && r.height < 8);
  return {
    url: location.href,
    pitchFound: !!pitch,
    width: r ? Math.round(r.width) : 0,
    height: r ? Math.round(r.height) : 0,
    top: r ? Math.round(r.top) : null,
    display: cs?.display,
    visibility: cs?.visibility,
    opacity: cs?.opacity,
    heightCss: cs?.height,
    overflow: cs?.overflow,
    emptySlots: empty,
    opVeldButtons: opVeld,
    blackLineSuspect,
  };
});
writeFileSync(join(ART, "lineup-computed-layout-before.json"), JSON.stringify(lineupDiag, null, 2));
observations.push({ area: "lineup", ...lineupDiag });

// D finish without confirming lineup first
await page.goto(
  `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`,
  { waitUntil: "networkidle", timeout: 90_000 },
);
await page.waitForTimeout(600);
await shot("finish-before-lineup");
const participantBefore = await page.evaluate(() => {
  const scorers = [...document.querySelectorAll("select")].filter((s) =>
    [...s.options].some((o) => /Kies scorer/i.test(o.textContent || "")),
  );
  const assists = [...document.querySelectorAll("select")].filter((s) =>
    [...s.options].some((o) => /Geen assist/i.test(o.textContent || "")),
  );
  const scorerOpts = scorers[0]
    ? [...scorers[0].options].map((o) => ({ value: o.value, text: o.textContent }))
    : [];
  const assistOpts = assists[0]
    ? [...assists[0].options].map((o) => ({ value: o.value, text: o.textContent }))
    : [];
  const body = document.body.innerText;
  return {
    scorerOptionCount: scorerOpts.filter((o) => o.value).length,
    assistOptionCount: assistOpts.filter((o) => o.value).length,
    scorerOpts: scorerOpts.slice(0, 5),
    assistOpts: assistOpts.slice(0, 5),
    hasGateText: /wedstrijdselectie|Nog niemand|opstelling/i.test(body),
  };
});
writeFileSync(
  join(ART, "participant-query-before.json"),
  JSON.stringify({ leadership, finishWithoutLineup: participantBefore, matchId }, null, 2),
);
observations.push({ area: "participants", ...participantBefore, matchId });

// cleanup match
try {
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
  if (await del.count()) {
    await del.click();
    await page.waitForTimeout(200);
    const inp = page.locator('[role="dialog"] input').first();
    if (await inp.count()) await inp.fill("VERWIJDEREN");
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Verwijderen$/i }).click({ force: true });
    await page.waitForTimeout(800);
  }
} catch {
  /* ok */
}

writeFileSync(join(ART, "before-observations.md"), [
  "# Before observations — four blockers",
  "",
  "```json",
  JSON.stringify(observations, null, 2),
  "```",
].join("\n"));

console.log(JSON.stringify(observations, null, 2));
await browser.close();
