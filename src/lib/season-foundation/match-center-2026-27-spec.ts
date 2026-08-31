/**
 * Phase 2 — Match Center Foundation (Stap 1): capability-inventaris wedstrijdbeheer 2026/27.
 *
 * Bron: bestaande tabellen (`matches`, `match_goal_events`, `match_matchday_roster`, …)
 * en beheer-UI (`MatchAdminForm`, `/beheer/wedstrijden/*`).
 */

import { SEASON_2026_27_ID } from "./squad-2026-27-spec";

export { SEASON_2026_27_ID };

export type MatchCenterCapabilityStatus = "ready" | "partial" | "missing";

export type MatchCenterCapability = {
  id: string;
  label: string;
  status: MatchCenterCapabilityStatus;
  evidence: string;
  notes?: string;
};

/** Vereiste DB-tabellen voor wedstrijdbeheer (bestaand schema). */
export const MATCH_CENTER_SCHEMA_TABLES = [
  "seasons",
  "matches",
  "match_goal_events",
  "match_player_stats",
  "match_matchday_roster",
  "players",
  "player_season_memberships",
] as const;

/** Beheerpaden voor handmatige KNVB-invoer (later). */
export const MATCH_ADMIN_ENTRY_PATHS = [
  { path: "/beheer/wedstrijden", purpose: "Kalenderoverzicht per seizoen" },
  { path: "/beheer/wedstrijden/nieuw", purpose: "Nieuwe wedstrijd plannen of direct als gespeeld invoeren" },
  { path: "/beheer/wedstrijd-toevoegen", purpose: "Snelle uitslag-flow (MatchEntryForm)" },
  { path: "/beheer/wedstrijden/[matchId]", purpose: "Volledige bewerking (selectie, goals, MVP)" },
  { path: "/beheer/data-integrity", purpose: "Integriteitscontrole per seizoen" },
  { path: "/beheer/disputes", purpose: "Dispute-breakdown goals/MVP" },
] as const;

/**
 * Ondersteuning per wedstrijdonderdeel — geen nieuwe velden; alleen wat de huidige architectuur biedt.
 */
export const MATCH_CENTER_CAPABILITIES: MatchCenterCapability[] = [
  {
    id: "competition",
    label: "Competitiewedstrijden",
    status: "partial",
    evidence: "matches (season_id, opponent, kickoff_at, status)",
    notes: "Geen match_type-kolom; competitie is impliciet via seasons.name. Handmatig invoerbaar in beheer.",
  },
  {
    id: "cup",
    label: "Bekerwedstrijden",
    status: "missing",
    evidence: "Geen beker-type of aparte competitie-entiteit",
    notes: "Kan als gewone wedstrijd worden ingevoerd zonder type-label.",
  },
  {
    id: "friendly",
    label: "Oefenwedstrijden",
    status: "partial",
    evidence: "matches — zelfde structuur als competitie",
    notes: "Geen oefen-vlag; onderscheid alleen via tegenstander/notitie (notitieveld ontbreekt).",
  },
  {
    id: "lineup",
    label: "Opstellingen",
    status: "partial",
    evidence: "MatchAdminForm selected_player_ids; match_matchday_roster voor gasten",
    notes: "Wedstrijdselectie (checkboxes); geen opgeslagen formatie voor vaste selectie. Gast-roster met rugnummer/positie-label.",
  },
  {
    id: "substitutions",
    label: "Wissels",
    status: "missing",
    evidence: "Geen substitution-tabel of events",
  },
  {
    id: "goals",
    label: "Doelpunten",
    status: "ready",
    evidence: "match_goal_events.scorer_player_id → triggers rebuild match_player_stats",
  },
  {
    id: "assists",
    label: "Assists",
    status: "ready",
    evidence: "match_goal_events.assist_player_id",
  },
  {
    id: "cards",
    label: "Kaarten (geel/rood)",
    status: "missing",
    evidence: "Geen booking/card-events; players.card_note is profielnotitie",
  },
  {
    id: "motm",
    label: "MOTM / WOTM",
    status: "ready",
    evidence: "match_wotm_winners (0..n); matches.wotm_player_id is legacy-spiegel",
  },
  {
    id: "preview",
    label: "Voorbeschouwing",
    status: "missing",
    evidence: "Geen preview/recap-tekstveld op matches",
  },
  {
    id: "recap",
    label: "Nabeschouwing",
    status: "partial",
    evidence: "/wedstrijden/[matchId]: score, goal lines, WOTM-spotlight",
    notes: "Geen lang rapport of vrije nabeschouwings-tekst.",
  },
];

/** matches-kolommen die de app verwacht (ClubDatabase / supabase-db). */
export const MATCHES_EXPECTED_COLUMNS =
  "id,season_id,opponent,kickoff_at,is_home,goals_for,goals_against,status,wotm_player_id,integrity_state";

export const MATCH_CENTER_2026_27_DATA_GAPS = [
  "Wedstrijdtype (competitie / beker / oefen): geen apart veld — onderscheid niet opslaanbaar.",
  "Wissels: niet ondersteund.",
  "Kaarten: niet ondersteund.",
  "Voorbeschouwing: geen tekstveld.",
  "Nabeschouwing: alleen score + doelpunten + WOTM; geen artikel/rapport.",
  "KNVB-programma 2026/27: nog geen wedstrijden in DB (handmatige invoer via beheer wanneer beschikbaar).",
  "Opstelling: wedstrijdselectie wel; geen tactische formatie-opslag voor vaste speelsters.",
] as const;
