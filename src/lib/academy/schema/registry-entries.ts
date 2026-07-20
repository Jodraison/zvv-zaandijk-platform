/**
 * Registry entity Zod schemas — academy-content-schema definitions.
 * Ref fields are ID strings here; cross-registry existence checks are T-03-02.
 */
import { z } from "zod";
import {
  anchorIdSchema,
  cueIdSchema,
  exerciseIdSchema,
  momentIdSchema,
  playbookIdSchema,
  positionIdSchema,
  problemIdSchema,
  situationIdSchema,
  slugSchema,
  tagIdSchema,
  visualIdSchema,
} from "@/lib/academy/schema/ids";
import { defaultContentLayerSchema } from "@/lib/academy/schema/layers";

/** YAML may parse bare numbers (e.g. 4231) inside search_terms — coerce to string. */
export const searchTermSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

export const aceModuleSchema = z.enum(["O0", "L", "S1", "S2", "S3", "S4", "S5", "S6", "PERSONAL"]);

export const contentStatusSchema = z.enum(["draft", "published", "deprecated"]);
export const sidecarStatusSchema = z.enum(["pending", "in_progress", "complete"]);
export const playbookTypeSchema = z.enum(["tactical", "foundation", "personal_compilation"]);
export const difficultySchema = z.enum(["foundation", "intermediate", "advanced", "flagship"]);
export const extractPathSchema = z.enum(["manual", "semi_auto", "auto"]);

export const playbookRegistryEntrySchema = z.object({
  id: playbookIdSchema,
  number: z.number().int().min(1),
  slug: slugSchema,
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  phase_code: z.string().min(1),
  ace_module: aceModuleSchema,
  moment_id: momentIdSchema.nullable().optional(),
  module: z.number().int().default(2),
  objective: z.string().nullable().optional(),
  content_path: z.string().min(1).nullable(),
  content_status: contentStatusSchema,
  sidecar_status: sidecarStatusSchema,
  sidecar_path: z.string().nullable().optional(),
  type: playbookTypeSchema.default("tactical"),
  flagship: z.boolean().default(false),
  anchor_playbook: z.boolean().default(false),
  difficulty: difficultySchema.optional(),
  prerequisites: z.array(playbookIdSchema).default([]),
  follows_with: playbookIdSchema.nullable().optional(),
  related_playbooks: z.array(playbookIdSchema).default([]),
  situation_refs: z.array(situationIdSchema).default([]),
  problem_refs: z.array(problemIdSchema).default([]),
  position_refs: z.array(positionIdSchema).default([]),
  visual_primary_ref: visualIdSchema.nullable().optional(),
  visual_refs: z.array(visualIdSchema).default([]),
  exercise_ref: exerciseIdSchema.nullable().optional(),
  tags: z.array(tagIdSchema).default([]),
  search_terms: z.array(searchTermSchema).default([]),
  curriculum_week: z.number().int().min(1).nullable().optional(),
  retrofit_wave: z.number().int().min(0).nullable().optional(),
  extract_path: extractPathSchema.optional(),
  trainer_points: z.array(z.string()).nullable().optional(),
  captain_points: z.array(z.string()).nullable().optional(),
});

export const situationStatusSchema = z.enum(["core", "extended"]);

export const situationRegistryEntrySchema = z.object({
  id: situationIdSchema,
  slug: slugSchema,
  label_nl: z.string().min(1),
  label_player: z.string().nullable().optional(),
  moment_id: momentIdSchema.nullable(),
  parent_situation_id: situationIdSchema.nullable().optional(),
  status: situationStatusSchema,
  pb_refs: z.array(playbookIdSchema).default([]),
  problem_refs: z.array(problemIdSchema).default([]),
  tag_refs: z.array(tagIdSchema).default([]),
  visual_primary_ref: visualIdSchema.nullable().optional(),
  search_terms: z.array(searchTermSchema).default([]),
  sort_order: z.number().int().optional(),
});

export const problemStatusSchema = z.enum(["core", "extended", "mvp"]);

export const problemRegistryEntrySchema = z.object({
  id: problemIdSchema,
  slug: slugSchema,
  label_player: z.string().min(1),
  label_short: z.string().nullable().optional(),
  status: problemStatusSchema,
  mvp_priority: z.number().int().min(1).nullable().optional(),
  situation_refs: z.array(situationIdSchema).default([]),
  pb_refs: z.array(playbookIdSchema).default([]),
  tag_refs: z.array(tagIdSchema).default([]),
  default_layer: defaultContentLayerSchema.default("L2"),
  search_terms: z.array(searchTermSchema).default([]),
  sort_order: z.number().int().optional(),
});

