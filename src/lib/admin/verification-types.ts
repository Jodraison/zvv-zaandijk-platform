export type MatchVerificationPayload = {
  match_id: string;
  verified: true;
  integrity_state: "verified" | "invalid";
  event_goal_count: number;
  event_assist_count: number;
  derived_goal_count: number;
  derived_assist_count: number;
  persisted_goal_events_count: number;
  persisted_derived_goals_count: number;
  persisted_assist_events_count: number;
  persisted_derived_assists_count: number;
  persisted_mvp_player_id: string;
  affected_player_ids: string[];
  verified_at: string;
  changes: {
    player_id: string;
    goals_delta: number;
    assists_delta: number;
  }[];
  mvp_before_player_id: string | null;
  mvp_after_player_id: string | null;
};

export type TrainingVerificationPayload = {
  session_id: string;
  session_date: string;
  session_status: "completed" | "cancelled";
  expected_attendance_rows: number;
  actual_attendance_rows: number;
  present_count: number;
  absent_count: number;
  present_set_count: number;
  absent_set_count: number;
  verified: true;
  verified_at: string;
};
