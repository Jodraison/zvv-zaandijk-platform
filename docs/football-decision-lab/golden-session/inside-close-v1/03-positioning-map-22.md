# 03 — Positioning Map (22 players)

```text
Product: Football Decision Lab
Session ID: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Consumes: PRESS-001@v1 · PAT-004@v1
```

## Method

- Positions are **relational**, not decorative coordinates.
- Field % baselines below are adapted from `PRESS_REFERENCE_START_STATE` / good-end geometry in `tactical-press-reference-v2.ts`.
- Production locks: us pressing 4-4-2 from 4-2-3-1; opponent BUILDUP 4-2-3-1 (Doc `01`).
- Display labels follow Academy Film Standard: GK, LB, LCB, RCB, RB, 6, 8, 10, LW, RW, ST.
- Internal IDs: `us.L6` displays as **6**; `us.R6` displays as **8**.

### Distance bands (pressing ball-side — targets from PRESS V2 meter notes)

| Relation | Target band |
|----------|-------------|
| RW – 8 | ~7–11 m |
| 8 – 6 | ~7–12 m |
| RW – RB | ~8–13 m |
| RB – RCB | ~8–12 m |
| Back line gaps | Compact; no solo step leaving 15m+ hole |

---

## Opponent formation choice (authoring recommendation)

**BUILDUP 4-2-3-1** — already authored in PRESS V2 as opponent model for ball-at-LB teaching.

Motivation (source-based, not new invention):

- Clear LB receiver  
- Double pivot / 8 as inside progressive option  
- Matches existing reference film geometry  

Status: **AWAITING PRODUCT DECISION (OD-03)** — recommendation = adopt.

---

## US — 11 players

### us.GK — Keeper

| Field | Spec |
|-------|------|
| Role | Depth organiser |
| Basis | 4-2-3-1 GK |
| Start (baseline %) | ~x12 y50 |
| Relation ball | Far; tracks switch / long |
| Relation marker | Opp ST |
| Line | Last support behind line |
| Gaze | Ball / long-ball corridor |
| Body | Open to field |
| Pre-trigger | High enough to support press; communicates line |
| On trigger | Steps slightly; holds central depth |
| During press | Ready for clipped long or over RW |
| After first pass/duel | Adjust to new ball height |
| Recover | If beaten in behind, drop and organise |
| Why move | Depth cover / Wet 3 — not decoration |

### us.RB — Rechtsback

| Field | Spec |
|-------|------|
| Role | DEPTH_COVER behind RW |
| Start | ~x30 y74 |
| Relation ball | Behind RW on ball side |
| Marker | Opp LW (their left winger) |
| Gaze | Ball + opp LW |
| Pre-trigger | Compact with RCB; not flat on touchline |
| On trigger | Steps up/in behind RW (~ toward x48–62 y76–78) |
| During press | Kills space behind RW; no ball-watching only |
| After | Hold or recover with line |
| Why | Rugdekking — PRESS role DEPTH_COVER |

### us.RCV — Rechter centrale verdediger (RCB)

| Field | Spec |
|-------|------|
| Role | DEPTH_COVER_2 / as + diepte ball-side |
| Start | ~x28 y56 |
| Relation | Ball-side CB; covers inside of RB |
| Marker | Opp ST / channel |
| On trigger | Steps and shifts ball-side (~x54 y68 in good end baseline) |
| Why | Line connects; prevents gap between RB and RCB |

### us.LCV — Linker centrale verdediger (LCB)

| Field | Spec |
|-------|------|
| Role | As + diepte verre/ half |
| Start | ~x28 y38 |
| On trigger | Shifts toward ball (~x30 y42); keeps partner distance |
| Why | Compact last line; no hanging |

### us.LB — Linksback

| Field | Spec |
|-------|------|
| Role | Far-side compactness |
| Start | ~x30 y22 |
| Marker | Opp RW |
| On trigger | Knijpt (~x32 y28); stays connected |
| Why | FAR_SIDE — switch protection |

### us.L6 — 6 (display “6”)

| Field | Spec |
|-------|------|
| Role | INSIDE_COVER / centrum screen |
| Start | ~x40 y40 |
| Relation ball | Screens central corridor / second inside |
| Marker | Opp 10 / central progression |
| On trigger | Steps toward ball-side centre (~x50–56 y58–64) |
| Why | “6 sluit centrum” — not onto the ball |

### us.R6 — 8 (display “8”)

| Field | Spec |
|-------|------|
| Role | SECOND_PRESS / closes next inside option (opp.8) |
| Start | ~x40 y56 |
| Relation | Nearest midfielder to RW press |
| Marker | Opp ball-side 8 / CM |
| On trigger | Advances to deny LB→opp.8 (~x64 y74 end baseline) |
| Why | Without 8, RW curve alone is incomplete |

### us.10 — 10

| Field | Spec |
|-------|------|
| Role | First-line partner / screens opp 6–centre |
| Start | ~x52 y56 (pressing 4-4-2 first line with ST) |
| On trigger | Holds/screens; slight ball-side adjust (~x54 y58) |
| Why | Prevents easy bounce inside; supports SP steer |

### us.RW — Rechtsbuiten (PRIMARY)

