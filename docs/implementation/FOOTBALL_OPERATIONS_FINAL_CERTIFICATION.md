# Football Operations — Final Certification

**Verdict date:** 2026-07-30  
**Project:** ZVV Zaandijk VRZ1  
**Project ref:** `othxhnkwkygggkktvosp` (matches `NEXT_PUBLIC_SUPABASE_URL`)  
**Not Convertly** (`wivnxoncyfqgeqoigdqk`)

## Database identity (two+ independent signals)

1. App env + Supabase MCP URL: `https://othxhnkwkygggkktvosp.supabase.co`
2. Club data: seasons `2025/26` + `2026/27` (active), 21 active roster players, legacy `fitness_tests` = 32
3. Migration list includes `fitness_protocol_v2` (`20260730080801`)

## Backup / restore

| Artifact | Path |
|----------|------|
| Pre-025 metadata | `.review-backups/pre-025-fitness/metadata.json` (`fitness_tests: 32`) |
| Full QA dump | `.review-backups/final-ops-2026-07-30T08-18-47-533Z/` |
| Hosted recovery | Supabase project PITR on `othxhnkwkygggkktvosp` |

## Migration 025

| Field | Value |
|-------|-------|
| File | `supabase/migrations/025_fitness_protocol_v2.sql` |
| Remote name | `fitness_protocol_v2` |
| Version | `20260730080801` |
| Nature | Additive only (`IF NOT EXISTS`, no DROP/TRUNCATE on legacy) |
| Legacy count after | `fitness_tests` = 32 (unchanged) |
| Live tables | `fitness_score_configs`, `fitness_test_sessions`, `fitness_test_results` |
| RLS | enabled on all three |
| Default config | `four_part_v1` weights 25/25/25/25 |

## QA sessions (real ZVV DB)

| Session | id | Date | Status | Results | Note |
|---------|-----|------|--------|---------|------|
| A | `a0000001-…0a1` | 2026-08-30 | published | 21 | `[QA] Fitness Operations validatie — verwijderen vóór livegang` |
| B | `a0000001-…0b2` | 2026-10-11 | published | 21 | same |
| C | `a0000001-…0c3` | 2026-11-01 | published | 21 | same; station write + publish proven via `/beheer` E2E |

Current ranking = newest published by `test_on` → **C**.  
Expected next = C + 42 days → **2026-12-13**.  
History A + B intact after C publish.

## Speed proof (E2E)

- Route: `/beheer/fitheid/{C}/station/sprint`
- Players: 21
- Fill time: **737 ms** (Enter-to-next)
- Save: concept opslaan → DB count sprint = 21
- Limit: ≤ 4 minutes — PASS

## Contracts

- Session + season formulas: `docs/implementation/FITNESS_RANKING_CONTRACT.md` (definitive; no provisional product decision)
- Countdown: `docs/implementation/OPERATIONS_COUNTDOWN_CONTRACT.md`
- Workflow: `docs/implementation/FOOTBALL_OPERATIONS_WORKFLOW_PLATFORM.md`

## Real-route evidence

Primary screenshots (authenticated `/beheer`, not preview):  
`.review-screenshots/final-football-operations/`

Auth helper (local only, gitignored): `scripts/final-ops-auth-state.mjs` → `.review-auth/`

E2E: `node --env-file=.env.local scripts/final-ops-e2e.mjs` → exit 0

## Cleanup SQL (when review no longer needs QA rows)

```sql
delete from public.fitness_test_results
where session_id in (
  'a0000001-0000-4000-8000-0000000000a1',
  'a0000001-0000-4000-8000-0000000000b2',
  'a0000001-0000-4000-8000-0000000000c3'
);
delete from public.fitness_test_sessions
where id in (
  'a0000001-0000-4000-8000-0000000000a1',
  'a0000001-0000-4000-8000-0000000000b2',
  'a0000001-0000-4000-8000-0000000000c3'
);
```

Do not delete while certification review needs live ranking/countdown proof.

## RLS note

Fitness writes require `profiles.role = 'admin'`. App owner email alone is insufficient without admin role.
