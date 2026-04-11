"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { mutateDb } from "@/lib/data/mutate";
import { normalizeMutationError, type AdminFormState, flattenZodIssues } from "@/lib/forms/admin-action-state";

const addGuestSchema = z.object({
  match_id: z.string().min(1),
  season_id: z.string().min(1),
  full_name: z.string().trim().min(1, "Naam is verplicht"),
  position: z
    .string()
    .optional()
    .transform((s) => {
      const t = (s ?? "").trim();
      if (!t) return undefined;
      if (t === "GK" || t === "DEF" || t === "MID" || t === "ATT") return t;
      return undefined;
    }),
  position_label: z.string().trim().max(120).optional().or(z.literal("")),
  shirt_number: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).trim());
      if (!Number.isFinite(n) || n < 1 || n > 99) return null;
      return Math.floor(n);
    }),
});

const addRosterPlayerSchema = z.object({
  match_id: z.string().min(1),
  season_id: z.string().min(1),
  player_id: z.string().min(1),
  shirt_number: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).trim());
      if (!Number.isFinite(n) || n < 1 || n > 99) return null;
      return Math.floor(n);
    }),
  position_label: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function addMatchGuestFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const raw = {
    match_id: formData.get("match_id"),
    season_id: formData.get("season_id"),
    full_name: formData.get("full_name"),
    position: formData.get("position") || undefined,
    position_label: formData.get("position_label") || "",
    shirt_number: formData.get("shirt_number") || "",
  };
  const parsed = addGuestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }

  let newPlayerId = "";
  try {
    await mutateDb(
      (db) => {
        const match = db.matches.find((m) => m.id === parsed.data.match_id);
        if (!match) throw new Error("Wedstrijd niet gevonden.");
        if (match.season_id !== parsed.data.season_id) {
          throw new Error("Wedstrijd hoort niet bij dit seizoen.");
        }
        const id = randomUUID();
        newPlayerId = id;
        const posLabel =
          parsed.data.position_label?.trim() ||
          (parsed.data.position ? `Linie ${parsed.data.position}` : null);
        db.players.push({
          id,
          full_name: parsed.data.full_name.trim(),
          photo_url: null,
          is_guest: true,
        });
        db.match_matchday_roster.push({
          match_id: parsed.data.match_id,
          player_id: id,
          match_shirt_number: parsed.data.shirt_number,
          position_label: posLabel && posLabel.length > 0 ? posLabel : null,
        });
      },
      { action: "match_guest_add", entity: "player", entity_id: () => newPlayerId || null },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Gast-speelster toegevoegd aan deze wedstrijd." };
}

export async function addMatchGuestAction(raw: {
  match_id: string;
  season_id: string;
  full_name: string;
  position?: string;
  position_label?: string;
  shirt_number?: string | number;
}): Promise<AdminFormState> {
  const formData = new FormData();
  formData.set("match_id", raw.match_id ?? "");
  formData.set("season_id", raw.season_id ?? "");
  formData.set("full_name", raw.full_name ?? "");
  formData.set("position", raw.position ?? "");
  formData.set("position_label", raw.position_label ?? "");
  formData.set("shirt_number", raw.shirt_number === undefined ? "" : String(raw.shirt_number));
  return addMatchGuestFormAction({ status: "idle" }, formData);
}

export async function addMatchRosterPlayerAction(raw: {
  match_id: string;
  season_id: string;
  player_id: string;
  shirt_number?: string | number;
  position_label?: string;
}): Promise<AdminFormState> {
  const parsed = addRosterPlayerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  try {
    await mutateDb(
      (db) => {
        const match = db.matches.find((m) => m.id === parsed.data.match_id);
        if (!match) throw new Error("Wedstrijd niet gevonden.");
        if (match.season_id !== parsed.data.season_id) throw new Error("Wedstrijd hoort niet bij dit seizoen.");
        const player = db.players.find((p) => p.id === parsed.data.player_id);
        if (!player) throw new Error("Speler niet gevonden.");
        const exists = db.match_matchday_roster.some(
          (r) => r.match_id === parsed.data.match_id && r.player_id === parsed.data.player_id,
        );
        if (exists) return;
        db.match_matchday_roster.push({
          match_id: parsed.data.match_id,
          player_id: parsed.data.player_id,
          match_shirt_number: parsed.data.shirt_number,
          position_label: parsed.data.position_label?.trim() || null,
        });
      },
      { action: "match_roster_add_player", entity: "player", entity_id: parsed.data.player_id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Toevoegen mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Speelster toegevoegd aan deze wedstrijdselectie." };
}

export async function removeMatchGuestFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const matchId = String(formData.get("match_id") ?? "").trim();
  const playerId = String(formData.get("player_id") ?? "").trim();
  if (!matchId || !playerId) {
    return { status: "error", error: "Ontbrekende gegevens." };
  }
  try {
    await mutateDb(
      (db) => {
        const pl = db.players.find((p) => p.id === playerId);
        if (!pl?.is_guest) throw new Error("Alleen gast-speelsters kunnen hier worden verwijderd.");
        const onRoster = db.match_matchday_roster.some((r) => r.match_id === matchId && r.player_id === playerId);
        if (!onRoster) throw new Error("Deze speelster staat niet op de gastenlijst van deze wedstrijd.");

        db.match_matchday_roster = db.match_matchday_roster.filter((r) => !(r.match_id === matchId && r.player_id === playerId));
        db.match_player_stats = db.match_player_stats.filter((s) => !(s.match_id === matchId && s.player_id === playerId));
        db.match_goal_events = db.match_goal_events.filter(
          (e) =>
            !(
              e.match_id === matchId &&
              (e.scorer_player_id === playerId || e.assist_player_id === playerId)
            ),
        );
        db.matches.forEach((m) => {
          if (m.id === matchId && m.wotm_player_id === playerId) m.wotm_player_id = null;
        });

        const anyRoster = db.match_matchday_roster.some((r) => r.player_id === playerId);
        const anyStats = db.match_player_stats.some((s) => s.player_id === playerId);
        const anyGoals = db.match_goal_events.some((e) => e.scorer_player_id === playerId || e.assist_player_id === playerId);
        if (!anyRoster && !anyStats && !anyGoals) {
          db.players = db.players.filter((p) => p.id !== playerId);
        }
      },
      { action: "match_guest_remove", entity: "player", entity_id: playerId },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verwijderen mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Gast verwijderd van deze wedstrijd." };
}

export async function removeMatchGuestAction(raw: {
  match_id: string;
  player_id: string;
}): Promise<AdminFormState> {
  const formData = new FormData();
  formData.set("match_id", raw.match_id ?? "");
  formData.set("player_id", raw.player_id ?? "");
  return removeMatchGuestFormAction({ status: "idle" }, formData);
}
