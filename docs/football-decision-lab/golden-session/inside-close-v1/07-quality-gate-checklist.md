# 07 — Complete Quality-Gate Checklist

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

**Rule:** Any critical fail = **BLOCKED**. No “goed genoeg”.

Authoring column = whether the **spec** defines the check.  
Evidence column = filled at implementation review.

Statuses: `SPEC READY` | `PENDING BUILD` | `PASS` | `BLOCKED`

---

## 20.1 Tactical Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| T1 | Principle = close inside then force outside (not win ball first) | SPEC READY | PENDING BUILD |
| T2 | Force direction = touchline / outside; centre protected | SPEC READY | PENDING BUILD |
| T3 | Trigger = pass/receive to their LB | SPEC READY | PENDING BUILD |
| T4 | Correct action is true first priority in this state | SPEC READY | PENDING BUILD |
| T5 | Alternatives A/C are match-credible | SPEC READY | PENDING BUILD |
| T6 | Incorrect consequence shows inside pass available | SPEC READY | PENDING BUILD |
| T7 | Correct consequence shows inside denied + wide/back pressure | SPEC READY | PENDING BUILD |
| T8 | Not framed as universal only-solution football | SPEC READY | PENDING BUILD |
| T9 | Fits 4-2-3-1 identity + pressing doctrine | SPEC READY (OD-02) | PENDING BUILD |

**Gate result (now):** SPEC READY — build evidence required.

---

## 20.2 Positioning Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| P1 | All 22 players specified with tasks | SPEC READY | PENDING BUILD |
| P2 | RW never presses with static team | SPEC READY | PENDING BUILD |
| P3 | 8 = second/inside option; 6 = centre screen | SPEC READY | PENDING BUILD |
| P4 | RB + RCB depth cover present | SPEC READY | PENDING BUILD |
| P5 | Far side LW/LB knijpt | SPEC READY | PENDING BUILD |
| P6 | ST steers / does not solo-hunt LB | SPEC READY | PENDING BUILD |
| P7 | Distance bands respected (PRESS V2 meter targets) | SPEC READY | PENDING BUILD |
| P8 | No artificial giant lanes from bad spacing | SPEC READY | PENDING BUILD |
| P9 | Opponent organised (BUILDUP readable) | SPEC READY (OD-03) | PENDING BUILD |
| P10 | Rest defence visible after action | SPEC READY | PENDING BUILD |

---

## 20.3 Didactic Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| D1 | Exactly one primary decision | SPEC READY | PENDING BUILD |
| D2 | Choice before explanation | SPEC READY | PENDING BUILD |
| D3 | Observation cues listed and used in feedback | SPEC READY | PENDING BUILD |
| D4 | Contrast present (straight vs curve) | SPEC READY | PENDING BUILD |
| D5 | Recall present (R1) | SPEC READY | PENDING BUILD |
| D6 | Transfer lines to training/match written | SPEC READY | PENDING BUILD |
| D7 | Text diet respected (12/40/3) | SPEC READY | PENDING BUILD |

---

## 20.4 Readability Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| R1 | Ball always visible | SPEC READY | PENDING BUILD |
| R2 | Body + head orientation readable (esp. LB, RW) | SPEC READY | PENDING BUILD |
| R3 | Us vs Opp distinguishable without colour-only | SPEC READY | PENDING BUILD |
| R4 | Inside pass lane readable at freeze | SPEC READY | PENDING BUILD |
| R5 | Labels do not dominate | SPEC READY | PENDING BUILD |
| R6 | Mobile freeze readable | SPEC READY | PENDING BUILD |

---

## 20.5 Visual Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| V1 | Acceleration/deceleration on RW curve | SPEC READY | PENDING BUILD |
| V2 | Players read as footballers (not pawns) | SPEC READY | PENDING BUILD |
| V3 | Ball contact readable | SPEC READY | PENDING BUILD |
| V4 | No arcade glow/particles/confetti | SPEC READY | PENDING BUILD |
| V5 | Pass line matches ball path | SPEC READY | PENDING BUILD |
| V6 | Professional tone (UEFA/Hudl, not cartoon) | SPEC READY | PENDING BUILD |

---

## 20.6 Cognitive Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| C1 | Freeze is fair (not too early/late) | SPEC READY | PENDING BUILD |
| C2 | Answer not pre-revealed by arrows/green player | SPEC READY | PENDING BUILD |
| C3 | Three choices meaningful | SPEC READY | PENDING BUILD |
| C4 | Information load manageable on one screen | SPEC READY | PENDING BUILD |
| C5 | Consequence explains causality | SPEC READY | PENDING BUILD |

---

## 20.7 Club Language Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| L1 | Cue = **Binnenkant dicht** (≤3 words) | SPEC READY | PENDING BUILD |
| L2 | Cue registered in Football Language OS | **OD-01 OPEN** | BLOCKED until OD-01 |
| L3 | No conflicting synonym for same behaviour in-session | SPEC READY | PENDING BUILD |
| L4 | Terms align with PB20/23 / pressing rules where reused | SPEC READY | PENDING BUILD |
| L5 | No vague banned language (“slimmer”, “meer willen”) | SPEC READY | PENDING BUILD |

---

## 20.8 Mobile Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| M1 | Core cluster (LB, RW, 8, inside lane) readable | SPEC READY | PENDING BUILD |
| M2 | Touch targets ≥ platform minimum | SPEC READY | PENDING BUILD |
| M3 | Text limits hold on small screens | SPEC READY | PENDING BUILD |
| M4 | Replay / contrast operable | SPEC READY | PENDING BUILD |
| M5 | No required landscape | SPEC READY | PENDING BUILD |
| M6 | Sound not required | SPEC READY | PENDING BUILD |

---

## 20.9 Desktop Gate

| # | Check | Authoring | Evidence |
|---|-------|-----------|----------|
| DK1 | Pitch uses space; not sparse empty chrome | SPEC READY | PENDING BUILD |
| DK2 | Last line + ball-side context simultaneous | SPEC READY | PENDING BUILD |
| DK3 | Interaction layer clear over pitch | SPEC READY | PENDING BUILD |
| DK4 | Same learning sequence as mobile | SPEC READY | PENDING BUILD |

---

## 20.10 UEFA Pro Review (hard)

| # | Question | Result now |
|---|----------|------------|
| U1 | Tactically fully defensible? | PENDING BUILD (+ OD-02/03/04) |
| U2 | Teaches a real match decision? | SPEC READY claim — evidence PENDING |
| U3 | Transferable to training/match? | SPEC READY claim — evidence PENDING |
| U4 | Every movement explainable? | SPEC READY in Doc 03/04 — evidence PENDING |
| U5 | Would a pro academy take this seriously? | PENDING BUILD |

**UEFA Pro Review status now:** **BLOCKED** (no implementation evidence yet).

Any “twijfel” at review time = no approval.

---

## Automatic structural checks (to implement later)

| Check | Expected |
|-------|----------|
| Primary text ≤40 words | Validator |
| Cue ≤3 words | Validator |
| Recall step present | Validator |
| Contrast variant present | Validator |
| Primary decision present | Validator |
| Unknown football term | Validator vs language registry |
| Unapproved cue | Fail if OD-01 not closed |

Automatic checks do **not** replace football review.
