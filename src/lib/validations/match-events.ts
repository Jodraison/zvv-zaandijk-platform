import { z } from "zod";

export const matchMinuteSchema = z.coerce
  .number()
  .int("Minuut moet een geheel getal zijn")
  .min(0, "Minuut moet tussen 0 en 130 liggen")
  .max(130, "Minuut moet tussen 0 en 130 liggen");

export const matchCardTypeSchema = z.enum(["yellow", "red"]);

export const matchCardEventInputSchema = z.object({
  player_id: z.string().min(1, "Kies een speelster"),
  card_type: matchCardTypeSchema,
  minute: matchMinuteSchema,
});

export const matchCardEventsPayloadSchema = z.array(matchCardEventInputSchema).default([]);

export type MatchCardEventInput = z.infer<typeof matchCardEventInputSchema>;
