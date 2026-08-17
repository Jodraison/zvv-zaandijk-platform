# 02 — Tactical State Sheet

```text
Product: Football Decision Lab
Session ID: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Consumes: PRESS-001@v1 · PAT-004@v1
```

## Canonical identity

```text
DEF-HIGH-RIGHTWING-01
Pattern:       PAT-004 (instantie balzijde rechts)
Standard:      PRESS-001 (gedrag — niet herdefiniëren)

Fase:          Hoog / middenhoog drukzetten (georganiseerd)     ← PAT-004 M1
Balzone:       Hun linkeropbouwzone (flank)                     ← PAT-004 M2/M3
Balhouder:     Linkerback tegenstander (na trigger)             ← PAT-004 M3
Binnenoptie:   Hun ball-side 8 / CM bereikbaar                  ← PAT-004 M4
First press:   Onze rechtsbuiten                                ← PAT-004 M5
Centrale beslissing:
  Onze rechtsbuiten sluit binnenkant en stuurt buitenom         ← PRESS-001
Trigger:
  Bal wordt naar hun linkerback gespeeld / aangenomen
Primaire cue:  Binnenkant dicht
```

Coordinate convention (from existing Academy engine):

- Field %; attack for **us** is left → right (+x)
- `y = 0` left wing (our LW side); `y = 100` right wing (our RW side)
- Their LB lives at high `y` (~80–86); ball-side press is our right flank

Baseline geometry source: `PRESS_REFERENCE_START_STATE` / `tactical-press-reference-v2.ts` (adapted to confirmed formation decision OD-02).

---

## Eight mandatory state layers

### Layer 1 — Wedstrijdfase

| Value | Georganiseerd hoog of middenhoog drukzetten tijdens tegenstander-opbouw |
|-------|------------------------------------------------------------------------|
| Not | Omschakeling na ons balverlies; laag blok; standaardsituatie |
| Match fiction | Minute ~20–35; score 0-0; organised press agreed for this phase |

### Layer 2 — Balzone

| Value | Hun linkeropbouwzone / flankzone |
|-------|----------------------------------|
| Ball path | From their LCB (or short build partner) → their LB |
| Receive zone | Wide left for them / our right; near touchline corridor |
| Not yet | Final third create/finish |

### Layer 3 — Teamvorm

| Side | Form |
|------|------|
| Us identity | 4-2-3-1 |
| Us pressing shape | 4-4-2 derived from 4-2-3-1 per `DOCTRINE_DEFEND` (SP + 10 first line; LW/RW in mid line) — **production lock (a)** |
| Us occupation | Compact ball-side; far side connected narrower |
| Opponent | BUILDUP 4-2-3-1 (`PRESS_V2`) — **production lock (a)** |
| Rest defence | Last line stepped up but organised; GK supports depth |

### Layer 4 — Druktoestand

| Before trigger | Light / organised readiness (shadow distances), not full chase |
| After trigger | Direct pressure on LB by RW; second pressure preparing on inside option |
| Not | Double press already completed before freeze |
| Not | Press broken / hopeless chase |

### Layer 5 — Lichaamstoestand balbezitter (their LB)

| At freeze (production) | Half-closed toward touchline; first touch under or slightly outside |
| Why | Makes inside pass tempting if lane left open; teaches close-inside first |
| Body lock | Half-closed — **production lock (a)** |
| Invalid for this session | Fully open body facing centre with free time and clear inside man already marked |

### Layer 6 — Numerieke verhouding

| Local | Near ball: RW vs LB (+ nearby opp LW / opp 8); not pure 1v1 isolation |
| Midfield | Local risk of inside overload if our 8/6 late |
| Last line | Equal / organised; not rest-defence broken |
| Free player threat | Their ball-side 8 / CM is the dangerous free receiver if inside lane open |

### Layer 7 — Ruimtetoestand

| Inside | Halfspace / channel LB → CM/8 is the critical open space if RW runs straight |
| Outside | Touchline channel intentionally left as forced option |
| Depth | Space behind our first press must be covered by RB/RCB — not abandoned |
| Pitch size | Pressing = smaller effective field ball-side; far side knijpt |

### Layer 8 — Beslissingsdruk

| Value | Beperkte tijd; directe actie nodig on first touch window |
| Not | Unlimited time lecture |
| Not | One-touch shooting chance |
| Freeze must preserve | Player can still choose approach angle; solution not already completed |

---

## Direction, camera, build-up

| Item | Spec |
|------|------|
| Attack direction (us) | Left → right in engine |
| Visible field | Prefer detail crop around ball-side press (see `PRESS_V2_DETAIL_FIELD_RECT` as baseline) while keeping last-line context readable on desktop |
| Opponent build start | GK/LCB short circulation → pass into LB |
| Trigger pass | LCB → LB (ground, controlled pace) |
| Pre-trigger organisation | Us already in pressing distances; SP/10 screening centre options; RW in press-ready posture — **not** already sprinting |
| Post-trigger change | RW commits; 8 steps to inside option; 6 screens centre; RB steps for depth; line shifts ball-side; far side knijpt |

---

## Freeze moment

| Item | Spec |
|------|------|
| When | Ball is at or just onto their LB’s receiving foot; RW has not yet committed the wrong/right curve past the decision point |
| Why last fair moment | Inside lane still visually open; curved vs straight choice still changes the next pass; team has not already closed everything for her |
| Too early | Ball still at LCB with many equal options — dilutes single decision |
| Too late | RW already past the inside lane or LB already released inside pass |

---

## Why “Binnenkant dicht” is first priority **in this state**

Conditions that make inside-close first priority:

1. Their LB is the receiver on the flank.  
2. Their nearest midfielder offers a progressive inside pass.  
3. Our team’s pressing plan is to protect the centre and force wide (`pressingDirection: outside` / game-model “stuur naar flank, bescherm centrum”).  
4. A straight sprint to the ball leaves the LB→CM lane as the highest-value escape.  
5. Closing inside first removes that escape **before** contact, then outside becomes the forced channel.

This is **state-dependent**, not a universal football law.

---

## Conditions that would change the correct first action

Mark these as **out of session** or future variants — do not teach one universal answer:

| Changed condition | Likely priority shift |
|-------------------|----------------------|
| Inside midfielder tightly covered and outside man free for 2v1 up the line | May delay press / show different cover |
| LB receives fully open with time and RW starting too high | Risk of being played around — delay or curve earlier |
| Ball already played inside before RW can close | Become recover / second ball — different session |
| Press broken; numbers behind | Drop and reorganise block — not this session |
| Our position is CB stepping, not RW | Different primary actor |

Session script must never claim “football always has only one solution.” It claims: **in this state, first priority for RW is inside-close.**

---

## Invalidating the situation (do not ship if present)

- Opponent midfield empty so inside pass is unreal  
- Our team frozen while RW presses alone (violates Wet 4 / PRESS roles)  
- LB already facing fully inside with free man and no time pressure (wrong freeze)  
- Pass lane overlay shows a path the ball never takes  
- Us still in pure attack 3-2-5 occupation while “pressing”  
- Solution arrow drawn before decision  

---

## Link to Animation / Positioning

- Player-by-player: Document 03  
- T0–T7 timing: Document 04  
- Decision wording: Document 05  
