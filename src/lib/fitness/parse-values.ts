/**
 * Parse / format helpers for Fitness Control Center 2.0.
 * Empty → null. Zero → invalid. Plank accepts "1:45" or "105".
 */

export type ParseOk<T> = { ok: true; value: T };
export type ParseErr = { ok: false; error: string };
export type ParseResult<T> = ParseOk<T> | ParseErr;

function normalizeDecimal(raw: string): string {
  return raw.trim().replace(/\s+/g, "").replace(",", ".");
}

/** Seconds with optional decimals (sprint / agility). Empty → null. Zero invalid. */
export function parseSecondsValue(raw: string): ParseResult<number | null> {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const n = Number(normalizeDecimal(t));
  if (!Number.isFinite(n)) return { ok: false, error: "Voer een geldig getal in seconden in." };
  if (n === 0) return { ok: false, error: "0 is niet toegestaan — laat leeg als niet afgenomen." };
  if (n < 0) return { ok: false, error: "Negatieve waarden zijn niet toegestaan." };
  if (n > 9999) return { ok: false, error: "Waarde is te hoog." };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

/**
 * Plank: "1:45" / "1.45" mm:ss style OR plain seconds "105".
 * Stored as integer total seconds. Empty → null. Zero invalid.
 */
export function parsePlankToSeconds(raw: string): ParseResult<number | null> {
  const t = raw.trim().replace(/\s+/g, "");
  if (!t) return { ok: true, value: null };

  const colon = t.match(/^(\d{1,3}):(\d{1,2})$/);
  if (colon) {
    const mm = Number(colon[1]);
    const ss = Number(colon[2]);
    if (!Number.isFinite(mm) || !Number.isFinite(ss) || ss >= 60) {
      return { ok: false, error: "Gebruik min:sec (bijv. 1:45) of seconden (105)." };
    }
    const total = mm * 60 + ss;
    if (total === 0) return { ok: false, error: "0 is niet toegestaan — laat leeg als niet afgenomen." };
    return { ok: true, value: total };
  }

  const n = Number(normalizeDecimal(t));
  if (!Number.isFinite(n)) return { ok: false, error: "Gebruik min:sec (bijv. 1:45) of seconden (105)." };
  if (n === 0) return { ok: false, error: "0 is niet toegestaan — laat leeg als niet afgenomen." };
  if (n < 0) return { ok: false, error: "Negatieve waarden zijn niet toegestaan." };
  if (!Number.isInteger(n) && Math.abs(n - Math.round(n)) > 1e-9) {
    // allow 105.0
    if (Math.abs(n - Math.round(n)) > 1e-6) {
      return { ok: false, error: "Plank wordt opgeslagen in hele seconden." };
    }
  }
  const rounded = Math.round(n);
  if (rounded > 36000) return { ok: false, error: "Waarde is te hoog." };
  return { ok: true, value: rounded };
}

/** Integer meters. Empty → null. Zero invalid. */
export function parseMetersValue(raw: string): ParseResult<number | null> {
  if (!raw.trim()) return { ok: true, value: null };
  // Allow "1345" or "1.345" (NL thousands) or "1,345"
  let normalized = raw.trim().replace(/\s+/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/[.,]/g, "");
  } else {
    normalized = normalizeDecimal(normalized);
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return { ok: false, error: "Voer een geheel getal in meters in." };
  if (n === 0) return { ok: false, error: "0 is niet toegestaan — laat leeg als niet afgenomen." };
  if (n < 0) return { ok: false, error: "Negatieve waarden zijn niet toegestaan." };
  if (!Number.isInteger(n)) return { ok: false, error: "Meters moeten een geheel getal zijn." };
  if (n > 20000) return { ok: false, error: "Waarde is te hoog." };
  return { ok: true, value: n };
}

export function formatSecondsNl(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  return `${String(seconds).replace(".", ",")} s`;
}

export function formatPlankDisplay(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "—";
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export function formatMetersNl(meters: number | null | undefined): string {
  if (meters == null) return "—";
  return `${meters.toLocaleString("nl-NL")} m`;
}

export function plankSecondsToInput(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "";
  return formatPlankDisplay(totalSeconds);
}
