import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClubDatabase,
  FitnessScoreConfig,
  FitnessTest,
  FitnessTestResult,
  FitnessTestSession,
  Match,
  MatchGoalEvent,
  MatchCardEvent,
  MatchLineupEntry,
  MatchMatchdayRosterRow,
  MatchPlayerStat,
  MatchSubstitution,
  MatchPositionChange,
  Player,
  PlayerSeasonMembership,
  Season,
  TrainingAttendance,
  TrainingSession,
} from "@/types";

function fail(ctx: string, message: string): never {
  throw new Error(`${ctx}: ${message}`);
}

const FITNESS_MIGRATION_MSG =
  "Database nog niet bijgewerkt voor het nieuwe fitheidsprotocol. Pas migratie 025 toe.";

function isMissingFitnessTableError(message: string): boolean {
  return (
    /relation .+ does not exist/i.test(message) ||
    /Could not find the table/i.test(message) ||
    /schema cache/i.test(message) ||
    /PGRST205/i.test(message)
  );
}

function failFitnessWrite(ctx: string, message: string): never {
  if (isMissingFitnessTableError(message)) {
    throw new Error(FITNESS_MIGRATION_MSG);
  }
  fail(ctx, message);
}

function statKey(s: MatchPlayerStat) {
  return `${s.match_id}:${s.player_id}`;
}

function rosterKey(r: MatchMatchdayRosterRow) {
  return `${r.match_id}:${r.player_id}`;
}

function attKey(a: TrainingAttendance) {
  return `${a.session_id}:${a.player_id}`;
}

function seasonEq(a: Season, b: Season) {
  return (
    a.name === b.name &&
    a.starts_on === b.starts_on &&
    a.ends_on === b.ends_on &&
    a.is_active === b.is_active
  );
}

function playerEq(a: Player, b: Player) {
  return (
    a.full_name === b.full_name &&
    a.photo_url === b.photo_url &&
    a.is_guest === b.is_guest &&
    (a.birth_date ?? null) === (b.birth_date ?? null) &&
    a.initials === b.initials &&
    a.bio === b.bio &&
    a.preferred_foot === b.preferred_foot &&
    a.strengths === b.strengths &&
    a.role_label === b.role_label &&
    a.tagline === b.tagline &&
    a.card_note === b.card_note
  );
}

function rosterEq(a: MatchMatchdayRosterRow, b: MatchMatchdayRosterRow) {
  return (
    a.match_shirt_number === b.match_shirt_number &&
    a.position_label === b.position_label
  );
}

function lineupEq(a: MatchLineupEntry, b: MatchLineupEntry) {
  return (
    a.match_id === b.match_id &&
    a.player_id === b.player_id &&
    a.role === b.role &&
    a.position === b.position &&
    a.absence_reason === b.absence_reason &&
    a.sort_order === b.sort_order
  );
}

function memEq(a: PlayerSeasonMembership, b: PlayerSeasonMembership) {
  return (
    a.player_id === b.player_id &&
    a.season_id === b.season_id &&
    a.shirt_number === b.shirt_number &&
    a.position === b.position &&
    a.display_position === b.display_position &&
    a.is_captain === b.is_captain &&
    a.is_vice_captain === b.is_vice_captain &&
    a.is_guest === b.is_guest
  );
}

function matchEq(a: Match, b: Match) {
  return (
    a.season_id === b.season_id &&
    a.opponent === b.opponent &&
    a.kickoff_at === b.kickoff_at &&
    a.is_home === b.is_home &&
    a.match_type === b.match_type &&
    a.location === b.location &&
    a.referee === b.referee &&
    a.notes === b.notes &&
    a.goals_for === b.goals_for &&
    a.goals_against === b.goals_against &&
    a.status === b.status &&
    a.wotm_player_id === b.wotm_player_id &&
    (a.integrity_state ?? "verified") === (b.integrity_state ?? "verified") &&
    (a.lineup_status ?? "draft") === (b.lineup_status ?? "draft") &&
    (a.lineup_confirmed_at ?? null) === (b.lineup_confirmed_at ?? null)
  );
}

function statEq(a: MatchPlayerStat, b: MatchPlayerStat) {
  return a.goals === b.goals && a.assists === b.assists;
}

