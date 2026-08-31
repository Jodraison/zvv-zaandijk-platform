import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClubDatabase,
  FitnessParticipationStatus,
  FitnessProtocolCode,
  FitnessScoreConfig,
  FitnessSessionStatus,
  FitnessTest,
  FitnessTestResult,
  FitnessTestSession,
  FitnessTestType,
  Match,
  MatchGoalEvent,
  MatchCardEvent,
  MatchCardType,
  MatchLineupEntry,
  MatchLineupRole,
  MatchMatchdayRosterRow,
  MatchPlayerStat,
  MatchSubstitution,
  MatchPositionChange,
  MatchWotmWinner,
  MatchStatus,
  Player,
  PlayerPosition,
  PlayerSeasonMembership,
  Season,
  TrainingAttendance,
  TrainingSession,
  TrainingSessionStatus,
} from "@/types";
import { asMatchType, DEFAULT_MATCH_TYPE } from "@/lib/match-type";
import { hydrateMatchWotmFromTable } from "@/lib/match/wotm-winners";

function asMatchStatus(s: string): MatchStatus {
  const v = s.toLowerCase();
  if (v === "scheduled" || v === "played" || v === "postponed" || v === "cancelled") return v;
  return "scheduled";
}

function asPosition(s: string): PlayerPosition {
  const v = s.toUpperCase();
  if (v === "GK" || v === "DEF" || v === "MID" || v === "ATT") return v;
  return "MID";
}

function asFitnessType(_s: string): FitnessTestType {
  return "sprint_20_40_60";
}

function asTrainingStatus(s: string | null | undefined): TrainingSessionStatus {
  const v = String(s ?? "scheduled").toLowerCase();
  if (v === "cancelled") return "cancelled";
  if (v === "completed") return "completed";
  return "scheduled";
}

export type LoadedClubDatabase = {
  database: ClubDatabase;
  schemaVersion: number;
};

function asLineupRole(s: string): MatchLineupRole {
  const v = s.toLowerCase();
  if (v === "starter" || v === "bench" || v === "absent") return v;
  return "bench";
}

function asCardType(s: string): MatchCardType {
  return s === "red" ? "red" : "yellow";
}

const FITNESS_OPTIONAL_TABLES = new Set([
  "fitness_test_sessions",
  "fitness_test_results",
  "fitness_score_configs",
  "match_wotm_winners",
]);

function isMissingFitnessTableError(message: string): boolean {
  return (
    /relation .+ does not exist/i.test(message) ||
    /Could not find the table/i.test(message) ||
    /schema cache/i.test(message) ||
    /PGRST205/i.test(message)
  );
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.trunc(n);
}

function asFitnessProtocolCode(s: string): FitnessProtocolCode {
  return s === "four_part_v1" ? "four_part_v1" : "four_part_v1";
}

function asFitnessSessionStatus(s: string): FitnessSessionStatus {
  return s === "published" ? "published" : "draft";
}

const FITNESS_PARTICIPATION_STATUSES: FitnessParticipationStatus[] = [
  "pending",
  "partial",
  "complete",
  "absent",
  "injured",
  "not_tested",
  "stopped",
  "other",
];

function asFitnessParticipationStatus(s: string): FitnessParticipationStatus {
  const v = s as FitnessParticipationStatus;
  return FITNESS_PARTICIPATION_STATUSES.includes(v) ? v : "pending";
}

