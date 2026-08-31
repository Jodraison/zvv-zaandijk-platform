export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";

/** Wedstrijdtype — enum in DB (`match_type`). */
export type MatchType = "competition" | "cup" | "friendly";
export type TrainingSessionStatus = "scheduled" | "completed" | "cancelled";
export type MatchLineupStatus = "draft" | "confirmed";

export type PlayerPosition = "GK" | "DEF" | "MID" | "ATT";

/** Vast meetpakket: 20m, 40m en 60m sprint op één datum. */
export type FitnessTestType = "sprint_20_40_60";

export interface Season {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
}

export interface Player {
  id: string;
  full_name: string;
  photo_url: string | null;
  /** Gast-speelster: alleen via wedstrijd-roster, geen vaste selectie/ranking. */
  is_guest: boolean;
  /** YYYY-MM-DD — persoonsniveau. Publiek geen geboortejaar; homepage mag ‘wordt N’ / ‘N jaar’ tonen. */
  birth_date?: string | null;
  initials?: string | null;
  bio?: string | null;
  preferred_foot?: string | null;
  strengths?: string | null;
  role_label?: string | null;
  tagline?: string | null;
  card_note?: string | null;
}

/** Gast gekoppeld aan één wedstrijd (geen seizoenslidmaatschap). */
export interface MatchMatchdayRosterRow {
  match_id: string;
  player_id: string;
  match_shirt_number: number | null;
  position_label: string | null;
}

/** Opstelling per wedstrijd: basis, bank of afwezig. */
export type MatchLineupRole = "starter" | "bench" | "absent";

export interface MatchLineupEntry {
  id: string;
  match_id: string;
  player_id: string;
  role: MatchLineupRole;
  position: string | null;
  absence_reason: string | null;
  sort_order: number;
}

export interface PlayerSeasonMembership {
  id: string;
  player_id: string;
  season_id: string;
  shirt_number: number;
  position: PlayerPosition;
  /** Leesbare positie (NL), bron voor UI; `position` is enum voor filters/logica */
  display_position: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  /** Gast-speelster voor dit seizoen (duidelijk in beheer en selectie) */
  is_guest: boolean;
}

export type MatchDataScope = "production" | "demo" | "qa";

export interface Match {
  id: string;
  season_id: string;
  opponent: string;
  /** Datum + tijd (UTC ISO); enige bron voor aanvang — geen aparte date/time-kolommen. */
  kickoff_at: string;
  is_home: boolean;
  match_type: MatchType;
  location: string | null;
  referee: string | null;
  notes: string | null;
  goals_for: number;
  goals_against: number;
  status: MatchStatus;
  /**
   * Legacy spiegel: eerste POTM-winnaar, of null.
   * Productcode leest via `wotmPlayerIdsOf` / `wotm_player_ids`.
   */
  wotm_player_id: string | null;
  /** Canonical POTM-winnaars (0..n). */
  wotm_player_ids?: string[];
  integrity_state?: "verified" | "invalid";
  lineup_status?: MatchLineupStatus;
  lineup_confirmed_at?: string | null;
  /**
   * production = telt mee in publieke aggregaties.
   * demo/qa = nooit in ranking/records/homepage/seizoenstats.
   * Ontbrekend veld → afgeleid via notes/opponent-patronen (`resolveMatchDataScope`).
   */
  data_scope?: MatchDataScope;
}

export interface MatchPlayerStat {
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
}

/** Eén Player of the Match-winnaar voor een wedstrijd. */
export interface MatchWotmWinner {
  match_id: string;
  player_id: string;
}

/** Eén doelpunt-rij; stats worden hiervan afgeleid. */
export interface MatchGoalEvent {
  id: string;
  match_id: string;
  scorer_player_id: string;
  assist_player_id: string | null;
  sort_order: number;
  minute: number;
}

export type MatchCardType = "yellow" | "red";

export interface MatchCardEvent {
  id: string;
  match_id: string;
  player_id: string;
  card_type: MatchCardType;
  minute: number;
}

export interface MatchSubstitution {
  id: string;
  match_id: string;
  player_in_id: string;
  player_out_id: string;
  minute: number;
  to_slot?: string | null;
  stoppage_time?: number;
  sort_order?: number;
  change_group_id?: string | null;
  notes?: string | null;
}

/** Positiewijziging zonder wissel. */
export interface MatchPositionChange {
  id: string;
  match_id: string;
  player_id: string;
  minute: number;
  stoppage_time: number;
  from_slot: string;
  to_slot: string;
  change_group_id: string | null;
  notes: string | null;
  sort_order: number;
}

export interface TrainingSession {
  id: string;
  season_id: string;
  title: string | null;
  session_at: string;
  location: string | null;
  status: TrainingSessionStatus;
}

