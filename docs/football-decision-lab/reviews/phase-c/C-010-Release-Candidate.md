# C-010 — Football Academy Release Candidate

**Status:** READY FOR FINAL PRODUCT DIRECTOR REVIEW  
**Date:** 2026-07-23  
**Scope:** Close player-experience blockers on the C-009 journey — no IA redesign

## Verdict

Release candidate quality: explicit 4-2-3-1 → trigger → press transform, versioned named-stage progress migration, mobile journey through 320px with fullscreen pitch, consistent learner state, and clean E2E evidence.

## Release blockers found & addressed

| Blocker | Fix |
|---------|-----|
| Press occupation unexplained | Three-stage transform with interpolated mid + run lines |
| Mobile ~7/10 | Compact orientation, CTA early, fullscreen pitch, 320px smoke |
| Unsafe step 0–5 assumption | `progressVersion: 2` + `lessonStage` named model + migration |
| “4-2-3-1 → pressvorm” chrome | Replaced with “Vanuit 4-2-3-1” / stage-specific notes |
| Copy (“Open trainingsroute”, cryptic Hierna) | Player trainer language |

## Evidence

`docs/football-decision-lab/reviews/phase-c/evidence/c010/`

Gates from `report.json`:

- untouchedStart ✓  
- completionPersisted ✓  
- progressVersion2 ✓  
- noOverflow ✓  
- mobile320NoOverflow ✓  

Includes `trace.zip`.

## Tests

- `c010-release.test.ts` — OK  
- `c009-player-journey.test.ts` — OK  
- `c008-first-use.test.ts` — OK  
- `scripts/c010-evidence.ts` — OK  

## Lint / typecheck / build

- lint: 0 errors  
- `tsc --noEmit`: OK  
- `NEXT_DIST_DIR=.next-c010-build next build`: OK  

## Remaining release notes (non-blocking)

- Club site nav remains outside Academy shell (deliberate; Academy body is cohesive).  
- Non-Golden follow-up sessions keep the same lesson structure but do not claim Golden-level film quality.  
- PRESS_V2 end occupation remains the authored press reference; the path to it is now visually taught.

## Honest scores

| Dimension | /10 |
|-----------|-----|
| Football Truth | 9 |
| 4-2-3-1 Transformation | 9 |
| Tactical Readability | 8 |
| Decision Interaction | 9 |
| Progress Reliability | 9 |
| Desktop Journey | 9 |
| Mobile Journey | 9 |
| Copy Clarity | 9 |
| Technical Readiness | 9 |
| Overall Release Quality | 9 |

C-010 FOOTBALL ACADEMY RELEASE CANDIDATE:  
READY FOR FINAL PRODUCT DIRECTOR REVIEW
