"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { matchAdminPayloadSchema } from "@/lib/validations/match-admin";
import { aggregateStatsFromGoals } from "@/lib/match-goal-helpers";
import { mutateDb } from "@/lib/data/mutate";
import { isPlayerSelectable } from "@/lib/queries/match-selectable-players";
import type { MatchGoalEvent } from "@/types";
import { normalizeMutationError } from "@/lib/forms/admin-action-state";
import type { MatchAdminActionResult, MatchAdminFormState } from "@/lib/admin/match-admin-types";
import type { MatchVerificationPayload } from "@/lib/admin/verification-types";

type MatchVerificationCore = {
  match_id: string;
  persisted_goal_events_count: number;
  persisted_derived_goals_count: number;
  persisted_assist_events_count: number;
  persisted_derived_assists_count: number;
  persisted_mvp_player_id: string;
};

function rebuildStatsFromPersistedEvents(
  db: import("@/types").ClubDatabase,
  matchId: string,
): { affectedPlayerIds: string[]; goalCount: number; assistCount: number } {
  db.match_player_stats = db.match_player_stats.filter((s) => s.match_id !== matchId);
  const events = db.match_goal_events.filter((e) => e.match_id === matchId);
  const map = new Map<string, { goals: number; assists: number }>();
  for (const e of events) {
    const scorer = map.get(e.scorer_player_id) ?? { goals: 0, assists: 0 };
    scorer.goals += 1;
    map.set(e.scorer_player_id, scorer);
    if (e.assist_player_id) {
      const assist = map.get(e.assist_player_id) ?? { goals: 0, assists: 0 };
      assist.assists += 1;
      map.set(e.assist_player_id, assist);
    }
  }
  const rows = [...map.entries()].map(([player_id, v]) => ({
    match_id: matchId,
    player_id,
    goals: v.goals,
    assists: v.assists,
  }));
  if (rows.length > 0) db.match_player_stats.push(...rows);
  return {
    affectedPlayerIds: [...map.keys()],
    goalCount: events.length,
    assistCount: events.filter((e) => !!e.assist_player_id).length,
  };
}

function flattenZodErrors(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.length ? issue.path.join(".") : "_root";
    if (!out[path]) out[path] = [];
    out[path].push(issue.message);
  }
  return out;
}

function verifyMatchIntegrity(db: import("@/types").ClubDatabase, matchId: string): MatchVerificationCore {
  const match = db.matches.find((m) => m.id === matchId);
  if (!match) throw new Error("Post-validatie: wedstrijd niet gevonden.");
  const events = db.match_goal_events.filter((e) => e.match_id === matchId);
  const stats = db.match_player_stats.filter((s) => s.match_id === matchId);
  if (match.status !== "played") {
    if (events.length > 0 || stats.some((s) => s.goals > 0 || s.assists > 0)) {
      throw new Error("Post-validatie: niet-gespeelde wedstrijd bevat events/stats.");
    }
    if (match.goals_for !== 0 || match.wotm_player_id) {
      throw new Error("Post-validatie: niet-gespeelde wedstrijd heeft goals_for/MVP.");
    }
    return {
      match_id: matchId,
      persisted_goal_events_count: 0,
      persisted_derived_goals_count: 0,
      persisted_assist_events_count: 0,
      persisted_derived_assists_count: 0,
      persisted_mvp_player_id: "",
    };
  }
  if (match.goals_for !== events.length) throw new Error("Post-validatie: goals_for mismatch met events.");
  const goalsFromStats = stats.reduce((a, s) => a + s.goals, 0);
  const assistsFromStats = stats.reduce((a, s) => a + s.assists, 0);
  const assistsFromEvents = events.filter((e) => !!e.assist_player_id).length;
  if (goalsFromStats !== events.length) throw new Error("Post-validatie: stat-goals mismatch met events.");
  if (assistsFromStats !== assistsFromEvents) throw new Error("Post-validatie: stat-assists mismatch met events.");
  if (!match.wotm_player_id) throw new Error("Post-validatie: MVP ontbreekt.");
  return {
    match_id: matchId,
    persisted_goal_events_count: events.length,
    persisted_derived_goals_count: goalsFromStats,
    persisted_assist_events_count: assistsFromEvents,
    persisted_derived_assists_count: assistsFromStats,
    persisted_mvp_player_id: match.wotm_player_id,
  };
}