export const positionLineSchema = z.enum(["keeper", "defence", "midfield", "attack"]);

export const positieDashboardWidgetSchema = z.enum([
  "vandaag",
  "quick_actions",
  "positie_ankers",
  "apply_checklist",
  "leerpunt",
  "deze_week",
  "situatie_shortcuts",
]);

export const positieAnkerTaskSchema = z.object({
  label: z.string().min(1),
  pb_ref: playbookIdSchema,
});

export const positieAnkerSchema = z.object({
  id: anchorIdSchema,
  position_id: positionIdSchema,
  tasks: z.array(positieAnkerTaskSchema).length(3),
});

export const positionRegistryEntrySchema = z.object({
  id: positionIdSchema,
  slug: slugSchema,
  name_nl: z.string().min(1),
  abbrev: z.string().min(1).max(3),
  line: positionLineSchema,
  sort_order: z.number().int().optional(),
  dashboard_route: z.string().default("/positie"),
  anchor_ref: anchorIdSchema.optional(),
  default_widgets: z.array(positieDashboardWidgetSchema).optional(),
  core_pb_refs: z.array(playbookIdSchema).default([]),
  situatie_shortcuts: z.array(situationIdSchema).optional(),
});

export const tagCategorySchema = z.enum([
  "phase",
  "tactical",
  "mental",
  "communication",
  "set_piece",
  "match_management",
  "coaching",
]);

export const tagRegistryEntrySchema = z.object({
  id: tagIdSchema,
  slug: slugSchema,
  label_nl: z.string().min(1),
  category: tagCategorySchema,
  description: z.string().optional(),
  mutually_exclusive_with: z.array(tagIdSchema).default([]),
  parent_tag: tagIdSchema.optional(),
});

export const visualTypeSchema = z.enum([
  "animation",
  "static",
  "split_screen",
  "template",
  "platform",
]);
export const visualStatusSchema = z.enum(["spec_only", "brief_ready", "rendered"]);

export const visualRegistryEntrySchema = z.object({
  id: visualIdSchema,
  slug: slugSchema,
  title: z.string().min(1),
  pb_ref: playbookIdSchema.nullable().optional(),
  type: visualTypeSchema.optional(),
  anchor: z.boolean().default(false),
  anchor_priority: z.number().int().nullable().optional(),
  highlight_positions: z.array(positionIdSchema).default([]),
  status: visualStatusSchema,
  spec_ref: z.string().nullable().optional(),
  search_terms: z.array(searchTermSchema).default([]),
});

export const cueRegistryEntrySchema = z.object({
  id: cueIdSchema,
  slug: slugSchema,
  text: z.string().min(1).max(40),
  pb_ref: playbookIdSchema.nullable().optional(),
  layer: z.enum(["L2", "L3"]).default("L2"),
});

export const exerciseSchema = z.object({
  id: exerciseIdSchema,
  pb_ref: playbookIdSchema,
  label: z.string().nullable().optional(),
  duration_min: z.number().int().nullable().optional(),
  optional: z.boolean().default(true),
});

export const acePhaseSchema = z.enum(["S1", "S2", "S3", "S4", "S5", "S6"]);

export const momentSchema = z.object({
  id: momentIdSchema,
  slug: slugSchema,
  label_nl: z.string().min(1),
  ace: acePhaseSchema,
  anchor_pb: playbookIdSchema,
  pb_range: z.array(playbookIdSchema).default([]),
  sort_order: z.number().int().optional(),
  sub_nav: z.array(z.string()).optional(),
});

export type PlaybookRegistryEntry = z.infer<typeof playbookRegistryEntrySchema>;
export type SituationRegistryEntry = z.infer<typeof situationRegistryEntrySchema>;
export type ProblemRegistryEntry = z.infer<typeof problemRegistryEntrySchema>;
export type PositionRegistryEntry = z.infer<typeof positionRegistryEntrySchema>;
export type PositieAnker = z.infer<typeof positieAnkerSchema>;
export type TagRegistryEntry = z.infer<typeof tagRegistryEntrySchema>;
export type VisualRegistryEntry = z.infer<typeof visualRegistryEntrySchema>;
export type CueRegistryEntry = z.infer<typeof cueRegistryEntrySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Moment = z.infer<typeof momentSchema>;
