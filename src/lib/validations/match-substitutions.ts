import { z } from "zod";
import { matchMinuteSchema } from "@/lib/validations/match-events";

export const matchSubstitutionInputSchema = z.object({
  player_in_id: z.string().min(1, "Kies speelster erin"),
  player_out_id: z.string().min(1, "Kies speelster eruit"),
  minute: matchMinuteSchema,
});

export const matchSubstitutionsPayloadSchema = z.array(matchSubstitutionInputSchema).default([]);

export type MatchSubstitutionInput = z.infer<typeof matchSubstitutionInputSchema>;
