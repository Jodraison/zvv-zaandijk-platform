/**
 * Publieke homepage-teamspotlight — aanvullend op de wedstrijdkaart, geen matchdata.
 */
import type { ClubDatabase } from "@/types";
import { parseOperationsInstant } from "@/lib/operations/countdown";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import {
  getSeasonOperations,
  nextScheduledTrainingMoment,
  todayInClubTz,
} from "@/lib/season/season-operations-2026-27";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";
import { formatHumanDateNL, formatTimeNl } from "@/lib/utils/format-date";
import { STATIC_CLUB_COPY } from "@/lib/season-foundation/content-2026-27-spec";
import { TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";
import { mapSquadToBirthdayPeople } from "@/lib/players/birthday-squad";
import {
  ageOnOccurrence,
  getNextBirthdayGroup,
  joinPlayerNamesNl,
} from "@/lib/players/birthdays";

export type HomeTeamSpotlightRow = {
  title: string;
  detail: string;
  /** Tweede regel — alleen verjaardag (naam staat in `detail`). */
  subdetail?: string;
};

export type HomeTeamSpotlightModel = {
  eyebrow: string;
  title: string;
  training: HomeTeamSpotlightRow | null;
  fitness: HomeTeamSpotlightRow | null;
  birthday: HomeTeamSpotlightRow | null;
  seasonLabel: string | null;
  clubLine: string;
  mode: "ops" | "club";
};

export function seasonShortLabel(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const m = name.match(/(\d{4}\s*\/\s*\d{2,4})/);
  return m ? m[1].replace(/\s+/g, "") : name.trim();
}

export function capitalizeNl(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Eerstvolgende toekomstige training — geen openstaande aanwezigheid uit het verleden. */
export function nextPublicTrainingMoment(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
): { iso: string; dateYmd: string } | null {
  const ops = getSeasonOperations(seasonId);
  const t = now.getTime();
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

  const session = upcoming[0];
  if (session) {
    return { iso: session.session_at, dateYmd: trainingDateKeyAmsterdam(session.session_at) };
  }

  if (ops) {
    const sug = nextScheduledTrainingMoment(now, ops);
    if (new Date(sug.iso).getTime() > t) {
      return { iso: sug.iso, dateYmd: sug.date };
    }
  }
  return null;
}

function inPreparation(seasonId: string, now: Date): boolean {
  const ops = getSeasonOperations(seasonId);
  if (!ops) return false;
  const today = todayInClubTz(now);
  const start = ops.milestones.find((m) => m.id === "competitie-start");
  const from = start?.from ?? start?.on;
  return Boolean(from && today < from);
}

export function buildHomeTeamSpotlight(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
): HomeTeamSpotlightModel {
  const season = db.seasons.find((s) => s.id === seasonId);
  const seasonLabel = seasonShortLabel(season?.name);
  const trainingMoment = nextPublicTrainingMoment(db, seasonId, now);
  const fitness = nextFitnessMoment(db, seasonId, now);

  const training = trainingMoment
    ? {
        title: "Volgende training",
        detail: `${capitalizeNl(formatHumanDateNL(trainingMoment.iso))} · ${formatTimeNl(trainingMoment.iso)}`,
      }
    : null;

  const fitnessRow =
    fitness.date != null
      ? {
          title: "Volgende fitheidstest",
          detail: capitalizeNl(formatHumanDateNL(fitness.date)),
        }
      : null;

  const birthday = buildHomeNextBirthdayRow(db, seasonId, now);
  const hasOps = Boolean(training || fitnessRow || birthday);
  const clubLine = hasOps
    ? inPreparation(seasonId, now)
      ? seasonLabel
        ? `Voorbereiding ${seasonLabel}`
        : "De voorbereiding is begonnen."
      : seasonLabel
        ? `Seizoen ${seasonLabel}`
        : STATIC_CLUB_COPY.homepage_subline
    : STATIC_CLUB_COPY.homepage_subline.replace(" Alles volgen in één platform.", "");

  return {
    eyebrow: hasOps ? "Van de week" : "Zaandijk VRZ1",
    title: TEAM_DISPLAY_LABEL_UPPER,
    training,
    fitness: fitnessRow,
    birthday,
    seasonLabel: seasonLabel ? (hasOps ? seasonLabel : `Seizoen ${seasonLabel}`) : null,
    clubLine,
    mode: hasOps ? "ops" : "club",
  };
}

export function formatHomeBirthdayWhen(
  daysUntil: number,
  nextOccurrence: string,
  age: number | null,
): string {
  if (daysUntil === 0) {
    return age != null ? `Vandaag · ${age} jaar` : "Vandaag";
  }
  const dateLabel = capitalizeNl(formatHumanDateNL(nextOccurrence, { includeYear: false }));
  return age != null ? `${dateLabel} · wordt ${age}` : dateLabel;
}

/** Derde rij in de hero-card — alleen actieve selectie, geen fallbacktekst bij ontbrekende data. */
export function buildHomeNextBirthdayRow(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
): HomeTeamSpotlightRow | null {
  const group = getNextBirthdayGroup(mapSquadToBirthdayPeople(db, seasonId), now);
  if (!group) return null;

  const ages = group.occurrences.map((p) =>
    p.birth_date ? ageOnOccurrence(p.birth_date, group.nextOccurrence) : null,
  );
  const sharedAge = ages[0];
  const age =
    sharedAge != null && ages.every((value) => value === sharedAge) ? sharedAge : null;

  return {
    title: "Eerstvolgende verjaardag",
    detail: joinPlayerNamesNl(group.occurrences.map((p) => p.full_name)),
    subdetail: formatHomeBirthdayWhen(group.daysUntil, group.nextOccurrence, age),
  };
}
