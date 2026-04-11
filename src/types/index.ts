export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";
export type TrainingSessionStatus = "completed" | "cancelled";

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

export interface Match {
  id: string;
  season_id: string;
  opponent: string;
  kickoff_at: string;
  is_home: boolean;
  goals_for: number;
  goals_against: number;
  status: MatchStatus;
  wotm_player_id: string | null;
  integrity_state?: "verified" | "invalid";
}

export interface MatchPlayerStat {
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
}

/** Eén tegendoelpunt-rij; stats worden hiervan afgeleid. */
export interface MatchGoalEvent {
  id: string;
  match_id: string;
  scorer_player_id: string;
  assist_player_id: string | null;
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

export interface FitnessTest {
  id: string;
  season_id: string;
  player_id: string;
  test_type: FitnessTestType;
  /** Kalenderdatum van de meting (YYYY-MM-DD) */
  test_on: string;
  /** Totaal seconden (20+40+60); bij aparte sprints = som daarvan. */
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
  match_player_stats: MatchPlayerStat[];
  match_goal_events: MatchGoalEvent[];
  training_sessions: TrainingSession[];
  training_attendance: TrainingAttendance[];
  fitness_tests: FitnessTest[];
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
  /** Zelfde als lidmaatschap.display_position (fallback in UI naar korte enum) */
  display_position: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  goals_total: number;
  assists_total: number;
  wotm_total: number;
  matches_played: number;
}

export interface PlayerDetailAggregates {
  goals_total: number;
  assists_total: number;
  wotm_total: number;
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
