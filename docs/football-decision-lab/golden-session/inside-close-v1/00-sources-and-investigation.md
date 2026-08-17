# 00 — Repository Investigation Log

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

## Scope of investigation

Only what was required for this Golden Session: pressing language, 4-2-3-1 / pressing shape, Academy/FDL file locations, pitch/animation specs, documentation home.

No broad audit. No redesign proposals. No other website phases assessed.

## 1. Academy / Decision Lab locations

| Area | Path |
|------|------|
| Chapter-1 Academie UI | `platform/src/app/(site)/academie/` |
| Module-2 Academy UI | `platform/src/app/(site)/academy/` |
| Academie lib (game model, press films) | `platform/src/lib/academie/` |
| Academy registry/routes | `platform/src/lib/academy/` |
| Tactical Pitch component | `platform/src/components/academie/tactical-pitch.tsx` |
| Legacy Academy docs | `platform/docs/academy/` |
| **New FDL docs home** | `platform/docs/football-decision-lab/` |

## 2. Existing pressing content (source material)

| Source | Relevance |
|--------|-----------|
| `tactical-press-reference-v2.ts` | Ball at `opp.lb`; first press `us.RW`; good forces outside; bad leaves inside lane to `opp.8` |
| `tactical-animation-press-v2.ts` | Curved RW run (`createPressingArc`); `pressingDirection: outside` / `touchline`; teaching line “Binnen dicht” |
| `tactical-film-standard-v1.ts` | Five pressing roles; “druk zetten ≠ iedereen naar de bal”; ball rules |
| `tactical-game-model.ts` | Attack base 4-2-3-1; defend shape 4-4-2; pressing chain steps |
| `playbook-23-S33-content.md` | Hoog pressing; trigger; schaduwdruk/curve; passlijn dicht; RW “back dicht” |
| `playbook-20-S30-content.md` | Blok; sturen; passlijn dicht |
| Registry `pb.hoog-pressing` / `sit.hoog-pressing` | Pattern-family labels |

## 3. Formation doctrine found in repo

From `tactical-game-model.ts`:

- Base attack formation: **4-2-3-1**
- Organised defending / pressing shape: **4-4-2** via SP + 10 first line, wingers drop into midfield line
- Pressing chain: SP stuurt → 10 sluit 6 → balzijde winger sluit back → balzijde 6 dekt binnenruimte → back schuift → verdediging door → verre knijpt

From PRESS V2 reference:

- Us start labeled **4-4-2**
- Opponent **BUILDUP_4_2_3_1**
- Trigger caption: “de back ontvangt gesloten aan de zijlijn”

## 4. Coach terms reused vs new

### Reused (existing club/repo language)

| Term | Where found |
|------|-------------|
| Passlijn dicht | PB20, PB23 |
| Sturen / buiten sturen | PB20, game model, PRESS V2 |
| Schaduwdruk / curve | PB23 |
| Trigger | PB23, PRESS V2 |
| Aansluiten / doorschuiven / compact | PB20–23, ACADEMY_PRESSING_RULES |
| Rugdekking / diepte | PRESS roles DEPTH_COVER |
| Verre kant knijpen | FAR_SIDE_COMPACTNESS |
| FIRST_PRESS / SECOND_PRESS / INSIDE_COVER | Film standard V1 |

### New / not yet registered as official cue

| Term | Status |
|------|--------|
| **Binnenkant dicht** | Mandated by Product Owner for this Golden Session; **not** found as registered three-word cue in repo term lists. Related phrases exist (“Passlijn dicht”, “binnenkant” in marking principle, “Binnen dicht” as animation teachingPoint). |

→ See Document 09 open decision **OD-01**.

## 5. Pitch / animation / player specs relevant later

| Spec | Path | Use for implementation (later) |
|------|------|--------------------------------|
| Display roles | `tactical-film-standard-v1.ts` | GK, LB, LCB, RCB, RB, 6, 8, 10, LW, RW, ST |
| Field % → meters | `tactical-pitch-meters.ts` | Distance bands |
| Press geometry % | `tactical-press-reference-v2.ts` | Authoring baseline coordinates |
| Curved press helper | `tactical-animation-collision.ts` (`createPressingArc`) | RW curve |
| Camera / detail crop | PRESS_V2_DETAIL_FIELD_RECT | Mobile crop suggestion |
| Marker / gaze rules | ACADEMY_MARKER_RULES | Kijkrichting layers |
| Ball rules | ACADEMY_BALL_RULES | No teleport; receive at foot |

## 6. Documents superseded for Decision Lab work

OS V1.0 supersedes as **primary product model** (Decision Lab only):

| Document | Why superseded for FDL |
|----------|------------------------|
| `academy-architecture-freeze-v1.1.md` IA/nav | Decision Lab home = train next session, not Positie/Situatie bottom-bar school model |
| Module-2 PB as “lesson unit” | Replaced by Decision Session OS blueprint |
| Chapter-1 long lesson scroll patterns | Conflict with Wet 2 (choice before explanation) and text diet |

These docs remain valid as **football curriculum source material**. They are not deleted by this authoring package.

## 7. Storage decision

Package stored at:

```text
platform/docs/football-decision-lab/golden-session/inside-close-v1/
```

Rationale:

- Lives next to existing `platform/docs/academy/` (same docs root)
- Separates FDL OS from legacy Academy IA docs
- Matches requested durable structure without creating a second top-level docs tree

## 8. Conflicts logged (not silently resolved)

1. **Us shape label:** OS prompt emphasizes 4-2-3-1; repo pressing doctrine uses 4-4-2 pressing shape from 4-2-3-1.  
2. **Contrast delta:** PRESS V2 contrast = alone vs connected team; Golden Session mandated contrast = straight sprint vs curved inside-close (team still must move — Wet 4).  
3. **Cue string:** “Binnenkant dicht” vs existing “Passlijn dicht” / “Binnen dicht”.  
4. **Force direction in PB23 excerpts:** some PB23 lines discuss force inside/long depending on trigger; Golden Session mandate + PRESS V2 + game model pressingDirection = **force outside / touchline**, protect centre.

All four appear in Document 09 as open decisions or risks.
