"use server";

import { randomUUID } from "crypto";
import { fitnessSprintBatchSchema, fitnessSprintUpdateSchema } from "@/lib/validations/forms";
import { mutateDb } from "@/lib/data/mutate";
import { recomputeFitnessAnalyticsInDb } from "@/lib/fitness-analytics";
import { flattenZodIssues, normalizeMutationError, type AdminFormState } from "@/lib/forms/admin-action-state";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function recordedAtForTestOn(testOn: string): string {
  return `${testOn}T12:00:00.000Z`;
}

export async function saveFitnessBatchFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return { status: "error", error: "Formulier ongeldig. Vernieuw de pagina." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(rawPayload);
  } catch {
    return { status: "error", error: "Ongeldige formulierdata." };
  }
  const parsed = fitnessSprintBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Controleer de invoer.",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }

  const { season_id, test_on, rows } = parsed.data;

  try {
    await mutateDb(
      (db) => {
        for (const row of rows) {
          const member = db.player_season_memberships.some(
            (m) => m.player_id === row.player_id && m.season_id === season_id,
          );
          if (!member) throw new Error("Een of meer speelsters horen niet bij dit seizoen.");
        }
        db.fitness_tests = db.fitness_tests.filter((f) => !(f.season_id === season_id && f.test_on === test_on));
        const recorded = recordedAtForTestOn(test_on);
        for (const row of rows) {
          const s20 = round2(row.sprint_20m);
          const s40 = round2(row.sprint_40m);
          const s60 = round2(row.sprint_60m);
          db.fitness_tests.push({
            id: randomUUID(),
            season_id,
            player_id: row.player_id,
            test_type: "sprint_20_40_60",
            test_on,
            total_time: round2(s20 + s40 + s60),
            sprint_20m: s20,
            sprint_40m: s40,
            sprint_60m: s60,
            recorded_at: recorded,
            note: null,
            progress_status: null,
            progress_delta: null,
            session_rank: null,
          });
        }
        recomputeFitnessAnalyticsInDb(db, season_id);
      },
      { action: "fitness_sprint_batch", entity: "fitness_tests", entity_id: test_on },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: `Sprintmeting ${test_on} opgeslagen (${rows.length} speelsters).` };
}

export async function updateFitnessSprintFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return { status: "error", error: "Formulier ongeldig." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(rawPayload);
  } catch {
    return { status: "error", error: "Ongeldige formulierdata." };
  }
  const parsed = fitnessSprintUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Controleer de invoer.",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  const d = parsed.data;

  try {
    await mutateDb(
      (db) => {
        const f = db.fitness_tests.find((x) => x.id === d.id);
        if (!f) throw new Error("Meting niet gevonden.");
        const clash = db.fitness_tests.some(
          (x) =>
            x.id !== d.id &&
            x.season_id === f.season_id &&
            x.player_id === f.player_id &&
            x.test_on === d.test_on,
        );
        if (clash) throw new Error("Deze speelster heeft al een meting op die datum.");
        const seasonId = f.season_id;
        f.test_on = d.test_on;
        f.sprint_20m = round2(d.sprint_20m);
        f.sprint_40m = round2(d.sprint_40m);
        f.sprint_60m = round2(d.sprint_60m);
        f.total_time = round2(f.sprint_20m + f.sprint_40m + f.sprint_60m);
        f.recorded_at = recordedAtForTestOn(d.test_on);
        if (d.note !== undefined) f.note = d.note?.trim() ? d.note.trim() : null;
        recomputeFitnessAnalyticsInDb(db, seasonId);
      },
      { action: "fitness_sprint_update", entity: "fitness_test", entity_id: d.id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bijwerken mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Meting bijgewerkt." };
}

export async function deleteFitnessTestFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", error: "Geen meting geselecteerd." };
  try {
    await mutateDb(
      (db) => {
        const found = db.fitness_tests.find((f) => f.id === id);
        const n = db.fitness_tests.length;
        db.fitness_tests = db.fitness_tests.filter((f) => f.id !== id);
        if (db.fitness_tests.length === n) throw new Error("Meting niet gevonden.");
        if (found) recomputeFitnessAnalyticsInDb(db, found.season_id);
      },
      { action: "fitness_test_delete", entity: "fitness_test", entity_id: id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verwijderen mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Meting verwijderd." };
}
