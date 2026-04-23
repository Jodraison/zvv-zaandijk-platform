function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cleanTimeInput(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
}

/**
 * Parse human time input to seconds.
 * Supports:
 * - `mm:ss.xx` / `m:ss,xx`
 * - plain seconds `332.18`
 * Returns null on invalid input.
 */
export function parseTimeInput(input: string): number | null {
  const normalized = cleanTimeInput(input);
  if (!normalized) return null;

  let parsed: number | null = null;
  if (normalized.includes(":")) {
    const parts = normalized.split(":");
    if (parts.length !== 2) return null;
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
    parsed = minutes * 60 + seconds;
  } else {
    const seconds = Number(normalized);
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    parsed = seconds;
  }

  const rounded = round2(parsed);
  if (!Number.isFinite(rounded) || rounded <= 0) return null;
  return rounded;
}

export function normalizeTimeInputString(input: string): string {
  return cleanTimeInput(input);
}
