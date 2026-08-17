# C-009 — Complete Player Journey

**Status:** READY FOR PRODUCT DIRECTOR END-TO-END REVIEW  
**Date:** 2026-07-23  
**Scope:** `/academie` → Decision Lab → Golden Session → decision → feedback → completion → next

## Verdict

The Academy is now a coherent application journey with a shared shell, state-correct language, controllable formation teaching, a six-stage lesson rail, premium CTAs, persisted completion, and mobile/desktop evidence from a clean storage run.

## Delivery map

| # | Area | Change |
|---|------|--------|
| 1 | App shell | `AcademyAppShell` (`max-w-[min(96vw,1580px)]`) on home, hub, lesson; tighter `/academie` main padding |
| 2 | First-use | Identity + perspective + 4-2-3-1 note + teach sequence + one CTA + below-fold only |
| 3 | Returning | Status chip + exact detail + progress + one CTA; no cryptic Hierna |
| 4 | State language | Nog niet gestart / Sessie geopend / Bezig / Afgerond + named stage resume |
| 5 | Formation | Controls: Onze opstelling · Wedstrijdsituatie · Jouw moment · Terug naar opstelling |
| 6 | Tactical | Larger lesson pitch; hierarchy via orientation + freeze; mobile Vergroot veld |
| 7 | CTA | `AcademyPrimaryCta` (icon + label + duration + tones) |
| 8 | Hub | Training route: one next CTA, blok progress, future blokken collapsed |
| 9–11 | Lesson | 6 stages: Bekijk → Scan → Kies → Gevolg → Waarom → Afronden; completion persists |
| 12–14 | Evidence | `evidence/c009/` + `trace.zip` + `report.json` |

## Evidence gates (`report.json`)

- untouchedStart ✓  
- completionPersisted ✓  
- noOverflowDesktop ✓  
- noOverflowMobile ✓  

## Tests

- `c009-player-journey.test.ts` OK  
- `c008-first-use.test.ts` OK  
- `c007-football-truth.test.ts` OK  
- `academy-visibility.test.ts` OK  
- `scripts/c009-evidence.ts` OK  

## Lint / typecheck / build

- lint: 0 errors (pre-existing warnings)  
- `tsc --noEmit`: OK  
- `NEXT_DIST_DIR=.next-c009-build next build`: OK  

## Remaining limitations

- Press occupation in “Jouw moment” remains PRESS_V2 visual shape; teaching sequence still shows 4231→press path.
- Club site nav remains outside Academy shell (by design).
- Lesson stage migration maps legacy steps >5; mid-legacy step 0–5 assumed new 6-stage indices after C-009.

## Honest scores

| Dimension | /10 |
|-----------|-----|
| App Shell | 8 |
| First-Use UX | 8 |
| Formation Clarity | 8 |
| Tactical Readability | 8 |
| Decision Interaction | 8 |
| Lesson Completion | 9 |
| Navigation Clarity | 8 |
| Desktop Journey | 8 |
| Mobile Journey | 7 |
| Overall Player Experience | 8 |

C-009 COMPLETE PLAYER JOURNEY:  
READY FOR PRODUCT DIRECTOR END-TO-END REVIEW
