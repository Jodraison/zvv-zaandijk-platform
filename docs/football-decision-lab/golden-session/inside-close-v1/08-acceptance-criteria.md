# 08 — Acceptance Criteria & Review Evidence

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

This document defines **observeerbaar bewijs** required at implementation review.  
Subjective words without a measurement method are forbidden as pass criteria.

---

## A. Delivery inventory

| Evidence | Pass criterion |
|----------|----------------|
| List of changed files | Diff attached; **no** unrelated Academy rewrites |
| Session reachable in app | Deep link / route documented and opens session shell |
| Authoring package unchanged in intent | Contract IDs still match `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` |

---

## B. Visual evidence (static)

| Evidence | Pass criterion |
|----------|----------------|
| Mobile screenshots | Hook, Freeze+Decision, Consequence B, Contrast toggle, Cue, Recall, Closure — readable without zoom guesswork |
| Desktop screenshots | Same steps; last line + ball-side both visible at Freeze |
| Kijkrichting proof | Annotated frame: LB head/body + RW head/body identifiable at Freeze |
| Inside-lane proof | Annotated Freeze frame marking LB→opp.8 channel |
| Pass=line proof | Frame during T2 where overlay (if any) coincides with ball path pixels |

---

## C. Video evidence

| Evidence | Pass criterion |
|----------|----------------|
| Full session video | Uninterrupted run-through main path (correct) including recall |
| Correct choice video | Shows Branch B consequence: inside denied |
| Wrong A video | Shows inside pass to midfielder |
| Wrong C video | Shows time gifted / progression |
| Contrast video | Same start; single delta visible within 3 seconds of toggle |
| Recall video | Faster pass variant; correct path without full re-teach |
| 22-player reaction video | Scrub shows non-RW teammates move with football reasons (checklist P2–P6) |

---

## D. Engineering evidence

| Evidence | Pass criterion |
|----------|----------------|
| Lint | Project lint on touched files = 0 errors |
| Typecheck | `tsc` / project typecheck = pass |
| Build | Production build = pass |
| Relevant tests | Any new validators/tests green; existing Academy smoke not regressed |
| Automatic validators | Structural checks from Doc 07 auto list = pass |
| Gate checklist | Doc 07 fully filled PASS/BLOCKED with reviewer initials + date |

---

## E. Behavioural acceptance (measurable)

| ID | Criterion | How measured |
|----|-----------|--------------|
| E1 | One primary decision only | No second scored question before feedback |
| E2 | Choice before explanation | Timestamp: decision UI before explanation UI |
| E3 | Cue ≤3 words | Exact string `Binnenkant dicht` |
| E4 | Explanation ≤40 words | Word count on primary explanation surfaces |
| E5 | Scan prompt ≤12 words | Word count |
| E6 | Contrast single delta | Side-by-side diff: only RW path (+ consequent chain) differs at action phase |
| E7 | Ball never teleports | Frame-by-frame T2; max gap ≤ engine rule |
| E8 | No answer spoiler pre-decision | No green correct player / solution arrow before commit |
| E9 | Mobile touch | All three choices tappable with thumb; miss-tap rate informal QA ≤1/10 |
| E10 | Sound off completable | Session completed muted |

---

## F. Regression

| Evidence | Pass criterion |
|----------|----------------|
| Existing Academie Chapter-1 routes | Still load; no broken imports from FDL work |
| Existing PRESS V2 films (if untouched) | Still play OR explicitly versioned if reused |
| No OS V1.0 rewrite | Diff shows no silent OS doctrine edits |

---

## G. Known limitations section (required)

Implementation review must list:

- Any OD still open (must be none for CERTIFIED PASS)
- Any visual simplification chosen for clarity (with Wet 10 justification)
- Any interaction downgrade (e.g. buttons instead of draw-lane) with Product Director sign-off

---

## H. Certification outcomes

| Outcome | Condition |
|---------|----------|
| BLOCKED | Any critical gate fail OR missing mandatory video/screenshot OR OD unresolved |
| CONDITIONAL PASS (session) | Forbidden for Golden — Golden is binary for certification path |
| CERTIFIED PASS (OS) | All gates PASS + UEFA Pro five questions all yes + evidence pack complete |

Forbidden review language as sole justification: “mooi”, “professioneel genoeg”, “soepel genoeg”, “logisch”, “correct” — without pointing to a row above.
