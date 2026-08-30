/**
 * Verjaardagen — Europe/Amsterdam.
 * Publiek: alleen maand/dag (geen jaar, geen leeftijd).
 * Schrikkeljaar: 29 feb → in niet-schrikkeljaar administratief 28 feb.
 */
import { todayInClubTz } from "@/lib/season/season-operations-2026-27";

export type BirthdayPerson = {
  id: string;
  full_name: string;
  birth_date: string | null;
  photo_url?: string | null;
  shirt_number?: number | null;
  position_label?: string | null;
  is_captain?: boolean;
  is_vice_captain?: boolean;
};

export type BirthdayOccurrence = BirthdayPerson & {
  /** YYYY-MM-DD van de volgende of huidige verjaardag in het gegeven jaarvenster */
  nextOccurrence: string;
  daysUntil: number;
  month: number;
  day: number;
};

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;

/** Parse YYYY-MM-DD zonder TZ-shift. */
export function parseBirthDateParts(birthDate: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Effectieve maand/dag voor een kalenderjaar.
 * 29 feb in niet-schrikkeljaar → 28 feb (gedocumenteerd contract).
 */
export function effectiveBirthdayMd(
  birthMonth: number,
  birthDay: number,
  calendarYear: number,
): { month: number; day: number } {
  if (birthMonth === 2 && birthDay === 29 && !isLeapYear(calendarYear)) {
    return { month: 2, day: 28 };
  }
  return { month: birthMonth, day: birthDay };
}

export function clubDateParts(now: Date = new Date()): { year: number; month: number; day: number; ymd: string } {
  const ymd = todayInClubTz(now);
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y!, month: m!, day: d!, ymd };
}

function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysBetweenYmd(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  const a = Date.UTC(fy!, fm! - 1, fd!);
  const b = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((b - a) / 86_400_000);
}

/** Speelsters die op `on` (Amsterdam-kalenderdag) jarig zijn. */
export function getBirthdayPlayersForDate(
  players: BirthdayPerson[],
  on: Date | string,
): BirthdayPerson[] {
  const ymd = typeof on === "string" ? on.slice(0, 10) : todayInClubTz(on);
  const [y, m, d] = ymd.split("-").map(Number);
  const out: BirthdayPerson[] = [];
  for (const p of players) {
    if (!p.birth_date) continue;
    const parts = parseBirthDateParts(p.birth_date);
    if (!parts) continue;
    const eff = effectiveBirthdayMd(parts.month, parts.day, y!);
    if (eff.month === m && eff.day === d) out.push(p);
  }
  return out.sort((a, b) => a.full_name.localeCompare(b.full_name, "nl"));
}

/**
 * Eerstvolgende verjaardag van één persoon, gerekend vanaf de Amsterdam-kalenderdag van `now`.
 * Jaar van birth_date telt niet mee voor sortering: 2002-09-04 → 2026-09-04 of 2027-09-04.
 * 29 feb in een niet-schrikkeljaar → 28 feb (zie `effectiveBirthdayMd`).
 */
export function nextBirthdayOccurrence(
  person: BirthdayPerson,
  now: Date = new Date(),
): BirthdayOccurrence | null {
  if (!person.birth_date) return null;
  const parts = parseBirthDateParts(person.birth_date);
  if (!parts) return null;

  const { year, ymd } = clubDateParts(now);
  const thisYear = effectiveBirthdayMd(parts.month, parts.day, year);
  let next = ymdFromParts(year, thisYear.month, thisYear.day);
  let daysUntil = daysBetweenYmd(ymd, next);
  if (daysUntil < 0) {
    const nextYear = effectiveBirthdayMd(parts.month, parts.day, year + 1);
    next = ymdFromParts(year + 1, nextYear.month, nextYear.day);
    daysUntil = daysBetweenYmd(ymd, next);
  }

  return {
    ...person,
    nextOccurrence: next,
    daysUntil,
    month: parts.month,
    day: parts.day,
  };
}

export type NextBirthdayGroup = {
  occurrences: BirthdayOccurrence[];
  daysUntil: number;
  nextOccurrence: string;
};

/**
 * Alle actieve kandidaten met dezelfde eerstvolgende verjaardag (incl. vandaag).
 * Geen vensterlimiet — december → januari wrap hoort hier thuis.
 */
