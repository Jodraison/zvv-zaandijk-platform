/**
 * Handmatig trainingsbeheer — helpers voor create/update/overzicht.
 * Geen automatische attendance; timezone Europe/Amsterdam.
 */
import { clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import type { TrainingSession, TrainingAttendance, TrainingSessionStatus } from "@/types";
import { resolveTrainingOperationalStatus } from "@/lib/training/training-status";

export const TRAINING_TITLE_OPTIONS = [
  "Reguliere training",
  "Extra training",
  "Hersteltraining",
  "Tactische training",
  "Conditietraining",
  "Overig",
] as const;

export type TrainingListBucket = "open" | "upcoming" | "earlier";

export type TrainingListItem = {
  session: TrainingSession;
  dateKey: string;
  bucket: TrainingListBucket;
  statusLabel: string;
  needsAttendance: boolean;
  timeLabel: string;
};

/** YYYY-MM-DD in Europe/Amsterdam for a session instant. */
export function trainingDateKeyAmsterdam(sessionAt: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(sessionAt));
  } catch {
    return sessionAt.slice(0, 10);
  }
}

export function trainingTimeLabelAmsterdam(sessionAt: string, endAt?: string | null): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  const start = fmt(sessionAt);
  if (endAt) return `${start}–${fmt(endAt)}`;
  const endIso = new Date(new Date(sessionAt).getTime() + 60 * 60_000).toISOString();
  return `${start}–${fmt(endIso)}`;
}

export function buildTrainingKickoffIso(dateYmd: string, startHhMm: string): string {
  return clubLocalDateTimeToIso(dateYmd, startHhMm);
}

export function buildTrainingEndIso(dateYmd: string, endHhMm: string): string {
  return clubLocalDateTimeToIso(dateYmd, endHhMm);
}

/** Compact label: "ma 10 aug" */
export function formatTrainingChipLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function classifyTrainingSessions(
  sessions: TrainingSession[],
  attendance: Pick<TrainingAttendance, "session_id" | "player_id" | "present">[],
  expectedSquadCount: number,
  now = new Date(),
): TrainingListItem[] {
  const items = sessions.map((session) => {
    const rows = attendance.filter((a) => a.session_id === session.id).length;
    const op = resolveTrainingOperationalStatus(session, {
      now,
      attendanceRowCount: rows,
      expectedSquadCount,
    });
    const dateKey = trainingDateKeyAmsterdam(session.session_at);
    const needsAttendance =
      session.status !== "cancelled" &&
      !op.isFuture &&
      op.status !== "geregistreerd" &&
      op.status !== "afgelast";
    let bucket: TrainingListBucket = "earlier";
    if (op.isFuture && session.status !== "cancelled") bucket = "upcoming";
    else if (needsAttendance) bucket = "open";
    else if (op.isFuture) bucket = "upcoming";
    else bucket = "earlier";

    const loc = parseTrainingLocationMeta(session.location);
    const endIso = buildTrainingEndIso(dateKey, loc.end);
    return {
      session,
      dateKey,
      bucket,
      statusLabel: needsAttendance ? "Aanwezigheid nog invullen" : op.label,
      needsAttendance,
      timeLabel: trainingTimeLabelAmsterdam(session.session_at, endIso),
    };
  });

  const rank = (b: TrainingListBucket) => (b === "open" ? 0 : b === "upcoming" ? 1 : 2);
  return items.sort((a, b) => {
    const br = rank(a.bucket) - rank(b.bucket);
    if (br !== 0) return br;
    if (a.bucket === "earlier") return b.session.session_at.localeCompare(a.session.session_at);
    return a.session.session_at.localeCompare(b.session.session_at);
  });
}

export function findSessionsOnDate(
  sessions: TrainingSession[],
  seasonId: string,
  dateYmd: string,
): TrainingSession[] {
  return sessions.filter(
    (s) => s.season_id === seasonId && trainingDateKeyAmsterdam(s.session_at) === dateYmd,
  );
}

export function sessionHasAttendance(
  attendance: Pick<TrainingAttendance, "session_id">[],
  sessionId: string,
): boolean {
  return attendance.some((a) => a.session_id === sessionId);
}

export type ManualTrainingInput = {
  season_id: string;
  date_ymd: string;
  start_hhmm: string;
  end_hhmm: string;
  title: string;
  note?: string | null;
};

/** Parse `20:00–21:00 · notitie` uit location. */
export function parseTrainingLocationMeta(location: string | null | undefined): {
  start: string;
  end: string;
  note: string;
} {
  const raw = String(location ?? "").trim();
  const m = raw.match(/^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})(?:\s*·\s*(.*))?$/);
  if (!m) {
    return { start: "20:00", end: "21:00", note: raw };
  }
  return { start: m[1]!, end: m[2]!, note: (m[3] ?? "").trim() };
}

export function parseManualTrainingInput(raw: ManualTrainingInput): {
  season_id: string;
  title: string;
  session_at: string;
  location: string | null;
  status: TrainingSessionStatus;
} {
  const season_id = String(raw.season_id ?? "").trim();
  const date = String(raw.date_ymd ?? "").trim();
  const start = String(raw.start_hhmm ?? "").trim() || "20:00";
  const end = String(raw.end_hhmm ?? "").trim() || "21:00";
  const title = String(raw.title ?? "").trim() || "Reguliere training";
  const note = String(raw.note ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Kies een geldige datum.");
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    throw new Error("Gebruik tijd als UU:MM.");
  }
  const session_at = buildTrainingKickoffIso(date, start);
  const endIso = buildTrainingEndIso(date, end);
  if (new Date(endIso).getTime() <= new Date(session_at).getTime()) {
    throw new Error("Eindtijd moet na starttijd liggen.");
  }
  // Note + tijdvenster in location (geen ends_at-kolom); statusduur blijft 60 min standaard.
  const locationParts = [`${start}–${end}`];
  if (note) locationParts.push(note);
  return {
    season_id,
    title,
    session_at,
    location: locationParts.join(" · "),
    status: "scheduled",
  };
}
