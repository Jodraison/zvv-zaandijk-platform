/**
 * Sprinttijd "05:49,94" → seconden (float). Komma → punt; mm:ss.xx.
 */

export function parseSprintTimeToSeconds(raw: string): number | null {
  const s = raw.trim().replace(",", ".").replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2}):(\d{2})\.(\d{1,2})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const ss = Number(m[2]);
  const frac = m[3].length === 1 ? Number(m[3]) / 10 : Number(m[3]) / 100;
  if (!Number.isFinite(mm) || !Number.isFinite(ss) || !Number.isFinite(frac)) return null;
  if (ss >= 60) return null;
  return Math.round((mm * 60 + ss + frac) * 100) / 100;
}

/** Normaliseer speelsternaam voor matching: lowercase, trim, spaties. */
export function normalizeFitnessPlayerName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Seconden → `mm:ss,cc` (Nederlandse komma), zoals bronimport. */
export function formatSprintSecondsNl(seconds: number): string {
  const s = Math.round(seconds * 100) / 100;
  let mm = Math.floor(s / 60);
  let rest = Math.round((s - mm * 60) * 100) / 100;
  if (rest >= 60) {
    mm += 1;
    rest = Math.round((rest - 60) * 100) / 100;
  }
  const intSec = Math.floor(rest + 1e-8);
  const frac = Math.min(99, Math.round((rest - intSec) * 100));
  return `${String(mm).padStart(2, "0")}:${String(intSec).padStart(2, "0")},${String(frac).padStart(2, "0")}`;
}
