/**
 * Authoritative KNVB-programma seizoen 2026/27 (bekende speeldagen).
 * Geen QA-fixtures. Reconciliatie matcht op datum + tegenstander.
 */

import type { MatchType } from "@/types";
import { clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";

export type Season202627FixtureSpec = {
  date: string;
  time: string;
  opponent: string;
  isHome: boolean;
  matchType: MatchType;
  location?: string;
};

export const SEASON_2026_27_PRODUCTION_FIXTURES: readonly Season202627FixtureSpec[] = [
  { date: "2026-08-29", time: "14:00", opponent: "WSV 1930 VR1", isHome: false, matchType: "cup" },
  { date: "2026-09-05", time: "15:15", opponent: "Sporting Krommenie VR2", isHome: true, matchType: "cup" },
  { date: "2026-09-12", time: "12:00", opponent: "Kadoelen sv. VR1", isHome: false, matchType: "cup" },
  { date: "2026-09-19", time: "11:45", opponent: "BOL VR1", isHome: true, matchType: "competition" },
  { date: "2026-09-26", time: "14:30", opponent: "Wieringermeer VR3", isHome: false, matchType: "competition" },
  { date: "2026-10-03", time: "13:30", opponent: "VVW VR1", isHome: true, matchType: "competition" },
  { date: "2026-10-10", time: "14:30", opponent: "Sporting Krommenie VR1", isHome: false, matchType: "competition" },
] as const;

const HOME_VENUE = "Sportpark Schanszicht";

/** Resterend competitieprogramma vanaf 24 oktober 2026 (Voetbal.nl, trainer-screenshots). */
export const SEASON_2026_27_REMAINING_LEAGUE_FIXTURES: readonly Season202627FixtureSpec[] = [
  { date: "2026-10-24", time: "13:30", opponent: "V.V. Bergen VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2026-10-31", time: "14:00", opponent: "WSV 1930 VR1", isHome: false, matchType: "competition", location: "Sportpark WSV'30" },
  { date: "2026-11-07", time: "13:30", opponent: "Wieringermeer VR2", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2026-11-21", time: "14:30", opponent: "ZOB VR1", isHome: false, matchType: "competition", location: "Sportpark Zuidoosterpark" },
  { date: "2026-11-28", time: "15:15", opponent: "Vrone VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2026-12-05", time: "13:30", opponent: "Schagen United VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-01-23", time: "14:30", opponent: "Sporting Andijk VR1", isHome: false, matchType: "competition", location: "Sportpark Andijk" },
  { date: "2027-01-30", time: "12:30", opponent: "BOL VR1", isHome: false, matchType: "competition", location: "BOL sportcomplex - BOL" },
  { date: "2027-02-06", time: "13:30", opponent: "Wieringermeer VR3", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-02-13", time: "13:30", opponent: "ZOB VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-03-06", time: "14:00", opponent: "VVW VR1", isHome: false, matchType: "competition", location: "Sportpark De Westrand" },
  { date: "2027-03-13", time: "13:30", opponent: "Sporting Krommenie VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-03-20", time: "14:30", opponent: "V.V. Bergen VR1", isHome: false, matchType: "competition", location: "Sportpark De Kiefthoek" },
  { date: "2027-04-03", time: "13:30", opponent: "WSV 1930 VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-04-10", time: "14:30", opponent: "Wieringermeer VR2", isHome: false, matchType: "competition", location: "Sportpark Belboei" },
  { date: "2027-04-17", time: "13:30", opponent: "Sporting Andijk VR1", isHome: true, matchType: "competition", location: HOME_VENUE },
  { date: "2027-05-08", time: "14:30", opponent: "Vrone VR1", isHome: false, matchType: "competition", location: "Sportpark Vrone" },
  { date: "2027-05-22", time: "15:00", opponent: "Schagen United VR1", isHome: false, matchType: "competition", location: "Sportpark Groenoord" },
] as const;

export function remainingLeagueHomeAwayCounts(specs = SEASON_2026_27_REMAINING_LEAGUE_FIXTURES): {
  home: number;
  away: number;
} {
  return {
    home: specs.filter((s) => s.isHome).length,
    away: specs.filter((s) => !s.isHome).length,
  };
}

export function fixtureKickoffIso(spec: Season202627FixtureSpec): string {
  return clubLocalDateTimeToIso(spec.date, spec.time);
}

export function normalizeOpponentKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchCalendarDateAmsterdam(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function findExistingFixture<T extends { opponent: string; kickoff_at: string }>(
  existing: T[],
  spec: Season202627FixtureSpec,
): T | undefined {
  const dateHits = existing.filter((m) => matchCalendarDateAmsterdam(m.kickoff_at) === spec.date);
  const key = normalizeOpponentKey(spec.opponent);
  const byOpponent = dateHits.find((m) => normalizeOpponentKey(m.opponent) === key);
  if (byOpponent) return byOpponent;
  if (dateHits.length === 1) return dateHits[0];
  return undefined;
}