export async function loadClubDatabaseFromSupabase(client: SupabaseClient, debugLabel = "loadClubDatabase"): Promise<LoadedClubDatabase> {
  const [
    profileRes,
    seasonsRes,
    playersRes,
    memRes,
    matchesRes,
    rosterRes,
    lineupRes,
    statsRes,
    eventsRes,
    cardEventsRes,
    subEventsRes,
    posChangesRes,
    wotmWinnersRes,
    sessRes,
    attRes,
    fitRes,
    fitSessRes,
    fitResultRes,
    fitConfigRes,
  ] = await Promise.all([
    client.from("club_profile").select("team_photo_url, schema_version").eq("id", "default").maybeSingle(),
    client.from("seasons").select("*").order("starts_on", { ascending: false }),
    client.from("players").select("*").order("full_name"),
    client.from("player_season_memberships").select("*"),
    client.from("matches").select("*"),
    client.from("match_matchday_roster").select("*"),
    client.from("match_lineup_entries").select("*"),
    client.from("match_player_stats").select("*"),
    client.from("match_goal_events").select("*").order("sort_order", { ascending: true }),
    client.from("match_card_events").select("*"),
    client.from("match_substitutions").select("*"),
    client.from("match_position_changes").select("*"),
    client.from("match_wotm_winners").select("*"),
    client.from("training_sessions").select("*").order("session_at", { ascending: false }),
    client.from("training_attendance").select("*"),
    client.from("fitness_tests").select("*").order("test_on", { ascending: false }).order("recorded_at", { ascending: false }),
    client.from("fitness_test_sessions").select("*").order("test_on", { ascending: false }),
    client.from("fitness_test_results").select("*"),
    client.from("fitness_score_configs").select("*").order("code"),
  ]);

  const named = [
    ["club_profile", profileRes],
    ["seasons", seasonsRes],
    ["players", playersRes],
    ["player_season_memberships", memRes],
    ["matches", matchesRes],
    ["match_matchday_roster", rosterRes],
    ["match_lineup_entries", lineupRes],
    ["match_player_stats", statsRes],
    ["match_goal_events", eventsRes],
    ["match_card_events", cardEventsRes],
    ["match_substitutions", subEventsRes],
    ["match_position_changes", posChangesRes],
    ["match_wotm_winners", wotmWinnersRes],
    ["training_sessions", sessRes],
    ["training_attendance", attRes],
    ["fitness_tests", fitRes],
    ["fitness_test_sessions", fitSessRes],
    ["fitness_test_results", fitResultRes],
    ["fitness_score_configs", fitConfigRes],
  ] as const;

  const fitnessTableMissing = new Set<string>();
  const failures: { table: string; message: string }[] = [];
  for (const [table, res] of named) {
    const msg = res.error?.message;
    if (!msg) continue;
    if (FITNESS_OPTIONAL_TABLES.has(table) && isMissingFitnessTableError(msg)) {
      fitnessTableMissing.add(table);
      continue;
    }
    failures.push({ table, message: msg });
  }
  if (failures.length) {
    const detail = failures.map((f) => `${f.table}: ${f.message}`).join("; ");
    const hint =
      /permission denied for schema public/i.test(detail) ?
        " Vaak: verkeerde API-key (geen anon?), database grants/RLS buiten migraties 003/009, of pooler/rol buiten Supabase-postgREST."
        : "";
    if (process.env.SUPABASE_DEBUG_AUTH === "1" || process.env.SUPABASE_DEBUG_AUTH === "true") {
      console.error(`[SUPABASE_DEBUG_AUTH][${debugLabel}] loadClubDatabase failures`, detail);
    }
    throw new Error(`Supabase laden mislukt (${debugLabel}): ${detail}.${hint}`);
  }

  const seasons: Season[] = (seasonsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    starts_on: typeof r.starts_on === "string" ? r.starts_on.slice(0, 10) : String(r.starts_on),
    ends_on: typeof r.ends_on === "string" ? r.ends_on.slice(0, 10) : String(r.ends_on),
    is_active: !!r.is_active,
  }));

  const players: Player[] = (playersRes.data ?? []).map((r) => {
    const row = r as { is_guest?: boolean; birth_date?: string | null };
    const birthRaw = row.birth_date;
    const birth_date =
      typeof birthRaw === "string" && /^\d{4}-\d{2}-\d{2}/.test(birthRaw)
        ? birthRaw.slice(0, 10)
        : null;
    return {
      id: r.id,
      full_name: r.full_name,
      photo_url: r.photo_url ?? null,
      is_guest: !!row.is_guest,
      birth_date,
      initials: typeof (r as { initials?: string | null }).initials === "string" ? (r as { initials: string }).initials : null,
      bio: typeof (r as { bio?: string | null }).bio === "string" ? (r as { bio: string }).bio : null,
      preferred_foot:
        typeof (r as { preferred_foot?: string | null }).preferred_foot === "string"
          ? (r as { preferred_foot: string }).preferred_foot
          : null,
      strengths:
        typeof (r as { strengths?: string | null }).strengths === "string"
          ? (r as { strengths: string }).strengths
          : null,
      role_label:
        typeof (r as { role_label?: string | null }).role_label === "string"
          ? (r as { role_label: string }).role_label
          : null,
      tagline:
        typeof (r as { tagline?: string | null }).tagline === "string"
          ? (r as { tagline: string }).tagline
          : null,
      card_note:
        typeof (r as { card_note?: string | null }).card_note === "string"
          ? (r as { card_note: string }).card_note
          : null,
    };
  });

  const player_season_memberships: PlayerSeasonMembership[] = (memRes.data ?? []).map((r) => {
    const row = r as {
      display_position?: string | null;
      is_guest?: boolean;
    };
    return {
      id: r.id,
      player_id: r.player_id,
      season_id: r.season_id,
      shirt_number: Number(r.shirt_number),
      position: asPosition(r.position),
      display_position: typeof row.display_position === "string" ? row.display_position : "",
      is_captain: !!r.is_captain,
      is_vice_captain: !!r.is_vice_captain,
      is_guest: !!row.is_guest,
    };
  });

  const match_matchday_roster: MatchMatchdayRosterRow[] = (rosterRes.data ?? []).map((r) => {
    const row = r as {
      match_id: string;
      player_id: string;
      match_shirt_number?: number | null;
      position_label?: string | null;
    };
    return {
      match_id: row.match_id,
      player_id: row.player_id,
      match_shirt_number:
        row.match_shirt_number === null || row.match_shirt_number === undefined ? null : Number(row.match_shirt_number),
      position_label: typeof row.position_label === "string" ? row.position_label : null,
    };
  });

  const match_lineup_entries: MatchLineupEntry[] = (lineupRes.data ?? []).map((r) => {
    const row = r as {
      id: string;
      match_id: string;
      player_id: string;
      role: string;
      position?: string | null;
      absence_reason?: string | null;
      sort_order?: number | null;
    };
    return {
      id: row.id,
      match_id: row.match_id,
      player_id: row.player_id,
      role: asLineupRole(row.role),
      position: typeof row.position === "string" ? row.position : null,
      absence_reason: typeof row.absence_reason === "string" ? row.absence_reason : null,
      sort_order: Number(row.sort_order ?? 0),
    };
  });

  const matches: Match[] = (matchesRes.data ?? []).map((r) => ({
    id: r.id,
    season_id: r.season_id,
    opponent: r.opponent,
    kickoff_at: r.kickoff_at,
    is_home: !!r.is_home,
    match_type: asMatchType((r as { match_type?: string | null }).match_type ?? DEFAULT_MATCH_TYPE),
    location:
      typeof (r as { location?: string | null }).location === "string"
        ? (r as { location: string }).location
        : null,
    referee:
      typeof (r as { referee?: string | null }).referee === "string"
        ? (r as { referee: string }).referee
        : null,
    notes:
      typeof (r as { notes?: string | null }).notes === "string" ? (r as { notes: string }).notes : null,
    goals_for: Number(r.goals_for ?? 0),
    goals_against: Number(r.goals_against ?? 0),
    status: asMatchStatus(String(r.status)),
    wotm_player_id: r.wotm_player_id ?? null,
    wotm_player_ids: r.wotm_player_id ? [r.wotm_player_id] : [],
    integrity_state: (r as { integrity_state?: string | null }).integrity_state === "invalid" ? "invalid" : "verified",
    lineup_status:
      (r as { lineup_status?: string | null }).lineup_status === "confirmed" ? "confirmed" : "draft",
    lineup_confirmed_at: (r as { lineup_confirmed_at?: string | null }).lineup_confirmed_at ?? null,
  }));

  const match_wotm_winners: MatchWotmWinner[] = fitnessTableMissing.has("match_wotm_winners")
    ? []
    : ((wotmWinnersRes.data ?? []) as { match_id: string; player_id: string }[]).map((r) => ({
        match_id: r.match_id,
        player_id: r.player_id,
      }));

  const match_player_stats: MatchPlayerStat[] = (statsRes.data ?? []).map((r) => ({
    match_id: r.match_id,
    player_id: r.player_id,
    goals: Number(r.goals ?? 0),
    assists: Number(r.assists ?? 0),
  }));

  const match_goal_events: MatchGoalEvent[] = (eventsRes.data ?? []).map((r) => ({
    id: r.id,
    match_id: r.match_id,
    scorer_player_id: r.scorer_player_id,
    assist_player_id: r.assist_player_id ?? null,
    sort_order: Number(r.sort_order ?? 0),
    minute: Number((r as { minute?: number | null }).minute ?? 0),
  }));

  const match_card_events: MatchCardEvent[] = (cardEventsRes.data ?? []).map((r) => {
    const row = r as {
      id: string;
      match_id: string;
      player_id: string;
      card_type: string;
      minute?: number | null;
    };
    return {
      id: row.id,
      match_id: row.match_id,
      player_id: row.player_id,
      card_type: asCardType(row.card_type),
      minute: Number(row.minute ?? 0),
    };
  });

  const match_substitutions: MatchSubstitution[] = (subEventsRes.data ?? []).map((r) => {
    const row = r as {
      id: string;
      match_id: string;
      player_in_id: string;
      player_out_id: string;
      minute?: number | null;
      to_slot?: string | null;
      stoppage_time?: number | null;
      sort_order?: number | null;
      change_group_id?: string | null;
      notes?: string | null;
    };
    return {
      id: row.id,
      match_id: row.match_id,
      player_in_id: row.player_in_id,
      player_out_id: row.player_out_id,
      minute: Number(row.minute ?? 0),
      to_slot: row.to_slot ?? null,
      stoppage_time: Number(row.stoppage_time ?? 0),
      sort_order: Number(row.sort_order ?? 0),
      change_group_id: row.change_group_id ?? null,
      notes: row.notes ?? null,
    };
  });

  const match_position_changes: MatchPositionChange[] = (posChangesRes.data ?? []).map((r) => {
    const row = r as {
      id: string;
      match_id: string;
      player_id: string;
      minute?: number | null;
      stoppage_time?: number | null;
      from_slot: string;
      to_slot: string;
      change_group_id?: string | null;
      notes?: string | null;
      sort_order?: number | null;
    };
    return {
      id: row.id,
      match_id: row.match_id,
      player_id: row.player_id,
      minute: Number(row.minute ?? 0),
      stoppage_time: Number(row.stoppage_time ?? 0),
      from_slot: row.from_slot,
      to_slot: row.to_slot,
      change_group_id: row.change_group_id ?? null,
      notes: row.notes ?? null,
      sort_order: Number(row.sort_order ?? 0),
    };
  });

  const training_sessions: TrainingSession[] = (sessRes.data ?? []).map((r) => ({
    id: r.id,
    season_id: r.season_id,
    title: r.title ?? null,
    session_at: r.session_at,
    location: r.location ?? null,
    status: asTrainingStatus((r as { status?: string | null }).status),
  }));

  const training_attendance: TrainingAttendance[] = (attRes.data ?? []).map((r) => ({
    session_id: r.session_id,
    player_id: r.player_id,
    present: !!r.present,
    note: r.note ?? null,
  }));

  const fitness_test_sessions: FitnessTestSession[] = fitnessTableMissing.has("fitness_test_sessions")
    ? []
    : (fitSessRes.data ?? []).map((r) => {
        const raw = r as Record<string, unknown>;
        const testOn =
          typeof raw.test_on === "string" ? raw.test_on.slice(0, 10) : String(raw.test_on ?? "").slice(0, 10);
        return {
          id: String(raw.id),
          season_id: String(raw.season_id),
          test_on: testOn,
          protocol_code: asFitnessProtocolCode(String(raw.protocol_code ?? "four_part_v1")),
          status: asFitnessSessionStatus(String(raw.status ?? "draft")),
          note: typeof raw.note === "string" ? raw.note : raw.note === null ? null : null,
          score_config_id:
            raw.score_config_id === null || raw.score_config_id === undefined ? null : String(raw.score_config_id),
          created_at: String(raw.created_at ?? ""),
          updated_at: String(raw.updated_at ?? ""),
          published_at:
            raw.published_at === null || raw.published_at === undefined ? null : String(raw.published_at),
          created_by: raw.created_by === null || raw.created_by === undefined ? null : String(raw.created_by),
          published_by:
            raw.published_by === null || raw.published_by === undefined ? null : String(raw.published_by),
        };
      });

  const fitness_test_results: FitnessTestResult[] = fitnessTableMissing.has("fitness_test_results")
    ? []
    : (fitResultRes.data ?? []).map((r) => {
        const raw = r as Record<string, unknown>;
        return {
          id: String(raw.id),
          session_id: String(raw.session_id),
          player_id: String(raw.player_id),
          flying_sprint_30m_seconds: numOrNull(raw.flying_sprint_30m_seconds),
          agility_10_20_10_seconds: numOrNull(raw.agility_10_20_10_seconds),
          plank_seconds: intOrNull(raw.plank_seconds),
          six_minute_run_meters: intOrNull(raw.six_minute_run_meters),
          participation_status: asFitnessParticipationStatus(String(raw.participation_status ?? "pending")),
          participation_reason:
            typeof raw.participation_reason === "string"
              ? raw.participation_reason
              : raw.participation_reason === null
                ? null
                : null,
          note: typeof raw.note === "string" ? raw.note : raw.note === null ? null : null,
          created_at: String(raw.created_at ?? ""),
          updated_at: String(raw.updated_at ?? ""),
        };
      });

  const fitness_score_configs: FitnessScoreConfig[] = fitnessTableMissing.has("fitness_score_configs")
    ? []
    : (fitConfigRes.data ?? []).map((r) => {
        const raw = r as Record<string, unknown>;
        const cfg = raw.config;
        return {
          id: String(raw.id),
          code: String(raw.code),
          label: String(raw.label),
          version: Number(raw.version ?? 1),
          config: cfg !== null && typeof cfg === "object" && !Array.isArray(cfg) ? (cfg as Record<string, unknown>) : {},
          created_at: String(raw.created_at ?? ""),
        };
      });

  const fitness_tests: FitnessTest[] = (fitRes.data ?? []).map((r) => {
    const raw = r as Record<string, unknown>;
    const testOn =
      typeof raw.test_on === "string"
        ? raw.test_on.slice(0, 10)
        : String(raw.recorded_at ?? "").slice(0, 10);
    const s20 = Number(raw.sprint_20m ?? 0);
    const s40 = Number(raw.sprint_40m ?? 0);
    const s60 = Number(raw.sprint_60m ?? 0);
    const tt =
      raw.total_time !== undefined && raw.total_time !== null
        ? Number(raw.total_time)
        : s20 + s40 + s60;
    const ps = raw.progress_status;
    const validPs = ["improved", "declined", "equal", "no_previous"];
    return {
      id: r.id,
      season_id: r.season_id,
      player_id: r.player_id,
      test_type: asFitnessType(String(r.test_type)),
      test_on: testOn,
      total_time: tt,
      sprint_20m: s20,
      sprint_40m: s40,
      sprint_60m: s60,
      recorded_at: r.recorded_at,
      note: r.note ?? null,
      progress_status: typeof ps === "string" && validPs.includes(ps) ? (ps as FitnessTest["progress_status"]) : null,
      progress_delta: raw.progress_delta !== undefined && raw.progress_delta !== null ? Number(raw.progress_delta) : null,
      session_rank:
        raw.session_rank !== undefined && raw.session_rank !== null ? Number(raw.session_rank) : null,
    };
  });

  const team_photo_url = profileRes.data?.team_photo_url?.trim() || null;
  const rawVer = (profileRes.data as { schema_version?: number | string } | null)?.schema_version;
  const schemaVersion = typeof rawVer === "number" && !Number.isNaN(rawVer) ? rawVer : Number(rawVer ?? 0) || 0;

  const database = {
      seasons,
      players,
      player_season_memberships,
      matches,
      match_matchday_roster,
      match_lineup_entries,
      match_player_stats,
      match_wotm_winners,
      match_goal_events,
      match_card_events,
      match_substitutions,
      match_position_changes,
      training_sessions,
      training_attendance,
      fitness_tests,
      fitness_test_sessions,
      fitness_test_results,
      fitness_score_configs,
      team_photo_url,
  };
  hydrateMatchWotmFromTable(database);
  return {
    database,
    schemaVersion,
  };
}

