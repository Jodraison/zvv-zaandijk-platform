import { chromium } from "playwright";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.on("dialog", (d) => d.accept());

await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
const stamp = Date.now();
await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(`OWF Debug ${stamp}`);
await page.locator('input[type="datetime-local"]').fill("2026-08-03T15:00");
await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
const matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1];
console.log("match", matchId);

async function pick() {
  await page.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 8000 });
  await page.evaluate(() => {
    const root = document.querySelector('[role="dialog"]');
    const btn = [...root.querySelectorAll("ul button")].find(
      (b) => !b.disabled && !/leegmaken|annuleren/i.test(b.textContent || ""),
    );
    btn?.click();
  });
  await page
    .locator('[role="dialog"]')
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => page.keyboard.press("Escape"));
}

for (const code of ["GK", "LB", "LCB", "RCB", "RB", "LCVM", "RCVM", "LM", "CAM", "RM", "SP"]) {
  await page.evaluate((c) => {
    document.querySelector(`button[aria-label^="${c}: leeg"]`)?.click();
  }, code);
  await page.waitForTimeout(150);
  if (!(await page.locator('[role="dialog"]').count())) {
    await page
      .getByRole("button", { name: new RegExp(`${code}: leeg`) })
      .first()
      .evaluate((el) => el.click())
      .catch(() => {});
    await page.waitForTimeout(150);
  }
  await pick();
}

for (let i = 0; i < 40; i++) {
  if (await page.getByText(/Iedereen is ingedeeld/i).count()) break;
  const ok = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h3")].find((el) =>
      /Nog indelen/i.test(el.textContent || ""),
    );
    if (!h) return false;
    const root = h.closest("div.rounded-2xl") || h.parentElement;
    const n = (root?.querySelectorAll("li") || []).length;
    const label = n > 3 ? "Bank" : "Afwezig";
    const btn = [...(root?.querySelectorAll("button") || [])].find(
      (b) => b.textContent?.trim() === label,
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!ok) break;
  await page.waitForTimeout(40);
}

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) =>
    /Opstelling bevestigen/i.test(x.textContent || ""),
  );
  if (b) {
    b.disabled = false;
    b.click();
  }
});
await page.waitForTimeout(2500);

await page.goto(
  `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`,
  { waitUntil: "networkidle", timeout: 90_000 },
);
await page.getByLabel("Goals voor").fill("3");
await page.getByLabel("Goals tegen").fill("1");
await page.waitForTimeout(400);

const scorers = page.locator('select:has(option:text-is("Kies scorer"))');
const used = [];
for (let i = 0; i < 3; i++) {
  const values = await scorers
    .nth(i)
    .locator("option")
    .evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  await scorers.nth(i).selectOption(values[i % values.length]);
  used.push(values[i % values.length]);
}
const assists = page.locator('select:has(option:text-is("Geen assist"))');
for (let i = 0; i < 2; i++) {
  const values = await assists
    .nth(i)
    .locator("option")
    .evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  await assists.nth(i).selectOption(values.find((v) => v !== used[i]) || values[0]);
}
await page.locator('select:has(option:text-is("Kies MVP"))').selectOption({ index: 1 });

// Dump payload validity hints
const pre = await page.evaluate(() => {
  const alert = document.querySelector('[role="alert"]')?.textContent || "";
  const payload = document.querySelector('input[name="payload"]')?.value || "";
  let parsed = null;
  try {
    parsed = JSON.parse(payload);
  } catch {
    parsed = { parseError: true };
  }
  return {
    alert,
    status: parsed?.status,
    goals_for: parsed?.goals_for,
    goals: parsed?.goal_events?.length ?? parsed?.goals?.length,
    selected: parsed?.selected_player_ids?.length,
    wotm: parsed?.wotm_player_id,
    keys: parsed ? Object.keys(parsed) : [],
  };
});
console.log("PRE", pre);

await page.getByRole("button", { name: /Controleren en afronden/i }).click();
const navigated = await page
  .waitForURL(/step=controle/, { timeout: 45_000 })
  .then(() => true)
  .catch(() => false);
await page.waitForTimeout(1000);

const post = await page.evaluate(() => {
  const body = document.body.innerText;
  const alert = document.querySelector('[role="alert"]')?.textContent || "";
  const banners = [...document.querySelectorAll("[class*='red'], [role='status'], .club-btn-primary")]
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 12);
  const payload = document.querySelector('input[name="payload"]')?.value || "";
  let lineupLen = null;
  try {
    lineupLen = JSON.parse(payload).lineup?.length ?? null;
  } catch {
    lineupLen = -1;
  }
  return {
    url: location.href,
    alert,
    banners,
    lineupLen,
    snip: body.match(/Fout[\s\S]{0,400}|opgeslagen|Controleren|definitief/i)?.[0],
  };
});
console.log("navigated", navigated);
console.log("POST", JSON.stringify(post, null, 2));

await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
  waitUntil: "networkidle",
});
const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
if (await del.count()) {
  await del.click();
  await page.waitForTimeout(300);
  const confirmInput = page.locator('input[type="text"], input:not([type])').last();
  if (await confirmInput.count()) {
    const ph = (await confirmInput.getAttribute("placeholder")) || "";
    const label = await page.locator("label").filter({ hasText: /typ|bevestig|tegenstander/i }).innerText().catch(() => "");
    void ph;
    void label;
    // typed confirm for played matches
    const opponent = await page.locator("h1").innerText().catch(() => "OWF");
    await confirmInput.fill(opponent.trim()).catch(() => {});
  }
  await page.getByRole("button", { name: /^Verwijderen$/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(1000);
}
await browser.close();
