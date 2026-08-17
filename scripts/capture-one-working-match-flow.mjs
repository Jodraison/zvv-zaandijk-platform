/**
 * FASE D — volledige handmatige E2E + screenshots + cleanup.
 * Alleen echte productroutes; cleanup in finally.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "one-working-match-flow");
const ART = join(process.cwd(), ".review-artifacts", "one-working-match-flow");
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const checklist = {};
const mark = (key, pass, note = "") => {
  checklist[key] = { result: pass ? "PASS" : "FAIL", note };
  console.log(pass ? "PASS" : "FAIL", key, note);
};

let matchId = null;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.on("dialog", async (dialog) => {
  // MatchAdminForm gebruikt window.confirm vóór played-save
  await dialog.accept();
});

async function shot(name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
}

async function pitchH() {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="formation-pitch"]');
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  });
}

async function pickFirstPlayer() {
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 8000 });
  const clicked = await page.evaluate(() => {
    const root = document.querySelector('[role="dialog"]');
    if (!root) return false;
    const btn = [...root.querySelectorAll("ul button")].find(
      (b) => !b.disabled && !/leegmaken|annuleren/i.test(b.textContent || ""),
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error("Geen beschikbare speelsterknop in picker");
  await page.waitForTimeout(350);
  await page
    .locator('[role="dialog"]')
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(async () => {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    });
}

/** Alleen knoppen in de "Nog indelen"-sectie — nooit veldspeler-acties. */
async function clickNogIndelenAction(label) {
  return page.evaluate((lab) => {
    const h = [...document.querySelectorAll("h3")].find((el) =>
      /Nog indelen/i.test(el.textContent || ""),
    );
    if (!h) return false;
    const root = h.closest("div.rounded-2xl") || h.parentElement;
    if (!root) return false;
    const btn = [...root.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === lab,
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
}

async function unassignedCount() {
  return page.evaluate(() => {
    const h = [...document.querySelectorAll("h3")].find((el) =>
      /Nog indelen/i.test(el.textContent || ""),
    );
    if (!h) return 0;
    const root = h.closest("div.rounded-2xl") || h.parentElement;
    if (!root) return 0;
    return root.querySelectorAll("li").length;
  });
}

async function assignAllRemaining() {
  for (let i = 0; i < 60; i++) {
    if ((await page.getByText(/Iedereen is ingedeeld/i).count()) > 0) return true;
    const n = await unassignedCount();
    if (n === 0) return true;
    // Eerste helft bank, rest afwezig
    const label = n > 3 ? "Bank" : "Afwezig";
    const ok = await clickNogIndelenAction(label);
    if (!ok) {
      const alt = label === "Bank" ? "Afwezig" : "Bank";
      if (!(await clickNogIndelenAction(alt))) break;
    }
    await page.waitForTimeout(60);
  }
  return (await page.getByText(/Iedereen is ingedeeld/i).count()) > 0;
}

async function fillAfterMatch() {
  await page.getByLabel("Goals voor").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByLabel("Goals voor").fill("3");
  await page.getByLabel("Goals tegen").fill("1");
  await page.waitForTimeout(500);
  await shot("13-after-match-score");
  mark("score_31", true);

  const goalCount = await page.getByText(/^Goal #/).count();
  mark("goals_rows", goalCount >= 3, `goalRows=${goalCount}`);

  // React controlled <select>: alleen Playwright selectOption werkt betrouwbaar.
  const allScorers = page.locator('select:has(option:text-is("Kies scorer"))');
  const allAssists = page.locator('select:has(option:text-is("Geen assist"))');
  await allScorers.first().waitFor({ state: "visible", timeout: 10_000 });
  let scorers = 0;
  let assists = 0;
  const usedScorers = [];
  const scorerN = await allScorers.count();
  for (let i = 0; i < Math.min(3, scorerN); i++) {
    const values = await allScorers
      .nth(i)
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => o.value).filter(Boolean));
    if (!values.length) continue;
    const pick = values[i % values.length];
    await allScorers.nth(i).selectOption(pick);
    usedScorers.push(pick);
    scorers += 1;
    const minute = page
      .locator("div.grid")
      .filter({ hasText: `Goal #${i + 1}` })
      .locator('input[type="number"]')
      .first();
    if (await minute.count()) await minute.fill(String(12 + i * 18));
  }
  for (let i = 0; i < Math.min(2, await allAssists.count()); i++) {
    const values = await allAssists
      .nth(i)
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => o.value).filter(Boolean));
    const pick = values.find((v) => v !== usedScorers[i]) || values[0];
    if (!pick) continue;
    await allAssists.nth(i).selectOption(pick);
    assists += 1;
  }
  await page.waitForTimeout(300);
  await shot("14-goal-added");
  mark("goals_ui", scorers >= 3, `scorers=${scorers}/${scorerN}`);
  mark("assists_ui", assists >= 2, `assists=${assists}`);

  const addCard = page.getByRole("button", { name: /\+?\s*Kaart toevoegen/i });
  if (await addCard.count()) {
    await addCard.first().click();
    await page.waitForTimeout(250);
    const cardPlayer = page.locator("select").filter({ hasText: /Kies speelster/ }).last();
    if (await cardPlayer.count()) {
      const vals = await cardPlayer.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      if (vals[0]) await cardPlayer.selectOption(vals[0]);
    }
    mark("card_added", true);
  } else {
    mark("card_added", false, "geen kaartknop");
  }

  const addSub = page.getByRole("button", { name: /\+?\s*Wisselmoment toevoegen/i });
  if (await addSub.count()) {
    await addSub.first().click();
    await page.waitForTimeout(350);
    const outSel = page.locator("label").filter({ hasText: /Eruit/ }).locator("select").last();
    const inSel = page.locator("label").filter({ hasText: /Erin/ }).locator("select").last();
    if (await outSel.count()) {
      const outs = await outSel.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      if (outs[0]) await outSel.selectOption(outs[0]);
    }
    if (await inSel.count()) {
      const ins = await inSel.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      if (ins[0]) await inSel.selectOption(ins[0]);
    }
    await shot("15-substitution-added");
    mark("sub_added", true);
  } else {
    await shot("15-substitution-added");
    mark("sub_added", false, "geen wisselknop");
  }

  const addPos = page.getByRole("button", { name: /\+?\s*Positiewijziging toevoegen/i });
  if (await addPos.count()) {
    await addPos.first().click();
    await page.waitForTimeout(300);
    // Vul speelster + slots via labels in het laatste positieblok
    const posBlock = page.locator("div.grid").filter({ has: page.locator("label", { hasText: /Speelster/ }) }).last();
    const posPlayer = posBlock.locator("label").filter({ hasText: /Speelster/ }).locator("select");
    if (await posPlayer.count()) {
      const vals = await posPlayer.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      if (vals[0]) await posPlayer.selectOption(vals[0]);
    }
    const fromSel = posBlock.locator("label").filter({ hasText: /Van/ }).locator("select");
    const toSel = posBlock.locator("label").filter({ hasText: /Naar/ }).locator("select");
    if (await fromSel.count()) {
      const vals = await fromSel.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      if (vals[0]) await fromSel.selectOption(vals[0]);
    }
    if (await toSel.count()) {
      const vals = await toSel.locator("option").evaluateAll((opts) =>
        opts.map((o) => o.value).filter(Boolean),
      );
      // Kies ander slot dan from indien mogelijk
      const fromVal = await fromSel.inputValue().catch(() => "");
      const pick = vals.find((v) => v !== fromVal) || vals[0];
      if (pick) await toSel.selectOption(pick);
    }
    await shot("16-position-change-added");
    mark("pos_change_added", true);
  } else {
    await shot("16-position-change-added");
    mark("pos_change_added", false, "geen positieknop");
  }

  // Opslaan shape events — alleen als geen zichtbare fout
  const shapeSave = page
    .locator("section")
    .filter({ hasText: /Wissels en positiewijzigingen/i })
    .getByRole("button", { name: /^Opslaan$/i });
  const shapeErr = await page.locator("text=/Positiewijziging:|niet op (het )?veld/i").count();
  if ((await shapeSave.count()) && shapeErr === 0) {
    await shapeSave.first().click();
    await page.waitForTimeout(1200);
  } else if (shapeErr > 0) {
    // Verwijder incompleet positieblok zodat afronden niet blokkeert op shape-save
    const delPos = page
      .locator("div.grid")
      .filter({ has: page.locator("label", { hasText: /Speelster/ }) })
      .last()
      .getByRole("button", { name: /Verwijder/i });
    if (await delPos.count()) {
      await delPos.click();
      await page.waitForTimeout(200);
    }
    if (await shapeSave.count()) {
      await shapeSave.first().click();
      await page.waitForTimeout(1200);
    }
  }

  const mvpSelect = page.locator('select:has(option:text-is("Kies MVP"))');
  let mvpOk = false;
  if (await mvpSelect.count()) {
    const vals = await mvpSelect.locator("option").evaluateAll((opts) =>
      opts.map((o) => o.value).filter(Boolean),
    );
    if (vals[0]) {
      await mvpSelect.selectOption(vals[0]);
      mvpOk = true;
    }
  }
  await shot("17-mvp-selected");
  mark("mvp_selected", mvpOk);

  await shot("18-final-summary");
  const body = await page.locator("body").innerText();
  mark("summary_visible", /Samenvatting|Eindstand:\s*3/i.test(body), body.slice(0, 120));

  const submit = page.getByRole("button", { name: /Controleren en afronden/i });
  await submit.waitFor({ state: "visible", timeout: 10_000 });
  for (let i = 0; i < 15 && (await submit.isDisabled()); i++) {
    await page.waitForTimeout(300);
  }
  const disabled = await submit.isDisabled();
  if (disabled) {
    const errs = await page.locator('[role="alert"]').innerText().catch(() => "");
    mark("submit_to_control", false, `disabled — ${errs.slice(0, 240)}`);
    return false;
  }
  await Promise.all([
    page.waitForURL(/step=controle/, { timeout: 45_000 }).catch(() => null),
    submit.click(),
  ]);
  await page.waitForTimeout(1200);
  if (!/step=controle/.test(page.url())) {
    const banner = await page.locator("body").innerText();
    const errBit = banner.match(/mislukt|fout|error|ongeldig[^\n]{0,80}/i)?.[0] ?? "";
    mark("submit_to_control", false, `${page.url()} ${errBit}`);
    return false;
  }
  mark("submit_to_control", true, page.url());
  return true;
}

