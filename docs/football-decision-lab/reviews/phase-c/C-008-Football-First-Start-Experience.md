# C-008 — Football-First Start Experience

**Status:** READY FOR PRODUCT DIRECTOR VISUAL REVIEW  
**Date:** 2026-07-23  
**Scope:** `/academie` first-use UX, canonical progress states, formation teaching sequence, field readability

## Verdict

First-time players now get a dedicated full-scale start experience: perspective strip, visual 4-2-3-1 → opponent → match situation, large pitch, and a state-correct primary CTA. Returning users get a separate compact dashboard.

## What changed

| Area | Change |
|------|--------|
| Layout | Academy main uses ~full `max-w-[100rem]` with tighter padding; content `max-w-[1580px]` |
| First-use | `AcademyFirstUseExperience` — identity, perspective, teach sequence, one CTA, below-fold secondary |
| Returning | `AcademyReturningDashboard` — continue, progress, recent, next, compact future paths |
| State | `resolveCanonicalLearnerModel` — untouched / opened / in_progress / completed; no bare `status:started` without `openedAt` |
| Progress | `openedAt` / `completedAt` + `clearDecisionLabProgress` |
| Formation | Frames: base blue 4231 → opponent → press situation; “Bekijk opstelling” + mobile expand |
| Labels | Larger `playerLabel` token sizes |

## Evidence

`docs/football-decision-lab/reviews/phase-c/evidence/c008/`

| # | File | State | CTA |
|---|------|-------|-----|
| 1 | `01-untouched-1440x900.png` | untouched | Start eerste beslissessie |
| 2 | `02-untouched-1280x720.png` | untouched | Start eerste beslissessie |
| 3 | `03-untouched-390x844.png` | untouched | Start eerste beslissessie |
| 4 | `04-opened-desktop.png` | opened | Ga verder met je sessie |
| 5 | `05-in-progress-desktop.png` | in_progress | Ga verder met je sessie |
| 6 | `06-completed-first-desktop.png` | next after complete | Start volgende sessie |
| 7 | `07-formation-frame-4231.png` | base 4231 | — |
| 8 | `08-opponent-context-frame.png` | + red | — |
| 9 | `09-golden-session-opening.png` | press situation | — |
| 10 | `10-mobile-expanded-pitch.png` | expanded | — |

Gates from `report.json`: untouched start CTA ✓, no Ga verder on untouched ✓, field ≥650px ✓, no horizontal overflow ✓, no Hervatten ✓.

## Tests

- `npx tsx src/lib/decision-lab/c008-first-use.test.ts` — OK  
- `npx tsx src/lib/decision-lab/c007-football-truth.test.ts` — OK  
- `npx tsx src/lib/decision-lab/academy-visibility.test.ts` — OK  
- `npx tsx scripts/c008-evidence.ts` — OK  
- `npm run lint` — 0 errors (pre-existing warnings)  
- `npx tsc --noEmit` — OK  
- `NEXT_DIST_DIR=.next-c008-build npx next build` — OK  

## Remaining limitations

- Press occupation (frame 3) remains PRESS_V2 visual occupation; teaching sequence shows the 4231→press path explicitly.
- Mobile first viewport is tall: perspective strip + question; CTA is immediately under meta; pitch may need scroll / “Vergroot veld”.
- Returning opened state can still show 0% completion while CTA is continue (correct: opened ≠ completed).

## Honest scores

| Dimension | /10 |
|-----------|-----|
| First-Use Clarity | 9 |
| Formation Recognition | 9 |
| Team Perspective | 9 |
| Tactical Readability | 8 |
| CTA Clarity | 9 |
| Visual Hierarchy | 9 |
| Desktop UX | 9 |
| Mobile UX | 8 |
| Overall Academy Experience | 9 |

C-008 FOOTBALL-FIRST START EXPERIENCE:  
READY FOR PRODUCT DIRECTOR VISUAL REVIEW
