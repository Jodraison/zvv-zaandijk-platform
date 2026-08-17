# Admin 2.0 — Football Operations Control Center

**Datum:** 2026-07-29  
**Repo:** `platform/`  
**Status:** Uitgevoerd (fase 1)

---

## 1. Doel

Admin 2.0 is het coach-first beheerpaneel onder `/beheer`. Technische termen (Integrity, Disputes, Audit) zijn vervangen door Nederlandse labels. De shell, pagina-headers en ops-navigatie zijn geünificeerd; wedstrijdmutaties volgen een expliciet datacontract met pre-persist integriteitscontrole.

## 2. Architectuur

```
/beheer (layout)
├── requireAdmin + readResolvedSeasonId
├── BeheerShell (sidebar: primary + ops nav)
└── pagina's met AdminPageHeader + domeincomponenten
```

| Laag | Pad | Rol |
|------|-----|-----|
| Layout | `src/app/(site)/beheer/layout.tsx` | Auth, seizoen, shell |
| Shell | `src/components/admin/shell/beheer-shell.tsx` | Sidebar, mobiel menu, season-aware links |
| UI-primitives | `src/components/admin/shell/admin-ui.tsx` | `AdminPageHeader`, `AdminSection`, `AdminMetric`, `AdminSaveBar`, … |
| Nav-config | `src/lib/admin/beheer-nav.ts` | Coach-first labels + `withSeason()` |
| Mutaties | `src/lib/data/mutate.ts` | `clone → fn(draft) → writeClubDatabaseDiff → revalidate → audit` |
| Wedstrijdcontract | `src/lib/admin/match-save-contract.ts` | Canonieke bronnen, integriteit, stable goal ids |

## 3. Shell & navigatie

**Primaire nav** (`BEHEER_PRIMARY_NAV`): Overzicht, Wedstrijden, Spelers, Training, Fitheid, Seizoenen.

**Controle-nav** (`BEHEER_OPS_NAV`):

| Route | Label | Doel |
|-------|-------|------|
| `/beheer/data-integrity` | Datacontrole | Seizoensbrede consistentiecheck |
| `/beheer/disputes` | Correcties | Speler → bronwedstrijden → wedstrijd-editor |
| `/beheer/audit-log` | Wijzigingslog | `admin_logs` met voor/na + verificatie |

Seizoen wordt via cookie/URL doorgegeven (`withSeason`). Actieve route via `isBeheerNavActive`.

## 4. Dashboard (`/beheer`)

- `AdminPageHeader` met snelle acties (wedstrijd plannen, uitslag invoeren)
- `AdminMetric`-tegels: eerstvolgende/laatste wedstrijd, incomplete wedstrijden, training, spelers
- Links naar wedstrijden, spelers, training, fitheid, datacontrole

## 5. Wedstrijden

- Lijst + detail-editor onder `/beheer/wedstrijden` en `/beheer/wedstrijden/[matchId]`
- Save via `saveMatchAdminAction` → `mutateDb` + post-verify (`verifyMatchIntegrity`)
- Goals/assists afgeleid van events (`aggregateStatsFromGoals`); MVP via `wotm_player_id`
- Stable goal event ids bij her-opslag (`assignStableGoalEventIds`)
- Spelerkaart linkt naar **Correcties** (`/beheer/disputes?player=…`)

## 6. Spelers

- `/beheer/spelers` — selectie beheren, gasten, foto's
- `PlayerEditCard` — link **Correcties** i.p.v. "DISPUTE BREAKDOWN"
- Mutaties via `mutateDb` + audit

## 7. Training

- `/beheer/training` — `AdminPageHeader` + `TrainingAttendanceDashboard`
- Bulk aanwezigheid (ma/wo workflow), batch opslaan via training actions

## 8. Fitheid

- `/beheer/fitheid` — testmomenten en historie
- **Upsert per speelster** — geen day-wipe bij partiële her-opslag (`saveFitnessBatchFormAction`)
- Analytics herberekend in-memory vóór diff-write

## 9. Toegankelijkheid (a11y)

- `AdminStatusBadge`: `role="status"` + `aria-live="polite"`
- Shell: `aria-label` op nav, `aria-expanded` op mobiel menu
- Focus-visible outlines op nav-links en metric-links
- Formulieren: min-height 44px touch targets, labels gekoppeld

## 10. Tests

| Script | Bestand(en) |
|--------|-------------|
| `npm run test:admin-nav` | `src/lib/admin/beheer-nav.test.ts` |
| `npm run test:match-integrity` | `match-save-contract.test.ts` + `match-integrity-scenarios.test.ts` |
| `npm run test:admin-2` | beide bovenstaande |

Scenario's A–F in `match-integrity-scenarios.test.ts` dekken goals/assists/MVP, 0-0, stable ids, MVP-regels, idempotency en abort vóór persist.

## 11. Runtime-screenshots

Lokale bewijsreeks (niet committen): `.review-screenshots/admin-2-0/`.

Galerij: `/review/admin-ui/*` — zelfde pagina-exports als `/beheer`, alleen actief met `ADMIN_UI_PREVIEW=1` (layout `notFound` + middleware redirect anders). Script: `scripts/admin-2-0-screenshots.mjs`.

## 12. Openstaande punten

| Punt | Status |
|------|--------|
| Volledige Postgres RPC-transactie over alle club-tabellen | **Niet geïmplementeerd** — safety via clone+mutate+diff |
| Post-verify gooit vóór success-return | **Geïmplementeerd** in `verifyMatchIntegrity` |
| Playwright E2E met echte admin-login + write → publieke pagina | **Niet geautomatiseerd** — unit/scenario A–F + review-UI screenshots |
| Real-time collaborative editing | Niet gepland |
| Academy admin UI onder `/beheer` | Uitgesteld (academy publiek verborgen) |
| Engelse restlabels in oudere formulieren (GK/DEF, "Card note") | Incrementeel Dutchify |
| `integrity_state` batch repair UI | Alleen datacontrole-pagina; geen auto-fix |

## 13. Gerelateerde documentatie

- [ADMIN_2_0_DATA_INTEGRITY_CONTRACT.md](./ADMIN_2_0_DATA_INTEGRITY_CONTRACT.md) — canonieke bronnen, atomicity, idempotency, revalidation
- [FITNESS_ADMIN_WP01_ACADEMY_VISIBILITY.md](./FITNESS_ADMIN_WP01_ACADEMY_VISIBILITY.md) — Academy publiek verborgen (niet heropend)
