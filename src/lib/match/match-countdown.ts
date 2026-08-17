/**
 * Centrale wedstrijd-countdown — Europe/Amsterdam, één contract voor alle surfaces.
 */
import { CLUB_TZ, parseOperationsInstant } from "@/lib/operations/countdown";

export type MatchCountdownKind =
  | "missing"
  | "cancelled"
  | "postponed"
  | "live"
  | "finished"
  | "soon"
  | "today"
  | "within_24h"
  | "within_week"
  | "far";

export type MatchCountdownState = {
  kind: MatchCountdownKind;
  primaryLabel: string;
  secondaryLabel?: string;
  /** Absolute kickoff ISO when parsed. */
  targetIso: string | null;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function amsterdamYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatTimeNl(d: Date): string {
  return d.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CLUB_TZ,
  });
}

function formatHoursAndMinutes(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / MIN));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours <= 0) {
    return `Over ${minutes} ${plural(minutes, "minuut", "minuten")}`;
  }
  if (minutes === 0) {
    return `Over ${hours} ${plural(hours, "uur", "uur")}`;
  }
  return `Over ${hours} ${plural(hours, "uur", "uur")} en ${minutes} ${plural(minutes, "minuut", "minuten")}`;
}

function formatDaysAndHours(ms: number): string {
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  if (days <= 0) return formatHoursAndMinutes(ms);
  if (hours === 0) return `Over ${days} ${plural(days, "dag", "dagen")}`;
  return `Over ${days} ${plural(days, "dag", "dagen")} en ${hours} ${plural(hours, "uur", "uur")}`;
}

function formatWeeksAndDays(ms: number): string {
  const totalDays = Math.floor(ms / DAY);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  if (weeks > 0 && days > 0) {
    return `Over ${weeks} ${plural(weeks, "week", "weken")} en ${days} ${plural(days, "dag", "dagen")}`;
  }
  if (weeks > 0) return `Over ${weeks} ${plural(weeks, "week", "weken")}`;
  return formatDaysAndHours(ms);
}

/**
 * Relatieve wedstrijdstatus t.o.v. kickoff + match status.
 * `now` injecteerbaar voor tests; client mag per minuut vernieuwen.
 */
export function getMatchCountdownState(opts: {
  startsAt: string | null | undefined;
  now?: Date;
  timezone?: string;
  status?: string | null;
  durationMinutes?: number;
}): MatchCountdownState {
  const now = opts.now ?? new Date();
  const status = (opts.status ?? "").toLowerCase();
  const durationMs = (opts.durationMinutes ?? 105) * MIN;

  if (status === "cancelled") {
    return { kind: "cancelled", primaryLabel: "Afgelast", targetIso: null };
  }
  if (status === "postponed") {
    return { kind: "postponed", primaryLabel: "Uitgesteld", targetIso: null };
  }

  const target = parseOperationsInstant(opts.startsAt ?? null);
  if (!target) {
    return { kind: "missing", primaryLabel: "Nog niet gepland", targetIso: null };
  }

  const targetIso = target.toISOString();
  const end = new Date(target.getTime() + durationMs);
  const delta = target.getTime() - now.getTime();

  if (status === "played" || now.getTime() > end.getTime()) {
    return { kind: "finished", primaryLabel: "Afgelopen", targetIso };
  }

  if (delta <= 0 && now.getTime() <= end.getTime()) {
    return { kind: "live", primaryLabel: "Bezig", targetIso };
  }

  if (delta > 0 && delta <= 60 * MIN) {
    const m = Math.max(1, Math.ceil(delta / MIN));
    return {
      kind: "soon",
      primaryLabel: `Begint over ${m} ${plural(m, "minuut", "minuten")}`,
      targetIso,
    };
  }

  const sameDay = amsterdamYmd(now) === amsterdamYmd(target);
  if (sameDay) {
    return {
      kind: "today",
      primaryLabel: `Vandaag om ${formatTimeNl(target)}`,
      secondaryLabel: formatHoursAndMinutes(delta),
      targetIso,
    };
  }

  if (delta < DAY) {
    return {
      kind: "within_24h",
      primaryLabel: formatHoursAndMinutes(delta),
      targetIso,
    };
  }

  if (delta < 7 * DAY) {
    return {
      kind: "within_week",
      primaryLabel: formatDaysAndHours(delta),
      secondaryLabel: formatTimeNl(target),
      targetIso,
    };
  }

  return {
    kind: "far",
    primaryLabel: formatWeeksAndDays(delta),
    targetIso,
  };
}

