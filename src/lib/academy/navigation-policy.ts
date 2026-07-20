/**
 * Academy deep-link navigation policy (T-02-02).
 * Pure helpers — no React, no registry I/O.
 */
import { layerIdSchema, type LayerId } from "@/lib/academy/schema/layers";
import {
  isAcademyRoutePath,
  type AcademyWedstrijdFase,
} from "@/lib/academy/routes";

export type AcademyNavIntent = "push" | "replace";

/** Content layer tab changes: replace query — no history storm (Proto §4.1). */
export function academyNavIntentForLayerChange(): AcademyNavIntent {
  return "replace";
}

/** Entering content from another screen: push so Back can return to origin. */
export function academyNavIntentForContentEntry(): AcademyNavIntent {
  return "push";
}

/** Post-reflectie exit to Positie: replace stack (Proto S-55). */
export function academyNavIntentForReflectieComplete(): AcademyNavIntent {
  return "replace";
}

export function parseAcademyLayerQuery(raw: string | null | undefined): LayerId | null {
  if (raw == null || raw.trim() === "") return null;
  const parsed = layerIdSchema.safeParse(raw.trim());
  return parsed.success ? parsed.data : null;
}

export type AcademyPositieHighlight = "week";

export function parseAcademyHighlightQuery(
  raw: string | null | undefined,
): AcademyPositieHighlight | null {
  if (raw == null) return null;
  return raw.trim() === "week" ? "week" : null;
}

/**
 * Origin for content Back — only Academy paths accepted (open redirect guard).
 */
export function parseAcademyOriginQuery(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === "") return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (!isAcademyRoutePath(decoded.split("?")[0] ?? decoded)) return null;
  return decoded;
}

export const ACADEMY_WEDSTRIJD_FASES = ["voor", "rust", "na"] as const satisfies readonly AcademyWedstrijdFase[];

export function parseAcademyWedstrijdFase(
  raw: string | null | undefined,
): AcademyWedstrijdFase | null {
  if (raw == null) return null;
  return (ACADEMY_WEDSTRIJD_FASES as readonly string[]).includes(raw)
    ? (raw as AcademyWedstrijdFase)
    : null;
}
