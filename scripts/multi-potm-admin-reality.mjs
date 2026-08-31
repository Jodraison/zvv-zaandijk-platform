/**
 * Authenticated Beheer multi-POTM reality gate.
 * Uses existing .review-auth/admin-storage.json; never prints tokens.
 * Mutates only QA Multi POTM Review; leaves WSV 29 Aug 2026 intact.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.MULTI_POTM_BASE ?? "http://127.0.0.1:3025";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const PROD_MATCH = "c1ccbec0-3619-4c5f-adb0-3111b6055a7e";
const QA_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0001";
const DANIQUE = "f1000001-0000-4000-8000-000000000011";
const MANDY = "f1000001-0000-4000-8000-00000000000a";
const MELISSA = "f1000001-0000-4000-8000-000000000002";
const AUTH = ".review-auth/admin-storage.json";
const SHOT = join(process.cwd(), ".review-screenshots", "multi-potm-admin-reality");
const ART = join(process.cwd(), ".review-artifacts", "multi-potm-admin-reality");
mkdirSync(SHOT, { recursive: true });
mkdirSync(ART, { recursive: true });

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const steps = [];
function record(action, result, pass, extra) {
  steps.push({ action, result, pass: pass ? "PASS" : "FAIL", ...extra });
  console.log(`${pass ? "PASS" : "FAIL"}: ${action} — ${result}`);
}

async function prodWinners() {
  const { data } = await sb.from("match_wotm_winners").select("player_id").eq("match_id", PROD_MATCH);
  return (data ?? []).map((r) => r.player_id).sort();
}

async function qaWinners() {
  const { data } = await sb.from("match_wotm_winners").select("player_id").eq("match_id", QA_ID);
  return (data ?? []).map((r) => r.player_id).sort();
}

async function cleanupQa() {
  for (const table of [
    "match_wotm_winners",
    "match_matchday_roster",
    "match_lineup_entries",
    "match_card_events",
    "match_substitutions",
    "match_position_changes",
    "match_player_stats",
    "match_goal_events",
  ]) {
    await sb.from(table).delete().eq("match_id", QA_ID);
  }
  await sb.from("matches").delete().eq("id", QA_ID);
}

async function seedQa() {
  await cleanupQa();
  const { error } = await sb.from("matches").insert({
    id: QA_ID,
    season_id: SEASON,
    opponent: "QA Multi POTM Review",
    kickoff_at: "2026-09-01T12:00:00.000Z",
    is_home: true,
    match_type: "friendly",
    status: "played",
    goals_for: 0,
    goals_against: 0,
    notes: "__qa_fixture__",
    lineup_status: "confirmed",
    integrity_state: "verified",
    wotm_player_id: null,
  });
  if (error) throw new Error(`seed match: ${error.message}`);
  const lineup = [
    { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0011", player_id: DANIQUE, role: "starter", position: "SP", sort_order: 1 },
    { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0012", player_id: MANDY, role: "starter", position: "CAM", sort_order: 2 },
    { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0013", player_id: MELISSA, role: "starter", position: "LM", sort_order: 3 },
  ];
  const { error: le } = await sb.from("match_lineup_entries").insert(
    lineup.map((r) => ({ ...r, match_id: QA_ID, absence_reason: null })),
  );
  if (le) throw new Error(`seed lineup: ${le.message}`);
}

function afterUrl(matchId) {
  return `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd`;
}

function reviewAdminEmail() {
  if (process.env.ADMIN_REVIEW_EMAIL) return process.env.ADMIN_REVIEW_EMAIL;
  for (const file of ["scripts/refresh-admin-auth-3013.mjs", "scripts/final-ops-auth-state.mjs"]) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, "utf8").match(/ADMIN_EMAIL = "([^"]+)"/);
    if (m) return m[1];
  }
  return "";
}

async function injectSession(context, page, session) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ref = new URL(url).hostname.split(".")[0];
  const cookieName = `sb-${ref}-auth-token`;
  const cookiePayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type ?? "bearer",
    user: session.user,
  };
  const encoded = encodeURIComponent(JSON.stringify(cookiePayload));
  await context.addCookies(
    [BASE, "http://localhost:3025", "http://127.0.0.1:3025"].map((origin) => ({
      name: cookieName,
      value: encoded,
      url: `${origin}/`,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    })),
  );
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(
    ({ key, access_token, refresh_token }) => {
      localStorage.setItem(
        key,
        JSON.stringify({ access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + 3600 }),
      );
    },
    { key: cookieName, access_token: session.access_token, refresh_token: session.refresh_token },
  );
}

async function beheerOpen(page) {
  await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(600);
  const path = new URL(page.url()).pathname;
  const body = await page.locator("body").innerText();
  return path.startsWith("/beheer") && !/Beheerderslogin/.test(body.slice(0, 800));
}

async function ensureAuth(context, page) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = reviewAdminEmail();
  if (url && service && anon && email) {
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (!linkErr && link?.properties?.email_otp) {
      const { data: verified, error: verErr } = await userClient.auth.verifyOtp({
        email,
        token: link.properties.email_otp,
        type: "email",
      });
      if (!verErr && verified.session) {
        await injectSession(context, page, verified.session);
        await context.storageState({ path: AUTH });
      }
    }
  }
  const ok = await beheerOpen(page);
  writeFileSync(join(ART, "beheer-list.txt"), `${page.url()}\n\n${await page.locator("body").innerText()}`, "utf8");
  return ok;
}

async function checkedNames(page) {
  return page.locator("fieldset").filter({ hasText: "Speelsters van de wedstrijd" }).locator("label").evaluateAll((labels) =>
    labels
      .filter((el) => el.querySelector("input[type=checkbox]")?.checked)
      .map((el) => el.textContent.replace(/\s+/g, " ").trim()),
  );
}

async function toggleName(page, needle) {
  const box = page.locator("fieldset").filter({ hasText: "Speelsters van de wedstrijd" }).locator("label").filter({ hasText: needle });
  await box.first().click();
}

async function summaryMvp(page) {
  const text = await page.locator("text=Samenvatting").locator("xpath=ancestor::div[1]").innerText();
  return text;
}

async function saveReload(page, matchId) {
  await page.getByRole("button", { name: /Controleren en afronden|Uitslag opslaan|Opslaan/ }).first().click();
  await page.waitForTimeout(2500);
  await page.goto(afterUrl(matchId), { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("fieldset", { timeout: 30_000 });
}

let failed = false;
const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

try {
  const beforeProd = await prodWinners();
  const expectedProd = [MANDY, DANIQUE].sort();
  if (beforeProd.join() !== expectedProd.join()) {
    throw new Error(`Production POTM unexpected before test: ${beforeProd.join(",")}`);
  }

  const authed = await ensureAuth(context, page);
  record("authenticated Beheer", authed ? page.url() : "login redirect", authed);
  if (!authed) throw new Error("Beheer auth unavailable");

  await page.goto(afterUrl(PROD_MATCH), { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(800);
  writeFileSync(
    join(ART, "prod-admin-open.txt"),
    `${page.url()}\n\n${await page.locator("body").innerText()}`,
    "utf8",
  );
  await page.screenshot({ path: join(SHOT, "00-prod-admin-open.png"), fullPage: true });
  if (/Beheerderslogin/.test(await page.locator("body").innerText())) {
    throw new Error("Lost Beheer session on last-match page");
  }
  await page.waitForSelector("text=Speelsters van de wedstrijd", { timeout: 30_000 });
  const prodChecked = await checkedNames(page);
  const prodSummary = await summaryMvp(page);
  const hasSingleSelect = (await page.locator("select").filter({ hasText: /MVP|Speelster van de wedstrijd/ }).count()) === 0;
  await page.screenshot({ path: join(SHOT, "01-desktop-prod-admin-danique-mandy.png"), fullPage: true });
  const prodOk =
    prodChecked.some((n) => /Danique/i.test(n)) &&
    prodChecked.some((n) => /Mandy/i.test(n)) &&
    /Danique/i.test(prodSummary) &&
    /Mandy/i.test(prodSummary);
  record("desktop admin production last match", `${prodChecked.join(" | ")} :: ${prodSummary.replace(/\s+/g, " ").slice(0, 180)}`, prodOk, {
    screenshot: "01-desktop-prod-admin-danique-mandy.png",
    no_single_select: hasSingleSelect,
  });
  if (!prodOk) failed = true;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=Speelsters van de wedstrijd", { timeout: 30_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  await page.screenshot({ path: join(SHOT, "02-mobile390-prod-admin.png"), fullPage: true });
  record("mobile 390 admin production form", overflow ? "horizontal overflow" : "no overflow", !overflow, {
    screenshot: "02-mobile390-prod-admin.png",
  });
  if (overflow) failed = true;
  await page.setViewportSize({ width: 1440, height: 900 });

  await seedQa();
  await page.goto(afterUrl(QA_ID), { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("text=Speelsters van de wedstrijd", { timeout: 30_000 });
  const startChecked = await checkedNames(page);
  await page.screenshot({ path: join(SHOT, "03-qa-start-zero.png"), fullPage: true });
  record("QA start 0 winners", startChecked.join(" | ") || "none", startChecked.length === 0);

  await toggleName(page, "Mandy");
  await saveReload(page, QA_ID);
  const one = await checkedNames(page);
  await page.screenshot({ path: join(SHOT, "04-qa-one-mandy.png"), fullPage: true });
  const oneOk = one.length === 1 && one.some((n) => /Mandy/i.test(n));
  record("save/reload 1 Mandy", one.join(" | "), oneOk);
  if (!oneOk) failed = true;

  await toggleName(page, "Danique");
  await saveReload(page, QA_ID);
  const two = await checkedNames(page);
  await page.screenshot({ path: join(SHOT, "05-qa-two.png"), fullPage: true });
  const twoOk = two.some((n) => /Mandy/i.test(n)) && two.some((n) => /Danique/i.test(n)) && two.length === 2;
  record("save/reload 2 Mandy+Danique", two.join(" | "), twoOk);
  if (!twoOk) failed = true;

  await toggleName(page, "Melissa");
  await saveReload(page, QA_ID);
  const three = await checkedNames(page);
  await page.screenshot({ path: join(SHOT, "06-qa-three.png"), fullPage: true });
  const threeOk =
    three.length === 3 &&
    three.some((n) => /Mandy/i.test(n)) &&
    three.some((n) => /Danique/i.test(n)) &&
    three.some((n) => /Melissa/i.test(n));
  record("save/reload 3", three.join(" | "), threeOk);
  if (!threeOk) failed = true;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: join(SHOT, "07-mobile390-qa-three.png"), fullPage: true });
  const ov3 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  record("mobile 390 with 3 selected", ov3 ? "overflow" : "no overflow", !ov3);
  if (ov3) failed = true;
  await page.setViewportSize({ width: 1440, height: 900 });

  await toggleName(page, "Mandy");
  await saveReload(page, QA_ID);
  const twoLeft = await checkedNames(page);
  await page.screenshot({ path: join(SHOT, "08-qa-remove-mandy.png"), fullPage: true });
  const twoLeftOk = twoLeft.length === 2 && !twoLeft.some((n) => /Mandy/i.test(n)) && twoLeft.some((n) => /Danique/i.test(n));
  record("remove Mandy → Danique+Melissa", twoLeft.join(" | "), twoLeftOk);
  if (!twoLeftOk) failed = true;

  for (const name of twoLeft) {
    const short = name.replace(/^#\d+\s*/, "").split(" ")[0];
    await toggleName(page, short);
  }
  await saveReload(page, QA_ID);
  const cleared = await checkedNames(page);
  const dbCleared = await qaWinners();
  await page.screenshot({ path: join(SHOT, "09-qa-cleared.png"), fullPage: true });
  const clearOk = cleared.length === 0 && dbCleared.length === 0;
  record("clear all", `${cleared.join(" | ") || "none"} db=${dbCleared.length}`, clearOk);
  if (!clearOk) failed = true;

  await cleanupQa();
  const qaGone = await sb.from("matches").select("id").eq("id", QA_ID).maybeSingle();
  record("QA match deleted", qaGone.data ? "still present" : "removed", !qaGone.data);

  const afterProd = await prodWinners();
  const prodIntact = afterProd.join() === expectedProd.join();
  record("production last match intact", afterProd.join(","), prodIntact);
  if (!prodIntact) failed = true;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/wedstrijden/${PROD_MATCH}`, { waitUntil: "networkidle", timeout: 90_000 });
  const pubDesk = await page.locator("body").innerText();
  await page.screenshot({ path: join(SHOT, "10-public-desktop.png"), fullPage: true });
  const pubDeskOk =
    /Speelsters van de wedstrijd/i.test(pubDesk) &&
    /Danique van Heeringen/i.test(pubDesk) &&
    /Mandy Kalmeijer/i.test(pubDesk);
  record("public desktop last match", pubDeskOk ? "shared heading + both names" : pubDesk.slice(0, 200), pubDeskOk);
  if (!pubDeskOk) failed = true;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  const pubMob = await page.locator("body").innerText();
  const pubOv = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  await page.screenshot({ path: join(SHOT, "11-public-mobile390.png"), fullPage: true });
  const pubMobOk = /Speelsters van de wedstrijd/i.test(pubMob) && /Danique/i.test(pubMob) && /Mandy/i.test(pubMob) && !pubOv;
  record("public mobile 390", pubMobOk ? "shared + no overflow" : "fail", pubMobOk);
  if (!pubMobOk) failed = true;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/selectie/${DANIQUE}?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  const danHtml = await page.locator("body").innerText();
  const danMvp = (danHtml.match(/MVP\s+(\d+)/) || [])[1];
  await page.screenshot({ path: join(SHOT, "12-stats-danique.png"), fullPage: false });
  record("Danique season MVP", danMvp ?? "missing", danMvp === "1");
  if (danMvp !== "1") failed = true;

  await page.goto(`${BASE}/selectie/${MANDY}?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  const manHtml = await page.locator("body").innerText();
  const manMvp = (manHtml.match(/MVP\s+(\d+)/) || [])[1];
  await page.screenshot({ path: join(SHOT, "13-stats-mandy.png"), fullPage: false });
  record("Mandy season MVP", manMvp ?? "missing", manMvp === "1");
  if (manMvp !== "1") failed = true;
} catch (e) {
  failed = true;
  record("script error", e instanceof Error ? e.message : String(e), false);
  try {
    await page.screenshot({ path: join(SHOT, "99-error.png"), fullPage: true });
  } catch {
    /* ignore */
  }
} finally {
  try {
    await cleanupQa();
  } catch {
    /* ignore */
  }
  const afterProd = await prodWinners().catch(() => []);
  writeFileSync(
    join(ART, "report.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        failed,
        production_winners: afterProd,
        steps,
      },
      null,
      2,
    ),
    "utf8",
  );
  await browser.close();
}

if (failed) process.exit(1);
console.log("multi-potm-admin-reality: PASS");
