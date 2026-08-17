# 09 — Authoring Risks & Open Decisions

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

Cursor must **not** silently decide items marked `AWAITING PRODUCT DECISION`.

---

## Part A — Authoring risks

| ID | Risk | Why it hurts implementation | Mitigation in package |
|----|------|-----------------------------|------------------------|
| AR-01 | Conflicting us-shape labels (4-2-3-1 vs pressing 4-4-2) | Animators may build wrong occupation | OD-02; Doc 02/03 cite `DOCTRINE_DEFEND` |
| AR-02 | PRESS V2 contrast ≠ Golden contrast | Reusing press-bad/good films would teach “alone vs team” instead of “straight vs curve” | Doc 05 defines new contrast delta; PRESS V2 = geometry source only |
| AR-03 | Cue not in language registry | Club Language Gate blocks live | OD-01 |
| AR-04 | “Sturen” confused with “lijn sluiten” | Player thinks any pressure = success | Script: consequence shows inside lane specifically |
| AR-05 | Too much info at freeze on mobile | Cognitive overload; wrong taps | Detail crop + one question; hotspots optional |
| AR-06 | Unrealistic RW start distance | Either trivial or impossible press | OD-05 |
| AR-07 | PB23 excerpts mentioning force inside/long | Authors mix force directions | Golden locks outside/touchline for this state |
| AR-08 | Team motion under-animated | Violates Wet 4; looks like solo hero | Positioning Gate P2 mandatory |
| AR-09 | Overlay spoils answer | Cognitive Gate fail | Overlay off at freeze |
| AR-10 | Pass line ≠ ball path | Ball standard violation | Doc 04 + acceptance E7 |
| AR-11 | Opponent model ambiguity | 22-map unstable | OD-03 recommend BUILDUP 4231 |
| AR-12 | Legacy Academy IA docs confuse builders | Wrong shell built (chapter pages) | FDL README supersession note |

---

## Part B — Open decisions

### OD-01 — Register coach cue “Binnenkant dicht”

| | |
|--|--|
| Why needed | Club Language Gate + Football Language OS require registration before live |
| Options | (a) Register as official cue; synonym note vs “Passlijn dicht” (b) Change cue to existing “Passlijn dicht” (conflicts Product Owner mandate) |
| Recommended standard | **(a)** Register **Binnenkant dicht** as official cue for this behaviour; keep “Passlijn dicht” as supporting term |
| Status | **AWAITING PRODUCT DECISION** |

### OD-02 — How to present our shape on screen

| | |
|--|--|
| Why needed | OS prompt stresses 4-2-3-1; repo pressing doctrine uses 4-4-2 shape from 4-2-3-1 |
| Options | (a) Show pressing 4-4-2 with identity note “from 4-2-3-1” (b) Keep 4-2-3-1 labels with 10 advanced beside ST visually (c) Other trainer-specified |
| Recommended standard | **(a)** — matches `DOCTRINE_DEFEND` / PRESS V2 occupation logic |
| Status | **AWAITING PRODUCT DECISION** |

### OD-03 — Opponent formation lock

| | |
|--|--|
| Why needed | All 22 positions depend on it |
| Options | (a) BUILDUP 4-2-3-1 (PRESS V2) (b) 4-3-3 build (c) Other |
| Recommended standard | **(a)** BUILDUP 4-2-3-1 |
| Status | **AWAITING PRODUCT DECISION** |

### OD-04 — Exact LB body angle at freeze

| | |
|--|--|
| Why needed | Changes how “open inside” reads |
| Options | (a) Half-closed to touchline (recommended) (b) Fully closed (c) Slightly open |
| Recommended standard | **(a)** Half-closed — inside pass tempting but not cartoon-obvious |
| Status | **AWAITING PRODUCT DECISION** |

### OD-05 — RW start distance / height

| | |
|--|--|
| Why needed | Determines whether curve is teachable |
| Options | (a) PRESS V2 start (~x40 y74) (b) PRESET_US_HIGH_PRESS RW (~x64 y70) (c) Trainer-measured meters |
| Recommended standard | **(a)** for continuity with existing reference geometry; validate meters on pitch |
| Status | **AWAITING PRODUCT DECISION** |

### OD-06 — Exact trigger passer / foot

| | |
|--|--|
| Why needed | Ball standard completeness |
| Options | (a) opp.cbL right/left foot wide pass (b) opp.6 bounce then wide (c) GK→LB (usually too long for this lesson) |
| Recommended standard | **(a)** LCB → LB ground pass |
| Status | **AWAITING PRODUCT DECISION** |

### OD-07 — Decision interaction modality for v1

| | |
|--|--|
| Why needed | Interaction OS prefers field action over MCQ |
| Options | (a) Three action buttons (fastest to certify) (b) Tap inside-lane vs ball vs drop-zone (c) Draw approach curve |
| Recommended standard | **(b)** if touch reliability OK; else **(a)** with Product Director sign-off noted in limitations |
| Status | **AWAITING PRODUCT DECISION** |

### OD-08 — Relationship to existing PRESS V2 code assets

| | |
|--|--|
| Why needed | Avoid accidental reuse of wrong contrast teaching |
| Options | (a) New FDL session assets only; PRESS V2 remains legacy teaching film (b) Refactor PRESS V2 to match Golden (out of scope unless ordered) |
| Recommended standard | **(a)** for Golden path |
| Status | **AWAITING PRODUCT DECISION** |

### OD-09 — Prerequisite session before Golden

| | |
|--|--|
| Why needed | Wet/OS: players without foundation may need orientation |
| Options | (a) None — orientation inside Hook enough (b) Require short scan foundation session first |
| Recommended standard | **(a)** for Golden certification speed; add foundation later if pilot data shows confusion |
| Status | **AWAITING PRODUCT DECISION** |

### OD-10 — Formal retirement note for Academy Architecture Freeze IA

| | |
|--|--|
| Why needed | Builders may follow frozen Academy nav instead of FDL Navigation OS |
| Options | (a) Product Director issues short supersession ACR for Decision Lab scope (b) Leave parallel until post-Golden |
| Recommended standard | **(a)** scoped supersession (Decision Lab only) |
| Status | **AWAITING PRODUCT DECISION** |

---

## Closure condition for implementation prompt

An implementation prompt may be written only when:

1. Product Director marks this authoring package reviewed  
2. OD-01 through OD-08 are decided (OD-09/10 may be parallel)  
3. No author invents missing football content in code  

```text
Until then: Implementation status = NOT STARTED
```
