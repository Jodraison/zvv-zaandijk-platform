import type { ClubDatabase, Match } from "@/types";
import { resolveMatchScore } from "@/lib/domain/match-score";

/** Uitslag op basis van canonical match scorevelden. */
export function matchResult(db: ClubDatabase, m: Match): "W" | "D" | "L" | null {
  void db;
  if (m.status !== "played") return null;
  const score = resolveMatchScore(m);
  if (score.result === "win") return "W";
  if (score.result === "loss") return "L";
  return "D";
}

export function seasonMatches(db: ClubDatabase, seasonId: string): Match[] {
  return db.matches.filter((m) => m.season_id === seasonId).sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at));
}

/** Eerstvolgende geplande wedstrijd (DB): zelfde seizoen, status scheduled, kickoff strikt na nu. */
export function nextScheduledMatch(db: ClubDatabase, seasonId: string, now = new Date()): Match | null {
  if (!seasonId) return null;
  const t = now.getTime();
  const upcoming = db.matches
    .filter((m) => m.season_id === seasonId && m.status === "scheduled")
    .filter((m) => new Date(m.kickoff_at).getTime() > t)
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());
  return upcoming[0] ?? null;
}

/**
 * Alle wedstrijden van het seizoen zijn gespeeld en liggen in het verleden (geen openstaande speeldatum).
 * Handig als er géén `scheduled` toekomstwedstrijd is maar wel resultaten — bv. na een volledige competitieronde.
 */
export function seasonPlayedOut(db: ClubDatabase, seasonId: string, now = new Date()): boolean {
  if (!seasonId) return false;
  const ms = db.matches.filter((m) => m.season_id === seasonId);
  if (ms.length === 0) return false;
  const t = now.getTime();
  return ms.every((m) => m.status === "played" && new Date(m.kickoff_at).getTime() < t);
}

export function lastPlayedMatch(db: ClubDatabase, seasonId: string, now = new Date()): Match | null {
  if (!seasonId) return null;
  const t = now.getTime();
  const past = db.matches
    .filter((m) => m.season_id === seasonId && m.status === "played")
    .filter((m) => new Date(m.kickoff_at).getTime() <= t)
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at));
  return past[0] ?? null;
}

export function teamFormLast5(db: ClubDatabase, seasonId: string, now = new Date()): ("W" | "D" | "L")[] {
  if (!seasonId) return [];
  const t = now.getTime();
  const played = db.matches
    .filter((m) => m.season_id === seasonId && m.status === "played")
    .filter((m) => new Date(m.kickoff_at).getTime() <= t)
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at))
    .slice(0, 5);
  return played.map((m) => matchResult(db, m)!).filter(Boolean);
}
