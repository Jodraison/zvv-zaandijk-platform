# 04 — Animation Timeline T0–T7

```text
Product: Football Decision Lab
Session ID: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Consumes: PRESS-001@v1 · PAT-004@v1
```

## Animation unit mapping

| OS phase | Timeline |
|----------|----------|
| Set | T0–T1 |
| Trigger | T2 |
| Read / Freeze | T3 |
| Action | T4–T5 |
| Consequence | T6–T7 |

Suggested total motion budget before decision UI: **8–12 s** live + freeze hold.  
Full session including UI: **3:30–4:30**.

Timing anchors may reuse PRESS V2 seeks as engineering reference (`trigger 1800`, `firstPress 3200`, …) but Golden Session **freeze at T3** is earlier than full press completion — player must decide before the good curve is finished.

---

## T0 — Beginsituatie (Set)

| Element | Spec |
|---------|------|
| Duration | 1.5–2.5 s hold |
| Ball | At opp.cbL (or short build partner), not yet to LB |
| Possession | Opponent |
| Us | Organised pressing distances; RW press-ready |
| Opp | BUILDUP shape recognisable |
| Gaze RW | Ball / LCB |
| Cognition | Orient: we defend, I am RW, ball on their left build |

No coaching text on pitch. Optional 1-line orientation off-pitch only if needed (≤12 words).

---

## T1 — Voorbereidend scanmoment

| Element | Spec |
|---------|------|
| Duration | 1–2 s |
| Ball | Still at LCB; body opens to play wide |
| Subtle attention support | Allowed: slight focus on LB + inside channel — **must not** draw solution arrow |
| Cognition | Player should notice LB available + inside midfielder positioned |

---

## T2 — Pressingtrigger

| Element | Spec |
|---------|------|
| Event | Ground pass LCB → LB |
| Pass foot | LCB preferred foot playing wide (lock OD-06 if needed) |
| Pass speed | Controlled medium — readable, not teleported |
| Ball trajectory | Straight ground path matching any temporary pass-line overlay |
| Overlay rule | Pass-line overlay **may** show during flight if identical to actual path; remove at receive |
| LB receive | First touch at outside/half-closed body (OD-04) |
| Us reaction start | Micro pre-steps only; no full RW commit yet |
| Cognition | “Trigger: back receives” |

---

## T3 — Beslismoment / Freeze (Read)

| Element | Spec |
|---------|------|
| Freeze | Ball at LB receiving foot / first controlled touch complete |
| Inside lane | Still visibly open toward opp.8 |
| RW position | Still before decision point; curved vs straight still changes outcome |
| Team | Beginning to tense/shift — not frozen statues, but not already solving for her |
| Pass-line overlay | **Off** at freeze (do not pre-answer) |
| Cognition | Scan prompt (Doc 05): where is the danger / which line is open? |

This is the Decision Layer attach point.

---

## T4 — Gekozen actie start (branches)

### Branch B — Correct: binnenkant dicht + buitenom

| Element | Spec |
|---------|------|
| RW path | Curved arc: first vector cuts inside lane, then approaches LB from inside-out |
| Speed | Accelerate → controlled decelerate before duel distance |
| Pressing angle | Closes LB→opp.8; leaves touchline channel |
| 8 | Steps to deny opp.8 |
| 6 | Screens centre |
| RB/RCB | Depth steps |
| Far side | Knijpt |
| Ball | Remains with LB under pressure |

### Branch A — Incorrect: recht naar de bal

| Element | Spec |
|---------|------|
| RW path | Straight line to ball / LB toes |
| Inside lane | Remains open |
| 8/team | Late or incomplete relative to ball speed |
| Result setup | LB can release inside |

### Branch C — Incorrect: terugzakken

| Element | Spec |
|---------|------|
| RW | Drops toward mid line without closing lane |
| LB | Gains time; may progress or find inside freely |
| Press | Collapses / delayed |

---

## T5 — Reactie tegenstander en medespeelsters

| Correct branch | LB body forced wider/back; opp.8 unavailable; our block tightens ball-side |
| Straight branch | opp.8 separates onto receiving lane; LB plays inside |
| Drop branch | Opp build continues with time |

Communication: subtle hand/body coach from nearby mid allowed; **no** speech bubbles/emojis.

---

## T6 — Tactisch gevolg

| Correct | Ball recycled back to LCB / along touchline / long; or RW wins delayed duel — centre protected |
| Straight | Ball arrives at opp.8 (~ PRESS_V2_BAD_BALL_RESULT geometry); press broken centrally |
| Drop | Opp advances or finds free man |

Feedback Layer starts on consequence, not on “wrong”.

---

## T7 — Herstel / volgende actie

| Correct | Show brief rest-defence / second action: rem, second press, or organised recovery |
| Incorrect | Show what must be repaired (inside closed too late) — leads into Contrast Replay |
| End hold | 1–2 s readable result; no confetti |

---

## Ball standard (locked rules)

| Rule | Spec |
|------|------|
| Visibility | Ball always readable (Wet 10 / Readability Gate) |
| Receive foot | At LB foot; no hover |
| Pass speed | Continuous; easeOut acceptable; no teleport |
| Overlay sync | Any pass line = actual trajectory only |
| No invisible return paths | Forbidden |
| Contact moments | Pass release + first touch must be readable |

## Pressing standard (RW)

| Rule | Spec |
|------|------|
| Start distance | Press-ready (exact meters OD-05); not already in tackle range at T0 |
| First accelerate | On/after trigger recognition (T2→T4) |
| Curve | Mandatory on correct branch; uses inside-close geometry |
| Close line | LB → opp.8 / halfspace |
| Allowed outside | Touchline channel |
| Decelerate | Before duel — schaduwdruk, not wild tackle |
| Duel distance | Controlled; still boardable |
| Follow-up | React to next ball action |

Football reasons only — no “cool arc for aesthetics”.

---

## Camera

| Mode | Spec |
|------|------|
| Default | Stable tactical; ball + RW + opp.8 + RB/8 cluster visible |
| Mobile | Detail crop acceptable (`PRESS_V2_DETAIL_FIELD_RECT` baseline) if last-line still implied/readable in key frames |
| Forbidden | Dramatic orbits that hide inside lane at freeze |