| Field | Spec |
|-------|------|
| Role | FIRST_PRESS |
| Start | ~x40 y74 (PRESS V2) or high-press preset ~x64 y70 — **lock with OD-05 start distance** |
| Relation ball | Primary presser on opp LB |
| Marker | Opp LB |
| Gaze | Ball; peripheral on inside lane / opp.8 |
| Body | Angled to show curve intent; not square sprint posture |
| Pre-trigger | Press-ready; not already max sprint |
| On trigger | Accelerate on **curved** path closing inside first |
| Action | Approach angle cuts LB→inside; slows before duel |
| After | React to back/wide/long; do not overrun blindly |
| Recover | If beaten outside, recover toward goal side with RB |
| Why every step | Close inside lane → force outside — cue **Binnenkant dicht** |

### us.LW — Linksbuiten

| Field | Spec |
|-------|------|
| Role | Far-side knijpen |
| Start | ~x40 y22 |
| On trigger | Tucks (~x40 y30); ready for switch |
| Why | FAR_SIDE_COMPACTNESS |

### us.SP — Spits (ST)

| Field | Spec |
|-------|------|
| Role | Steer / pin LCB–centre; first line |
| Start | ~x52 y40 |
| Relation | Denies easy LCB recycle central; supports press trigger logic from PB23/game model |
| On trigger | Adjusts to cut LCB/keeper easy central escape (~x52 y44) |
| Why | SP stuurt drukrichting (DOCTRINE_PRESSING_CHAIN) — not solo hunt of LB |

---

## OPPONENT — 11 players (BUILDUP 4-2-3-1)

### opp.gk

| Field | Spec |
|-------|------|
| Start | ~x94 y50 |
| Task | Support build; available for back pass under press |
| On trigger | Offer back lane; body open for recycle |
| Why visible | Back-pass / long options must be real |

### opp.rb

| Field | Spec |
|-------|------|
| Start | ~x80 y16 |
| Far side | Holds width; switch threat if we overcommit |

### opp.cbR (RCB)

| Field | Spec |
|-------|------|
| Start | ~x82 y36 |
| Task | Build partner; cover switch |

### opp.cbL (LCB)

| Field | Spec |
|-------|------|
| Start | ~x82 y60 |
| Pre-trigger | Has / had ball; plays trigger pass to LB |
| Body | Open enough to play wide |
| After pass | Offer back / support under pressure |

### opp.lb — PRIMARY RECEIVER

| Field | Spec |
|-------|------|
| Start / receive | ~x80 y84; hasBall at trigger |
| Body at freeze | Half-closed / closed to touchline (OD-04) |
| Options if inside open | Pass to opp.8 / inside CM |
| Options if inside closed | Back to LCB, along touchline, long, or duel |
| On good press | Forced wider / back (~x82 y86) |
| Why | Teaching receiver for RW decision |

### opp.6

| Field | Spec |
|-------|------|
| Start | ~x66 y40 |
| Task | Farther pivot; switch / recycle |

### opp.8 — DANGER INSIDE RECEIVER

| Field | Spec |
|-------|------|
| Start | ~x64 y68 |
| Role | Progressive inside option from LB |
| Bad consequence target | Receives ~x66 y66 if inside lane open |
| Good press | Marked/denied by our 8; drops or becomes unavailable |

### opp.rw

| Field | Spec |
|-------|------|
| Start | ~x56 y14 |
| Far-side threat | Stretch our LB/LW |

### opp.10

| Field | Spec |
|-------|------|
| Start | ~x58 y50 |
| Task | Central pocket; screened by our 6/10 |

### opp.lw

| Field | Spec |
|-------|------|
| Start | ~x56 y86 |
| Ball-side width | Outside option / combination with LB |
| Good press | Outside channel may open — that is intended force direction |

### opp.st

| Field | Spec |
|-------|------|
| Start | ~x48 y50 |
| Task | Pin our CBs; occupy last line attention |

---

## Explicit relational rules (must animate)

When ball goes to their LB:

| Player | Must |
|--------|------|
| Our ST | Hold/steer central build recycle; do not chase LB alone |
| Our 10 | Screen/occupy central mid options; shift ball-side slightly |
| Nearest 6/8 | **8** attacks next inside option; **6** screens centre |
| Our RB | Step for depth behind RW |
| Our RCB | Step/connect with RB; protect channel |
| Far mid (6 if 8 is ball-side) | Already covered: 6 = inside cover |
| Our LW | Knijp; no ball-watching tourist |
| Our LB | Knijp; watch opp RW |
| Last line | Shift as unit; keep gaps |
| Rest defence | If RW beaten, RB/RCB first recovery structure |

**Forbidden:** RW presses while 10 other teammates remain at start coordinates (PRESS V2 bad film teaches exactly this failure — related but Golden contrast primary delta is approach angle; team motion still mandatory per Wet 4).

---

## Five positions per key actors (summary)

| Actor | Basis | Start | Reactie | Actie | Herstel |
|-------|-------|-------|---------|-------|---------|
| RW | 4231 RW | Press-ready right | Curve accelerate | Inside closed, slow for duel | Recover goal-side if beaten |
| 8 | 4231 R6 | Central-right mid | Step to opp.8 lane | Deny inside | Reset mid block if bypassed |
| 6 | 4231 L6 | Central | Screen centre | Hold INSIDE_COVER | Re-compact |
| RB | 4231 RB | Right back | Step up | Depth cover | Drop if long |
| opp.lb | 4231 LB | Wide left | Receive | Play under pressure | Recycle/back |

---

## Coordinate lock note

Exact `%` values above are **authoring baselines from existing PRESS V2**, not newly invented football.  
Implementation must re-validate meter bands and mobile collisions.  
If Product Director rejects PRESS V2 numbers, replace via Positioning Gate — do not improvise in code.