function eventEq(a: MatchGoalEvent, b: MatchGoalEvent) {
  return (
    a.match_id === b.match_id &&
    a.scorer_player_id === b.scorer_player_id &&
    a.assist_player_id === b.assist_player_id &&
    a.sort_order === b.sort_order &&
    a.minute === b.minute
  );
}

function cardEventEq(a: MatchCardEvent, b: MatchCardEvent) {
  return (
    a.match_id === b.match_id &&
    a.player_id === b.player_id &&
    a.card_type === b.card_type &&
    a.minute === b.minute
  );
}

function substitutionEq(a: MatchSubstitution, b: MatchSubstitution) {
  return (
    a.match_id === b.match_id &&
    a.player_in_id === b.player_in_id &&
    a.player_out_id === b.player_out_id &&
    a.minute === b.minute &&
    (a.to_slot ?? null) === (b.to_slot ?? null) &&
    (a.stoppage_time ?? 0) === (b.stoppage_time ?? 0) &&
    (a.sort_order ?? 0) === (b.sort_order ?? 0) &&
    (a.change_group_id ?? null) === (b.change_group_id ?? null) &&
    (a.notes ?? null) === (b.notes ?? null)
  );
}

function positionChangeEq(a: MatchPositionChange, b: MatchPositionChange) {
  return (
    a.match_id === b.match_id &&
    a.player_id === b.player_id &&
    a.minute === b.minute &&
    a.stoppage_time === b.stoppage_time &&
    a.from_slot === b.from_slot &&
    a.to_slot === b.to_slot &&
    (a.change_group_id ?? null) === (b.change_group_id ?? null) &&
    (a.notes ?? null) === (b.notes ?? null) &&
    a.sort_order === b.sort_order
  );
}

function sessEq(a: TrainingSession, b: TrainingSession) {
  return (
    a.season_id === b.season_id &&
    a.title === b.title &&
    a.session_at === b.session_at &&
    a.location === b.location &&
    a.status === b.status
  );
}

function attRowEq(a: TrainingAttendance, b: TrainingAttendance) {
  return a.present === b.present && a.note === b.note;
}

function fitEq(a: FitnessTest, b: FitnessTest) {
  return (
    a.season_id === b.season_id &&
    a.player_id === b.player_id &&
    a.test_type === b.test_type &&
    a.test_on === b.test_on &&
    a.total_time === b.total_time &&
    a.sprint_20m === b.sprint_20m &&
    a.sprint_40m === b.sprint_40m &&
    a.sprint_60m === b.sprint_60m &&
    a.recorded_at === b.recorded_at &&
    a.note === b.note &&
    a.progress_status === b.progress_status &&
    a.progress_delta === b.progress_delta &&
    a.session_rank === b.session_rank
  );
}

function fitSessionEq(a: FitnessTestSession, b: FitnessTestSession) {
  return (
    a.season_id === b.season_id &&
    a.test_on === b.test_on &&
    a.protocol_code === b.protocol_code &&
    a.status === b.status &&
    a.note === b.note &&
    a.score_config_id === b.score_config_id &&
    a.published_at === b.published_at &&
    a.created_by === b.created_by &&
    a.published_by === b.published_by
  );
}

function fitResultEq(a: FitnessTestResult, b: FitnessTestResult) {
  return (
    a.session_id === b.session_id &&
    a.player_id === b.player_id &&
    a.flying_sprint_30m_seconds === b.flying_sprint_30m_seconds &&
    a.agility_10_20_10_seconds === b.agility_10_20_10_seconds &&
    a.plank_seconds === b.plank_seconds &&
    a.six_minute_run_meters === b.six_minute_run_meters &&
    a.participation_status === b.participation_status &&
    a.participation_reason === b.participation_reason &&
    a.note === b.note
  );
}

function fitConfigEq(a: FitnessScoreConfig, b: FitnessScoreConfig) {
  return (
    a.code === b.code &&
    a.label === b.label &&
    a.version === b.version &&
    JSON.stringify(a.config) === JSON.stringify(b.config)
  );
}

/**
 * Past alleen gewijzigde rijen toe (geen volledige dataset-rewrite).
 * Verwijderingen respecteren FK-volgorde; match-/sessie-delete gebruikt CASCADE voor kind-tabellen.
 * Optimistic lock: club_profile.schema_version moet exact `expectedSchemaVersion` zijn.
 */