/** Client refresh interval — geen seconden nodig. */
export function matchCountdownRefreshIntervalMs(
  startsAt: string | null | undefined,
  now = new Date(),
): number | null {
  const target = parseOperationsInstant(startsAt ?? null);
  if (!target) return null;
  const delta = Math.abs(target.getTime() - now.getTime());
  if (delta <= HOUR) return MIN;
  if (delta <= DAY) return 5 * MIN;
  if (delta <= 7 * DAY) return 30 * MIN;
  return null;
}

const SEC = 1_000;
const WEEK = 7 * DAY;

export type MatchLiveUnitKey = "week" | "dagen" | "uur" | "min" | "sec";

export type MatchLiveUnit = {
  key: MatchLiveUnitKey;
  value: number;
  label: string;
  shortLabel: string;
};

export type MatchLiveCountdownModel = {
  kind: MatchCountdownKind;
  /** Bestaande statuszin — geen tweede contract. */
  primaryLabel: string;
  secondaryLabel?: string;
  /** Terminal / lifecycle: Bezig, Afgelopen, Afgelast, Uitgesteld. */
  statusLabel: string | null;
  eyebrow: string | null;
  units: MatchLiveUnit[];
  remainingMs: number;
  targetIso: string | null;
  /** Stabiele omschrijving (geen seconden) voor screenreaders. */
  description: string;
  urgent: boolean;
};

const UNIT_META: Record<MatchLiveUnitKey, { label: string; shortLabel: string }> = {
  week: { label: "WEEK", shortLabel: "WK" },
  dagen: { label: "DAGEN", shortLabel: "DGN" },
  uur: { label: "UUR", shortLabel: "UUR" },
  min: { label: "MIN", shortLabel: "MIN" },
  sec: { label: "SEC", shortLabel: "SEC" },
};

export function padLiveUnit(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function unit(key: MatchLiveUnitKey, value: number): MatchLiveUnit {
  return { key, value: Math.max(0, Math.floor(value)), ...UNIT_META[key] };
}

function remainingParts(ms: number) {
  const remaining = Math.max(0, ms);
  return {
    weeks: Math.floor(remaining / WEEK),
    daysInWeek: Math.floor((remaining % WEEK) / DAY),
    totalDays: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MIN),
    seconds: Math.floor((remaining % MIN) / SEC),
  };
}

function unitsForKind(kind: MatchCountdownKind, remainingMs: number): MatchLiveUnit[] {
  const p = remainingParts(remainingMs);
  if (kind === "soon") {
    return [unit("min", p.minutes), unit("sec", p.seconds)];
  }
  if (kind === "today" || kind === "within_24h") {
    return [unit("uur", p.hours), unit("min", p.minutes), unit("sec", p.seconds)];
  }
  if (kind === "within_week") {
    return [
      unit("dagen", p.totalDays),
      unit("uur", p.hours),
      unit("min", p.minutes),
      unit("sec", p.seconds),
    ];
  }
  if (kind === "far") {
    return [
      unit("week", p.weeks),
      unit("dagen", p.daysInWeek),
      unit("uur", p.hours),
      unit("min", p.minutes),
      unit("sec", p.seconds),
    ];
  }
  return [];
}

function eyebrowForKind(kind: MatchCountdownKind): string | null {
  if (kind === "today") return "Matchday";
  if (kind === "soon" || kind === "within_24h") return "Start over";
  return null;
}

function statusForKind(kind: MatchCountdownKind, primaryLabel: string): string | null {
  if (kind === "live" || kind === "finished" || kind === "cancelled" || kind === "postponed" || kind === "missing") {
    return primaryLabel;
  }
  return null;
}

/**
 * Live seconden-aftelling bovenop `getMatchCountdownState`.
 * Remaining time is UTC-millis; Amsterdam zit in de opgeslagen kickoff + kalenderdag.
 */
export function getMatchLiveCountdown(opts: {
  startsAt: string | null | undefined;
  now?: Date;
  timezone?: string;
  status?: string | null;
  durationMinutes?: number;
}): MatchLiveCountdownModel {
  const now = opts.now ?? new Date();
  const state = getMatchCountdownState({ ...opts, now });
  const target = parseOperationsInstant(opts.startsAt ?? null);
  const remainingMs = target ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const statusLabel = statusForKind(state.kind, state.primaryLabel);
  const units = statusLabel ? [] : unitsForKind(state.kind, remainingMs);
  const eyebrow = statusLabel ? null : eyebrowForKind(state.kind);
  const description = [state.primaryLabel, state.secondaryLabel].filter(Boolean).join(". ");

  return {
    kind: state.kind,
    primaryLabel: state.primaryLabel,
    secondaryLabel: state.secondaryLabel,
    statusLabel,
    eyebrow,
    units,
    remainingMs,
    targetIso: state.targetIso,
    description,
    urgent: state.kind === "soon" || state.kind === "within_24h" || state.kind === "today",
  };
}

export { CLUB_TZ };
