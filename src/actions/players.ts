"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import {
  optionalPlayerPhotoUrlSchema,
  playerCreateSchema,
  playerPositionSchema,
  playerUpdateSchema,
} from "@/lib/validations/forms";
import { normalizePlayerPhotoUrlForStorage } from "@/lib/media/safe-player-image-url";
import { mutateDb } from "@/lib/data/mutate";
import { assertSeasonLeadershipValid } from "@/lib/season-leadership";
import { flattenZodIssues, normalizeMutationError, type AdminFormState } from "@/lib/forms/admin-action-state";

export type PlayerActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const membershipFlagsSchema = z.object({
  is_guest: z.coerce.boolean(),
  is_captain: z.coerce.boolean(),
  is_vice_captain: z.coerce.boolean(),
});

const playerProfileSchema = z.object({
  initials: z.string().trim().max(8).optional().or(z.literal("")),
  bio: z.string().trim().max(400).optional().or(z.literal("")),
  preferred_foot: z.string().trim().max(40).optional().or(z.literal("")),
  strengths: z.string().trim().max(200).optional().or(z.literal("")),
  role_label: z.string().trim().max(60).optional().or(z.literal("")),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  card_note: z.string().trim().max(160).optional().or(z.literal("")),
});

function toNull(v: string | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

function assertShirtAvailable(
  db: import("@/types").ClubDatabase,
  seasonId: string,
  shirt: number,
  exceptPlayerId?: string,
) {
  const taken = db.player_season_memberships.some(
    (m) => m.season_id === seasonId && m.shirt_number === shirt && m.player_id !== exceptPlayerId,
  );
  if (taken) throw new Error(`Rugnummer ${shirt} is al in gebruik in dit seizoen.`);
}

function applyCaptainFlags(
  db: import("@/types").ClubDatabase,
  seasonId: string,
  playerId: string,
  is_captain: boolean,
  is_vice_captain: boolean,
) {
  const pl = db.players.find((p) => p.id === playerId);
  if (pl?.is_guest && (is_captain || is_vice_captain)) {
    throw new Error("Een gast-speelster kan geen aanvoerder of assistent zijn.");
  }

  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) return;

  if (is_captain) {
    db.player_season_memberships.forEach((m) => {
      if (m.season_id === seasonId) m.is_captain = false;
    });
    mem.is_captain = true;
    mem.is_vice_captain = false;
  } else {
    mem.is_captain = false;
  }

  if (is_vice_captain) {
    db.player_season_memberships.forEach((m) => {
      if (m.season_id === seasonId) m.is_vice_captain = false;
    });
    mem.is_vice_captain = true;
    mem.is_captain = false;
  } else {
    mem.is_vice_captain = false;
  }
}

export async function createPlayer(formData: FormData): Promise<void> {
  const r = await createPlayerWithResult(formData);
  if (!r.ok) throw new Error(r.error);
}