export async function applyClubDatabaseDiff(
  client: SupabaseClient,
  before: ClubDatabase,
  after: ClubDatabase,
  expectedSchemaVersion: number,
): Promise<void> {
  const afterSeasonIds = new Set(after.seasons.map((s) => s.id));
  const afterPlayerIds = new Set(after.players.map((p) => p.id));
  const afterMemIds = new Set(after.player_season_memberships.map((m) => m.id));
  const afterMatchIds = new Set(after.matches.map((m) => m.id));
  const afterSessIds = new Set(after.training_sessions.map((s) => s.id));
  const afterFitIds = new Set(after.fitness_tests.map((f) => f.id));
  const afterFitResultIds = new Set(after.fitness_test_results.map((r) => r.id));
  const afterFitSessionIds = new Set(after.fitness_test_sessions.map((s) => s.id));
  const afterFitConfigIds = new Set(after.fitness_score_configs.map((c) => c.id));

  const afterRosterKeys = new Set(after.match_matchday_roster.map(rosterKey));
  const afterLineupIds = new Set(after.match_lineup_entries.map((e) => e.id));
  const afterStatKeys = new Set(after.match_player_stats.map(statKey));
  const afterAttKeys = new Set(after.training_attendance.map(attKey));
  const afterEventIds = new Set(after.match_goal_events.map((e) => e.id));
  const afterCardEventIds = new Set(after.match_card_events.map((e) => e.id));
  const afterSubstitutionIds = new Set(after.match_substitutions.map((e) => e.id));
  const afterPosChangeIds = new Set((after.match_position_changes ?? []).map((e) => e.id));

  // --- Deletes (kinderen / afhankelijken eerst waar geen CASCADE van parent naar child) ---
  for (const r of before.fitness_test_results) {
    if (!afterFitResultIds.has(r.id) || !afterFitSessionIds.has(r.session_id)) {
      const { error } = await client.from("fitness_test_results").delete().eq("id", r.id);
      if (error) failFitnessWrite("fitness_test_results verwijderen", error.message);
    }
  }

  for (const s of before.fitness_test_sessions) {
    if (!afterFitSessionIds.has(s.id)) {
      const { error } = await client.from("fitness_test_sessions").delete().eq("id", s.id);
      if (error) failFitnessWrite("fitness_test_sessions verwijderen", error.message);
    }
  }

  for (const c of before.fitness_score_configs) {
    if (!afterFitConfigIds.has(c.id)) {
      const { error } = await client.from("fitness_score_configs").delete().eq("id", c.id);
      if (error) failFitnessWrite("fitness_score_configs verwijderen", error.message);
    }
  }

  for (const f of before.fitness_tests) {
    if (!afterFitIds.has(f.id)) {
      const { error } = await client.from("fitness_tests").delete().eq("id", f.id);
      if (error) fail("fitness_tests verwijderen", error.message);
    }
  }

  for (const s of before.training_sessions) {
    if (!afterSessIds.has(s.id)) {
      const { error } = await client.from("training_sessions").delete().eq("id", s.id);
      if (error) fail("training_sessions verwijderen", error.message);
    }
  }

  for (const r of before.match_matchday_roster) {
    if (!afterRosterKeys.has(rosterKey(r))) {
      const { error } = await client
        .from("match_matchday_roster")
        .delete()
        .eq("match_id", r.match_id)
        .eq("player_id", r.player_id);
      if (error) fail("match_matchday_roster verwijderen", error.message);
    }
  }

  for (const e of before.match_lineup_entries) {
    if (!afterLineupIds.has(e.id)) {
      const { error } = await client.from("match_lineup_entries").delete().eq("id", e.id);
      if (error) fail("match_lineup_entries verwijderen", error.message);
    }
  }

  for (const m of before.matches) {
    if (!afterMatchIds.has(m.id)) {
      const { error } = await client.from("matches").delete().eq("id", m.id);
      if (error) fail("matches verwijderen", error.message);
    }
  }

  for (const mem of before.player_season_memberships) {
    if (!afterMemIds.has(mem.id)) {
      const { error } = await client.from("player_season_memberships").delete().eq("id", mem.id);
      if (error) fail("player_season_memberships verwijderen", error.message);
    }
  }

  for (const p of before.players) {
    if (!afterPlayerIds.has(p.id)) {
      const { error } = await client.from("players").delete().eq("id", p.id);
      if (error) fail("players verwijderen", error.message);
    }
  }

  for (const s of before.seasons) {
    if (!afterSeasonIds.has(s.id)) {
      const { error } = await client.from("seasons").delete().eq("id", s.id);
      if (error) fail("seasons verwijderen", error.message);
    }
  }

  // Stats / attendance / goal events op bestaande wedstrijden (na verwijderde wedstrijden)
  for (const st of before.match_player_stats) {
    if (!afterStatKeys.has(statKey(st))) {
      const { error } = await client
        .from("match_player_stats")
        .delete()
        .eq("match_id", st.match_id)
        .eq("player_id", st.player_id);
      if (error) fail("match_player_stats verwijderen", error.message);
    }
  }

  for (const e of before.match_goal_events) {
    if (!afterEventIds.has(e.id)) {
      const { error } = await client.from("match_goal_events").delete().eq("id", e.id);
      if (error) fail("match_goal_events verwijderen", error.message);
    }
  }

  for (const c of before.match_card_events) {
    if (!afterCardEventIds.has(c.id)) {
      const { error } = await client.from("match_card_events").delete().eq("id", c.id);
      if (error) fail("match_card_events verwijderen", error.message);
    }
  }

  for (const s of before.match_substitutions) {
    if (!afterSubstitutionIds.has(s.id)) {
      const { error } = await client.from("match_substitutions").delete().eq("id", s.id);
      if (error) fail("match_substitutions verwijderen", error.message);
    }
  }
  for (const s of before.match_position_changes ?? []) {
    if (!afterPosChangeIds.has(s.id)) {
      const { error } = await client.from("match_position_changes").delete().eq("id", s.id);
      if (error) fail("match_position_changes verwijderen", error.message);
    }
  }

  for (const a of before.training_attendance) {
    if (!afterAttKeys.has(attKey(a))) {
      const { error } = await client
        .from("training_attendance")
        .delete()
        .eq("session_id", a.session_id)
        .eq("player_id", a.player_id);
      if (error) fail("training_attendance verwijderen", error.message);
    }
  }

  // --- Upserts (ouders voor kinderen) ---
  for (const s of after.seasons) {
    const b = before.seasons.find((x) => x.id === s.id);
    if (!b || !seasonEq(b, s)) {
      const row = {
        id: s.id,
        name: s.name,
        starts_on: s.starts_on,
        ends_on: s.ends_on,
        is_active: s.is_active,
      };
      const { error } = await client.from("seasons").upsert(row as never, { onConflict: "id" });
      if (error) fail("seasons opslaan", error.message);
    }
  }

  for (const p of after.players) {
    const b = before.players.find((x) => x.id === p.id);
    if (!b || !playerEq(b, p)) {
      const row = {
        id: p.id,
        full_name: p.full_name,
        photo_url: p.photo_url,
        is_guest: p.is_guest,
        birth_date: p.birth_date ?? null,
        initials: p.initials,
        bio: p.bio,
        preferred_foot: p.preferred_foot,
        strengths: p.strengths,
        role_label: p.role_label,
        tagline: p.tagline,
        card_note: p.card_note,
      };
      const { error } = await client.from("players").upsert(row as never, { onConflict: "id" });
      if (error) fail("players opslaan", error.message);
    }
  }

  for (const m of after.player_season_memberships) {
    const b = before.player_season_memberships.find((x) => x.id === m.id);
    if (!b || !memEq(b, m)) {
      const row = {
        id: m.id,
        player_id: m.player_id,
        season_id: m.season_id,
        shirt_number: m.shirt_number,
        position: m.position,
        display_position: m.display_position,
        is_captain: m.is_captain,
        is_vice_captain: m.is_vice_captain,
        is_guest: m.is_guest,
      };
      const { error } = await client.from("player_season_memberships").upsert(row as never, { onConflict: "id" });
      if (error) fail("player_season_memberships opslaan", error.message);
    }
  }

  for (const m of after.matches) {
    const b = before.matches.find((x) => x.id === m.id);
    if (!b || !matchEq(b, m)) {
      const row = {
        id: m.id,
        season_id: m.season_id,
        opponent: m.opponent,
        kickoff_at: m.kickoff_at,
        is_home: m.is_home,
        match_type: m.match_type,
        location: m.location,
        referee: m.referee,
        notes: m.notes,
        goals_for: m.goals_for,
        goals_against: m.goals_against,
        status: m.status,
        wotm_player_id: m.wotm_player_id,
        integrity_state: m.integrity_state ?? "verified",
        lineup_status: m.lineup_status ?? "draft",
        lineup_confirmed_at: m.lineup_confirmed_at ?? null,
      };
      const { error } = await client.from("matches").upsert(row as never, { onConflict: "id" });
      if (error) fail("matches opslaan", error.message);
    }
  }

  for (const r of after.match_matchday_roster) {
    const b = before.match_matchday_roster.find((x) => rosterKey(x) === rosterKey(r));
    if (!b || !rosterEq(b, r)) {
      const row = {
        match_id: r.match_id,
        player_id: r.player_id,
        match_shirt_number: r.match_shirt_number,
        position_label: r.position_label,
      };
      const { error } = await client.from("match_matchday_roster").upsert(row as never, {
        onConflict: "match_id,player_id",
      });
      if (error) fail("match_matchday_roster opslaan", error.message);
    }
  }

  for (const e of after.match_lineup_entries) {
    const b = before.match_lineup_entries.find((x) => x.id === e.id);
    if (!b || !lineupEq(b, e)) {
      const row = {
        id: e.id,
        match_id: e.match_id,
        player_id: e.player_id,
        role: e.role,
        position: e.position,
        absence_reason: e.absence_reason,
        sort_order: e.sort_order,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("match_lineup_entries").upsert(row as never, { onConflict: "id" });
      if (error) fail("match_lineup_entries opslaan", error.message);
    }
  }

  for (const st of after.match_player_stats) {
    const b = before.match_player_stats.find((x) => statKey(x) === statKey(st));
    if (!b || !statEq(b, st)) {
      const row = {
        match_id: st.match_id,
        player_id: st.player_id,
        goals: st.goals,
        assists: st.assists,
      };
      const { error } = await client.from("match_player_stats").upsert(row as never, {
        onConflict: "match_id,player_id",
      });
      if (error) fail("match_player_stats opslaan", error.message);
    }
  }

  for (const e of after.match_goal_events) {
    const b = before.match_goal_events.find((x) => x.id === e.id);
    if (!b || !eventEq(b, e)) {
      const row = {
        id: e.id,
        match_id: e.match_id,
        scorer_player_id: e.scorer_player_id,
        assist_player_id: e.assist_player_id,
        sort_order: e.sort_order,
        minute: e.minute,
      };
      const { error } = await client.from("match_goal_events").upsert(row as never, { onConflict: "id" });
      if (error) fail("match_goal_events opslaan", error.message);
    }
  }

  for (const c of after.match_card_events) {
    const b = before.match_card_events.find((x) => x.id === c.id);
    if (!b || !cardEventEq(b, c)) {
      const row = {
        id: c.id,
        match_id: c.match_id,
        player_id: c.player_id,
        card_type: c.card_type,
        minute: c.minute,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("match_card_events").upsert(row as never, { onConflict: "id" });
      if (error) fail("match_card_events opslaan", error.message);
    }
  }

  for (const s of after.match_substitutions) {
    const b = before.match_substitutions.find((x) => x.id === s.id);
    if (!b || !substitutionEq(b, s)) {
      const row = {
        id: s.id,
        match_id: s.match_id,
        player_in_id: s.player_in_id,
        player_out_id: s.player_out_id,
        minute: s.minute,
        to_slot: s.to_slot ?? null,
        stoppage_time: s.stoppage_time ?? 0,
        sort_order: s.sort_order ?? 0,
        change_group_id: s.change_group_id ?? null,
        notes: s.notes ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("match_substitutions").upsert(row as never, { onConflict: "id" });
      if (error) fail("match_substitutions opslaan", error.message);
    }
  }

  for (const s of after.match_position_changes ?? []) {
    const b = (before.match_position_changes ?? []).find((x) => x.id === s.id);
    if (!b || !positionChangeEq(b, s)) {
      const row = {
        id: s.id,
        match_id: s.match_id,
        player_id: s.player_id,
        minute: s.minute,
        stoppage_time: s.stoppage_time,
        from_slot: s.from_slot,
        to_slot: s.to_slot,
        change_group_id: s.change_group_id,
        notes: s.notes,
        sort_order: s.sort_order,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("match_position_changes").upsert(row as never, { onConflict: "id" });
      if (error) fail("match_position_changes opslaan", error.message);
    }
  }

  for (const s of after.training_sessions) {
    const b = before.training_sessions.find((x) => x.id === s.id);
    if (!b || !sessEq(b, s)) {
      const row = {
        id: s.id,
        season_id: s.season_id,
        title: s.title,
        session_at: s.session_at,
        location: s.location,
        status: s.status,
      };
      const { error } = await client.from("training_sessions").upsert(row as never, { onConflict: "id" });
      if (error) fail("training_sessions opslaan", error.message);
    }
  }

  for (const a of after.training_attendance) {
    const b = before.training_attendance.find((x) => attKey(x) === attKey(a));
    if (!b || !attRowEq(b, a)) {
      const row = {
        session_id: a.session_id,
        player_id: a.player_id,
        present: a.present,
        note: a.note,
      };
      const { error } = await client.from("training_attendance").upsert(row as never, {
        onConflict: "session_id,player_id",
      });
      if (error) fail("training_attendance opslaan", error.message);
    }
  }

  for (const f of after.fitness_tests) {
    const b = before.fitness_tests.find((x) => x.id === f.id);
    if (!b || !fitEq(b, f)) {
      const row = {
        id: f.id,
        season_id: f.season_id,
        player_id: f.player_id,
        test_type: f.test_type,
        test_on: f.test_on,
        total_time: f.total_time,
        sprint_20m: f.sprint_20m,
        sprint_40m: f.sprint_40m,
        sprint_60m: f.sprint_60m,
        recorded_at: f.recorded_at,
        note: f.note,
        progress_status: f.progress_status,
        progress_delta: f.progress_delta,
        session_rank: f.session_rank,
      };
      const { error } = await client.from("fitness_tests").upsert(row as never, { onConflict: "id" });
      if (error) fail("fitness_tests opslaan", error.message);
    }
  }

  for (const c of after.fitness_score_configs) {
    const b = before.fitness_score_configs.find((x) => x.id === c.id);
    if (!b || !fitConfigEq(b, c)) {
      const row = {
        id: c.id,
        code: c.code,
        label: c.label,
        version: c.version,
        config: c.config,
        created_at: c.created_at,
      };
      const { error } = await client.from("fitness_score_configs").upsert(row as never, { onConflict: "id" });
      if (error) failFitnessWrite("fitness_score_configs opslaan", error.message);
    }
  }

  for (const s of after.fitness_test_sessions) {
    const b = before.fitness_test_sessions.find((x) => x.id === s.id);
    if (!b || !fitSessionEq(b, s)) {
      const row = {
        id: s.id,
        season_id: s.season_id,
        test_on: s.test_on,
        protocol_code: s.protocol_code,
        status: s.status,
        note: s.note,
        score_config_id: s.score_config_id,
        created_at: s.created_at,
        updated_at: new Date().toISOString(),
        published_at: s.published_at,
        created_by: s.created_by,
        published_by: s.published_by,
      };
      const { error } = await client.from("fitness_test_sessions").upsert(row as never, { onConflict: "id" });
      if (error) failFitnessWrite("fitness_test_sessions opslaan", error.message);
    }
  }

  for (const r of after.fitness_test_results) {
    const b = before.fitness_test_results.find((x) => x.id === r.id);
    if (!b || !fitResultEq(b, r)) {
      const row = {
        id: r.id,
        session_id: r.session_id,
        player_id: r.player_id,
        flying_sprint_30m_seconds: r.flying_sprint_30m_seconds,
        agility_10_20_10_seconds: r.agility_10_20_10_seconds,
        plank_seconds: r.plank_seconds,
        six_minute_run_meters: r.six_minute_run_meters,
        participation_status: r.participation_status,
        participation_reason: r.participation_reason,
        note: r.note,
        created_at: r.created_at,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from("fitness_test_results").upsert(row as never, { onConflict: "id" });
      if (error) failFitnessWrite("fitness_test_results opslaan", error.message);
    }
  }

  const { data: verRows, error: verErr } = await client
    .from("club_profile")
    .update({
      team_photo_url: after.team_photo_url,
      schema_version: expectedSchemaVersion + 1,
    })
    .eq("id", "default")
    .eq("schema_version", expectedSchemaVersion)
    .select("id");

  if (verErr) fail("club_profile (versie)", verErr.message);
  if (!verRows?.length) {
    fail(
      "Concurrente wijziging",
      "Iemand anders heeft net opgeslagen. Vernieuw de pagina en probeer opnieuw.",
    );
  }
}
