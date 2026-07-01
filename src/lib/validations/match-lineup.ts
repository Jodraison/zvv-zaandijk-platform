import { z } from "zod";

export const matchLineupRoleSchema = z.enum(["starter", "bench", "absent"]);

export const matchLineupEntryInputSchema = z.object({
  player_id: z.string().min(1),
  role: matchLineupRoleSchema,
  position: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((s) => {
      const t = (s ?? "").trim();
      return t || null;
    }),
  absence_reason: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((s) => {
      const t = (s ?? "").trim();
      return t || null;
    }),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
});

export const matchLineupPayloadSchema = z.array(matchLineupEntryInputSchema).default([]);

export type MatchLineupEntryInput = z.infer<typeof matchLineupEntryInputSchema>;
export type MatchLineupPayload = z.infer<typeof matchLineupPayloadSchema>;