export async function createPlayerWithResult(formData: FormData): Promise<PlayerActionResult> {
  const raw = {
    full_name: formData.get("full_name"),
    shirt_number: formData.get("shirt_number"),
    position: formData.get("position"),
    display_position: formData.get("display_position"),
    photo_url: formData.get("photo_url") || "",
  };
  const parsed = playerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  const profileParsed = playerProfileSchema.safeParse({
    initials: formData.get("initials") || "",
    bio: formData.get("bio") || "",
    preferred_foot: formData.get("preferred_foot") || "",
    strengths: formData.get("strengths") || "",
    role_label: formData.get("role_label") || "",
    tagline: formData.get("tagline") || "",
    card_note: formData.get("card_note") || "",
  });
  if (!profileParsed.success) {
    return {
      ok: false,
      error: profileParsed.error.issues[0]?.message ?? "Ongeldig profielveld",
      fieldErrors: flattenZodIssues(profileParsed.error),
    };
  }

  const flags = membershipFlagsSchema.safeParse({
    is_guest: false,
    is_captain: formData.get("is_captain") === "on" || formData.get("is_captain") === "true",
    is_vice_captain: formData.get("is_vice_captain") === "on" || formData.get("is_vice_captain") === "true",
  });
  if (!flags.success) return { ok: false, error: "Ongeldige vlaggen" };
  if (flags.data.is_captain && flags.data.is_vice_captain) {
    return { ok: false, error: "Eén persoon kan niet tegelijk aanvoerder en assistent zijn." };
  }

  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) return { ok: false, error: "Geen seizoen geselecteerd." };

  try {
    let newId = "";
    await mutateDb(
      (db) => {
        assertShirtAvailable(db, seasonId, parsed.data.shirt_number);
        const id = randomUUID();
        newId = id;
        db.players.push({
          id,
          full_name: parsed.data.full_name,
          photo_url: normalizePlayerPhotoUrlForStorage(parsed.data.photo_url || undefined),
          is_guest: false,
          initials: toNull(profileParsed.data.initials),
          bio: toNull(profileParsed.data.bio),
          preferred_foot: toNull(profileParsed.data.preferred_foot),
          strengths: toNull(profileParsed.data.strengths),
          role_label: toNull(profileParsed.data.role_label),
          tagline: toNull(profileParsed.data.tagline),
          card_note: toNull(profileParsed.data.card_note),
        });
        db.player_season_memberships.push({
          id: randomUUID(),
          player_id: id,
          season_id: seasonId,
          shirt_number: parsed.data.shirt_number,
          position: parsed.data.position,
          display_position: parsed.data.display_position,
          is_captain: false,
          is_vice_captain: false,
          is_guest: false,
        });
        applyCaptainFlags(db, seasonId, id, flags.data.is_captain, flags.data.is_vice_captain);
        assertSeasonLeadershipValid(db, seasonId);
      },
      { action: "player_create", entity: "player", entity_id: () => newId || null },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
  return { ok: true };
}

const guestCreateSchema = z.object({
  full_name: z.string().trim().min(1, "Naam is verplicht"),
  photo_url: optionalPlayerPhotoUrlSchema,
  season_id: z.string().min(1),
  add_to_season: z.coerce.boolean().optional().default(false),
  shirt_number: z.coerce.number().int().min(1).max(99).optional(),
  position: playerPositionSchema.optional(),
  display_position: z.string().trim().optional().or(z.literal("")),
});

export async function createGuestPlayerWithResult(formData: FormData): Promise<PlayerActionResult> {
  const parsed = guestCreateSchema.safeParse({
    full_name: formData.get("full_name"),
    photo_url: formData.get("photo_url") || "",
    season_id: formData.get("season_id"),
    add_to_season: formData.get("add_to_season") === "on" || formData.get("add_to_season") === "true",
    shirt_number: formData.get("shirt_number") || undefined,
    position: formData.get("position") || undefined,
    display_position: formData.get("display_position") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer", fieldErrors: flattenZodIssues(parsed.error) };
  }
  const profileParsed = playerProfileSchema.safeParse({
    initials: formData.get("initials") || "",
    bio: formData.get("bio") || "",
    preferred_foot: formData.get("preferred_foot") || "",
    strengths: formData.get("strengths") || "",
    role_label: formData.get("role_label") || "",
    tagline: formData.get("tagline") || "",
    card_note: formData.get("card_note") || "",
  });
  if (!profileParsed.success) return { ok: false, error: "Ongeldige profielvelden", fieldErrors: flattenZodIssues(profileParsed.error) };

  try {
    let newId = "";
    await mutateDb((db) => {
      const id = randomUUID();
      newId = id;
      db.players.push({
        id,
        full_name: parsed.data.full_name,
        photo_url: normalizePlayerPhotoUrlForStorage(parsed.data.photo_url || undefined),
        is_guest: true,
        initials: toNull(profileParsed.data.initials),
        bio: toNull(profileParsed.data.bio),
        preferred_foot: toNull(profileParsed.data.preferred_foot),
        strengths: toNull(profileParsed.data.strengths),
        role_label: toNull(profileParsed.data.role_label),
        tagline: toNull(profileParsed.data.tagline),
        card_note: toNull(profileParsed.data.card_note),
      });
      if (parsed.data.add_to_season) {
        if (!parsed.data.shirt_number || !parsed.data.position || !parsed.data.display_position?.trim()) {
          throw new Error("Voor seizoenskoppeling zijn rugnummer, positie en display positie verplicht.");
        }
        assertShirtAvailable(db, parsed.data.season_id, parsed.data.shirt_number);
        db.player_season_memberships.push({
          id: randomUUID(),
          player_id: id,
          season_id: parsed.data.season_id,
          shirt_number: parsed.data.shirt_number,
          position: parsed.data.position,
          display_position: parsed.data.display_position.trim(),
          is_captain: false,
          is_vice_captain: false,
          is_guest: true,
        });
      }
    }, { action: "player_guest_create", entity: "player", entity_id: () => newId || null });
  } catch (e) {
    return { ok: false, error: normalizeMutationError(e instanceof Error ? e.message : "Opslaan mislukt.") };
  }
  return { ok: true };
}

export async function updatePlayer(formData: FormData): Promise<void> {
  const r = await updatePlayerWithResult(formData);
  if (!r.ok) throw new Error(r.error);
}

export async function updatePlayerWithResult(formData: FormData): Promise<PlayerActionResult> {
  const raw = {
    id: formData.get("id"),
    full_name: formData.get("full_name"),
    shirt_number: formData.get("shirt_number"),
    position: formData.get("position"),
    display_position: formData.get("display_position"),
    photo_url: formData.get("photo_url") || "",
  };
  const parsed = playerUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  const profileParsed = playerProfileSchema.safeParse({
    initials: formData.get("initials") || "",
    bio: formData.get("bio") || "",
    preferred_foot: formData.get("preferred_foot") || "",
    strengths: formData.get("strengths") || "",
    role_label: formData.get("role_label") || "",
    tagline: formData.get("tagline") || "",
    card_note: formData.get("card_note") || "",
  });
  if (!profileParsed.success) {
    return { ok: false, error: profileParsed.error.issues[0]?.message ?? "Ongeldig profielveld", fieldErrors: flattenZodIssues(profileParsed.error) };
  }

  const flags = membershipFlagsSchema.safeParse({
    is_guest: false,
    is_captain: formData.get("is_captain") === "on" || formData.get("is_captain") === "true",
    is_vice_captain: formData.get("is_vice_captain") === "on" || formData.get("is_vice_captain") === "true",
  });
  if (!flags.success) return { ok: false, error: "Ongeldige vlaggen" };
  if (flags.data.is_captain && flags.data.is_vice_captain) {
    return { ok: false, error: "Eén persoon kan niet tegelijk aanvoerder en assistent zijn." };
  }

  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) return { ok: false, error: "Geen seizoen." };

  try {
    await mutateDb(
      (db) => {
        assertShirtAvailable(db, seasonId, parsed.data.shirt_number, parsed.data.id);
        const pl = db.players.find((p) => p.id === parsed.data.id);
        if (!pl) throw new Error("Speelster niet gevonden.");
        pl.full_name = parsed.data.full_name;
        pl.photo_url = normalizePlayerPhotoUrlForStorage(parsed.data.photo_url || undefined);
        pl.initials = toNull(profileParsed.data.initials);
        pl.bio = toNull(profileParsed.data.bio);
        pl.preferred_foot = toNull(profileParsed.data.preferred_foot);
        pl.strengths = toNull(profileParsed.data.strengths);
        pl.role_label = toNull(profileParsed.data.role_label);
        pl.tagline = toNull(profileParsed.data.tagline);
        pl.card_note = toNull(profileParsed.data.card_note);

        const mem = db.player_season_memberships.find((m) => m.player_id === parsed.data.id && m.season_id === seasonId);
        if (!mem) throw new Error("Geen lidmaatschap voor dit seizoen.");
        mem.shirt_number = parsed.data.shirt_number;
        mem.position = parsed.data.position;
        mem.display_position = parsed.data.display_position;
        mem.is_guest = false;

        applyCaptainFlags(db, seasonId, parsed.data.id, flags.data.is_captain, flags.data.is_vice_captain);
        assertSeasonLeadershipValid(db, seasonId);
      },
      { action: "player_update", entity: "player", entity_id: parsed.data.id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
  return { ok: true };
}

export async function deletePlayer(playerId: string, seasonId: string): Promise<void> {
  await mutateDb(
    (db) => {
      db.player_season_memberships = db.player_season_memberships.filter(
        (m) => !(m.player_id === playerId && m.season_id === seasonId),
      );
      const stillMember = db.player_season_memberships.some((m) => m.player_id === playerId);
      if (!stillMember) {
        db.match_matchday_roster = db.match_matchday_roster.filter((r) => r.player_id !== playerId);
        db.players = db.players.filter((p) => p.id !== playerId);
        db.match_player_stats = db.match_player_stats.filter((s) => s.player_id !== playerId);
        db.match_goal_events = db.match_goal_events.filter(
          (e) => e.scorer_player_id !== playerId && e.assist_player_id !== playerId,
        );
        db.training_attendance = db.training_attendance.filter((a) => a.player_id !== playerId);
        db.fitness_tests = db.fitness_tests.filter((f) => f.player_id !== playerId);
        db.matches.forEach((m) => {
          if (m.wotm_player_id === playerId) m.wotm_player_id = null;
        });
      }
      assertSeasonLeadershipValid(db, seasonId);
    },
    { action: "player_delete", entity: "player", entity_id: playerId },
  );
}

const addToSeasonSchema = z.object({
  player_id: z.string().min(1),
  season_id: z.string().min(1),
  shirt_number: z.coerce.number().int().min(1).max(99),
  position: playerPositionSchema,
  display_position: z.string().trim().min(1, "Positie-omschrijving is verplicht"),
});

/** Bestaande club-speelster aan een seizoen koppelen (bijv. nieuw seizoen). */
export async function addPlayerToSeasonWithResult(formData: FormData): Promise<PlayerActionResult> {
  const raw = {
    player_id: formData.get("player_id"),
    season_id: formData.get("season_id"),
    shirt_number: formData.get("shirt_number"),
    position: formData.get("position"),
    display_position: formData.get("display_position"),
  };
  const parsed = addToSeasonSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }

  try {
    await mutateDb(
      (db) => {
        if (!db.players.some((p) => p.id === parsed.data.player_id)) throw new Error("Speelster bestaat niet.");
        if (db.player_season_memberships.some((m) => m.player_id === parsed.data.player_id && m.season_id === parsed.data.season_id)) {
          throw new Error("Deze speelster zit al in dit seizoen.");
        }
        assertShirtAvailable(db, parsed.data.season_id, parsed.data.shirt_number);
        const clubPl = db.players.find((p) => p.id === parsed.data.player_id);
        if (clubPl?.is_guest) {
          throw new Error("Een gast-speelster hoort niet aan het vaste seizoen te worden gekoppeld.");
        }
        db.player_season_memberships.push({
          id: randomUUID(),
          player_id: parsed.data.player_id,
          season_id: parsed.data.season_id,
          shirt_number: parsed.data.shirt_number,
          position: parsed.data.position,
          display_position: parsed.data.display_position,
          is_captain: false,
          is_vice_captain: false,
          is_guest: false,
        });
        assertSeasonLeadershipValid(db, parsed.data.season_id);
      },
      { action: "player_add_to_season", entity: "player_season_membership", entity_id: parsed.data.player_id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Opslaan mislukt.";
    return { ok: false, error: normalizeMutationError(msg) };
  }
  return { ok: true };
}

export async function createPlayerFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const r = await createPlayerWithResult(formData);
  if (!r.ok) {
    return { status: "error", error: r.error, fieldErrors: r.fieldErrors };
  }
  return {
    status: "success",
    message: "Speelster toegevoegd. Je kunt hieronder direct de volgende invoeren.",
  };
}

export async function updatePlayerFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const r = await updatePlayerWithResult(formData);
  if (!r.ok) {
    return { status: "error", error: r.error, fieldErrors: r.fieldErrors };
  }
  return { status: "success", message: "Wijzigingen opgeslagen." };
}

export async function addPlayerToSeasonFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const r = await addPlayerToSeasonWithResult(formData);
  if (!r.ok) {
    return { status: "error", error: r.error, fieldErrors: r.fieldErrors };
  }
  return { status: "success", message: "Speelster gekoppeld aan dit seizoen." };
}

export async function createGuestPlayerFormAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const r = await createGuestPlayerWithResult(formData);
  if (!r.ok) return { status: "error", error: r.error, fieldErrors: r.fieldErrors };
  return { status: "success", message: "Gast-speelster opgeslagen." };
}