export function getNextBirthdayGroup(
  players: BirthdayPerson[],
  now: Date = new Date(),
): NextBirthdayGroup | null {
  const rows = players
    .map((p) => nextBirthdayOccurrence(p, now))
    .filter((row): row is BirthdayOccurrence => row != null)
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil ||
        a.full_name.localeCompare(b.full_name, "nl"),
    );
  const first = rows[0];
  if (!first) return null;
  const occurrences = rows.filter(
    (row) => row.daysUntil === first.daysUntil && row.nextOccurrence === first.nextOccurrence,
  );
  return {
    occurrences,
    daysUntil: first.daysUntil,
    nextOccurrence: first.nextOccurrence,
  };
}

/** Leeftijd die iemand bereikt op `occurrenceYmd` (YYYY-MM-DD). Alleen bij geldige volledige datum. */
export function ageOnOccurrence(birthDate: string, occurrenceYmd: string): number | null {
  const birth = parseBirthDateParts(birthDate);
  const occ = parseBirthDateParts(occurrenceYmd);
  if (!birth || !occ) return null;
  const age = occ.year - birth.year;
  if (!Number.isInteger(age) || age < 1 || age > 80) return null;
  return age;
}

/** Compacte namenlijst voor de homepage: "Emma & Renée" / "A, B & C". */
export function joinPlayerNamesNl(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0]!;
  if (clean.length === 2) return `${clean[0]} & ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} & ${clean[clean.length - 1]}`;
}

/** Eerstvolgende verjaardagen binnen `withinDays` (incl. vandaag). */
export function getUpcomingBirthdays(
  players: BirthdayPerson[],
  now: Date = new Date(),
  withinDays = 60,
  limit = 5,
): BirthdayOccurrence[] {
  const rows: BirthdayOccurrence[] = [];

  for (const p of players) {
    const occ = nextBirthdayOccurrence(p, now);
    if (!occ || occ.daysUntil > withinDays) continue;
    rows.push(occ);
  }

  rows.sort(
    (a, b) =>
      a.daysUntil - b.daysUntil ||
      a.full_name.localeCompare(b.full_name, "nl"),
  );
  return rows.slice(0, limit);
}

/** Publieke maand+dag: "1 augustus" — geen jaar. */
export function formatBirthdayDateNL(birthDate: string): string {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return "";
  return `${parts.day} ${MONTHS_NL[parts.month - 1]}`;
}

/** Beheer: volledige datum "5 april 2002". */
export function formatBirthDateFullNL(birthDate: string): string {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return "";
  return `${parts.day} ${MONTHS_NL[parts.month - 1]} ${parts.year}`;
}

export function relativeBirthdayLabelNl(daysUntil: number): string {
  if (daysUntil === 0) return "Vandaag jarig 🎉";
  if (daysUntil === 1) return "Morgen jarig 🎉";
  return `Over ${daysUntil} dagen`;
}

/** Mag de publieke `?vandaag=`-preview? Alleen development/test — nooit productie-publiek. */
export function isPublicBirthdayPreviewAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}

/**
 * Beheer-preview-URL (authenticated). Werkt in alle omgevingen achter /beheer.
 * Toont de echte homepagehero met geforceerde kalenderdag.
 */
export function buildBirthdayAdminPreviewHref(opts: {
  seasonId: string;
  /** YYYY-MM-DD van de te tonen verjaardagsdag */
  datum: string;
}): string {
  const q = new URLSearchParams({
    season: opts.seasonId,
    datum: opts.datum.slice(0, 10),
  });
  return `/beheer/voorbeeld/verjaardag?${q.toString()}`;
}

/**
 * Publieke development-preview op de echte homepage (`?vandaag=`).
 * Alleen gebruiken wanneer `isPublicBirthdayPreviewAllowed()` true is.
 */
export function buildBirthdayHomepagePreviewHref(opts: {
  seasonId: string;
  datum: string;
}): string {
  const q = new URLSearchParams({
    season: opts.seasonId,
    vandaag: opts.datum.slice(0, 10),
  });
  return `/?${q.toString()}`;
}

/** Previewjaar + maand/dag uit birth_date → YYYY-MM-DD voor preview. */
export function birthDateToPreviewDatum(birthDate: string, previewYear = 2026): string | null {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return null;
  const eff = effectiveBirthdayMd(parts.month, parts.day, previewYear);
  return `${previewYear}-${String(eff.month).padStart(2, "0")}-${String(eff.day).padStart(2, "0")}`;
}

