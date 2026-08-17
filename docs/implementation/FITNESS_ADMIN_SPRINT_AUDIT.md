# FITNESS & ADMIN PRIORITEITSSPRINT — FORENSISCHE AUDIT

**Datum:** 2026-07-29  
**Scope:** Academy publiek verbergen · fitheidstest · ranking · adminworkflow  
**Status:** Audit only — geen productimplementatie uitgevoerd  
**Productrepo:** `platform/` (`zvv-zaandijk-platform`)  
**Workspace root:** `zvv-app-clean` (geen git; git leeft in `platform/`)

---

## 1. Repositorywerkelijkheid

### 1.1 Workspace vs product

| Locatie | Rol |
|---------|-----|
| `zvv-app-clean/` | Workspace-root; **geen** `.git` |
| `platform/` | Productieve Next.js-app + Supabase-migraties + docs (**git repo**, branch `master`) |
| `frontend/` | Aparte Vite/React-app; **niet** de productieve ZVV-clubapp voor deze sprint |

### 1.2 Stack (evidence uit `platform/package.json`)

| Onderdeel | Werkelijkheid |
|-----------|---------------|
| Package manager | **npm** (`package-lock.json` aanwezig; geen pnpm/yarn) |
| Framework | Next.js **15.5.14** (App Router), React **19.1**, TypeScript **5.8** |
| Styling | Tailwind CSS **4.1** (`@tailwindcss/postcss`) |
| Backend data | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) + in-memory/club DB via `src/lib/data/*` |
| Validatie | Zod **3.25** |
| State (UI) | Zustand **5** |
| Charts | Recharts **2.15** |
| Auth | Supabase Auth; admin via hardcoded e-mail in `src/lib/auth/is-admin.ts` |
| Migraties | `platform/supabase/migrations/001` … `024` (SQL-bestanden) |
| Tests | Geen Vitest/Jest; Academy foundation via `tsx` scripts (`npm run test:academy-foundation`) |
| Scripts | `lint`, `typecheck`, `build`, `import:fitness`, `audit:club`, season-scripts |

### 1.3 Commando’s (preflight uitgevoerd)

| Check | Commando | Exit | Resultaat |
|-------|----------|-----:|-----------|
| Lint | `npm run lint` | 0 | PASS (26 bestaande warnings, 0 errors) |
| Typecheck | `npm run typecheck` | 0 | PASS |
| Build | `npm run build` | 0 | PASS (Next 15.5.14, 74 routes) |

### 1.4 Git-status (`platform/`, branch `master`)

**Niet-gecommitte wijzigingen (bestaand, niet door deze audit):**

- Modified: `next-env.d.ts`, `tsconfig.json`, `tsconfig.tsbuildinfo`
- Modified (Academy/tactical): `src/lib/academie/tactical-animation-registry.ts`, `tactical-authored-lookup.ts`, `tactical-game-model.ts`
- Untracked: `.next-c006-build/` … `.next-d002-build/`, `.review-screenshots/`, Decision Lab docs artifacts

**Beoordeling:** Repository is **bruikbaar** voor verdere sprintwerkzaamheden, mits bestaande Academy-wijzigingen **niet** worden overschreven of meegenomen zonder expliciete keuze. Geen destructieve acties op user changes.

### 1.5 Live DB via Postgres MCP

Postgres MCP in deze Cursor-omgeving is gekoppeld aan **Convertly** (andere product: `scans`, `merchants`, …). **Geen live ZVV `fitness_tests`-inspectie mogelijk.** Databasewerkelijkheid hieronder is afgeleid uit migraties + TypeScript-types + app-code.

---

## 2. Academy-audit

### 2.1 Twee aparte Academy-oppervlakken

| Mount | Pad | Product | Publieke zichtbaarheid |
|-------|-----|---------|------------------------|
| Legacy / Decision Lab | `/academie` | `src/app/(site)/academie/*`, `src/lib/academie/*`, `src/components/academie/*` | **Altijd in nav**; geen feature flag |
| Football Academy MVP | `/academy` | `src/app/(site)/academy/*`, `src/lib/academy/*` | Achter `ACADEMY_ENABLED` (default **OFF**) |

`isAcademyPath("/academie") === false` — mounts zijn bewust gescheiden (`src/lib/academy/feature-flag.ts`).

### 2.2 Routes

