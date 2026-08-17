# Fitness Control Center 2.0

**Datum:** 2026-07-30  
**Repo:** `platform/`  
**Status:** Geïmplementeerd (migratie additief; live DB mogelijk nog niet toegepast)

---

## 1. Probleem: totale tijd

Het legacyprotocol (`fitness_tests`) kent `total_time` als som van 20/40/60-sprint.  
Het **nieuwe** protocol heeft **vier onvergelijkbare eenheden** (seconden, seconden, seconden duur, meters). Die mogen nooit tot één “totale tijd” worden samengevoegd.

## 2. Vier losse waarden

| Onderdeel | Veld | Eenheid | Richting | Validatie |
|-----------|------|---------|----------|-----------|
| 30 m sprint (vliegende aanloop) | `flying_sprint_30m_seconds` | s | lager beter | > 0 of null |
| Agility 10-20-10 | `agility_10_20_10_seconds` | s | lager beter | > 0 of null |
| Plank | `plank_seconds` | s (intern); UI `1:45` of `105` | hoger beter | int > 0 of null |
| Zes minuten loop | `six_minute_run_meters` | m | hoger beter | int > 0 of null |

Geen `totalTime` / `total_time` op nieuwe resultaatrecords (`assertNoTotalTime`).

Leeg = `null` (niet afgenomen). `0` is ongeldig.

## 3. Datamodel (migratie 025)

Tabellen (additief, legacy onaangeroerd):

- `fitness_score_configs`
- `fitness_test_sessions` (`draft` | `published`)
- `fitness_test_results` (één rij per speelster per sessie)

Bestand: `supabase/migrations/025_fitness_protocol_v2.sql`

**Live status:** migratie is geschreven en lokaal/statisch gevalideerd. Productie is **niet** automatisch gemigreerd in deze sessie. Load-laag degradeert graceful naar lege arrays als tabellen ontbreken; writes geven NL-fout met migratiehint.

## 4. Concept / publicatie

1. Nieuw testmoment → `draft` + lege resultaatrijen  
2. Invoer + concept opslaan (upsert per speler)  
3. Controlescherm  
4. Definitief maken → `published` (read-only)  
5. Correctie openen → terug naar `draft` (audit via `mutateDb`)

Conceptresultaten horen niet in publieke ranking (rankingengine buiten scope).

## 5. Invoermodi

- **Per onderdeel** — tabs Sprint / Agility / Plank / 6 min  
- **Per speelster** — vier velden tegelijk  
Zelfde state; Enter → volgend veld; numeriek toetsenbord; komma/punt veilig.

## 6. Saveveiligheid

- Upsert per speelster/resultaat  
- Geen day-wipe  
- Geen legacy `DELETE FROM fitness_tests` door nieuw protocol  
- Dubbele speelster in payload geblokkeerd  

## 7. Legacy-afscheiding

Route: `/beheer/fitheid/legacy`  
Titel: Historische sprinttest 20 / 40 / 60 meter  
Primaire workflow blijft `/beheer/fitheid`.

## 8. Historie / ranking

Resultatentabel met correcte eenheden.  
Gewogen rankingengine: **niet** in deze fase (helpers/config-tabel voorbereid).

## 9. Tests

`npm run test:fitness` → `src/lib/fitness/fitness-protocol.test.ts`

## 10. UI-routes

| Route | Rol |
|-------|-----|
| `/beheer/fitheid` | Overzicht |
| `/beheer/fitheid/nieuw` | Concept aanmaken |
| `/beheer/fitheid/[id]` | Invoer |
| `/beheer/fitheid/[id]/controle` | Publicatiecontrole |
| `/beheer/fitheid/[id]/resultaten` | Leesoverzicht |
| `/beheer/fitheid/legacy` | Oud protocol |

## 11. Resterend

- Migratie 025 toepassen op live ZVV-Supabase  
- Optionele debounced autosave  
- Definitieve rankingengine (volgende fase)
