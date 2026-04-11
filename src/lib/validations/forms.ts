import { z } from "zod";
import { isSafePlayerImageUrl } from "@/lib/media/safe-player-image-url";

export const playerPositionSchema = z.enum(["GK", "DEF", "MID", "ATT"]);

/** Alleen https Supabase-public of leeg; file:// e.d. worden leeg gemaakt (→ null bij save). */
export const optionalPlayerPhotoUrlSchema = z
  .union([z.string(), z.literal("")])
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim();
    if (!t) return "";
    return isSafePlayerImageUrl(t) ? t : "";
  });
export const matchStatusSchema = z.enum(["scheduled", "played", "postponed", "cancelled"]);
export const fitnessTestTypeSchema = z.literal("sprint_20_40_60");

const sprintSecondsField = z
  .string()
  .trim()
  .transform((s) => s.replace(",", "."))
  .refine((s) => /^\d+(\.\d{1,2})?$/.test(s), "Gebruik een positief getal met max. 2 decimalen")
  .transform((s) => Number(s))
  .refine((n) => Number.isFinite(n) && n > 0 && n < 999, "Ongeldige tijd");

export const fitnessSprintBatchRowSchema = z.object({
  player_id: z.string().min(1),
  sprint_20m: sprintSecondsField,
  sprint_40m: sprintSecondsField,
  sprint_60m: sprintSecondsField,
});

export const fitnessSprintBatchSchema = z.object({
  season_id: z.string().min(1),
  test_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Kies een geldige datum (YYYY-MM-DD)"),
  rows: z.array(fitnessSprintBatchRowSchema).min(1, "Geen rijen om op te slaan"),
});

export const fitnessSprintUpdateSchema = z.object({
  id: z.string().min(1),
  test_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sprint_20m: sprintSecondsField,
  sprint_40m: sprintSecondsField,
  sprint_60m: sprintSecondsField,
  note: z.string().optional(),
});

export const playerCreateSchema = z.object({
  full_name: z.string().trim().min(1, "Naam is verplicht"),
  shirt_number: z.coerce.number().int().min(1).max(99),
  position: playerPositionSchema,
  display_position: z.string().trim().min(1, "Positie-omschrijving is verplicht"),
  photo_url: optionalPlayerPhotoUrlSchema,
});

export const playerUpdateSchema = playerCreateSchema.extend({
  id: z.string().min(1),
});

export const seasonSchema = z.object({
  name: z.string().trim().min(1),
  starts_on: z.string().min(1),
  ends_on: z.string().min(1),
  is_active: z.coerce.boolean().optional(),
});

export const trainingSessionSchema = z
  .object({
    season_id: z.string().min(1),
    title: z.string().optional(),
    session_at: z.string().min(1, "Datum en tijd zijn verplicht"),
    location: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const t = data.title?.trim() ?? "";
    const loc = data.location?.trim() ?? "";
    if (!t && !loc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul een titel of locatie in voor de training.",
        path: ["title"],
      });
    }
  });

export const attendanceRowSchema = z.object({
  session_id: z.string(),
  player_id: z.string(),
  present: z.coerce.boolean(),
});