function statKey(match_id: string, player_id: string) {
  return `${match_id}:${player_id}`;
}

function attKey(session_id: string, player_id: string) {
  return `${session_id}:${player_id}`;
}

function goalEventKey(id: string) {
  return id;
}

/**
 * @deprecated Volledige dataset-sync (massa-delete + upsert). Alleen voor noodherstel/migraties;
 * normale beheeracties gebruiken `applyClubDatabaseDiff` (repository).
 */
export async function syncClubDatabaseToSupabase(
  client: SupabaseClient,
  db: ClubDatabase,
  expectedSchemaVersion: number,
): Promise<void> {
  /** Lege keep = géén massa-delete (voorkomt dat een mislukte read de database leegtrekt). */
  async function deleteOrphanIds(table: string, keep: Set<string>) {
    if (keep.size === 0) return;
    const { data: existing, error: e1 } = await client.from(table).select("id");
    if (e1) throw new Error(`${table} select: ${e1.message}`);
    const stale = (existing ?? []).map((x: { id: string }) => x.id).filter((id) => !keep.has(id));
    if (stale.length) {
      const { error: e2 } = await client.from(table).delete().in("id", stale);
      if (e2) throw new Error(`${table} delete: ${e2.message}`);
    }
  }

  async function upsertTable<T extends { id: string }>(table: string, rows: T[]) {
    if (!rows.length) return;
    const { error: e3 } = await client.from(table).upsert(rows as never[], { onConflict: "id" });
    if (e3) throw new Error(`${table} upsert: ${e3.message}`);
  }

  async function deleteOrphanIdsOptional(table: string, keep: Set<string>) {
    if (keep.size === 0) return;
    const { data: existing, error: e1 } = await client.from(table).select("id");
    if (e1) {
      if (isMissingFitnessTableError(e1.message)) return;
      throw new Error(`${table} select: ${e1.message}`);
    }
    const stale = (existing ?? []).map((x: { id: string }) => x.id).filter((id) => !keep.has(id));
    if (stale.length) {
      const { error: e2 } = await client.from(table).delete().in("id", stale);
      if (e2) {
        if (isMissingFitnessTableError(e2.message)) return;
        throw new Error(`${table} delete: ${e2.message}`);
      }
    }
  }

  async function upsertTableOptional<T extends { id: string }>(table: string, rows: T[]) {
    if (!rows.length) return;
    const { error: e3 } = await client.from(table).upsert(rows as never[], { onConflict: "id" });
    if (e3) {
      if (isMissingFitnessTableError(e3.message)) return;
      throw new Error(`${table} upsert: ${e3.message}`);
    }
  }

  /* Verwijder eerst kinderen (FK-veilig); match_player_stats en training_attendance volgen via cascade of expliciet. */
  await deleteOrphanIdsOptional("fitness_test_results", new Set(db.fitness_test_results.map((r) => r.id)));
  await deleteOrphanIdsOptional("fitness_test_sessions", new Set(db.fitness_test_sessions.map((s) => s.id)));
  await deleteOrphanIdsOptional("fitness_score_configs", new Set(db.fitness_score_configs.map((c) => c.id)));
  await deleteOrphanIds("fitness_tests", new Set(db.fitness_tests.map((f) => f.id)));
  await deleteOrphanIds("training_sessions", new Set(db.training_sessions.map((s) => s.id)));
  await deleteOrphanIds("matches", new Set(db.matches.map((m) => m.id)));
  await deleteOrphanIds("player_season_memberships", new Set(db.player_season_memberships.map((m) => m.id)));
  await deleteOrphanIds("players", new Set(db.players.map((p) => p.id)));
  await deleteOrphanIds("seasons", new Set(db.seasons.map((s) => s.id)));

  await upsertTable("seasons", db.seasons);
  await upsertTable("players", db.players);
  await upsertTable("player_season_memberships", db.player_season_memberships);
  await upsertTable("matches", db.matches);

  const { data: dbStats, error: stSel } = await client.from("match_player_stats").select("match_id, player_id");
  if (stSel) throw new Error(`match_player_stats select: ${stSel.message}`);
  const wantStats = new Set(db.match_player_stats.map((s) => statKey(s.match_id, s.player_id)));
  for (const row of dbStats ?? []) {
    if (!wantStats.has(statKey(row.match_id, row.player_id))) {
      const { error: d } = await client
        .from("match_player_stats")
        .delete()
        .eq("match_id", row.match_id)
        .eq("player_id", row.player_id);
      if (d) throw new Error(`match_player_stats delete: ${d.message}`);
    }
  }
  if (db.match_player_stats.length) {
    const { error: u } = await client
      .from("match_player_stats")
      .upsert(db.match_player_stats as never[], { onConflict: "match_id,player_id" });
    if (u) throw new Error(`match_player_stats upsert: ${u.message}`);
  }

  const { data: dbEvents, error: evSel } = await client.from("match_goal_events").select("id");
  if (evSel) throw new Error(`match_goal_events select: ${evSel.message}`);
  const wantEventIds = new Set(db.match_goal_events.map((e) => e.id));
  for (const row of dbEvents ?? []) {
    if (!wantEventIds.has(goalEventKey(row.id))) {
      const { error: d } = await client.from("match_goal_events").delete().eq("id", row.id);
      if (d) throw new Error(`match_goal_events delete: ${d.message}`);
    }
  }
  if (db.match_goal_events.length) {
    const { error: evUp } = await client.from("match_goal_events").upsert(db.match_goal_events as never[], { onConflict: "id" });
    if (evUp) throw new Error(`match_goal_events upsert: ${evUp.message}`);
  }

  await upsertTable("training_sessions", db.training_sessions);

  const { data: dbAtt, error: atSel } = await client.from("training_attendance").select("session_id, player_id");
  if (atSel) throw new Error(`training_attendance select: ${atSel.message}`);
  const wantAtt = new Set(db.training_attendance.map((a) => attKey(a.session_id, a.player_id)));
  for (const row of dbAtt ?? []) {
    if (!wantAtt.has(attKey(row.session_id, row.player_id))) {
      const { error: d } = await client
        .from("training_attendance")
        .delete()
        .eq("session_id", row.session_id)
        .eq("player_id", row.player_id);
      if (d) throw new Error(`training_attendance delete: ${d.message}`);
    }
  }
  if (db.training_attendance.length) {
    const { error: u } = await client.from("training_attendance").upsert(db.training_attendance as never[], {
      onConflict: "session_id,player_id",
    });
    if (u) throw new Error(`training_attendance upsert: ${u.message}`);
  }

  await upsertTableOptional("fitness_score_configs", db.fitness_score_configs);
  await upsertTableOptional("fitness_test_sessions", db.fitness_test_sessions);
  await upsertTableOptional("fitness_test_results", db.fitness_test_results);
  await upsertTable("fitness_tests", db.fitness_tests);

  const { data: verRows, error: verErr } = await client
    .from("club_profile")
    .update({
      team_photo_url: db.team_photo_url,
      schema_version: expectedSchemaVersion + 1,
    })
    .eq("id", "default")
    .eq("schema_version", expectedSchemaVersion)
    .select("id");

  if (verErr) {
    throw new Error(`club_profile (versie): ${verErr.message}`);
  }
  if (!verRows?.length) {
    throw new Error(
      "Concurrente wijziging: iemand anders heeft net opgeslagen. Vernieuw de pagina en probeer opnieuw (optimistic lock).",
    );
  }
}
