/**
 * Academy content schema — ID patterns (ACADEMY-ARCH-v1.1 / academy-content-schema v1.1.0).
 * T-03-01: Zod only — no YAML loaders (T-03-02).
 */
import { z } from "zod";

export const playbookIdSchema = z.string().regex(/^pb\.\d+$/, "Expected pb.{n}");
export const visualIdSchema = z.string().regex(/^vis\.t\d+$/, "Expected vis.t{n}");
export const situationIdSchema = z.string().regex(/^sit\.[a-z0-9-]+$/, "Expected sit.{slug}");
export const problemIdSchema = z.string().regex(/^prob\.[a-z0-9-]+$/, "Expected prob.{slug}");
export const momentIdSchema = z.string().regex(/^moment\.s[1-6]$/, "Expected moment.s1–s6");
export const positionIdSchema = z.string().regex(/^pos\.[a-z0-9-]+$/, "Expected pos.{slug}");
export const tagIdSchema = z.string().regex(/^tag\.[a-z0-9-]+$/, "Expected tag.{slug}");
export const cueIdSchema = z.string().regex(/^cue\.[a-z0-9-]+$/, "Expected cue.{slug}");
export const exerciseIdSchema = z.string().regex(/^ex\.\d+$/, "Expected ex.{pb_n}");
export const anchorIdSchema = z.string().regex(/^anker\.[a-z0-9-]+$/, "Expected anker.{pos_slug}");

export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, "Expected kebab-case slug");

/** Sidecar / L2–L4 position keys (sidecar template). */
export const positionSlugSchema = z.enum([
  "keeper",
  "lcv",
  "rcv",
  "lb",
  "rb",
  "l6",
  "r6",
  "10",
  "lw",
  "rw",
  "spits",
]);

export type PositionSlug = z.infer<typeof positionSlugSchema>;
