# C-007 — Football Truth And Orientation

**Status:** READY FOR PRODUCT DIRECTOR VISUAL REVIEW  
**Date:** 2026-07-23  

---

## Root causes found

1. Previews lacked orientation chrome (legend hidden) — color alone identified teams.
2. 0% state still used “Ga verder met” framing and could invent resume language.
3. Hub/Academy previews seeked to decision **freeze** instead of opening trigger.
4. “Referentiesessie” was internal jargon.
5. Press occupation (4-4-2) was not explained as derived from base 4-2-3-1.
6. `PRESET_US_HIGH_PRESS` drifted from `FORMATION_PRESS_BASE`.
7. No Decision Lab semantic validation for team/role/ball/direction.

## Tactical inaccuracies fixed

- Orientation chrome on GS + Decision Lab previews (WIJ/TEGENSTANDER, Aanval →, fase, rol).
- Preview seek → `GS_SEEKS.previewOpening` (LB has ball, RW not on solution curve).
- Canonical perspective module + attack direction L→R enforced in validation.
- High-press preset aliased to PRESS_V2 base.
- First-use copy gates; Startsessie replaces Referentiesessie.

## Canonical team perspective

| | |
|--|--|
| Wij | ZVV Zaandijk · `us` · blue `#1B4FD8` |
| Tegenstander | `opponent` · red |
| Aanval | links → rechts (+x) |
| Basis | `FORMATION_4231_US` (11 posities) |
| Pressfase | `FORMATION_PRESS_BASE` / PRESS_V2 — afgeleide bezetting |

## Canonical 4-2-3-1

`ZVV_CANONICAL.baseShape` = `FORMATION_4231_US` with display roles GK/LB/LCB/RCB/RB/6/8/10/LW/RW/ST.  
Pressvorm remains PRESS_V2; chrome note: `4-2-3-1 → pressvorm`.

## Orientation layer

`TacticalOrientationChrome` + auto for `fdl-gs-inside-close-*` in `TacticalIllustration`.

## First-use UX

Untouched: Start hier · Start je eerste sessie · 3-bullet guidance · perspective sentence · no recent/Ga verder/Hervatten.  
In progress: Ga verder · resume hint only if `step > 0`.  
Completed first: next session CTA.

## Golden Session preview

Seek `previewOpening` (5550ms): LB ball, RW active, inside relevant, no solution curve. Labels: Startsessie.

## Decision Lab onboarding

Four-line aside until first progress; collapses after open.

## Semantic validation

`validateTacticalSituationSemantics` + `c007-football-truth.test.ts`.

## Evidence

`docs/football-decision-lab/reviews/phase-c/artifacts/c-007/`

| Shot | Notes |
|------|--------|
| academy-desktop-untouched | Start CTA, orientation, no Ga verder |
| academy-mobile-untouched | same |
| academy-desktop-in-progress | Ga verder, no Hervatten |
| academy-desktop-completed-first | next session |
| dl-desktop/mobile-first-use | onboarding + Startsessie |
| gs-opening / freeze / goed / fout | annotated in evidence.json |

Automated: no overflow, no console errors, no Referentiesessie.

## Tests / build

| Check | Result |
|-------|--------|
| `c007-football-truth.test.ts` | OK |
| `academy-visibility.test.ts` | OK |
| `fdl-gs-inside-close-rb.test.ts` | OK |
| `tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors |
| `NEXT_DIST_DIR=.next-c007-build next build` | OK |

## Remaining limitations

- Pressfase is visually 4-4-2 occupation (doctrine), not attack 4-2-3-1 — explained via chrome, not redrawn as attack shape mid-press.
- Non-GS sessions still use shared press-good frames where catalog points there.
- Site chrome remains club website nav.
- GS goed/fout evidence uses URL heuristics; lesson step deep-links may need manual PD scrub for perfect branch frames.

## Scores

| Dimensie | Score |
|----------|------:|
| Football Correctness | 8.5/10 |
| Team Perspective Clarity | 9/10 |
| 4-2-3-1 Recognition | 8/10 |
| First-Use UX | 9/10 |
| Navigation Clarity | 8.5/10 |
| Visual Hierarchy | 8.5/10 |
| Mobile Usability | 8.5/10 |
| Technical Readiness | 9.5/10 |
| **Overall Product Experience** | **8.6/10** |

---

C-007 FOOTBALL TRUTH AND ORIENTATION:  
READY FOR PRODUCT DIRECTOR VISUAL REVIEW
