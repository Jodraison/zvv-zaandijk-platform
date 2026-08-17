# Admin 2.0 — Data Integrity Contract

**Datum:** 2026-07-29  
**Repo:** `platform/`  
**Status:** Uitgevoerd (contract + tests; geen DB-RPC)

---

## 1. Canonieke bronnen

| Domein | Bron van waarheid | Afgeleid |
|--------|-------------------|----------|
| Goals + assists | `match_goal_events` | `matches.goals_for`, `match_player_stats.goals/assists` |
| MVP (WOTM) | `matches.wotm_player_id` | Ranking/MVP-telling |
| Kaarten | `match_card_events` | — |
| Wissels | `match_substitutions` | — |
| Opstelling | `match_lineup_entries` | — |

Constanten: `MATCH_CANONICAL_SOURCES` in `src/lib/admin/match-save-contract.ts`.

Ranking en publieke statistieken lezen events + `wotm_player_id` via `aggregateSeasonMatchStats` — nooit losse stat-rijen als primaire bron.

### Afleiding bij save

```ts
aggregateStatsFromGoals(matchId, selectedPlayerIds, goalsPayload)
// → { goals_for, stats, events }
```

Stats worden opnieuw opgebouwd uit events (`rebuildStatsFromPersistedEvents`) vóór post-verify.

## 2. Atomicity

### Wat wél gebeurt

`mutateDb` (`src/lib/data/mutate.ts`):

1. `readDbForWrite()` — optimistic lock op `schema_version`
2. `structuredClone(before)`
3. `fn(draft)` — in-memory mutatie
4. **`writeClubDatabaseDiff(before, after, schemaVersion)`** — alleen gewijzigde rijen
5. `revalidateClubDataAfterMutation()`
6. `logAdminAction` (async, non-blocking)

Binnen één save-actie (wedstrijd): events, stats, lineup, cards, subs en match-row worden in **één** `mutateDb`-callback gewijzigd. Post-verify (`verifyMatchIntegrity`) gooit **binnen** die callback als counts niet kloppen — diff wordt dan niet succesvol afgerond.

### Wat níet gebeurt

- **Geen** enkele Postgres RPC die alle gerelateerde tabellen in één DB-transactie commit.
- Geen two-phase commit over Supabase + Next cache.
- Fitness: upsert per rij, **geen** delete-all-voor-dag (voorkomt dataverlies bij partiële batch).

**Eerlijk:** safety = clone → mutate → diff + throw-before-success. Bij concurrent writes kan optimistic lock falen (schema_version mismatch).

## 3. Integriteitscontrole

Pure functie: `collectMatchIntegrityIssues(input)` — unit-tested, geen I/O.

| Code | Regel |
|------|-------|
| `goals_for_mismatch` | `goals_for === goalEventCount` (played) |
| `stats_goals_mismatch` | som stats.goals === goalEventCount |
| `stats_assists_mismatch` | som stats.assists === assistEventCount |
| `mvp_required` | MVP verplicht bij played |
| `mvp_not_in_selection` | MVP in selectie |
| `scheduled_*` | Geen events/stats/MVP bij niet-gespeeld |

Runtime gate: `verifyMatchIntegrity(db, matchId)` roept bovenstaande aan en gooit met eerste `message`.

### Abort vóór persist (scenario F)

Tests documenteren: bij mismatch roept de pipeline `collectMatchIntegrityIssues` aan **vóór** `assignStableGoalEventIds` / `writeClubDatabaseDiff`. Geen half-opgeslagen wedstrijd bij count-fout.

## 4. Idempotency — stable goal event ids

`assignStableGoalEventIds(incoming, previous, newId)`:

- Content key: `scorer|assist|minute|sort_order`
- Hergebruik `previous.id` bij match
- Nieuwe UUID alleen voor nieuwe/gewijzigde events

Voorkomt UUID-churn en duplicate-risk bij retry/dubbel-opslaan (scenario E).

## 5. Revalidation

Na elke club-mutatie: `revalidateClubDataAfterMutation()` — layout + ranking, selectie, wedstrijden, beheer, dynamische segmenten.

Wedstrijd-specifiek aanvullend: `MATCH_REVALIDATE_PATHS` (contract-export) — overlap met globale revalidate.

Flow:

```
mutateDb → writeClubDatabaseDiff → revalidateClubDataAfterMutation()
saveMatchAdminAction → (zelfde mutateDb-pad)
```

## 6. Audit & traceability

Elke admin-mutatie via `mutateDb` kan `before_snapshot`, `after_snapshot`, `verification` loggen naar `admin_logs`.

Wedstrijd-save logt o.a.:

- events (scorer, assist, sort_order)
- stats snapshot
- `mvp_player_id`
- verification core (counts, MVP id)

UI: `/beheer/audit-log` (Wijzigingslog).

## 7. Datacontrole-pagina (read-only)

`/beheer/data-integrity` — seizoensbrede checks zonder mutatie:

- goals_for vs events vs stat-som per gespeelde wedstrijd
- MVP aanwezig/ geldig
- orphan goal events / training attendance
- cancelled sessions met attendance
- stats zonder season membership (non-guest)

Success: **"Alles in orde"**. Geen auto-repair.

## 8. Correcties-workflow

`/beheer/disputes` — speler selecteren → breakdown uit events + `wotm_player_id` → direct link naar wedstrijd-editor met `returnTo`.

## 9. Testmatrix

| Scenario | Beschrijving |
|----------|--------------|
| A | 2 goals + assist, stats = events, clean |
| B | 0-0, MVP ok |
| C | 2→3 goals, stable id reuse + 1 new |
| D | MVP required; wissel MVP speler |
| E | Dubbele `assignStableGoalEventIds` → zelfde ids |
| F | goals mismatch → abort vóór persist |

Run: `npm run test:match-integrity` of `npm run test:admin-2`.

## 10. Bekende beperkingen

1. **Geen DB-envelope transactie** — meerdere row-upserts via diff; integriteit afgedwongen in applicatielaag.
2. **Post-verify in callback** — als diff-write slaagt maar verify faalt, is gedrag afhankelijk van error-propagation in `mutateDb` (throw vóór return).
3. **Datacontrole vs save-verify** — pagina-checks zijn read-only en kunnen afwijken van runtime verify (bijv. MVP-in-selectie check op pagina vs save).
4. **Fitness** — geen integriteitscontract gelijk aan wedstrijden; wel upsert-semantiek.
