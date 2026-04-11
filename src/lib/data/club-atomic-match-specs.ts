/**
 * Bron voor atomaire migratie + production-club-data-fix.
 * Afgeleid van het officiële wedstrijdblok (kalender = seed-club-data MATCHES).
 */

export type ClubMatchTally = { g: number; a: number };

export type ClubAtomicMatchSpec = {
  matchId: string;
  kickoff_at: string;
  opponent: string;
  is_home: boolean;
  goals_for: number;
  goals_against: number;
  mvp: string;
  tallies: Record<string, ClubMatchTally>;
};

export const ATOMIC_MATCH_SPECS: ClubAtomicMatchSpec[] = [
  {
    matchId: "f2000001-0000-4000-8000-000000000001",
    kickoff_at: "2025-09-20T14:00:00.000Z",
    opponent: "WSV",
    is_home: true,
    goals_for: 0,
    goals_against: 0,
    mvp: "Marisha Prins",
    tallies: { "Marisha Prins": { g: 0, a: 0 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000002",
    kickoff_at: "2025-10-01T14:00:00.000Z",
    opponent: "ZOB",
    is_home: false,
    goals_for: 1,
    goals_against: 3,
    mvp: "Emma de Mie",
    tallies: { "Emma de Mie": { g: 1, a: 0 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000003",
    kickoff_at: "2025-10-04T14:00:00.000Z",
    opponent: "Egmond",
    is_home: false,
    goals_for: 1,
    goals_against: 2,
    mvp: "Mandy Kalmeijer",
    tallies: { "Nienke Hoffman": { g: 1, a: 0 }, "Andrada Timmer": { g: 0, a: 1 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000004",
    kickoff_at: "2025-10-11T14:00:00.000Z",
    opponent: "Velserbroek",
    is_home: false,
    goals_for: 3,
    goals_against: 1,
    mvp: "Melissa Donkers",
    tallies: {
      "Nienke Hoffman": { g: 1, a: 0 },
      "Shura Nieboer": { g: 2, a: 0 },
      "Tess Luijting": { g: 0, a: 1 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000005",
    kickoff_at: "2025-11-08T14:00:00.000Z",
    opponent: "Stormvogels",
    is_home: false,
    goals_for: 9,
    goals_against: 0,
    mvp: "Andrada Timmer",
    tallies: {
      "Andrada Timmer": { g: 2, a: 0 },
      "Melissa Rietveld": { g: 2, a: 2 },
      "Emma de Mie": { g: 2, a: 0 },
      "Nienke Hoffman": { g: 2, a: 0 },
      "Dionne van Dijk": { g: 1, a: 3 },
      "Renée Koopman": { g: 0, a: 1 },
      "Anouk Aafjes": { g: 0, a: 1 },
      "Shura Nieboer": { g: 0, a: 1 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000006",
    kickoff_at: "2025-11-29T14:00:00.000Z",
    opponent: "Sporting Andijk",
    is_home: true,
    goals_for: 3,
    goals_against: 2,
    mvp: "Jelisa De Jonge",
    tallies: {
      "Pitou Ludding": { g: 1, a: 0 },
      "Nienke Hoffman": { g: 1, a: 0 },
      "Emma de Mie": { g: 1, a: 0 },
      "Jelisa De Jonge": { g: 0, a: 0 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000007",
    kickoff_at: "2025-12-06T14:00:00.000Z",
    opponent: "Wieringermeer VR2",
    is_home: false,
    goals_for: 1,
    goals_against: 1,
    mvp: "Marisha Prins",
    tallies: { "Pitou Ludding": { g: 1, a: 0 }, "Marisha Prins": { g: 0, a: 0 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000008",
    kickoff_at: "2025-12-13T14:00:00.000Z",
    opponent: "Wieringermeer VR3",
    is_home: false,
    goals_for: 1,
    goals_against: 2,
    mvp: "Marisha Prins",
    tallies: { "Melissa Donkers": { g: 1, a: 0 }, "Mandy Kalmeijer": { g: 0, a: 1 }, "Marisha Prins": { g: 0, a: 0 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-000000000009",
    kickoff_at: "2026-01-24T14:00:00.000Z",
    opponent: "ZVC'22",
    is_home: true,
    goals_for: 12,
    goals_against: 0,
    mvp: "Nienke Hoffman",
    tallies: {
      "Melissa Donkers": { g: 3, a: 0 },
      "Nienke Hoffman": { g: 3, a: 0 },
      "Pitou Ludding": { g: 2, a: 0 },
      "Andrada Timmer": { g: 1, a: 1 },
      "Esmee": { g: 2, a: 0 },
      "Kyra De Bakker": { g: 1, a: 0 },
      "Mandy Kalmeijer": { g: 0, a: 3 },
      "Renée Koopman": { g: 0, a: 1 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-00000000000a",
    kickoff_at: "2026-01-31T14:00:00.000Z",
    opponent: "WSV",
    is_home: false,
    goals_for: 4,
    goals_against: 1,
    mvp: "Pitou Ludding",
    tallies: {
      "Pitou Ludding": { g: 2, a: 1 },
      "Micah": { g: 1, a: 0 },
      "Nienke Hoffman": { g: 1, a: 1 },
      "Emma de Mie": { g: 0, a: 1 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-00000000000b",
    kickoff_at: "2026-02-07T14:00:00.000Z",
    opponent: "ZOB",
    is_home: true,
    goals_for: 1,
    goals_against: 3,
    mvp: "Marisha Prins",
    tallies: { "Mandy Kalmeijer": { g: 1, a: 0 }, "Melissa Rietveld": { g: 0, a: 1 }, "Marisha Prins": { g: 0, a: 0 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-00000000000c",
    kickoff_at: "2026-03-07T14:00:00.000Z",
    opponent: "Velserbroek",
    is_home: true,
    goals_for: 3,
    goals_against: 0,
    mvp: "Andrada Timmer",
    tallies: {
      "Shura Nieboer": { g: 1, a: 0 },
      "Andrada Timmer": { g: 2, a: 0 },
      "Dionne van Dijk": { g: 0, a: 1 },
      "Melissa Rietveld": { g: 0, a: 1 },
    },
  },
  {
    matchId: "f2000001-0000-4000-8000-00000000000d",
    kickoff_at: "2026-03-11T14:00:00.000Z",
    opponent: "Egmond",
    is_home: true,
    goals_for: 1,
    goals_against: 2,
    mvp: "Mandy Kalmeijer",
    tallies: { "Mandy Kalmeijer": { g: 1, a: 0 }, "Melissa Rietveld": { g: 0, a: 1 } },
  },
  {
    matchId: "f2000001-0000-4000-8000-00000000000e",
    kickoff_at: "2026-03-14T14:00:00.000Z",
    opponent: "Wieringermeer VR3",
    is_home: false,
    goals_for: 4,
    goals_against: 3,
    mvp: "Mandy Kalmeijer",
    tallies: {
      "Danique van Heeringen": { g: 1, a: 0 },
      "Mandy Kalmeijer": { g: 2, a: 0 },
      "Emma de Mie": { g: 1, a: 1 },
      "Melissa Rietveld": { g: 0, a: 1 },
      "Shura Nieboer": { g: 0, a: 1 },
    },
  },
];

export function tallySumGoals(t: Record<string, ClubMatchTally>): number {
  return Object.values(t).reduce((s, x) => s + x.g, 0);
}

export function tallySumAssists(t: Record<string, ClubMatchTally>): number {
  return Object.values(t).reduce((s, x) => s + x.a, 0);
}
