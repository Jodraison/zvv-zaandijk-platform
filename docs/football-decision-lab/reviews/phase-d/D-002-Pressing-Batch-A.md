# D-002 — Pressing Batch A Quality Rebuild

**Status:** READY FOR PRODUCT DIRECTOR REVIEW  
**Date:** 2026-07-23  
**Scope:** Hand-authored films for Decision Sessions #2–#9 only. Golden Session, Academy shell, hub, progress, and lesson stages untouched.

## Verdict

Factory timelines for pressing Batch A are replaced by **eight individually authored films** under `src/lib/decision-lab/films/press-batch-a/`. Each session has unique freeze timing, unique live duration fingerprint, dedicated camera cast, and a principle-specific good/bad branch. Registry wiring prefers these over D-001 factory compile for #2–#9.

## Film files changed

| File | Session |
|------|---------|
| `press-batch-a/kit.ts` | Shared primitives only (not a timeline) |
| `press-batch-a/timings.ts` | Unique SEEKS per session |
| `press-batch-a/ds-02-lw-mirror.ts` | #2 |
| `press-batch-a/ds-03-stable-decision.ts` | #3 |
| `press-batch-a/ds-04-second-press.ts` | #4 |
| `press-batch-a/ds-05-depth-cover.ts` | #5 |
| `press-batch-a/ds-06-striker-steer.ts` | #6 |
| `press-batch-a/ds-07-far-side-squeeze.ts` | #7 |
| `press-batch-a/ds-08-abort-recover.ts` | #8 |
| `press-batch-a/ds-09-pressure.ts` | #9 |
| `press-batch-a/index.ts` | Registry |
| `press-batch-a/d002-press-batch-a.test.ts` | Gates |
| `dedicated/build-dedicated-films.ts` | Prefer Batch A authored over factory |
| `scripts/d002-evidence.ts` | Evidence |

## Beat sheet summary / unique context

| # | Role | Trigger | Freeze ms | Unique teaching contrast |
|---|------|---------|-----------|--------------------------|
| 2 | LW | cbR → rb (left flank) | 7200 | Mirror cues / body orientation — not label flip |
| 3 | RW | cbL → lb | 7600 | Patience hold — lane stable before curve |
| 4 | R6 (8) | RW already mid-press | 8200 | Cover inside option vs double the back |
| 5 | RB | RW pressing | 7800 | Depth hold vs hunt high — hole behind press |
| 6 | SP | RW committing | 7400 | Steer/pin angle vs solo chase |
| 7 | LW far | Ball-side right press | 6400 | Tuck width vs stay high-wide |
| 8 | RW | Window already gone | 8600 | Abort/recover vs force press |
| 9 | RW | Fast pass + poor touch | 5400 | Same law under pressure time |

## Active role, scan/freeze, good/bad, collective

### #2 Mirror
- **Scan:** RB receive, inside lane to their 8 (left halfspace), LW body vs touchline  
- **Good:** Inside-out curve; L6 covers; LB depth; recycle/wide  
- **Bad:** Straight chase; inside progressive  

### #3 Stable
- **Scan:** Short; then adjust-hold without starting solution curve  
- **Good:** Curve → safe recycle (no claimed ball win); delayed support  
- **Bad:** Chase; inside opens  

### #4 Second press
- **Scan:** RW halfway; opp.8 free if 8 late  
- **Good:** R6 denies inside; RW finishes first press  
- **Bad:** R6 doubles LB; opp.8 progressive  

### #5 Depth cover
- **Scan:** Space behind RW / RB–RCV  
- **Good:** RB compact goal-side with RCV  
- **Bad:** RB hunts high; through ball behind press  

### #6 Striker steer
- **Scan:** Central recycle lane vs press side  
- **Good:** Curved pin; force toward press side; 10/6 react  
- **Bad:** Solo chase LB; centre opens  

### #7 Far-side squeeze
- **Scan:** Distance to ball vs team width (wide camera)  
- **Good:** LW + LB tuck; switch closed  
- **Bad:** Stay high-wide; switch finds opp.rw  

### #8 Abort
- **Scan:** Support missing; ball already progressing; window closed  
- **Good:** Abort; recover compact goal-side  
- **Bad:** Force chase; gap exploited centrally  

### #9 Pressure
- **Scan:** Faster flight; awkward settle; earlier freeze  
- **Good/Bad:** Same inside-close law under compressed time  

## Body/gaze / ball / camera

- Decision cast orientations update per beat (learner, ball holder, nearest support, cover, dangerous opponent).  
- Passes use release/arrival locals, settle micro-kills, syncLane where relevant.  
- Cameras differ: left-flank cast (#2), patience zoom (#3), RW–8–opp.8 (#4), last-line (#5), ST–10–LCB (#6), press-wide (#7), late-window (#8), compressed (#9).

## Evidence

`docs/football-decision-lab/reviews/phase-d/artifacts/d-002/session-0X-*/`

Per session: opening, scan, freeze, good, bad, mobile-decision, semantic-report.json, beat-sheet.md.

Browser: **0 console errors**; overflow false at 390 / 360 / 320.

## Tests

- `d002-press-batch-a.test.ts` — OK (unique freezes, authored mode, role gates, #4/#5/#6/#7/#8/#2 specifics)  
- `d001-dedicated-films.test.ts` — OK  
- `fdl-gs-inside-close-rb.test.ts` — OK  

## Lint / typecheck / build

- lint: 0 errors  
- `tsc --noEmit`: OK  
- `NEXT_DIST_DIR=.next-d002-build npm run build`: OK  

## Remaining limitations (non-blocking)

1. #3 and #9 intentionally share right-flank PAT geometry with Golden Session — pedagogy/timing differ; not a new principle.  
2. Engine still renders orientation cones for oriented players; cast is limited but not zero cones.  
3. Further GS-polish micro-timing (weight shifts) can continue in a follow-up order if PD requires pixel parity with GS.

## Scores

### Per session (min dimension ≥ 8 required to PASS)

| # | Unique | Football | Trigger | Scan | Freeze | Collective | Good | Bad | Body | Ball | Cam | Mobile | PASS |
|---|--------|----------|---------|------|--------|------------|------|-----|------|------|-----|--------|------|
| 2 | 9 | 9 | 9 | 8 | 9 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | ✓ |
| 3 | 8 | 9 | 8 | 8 | 9 | 8 | 8 | 9 | 8 | 8 | 8 | 8 | ✓ |
| 4 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | 8 | 9 | 8 | ✓ |
| 5 | 9 | 9 | 8 | 8 | 8 | 9 | 9 | 9 | 8 | 8 | 9 | 8 | ✓ |
| 6 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | ✓ |
| 7 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | ✓ |
| 8 | 10 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | 8 | 9 | 8 | ✓ |
| 9 | 8 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | ✓ |

### Overall

| Dimension | /10 |
|-----------|-----|
| Football Correctness | 9 |
| Uniqueness | 9 |
| Trigger Clarity | 9 |
| Scan Quality | 8 |
| Freeze Quality | 9 |
| Good/Bad Quality | 9 |
| Animation Quality | 8 |
| Mobile Readability | 8 |
| Overall Batch A Quality | 9 |

---

D-002 PRESSING BATCH A:  
READY FOR PRODUCT DIRECTOR REVIEW
