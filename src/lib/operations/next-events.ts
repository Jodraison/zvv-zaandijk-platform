import type { ClubDatabase, Match, TrainingSession, FitnessTestSession } from "@/types";
import { nextScheduledMatch } from "@/lib/queries/matches";
import { expectedFitnessTestDate, parseOperationsInstant } from "@/lib/operations/countdown";
import { FITNESS_PROTOCOL_CODE } from "@/lib/fitness/protocol";
import {
  getSeasonOperations,
  nextScheduledTrainingMoment,
  todayInClubTz,
  type SeasonOperationsConfig,
} from "@/lib/season/season-operations-2026-27";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";

export type NextTrainingResult = {
  session: TrainingSession | null;
  suggestedDate: string | null;
  suggestedIso: string | null;
  suggestedEndIso: string | null;
  attendanceMissing: boolean;
  presentCount: number;
  expectedCount: number;
  labelHint?: string;
};

export function nextTrainingSession(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
): NextTrainingResult {
  if (!seasonId) {
    return {
      session: null,
      suggestedDate: null,
      suggestedIso: null,
      suggestedEndIso: null,
      attendanceMissing: false,
      presentCount: 0,
      expectedCount: 0,
    };
  }
  const ops = getSeasonOperations(seasonId);
  const t = now.getTime();
  const roster = db.player_season_memberships.filter((m) => {
    if (m.season_id !== seasonId) return false;
    const p = db.players.find((x) => x.id === m.player_id);
    return !p?.is_guest && !m.is_guest;
  });
  const expectedCount = roster.length;

  const operationalStart = ops?.operationalStartOn ?? null;

  const upcoming = db.training_sessions
    .filter((s) => s.season_id === seasonId && s.status !== "cancelled")
    .filter((s) => {
      const at = parseOperationsInstant(s.session_at);
      if (at == null || at.getTime() <= t) return false;
      const day = trainingDateKeyAmsterdam(s.session_at);
      if (operationalStart && day < operationalStart) return false;
      return true;
    })
    .sort((a, b) => a.session_at.localeCompare(b.session_at));

  // Afgelopen sessies (scheduled of completed) zonder volledige attendance → openstaande taak.
  const pastIncomplete = db.training_sessions
    .filter((s) => s.season_id === seasonId && s.status !== "cancelled")
    .filter((s) => {
      const at = parseOperationsInstant(s.session_at);
      if (at == null || at.getTime() > t) return false;
      const day = trainingDateKeyAmsterdam(s.session_at);
      if (operationalStart && day < operationalStart) return false;
      return true;
    })
    .sort((a, b) => b.session_at.localeCompare(a.session_at));

  for (const s of pastIncomplete) {
    const rows = db.training_attendance.filter((a) => a.session_id === s.id);
    const presentCount = rows.filter((a) => a.present).length;
    const complete =
      s.status === "completed" && roster.every((m) => rows.some((a) => a.player_id === m.player_id));
    if (!complete) {
      return {
        session: s,
        suggestedDate: null,
        suggestedIso: null,
        suggestedEndIso: null,
        attendanceMissing: true,
        presentCount,
        expectedCount,
        labelHint: "Aanwezigheid nog invullen",
      };
    }
  }

  const session = upcoming[0] ?? null;
  if (session) {
    const rows = db.training_attendance.filter((a) => a.session_id === session.id);
    return {
      session,
      suggestedDate: null,
      suggestedIso: null,
      suggestedEndIso: null,
      attendanceMissing: false,
      presentCount: rows.filter((a) => a.present).length,
      expectedCount,
    };
  }

  // Lazy calendar: next ma/wo 20:00 from operational start
  if (ops) {
    const sug = nextScheduledTrainingMoment(now, ops);
    return {
      session: null,
      suggestedDate: sug.date,
      suggestedIso: sug.iso,
      suggestedEndIso: sug.endIso,
      attendanceMissing: false,
      presentCount: 0,
      expectedCount,
      labelHint: sug.date === ops.operationalStartOn ? "Start voorbereiding" : "Ma/wo 20:00–21:00",
    };
  }

  return {
    session: null,
    suggestedDate: null,
    suggestedIso: null,
    suggestedEndIso: null,
    attendanceMissing: false,
    presentCount: 0,
    expectedCount,
  };
}