export interface TrainingAttendance {
  session_id: string;
  player_id: string;
  present: boolean;
  note: string | null;
}

export type FitnessProgressStatus = "improved" | "declined" | "equal" | "no_previous";

export type FitnessSessionStatus = "draft" | "published";
export type FitnessProtocolCode = "four_part_v1";
export type FitnessParticipationStatus =
  | "pending"
  | "partial"
  | "complete"
  | "absent"
  | "injured"
  | "not_tested"
  | "stopped"
  | "other";

export interface FitnessScoreConfig {
  id: string;
  code: string;
  label: string;
  version: number;
  config: Record<string, unknown>;
  created_at: string;
}

export interface FitnessTestSession {
  id: string;
  season_id: string;
  test_on: string;
  protocol_code: FitnessProtocolCode;
  status: FitnessSessionStatus;
  note: string | null;
  score_config_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
  published_by: string | null;
}

/** Vier losse meetwaarden — geen total_time / totalTime. */
export interface FitnessTestResult {
  id: string;
  session_id: string;
  player_id: string;
  flying_sprint_30m_seconds: number | null;
  agility_10_20_10_seconds: number | null;
  plank_seconds: number | null;
  six_minute_run_meters: number | null;
  participation_status: FitnessParticipationStatus;
  participation_reason: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface FitnessTest {
  id: string;
  season_id: string;
  player_id: string;
  test_type: FitnessTestType;
  /** Kalenderdatum van de meting (YYYY-MM-DD) */
  test_on: string;
  /** Totaal seconden (20+40+60); bij aparte sprints = som daarvan. Legacy only. */
  total_time: number;
  sprint_20m: number;
  sprint_40m: number;
  sprint_60m: number;
  recorded_at: string;
  note: string | null;
  progress_status: FitnessProgressStatus | null;
  progress_delta: number | null;
  /** Snelste 1–3 op deze testdag binnen het seizoen */
  session_rank: number | null;
}

export interface ClubDatabase {
  seasons: Season[];
  players: Player[];
  player_season_memberships: PlayerSeasonMembership[];
  matches: Match[];
  match_matchday_roster: MatchMatchdayRosterRow[];
  match_lineup_entries: MatchLineupEntry[];
  match_player_stats: MatchPlayerStat[];
  /** Canonical POTM-winnaars. Ontbrekend in oudere fixtures → lees via wotmPlayerIdsOf(match). */
  match_wotm_winners?: MatchWotmWinner[];
  match_goal_events: MatchGoalEvent[];
  match_position_changes: MatchPositionChange[];
  match_card_events: MatchCardEvent[];
  match_substitutions: MatchSubstitution[];
  training_sessions: TrainingSession[];
  training_attendance: TrainingAttendance[];
  /** Legacy sprint 20/40/60 */
  fitness_tests: FitnessTest[];
  /** Nieuw protocol — sessions */
  fitness_test_sessions: FitnessTestSession[];
  /** Nieuw protocol — results (geen total_time) */
  fitness_test_results: FitnessTestResult[];
  fitness_score_configs: FitnessScoreConfig[];
  /** Teamfoto voor homepage; komt uit `club_profile` in Supabase */
  team_photo_url: string | null;
}

export interface PlayerSeasonRankingRow {
  player_id: string;
  season_id: string;
  full_name: string;
  photo_url: string | null;
  shirt_number: number;
  position: PlayerPosition;
  /** Profiel-rol (bijv. `GK`); bron voor keeper vs veldstatistieken op de kaart */
  role_label?: string | null;
  /** Zelfde als lidmaatschap.display_position (fallback in UI naar korte enum) */
  display_position: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  goals_total: number;
  assists_total: number;
  wotm_total: number;
  matches_played: number;
  /** Wedstrijden zonder tegengoals (GK/DEF, vanaf 2026/27) */
  clean_sheets_total: number;
}

export interface PlayerDetailAggregates {
  goals_total: number;
  assists_total: number;
  wotm_total: number;
  /** Wedstrijden zonder tegengoals (GK/DEF, vanaf 2026/27) */
  clean_sheets_total: number;
  attendance_rate: number;
  sessions_considered: number;
  attendance_present_count: number;
  attendance_absent_count: number;
  fitness_series: {
    test_on: string;
    sprint_20m: number;
    sprint_40m: number;
    sprint_60m: number;
    total_time: number;
    recorded_at: string;
  }[];
  attendance_series: { session_at: string; present: boolean }[];
  recent_matches: {
    match_id: string;
    opponent: string;
    kickoff_at: string;
    goals: number;
    assists: number;
    is_wotm: boolean;
    result: "W" | "D" | "L";
  }[];
}
