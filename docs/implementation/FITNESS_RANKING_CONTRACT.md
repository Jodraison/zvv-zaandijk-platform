# Fitness Ranking Contract (definitive)

## Domains (never mixed)

| Domain | Scope | Canonical sources |
|--------|-------|-------------------|
| Match | Full active season | `match_goal_events`, assists, `wotm_player_id` via `computeRanking` |
| Fitness | Per published session + season overview | `fitness_test_sessions` + `fitness_test_results` (`status = published` only) |

## Session component rankings

| Component | Direction | #1 |
|-----------|-----------|----|
| Sprint | lower_better | lowest valid time |
| Agility | lower_better | lowest valid time |
| Plank | higher_better | highest valid duration |
| 6-minute run | higher_better | highest valid meters |

Sporting ties share rank; technical order: shirt number asc → name (`nl`).

Missing component → excluded from that component list (never coerced to 0).

## Session total ranking

Eligible only with **all four** valid components (`isFullFitnessResult`).

Normalize each component within the session to 0–100:

- higher_better: `(value - min) / (max - min) * 100`
- lower_better: `(max - value) / (max - min) * 100`
- all equal → 100 for every eligible athlete

Weights: **25% / 25% / 25% / 25%**.

Total tie-break order:

1. highest total score  
2. most component first places in that session  
3. highest lowest-component score  
4. best (lowest) sprint rank  
5. best (lowest) agility rank  
6. shirt number  
7. name  

Implementation: `src/lib/fitness/session-ranking.ts`.

## Current vs history

Newest published session in the active season is **current**.

Publishing a newer session switches current ranking; previous sessions remain fully readable in history. Nothing is deleted.

## Season fitness ranking (definitive)

Eligibility:

- complete at least **50%** of published sessions, and  
- at least **2** full participations when ≥ 2 published sessions exist  
- with exactly 1 published session: eligibility min = 1; UI label **Voorlopige seizoenstand** (season still running — formula is fixed)

Primary score: **average session total score** over all full participations.

Also shown: participations, average, best, first places, podiums.

Season tie-break:

1. highest average total  
2. most full participations  
3. most first places  
4. most podiums  
5. highest best session score  
6. shirt number  
7. name  

Implementation: `src/lib/fitness/season-overview.ts` (`SEASON_FITNESS_CONTRACT_VERSION = 2026-07-30-final`).

## Homepage

- Match spotlights: topscorer / assists / MVP  
- Fitness spotlight: leader of **current** session total → `/ranking?view=fitheid`
