/**
 * Layer aliases and enums from academy-content-schema v1.1.0.
 */
import { z } from "zod";

export const layerIdSchema = z.enum(["L0", "L1", "L2", "L3", "L4", "L5"]);

export const layerAliasSchema = z.enum([
  "trigger",
  "visual",
  "twenty_seconds",
  "apply",
  "two_minutes",
  "full",
]);

/** Canonical mapping — UI aliases → layer IDs (frozen). */
export const LAYER_ALIASES = {
  trigger: "L0",
  visual: "L1",
  twenty_seconds: "L2",
  apply: "L3",
  two_minutes: "L4",
  full: "L5",
} as const satisfies Record<z.infer<typeof layerAliasSchema>, z.infer<typeof layerIdSchema>>;

export const defaultContentLayerSchema = z.enum(["L2", "L4"]);

export const completenessStatusSchema = z.enum(["empty", "draft", "approved"]);

export type LayerId = z.infer<typeof layerIdSchema>;
