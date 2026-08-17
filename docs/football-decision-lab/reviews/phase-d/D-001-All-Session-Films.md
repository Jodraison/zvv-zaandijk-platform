# D-001 — All Decision Session Films

**Status:** READY FOR PRODUCT DIRECTOR REVIEW  
**Date:** 2026-07-23  
**Scope:** Dedicated `LessonFilmSpec` films for sessions #2–#18; Golden Session (#1) unchanged. No IA/shell redesign.

## Verdict

All **18** Decision Lab sessions now resolve to dedicated situation IDs (`fdl-gs-*` for Golden, `fdl-ds-{slug}-{live|good|bad}` for #2–#18). Catalog generic fallbacks (`press-good` / `press-bad` / `connected-team`) are removed for #2–#18. Lesson routes use dedicated live/freeze/good/bad films with shared prelude, family-correct phase chrome, and mobile-readable decision frames.

**Honest limit:** films #2–#18 are **factory-compiled family films** (press / transition / build / possession / flank / final), not Golden Session hand-authored beat quality. Body/gaze micro-detail remains engine-default. Product Director should treat this as **coverage + wiring complete**, with optional per-session polish as a follow-up order.

## Batches completed

| Batch | Sessions | Status |
|-------|----------|--------|
| A — Pressing foundation | #2–#9 | Complete (dedicated IDs + evidence) |
| B — Transition | #10–#12 | Complete |
| C — Build-up / possession | #13, #14, #16, #17 | Complete |
| D — Flank / final third | #15, #18 | Complete (final-third start occupation) |

## Dedicated film files

| Path | Role |
|------|------|
| `src/lib/decision-lab/films/dedicated/ids.ts` | Session defs #2–18, freeze ms, pitch helper |
| `src/lib/decision-lab/films/dedicated/build-dedicated-films.ts` | `LessonFilmSpec` → `compileFilm`; registry |
| `src/lib/decision-lab/films/dedicated/d001-dedicated-films.test.ts` | Registry / no-generic / freeze / prelude / origin tests |
| `scripts/d001-evidence.ts` | Semantic reports + Playwright smoke |

Wiring: `session-catalog.ts` → `pressPitch`/`dedicatedPitch`; `tactical-situations.ts` + `tactical-animation-registry.ts` merge dedicated registry; `decision-lab-lesson-experience.tsx` uses dedicated freeze + consequence films + family phase labels.

## Generic fallbacks removed

For every session #2–#18:

- `liveSituationId` / `goodSituationId` / `badSituationId` start with `fdl-ds-`
- No pitch still points at `press-good`, `press-bad`, or `connected-team`

Golden Session remains `fdl-gs-inside-close-*` (intact; regression test OK).

## Football context / active role / formation (summary)

| # | Slug | Family | Active role | Origin |
|---|------|--------|-------------|--------|
| 1 | binnenkant-dicht-rw | Golden (hand) | RW | GS transform + PRESS_V2 |
| 2 | binnenkant-dicht-lw | press-mirror | LW | PRESS_V2 mirrored |
| 3 | binnenkant-dicht-decision | press-stable | RW | PRESS_V2 |
| 4 | tweede-druk-8 | press-second | R6 | PRESS_V2 |
| 5 | rugdekking-rb | press-depth | RB | PRESS_V2 |
| 6 | spits-stuurt | press-steer | SP | PRESS_V2 |
| 7 | verre-zijde-knijpt | press-farside | LW | PRESS_V2 mirrored |
| 8 | niet-doordrukken | press-abort | RW | PRESS_V2 |
| 9 | binnenkant-onder-druk | press-pressure | RW | PRESS_V2 |
| 10 | balverlies-direct-druk | transition-counter | R6 | PRESS_V2 + loss ball |
| 11 | restverdediging | transition-rest | RB | PRESS_V2 |
| 12 | eerste-pass-na-win | transition-firstpass | R6 | PRESS_V2 |
| 13 | opbouw-speel-veilig | build-safe | RCV | canonical 4-2-3-1 |
| 14 | opbouw-lijn-open | build-break | LCV | canonical 4-2-3-1 |
| 15 | flank-1v1-stuur-buiten | flank-1v1 | RB | advanced 4-2-3-1 mid-block |
| 16 | halfspace-volgende-actie | possession-halfspace | 10 | canonical 4-2-3-1 |
| 17 | switch-nu | possession-switch | L6 | canonical 4-2-3-1 |
| 18 | voorzet-near-post | final-nearpost | SP | advanced 4-2-3-1 final-third |

Team perspective: **blue ZVV**, opponent **red**, attack **L→R**, chrome **Vanuit 4-2-3-1**.

## Scan / freeze / good-bad

- Scan window: setup → recognition → prepare (freeze) before answer execution.
- Freeze seek: `DEDICATED_FREEZE_MS = 6800` (GS keeps its own `GS_SEEKS.freeze`).
- Good/bad share the same prelude phases; branches diverge after freeze.
- Phase chrome is family-aware (`Zij bouwen op` / `Balverlies` / `Wij bouwen op` / `Wij verdedigen` / `Omschakelen`) — no longer hard-locked to pressing for build/final sessions.

## Evidence

`docs/football-decision-lab/reviews/phase-d/artifacts/d-001/`

```
artifacts/d-001/
├── summary.json
├── browser-smoke.json
├── hub-desktop.png
├── batch-a/ … (#2–#9)
├── batch-b/ … (#10–#12)
├── batch-c/ … (#13,#14,#16,#17)
└── batch-d/ … (#15,#18)
```

Per session: `semantic-report.json` + opening/mobile shots; full freeze/good/bad for batch representatives (#4, #10, #13, #18).

Browser smoke: **0 console errors**; overflow false at 390×844, 360×800, 320×568.

## Tests

- `d001-dedicated-films.test.ts` — OK (17×3 IDs, no generic pitch, freeze eval, shared prelude, origin, mobile focus)
- `fdl-gs-inside-close-rb.test.ts` — OK (Golden intact)
- Semantic gates in `summary.json`: `allGatesPass: true`

## Lint / typecheck / build

- lint: 0 errors (pre-existing warnings elsewhere)
- `tsc --noEmit`: OK
- `NEXT_DIST_DIR=.next-d001-build npm run build`: OK

## Remaining blockers / limitations (non-blocking for PD review of coverage)

1. **Animation fidelity** below Golden Session — shared family geometry, not unique hand-authored timelines per lesson.
2. Press sessions #3/#8/#9 can look visually similar (same PRESS_V2 base; different mover emphasis).
3. Final-third / flank films use advanced 4-2-3-1 occupation without a full teach transform sequence (GS-only).
4. Not every session has full freeze/good/bad PNG set (representatives + opening/mobile for all).

## Honest scores

| Dimension | /10 |
|-----------|-----|
| Session Coverage | 10 |
| Football Correctness | 7 |
| 4-2-3-1 Consistency | 8 |
| Scan Quality | 7 |
| Decision Freeze Quality | 8 |
| Good/Bad Consequence Quality | 7 |
| Animation Quality | 6 |
| Desktop Readability | 8 |
| Mobile Readability | 8 |
| Overall Decision Lab Quality | 8 |

---

D-001 ALL DECISION SESSION FILMS:  
READY FOR PRODUCT DIRECTOR REVIEW
