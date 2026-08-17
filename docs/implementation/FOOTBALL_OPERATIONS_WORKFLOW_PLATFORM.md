# Football Operations — Workflow-First Platform

Zie ook:

- `FITNESS_RANKING_CONTRACT.md` (definitief)
- `OPERATIONS_COUNTDOWN_CONTRACT.md`
- `FOOTBALL_OPERATIONS_FINAL_CERTIFICATION.md` (live DB + E2E + screenshots)

## Informatiearchitectuur

| Laag | Route |
|------|-------|
| Cockpit | `/beheer` |
| Fitheid hub | `/beheer/fitheid` |
| Testdag | `/beheer/fitheid/[sessionId]` |
| Station | `/beheer/fitheid/[sessionId]/station/{sprint\|agility\|plank\|run}` |
| Ranking | `/ranking?view=wedstrijd\|fitheid\|historie\|seizoen` |

## Testdag stappen (UI)

1. Maak testmoment
2. Open station
3. Vul één waarde per speelster in
4. Controleer
5. Publiceer

## Countdowns

Centrale engine `src/lib/operations/countdown.ts` + `next-events.ts`.

## Dual rankings

Wedstrijd (seizoen) vs fitheid (sessie + seizoensoverzicht) — nooit één onverklaarde totaalscore.
