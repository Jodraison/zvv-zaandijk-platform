# Seizoen 2026/27 — Operationele kalender

**Autoriteit:** `src/lib/season/season-operations-2026-27.ts`  
**Administratieve DB-grens:** `seasons.starts_on = 2026-08-01` (niet gebruiken als eerste training)  
**Operationele start:** `2026-08-17`

## Grenzen

| Veld | Waarde |
|------|--------|
| `administrativeStartsOn` | 2026-08-01 |
| `operationalStartOn` | 2026-08-17 |
| `operationalEndOn` | 2027-06-30 |

## Training

- Eerste training: maandag 17 augustus 2026, 20:00–21:00 (`Europe/Amsterdam`)
- Cadans: maandag + woensdag, 20:00–21:00
- Lazy kalender via `nextScheduledTrainingMoment` — geen massale DB-seed vereist
- UI-fallback op trainingsdashboard: `generateMonWedDates(operationalStartOn, operationalEndOn)`

## Fitheid

- Eerste test: **2026-08-17** (`fitness.firstTestOn`) — Preference B: centrale config, geen fake `published` sessie
- Interval: 6 weken (`intervalWeeks: 6`)
- Voorgestelde cyclus: 17-08, 28-09, 09-11, 21-12-2026, 01-02, 15-03, 26-04, 07-06-2027
- Countdownprioriteit: draft → `firstTestOn` config → published + 42 dagen → none
- Rankingfilter: `published && test_on <= vandaag && note niet [QA]`

## Voetbalmijlpalen (informatief)

| Datum | Label |
|-------|-------|
| 2026-08-08 | Publicatie wedstrijdprogramma bekercompetitie |
| 2026-08-17 | Eerste training en eerste fitheidstest |
| 2026-08-29 / 30 | Start bekercompetitie categorie B |
| 2026-09-19 / 20 | Start competitie categorie B |

Geen fictieve wedstrijden aanmaken op basis van deze mijlpalen.

## Consumers

- `src/lib/operations/next-events.ts`
- `src/app/(site)/beheer/page.tsx`
- `src/components/admin/training-attendance-dashboard.tsx`
- `src/actions/training.ts` / `src/actions/fitness-protocol.ts`
- `src/components/home/fitness-leader-spotlight.tsx`
- `src/app/(site)/ranking/page.tsx`
- `src/app/(site)/beheer/fitheid/**`