export type NextFitnessResult = {
  kind: "draft" | "planned_config" | "expected" | "overdue_expected" | "none";
  date: string | null;
  plannedSession: FitnessTestSession | null;
  lastPublished: FitnessTestSession | null;
  labelPrefix: "Gepland" | "Verwacht" | "Eerste meting" | null;
  isFirstSeasonTest: boolean;
};

function lastEligiblePublished(
  db: ClubDatabase,
  seasonId: string,
  today: string,
): FitnessTestSession | null {
  return (
    (db.fitness_test_sessions ?? [])
      .filter(
        (s) =>
          s.season_id === seasonId &&
          s.protocol_code === FITNESS_PROTOCOL_CODE &&
          s.status === "published" &&
          s.test_on <= today &&
          !(s.note ?? "").startsWith("[QA]"),
      )
      .sort((a, b) => b.test_on.localeCompare(a.test_on) || (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ??
    null
  );
}

export function nextFitnessMoment(db: ClubDatabase, seasonId: string, now = new Date()): NextFitnessResult {
  const sessions = (db.fitness_test_sessions ?? []).filter(
    (s) =>
      s.season_id === seasonId &&
      s.protocol_code === FITNESS_PROTOCOL_CODE &&
      !(s.note ?? "").startsWith("[QA]"),
  );
  const today = todayInClubTz(now);
  const ops = getSeasonOperations(seasonId);

  const draftOpen = sessions
    .filter((s) => s.status === "draft")
    .sort((a, b) => b.test_on.localeCompare(a.test_on) || b.updated_at.localeCompare(a.updated_at))[0];
  if (draftOpen) {
    return {
      kind: "draft",
      date: draftOpen.test_on,
      plannedSession: draftOpen,
      lastPublished: lastEligiblePublished(db, seasonId, today),
      labelPrefix: "Gepland",
      isFirstSeasonTest: !lastEligiblePublished(db, seasonId, today),
    };
  }

  const lastPublished = lastEligiblePublished(db, seasonId, today);

  if (!lastPublished) {
    const first = ops?.fitness.firstTestOn ?? null;
    if (!first) {
      return { kind: "none", date: null, plannedSession: null, lastPublished: null, labelPrefix: null, isFirstSeasonTest: true };
    }
    return {
      kind: "planned_config",
      date: first,
      plannedSession: null,
      lastPublished: null,
      labelPrefix: "Eerste meting",
      isFirstSeasonTest: true,
    };
  }

  const expected = expectedFitnessTestDate(lastPublished.test_on, ops?.fitness.intervalWeeks ?? 6);
  if (expected < today) {
    return {
      kind: "overdue_expected",
      date: expected,
      plannedSession: null,
      lastPublished,
      labelPrefix: "Verwacht",
      isFirstSeasonTest: false,
    };
  }
  return {
    kind: "expected",
    date: expected,
    plannedSession: null,
    lastPublished,
    labelPrefix: "Verwacht",
    isFirstSeasonTest: false,
  };
}

export function resolveNextMatch(db: ClubDatabase, seasonId: string, now = new Date()): Match | null {
  return nextScheduledMatch(db, seasonId, now);
}

export function upcomingMilestones(ops: SeasonOperationsConfig | null, now = new Date()) {
  if (!ops) return [];
  const today = todayInClubTz(now);
  return ops.milestones.filter((m) => {
    const end = m.to ?? m.on ?? m.from;
    return end != null && end >= today;
  });
}