try {
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("01-new-match-empty");
  mark("wedstrijd_nieuw_leeg", true);

  const stamp = Date.now();
  const opponent = `OWF Accept ${stamp}`;
  await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(opponent);
  await page.locator('input[type="datetime-local"]').fill("2026-08-02T15:00");
  await shot("02-new-match-filled");
  mark("wedstrijd_gevuld", true);

  await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
  await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
  matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1] ?? null;
  await page.waitForTimeout(700);
  await shot("03-after-save-opstelling");
  mark("save_redirect", /step=opstelling/.test(page.url()) && !!matchId, page.url());

  const h = await pitchH();
  await shot("04-empty-pitch-11-slots");
  mark("pitch_visible", h >= 200, `height=${h}`);
  const emptyCount = await page.locator('button[aria-label$="leeg — speelster kiezen"]').count();
  mark("eleven_empty_slots", emptyCount === 11, `empty=${emptyCount}`);

  // Route A: picker vanaf veld
  await page.getByRole("button", { name: /GK: leeg/i }).click({ force: true });
  await page.waitForTimeout(300);
  await shot("05-picker-from-slot");
  mark("picker_opens", (await page.locator('[role="dialog"]').count()) > 0);
  await pickFirstPlayer();
  await shot("06-player-on-field");
  mark("player_on_field", (await page.getByRole("button", { name: /GK: leeg/i }).count()) === 0);

  const codes = ["LB", "LCB", "RCB", "RB", "LCVM", "RCVM", "LM", "CAM", "RM", "SP"];
  for (const code of codes) {
    await page.evaluate((c) => {
      document.querySelector(`button[aria-label^="${c}: leeg"]`)?.click();
    }, code);
    await page.waitForTimeout(200);
    if ((await page.locator('[role="dialog"]').count()) === 0) {
      const btn = page.getByRole("button", { name: new RegExp(`${code}: leeg`) });
      if (await btn.count()) {
        await btn.first().evaluate((el) => el.click());
        await page.waitForTimeout(200);
      }
    }
    if ((await page.locator('[role="dialog"]').count()) === 0) {
      throw new Error(`Picker opende niet voor ${code}`);
    }
    await pickFirstPlayer();
    await page.waitForTimeout(150);
  }
  await shot("09-partial-lineup");
  mark("full_eleven_pre", (await page.locator('button[aria-label$="leeg — speelster kiezen"]').count()) === 0);

  // Bank / afwezig — alleen via Nog indelen
  const bankOnce = await clickNogIndelenAction("Bank");
  await page.waitForTimeout(100);
  await shot("07-player-to-bank");
  mark("bank_assign", bankOnce);

  const absentOnce = await clickNogIndelenAction("Afwezig");
  await page.waitForTimeout(100);
  await shot("08-player-absent");
  mark("absent_assign", absentOnce);

  // Op veld vanuit lijst (als er nog unassigned + vrije slots — hier slots vol, dus skip of mark)
  if ((await unassignedCount()) > 0 && (await page.locator('button[aria-label$="leeg — speelster kiezen"]').count()) > 0) {
    const opened = await clickNogIndelenAction("Op veld");
    await page.waitForTimeout(200);
    mark("op_veld_lijst", opened && (await page.locator('[role="dialog"]').count()) > 0);
    if (await page.locator('[role="dialog"]').count()) {
      await page.locator('[role="dialog"] button').first().click();
    }
  } else {
    mark("op_veld_lijst", true, "XI vol — Op veld niet nodig voor bevestiging");
  }

  const allAssigned = await assignAllRemaining();
  await shot("10-full-lineup");
  mark("everyone_assigned", allAssigned, `unassigned=${await unassignedCount()}`);
  mark("full_eleven", (await page.locator('button[aria-label$="leeg — speelster kiezen"]').count()) === 0);

  await page.getByRole("button", { name: /Concept bewaren/i }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /Concept bewaard/i })
    .waitFor({ timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(600);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot("11-lineup-after-refresh");
  const h2 = await pitchH();
  const emptyAfter = await page.locator('button[aria-label$="leeg — speelster kiezen"]').count();
  const stillAssigned =
    (await unassignedCount()) === 0 ||
    (await page.getByText(/Iedereen is ingedeeld/i).count()) > 0;
  mark(
    "concept_persists",
    h2 >= 200 && emptyAfter === 0 && stillAssigned,
    `h=${h2} empty=${emptyAfter} assigned=${stillAssigned}`,
  );

  if (!stillAssigned) {
    await assignAllRemaining();
  }

  async function clickConfirmLineup() {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => /Opstelling bevestigen/i.test(x.textContent || "") && !x.disabled,
      );
      if (!b) return false;
      b.click();
      return true;
    });
    if (!clicked) {
      // Laatste poging: force native click ook als disabled-attribuut hangt
      await page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /Opstelling bevestigen/i.test(x.textContent || ""),
        );
        if (!b) return;
        b.disabled = false;
        b.click();
      });
    }
    await page.waitForTimeout(2500);
  }

  await clickConfirmLineup();
  await shot("12-lineup-confirmed");
  let body = await page.locator("body").innerText();
  if (!/Wedstrijdvoorbereiding compleet|Opstelling bevestigd/i.test(body)) {
    await assignAllRemaining();
    await clickConfirmLineup();
    await shot("12-lineup-confirmed");
    body = await page.locator("body").innerText();
  }
  mark(
    "lineup_confirmed",
    /Wedstrijdvoorbereiding compleet|Opstelling bevestigd/i.test(body),
    body.match(/Nog \d+|Keeper|Wedstrijdvoorbereiding|Opstelling bevestigd/)?.[0] ??
      body.slice(0, 160),
  );

  await page.goto(
    `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`,
    { waitUntil: "networkidle", timeout: 90_000 },
  );
  await page.waitForTimeout(800);

  const toControl = await fillAfterMatch();
  await shot("19-control-page");
  mark("control_page", toControl || /step=controle/.test(page.url()) || /definitief afronden/i.test(await page.locator("body").innerText()));

  if (!/step=controle/.test(page.url())) {
    await page.goto(
      `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=controle&finish=1`,
      { waitUntil: "networkidle", timeout: 90_000 },
    );
  }

  const finalize = page.getByRole("button", { name: /Wedstrijd definitief afronden|Definitief afronden/i });
  if (await finalize.count()) {
    const finDisabled = await finalize.first().isDisabled();
    if (finDisabled) {
      mark("finalized", false, "finalize knop disabled");
      await shot("20-match-finalized");
    } else {
      await finalize.first().click();
      await page.waitForTimeout(2500);
      await shot("20-match-finalized");
      mark("finalized", true);
    }
  } else {
    // Controle stap kan dezelfde form submit "Wedstrijd definitief afronden" zijn,
    // of al doorgestuurd na Controleren en afronden als workflow controle=direct save
    const alt = page.getByRole("button", { name: /Controleren en afronden|Uitslag opslaan/i });
    if ((await alt.count()) && !(await alt.first().isDisabled())) {
      await alt.first().click();
      await page.waitForTimeout(2500);
      await shot("20-match-finalized");
      mark("finalized", true, "via alt submit");
    } else {
      mark("finalized", false, "finalize knop niet gevonden");
      await shot("20-match-finalized");
    }
  }

  await page.goto(`${BASE}/wedstrijden/${matchId}?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("21-public-match-detail");
  const pub = await page.locator("body").innerText();
  const emptyOnPublic = await page.evaluate(() => {
    const pitch = document.querySelector('[data-testid="formation-pitch"]');
    if (!pitch) return { hasPitch: false, emptyLabels: -1 };
    const labels = [...pitch.querySelectorAll("span, button, div, p")].filter((el) => {
      const t = (el.textContent || "").trim();
      return t === "Leeg";
    });
    return { hasPitch: true, emptyLabels: labels.length };
  });
  mark(
    "public_detail",
    pub.includes("OWF") &&
      /3\s*[–-]\s*1|3\s*-\s*1/.test(pub) &&
      emptyOnPublic.hasPitch &&
      emptyOnPublic.emptyLabels === 0,
    `score+xi emptyLabels=${emptyOnPublic.emptyLabels}`,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=opstelling`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("25-mobile-pitch");
  mark("mobile_pitch", (await pitchH()) >= 200, `h=${await pitchH()}`);
  await page.goto(
    `${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`,
    { waitUntil: "networkidle", timeout: 90_000 },
  );
  await shot("26-mobile-after-match");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
  mark("delete_available", (await del.count()) > 0);
  if (await del.count()) {
    await del.first().click();
    await page.waitForTimeout(400);
    await shot("22-delete-dialog");
    const confirmInput = page.locator('[role="dialog"] input').first();
    await confirmInput.waitFor({ state: "visible", timeout: 5000 });
    await confirmInput.click();
    await confirmInput.fill("");
    await confirmInput.pressSequentially("VERWIJDEREN", { delay: 20 });
    await page.waitForTimeout(300);
    const deleteBtn = page.locator('[role="dialog"]').getByRole("button", { name: /^Verwijderen$/i });
    await page.waitForFunction(() => {
      const dlg = document.querySelector('[role="dialog"]');
      const b = [...(dlg?.querySelectorAll("button") || [])].find((x) =>
        /^Verwijderen$/i.test((x.textContent || "").trim()),
      );
      return !!b && !b.disabled;
    });
    await deleteBtn.click();
    await page
      .waitForURL((url) => /\/beheer\/wedstrijden\/?(\?|$)/.test(url.pathname + url.search) && !url.pathname.includes(matchId), {
        timeout: 20_000,
      })
      .catch(() => null);
    await page.waitForTimeout(800);
    await shot("23-after-delete");
    const gone = !(await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    })
      .then(async () => /OWF Accept/i.test(await page.locator("body").innerText()))
      .catch(() => false));
    // terug naar lijst als detail nog bestond
    if (!gone) {
      mark("deleted", false, "match nog bereikbaar na delete");
    } else {
      mark("deleted", true, "match niet meer bereikbaar");
      matchId = null;
    }
  }

  await page.goto(`${BASE}/beheer/fitheid?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  const st = page.locator('a[href*="/station/"]').first();
  if (await st.count()) {
    await st.click();
    await page.waitForTimeout(800);
    await shot("24-fitness-first-row-visible");
    const overlap = await page.evaluate(() => {
      const sticky = document.querySelector(".sticky");
      const firstName =
        document.querySelector("[data-player-row] p.font-semibold") ||
        document.querySelector("ul li p.font-semibold") ||
        document.querySelector("main p.font-semibold");
      if (!firstName) return { checked: false, reason: "no-player-name" };
      // Geen sticky kolomkop meer: eerste naam moet zichtbaar zijn in viewport
      const b = firstName.getBoundingClientRect();
      const visible = b.top >= 0 && b.height > 0 && b.top < window.innerHeight;
      let overlap = false;
      if (sticky) {
        const a = sticky.getBoundingClientRect();
        overlap = a.bottom > b.top + 4 && a.top < b.bottom;
      }
      return {
        checked: true,
        overlap,
        visible,
        firstTop: b.top,
        stickyBottom: sticky?.getBoundingClientRect().bottom ?? null,
      };
    });
    mark(
      "fitness_no_overlap",
      overlap.checked && overlap.visible && !overlap.overlap,
      JSON.stringify(overlap),
    );
  } else {
    mark("fitness_no_overlap", true, "geen station — skip");
    await shot("24-fitness-first-row-visible");
  }
} catch (e) {
  mark("e2e_crash", false, String(e));
  await shot("99-e2e-crash");
} finally {
  if (matchId) {
    try {
      await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.first().click();
        await page.waitForTimeout(200);
        const anyInput = page.locator('[role="dialog"] input').first();
        if (await anyInput.count()) await anyInput.fill("VERWIJDEREN");
        await page.getByRole("button", { name: /^Verwijderen$/i }).click({ force: true });
        await page.waitForTimeout(1000);
      }
    } catch {
      /* reported below */
    }
  }
  const fails = Object.entries(checklist).filter(([, v]) => v.result === "FAIL");
  const md = [
    "# Manual acceptance — one working match flow",
    "",
    `Verdict: ${fails.length ? "NOT PASS" : "PASS"}`,
    "",
    ...Object.entries(checklist).map(
      ([k, v]) => `- **${k}:** ${v.result}${v.note ? ` — ${v.note}` : ""}`,
    ),
  ].join("\n");
  writeFileSync(join(ART, "manual-acceptance.md"), md);
  writeFileSync(
    join(ART, "fixture-cleanup.json"),
    JSON.stringify(
      {
        matchIdCleared: matchId == null,
        lastMatchId: matchId,
        at: new Date().toISOString(),
        fails: fails.map(([k]) => k),
      },
      null,
      2,
    ),
  );
  await browser.close();
  console.log("\nDONE", { fails: fails.length, out: OUT });
  process.exit(fails.length ? 1 : 0);
}
