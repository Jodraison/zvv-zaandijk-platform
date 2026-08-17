# 03 — Positioning Map (22 players) — Order #2

```text
Product: Football Decision Lab
Session ID: FDL-DS-INSIDE-CLOSE-LW-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Consumes: PRESS-001@v1 · PAT-004@v1
Quality reference: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1 Doc 03
```

## Method

- **Spiegel** van Order #1 relationele jobs; geen nieuwe rollen.
- Spiegelregel: `y' ≈ 100 − y` t.o.v. Order #1 baselines.
- Production locks: 4-4-2 from 4-2-3-1; opponent BUILDUP 4-2-3-1.
- Labels: GK, LB, LCB, RCB, RB, 6, 8, 10, LW, RW, ST.
- Internal: `us.L6` = **6**; `us.R6` = **8**.

### Distance bands (ball-side — gespiegeld)

| Relation | Target band |
|----------|-------------|
| LW – L6 (second press) | ~7–11 m |
| L6 – R6 | ~7–12 m |
| LW – LB | ~8–13 m |
| LB – LCB | ~8–12 m |
| Back line gaps | Compact; geen 15m+ gat |

---

## US — rollen (spiegel)

| ID | Role | Start baseline (≈) | On trigger | Why |
|----|------|--------------------|------------|-----|
| `us.GK` | Depth organiser | x12 y50 | Holds central depth | Diepte |
| `us.LB` | DEPTH_COVER behind LW | x30 y26 | Steps behind LW | Rugdekking |
| `us.LCV` | DEPTH_COVER_2 ball-side | x28 y44 | Shifts ball-side | Lijn dicht |
| `us.RCV` | As + diepte verre | x28 y62 | Shifts toward ball | Compact last line |
| `us.RB` | Far-side compactness | x30 y78 | Knijpt | FAR_SIDE |
| `us.L6` (**6**) | SECOND_PRESS / next inside option | x40 y44 | Denies RB→opp.8 | Zonder second press incompleet |
| `us.R6` (**8**) | INSIDE_COVER / centrum screen | x40 y56 | Screens centre | Centrum niet leeg |
| `us.10` | First-line partner | x52 y44 | Screens / slight ball-side | Bounce inside voorkomen |
| `us.LW` | **FIRST_PRESS (PRIMARY)** | x40 y26 | Curved inside-out op hun RB | **Binnenkant dicht** |
| `us.RW` | Far-side knijpen | x40 y78 | Tucks | Switch-protectie |
| `us.SP` | Steer / pin RCB–centre | x52 y56 | Cuts central recycle | Stuurt; niet solo op RB |

### Primary — `us.LW`

| Field | Spec |
|-------|------|
| Role | FIRST_PRESS |
| Marker | Opp RB |
| Gaze | Ball; peripheral inside lane / opp.8 |
| Body | Angled for curve; not square sprint |
| Pre-trigger | Press-ready; not max sprint |
| Action | Curve closes RB→inside; decelerate before duel |
| Recover | If beaten outside, recover goal-side with LB |
| Why | Close inside → force outside — cue **Binnenkant dicht** |

---

## OPPONENT — BUILDUP 4-2-3-1 (spiegel)

| Focus | Spec |
|-------|------|
| Receiver | `opp.rb` — ball at freeze |
| Trigger passer | `opp.cbR` → RB ground pass |
| Inside threat | Ball-side 8 / CM in halfspace |
| Body at freeze | Half-closed toward touchline |
| Opp LW / far | Organised; not the decision |

Overige 11 opponent-posities: spiegel van Order #1 Doc `03` opponent-blok; zelfde relationele opbouwjobs.

---

## Wet 4 check

| Check | Required |
|-------|----------|
| LW never presses with static team | **Yes** — 8/6/LB/LCB/far side move |
| Solo hero film | **Forbidden** |
| Every movement football reason | Per table above |
