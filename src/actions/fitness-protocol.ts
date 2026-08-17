"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { mutateDb } from "@/lib/data/mutate";
import { readDb } from "@/lib/data/repository";
import {
  FITNESS_DEFAULT_SCORE_CONFIG_ID,
  FITNESS_PROTOCOL_CODE,
  assertNoTotalTime,
  type FitnessParticipationStatus,
} from "@/lib/fitness/protocol";
import { deriveParticipationStatus } from "@/lib/fitness/completeness";
import { normalizeMutationError } from "@/lib/forms/admin-action-state";
import { revalidatePath } from "next/cache";
import { assertFitnessTestDateAllowed, todayInClubTz } from "@/lib/season/season-operations-2026-27";
import { canDeleteFitnessSession, isValidFitnessTestOn } from "@/lib/fitness/fitness-session-admin";

const resultRowSchema = z
  .object({
    player_id: z.string().min(1),
    flying_sprint_30m_seconds: z.number().positive().nullable(),
    agility_10_20_10_seconds: z.number().positive().nullable(),
    plank_seconds: z.number().int().positive().nullable(),
    six_minute_run_meters: z.number().int().positive().nullable(),
    participation_status: z
      .enum(["pending", "partial", "complete", "absent", "injured", "not_tested", "stopped", "other"])
      .optional(),
    participation_reason: z.string().max(200).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((row, ctx) => {
    assertNoTotalTime(row as Record<string, unknown>);
    const excused = ["absent", "injured", "not_tested", "stopped", "other"];
    if (row.participation_status && excused.includes(row.participation_status)) return;
    // zeros already rejected by positive(); nulls ok
  });

export type FitnessProtocolActionResult =
  | { ok: true; sessionId: string; message?: string }
  | { ok: false; error: string; existingSessionId?: string };

function revalidateFitness(seasonId?: string) {
  revalidatePath("/");
  revalidatePath("/fitheid");
  revalidatePath("/ranking");
  revalidatePath("/beheer");
  revalidatePath("/beheer/fitheid");
  revalidatePath("/beheer/fitheid", "layout");
  if (seasonId) {
    revalidatePath(`/beheer/fitheid`);
  }
}

export async function createFitnessSessionAction(input: {
  season_id: string;
  test_on: string;
  note?: string | null;
}): Promise<FitnessProtocolActionResult> {
  const testOn = input.test_on.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testOn)) {
    return { ok: false, error: "Kies een geldige testdatum." };
  }
  const dateGate = assertFitnessTestDateAllowed(input.season_id, testOn);
  if (!dateGate.ok) return { ok: false, error: dateGate.error };

  try {
    const db = await readDb();
    if (!db.seasons.some((s) => s.id === input.season_id)) {
      return { ok: false, error: "Seizoen bestaat niet." };
    }
    const dup = db.fitness_test_sessions.find(
      (s) =>
        s.season_id === input.season_id &&
        s.test_on === testOn &&
        s.protocol_code === FITNESS_PROTOCOL_CODE,
    );
    if (dup) {
      return {
        ok: false,
        error: `Er bestaat al een testmoment op ${testOn}. Open dat moment om verder te gaan.`,
        existingSessionId: dup.id,
      };
    }

    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const members = db.player_season_memberships.filter(
      (m) => m.season_id === input.season_id && !db.players.find((p) => p.id === m.player_id)?.is_guest,
    );

    await mutateDb(
      (draft) => {
        if (!draft.fitness_score_configs.some((c) => c.id === FITNESS_DEFAULT_SCORE_CONFIG_ID)) {
          draft.fitness_score_configs.push({
            id: FITNESS_DEFAULT_SCORE_CONFIG_ID,
            code: "four_part_v1",
            label: "Vier onderdelen v1",
            version: 1,
            config: {},
            created_at: now,
          });
        }
        draft.fitness_test_sessions.push({
          id: sessionId,
          season_id: input.season_id,
          test_on: testOn,
          protocol_code: FITNESS_PROTOCOL_CODE,
          status: "draft",
          note: input.note?.trim() || null,
          score_config_id: FITNESS_DEFAULT_SCORE_CONFIG_ID,
          created_at: now,
          updated_at: now,
          published_at: null,
          created_by: null,
          published_by: null,
        });
        for (const mem of members) {
          draft.fitness_test_results.push({
            id: randomUUID(),
            session_id: sessionId,
            player_id: mem.player_id,
            flying_sprint_30m_seconds: null,
            agility_10_20_10_seconds: null,
            plank_seconds: null,
            six_minute_run_meters: null,
            participation_status: "pending",
            participation_reason: null,
            note: null,
            created_at: now,
            updated_at: now,
          });
        }
      },
      {
        action: "fitness_session_create",
        entity: "fitness_test_sessions",
        entity_id: sessionId,
        capability: "manage_fitness",
      },
    );

    revalidateFitness(input.season_id);
    return { ok: true, sessionId, message: "Concept-testmoment aangemaakt." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Aanmaken mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function saveFitnessSessionResultsAction(input: {
  session_id: string;
  rows: unknown[];
}): Promise<FitnessProtocolActionResult> {
  const parsedRows = z.array(resultRowSchema).safeParse(input.rows);
  if (!parsedRows.success) {
    return { ok: false, error: parsedRows.error.issues[0]?.message ?? "Controleer de invoer." };
  }
  const rows = parsedRows.data;
  const playerIds = rows.map((r) => r.player_id);
  if (new Set(playerIds).size !== playerIds.length) {
    return { ok: false, error: "Dubbele speelster in de opslag — controleer de lijst." };
  }

  try {
    await mutateDb(
      (db) => {
        const session = db.fitness_test_sessions.find((s) => s.id === input.session_id);
        if (!session) throw new Error("Testmoment niet gevonden.");
        if (session.status === "published") {
          throw new Error("Dit testmoment is definitief. Kies eerst Correctie openen.");
        }
        const now = new Date().toISOString();
        for (const row of rows) {
          assertNoTotalTime(row as Record<string, unknown>);
          const existing = db.fitness_test_results.find(
            (r) => r.session_id === input.session_id && r.player_id === row.player_id,
          );
          const status =
            (row.participation_status as FitnessParticipationStatus | undefined) ??
            deriveParticipationStatus(row);
          if (existing) {
            existing.flying_sprint_30m_seconds = row.flying_sprint_30m_seconds;
            existing.agility_10_20_10_seconds = row.agility_10_20_10_seconds;
            existing.plank_seconds = row.plank_seconds;
            existing.six_minute_run_meters = row.six_minute_run_meters;
            existing.participation_status = status;
            existing.participation_reason = row.participation_reason ?? existing.participation_reason;
            existing.note = row.note ?? existing.note;
            existing.updated_at = now;
          } else {
            db.fitness_test_results.push({
              id: randomUUID(),
              session_id: input.session_id,
              player_id: row.player_id,
              flying_sprint_30m_seconds: row.flying_sprint_30m_seconds,
              agility_10_20_10_seconds: row.agility_10_20_10_seconds,
              plank_seconds: row.plank_seconds,
              six_minute_run_meters: row.six_minute_run_meters,
              participation_status: status,
              participation_reason: row.participation_reason ?? null,
              note: row.note ?? null,
              created_at: now,
              updated_at: now,
            });
          }
        }
        session.updated_at = now;
      },
      {
        action: "fitness_session_save_draft",
        entity: "fitness_test_sessions",
        entity_id: input.session_id,
        capability: "manage_fitness",
      },
    );
    revalidateFitness();
    return { ok: true, sessionId: input.session_id, message: "Concept opgeslagen." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function publishFitnessSessionAction(sessionId: string): Promise<FitnessProtocolActionResult> {
  try {
    await mutateDb(
      (db) => {
        const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
        if (!session) throw new Error("Testmoment niet gevonden.");
        if (session.status === "published") throw new Error("Dit testmoment is al definitief.");
        const today = todayInClubTz();
        if (session.test_on > today) {
          throw new Error(
            "Een testmoment met een toekomstige datum kan nog niet definitief worden gemaakt. Kies vandaag of een eerdere testdatum.",
          );
        }
        const results = db.fitness_test_results.filter((r) => r.session_id === sessionId);
        for (const r of results) {
          for (const key of [
            "flying_sprint_30m_seconds",
            "agility_10_20_10_seconds",
            "plank_seconds",
            "six_minute_run_meters",
          ] as const) {
            const v = r[key];
            if (v != null && !(v > 0)) {
              throw new Error("Ongeldige meetwaarde gevonden (0 of negatief). Corrigeer vóór publicatie.");
            }
          }
        }
        const now = new Date().toISOString();
        session.status = "published";
        session.published_at = now;
        session.updated_at = now;
        if (!session.score_config_id) session.score_config_id = FITNESS_DEFAULT_SCORE_CONFIG_ID;
      },
      {
        action: "fitness_session_publish",
        entity: "fitness_test_sessions",
        entity_id: sessionId,
        capability: "manage_fitness",
      },
    );
    revalidateFitness();
    return { ok: true, sessionId, message: "Testmoment is definitief." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Publiceren mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function openFitnessSessionCorrectionAction(sessionId: string): Promise<FitnessProtocolActionResult> {
  try {
    await mutateDb(
      (db) => {
        const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
        if (!session) throw new Error("Testmoment niet gevonden.");
        session.status = "draft";
        session.published_at = null;
        session.updated_at = new Date().toISOString();
      },
      {
        action: "fitness_session_correction_open",
        entity: "fitness_test_sessions",
        entity_id: sessionId,
        capability: "manage_fitness",
      },
    );
    revalidateFitness();
    return { ok: true, sessionId, message: "Correctie geopend — status is weer concept." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Correctie openen mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function updateFitnessSessionMetaAction(input: {
  session_id: string;
  test_on: string;
  note?: string | null;
}): Promise<FitnessProtocolActionResult> {
  const testOn = input.test_on.slice(0, 10);
  if (!isValidFitnessTestOn(testOn)) {
    return { ok: false, error: "Kies een geldige testdatum." };
  }

  try {
    const db = await readDb();
    const session = db.fitness_test_sessions.find((s) => s.id === input.session_id);
    if (!session) return { ok: false, error: "Testmoment niet gevonden." };

    const dateGate = assertFitnessTestDateAllowed(session.season_id, testOn);
    if (!dateGate.ok) return { ok: false, error: dateGate.error };

    const dup = db.fitness_test_sessions.find(
      (s) =>
        s.id !== input.session_id &&
        s.season_id === session.season_id &&
        s.test_on === testOn &&
        s.protocol_code === FITNESS_PROTOCOL_CODE,
    );
    if (dup) {
      return {
        ok: false,
        error: `Er bestaat al een testmoment op ${testOn}. Open dat moment om verder te gaan.`,
        existingSessionId: dup.id,
      };
    }

    await mutateDb(
      (draft) => {
        const row = draft.fitness_test_sessions.find((s) => s.id === input.session_id);
        if (!row) throw new Error("Testmoment niet gevonden.");
        row.test_on = testOn;
        row.note = input.note?.trim() || null;
        row.updated_at = new Date().toISOString();
      },
      {
        action: "fitness_session_update_meta",
        entity: "fitness_test_sessions",
        entity_id: input.session_id,
        capability: "manage_fitness",
      },
    );

    revalidateFitness(session.season_id);
    return { ok: true, sessionId: input.session_id, message: "Testmoment bijgewerkt." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Wijzigen mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}

export async function deleteFitnessDraftSessionAction(sessionId: string): Promise<FitnessProtocolActionResult> {
  try {
    const db = await readDb();
    const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, error: "Testmoment niet gevonden." };
    if (!canDeleteFitnessSession(session)) {
      return {
        ok: false,
        error: "Een gepubliceerd testmoment kan niet worden verwijderd. Kies Correctie openen of bewaar de data.",
      };
    }

    await mutateDb(
      (draft) => {
        const row = draft.fitness_test_sessions.find((s) => s.id === sessionId);
        if (!row) throw new Error("Testmoment niet gevonden.");
        if (!canDeleteFitnessSession(row)) {
          throw new Error("Alleen een concept zonder publicatie mag worden verwijderd.");
        }
        draft.fitness_test_results = draft.fitness_test_results.filter((r) => r.session_id !== sessionId);
        draft.fitness_test_sessions = draft.fitness_test_sessions.filter((s) => s.id !== sessionId);
      },
      {
        action: "fitness_session_delete_draft",
        entity: "fitness_test_sessions",
        entity_id: sessionId,
        capability: "manage_fitness",
      },
    );

    revalidateFitness(session.season_id);
    return { ok: true, sessionId, message: "Concept-testmoment verwijderd." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verwijderen mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
}