/** Compacte indicator in spelersbeheer. */
export function relativeBirthdayAdminBadgeNl(daysUntil: number): string | null {
  if (daysUntil === 0) return "Vandaag jarig 🎉";
  if (daysUntil < 0 || daysUntil > 14) return null;
  if (daysUntil === 1) return "Morgen jarig";
  return `Over ${daysUntil} dagen jarig`;
}

/**
 * Dev/review-only: parse YYYY-MM-DD previewdatum.
 * Productie negeert altijd (geen forcering door publieke gebruikers).
 */
export function resolveBirthdayPreviewDate(
  raw: string | undefined,
  opts: { allowPreview: boolean },
): Date | null {
  if (!opts.allowPreview) return null;
  const s = (raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const parts = parseBirthDateParts(s);
  if (!parts) return null;
  return new Date(`${s}T12:00:00+02:00`);
}

/** Voornaam / eerste token zoals in UI. */
export function firstNameFromFullName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "speelster";
  return t.split(/\s+/)[0]!;
}

export function birthdayHeadlineNl(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `Vandaag zetten we ${names[0]} in het zonnetje 🎉`;
  if (names.length === 2) return `Vandaag zetten we ${names[0]} en ${names[1]} in het zonnetje 🎉`;
  const head = names.slice(0, -1).join(", ");
  const last = names[names.length - 1];
  return `Vandaag zetten we ${head} en ${last} in het zonnetje 🎉`;
}

export function birthdayCongratsNl(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `Van harte gefeliciteerd met je verjaardag, ${names[0]}!`;
  // Meerdere: naam staat al in de heading — geen herhaling
  return "Van harte gefeliciteerd!";
}

/** Validatie voor beheerformulieren. Leeg → null OK. */
export function parseOptionalBirthDateInput(raw: string | null | undefined): {
  ok: true;
  value: string | null;
} | { ok: false; error: string } {
  const s = (raw ?? "").trim();
  if (!s) return { ok: true, value: null };
  const parts = parseBirthDateParts(s);
  if (!parts) return { ok: false, error: "Vul een geldige geboortedatum in." };
  const today = todayInClubTz();
  if (s > today) return { ok: false, error: "Vul een geldige geboortedatum in." };
  if (parts.year < 1950) return { ok: false, error: "Vul een geldige geboortedatum in." };
  // kalendercontrole
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    dt.getUTCFullYear() !== parts.year ||
    dt.getUTCMonth() + 1 !== parts.month ||
    dt.getUTCDate() !== parts.day
  ) {
    return { ok: false, error: "Vul een geldige geboortedatum in." };
  }
  return { ok: true, value: s };
}

export const KNOWN_BIRTHDATES_2026_27: ReadonlyArray<{ full_name: string; birth_date: string }> = [
  { full_name: "Jelisa De Jonge", birth_date: "2006-08-01" },
  { full_name: "Mandy Kalmeijer", birth_date: "2000-07-09" },
  { full_name: "Tess Luijting", birth_date: "2002-04-13" },
  { full_name: "Marisha Prins", birth_date: "2001-12-20" },
  { full_name: "Isa Oosterhoorn", birth_date: "2003-01-28" },
  { full_name: "Danique van Heeringen", birth_date: "2002-02-11" },
  { full_name: "Renée Koopman", birth_date: "2000-12-14" },
  { full_name: "Melissa Rietveld", birth_date: "2002-04-05" },
  { full_name: "Dionne van Dijk", birth_date: "2002-05-31" },
  { full_name: "Nienke Hoffman", birth_date: "2002-06-23" },
  { full_name: "Andrada Timmer", birth_date: "2005-08-16" },
  { full_name: "Maura Hoffman", birth_date: "2002-06-23" },
  { full_name: "Melissa Donkers", birth_date: "2002-02-28" },
  { full_name: "Evy Nibbering", birth_date: "2008-03-04" },
  { full_name: "Lorelai Bakker", birth_date: "2007-09-19" },
  { full_name: "Anouk Aafjes", birth_date: "2005-09-25" },
  { full_name: "Emma de Mie", birth_date: "2002-04-23" },
  { full_name: "Demi Luijting", birth_date: "2005-01-10" },
];

export const MISSING_BIRTHDATE_NAMES = ["Naomi Lattig", "Mariska Oosterhuis"] as const;
