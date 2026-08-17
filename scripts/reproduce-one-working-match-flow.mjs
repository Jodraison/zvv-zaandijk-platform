/**
 * FASE A — reproduceer echte wedstrijdflow, geen fixes.
 * Bewijs: screenshots + failures JSON/MD.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.CHAIN_BASE_URL ?? "http://localhost:3000";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const OUT = join(process.cwd(), ".review-screenshots", "one-working-match-flow", "before");
const ART = join(process.cwd(), ".review-artifacts", "one-working-match-flow");
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const failures = [];
const log = [];
let matchId = null;

function fail(entry) {
  failures.push({ ...entry, at: new Date().toISOString() });
  log.push(`FAIL: ${entry.title}`);
  console.log("FAIL", entry.title, entry.actual?.slice?.(0, 120) ?? entry.actual);
}

function ok(msg) {
  log.push(`OK: ${msg}`);
  console.log("OK", msg);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: existsSync(".review-auth/admin-storage.json")
    ? ".review-auth/admin-storage.json"
    : undefined,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const consoleErrors = [];
const networkFails = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) networkFails.push(`${r.status()} ${r.url()}`);
});

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function bodyText() {
  return page.locator("body").innerText().catch(() => "");
}

async function pitchMetrics() {
  return page.evaluate(() => {
    const pitch = document.querySelector('[data-testid="formation-pitch"]');
    if (!pitch) return { found: false };
    const r = pitch.getBoundingClientRect();
    const codes = ["GK", "LB", "LCB", "RCB", "RB", "LCVM", "RCVM", "LM", "CAM", "RM", "SP"];
    const emptySlotButtons = codes.filter((c) =>
      document.querySelector(`button[aria-label^="${c}: leeg"]`),
    );
    return {
      found: true,
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top),
      emptySlotButtons: emptySlotButtons.length,
      slotButtons: document.querySelectorAll('button[aria-label*=":"]').length,
      visibleCodes: codes.filter((c) => !!document.querySelector(`[aria-label^="${c}:"]`)),
      visibleCodeCount: codes.filter((c) => !!document.querySelector(`[aria-label^="${c}:"]`)).length,
    };
  });
}

try {
  // 1. Beheer wedstrijden
  await page.goto(`${BASE}/beheer/wedstrijden?season=${SEASON}`, { waitUntil: "networkidle", timeout: 90_000 });
  await shot("01-beheer-wedstrijden.png");
  if (page.url().includes("/login")) {
    fail({
      title: "Auth",
      route: page.url(),
      action: "Open /beheer/wedstrijden",
      expected: "Ingelogd beheer",
      actual: "Redirect login",
      console: consoleErrors.slice(-5),
      network: networkFails.slice(-5),
      screenshot: "01-beheer-wedstrijden.png",
    });
    throw new Error("Not authenticated");
  }
  ok("beheer wedstrijden bereikbaar");

  // 2. Nieuwe wedstrijd
  await page.goto(`${BASE}/beheer/wedstrijden/nieuw?season=${SEASON}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await shot("02-nieuw-leeg.png");
  const body2 = await bodyText();
  if (!/Wedstrijd opslaan en opstelling maken/i.test(body2)) {
    fail({
      title: "Stap1 CTA ontbreekt",
      route: page.url(),
      action: "Open nieuw",
      expected: "Knop Wedstrijd opslaan en opstelling maken",
      actual: body2.slice(0, 500),
      screenshot: "02-nieuw-leeg.png",
    });
  } else ok("stap1 CTA zichtbaar");

  const stamp = Date.now();
  const opponent = `OWF Repro ${stamp}`;
  await page.locator("label").filter({ hasText: "Tegenstander" }).locator("input").fill(opponent);
  const kick = new Date(Date.now() + 2 * 86400000);
  const local = `${kick.getFullYear()}-${String(kick.getMonth() + 1).padStart(2, "0")}-${String(kick.getDate()).padStart(2, "0")}T15:00`;
  await page.locator('input[type="datetime-local"]').fill(local);
  await shot("03-nieuw-gevuld.png");

  await page.getByRole("button", { name: /Wedstrijd opslaan en opstelling maken/i }).click();
  try {
    await page.waitForURL(/step=opstelling/, { timeout: 25_000 });
    ok(`redirect opstelling: ${page.url()}`);
  } catch {
    fail({
      title: "Redirect na save",
      route: page.url(),
      action: "Save wedstrijd",
      expected: "?step=opstelling",
      actual: page.url(),
      console: consoleErrors.slice(-8),
      network: networkFails.slice(-8),
      screenshot: await shot("04-save-failed.png"),
    });
  }

  matchId = page.url().match(/wedstrijden\/([^/?]+)/)?.[1] ?? null;
  await page.waitForTimeout(800);
  await shot("05-opstelling-na-save.png");

  // 3. Pitch visibility
  const metrics = await pitchMetrics();
  log.push({ pitch: metrics });
  if (!metrics.found || metrics.height < 120) {
    fail({
      title: "Veld ingestort / te laag",
      route: page.url(),
      action: "Bekijk opstellingsscherm",
      expected: "Zichtbaar veld hoogte >= 120px met 11 slots",
      actual: JSON.stringify(metrics),
      screenshot: "05-opstelling-na-save.png",
    });
  } else ok(`veld hoogte ${metrics.height}px`);

  if (metrics.visibleCodeCount < 11) {
    fail({
      title: "Niet alle 11 slots zichtbaar",
      route: page.url(),
      action: "Tel slotlabels",
      expected: "11 slotcodes zichtbaar",
      actual: JSON.stringify(metrics),
      screenshot: "05-opstelling-na-save.png",
    });
  } else ok("11 slotcodes in tekst");

  // 4. Place via slot picker
  const gk = page.getByRole("button", { name: /GK: leeg/i });
  if (!(await gk.count())) {
    fail({
      title: "GK-slot niet klikbaar",
      route: page.url(),
      action: "Zoek GK: leeg",
      expected: "Klikbare lege GK",
      actual: "button niet gevonden",
      screenshot: "05-opstelling-na-save.png",
    });
  } else {
    try {
      await gk.first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(400);
      await shot("06-picker-open.png");
      const dialog = page.locator('[role="dialog"]');
      if (!(await dialog.count())) {
        fail({
          title: "Picker opent niet",
          route: page.url(),
          action: "Klik GK",
          expected: "Dialog picker",
          actual: "geen dialog",
          screenshot: "06-picker-open.png",
        });
      } else {
        const pick = dialog.locator("button").filter({ hasText: /#\d+/ }).first();
        if (!(await pick.count())) {
          fail({
            title: "Picker leeg / geen rugnummers",
            route: page.url(),
            action: "Kies speelster",
            expected: "Lijst met #rugnummer",
            actual: await dialog.innerText(),
            screenshot: "06-picker-open.png",
          });
        } else {
          await pick.scrollIntoViewIfNeeded();
          await pick.click({ timeout: 5000 });
          await page.waitForTimeout(400);
          await shot("07-gk-geplaatst.png");
          if (await page.getByRole("button", { name: /GK: leeg/i }).count()) {
            fail({
              title: "Speler niet op veld na picker",
              route: page.url(),
              action: "Kies speelster in picker",
              expected: "GK gevuld",
              actual: "GK nog leeg",
              screenshot: "07-gk-geplaatst.png",
            });
          } else ok("GK geplaatst via picker");
        }
      }
    } catch (e) {
      fail({
        title: "Klik/picker exception",
        route: page.url(),
        action: "GK plaatsen",
        expected: "Werkt",
        actual: String(e),
        screenshot: await shot("06-picker-exception.png"),
      });
    }
  }

  // 5. Bank / Afwezig from Nog indelen
  const bankBtn = page.locator("button", { hasText: /^Bank$/ }).first();
  if (await bankBtn.count()) {
    await bankBtn.click({ force: true });
    await page.waitForTimeout(200);
    await shot("08-bank.png");
    ok("Bank-actie geklikt");
  } else {
    fail({
      title: "Bank-actie ontbreekt",
      route: page.url(),
      action: "Nog indelen → Bank",
      expected: "Knop Bank",
      actual: "niet gevonden",
      screenshot: "05-opstelling-na-save.png",
    });
  }

  const absentBtn = page.locator("button", { hasText: /^Afwezig$/ }).first();
  if (await absentBtn.count()) {
    await absentBtn.click({ force: true });
    await page.waitForTimeout(200);
    await shot("09-afwezig.png");
    ok("Afwezig-actie geklikt");
  } else {
    fail({
      title: "Afwezig-actie ontbreekt",
      route: page.url(),
      action: "Nog indelen → Afwezig",
      expected: "Knop Afwezig",
      actual: "niet gevonden",
      screenshot: "05-opstelling-na-save.png",
    });
  }

  // Op veld from list?
  const onField = page.locator("button", { hasText: /^Op veld$/ }).first();
  if (!(await onField.count())) {
    fail({
      title: "Op veld vanuit lijst ontbreekt",
      route: page.url(),
      action: "Nog indelen → Op veld",
      expected: "Knop Op veld",
      actual: "niet gevonden",
      screenshot: await shot("10-geen-op-veld.png"),
    });
  } else {
    ok("Op veld knop aanwezig");
    await onField.click({ force: true });
    await page.waitForTimeout(300);
    await shot("10-op-veld-flow.png");
  }

  // 6. Concept bewaren + refresh
  const concept = page.getByRole("button", { name: /Concept bewaren/i });
  if (!(await concept.count())) {
    fail({
      title: "Concept bewaren ontbreekt",
      route: page.url(),
      action: "Zoek knop",
      expected: "Concept bewaren",
      actual: "niet gevonden",
      screenshot: await shot("11-geen-concept.png"),
    });
  } else {
    await concept.click();
    await page.waitForTimeout(1500);
    await shot("11-na-concept.png");
    const msg = await bodyText();
    if (/mislukt|fout|error/i.test(msg) && /opslaan|bewaren/i.test(msg)) {
      fail({
        title: "Concept save fout",
        route: page.url(),
        action: "Concept bewaren",
        expected: "Succes",
        actual: msg.slice(0, 800),
        console: consoleErrors.slice(-8),
        network: networkFails.slice(-8),
        screenshot: "11-na-concept.png",
      });
    } else ok("concept save aangeklikt");

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot("12-na-refresh.png");
    const after = await bodyText();
    // Check bank/absent/gk persistence roughly
    const stillUnassignedAll = (after.match(/Nog indelen/g) || []).length > 0;
    ok(`refresh gedaan; nog-indelen aanwezig=${stillUnassignedAll}`);
  }

  // 7. Try confirm with incomplete
  const confirm = page.getByRole("button", { name: /Opstelling bevestigen/i });
  if (await confirm.count()) {
    await confirm.click();
    await page.waitForTimeout(1000);
    await shot("13-bevestigen-poging.png");
    const t = await bodyText();
    if (/Wedstrijdvoorbereiding compleet/i.test(t)) {
      ok("bevestiging compleet (onverwacht als incompleet?)");
    } else if (/basis|keeper|indelen|vul/i.test(t)) {
      ok("validatiefouten zichtbaar bij incomplete bevestiging");
    } else {
      fail({
        title: "Bevestiging feedback onduidelijk",
        route: page.url(),
        action: "Opstelling bevestigen incompleet",
        expected: "Duidelijke fouten of succes",
        actual: t.slice(0, 800),
        screenshot: "13-bevestigen-poging.png",
      });
    }
  }

  // 8. Na de wedstrijd
  if (matchId) {
    await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("14-na-de-wedstrijd.png");
    const t = await bodyText();
    if (/Beschikbaar na de wedstrijd|later/i.test(t) && !/Eindstand/i.test(t)) {
      ok("geplande wedstrijd blokkeert afronden (verwacht zonder finish=1)");
    }
    await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}&step=na-de-wedstrijd&finish=1`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("15-afronden-finish.png");
    const t2 = await bodyText();
    if (!/Eindstand|Goals voor|doelpunt/i.test(t2)) {
      fail({
        title: "Afrond-UI ontbreekt",
        route: page.url(),
        action: "Open finish=1",
        expected: "Eindstand/doelpunten UI",
        actual: t2.slice(0, 800),
        screenshot: "15-afronden-finish.png",
      });
    } else ok("afrond-UI zichtbaar met finish=1");

    // Gevaarlijke zone midden?
    const dangerIdx = t2.indexOf("Gevaarlijke zone");
    const eindIdx = t2.indexOf("Eindstand");
    if (dangerIdx >= 0 && eindIdx >= 0 && dangerIdx < eindIdx) {
      fail({
        title: "Gevaarlijke zone tussen taken",
        route: page.url(),
        action: "Scan pagina-orde",
        expected: "Delete onderaan",
        actual: `danger@${dangerIdx} eindstand@${eindIdx}`,
        screenshot: "15-afronden-finish.png",
      });
    }

    // Public page
    await page.goto(`${BASE}/wedstrijden/${matchId}?season=${SEASON}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("16-publiek.png");
    const pub = await bodyText();
    if (!pub.includes(opponent) && !pub.includes("OWF Repro")) {
      fail({
        title: "Publieke pagina toont wedstrijd niet",
        route: page.url(),
        action: "Open publiek",
        expected: opponent,
        actual: pub.slice(0, 500),
        screenshot: "16-publiek.png",
      });
    } else ok("publieke pagina toont tegenstander");

    const pubPitch = await pitchMetrics();
    if (pubPitch.found && pubPitch.height < 120) {
      fail({
        title: "Publiek veld te klein/ingestort",
        route: page.url(),
        action: "Meet pitch",
        expected: "leesbaar veld",
        actual: JSON.stringify(pubPitch),
        screenshot: "16-publiek.png",
      });
    }

    // Fitness header regression check (allowed)
    await page.goto(`${BASE}/beheer/fitheid?season=${SEASON}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await shot("17-fitheid-overzicht.png");
    // try open a session station if any link
    const station = page.locator('a[href*="/station/"]').first();
    if (await station.count()) {
      await station.click();
      await page.waitForTimeout(800);
      await shot("18-fitheid-station.png");
      const overlap = await page.evaluate(() => {
        const thead = document.querySelector("thead, [class*=sticky]");
        const firstRow = document.querySelector("tbody tr, table tr:nth-child(2)");
        if (!thead || !firstRow) return { checked: false };
        const a = thead.getBoundingClientRect();
        const b = firstRow.getBoundingClientRect();
        return {
          checked: true,
          overlap: a.bottom > b.top + 2,
          headerBottom: a.bottom,
          firstTop: b.top,
        };
      });
      if (overlap.checked && overlap.overlap) {
        fail({
          title: "Fitheid header overlapt eerste rij",
          route: page.url(),
          action: "Meet sticky header vs first row",
          expected: "geen overlap",
          actual: JSON.stringify(overlap),
          screenshot: "18-fitheid-station.png",
        });
      } else if (overlap.checked) ok("fitheid geen overlap gedetecteerd");
    } else {
      log.push("SKIP: geen fitheid station link");
    }
  }
} catch (e) {
  fail({
    title: "Reproduce crash",
    route: page.url(),
    action: "Flow",
    expected: "Voltooien",
    actual: String(e),
    console: consoleErrors.slice(-10),
    network: networkFails.slice(-10),
    screenshot: await shot("99-crash.png"),
  });
} finally {
  // Cleanup test match if created
  if (matchId) {
    try {
      await page.goto(`${BASE}/beheer/wedstrijden/${matchId}?season=${SEASON}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      const del = page.getByRole("button", { name: /Wedstrijd verwijderen/i });
      if (await del.count()) {
        await del.first().click();
        await page.waitForTimeout(300);
        const confirm = page.getByRole("button", { name: /^Verwijderen$/i });
        if (await confirm.count()) await confirm.click();
        await page.waitForTimeout(1200);
        ok(`cleanup delete ${matchId}`);
      } else {
        fail({
          title: "Cleanup delete knop ontbreekt",
          route: page.url(),
          action: "Verwijderen",
          expected: "Wedstrijd verwijderen",
          actual: "niet gevonden",
          screenshot: await shot("98-cleanup-fail.png"),
          dbEffect: `match ${matchId} mogelijk achtergebleven`,
        });
      }
    } catch (e) {
      fail({
        title: "Cleanup exception",
        route: String(matchId),
        action: "delete",
        expected: "verwijderd",
        actual: String(e),
        dbEffect: `match ${matchId} mogelijk achtergebleven`,
      });
    }
  }

  const md = [
    "# Current failures — one working match flow (FASE A)",
    "",
    `Base: ${BASE}`,
    `MatchId: ${matchId ?? "—"}`,
    `Failures: ${failures.length}`,
    "",
    ...failures.map(
      (f, i) => `## ${i + 1}. ${f.title}

- **Route:** ${f.route ?? "—"}
- **Handeling:** ${f.action ?? "—"}
- **Verwacht:** ${f.expected ?? "—"}
- **Werkelijk:** ${typeof f.actual === "string" ? f.actual : JSON.stringify(f.actual)}
- **Console:** ${(f.console || []).join(" | ") || "—"}
- **Network:** ${(f.network || []).join(" | ") || "—"}
- **DB-effect:** ${f.dbEffect ?? "n.n.b."}
- **Screenshot:** ${f.screenshot ?? "—"}
`,
    ),
    "",
    "## Log",
    ...log.map((l) => `- ${typeof l === "string" ? l : JSON.stringify(l)}`),
  ].join("\n");

  writeFileSync(join(ART, "current-failures.md"), md);
  writeFileSync(join(ART, "current-failures.json"), JSON.stringify({ matchId, failures, log, consoleErrors, networkFails }, null, 2));
  await browser.close();
  console.log("\n=== FASE A DONE ===", { failures: failures.length, matchId, out: OUT });
}
