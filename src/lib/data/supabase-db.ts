import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClubDatabase,
  FitnessTest,
  FitnessTestType,
  Match,
  MatchGoalEvent,
  MatchMatchdayRosterRow,
  MatchPlayerStat,
  MatchStatus,
  Player,
  PlayerPosition,
  PlayerSeasonMembership,
  Season,
  TrainingAttendance,
  TrainingSession,
  TrainingSessionStatus,
} from "@/types";

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
  return String(s ?? "completed").toLowerCase() === "cancelled" ? "cancelled" : "completed";
}

export type LoadedClubDatabase = {
  database: ClubDatabase;
  schemaVersion: number;
};

export async function loadClubDatabaseFromSupabase(client: SupabaseClient, debugLabel = "loadClubDatabase"): Promise<LoadedClubDatabase> {
  const [
    profileRes,
    seasonsRes,
    playersRes,
    memRes,
    matchesRes,
    rosterRes,
    statsRes,
    eventsRes,
    sessRes,
    attRes,
    fitRes,
  ] = await Promise.all([
    client.from("club_profile").select("team_photo_url, schema_version").eq("id", "default").maybeSingle(),
    client.from("seasons").select("*").order("starts_on", { ascending: false }),
    client.from("players").select("*").order("full_name"),
    client.from("player_season_memberships").select("*"),
    client.from("matches").select("*"),
    client.from("match_matchday_roster").select("*"),
    client.from("match_player_stats").select("*"),
    client.from("match_goal_events").select("*").order("sort_order", { ascending: true }),
    client.from("training_sessions").select("*").order("session_at", { ascending: false }),
    client.from("training_attendance").select("*"),
    client.from("fitness_tests").select("*").order("test_on", { ascending: false }).order("recorded_at", { ascending: false }),
  ]);

  const named = [
    ["club_profile", profileRes],
    ["seasons", seasonsRes],
    ["players", playersRes],
    ["player_season_memberships", memRes],
    ["matches", matchesRes],
    ["match_matchday_roster", rosterRes],
    ["match_player_stats", statsRes],
    ["match_goal_events", eventsRes],
    ["training_sessions", sessRes],
    ["training_attendance", attRes],
    ["fitness_tests", fitRes],
  ] as const;

  const failures: { table: string; message: string }[] = [];
  for (const [table, res] of named) {
    if (res.error?.message) failures.push({ table, message: res.error.message });
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
    const row = r as { is_guest?: boolean };
    return {
      id: r.id,
      full_name: r.full_name,
      photo_url: r.photo_url ?? null,
      is_guest: !!row.is_guest,
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

  const matches: Match[] = (matchesRes.data ?? []).map((r) => ({
    id: r.id,
    season_id: r.season_id,
    opponent: r.opponent,
    kickoff_at: r.kickoff_at,
    is_home: !!r.is_home,
    goals_for: Number(r.goals_for ?? 0),
    goals_against: Number(r.goals_against ?? 0),
    status: asMatchStatus(String(r.status)),
    wotm_player_id: r.wotm_player_id ?? null,
    integrity_state: (r as { integrity_state?: string | null }).integrity_state === "invalid" ? "invalid" : "verified",
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
  }));

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

  return {
    database: {
      seasons,
      players,
      player_season_memberships,
      matches,
      match_matchday_roster,
      match_player_stats,
      match_goal_events,
      training_sessions,
      training_attendance,
      fitness_tests,
      team_photo_url,
    },
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

  /* Verwijder eerst kinderen (FK-veilig); match_player_stats en training_attendance volgen via cascade of expliciet. */
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
