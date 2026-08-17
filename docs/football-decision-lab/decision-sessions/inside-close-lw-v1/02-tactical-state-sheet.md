# 02 — Tactical State Sheet — Order #2

```text
Product: Football Decision Lab
Session ID: FDL-DS-INSIDE-CLOSE-LW-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Consumes: PRESS-001@v1 · PAT-004@v1
Quality reference: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
```

## Canonical identity

```text
DEF-HIGH-LEFTWING-01
Pattern:       PAT-004 (instantie balzijde links / onze LW)
Standard:      PRESS-001 (gedrag — niet herdefiniëren)

Fase:          Hoog / middenhoog drukzetten (georganiseerd)     ← PAT-004 M1
Balzone:       Hun rechteropbouwzone (flank)                    ← PAT-004 M2/M3
Balhouder:     Rechterback tegenstander (na trigger)            ← PAT-004 M3
Binnenoptie:   Hun ball-side 8 / CM bereikbaar                  ← PAT-004 M4
First press:   Onze linksbuiten                                 ← PAT-004 M5
Centrale beslissing:
  Onze linksbuiten sluit binnenkant en stuurt buitenom          ← PRESS-001
Trigger:
  Bal wordt naar hun rechterback gespeeld / aangenomen
Primaire cue:  Binnenkant dicht
```

Coordinate convention (zelfde engine als Order #1):

- Field %; attack for **us** is left → right (+x)
- `y = 0` left wing (our LW side); `y = 100` right wing (our RW side)
- Hun RB leeft op lage `y` (~14–20); ball-side press = onze linkerflank
- Spiegelregel t.o.v. Order #1: relationele jobs gelijk; `y' ≈ 100 − y`

Baseline: spiegel van Order #1 / PRESS V2 right-side geometry.

---

## Eight mandatory state layers

### Layer 1 — Wedstrijdfase

| | |
|--|--|
| Value | Georganiseerd hoog of middenhoog drukzetten tijdens tegenstander-opbouw |
| Not | Omschakeling na ons balverlies; laag blok; standaardsituatie |

### Layer 2 — Balzone

| | |
|--|--|
| Value | Hun rechteropbouwzone / flankzone |
| Ball path | From their RCB (or short build partner) → their RB |
| Receive zone | Wide right for them / our left; near touchline corridor |

### Layer 3 — Teamvorm

| | |
|--|--|
| Us identity | 4-2-3-1 |
| Us pressing shape | 4-4-2 from 4-2-3-1 — production lock (zelfde als Order #1) |
| Opponent | BUILDUP 4-2-3-1 — production lock |
| Rest defence | Last line organised; GK supports depth |

### Layer 4 — Druktoestand

| | |
|--|--|
| Before trigger | Organised readiness |
| After trigger | Direct pressure on RB by LW; second pressure on inside option |
| Not | Press broken / hopeloze chase |

### Layer 5 — Lichaamstoestand balbezitter (their RB)

| | |
|--|--|
| At freeze | Half-closed toward touchline |
| Why | Inside pass tempting if lane left open |
| Invalid | Fully open + free time + inside already marked |

### Layer 6 — Numerieke verhouding

| | |
|--|--|
| Local | LW vs RB (+ nearby opp RW / opp 8) |
| Free player threat | Their ball-side 8 / CM if inside lane open |

### Layer 7 — Ruimtetoestand

| | |
|--|--|
| Inside | Channel RB → CM/8 critical if LW runs straight |
| Outside | Touchline = forced option |
| Depth | Covered by LB/LCB behind first press |

### Layer 8 — Beslissingsdruk

| | |
|--|--|
| Value | Beperkte tijd; actie op first-touch window |
| Freeze | Approach angle nog kiesbaar; oplossing niet klaar |

---

## Freeze moment

| | |
|--|--|
| When | Ball at/just onto their RB; LW not past decision point |
| Why fair | Inside lane still open; curve vs straight changes next pass |
| Too early | Ball still at RCB with many equal options |
| Too late | LW past inside lane or RB already played inside |

---

## Why first priority (state — not new law)

Zelfde logica als Order #1 / PRESS-001: progressive inside is hoogste-waarde escape → eerst dicht → stuur buiten.  
**State-dependent.** Geen universele wet buiten PAT-004 activatie.