**`/academy` (MVP, gateg):** root, positie, situatie(+poort/sub), probleem(+slug), wedstrijd(+fase), seizoen(+reflecties/speelboek), zoek, content/[pb], oefening/[ex], reflectie/[match], onboarding/*, team/captain|trainer.

**`/academie` (publiek):** home, `[category]`, `[category]/[topic]`, `decision-lab`, `decision-lab/[sessionId]`.

Build-manifest bevestigt beide trees (zie `npm run build` route table).

### 2.3 Publieke verwijzingen

| Surface | Evidence | Academie | Academy MVP |
|---------|----------|----------|-------------|
| Desktop + mobiele nav | `src/components/layout/app-shell.tsx` `baseNav` | **Ja** → `/academie` | Alleen als `academyEnabled` |
| Homepage tegels | `src/app/(site)/page.tsx` | Nee | Nee |
| Footer | Geen footer-component | — | — |
| Beheer | Geen Academy-links | Nee | Nee |
| Interne links | Decision Lab / academie-componenten | Zelf-links | Shell-intern |

### 2.4 Feature flags

Bestaand patroon: **module-local `envFlag()`**, niet een centraal `features={}` object.

| Flag | Bestand | Gedrag |
|------|---------|--------|
| `ACADEMY_ENABLED` | `src/lib/academy/feature-flag.ts` | Nav-link + middleware + layout voor `/academy` |
| `ACADEMY_OFFLINE` | `src/lib/academy/offline-flag.ts` | Banner only |
| `MAINTENANCE_MODE` | `src/lib/maintenance.ts` | Site-wide |

**Geen flag voor `/academie`.**

Voorgesteld `features = { academyEnabled, academyPublicVisible, academyAdminVisible }`:

- `academyEnabled` ≈ bestaande `ACADEMY_ENABLED` (`/academy`)
- `academyPublicVisible` = **nieuw** nodig voor `/academie` nav + optioneel middleware
- `academyAdminVisible` = **geen Academy-admin-UI** vandaag; flag is voorbarig

**Aanbeveling:** bestaande `envFlag`-patroon uitbreiden (bijv. `ACADEMIE_PUBLIC_VISIBLE`), **niet** `/academie` in `isAcademyPath` trekken (breekt foundation-tests).

### 2.5 Directe bereikbaarheid & SEO

| Mount | Flag OFF | Directe URL |
|-------|----------|-------------|
| `/academy/*` | Redirect `/` via middleware + `requireAcademyAccess` | Geblokkeerd |
| `/academie/*` | N/A | **Altijd bereikbaar** |

- Geen `sitemap.ts` / `robots.ts` / `public/robots*`
- `/academie` pages hebben `metadata` met “Football Academy”
- SEO-hide vereist meer dan nav-verwijdering: middleware redirect en/of `noindex`

### 2.6 Tests bij publiek verbergen

- Nav-only hide van `/academie`: **geen** dedicated nav-tests gevonden → laag risico
- `isAcademyPath` uitbreiden naar `/academie`: **breekt** `feature-flag.test.ts`, `route-foundation.test.ts`, e.a.
- Academy-code/tests behouden door alleen gating — geen delete

### 2.7 Veiligste verbergstrategie (code behouden)

1. Conditioneer `baseNav` entry `{ href: "/academie", label: "Academie" }` op nieuwe public-flag (default OFF).
2. Middleware: als public-flag OFF en path `/academie…` → redirect `/` (spiegel `/academy`).
3. Optioneel `robots`/`noindex` op academie-layouts.
4. Laat `ACADEMY_ENABLED` ongemoeid (MVP blijft default OFF).
5. Verwijder geen routes, components, docs of tests.
6. Heractivatie: flag weer ON → nav + routes terug.

---

## 3. Fitheidsdomein

### 3.1 Bestandsoverzicht (kern)

| Pad | Functie | Status | Herbruikbaarheid |
|-----|---------|--------|------------------|
| `src/app/(site)/fitheid/page.tsx` | Publieke fitheid (podium, progressie) | Actief | Hoog (UI-shell) |
| `src/app/(site)/beheer/fitheid/page.tsx` | Admin batch + tabel | Actief | Hoog |
| `src/components/admin/fitness-batch-form.tsx` | Batch totale tijd | Actief; dataverliesrisico | Medium — herschrijven opslag |
| `src/components/admin/fitness-admin-table.tsx` | Edit 20/40/60 + delete | Actief; geen confirm | Medium |
| `src/actions/fitness.ts` | save/update/delete | Actief; batch wipe | Kern — moet wijzigen |
| `src/lib/fitness-analytics.ts` | total/progress/`session_rank` | Actief SSOT analytics | Kern — uitbreiden |
| `src/lib/fitness/parse-time-input.ts` | Admin time parse | Actief | Hoog |
| `src/lib/validations/forms.ts` | Zod batch/update | Actief; 1 type | Kern |
| `src/types/index.ts` | `FitnessTest`, `sprint_20_40_60` | Actief | Kern |
| `src/lib/data/supabase-db.ts` | Load/map fitness | Actief | Hoog |
| `src/scripts/import-fitness.ts` | CLI import | Actief | Medium (protocol wijzigt) |
| `data/import-fitness.txt` | Historische sprinttotals | Actief | Behoud als archive |
| `src/components/fitness/fitness-explorer.tsx` | Chart explorer | **Dead code** (niet geïmporteerd) | Optioneel |
| `src/app/(site)/ranking/page.tsx` | Goals/assists/WOTM | **Geen fitheid** | Niet hergebruiken voor fitheid |
| `supabase/migrations/005_*.sql` | Schema reshape | Toegepast (migratie) | Historisch |
| `supabase/migrations/008_*.sql` | total/progress/rank | Toegepast | Historisch |
| `src/lib/db/schema.sql` | Legacy schema dump | **Stale** t.o.v. 005/008 | Niet vertrouwen |

**Geen unit tests** voor fitness/ranking. Closest: `src/scripts/audit-club-data.ts`.

### 3.2 Huidige tests (exact)

| UI-naam | `test_type` | Velden | Eenheid |
|---------|-------------|--------|---------|
| Fitheidstest 20-40-60m | `sprint_20_40_60` (enige) | `sprint_20m`, `sprint_40m`, `sprint_60m`, `total_time` | seconden |

Definities: **hardcoded** in types, Zod, DB CHECK — geen testdefinitie-tabel.

**Niet aanwezig:** 30m + 10m vliegende start, agility 10-20-10, plank, 6-minutenloop, concept/publicatie, gewogen multi-test ranking.

### 3.3 Invoerflow

1. **Batch** (`saveFitnessBatchFormAction`): één totaaltijd per speelster; lege cellen overgeslagen; **verwijdert alle rijen voor season+date**, insert alleen submitted; zet `sprint_* = 0`.
2. **Edit** (`updateFitnessSprintFormAction`): drie aparte sprints; `total_time = som`.
3. **Import** (`import:fitness`): `mm:ss,xx` totalen uit `data/import-fitness.txt` (26-01-2026, 11-02-2026).

Testmoment = gedeelde `test_on` (geen session-entity). Seizoen via `season_id` + header `SeasonSwitcher`. Incomplete = geen rij. `note` bestaat maar UI bewerkt het niet. Geen draft. Delete zonder confirm.

### 3.4 Validatie

- Batch: `parseTimeInput` + Zod `(0, 9999)` seconden
- Update: elk sprint `(0, 999)`, max 2 decimalen
- Import: strikt `mm:ss,xx`

### 3.5 Mobile

Admin-tabellen `min-w-[640px]`/`720px` + horizontal scroll — niet pitch-side geoptimaliseerd. Geen Enter→volgend veld, geen paste.

---

## 4. Databasewerkelijkheid

### 4.1 Evolutie

| Migratie | Effect |
|----------|--------|
| `001_club_schema.sql` | Legacy: `test_type IN (sprint_20m, sprint_30m, custom)`, `time_seconds` |
| `003_security_lockdown.sql` | RLS: `ft_select` (public read), `ft_admin_all` (profiles.role=admin) |
| `005_fitness_sprint_20_40_60.sql` | **DELETE alle fitness_tests**; kolommen `test_on`, `sprint_20/40/60`; CHECK alleen `sprint_20_40_60`; UNIQUE `(player_id, season_id, test_on)` |
| `008_fitness_total_progress_rank.sql` | `total_time`, `progress_status`, `progress_delta`, `session_rank` (1–3) |

### 4.2 Huidig model (app + migraties)

```text
fitness_tests
  id uuid PK
  season_id → seasons (CASCADE)
  player_id → players (CASCADE)
  test_type text CHECK = 'sprint_20_40_60'
  test_on date NOT NULL
  sprint_20m / sprint_40m / sprint_60m numeric(6,2) NOT NULL
  total_time numeric(8,2) NOT NULL
  recorded_at timestamptz
  note text
  progress_status text NULL | improved|declined|equal|no_previous
  progress_delta numeric
  session_rank int NULL | 1..3
  UNIQUE (player_id, season_id, test_on)
```

Geen views/triggers/DB-functions voor ranking. Analytics via app: `recomputeFitnessAnalyticsInDb`.

### 4.3 Auth-discrepantie (belangrijk)

- **App-admin:** hardcoded `ADMIN_EMAIL = "jodraison@hotmail.com"` (`is-admin.ts`)
- **RLS admin:** `profiles.role = 'admin'`
- Mutations lopen via server actions + waarschijnlijk service/privileged path (`mutateDb`) — dual model moet bij coach-rollen expliciet worden ontworpen

### 4.4 Historische data

- Importbestand bevat echte seizoensmetingen (jan/feb 2026) als **één totale sprintduur** (mm:ss), niet als 4 nieuwe onderdelen
- Migratie 005 heeft oudere legacy-rijen al gewist
- Overlappende modellen: legacy SQL dumps vs live 005/008; **één** actief app-model (`sprint_20_40_60`)
- Ruwe resultaten: vaak alleen `total_time` betrouwbaar; componenten 0 bij batch/import
- Berekende scores: `progress_*`, `session_rank` — reproduceerbaar vanuit raw times **zolang** analytics-code stabiel is; herberekening overschrijft denormalized velden

### 4.5 Seizoenswissels

Rijen zijn season-scoped; cascade bij season delete. Geen cross-season ranking. Filter via `readResolvedSeasonId`.

---

## 5. Rankingforensiek

### 5.1 Kritische splitsing

| Route | Domein |
|-------|--------|
| `/ranking` + `src/lib/queries/ranking.ts` | Wedstrijd: goals → assists → WOTM |
| `/fitheid` + `fitness-analytics.ts` | Sprint totaaltijd (lager = beter) |

**Fitheid zit niet in `/ranking`.**

### 5.2 Werkelijke keten

```text
ruwe invoer (totaaltijd of 20/40/60)
→ Zod / parseTimeInput
→ opslag in fitness_tests (batch: wipe day + insert)
→ fitnessTotalSeconds(total_time > 0 ? total_time : som)
→ progressFromTotals(prev, curr)  [EPS 0.015]
→ session_rank top-3 op laatste test_on (sort time, tie-break player_id)
→ publieke UI herberekening (dense tie ranks; EPS 0.05 voor delta-label)
→ weergave podium / teamkaarten / spelersprofiel
```

Geen normalisatie, gewichten, percentielen of samengestelde multi-test score.

### 5.3 Antwoorden (18 vragen)

1. **Onderdelen:** alleen effectieve sprint-totaaltijd  
2. **Centrale logica:** `src/lib/fitness-analytics.ts` (`fitnessTotalSeconds`, `progressFromTotals`, `recomputeFitnessAnalyticsInDb`); UI herhaalt sort in `fitheid/page.tsx`  
3. **Richting:** lager beter (tijd)  
4. **Eenheden:** alles seconden; geen multi-unit compare  
5. **Ontbrekend:** geen rij → niet gerankt  
6. **Als nul?** Nee — ontbrekend = absent, niet score 0  
7. **Ties:** stored rank breekt via `player_id`; UI deelt dense ranks  
8. **Speelsters:** seizoensleden met meting op laatste `test_on`  
9. **Actief seizoen:** via season resolver; ranking binnen `season_id`  
10. **Inactief/archive:** geen archive-flag in fitness-pad; guests niet gefilterd op beheer-fitheid  
11. **Momenten mixen:** podium = alleen **laatste** `test_on`; progress = vorige meting zelfde speelster chronologisch  
12. **Opslag:** raw + denormalized progress/rank; UI herberekenend  
13. **Normwijziging:** geen normen; code-wijziging + recompute kan `progress_*`/`session_rank` herschrijven  
14. **Ruwe uitslag:** `total_time` / sprints bewaard (componenten vaak 0)  
15. **Individuele progressie:** ja (status + delta)  
16. **PR / teamgemiddelde:** “Snelste sprinttest” in `records.ts`; team summary in `team-development.ts`; geen multi-test PR  
17. **Duplicatie:** total-seconds + progress EPS (0.015 vs 0.05) + rank-algoritme (stored vs UI)  
18. **Tests:** geen unit tests; runtime `audit-club-data.ts`

---

## 6. Adminaudit

### 6.1 Architectuur

- Guard: `beheer/layout.tsx` → `requireAdmin` → single email  
- Geen beheer sub-nav, breadcrumbs, of quick actions in layout  
- Season via globale `SeasonSwitcher`  
- Dashboard: `beheer/page.tsx` tegels (teamfoto boven workflows; Engelse ops-labels)

### 6.2 Fitheidsworkflow vs coach-vraag

> Kan de hoofdtrainer dit tijdens training snel, foutarm, zonder technische kennis?

**Nee.** Blokkades: single-admin e-mail; batch wipe; create≠edit model; geen draft/review; geen incomplete/injured; tablet/toetsenbord zwak; delete zonder confirm.

### 6.3 UX-problemen (evidence)

| Probleem | Evidence |
|----------|----------|
| Batch wipe same-day | `actions/fitness.ts` L48: filter weg alle rows season+date |
| Create total / edit splits | batch zet sprints=0; update eist sprints>0 |
| Misleidende knoptekst | “Meting opslaan (alle speelsters)” vs alleen filled rows |
| Guests in roster | beheer fitheid filtert `is_guest` niet (training wel) |
| Geen confirm delete | `FitnessAdminTable` |
| Geen draft/autosave/beforeunload | client state only |
| Direct publiek | recompute → `/fitheid` live |
| Desktop table | `min-w` scroll |
| Note unused | kolom bestaat, UI niet |

**Referentiepatroon:** `TrainingAttendanceDashboard` (session chips, draft, guest filter, bulk save).

---

## 7. Gewenste workflow vs huidige werkelijkheid

| Stap | Gewenst | Huidig |
|------|---------|--------|
| 1 Open Fitheid | Trainer | Alleen ADMIN_EMAIL |
| 2 Testmoment | Entity | Alleen date field |
| 3 Seizoen + datum | Expliciet | Season global + date |
| 4 Auto roster | Ranking-eligible | Alle memberships (+guests) |
| 5 Snelle invoer | Pitch-side | Wide table |
| 6 Per speelster/onderdeel | Beide | Create total XOR edit splits |
| 7 Tussentijds opslaan | Veilig | Destructive replace |
| 8 Incomplete markeren | Ja | Nee |
| 9 Scores na afronding | Na complete | Direct |
| 10 Review vóór zichtbaar | Ja | Nee |

**UI-vorm kandidaat:** hybrid (training session chrome + spreadsheet), geen wizard tenzij multi-onderdeel wizard later nodig blijkt. Definitieve keuze in implementatiefase na WP-ontwerp.

---

## 8. Gap-analyse (datamodeldoelen)

| Vereiste | Bestaat | Status | Benodigde wijziging |
|----------|---------|--------|---------------------|
| Testmoment per datum | Deels (`test_on`) | Partial | Session/status entity of expliciete moment-tabel |
| Koppeling seizoen | Ja | OK | Behouden |
| Koppeling speelster | Ja | OK | Behouden + guest-filter |
| 4 testonderdelen (nieuw) | Nee | Missing | Schema + types + UI |
| Sprint seconden (30m+10m) | Nee (20/40/60) | Replace | Migratie + mapping legacy |
| Agility seconden | Nee | Missing | Nieuw veld/rij |
| Plank seconden | Nee | Missing | Nieuw |
| 6-min loop meters | Nee | Missing | Nieuw (andere eenheid) |
| Ruwe resultaten | Deels | Partial | Altijd raw per onderdeel; geen zero-padding als placeholder |
| Ontbrekende onderdelen | Nee | Missing | NULL/absent + reden |
| Opmerking/reden | Deels (`note`) | Partial | UI + per-onderdeel optioneel |
| Traineropmerking | Nee | Missing | Veld op moment |
| Conceptstatus | Nee | Missing | draft\|published |
| Controle vóór publicatie | Nee | Missing | Publish flow |
| Historie | Ja | OK | Behouden; niet overschrijven door scoreconfig |
| Vorige test | Ja (progress) | OK | Uitbreiden per onderdeel |
| Persoonlijk record | Deels (snelste total) | Partial | Per onderdeel + totaal |
| Teamgemiddelde | Deels | Partial | Per onderdeel |
| Score per onderdeel | Nee | Missing | Ranking engine |
| Totaalscore | Nee (alleen tijd) | Missing | Gewogen score |
| Rankingpositie | Deels (top-3) | Partial | Volledige ranking |
| Configureerbare gewichten | Nee | Missing | Scoreconfig tabel/versie |
| Reproduceerbare scores | Deels | Partial | Snapshot scoreconfig bij publish |
| Historische raw behouden | Deels | Risk | Immutability rules + no wipe |

---

## 9. Risicoanalyse

| ID | Niveau | Domein | Bevinding | Impact | Waarschijnlijkheid | Aanbevolen maatregel |
|----|--------|--------|-----------|--------|--------------------|----------------------|
| R01 | CRITICAL | Fitheid data | Batch save wist alle same-day rows | Dataverlies tijdens training | Hoog | Upsert per speelster; never day-delete |
| R02 | CRITICAL | Fitheid model | Create total vs edit 20/40/60 mismatch | Corrupte semantiek | Hoog | Één canonical entry model |
| R03 | CRITICAL | Historie | Nieuwe 4-test protocol vs bestaande sprint_20_40_60 | Verlies/verwarring historie | Hoog | Legacy protocol behouden + nieuw protocol; geen blind overwrite |
| R04 | HIGH | Auth | Single ADMIN_EMAIL; coach kan niet | Sprint onbruikbaar | Hoog | Coach-rol beslissing + implementatie |
| R05 | HIGH | Ranking | Geen multi-test engine; `/ranking` ≠ fitheid | Verkeerde productverwachting | Zeker | Nieuwe engine + duidelijke UX-scheiding |
| R06 | HIGH | Academy | `/academie` altijd publiek + URL | Academy blijft zichtbaar | Zeker | Flag + nav + middleware |
| R07 | HIGH | Migratie | 005-achtige DELETE-migratie herhalen | Historisch dataverlies | Medium | Additive migraties; backfill plan |
| R08 | HIGH | Admin UX | Geen draft/publish | Voortijdige publicatie | Hoog | Concept → review → publish |
| R09 | MEDIUM | Auth/RLS | App email vs profiles.role | Toegangsbugs | Medium | Eén autorisatiemodel documenteren |
| R10 | MEDIUM | Ranking | Tie-break stored ≠ UI | Inconsistente podium | Medium | Één ranking helper |
| R11 | MEDIUM | Progress | EPS 0.015 vs 0.05 | UI vs DB status mismatch | Medium | Gedeelde constanten |
| R12 | MEDIUM | Roster | Guests in fitheid-admin | Verkeerde deelnemers | Medium | Filter zoals training |
| R13 | MEDIUM | Delete | Geen confirm | Accidentele delete | Medium | ConfirmSubmitForm |
| R14 | MEDIUM | Git | Uncommitted Academy changes | Merge/conflict risico | Medium | Niet aanraken; aparte branches |
| R15 | MEDIUM | SEO | Geen sitemap; metadata blijft | Crawl van /academie | Medium | noindex/middleware |
| R16 | MEDIUM | Tests | Geen fitness unit tests | Regressies onopgemerkt | Hoog | Testmatrix verplicht in WPs |
| R17 | LOW | Dead code | fitness-explorer ongebruikt | Ruis | Laag | Later opruimen of hergebruiken |
| R18 | LOW | Stale SQL | schema.sql out of sync | Verkeerde docs | Laag | Markeren/stale of sync |
| R19 | LOW | Academy MVP | ACADEMY_ENABLED default OFF | Al veilig verborgen | Laag | Ongewijzigd laten |
| R20 | MEDIUM | Live DB | Postgres MCP ≠ ZVV | Audit zonder live row counts | Zeker | ZVV DB read-only check vóór migratie |

---

## 10. Implementatiewerkpakketten

Voorlopige volgorde behouden; WP0 toegevoegd vanwege bestaande dirty tree + datawipe-risico.

### WP-0 — Repository- en databescherming

**Doel:** Veilige baseline vóór productwijzigingen.  
**Waarom nu:** Uncommitted Academy-wijzigingen + CRITICAL batch-wipe; geen live ZVV DB-check.  
**Afhankelijkheden:** Geen.

**Bestanden**
- Bestaand: geen verplicht; optioneel audit notities
- Nieuw: dit document (al aanwezig)
- Wijzigingen: **geen productcode** in WP-0 behalve expliciete freeze-afspraak

**Database-impact:** geen.

**Implementatietaken**
1. Bevestig branchstrategie t.o.v. dirty `academie/*` files  
2. Export/backup `fitness_tests` (productie) vóór schemawerk  
3. Documenteer dual auth (email vs RLS)

**Acceptatiecriteria**
- Backup/export procedure vastgelegd  
- Afspraak: user dirty files onaangetast  

**Tests:** `git status` snapshot; geen productregressie.  
**Risico’s:** R14, R20.  
**Bewijs:** status output; backup artifact pad.

---

### WP-1 — Academy veilig publiek verbergen

**Doel:** `/academie` uit publieke ontdekking + directe bereikbaarheid; code behouden.  
**Waarom nu:** Snelle, lage schema-impact; seizoenprioriteit.  
**Afhankelijkheden:** WP-0.

**Bestanden**
- Bestaand: `app-shell.tsx`, `middleware.ts`, `(site)/layout.tsx`, `lib/academy/feature-flag.ts` (patroon), academie layouts metadata
- Nieuw: bijv. `src/lib/academie/public-visibility.ts` (of uitbreiding naast academy flag)
- Wijzigingen: nav conditioneel; middleware redirect; tests

**Database-impact:** geen.

**Implementatietaken**
1. Env flag `ACADEMIE_PUBLIC_VISIBLE` (default false) via `envFlag`  
2. Verwijder/conditioneer `baseNav` Academie-link  
3. Middleware: `/academie` → `/` wanneer OFF  
4. Optioneel `robots: noindex` op academie layout  
5. Documenteer heractivatie  
6. **Niet** `isAcademyPath` verbreden

**Acceptatiecriteria**
- Geen nav-link; directe URL redirect; `/academy` ongewijzigd; code/tests aanwezig; flag ON herstelt

**Tests:** foundation suite ongewijzigd gedrag; nieuwe visibility tests; smoke routes.  
**Risico’s:** R06, R15, R19.  
**Bewijs:** curl/route checks; screenshots nav; `test:academy-foundation`.

---

### WP-2 — Database & domeinmodel (nieuw fitheidsprotocol)

**Doel:** Additive model voor 4 onderdelen + testmomentstatus; legacy sprint behouden.  
**Waarom nu:** Zonder model geen veilige ranking/UI.  
**Afhankelijkheden:** WP-0 (backup).

**Bestanden**
- Nieuw migratie `025_…sql` (naam TBD)
- Types `src/types/index.ts`
- Mappers `supabase-db.ts`, validations

**Database-impact:** migratie (additive); indexes; RLS align; **geen DELETE van historische sprint rows**; rollback = drop nieuwe objecten.

**Implementatietaken**
1. Ontwerp: `fitness_test_sessions` (season, date, status draft/published, notes) + `fitness_test_results` (player, session, component, raw_value, unit, absent_reason) **OF** widen-row met nullable columns + status — keuze in open beslissing D1  
2. Scoreconfig versietabel (weights) gescheiden van raw  
3. Legacy `sprint_20_40_60` read-compatible laten  
4. Backfill: bestaande rows markeren als protocol `legacy_sprint_20_40_60`

**Acceptatiecriteria**
- Historische sprintdata leesbaar  
- Nieuwe 4 onderdelen opslaanbaar  
- Draft/published ondersteund  
- Raw immutability t.o.v. weight changes

**Tests:** migratie up/down (dev); constraints; RLS smoke.  
**Risico’s:** R03, R07, R20.  
**Bewijs:** migratie SQL; sample rows; rollback notes.

---

### WP-3 — Centrale validatie

**Doel:** Eén Zod/parsers SSOT voor 4 onderdelen + absent.  
**Afhankelijkheden:** WP-2.

**Bestanden:** `validations/forms.ts`, `parse-time-input.ts`, nieuwe `lib/fitness/validate-result.ts`.

**Database-impact:** geen.

**Implementatietaken:** ranges per onderdeel; units; decimal rules; negative/unrealistic guards; comments.

**Acceptatiecriteria:** ongeldige input geweigerd; absent zonder fake zeros.

**Tests:** unit tests validatie-matrix.  
**Risico’s:** R02.  
**Bewijs:** test output.

---

### WP-4 — Fitheidstestbeheer (admin invoer)

**Doel:** Coach kan ~16 speelsters in ~30 min veilig invoeren.  
**Afhankelijkheden:** WP-2, WP-3; idealiter R04-besluit (coach access).

**Bestanden**
- `beheer/fitheid/page.tsx`, batch/table components, `actions/fitness.ts`
- Patroon hergebruik: `training-attendance-dashboard.tsx`

**Database-impact:** geen schema (gebruikt WP-2); schrijfpad verandert.

**Implementatietaken**
1. Vervang day-delete door upsert  
2. Hybrid UI: moment → grid onderdelen  
3. Draft save; incomplete badges; injured/skip  
4. Confirm delete; guest filter  
5. Keyboard: Enter/Tab flows  
6. Publish pas in WP-6/7 of hier gated

**Acceptatiecriteria:** geen wipe; tussentijds opslaan; incomplete zichtbaar; mobiel bruikbaar.

**Tests:** action integration; UX checklist.  
**Risico’s:** R01, R08, R12, R13.  
**Bewijs:** screenshots laptop/tablet; save logs.

---

### WP-5 — Centrale rankingengine

**Doel:** Configureerbare, reproduceerbare scores voor 4 onderdelen.  
**Afhankelijkheden:** WP-2, WP-3.

**Bestanden**
- Nieuw: `src/lib/fitness/ranking-engine.ts` (+ tests)
- Update: `fitness-analytics.ts` of deprecate legacy helpers voor nieuw protocol
- UI: `fitheid/page.tsx` consumeert engine (geen inline formulas)

**Database-impact:** optioneel materialized scores bij publish + `score_config_version_id`.

**Implementatietaken**
1. Richting: sprint/agility lager beter; plank/loop hoger beter  
2. Team-relatieve normalisatie als default (geen medische normclaims)  
3. Missing: exclude component of penalty — **open D2**  
4. Weights configureerbaar; historical publish locked to config version  
5. Tie-break deterministisch (documenteer)  
6. Verwijder duplicatie UI/stored

**Acceptatiecriteria:** ranking tests groen; weight change wijzigt geen gepubliceerde historische scores.

**Tests:** ranking matrix (zie §11).  
**Risico’s:** R05, R10, R11.  
**Bewijs:** golden fixtures.

---

### WP-6 — Adminverbeteringen (fitheid-gericht)

**Doel:** Beheer-navigatie en fitheid-hub coach-proof.  
**Afhankelijkheden:** WP-4.

**Bestanden:** `beheer/page.tsx`, optioneel `beheer`-nav component, copy/labels fitheid.

**Database-impact:** geen.

**Implementatietaken:** sub-nav/fitheid primary CTA; Nederlandse coach-copy; empty/loading/success states; unsaved warning.

**Acceptatiecriteria:** trainer vindt Fitheid ≤2 klikken; jargon weg.

**Tests:** a11y smoke; manual checklist.  
**Risico’s:** R04 (indien onopgelost blijft blocker).  
**Bewijs:** screenshots.

---

### WP-7 — Publieke / speelsters fitheidsweergave

**Doel:** `/fitheid` + spelersprofiel tonen nieuwe ranking/historie (alleen published).  
**Afhankelijkheden:** WP-5, WP-4 publish.

**Bestanden:** `fitheid/page.tsx`, `player-fitness-pro-module.tsx`, statistics hooks.

**Database-impact:** geen.

**Implementatietaken:** published-only; per-onderdeel + totaal; PR/delta/team avg; legacy sprint sectie of archive label.

**Acceptatiecriteria:** draft onzichtbaar publiek; historie intact.

**Tests:** route + data filters.  
**Risico’s:** R08.  
**Bewijs:** screenshots before/after publish.

---

### WP-8 — Validatie, regressie, documentatie

**Doel:** Guardrails + docs bijwerken.  
**Afhankelijkheden:** WP-1…WP-7.

**Bestanden:** tests, `docs/implementation/*`, production-test-matrix.

**Database-impact:** geen.

**Implementatietaken:** volledige testmatrix; lint/typecheck/build; Academy reactivate proof; ranking golden tests.

**Acceptatiecriteria:** matrix uitgevoerd; failures gedocumenteerd.

**Tests:** zie §11.  
**Risico’s:** R16.  
**Bewijs:** CI/local command log.

---

## 11. Testmatrix (verplicht bij implementatie)

### Technisch
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Unit: validatie, ranking-engine, time parse
- Integratie: fitness actions (draft/publish/upsert)
- Migratie up/down op dev DB
- Route checks `/academie`, `/academy`, `/fitheid`, `/beheer/fitheid`
- Auth: non-admin blocked; admin/coach allowed per besluit

### Fitheidsdata
Volledig / leeg / gedeeltelijk moment; missing per onderdeel; negatief; unrealistisch; decimalen; plank-seconden consistent; comments; draft; publish; historie; concept edit; weiger destructieve overwrite historie

### Ranking
Lager beter sprint/agility; hoger beter plank/loop; gelijke scores; missing component; gemiste test; weight change; config change; active/inactive/guest/no-membership/new/archived; PR; delta; team avg; per-onderdeel; totaal; deterministische tie-break

### Admin UX
Laptop/tablet/mobiel; toetsenbord; snelle invoer; dubbelklik save; unsaved navigate; validatiefout; succes; empty; loading; destructive confirm

### Academy
Geen publieke nav/CTA/tegel; sitemap/SEO gedrag; directe route redirect; admin N/A; code+tests behouden; heractivatie via flag

---

## 12. Open beslissingen

| ID | Beslissing | Waarom niet uit repo afleidbaar |
|----|------------|----------------------------------|
| D1 | Schema-vorm: session+results genormaliseerd vs wide row | Beide mogelijk; trade-off UX/query |
| D2 | Ontbrekend onderdeel: exclude vs penalty vs zero | Productkeuze |
| D3 | Ranking: team-relatief vs absolute norms | Geen officiële normtabellen in repo |
| D4 | Gewichten per onderdeel (defaults) | Niet gedefinieerd in code/docs |
| D5 | Coach/staff toegang voorbij single email | Alleen hardcoded owner vandaag |
| D6 | Legacy sprint publiek tonen naast nieuw protocol | Product/UX |
| D7 | Plank UI-invoer (mm:ss vs seconden) | Consistentie met tijdparsers |
| D8 | `/fitheid` vs aparte “Fitheidsranking” naming t.o.v. `/ranking` | Vermijd verwarring |

---

## 13. Aanbevolen eerstvolgende werkpakket

**WP-0 (bescherming), daarna WP-1 (Academy verbergen).**

Reden: WP-1 is schema-vrij, reverseerbaar via flag, dekt de eerste productprioriteit, en vermijdt conflict met dirty tactical files. WP-2 start pas na backup + open beslissingen D1/D3/D5 input van reviewchat.

**Deze audit start WP-0/WP-1 niet.**

---

## 14. Scopebevestiging (auditstap)

- Geen Academy-code verwijderd  
- Geen nieuwe Academy-inhoud  
- Geen selectie-/wedstrijd-/warming-up-/4231-werk  
- Geen brede publieke redesign  
- Geen destructieve DB-mutatie  
- Geen productimplementatie gestart  
- Alleen documentatie toegevoegd: `docs/implementation/FITNESS_ADMIN_SPRINT_AUDIT.md`
