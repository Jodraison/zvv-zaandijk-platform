/**
 * Guardrail: verboden Engelse / inconsistente UI-copy mag niet terugkomen.
 * Run: npm run test:dutch-language-audit
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NL, NL_AVOID } from "@/lib/copy/dutch-terminology";

const root = join(process.cwd(), "src");
const skipDir = new Set(["node_modules", ".next", "decision-lab", "academie"]);

const FORBIDDEN_UI = [
  "Player of the match",
  "Statistics Center",
  "Vice-captain",
  "Captain (C)",
  "Validatie OK",
  "magic link",
  "Magic link",
  "Goals voor",
  "Goals tegen",
  "Gastspeler",
  "Meeste MOTM",
  "Clean sheets",
  "MVP-ranking",
  "Actief in DB",
  "Open met URL",
  "Dashboard en snelle acties",
  "mist verplicht gegeven",
  "performance-overzicht",
  "bankspelers vastgelegd",
  "Assistent moet",
  'label: "Goals"',
  'label="Goals"',
  'subtitle: "Goals, assists en WOTM"',
];

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (skipDir.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsx(p, out);
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

console.log("→ dutch-language-audit");

assert.equal(NL.aanvoerder, "Aanvoerder");
assert.equal(NL.viceAanvoerder, "Vice-aanvoerder");
assert.equal(NL.doelpunten, "Doelpunten");
assert.equal(NL.mvp, "MVP");
assert.ok(NL_AVOID.includes("WOTM"));

const extraTs = [
  "actions/players.ts",
  "lib/validations/match-admin.ts",
  "lib/validations/match-entry.ts",
  "lib/match-goal-helpers.ts",
  "lib/admin/beheer-nav.ts",
  "lib/navigation/public-nav.ts",
  "lib/statistics/records.ts",
].map((rel) => join(root, rel));

const files = [
  ...walkTsx(root),
  ...extraTs.filter((p) => existsSync(p)),
];

const hits: { file: string; needle: string }[] = [];

for (const file of files) {
  if (file.includes("dutch-terminology")) continue;
  const text = readFileSync(file, "utf8");
  for (const needle of FORBIDDEN_UI) {
    if (text.includes(needle)) {
      hits.push({
        file: file.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", ""),
        needle,
      });
    }
  }
}

if (hits.length) {
  console.error("Verboden UI-copy gevonden:");
  for (const h of hits) console.error(`  ${h.file}: ${h.needle}`);
}
assert.equal(hits.length, 0, `${hits.length} verboden UI-string(s)`);

const playerCard = readFileSync(join(root, "components/players/player-card.tsx"), "utf8");
assert.match(playerCard, /Doelpunten/);
assert.match(playerCard, /Aanvoerder/);
assert.match(playerCard, /Vice-aanvoerder/);

const nav = readFileSync(join(root, "lib/navigation/public-nav.ts"), "utf8");
assert.match(nav, /Ranglijst/);
assert.doesNotMatch(nav, /label: \"Ranking\"/);

const stats = readFileSync(join(root, "app/(site)/statistieken/page.tsx"), "utf8");
assert.match(stats, /Statistiekcentrum/);
assert.doesNotMatch(stats, /Statistics Center/);

const wotm = readFileSync(join(root, "components/matches/wotm-spotlight.tsx"), "utf8");
assert.match(wotm, /Speelster van de wedstrijd/);

console.log(`dutch-language-audit.test.ts: ok (${files.length} files scanned)`);
