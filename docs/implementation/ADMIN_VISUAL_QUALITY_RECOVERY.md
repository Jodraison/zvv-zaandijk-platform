# Admin Visual Quality Recovery

**Datum:** 2026-07-30  
**Repo:** `platform/`

---

## 1. Tekortkomingen vóór

- Grote witte headerkaarten met lage informatiedichtheid  
- Micro-uppercase “NAVIGATIE”  
- Spelerspagina opende direct enorme formulieren  
- Training toonde tientallen sessietegels  
- Fitheid toonde roadmap-/WP-tekst  
- Technische formlabels (ENUM, card note, …)

## 2. Centrale verbeteringen

| Onderdeel | Aanpassing |
|-----------|------------|
| `AdminPageHeader` | Compacter, linker accent, optionele metrics-slot |
| `BeheerShell` | Groepen **Teambeheer** / **Controle**; verfijnde active state |
| Spelers | Compacte lijst → bewerken via `?player=` |
| Training | Weekfilter + “Meer tonen” |
| Dashboard | Contextuele empty states; media secundair |
| Labels | Coachvriendelijk Nederlands |

## 3. Fitheid + admin samen

Fitness Control Center 2.0 gebruikt dezelfde shell/header-componenten; geen technische roadmaptekst meer in de user UI.

## 4. Responsive

Doelviewports: 1440 / 1024 / 768 / 390. Sticky savebar met padding; fitheid per-onderdeel standaard op mobiel.

## 5. Screenshots

`.review-screenshots/fitness-control-center-2/` (niet automatisch committen).

## 6. Acceptatie

Zie eindrapport Fitness Control Center 2.0.
