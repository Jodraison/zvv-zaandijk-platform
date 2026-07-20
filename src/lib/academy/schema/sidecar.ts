/**
 * Sidecar Zod schema — academy-content-schema sidecar block + template shape.
 * L5 must never appear in sidecar (validation rule).
 */
import { z } from "zod";
import {
  momentIdSchema,
  positionSlugSchema,
  problemIdSchema,
  situationIdSchema,
  slugSchema,
  tagIdSchema,
  visualIdSchema,
} from "@/lib/academy/schema/ids";
import { completenessStatusSchema } from "@/lib/academy/schema/layers";

const l2ActionsSchema = z.array(z.string()).max(4);

const l3ApplySchema = z.object({
  checklist: z.array(z.string()).max(3),
  cue: z.string(),
});

const l4RememberSchema = z.object({
  fouten: z.array(z.string()).max(3),
  afspraken: z.array(z.string()).max(3),
  gedragingen: z.array(z.string()).max(3),
});

export const sidecarL0Schema = z.object({
  shared: z.string(),
  by_position: z.record(z.string(), z.string()).default({}),
});

export const sidecarL2Schema = z.record(positionSlugSchema, l2ActionsSchema);

export const sidecarL3Schema = z.record(positionSlugSchema, l3ApplySchema);

export const sidecarL4Schema = z.record(positionSlugSchema, l4RememberSchema);

export const sidecarLayersSchema = z
  .object({
    L0: sidecarL0Schema,
    L2: sidecarL2Schema,
    L3: sidecarL3Schema,
    L4: sidecarL4Schema,
  })
  .strict()
  .superRefine((layers, ctx) => {
    const banned = Object.keys(layers as Record<string, unknown>).filter((k) => k === "L5");
    if (banned.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L5 must never appear in sidecar",
        path: ["L5"],
      });
    }
  });

export const sidecarCompletenessSchema = z
  .object({
    L0: completenessStatusSchema.optional(),
    L2: completenessStatusSchema.optional(),
    L3: completenessStatusSchema.optional(),
    L4: completenessStatusSchema.optional(),
  })
  .strict();

export const playbookSidecarSchema = z
  .object({
    schema_version: z.literal("1.1.0"),
    architecture_ref: z.string().optional(),
    pb: z.number().int().min(1),
    slug: slugSchema,
    moment_ids: z.array(momentIdSchema).min(1),
    situation_ids: z.array(situationIdSchema).default([]),
    problem_ids: z.array(problemIdSchema).default([]),
    visual_primary: visualIdSchema.nullable().optional(),
    visual_refs: z.array(visualIdSchema).default([]),
    tags: z.array(tagIdSchema).default([]),
    search_terms: z.array(z.string()).default([]),
    exercise: z.string().nullable().optional(),
    trainer_points: z.array(z.string()).max(3).default([]),
    captain_points: z.array(z.string()).max(5).default([]),
    layers: sidecarLayersSchema,
    completeness: sidecarCompletenessSchema.optional(),
  })
  .strict();

export type PlaybookSidecar = z.infer<typeof playbookSidecarSchema>;

/** Fail-fast parse helpers. */
export function parsePlaybookSidecar(data: unknown): PlaybookSidecar {
  return playbookSidecarSchema.parse(data);
}

export function safeParsePlaybookSidecar(data: unknown) {
  return playbookSidecarSchema.safeParse(data);
}
