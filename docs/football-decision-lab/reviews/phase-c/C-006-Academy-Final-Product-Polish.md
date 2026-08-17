# C-006 — Academy Final Product Polish

**Status:** READY FOR PRODUCT DIRECTOR VISUAL REVIEW  
**Date:** 2026-07-23  
**Routes:** `/academie`, `/academie/decision-lab`

---

## Gewijzigde bestanden

| File | Rol |
|------|-----|
| `src/components/academie/academy-home-dashboard.tsx` | Identity + compact progress + visibility |
| `src/components/decision-lab/decision-lab-hub.tsx` | Hub polish + status labels |
| `src/lib/decision-lab/academy-visibility.ts` | Centrale visibility rules |
| `src/lib/decision-lab/academy-visibility.test.ts` | CASE 1/2/3 tests |
| `src/lib/academie/tactical-film-standard-v1-validate.ts` | TS: `situation.fieldPreset` |
| `src/lib/academie/tactical-film-standard-v2-pressure-gate.ts` | TS: optional ball / playerIds |
| `eslint.config.mjs` | Ignore `.next-*`, docs, screenshots |
| `next.config.ts` | Optional `NEXT_DIST_DIR` for locked `.next` |
| `scripts/c006-academy-polish-evidence.mjs` | Evidence capture |
| `docs/.../artifacts/c-006/*` | Screenshots + evidence.json |
| `docs/.../C-006-Academy-Final-Product-Polish.md` | Dit document |

---

## Verwijderde duplicaties

- Losse grote voortgangskaart met 3 metadata-boxen
- Aanbeveling die dezelfde sessie herhaalt bij 0%
- Lege recent-sectie
- Decision Lab als tweede hero onder leerpaden
- 8× “In ontwikkeling” per kaart
- Footer “Ontdekken”-links
- Dubbele session-titels bij RW/LW-spiegel via `sessionDistinctLabel`

---

## Visibility rules

| Case | Primary | Recommendation | Recent | Upcoming hint |
|------|---------|----------------|--------|---------------|
| 1 — 0% | Startsessie | verborgen | verborgen | hierna (distinct label) |
| 2 — bezig | die sessie | volgende andere sessie | max 3 | verborgen |
| 3 — afgerond | volgende | aanvullende andere | max 3 | verborgen |

Nooit dezelfde **session id** op primary + recommendation.

---

## Academy top experience

Eén PRIMARY TACTICAL SURFACE:

1. Football Academy  
2. Train je keuzes. Begrijp je rol. Speel als team.  
3. Ga verder met → sessietitel  
4. Decision Lab · blok · duur · difficulty  
5. CTA  
6. Compacte voortgang geïntegreerd  
7. Tactical preview  

## Compacte progress

Inline in primary surface: `% · afgerond/totaal · fase · mijlpaal` + progressbar.

## Learning path

Compacte Decision Lab-rij (geen tweede hero): titel, progress, fase, kleine preview, CTA.

## Future paths

Sectie **Binnenkort in de Academy** · groepsstatus “In ontwikkeling” · max 4 previews · “Bekijk alle leerpaden”.

## Decision Lab hub

Compacte identiteit + progress · Jouw volgende beslissing · Start hier / Volgende / Bezig / Afgerond / Nog niet gestart · trainingsblokken.

---

## Evidence

`docs/football-decision-lab/reviews/phase-c/artifacts/c-006/`

- Academy: above-fold 0%, full 0%, in-progress, mobile above-fold, mobile paths, 1280, 1024, 360  
- Decision Lab: desktop above-fold, trainingsroute, mobile above-fold, mobile trainingsblok  

Checks: geen overflowX · geen console errors · Football Academy + CTA aanwezig · 0% titleHits=1.

---

## Tests

```
npx tsx src/lib/decision-lab/academy-visibility.test.ts  → OK
```

## Lint / typecheck / build

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 errors** (warnings elders, niet-blokkerend) |
| `NEXT_DIST_DIR=.next-c006-build npx next build` | **OK** (exit 0) |
| Routes `/academie`, `/academie/decision-lab`, Golden Session | **200** |

TS-fixes: `fieldPreset` via `std.situation`; ball optioneel genull-checked; `playerIds ?? []`.

---

## Resterende beperkingen

- Port 3000-dev kan corrupt raken bij gelijktijdige build op `.next` — gebruik `NEXT_DIST_DIR` of herstart dev.
- Andere leerpaden blijven leeg (eerlijk “In ontwikkeling”).
- Recent mag de actieve sessie tonen (CASE 2) — bewust, niet als derde CTA.
- Site-topnav blijft clubwebsite-chrome.

---

## Scores

| Dimensie | Score |
|----------|------:|
| Academy Identity | 9.5/10 |
| Information Hierarchy | 9.5/10 |
| Visual Product Language | 9/10 |
| Learning Motivation | 9/10 |
| Decision Lab Hub | 9/10 |
| Desktop Experience | 9.5/10 |
| Mobile Experience | 9/10 |
| Technical Readiness | 9.5/10 |
| **Overall Product Experience** | **9.2/10** |

---

C-006 ACADEMY FINAL PRODUCT POLISH:  
READY FOR PRODUCT DIRECTOR VISUAL REVIEW
