/**
 * Centrale operationele kalender seizoen 2026/27.
 * Administratieve seasons.starts_on (1 aug) ≠ operationele start (10 aug training / 2 sep fitheid).
 * De canonieke eerstvolgende testdatum is nextFitnessMoment (sessie.test_on), niet deze fallback alleen.
 */

export const SEASON_2026_27_ID = "c0ffee00-0002-4000-8000-000000000001";

export type SeasonMilestone = {
  id: string;
  /** YYYY-MM-DD */
  on?: string;
  from?: string;
  to?: string;
  label: string;
};

export type SeasonOperationsConfig = {
  seasonId: string;
  /** Administratieve grens (DB seasons.starts_on) — niet gebruiken als eerste training. */
  administrativeStartsOn: string;
  operationalStartOn: string;
  operationalEndOn: string;
  trainingSchedule: {
    timezone: "Europe/Amsterdam";
    /** JS getDay(): 1=ma, 3=wo */
    weekdays: number[];
    startsAt: string;
    endsAt: string;
  };
  fitness: {
    firstTestOn: string;
    intervalWeeks: number;
    proposedCycle: string[];
  };
  milestones: SeasonMilestone[];
};

export const seasonOperations2026_27: SeasonOperationsConfig = {
  seasonId: SEASON_2026_27_ID,
  administrativeStartsOn: "2026-08-01",
  /** Eerste echte trainingsdag seizoen 2026/27 (voorbereiding; ma/wo-kalender). */
  operationalStartOn: "2026-08-10",
  operationalEndOn: "2027-06-30",
  trainingSchedule: {
    timezone: "Europe/Amsterdam",
    weekdays: [1, 3],
    startsAt: "20:00",
    endsAt: "21:00",
  },
  fitness: {
    firstTestOn: "2026-09-02",
    intervalWeeks: 6,
    proposedCycle: [
      "2026-09-02",
      "2026-10-14",
      "2026-11-25",
      "2027-01-06",
      "2027-02-17",
      "2027-03-31",
      "2027-05-12",
      "2027-06-23",
    ],
  },
  milestones: [
    {
      id: "beker-programma",
      on: "2026-08-08",
      label: "Publicatie wedstrijdprogramma bekercompetitie",
    },
    {
      id: "seizoenstart-training-fitheid",
      on: "2026-09-02",
      label: "Eerste fitheidstest (verplaatst wegens weer; trainingen starten 10 augustus)",
    },
    {
      id: "beker-start",
      from: "2026-08-29",
      to: "2026-08-30",
      label: "Start bekercompetitie categorie B",
    },
    {
      id: "competitie-start",
      from: "2026-09-19",
      to: "2026-09-20",
      label: "Start competitie categorie B",
    },
  ],
};

export function getSeasonOperations(seasonId: string): SeasonOperationsConfig | null {
  if (seasonId === SEASON_2026_27_ID) return seasonOperations2026_27;
  return null;
}

/** Convert YYYY-MM-DD + HH:MM wall time in Europe/Amsterdam → UTC ISO. */
export function clubLocalDateTimeToIso(dateYmd: string, hm: string): string {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  if (!y || !mo || !d || hh == null || mm == null) {
    throw new Error("Ongeldige clubdatum/tijd.");
  }
  // Start guess CET (UTC+1), then iteratively correct against Amsterdam wall clock.
  let utcMs = Date.UTC(y, mo - 1, d, hh - 1, mm, 0, 0);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
    const gotH = Number(parts.hour === "24" ? "0" : parts.hour);
    const gotM = Number(parts.minute);
    const deltaMin = hh * 60 + mm - (gotH * 60 + gotM);
    if (deltaMin === 0) break;
    utcMs += deltaMin * 60_000;
  }
  return new Date(utcMs).toISOString();
}

export function trainingKickoffIso(dateYmd: string, ops: SeasonOperationsConfig = seasonOperations2026_27): string {
  return clubLocalDateTimeToIso(dateYmd, ops.trainingSchedule.startsAt);
}

export function trainingEndIso(dateYmd: string, ops: SeasonOperationsConfig = seasonOperations2026_27): string {
  return clubLocalDateTimeToIso(dateYmd, ops.trainingSchedule.endsAt);
}

/** Eerstvolgende ma/wo op/na operational start, vanaf `now`, om 20:00 Amsterdam. */
export function nextScheduledTrainingMoment(
  now: Date,
  ops: SeasonOperationsConfig = seasonOperations2026_27,
): { date: string; iso: string; endIso: string } {
  const startBoundary = clubLocalDateTimeToIso(ops.operationalStartOn, ops.trainingSchedule.startsAt);
  const cursor =
    now.getTime() < new Date(startBoundary).getTime()
      ? new Date(`${ops.operationalStartOn}T12:00:00`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

  for (let i = 0; i < 400; i++) {
    const cand = new Date(cursor.getTime() + i * 86400000);
    const y = cand.getFullYear();
    const m = String(cand.getMonth() + 1).padStart(2, "0");
    const dayN = String(cand.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${dayN}`;
    if (date > ops.operationalEndOn) break;
    if (date < ops.operationalStartOn) continue;
    const dow = cand.getDay();
    if (!ops.trainingSchedule.weekdays.includes(dow)) continue;
    const iso = trainingKickoffIso(date, ops);
    if (new Date(iso).getTime() > now.getTime()) {
      return { date, iso, endIso: trainingEndIso(date, ops) };
    }
  }
  // Fallback: operational start itself
  return {
    date: ops.operationalStartOn,
    iso: trainingKickoffIso(ops.operationalStartOn, ops),
    endIso: trainingEndIso(ops.operationalStartOn, ops),
  };
}

export function generateMonWedDates(startOn: string, endOn: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${startOn}T12:00:00`);
  const end = new Date(`${endOn}T12:00:00`);
  while (cur <= end) {
    const day = cur.getDay();
    if (day === 1 || day === 3) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function assertTrainingDateAllowed(
  seasonId: string,
  dateYmd: string,
  opts?: { allowOverride?: boolean },
): { ok: true } | { ok: false; error: string } {
  const ops = getSeasonOperations(seasonId);
  if (!ops) return { ok: true };
  if (dateYmd < ops.operationalStartOn && !opts?.allowOverride) {
    return {
      ok: false,
      error: `Trainingen voor dit seizoen starten op ${ops.operationalStartOn}. Kies die datum of later.`,
    };
  }
  if (dateYmd > ops.operationalEndOn) {
    return { ok: false, error: `Deze datum valt na het operationele seizoenseinde (${ops.operationalEndOn}).` };
  }
  return { ok: true };
}

export function assertFitnessTestDateAllowed(
  seasonId: string,
  testOn: string,
): { ok: true } | { ok: false; error: string } {
  const ops = getSeasonOperations(seasonId);
  if (!ops) return { ok: true };
  if (testOn < ops.operationalStartOn) {
    return {
      ok: false,
      error: `Fitheidstesten voor dit seizoen vallen vanaf ${ops.operationalStartOn}. Kies die datum of later.`,
    };
  }
  if (testOn > ops.operationalEndOn) {
    return { ok: false, error: `Deze testdatum valt na het operationele seizoenseinde.` };
  }
  return { ok: true };
}

/** Vandaag in Europe/Amsterdam als YYYY-MM-DD. */
export function todayInClubTz(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}
