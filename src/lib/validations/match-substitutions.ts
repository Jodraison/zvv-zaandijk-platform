import { z } from "zod";
import { matchMinuteSchema } from "@/lib/validations/match-events";

export const matchSubstitutionInputSchema = z.object({
  player_in_id: z.string().min(1, "Kies speelster erin"),
  player_out_id: z.string().min(1, "Kies speelster eruit"),
  minute: matchMinuteSchema,
  to_slot: z.string().trim().max(16).optional().nullable(),
  stoppage_time: z.coerce.number().int().min(0).max(30).optional(),
  sort_order: z.coerce.number().int().min(0).max(99).optional(),
  change_group_id: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const matchSubstitutionsPayloadSchema = z.array(matchSubstitutionInputSchema).default([]);

export type MatchSubstitutionInput = z.infer<typeof matchSubstitutionInputSchema>;
