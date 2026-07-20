/**
 * Zod wrappers for Phase B registry YAML files (T-03-02).
 */
import { z } from "zod";
import {
  momentSchema,
  playbookRegistryEntrySchema,
  positieAnkerSchema,
  positionRegistryEntrySchema,
  problemRegistryEntrySchema,
  situationRegistryEntrySchema,
  tagRegistryEntrySchema,
  visualRegistryEntrySchema,
} from "@/lib/academy/schema/registry-entries";

const registryMetaSchema = z.object({
  id: z.string(),
  version: z.string(),
  architecture_ref: z.string().optional(),
}).passthrough();

export const problemsFileSchema = z.object({
  registry: registryMetaSchema,
  problems: z.array(problemRegistryEntrySchema),
});

export const situationsFileSchema = z.object({
  registry: registryMetaSchema,
  moments: z.array(momentSchema),
  situations: z.array(situationRegistryEntrySchema),
});

export const playbooksFileSchema = z.object({
  registry: registryMetaSchema,
  playbooks: z.array(playbookRegistryEntrySchema),
});

export const positionsFileSchema = z.object({
  registry: registryMetaSchema,
  positions: z.array(positionRegistryEntrySchema),
  anchors: z.array(positieAnkerSchema),
});

export const tagsFileSchema = z.object({
  registry: registryMetaSchema,
  tags: z.array(tagRegistryEntrySchema),
});

export const visualsFileSchema = z.object({
  registry: registryMetaSchema,
  visuals: z.array(visualRegistryEntrySchema),
});
