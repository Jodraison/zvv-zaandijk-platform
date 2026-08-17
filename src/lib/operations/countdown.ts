/**
 * Centrale Football Operations countdown — één bron voor wedstrijd, training, fitheid.
 * Gebruik `now` injecteerbaar (tests). Client: alleen na mount label tonen om hydration te vermijden.
 */

export type CountdownState = "future" | "tomorrow" | "today" | "soon" | "live" | "past" | "missing";
export type CountdownUrgency = "neutral" | "upcoming" | "today" | "overdue";

export type CountdownResult = {
  state: CountdownState;
  primaryLabel: string;
  secondaryLabel?: string;
  urgency: CountdownUrgency;
  /** Absolute target used (ISO or date-only normalized). */
  targetIso: string | null;
};

export const CLUB_TZ = "Europe/Amsterdam";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Parse kickoff / session ISO or YYYY-MM-DD (club noon Europe/Amsterdam approximation via local midday). */
export function parseOperationsInstant(input: string | null | undefined): Date | null {
  if (!input?.trim()) return null;
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // Date-only: interpret as local midday to avoid UTC day-shift for NL dates.
    const d = new Date(`${s}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function formatWeeksAndDays(ms: number): string {
  const totalDays = Math.floor(ms / DAY);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  if (weeks > 0 && days > 0) {
    return `Over ${weeks} ${plural(weeks, "week", "weken")} en ${days} ${plural(days, "dag", "dagen")}`;
  }
  if (weeks > 0) return `Over ${weeks} ${plural(weeks, "week", "weken")}`;
  if (totalDays > 1) return `Over ${totalDays} dagen`;
  if (totalDays === 1) return "Morgen";
  return "Vandaag";
}

function formatTimeNl(d: Date): string {
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: CLUB_TZ });
}

/**
 * Relatieve countdown t.o.v. `now`.
 * @param durationMs optioneel: duur van “live” venster (default 2u wedstrijd/training).
 */
export function computeCountdown(
  targetInput: string | null | undefined,
  now: Date = new Date(),
  options?: { durationMs?: number; expectedLabel?: boolean },
): CountdownResult {
  const target = parseOperationsInstant(targetInput ?? null);
  if (!target) {
    return {
      state: "missing",
      primaryLabel: "Nog niet gepland",
      urgency: "neutral",
      targetIso: null,
    };
  }

  const targetIso = target.toISOString();
  const durationMs = options?.durationMs ?? 2 * HOUR;
  const end = new Date(target.getTime() + durationMs);
  const delta = target.getTime() - now.getTime();
  const pastEnd = now.getTime() > end.getTime();

  if (pastEnd || (delta < 0 && now.getTime() > end.getTime())) {
    const ago = now.getTime() - (delta < 0 ? end.getTime() : target.getTime());
    let primaryLabel: string;
    if (ago < HOUR) {
      const m = Math.max(1, Math.floor(ago / MIN));
      primaryLabel = `${m} ${plural(m, "minuut", "minuten")} geleden`;
    } else if (ago < DAY) {
      const h = Math.floor(ago / HOUR);
      primaryLabel = `${h} ${plural(h, "uur", "uur")} geleden`;
    } else {
      const d = Math.floor(ago / DAY);
      primaryLabel = `${d} ${plural(d, "dag", "dagen")} geleden`;
    }
    return {
      state: "past",
      primaryLabel,
      secondaryLabel: options?.expectedLabel ? "Verwachte datum was voorbij" : undefined,
      urgency: "overdue",
      targetIso,
    };
  }

  if (delta <= 0 && now.getTime() <= end.getTime()) {
    return {
      state: "live",
      primaryLabel: "Nu bezig",
      urgency: "today",
      targetIso,
    };
  }

  if (delta > 0 && delta <= 60 * MIN) {
    const m = Math.max(1, Math.ceil(delta / MIN));
    return {
      state: "soon",
      primaryLabel: `Begint over ${m} ${plural(m, "minuut", "minuten")}`,
      urgency: "today",
      targetIso,
    };
  }

  const nowDay = startOfLocalDay(now);
  const targetDay = startOfLocalDay(target);
  const dayDiff = Math.round((targetDay.getTime() - nowDay.getTime()) / DAY);

  if (dayDiff === 0) {
    return {
      state: "today",
      primaryLabel: `Vandaag om ${formatTimeNl(target)}`,
      urgency: "today",
      targetIso,
    };
  }

  if (dayDiff === 1) {
    return {
      state: "tomorrow",
      primaryLabel: `Morgen om ${formatTimeNl(target)}`,
      urgency: "upcoming",
      targetIso,
    };
  }

  if (delta < 3 * DAY) {
    return {
      state: "future",
      primaryLabel: `Over ${dayDiff} dagen`,
      secondaryLabel: formatTimeNl(target),
      urgency: "upcoming",
      targetIso,
    };
  }

  return {
    state: "future",
    primaryLabel: formatWeeksAndDays(delta),
    urgency: "neutral",
    targetIso,
  };
}

/** Aanbevolen client refresh-interval (ms) op basis van afstand tot target. */
export function countdownRefreshIntervalMs(targetInput: string | null | undefined, now = new Date()): number | null {
  const target = parseOperationsInstant(targetInput ?? null);
  if (!target) return null;
  const delta = Math.abs(target.getTime() - now.getTime());
  if (delta <= HOUR) return MIN;
  if (delta <= DAY) return 5 * MIN;
  return null; // page load enough
}

/** Verwachte volgende fitheidstest = laatste published test_on + N weken (date-only). */
export function expectedFitnessTestDate(lastPublishedTestOn: string, intervalWeeks = 6): string {
  const d = parseOperationsInstant(lastPublishedTestOn);
  if (!d) return lastPublishedTestOn;
  const days = Math.max(1, Math.round(intervalWeeks * 7));
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