export async function saveMatchAdminAction(raw: unknown): Promise<MatchAdminActionResult> {
  const parsed = matchAdminPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = flattenZodErrors(parsed.error);
    const first = parsed.error.issues[0]?.message ?? "Controleer het formulier.";
    return { ok: false, error: first, fieldErrors };
  }

  const data = parsed.data;
  const kickCheck = new Date(data.kickoff_at);
  if (Number.isNaN(kickCheck.getTime())) {
    return {
      ok: false,
      error: "Ongeldige datum of tijd.",
      fieldErrors: { kickoff_at: ["Kies een geldige datum en tijd voor de aanvang."] },
    };
  }

  const matchId = data.match_id?.trim() || randomUUID();
  const played = data.status === "played";

  const goalsPayload = played
    ? data.goals.map((g) => ({
        scorer_player_id: g.scorer_player_id,
        assist_player_id: (typeof g.assist_player_id === "string" ? g.assist_player_id : "")?.trim() || undefined,
      }))
    : [];

  if (played) {
    for (let i = 0; i < goalsPayload.length; i++) {
      const row = goalsPayload[i];
      if (!row.scorer_player_id?.trim()) {
        return { ok: false, error: `Goal ${i + 1}: scorer_player_id ontbreekt.` };
      }
      if (row.assist_player_id && row.assist_player_id === row.scorer_player_id) {
        return { ok: false, error: `Goal ${i + 1}: assist_player_id mag niet gelijk zijn aan scorer_player_id.` };
      }
    }
  }

  try {
    let verification: MatchVerificationCore | null = null;
    let beforeSnapshot: unknown = null;
    let afterSnapshot: unknown = null;
    let affectedPlayerIds = new Set<string>();
    let auditAction: "create" | "update" = "update";
    await mutateDb((db) => {
      if (!db.seasons.some((s) => s.id === data.season_id)) {
        throw new Error("Seizoen bestaat niet.");
      }

      if (played) {
        for (const pid of data.selected_player_ids) {
          if (!isPlayerSelectable(db, data.season_id, matchId, pid)) {
            throw new Error("Een of meer speelsters horen niet bij deze wedstrijdselectie.");
          }
        }
      }

      const kickoffIso = new Date(data.kickoff_at).toISOString();
      const duplicate = db.matches.find(
        (m) =>
          m.id !== matchId &&
          m.season_id === data.season_id &&
          m.is_home === data.is_home &&
          m.opponent.trim().toLowerCase() === data.opponent.trim().toLowerCase() &&
          new Date(m.kickoff_at).getTime() === new Date(kickoffIso).getTime(),
      );
      if (duplicate) {
        throw new Error("Er bestaat al een wedstrijd met dezelfde seizoen/tegenstander/thuis-uit/datum.");
      }

      const beforeEvents = db.match_goal_events
        .filter((e) => e.match_id === matchId)
        .map((e) => ({ scorer_player_id: e.scorer_player_id, assist_player_id: e.assist_player_id ?? null, sort_order: e.sort_order }));
      const beforeStats = db.match_player_stats.filter((s) => s.match_id === matchId);
      const beforeMatch = db.matches.find((m) => m.id === matchId) ?? null;
      beforeSnapshot = {
        match_id: matchId,
        events: beforeEvents,
        stats: beforeStats,
        mvp_player_id: beforeMatch?.wotm_player_id ?? null,
      };
      db.match_player_stats = db.match_player_stats.filter((s) => s.match_id !== matchId);
      db.match_goal_events = db.match_goal_events.filter((e) => e.match_id !== matchId);

      let goals_for = 0;
      let wotm: string | null = null;

      if (played) {
        const { goals_for: gf, events } = aggregateStatsFromGoals(matchId, data.selected_player_ids, goalsPayload);
        if (gf !== goalsPayload.length) {
          throw new Error("Goals komen niet overeen met totaal");
        }
        goals_for = gf;
        if (goals_for !== data.goals_for) {
          throw new Error("Goals voor komt niet overeen met aantal doelpunten.");
        }
        wotm = data.wotm_player_id?.trim() || null;
        if (!wotm) {
          throw new Error("Kies een MVP (speelster van de wedstrijd).");
        }
        if (!data.selected_player_ids.includes(wotm)) {
          throw new Error("MVP niet in selectie");
        }
        const withIds: MatchGoalEvent[] = events.map((e) => ({
          ...e,
          id: randomUUID(),
        }));
        db.match_goal_events.push(...withIds);
        const rebuilt = rebuildStatsFromPersistedEvents(db, matchId);
        for (const id of rebuilt.affectedPlayerIds) affectedPlayerIds.add(id);
      } else {
        goals_for = 0;
        wotm = null;
        rebuildStatsFromPersistedEvents(db, matchId);
      }

      const row = {
        id: matchId,
        season_id: data.season_id,
        opponent: data.opponent.trim(),
        kickoff_at: kickoffIso,
        is_home: data.is_home,
        goals_for,
        goals_against: played ? data.goals_against : data.goals_against,
        status: data.status,
        wotm_player_id: wotm,
        integrity_state: "invalid" as const,
      };

      const existing = db.matches.find((m) => m.id === matchId);
      auditAction = existing ? "update" : "create";
      if (existing) Object.assign(existing, row);
      else db.matches.push(row);

      verification = verifyMatchIntegrity(db, matchId);
      const verifiedRow = db.matches.find((m) => m.id === matchId);
      if (!verifiedRow) throw new Error("Post-validatie: wedstrijd niet gevonden na write.");
      verifiedRow.integrity_state = "verified";
      const afterEvents = db.match_goal_events
        .filter((e) => e.match_id === matchId)
        .map((e) => ({ scorer_player_id: e.scorer_player_id, assist_player_id: e.assist_player_id ?? null, sort_order: e.sort_order }));
      const afterStats = db.match_player_stats.filter((s) => s.match_id === matchId);
      const afterMatch = db.matches.find((m) => m.id === matchId) ?? null;
      afterSnapshot = {
        match_id: matchId,
        events: afterEvents,
        stats: afterStats,
        mvp_player_id: afterMatch?.wotm_player_id ?? null,
      };
    },
    {
      action: () => auditAction,
      entity: "match",
      entity_id: matchId,
      before_snapshot: () => beforeSnapshot,
      after_snapshot: () => afterSnapshot,
      verification: () => verification,
    },
    );
    if (!verification && played) {
      throw new Error("Post-validatie ontbreekt.");
    }
    const verificationCore: MatchVerificationCore = verification ?? {
      match_id: matchId,
      persisted_goal_events_count: 0,
      persisted_derived_goals_count: 0,
      persisted_assist_events_count: 0,
      persisted_derived_assists_count: 0,
      persisted_mvp_player_id: "",
    };
    const verified: MatchVerificationPayload = {
      ...verificationCore,
      verified: true,
      integrity_state: "verified",
      event_goal_count: verificationCore.persisted_goal_events_count,
      event_assist_count: verificationCore.persisted_assist_events_count,
      derived_goal_count: verificationCore.persisted_derived_goals_count,
      derived_assist_count: verificationCore.persisted_derived_assists_count,
      verified_at: new Date().toISOString(),
      affected_player_ids: [],
      changes: [],
      mvp_before_player_id: null,
      mvp_after_player_id: verificationCore.persisted_mvp_player_id || null,
    };
    const bStats = new Map<string, { g: number; a: number }>();
    const aStats = new Map<string, { g: number; a: number }>();
    const bSnap = (beforeSnapshot as { stats?: { player_id: string; goals: number; assists: number }[]; mvp_player_id?: string | null } | null);
    const aSnap = (afterSnapshot as { stats?: { player_id: string; goals: number; assists: number }[]; mvp_player_id?: string | null } | null);
    for (const s of bSnap?.stats ?? []) bStats.set(s.player_id, { g: s.goals, a: s.assists });
    for (const s of aSnap?.stats ?? []) aStats.set(s.player_id, { g: s.goals, a: s.assists });
    const ids = new Set([...bStats.keys(), ...aStats.keys()]);
    verified.changes = [...ids]
      .map((id) => {
        const b = bStats.get(id) ?? { g: 0, a: 0 };
        const a = aStats.get(id) ?? { g: 0, a: 0 };
        return { player_id: id, goals_delta: a.g - b.g, assists_delta: a.a - b.a };
      })
      .filter((c) => c.goals_delta !== 0 || c.assists_delta !== 0);
    verified.mvp_before_player_id = bSnap?.mvp_player_id ?? null;
    verified.mvp_after_player_id = aSnap?.mvp_player_id ?? null;
    const affectedIds = new Set<string>([...affectedPlayerIds]);
    if (verified.mvp_before_player_id) affectedIds.add(verified.mvp_before_player_id);
    if (verified.mvp_after_player_id) affectedIds.add(verified.mvp_after_player_id);
    verified.affected_player_ids = [...affectedIds];
    return { ok: true, matchId, verification: verified };
  } catch (e) {
    try {
      await mutateDb(
        (db) => {
          const m = db.matches.find((x) => x.id === matchId);
          if (m) m.integrity_state = "invalid";
        },
        { action: "match_mark_invalid", entity: "match", entity_id: matchId },
      );
    } catch {
      // best effort: keep original error response
    }
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function deleteMatchAdminAction(matchId: string): Promise<MatchAdminActionResult> {
  if (!matchId?.trim()) return { ok: false, error: "Geen wedstrijd-id." };
  try {
    await mutateDb(
      (db) => {
        db.match_matchday_roster = db.match_matchday_roster.filter((r) => r.match_id !== matchId);
        db.matches = db.matches.filter((m) => m.id !== matchId);
        db.match_player_stats = db.match_player_stats.filter((s) => s.match_id !== matchId);
        db.match_goal_events = db.match_goal_events.filter((e) => e.match_id !== matchId);
      },
      { action: "match_delete", entity: "match", entity_id: matchId },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verwijderen mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
  return { ok: true, matchId };
}

export async function saveMatchAdminFormStateAction(
  _prev: MatchAdminFormState,
  formData: FormData,
): Promise<MatchAdminFormState> {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return { status: "error", error: "Formulier kon niet worden verstuurd. Vernieuw de pagina." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(rawPayload);
  } catch {
    return { status: "error", error: "Ongeldige formulierdata. Probeer opnieuw." };
  }
  const res = await saveMatchAdminAction(raw);
  if (!res.ok) {
    return {
      status: "error",
      error: normalizeMutationError(res.error),
      fieldErrors: res.fieldErrors,
    };
  }
  if (!res.verification) {
    return { status: "error", error: "Verificatie ontbreekt na opslaan. Er is niets bevestigd." };
  }
  return { status: "success", message: "Match opgeslagen en geverifieerd.", matchId: res.matchId, verification: res.verification };
}

export async function deleteMatchAdminFormStateAction(
  _prev: MatchAdminFormState,
  formData: FormData,
): Promise<MatchAdminFormState> {
  const matchId = String(formData.get("match_id") ?? "").trim();
  if (!matchId) {
    return { status: "error", error: "Geen wedstrijd-id — verwijderen afgebroken." };
  }
  const res = await deleteMatchAdminAction(matchId);
  if (!res.ok) {
    return { status: "error", error: normalizeMutationError(res.error) };
  }
  return { status: "success", message: "Wedstrijd verwijderd.", matchId, deleted: true };
}
