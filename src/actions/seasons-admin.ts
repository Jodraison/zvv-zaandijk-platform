"use server";

import { randomUUID } from "crypto";
import type { z } from "zod";
import { seasonSchema } from "@/lib/validations/forms";
import { mutateDb } from "@/lib/data/mutate";
import { flattenZodIssues, normalizeMutationError, type AdminFormState } from "@/lib/forms/admin-action-state";

function parseSeasonForm(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    starts_on: formData.get("starts_on"),
    ends_on: formData.get("ends_on"),
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  };
  return seasonSchema.safeParse(raw);
}

async function insertSeasonRow(data: z.infer<typeof seasonSchema>) {
  const id = randomUUID();
  await mutateDb(
    (db) => {
      if (data.is_active) db.seasons.forEach((s) => { s.is_active = false; });
      db.seasons.push({
        id,
        name: data.name,
        starts_on: data.starts_on,
        ends_on: data.ends_on,
        is_active: !!data.is_active,
      });
    },
    { action: "season_create", entity: "season", entity_id: id },
  );
}

export async function createSeason(formData: FormData): Promise<void> {
  const parsed = parseSeasonForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Controleer de seizoensvelden.");
  }
  await insertSeasonRow(parsed.data);
}

export async function setActiveSeason(seasonId: string): Promise<void> {
  await mutateDb(
    (db) => {
      db.seasons.forEach((s) => {
        s.is_active = s.id === seasonId;
      });
    },
    { action: "season_set_active", entity: "season", entity_id: seasonId },
  );
}

export async function setActiveSeasonFormAction(formData: FormData) {
  const id = String(formData.get("season_id") ?? "");
  if (!id) throw new Error("Geen seizoen geselecteerd.");
  await setActiveSeason(id);
}

export async function createSeasonFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = parseSeasonForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Controleer de seizoensvelden.",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  try {
    await insertSeasonRow(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seizoen kon niet worden aangemaakt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Seizoen aangemaakt." };
}

export async function setActiveSeasonFormStateAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await setActiveSeasonFormAction(formData);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Actief seizoen wijzigen mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Actief seizoen bijgewerkt." };
}
