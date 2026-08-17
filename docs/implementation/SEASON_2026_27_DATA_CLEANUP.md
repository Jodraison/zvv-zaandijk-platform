# Seizoen 2026/27 — Data cleanup

**Project:** `othxhnkwkygggkktvosp` (`https://othxhnkwkygggkktvosp.supabase.co`)  
**Backup:** `.review-backups/season-2026-27-reality-reset/`

## Counts vóór cleanup

| Object | Count |
|--------|------:|
| QA `fitness_test_sessions` | 3 |
| QA `fitness_test_results` | 63 |
| Legacy `fitness_tests` | 32 |
| `training_sessions` seizoen 2026/27 | 0 |
| Training jan–jun 2026 in seizoen 2025/26 | 41 (behouden) |

## Verwijderde QA-fitheidssessies

Identificatie: exacte IDs + note prefix `[QA]` + datums + seizoen 2026/27.

| Sessie | ID | Datum | Resultaten | Verwijderd |
|--------|----|-------|----------:|:----------:|
| A | `a0000001-0000-4000-8000-0000000000a1` | 2026-08-30 | 21 | ja |
| B | `a0000001-0000-4000-8000-0000000000b2` | 2026-10-11 | 21 | ja |
| C | `a0000001-0000-4000-8000-0000000000c3` | 2026-11-01 | 21 | ja |

## Training

- Geen DB-rijen voor seizoen 2026/27 vóór of na cleanup (0).
- UI-pollutie kwam uit hardcoded `fallbackDates` jan–jun 2026 in `TrainingAttendanceDashboard` — vervangen door operationele ma/wo-kalender vanaf 17-08-2026.
- Seizoen 2025/26 trainingsgeschiedenis (incl. jan–jun 2026) blijft intact en verschijnt niet in de actieve 2026/27-UI.

## Counts na cleanup

| Object | Count |
|--------|------:|
| `fitness_test_sessions` 2026/27 | 0 |
| QA-sessies (`note like '[QA]%'`) | 0 |
| Protocol results (alle) | 0 |
| Legacy `fitness_tests` | 32 (ongewijzigd) |
| Training 2026/27 vóór 17-08 | 0 |
