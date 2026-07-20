/**
 * Param validators for Academy deep links (T-02-02).
 * Format-only — no registry lookup (WP05/WP06/WP07 content validation later).
 */
import { notFound } from "next/navigation";
import {
  exerciseIdSchema,
  playbookIdSchema,
  slugSchema,
} from "@/lib/academy/schema/ids";
import { parseAcademyWedstrijdFase } from "@/lib/academy/navigation-policy";
import type { AcademyWedstrijdFase } from "@/lib/academy/routes";

/** Loose match id: kebab + optional dots (no path separators). */
function isSafeMatchId(raw: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(raw) && !raw.includes("/");
}

export function requireAcademySlugParam(raw: string): string {
  const parsed = slugSchema.safeParse(raw);
  if (!parsed.success) {
    notFound();
  }
  return parsed.data;
}

export function requireAcademyPlaybookParam(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const parsed = playbookIdSchema.safeParse(decoded);
  if (!parsed.success) {
    notFound();
  }
  return parsed.data;
}

export function requireAcademyExerciseParam(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const parsed = exerciseIdSchema.safeParse(decoded);
  if (!parsed.success) {
    notFound();
  }
  return parsed.data;
}

export function requireAcademyWedstrijdFaseParam(raw: string): AcademyWedstrijdFase {
  const fase = parseAcademyWedstrijdFase(raw);
  if (!fase) {
    notFound();
  }
  return fase;
}

export function requireAcademyMatchParam(raw: string): string {
  const decoded = decodeURIComponent(raw);
  if (!isSafeMatchId(decoded)) {
    notFound();
  }
  return decoded;
}
