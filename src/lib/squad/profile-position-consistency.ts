import type { PlayerPosition } from "@/types";
import { lineFromDisplayCode } from "@/lib/squad/season-2026-27-positions";

/**
 * Canonical profielpositie:
 * - `display_position` = voetbalcode in de UI (SP, CVM, GK, …)
 * - `position` = linie-enum GK|DEF|MID|ATT, afgeleid van die code
 *
 * Wedstrijdslot / match role staat hier los van.
 */
export function expectedLineForDisplayPosition(displayPosition: string): PlayerPosition {
  return lineFromDisplayCode(displayPosition);
}

export function isProfilePositionConsistent(
  line: string | null | undefined,
  displayPosition: string | null | undefined,
): boolean {
  const code = displayPosition?.trim();
  if (!code) return false;
  const expected = expectedLineForDisplayPosition(code);
  return String(line ?? "").trim().toUpperCase() === expected;
}

export function profilePositionConflict(
  line: string | null | undefined,
  displayPosition: string | null | undefined,
): { line: string; display: string; expectedLine: PlayerPosition } | null {
  const display = displayPosition?.trim() ?? "";
  const current = String(line ?? "").trim().toUpperCase();
  if (!display) return null;
  const expectedLine = expectedLineForDisplayPosition(display);
  if (current === expectedLine) return null;
  return { line: current, display, expectedLine };
}
