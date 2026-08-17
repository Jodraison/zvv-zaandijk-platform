import { z } from "zod";

export const matchLineupRoleSchema = z.enum(["starter", "bench", "absent"]);

export const matchLineupEntryInputSchema = z.object({
  player_id: z.string().min(1),
  role: matchLineupRoleSchema,
  position: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => {
      const t = (s ?? "").toString().trim();
      return t || null;
    })
    .pipe(z.string().max(80).nullable()),
  absence_reason: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => {
      const t = (s ?? "").toString().trim();
      return t || null;
    })
    .pipe(z.string().max(200).nullable()),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
});

export const matchLineupPayloadSchema = z.array(matchLineupEntryInputSchema).default([]);

export type MatchLineupEntryInput = z.infer<typeof matchLineupEntryInputSchema>;
export type MatchLineupPayload = z.infer<typeof matchLineupPayloadSchema>;
