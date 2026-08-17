/**
 * Idempotent: zet bekende geboortedatums op players.birth_date.
 * Naomi Lattig + Mariska Oosterhuis blijven null.
 * Project: othxhnkwkygggkktvosp
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  KNOWN_BIRTHDATES_2026_27,
  MISSING_BIRTHDATE_NAMES,
} from "../src/lib/players/birthdays";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const BACKUP_DIR = join(process.cwd(), ".review-backups", "player-birthdays");
mkdirSync(BACKUP_DIR, { recursive: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) {
  throw new Error(`Wrong Supabase project: ${url}`);
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

const sb = createClient(url, key, { auth: { persistSession: false } });

function norm(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type PlayerRow = { id: string; full_name: string; birth_date: string | null };
type Row = {
  speelster: string;
  player_id: string;
  before: string | null;
  after: string | null;
  resultaat: string;
};

async function main() {
  const { data: players, error } = await sb
    .from("players")
    .select("id, full_name, birth_date")
    .eq("is_guest", false)
    .order("full_name");
  if (error) throw error;

  const stamp = Date.now();
  writeFileSync(
    join(BACKUP_DIR, `players-birth-date-before-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        timestamp: new Date().toISOString(),
        players,
      },
      null,
      2,
    ),
  );

  const byNorm = new Map<string, PlayerRow[]>();
  for (const p of (players ?? []) as PlayerRow[]) {
    const k = norm(p.full_name);
    const arr = byNorm.get(k) ?? [];
    arr.push(p);
    byNorm.set(k, arr);
  }

  const report: Row[] = [];
  let unknownNames = 0;
  let duplicatePersons = 0;
  let updated = 0;

  for (const entry of KNOWN_BIRTHDATES_2026_27) {
    const matches = byNorm.get(norm(entry.full_name)) ?? [];
    if (matches.length === 0) {
      unknownNames += 1;
      report.push({
        speelster: entry.full_name,
        player_id: "",
        before: null,
        after: entry.birth_date,
        resultaat: "ONBEKEND — niet gevonden",
      });
      continue;
    }
    if (matches.length > 1) {
      duplicatePersons += 1;
      report.push({
        speelster: entry.full_name,
        player_id: matches.map((m) => m.id).join(","),
        before: matches[0]!.birth_date,
        after: entry.birth_date,
        resultaat: "FOUT — meerdere matches",
      });
      continue;
    }
    const p = matches[0]!;
    const before = p.birth_date ?? null;
    if (before === entry.birth_date) {
      report.push({
        speelster: p.full_name,
        player_id: p.id,
        before,
        after: entry.birth_date,
        resultaat: "ongewijzigd (idempotent)",
      });
      continue;
    }
    const { error: upErr } = await sb
      .from("players")
      .update({ birth_date: entry.birth_date })
      .eq("id", p.id);
    if (upErr) throw upErr;
    updated += 1;
    report.push({
      speelster: p.full_name,
      player_id: p.id,
      before,
      after: entry.birth_date,
      resultaat: before ? "bijgewerkt" : "ingevoerd",
    });
  }

  for (const name of MISSING_BIRTHDATE_NAMES) {
    const matches = byNorm.get(norm(name)) ?? [];
    if (matches.length !== 1) {
      report.push({
        speelster: name,
        player_id: matches.map((m) => m.id).join(","),
        before: matches[0]?.birth_date ?? null,
        after: null,
        resultaat: matches.length === 0 ? "ONBEKEND" : "FOUT — meerdere matches",
      });
      if (matches.length === 0) unknownNames += 1;
      if (matches.length > 1) duplicatePersons += 1;
      continue;
    }
    const p = matches[0]!;
    if (p.birth_date != null) {
      const { error: clearErr } = await sb.from("players").update({ birth_date: null }).eq("id", p.id);
      if (clearErr) throw clearErr;
      report.push({
        speelster: p.full_name,
        player_id: p.id,
        before: p.birth_date,
        after: null,
        resultaat: "bewust leeggemaakt",
      });
    } else {
      report.push({
        speelster: p.full_name,
        player_id: p.id,
        before: null,
        after: null,
        resultaat: "bewust leeg (null)",
      });
    }
  }

  const { data: afterPlayers, error: afterErr } = await sb
    .from("players")
    .select("id, full_name, birth_date")
    .eq("is_guest", false)
    .order("full_name");
  if (afterErr) throw afterErr;

  writeFileSync(
    join(BACKUP_DIR, `players-birth-date-after-${stamp}.json`),
    JSON.stringify(
      {
        project_ref: PROJECT,
        timestamp: new Date().toISOString(),
        updated,
        known: KNOWN_BIRTHDATES_2026_27.length,
        missing_named: MISSING_BIRTHDATE_NAMES.length,
        unknown_names: unknownNames,
        duplicate_persons: duplicatePersons,
        report,
        players: afterPlayers,
      },
      null,
      2,
    ),
  );

  const knownFilled = KNOWN_BIRTHDATES_2026_27.filter((e) => {
    const m = ((afterPlayers ?? []) as PlayerRow[]).filter((p) => norm(p.full_name) === norm(e.full_name));
    return m.length === 1 && m[0]!.birth_date === e.birth_date;
  }).length;

  const missingStillNull = MISSING_BIRTHDATE_NAMES.filter((name) => {
    const m = ((afterPlayers ?? []) as PlayerRow[]).filter((p) => norm(p.full_name) === norm(name));
    return m.length === 1 && m[0]!.birth_date == null;
  }).length;

  console.log(
    JSON.stringify(
      {
        known: knownFilled,
        ontbrekend: missingStillNull,
        dubbele_personen: duplicatePersons,
        onbekende_namen: unknownNames,
        updated,
        report,
      },
      null,
      2,
    ),
  );

  if (unknownNames || duplicatePersons || knownFilled !== 18 || missingStillNull !== 2) {
    throw new Error(
      `Reconcile failed: known=${knownFilled} missing=${missingStillNull} dup=${duplicatePersons} unknown=${unknownNames}`,
    );
  }

  console.log("OK reconcile-player-birthdays");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
