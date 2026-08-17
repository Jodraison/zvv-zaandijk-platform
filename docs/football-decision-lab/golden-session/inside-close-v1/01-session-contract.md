# 01 — Golden Session Contract (productie)

```text
Product: Football Decision Lab
Session ID: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
Document status: PRODUCT READY — AWAITING PD REVIEW
OS version: 1.0
Package version: inside-close-v1
Consumes: PRESS-001@v1 · PAT-004@v1
```

**Type:** Decision Session / Golden Session — Academy productie.  
**Niet:** nieuwe Standard · nieuwe Pattern · governance.

---

## Identity

| Field | Value |
|-------|-------|
| Session ID | `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` |
| Canonical situation ID | `DEF-HIGH-RIGHTWING-01` |
| Product title | Binnenkant sluiten bij druk op hun back |
| Player-facing title | Hun back krijgt de bal — wat doe jij eerst? |
| Primary position | Rechtsbuiten (`us.RW`) |
| Pattern | `PAT-004` (instantie: hun LB / onze RW) |
| Standard | `PRESS-001` (alleen consumeren) |
| LP | `LP-002` |
| Coach cue | **Binnenkant dicht** |
| Duration | 3:00–4:00 (hard cap 6:00) |
| Audience | VRZ1 / 4e klasse+; ook bruikbaar voor sterkere speelsters |
| Academy lesson script | Doc `05` |

---

## Production locks (aanbevolen defaults — build)

| Lock | Waarde | Bron |
|------|--------|------|
| Our pressing shape | 4-4-2 from 4-2-3-1 | `DOCTRINE_DEFEND` / OD-02 optie (a) |
| Opponent | BUILDUP 4-2-3-1 | PRESS V2 / OD-03 optie (a) |
| LB body at freeze | Half-closed → touchline | OD-04 optie (a) |
| Trigger pass | LCB → LB (ground) | OD-06 optie (a) |
| Interaction v1 | Drie actieknoppen A/B/C | OD-07 optie (a) |
| PRESS V2 assets | Geometry source only; nieuw contrast recht vs curve | OD-08 optie (a) |

Geen nieuwe voetbalregels — alleen uitvoerbare defaults uit bestaande aanbevelingen.

---

## Primary decision (één succescriterium)

> Wanneer hun linkerback de bal ontvangt, is mijn eerste prioriteit **niet** zo snel mogelijk bij de bal komen. Mijn eerste prioriteit is de **binnenste passlijn afsluiten** en de balbezitter **gecontroleerd naar buiten** sturen.

| | |
|--|--|
| Correct | B — Binnenkant sluiten, buitenom sturen |
| Fout A | Recht naar de bal sprinten |
| Fout C | Terugzakken naast de middenvelders |
| Cue | **Binnenkant dicht** |

Mapped to `PRESS-001` objective order 1→2 (inside close → force outside). Ball win is never the proof of success.

---

## Player scan cues (max 3 — Academy)

1. Bal naar hun back?  
2. Binnenlijn / binnen-ontvanger gevaarlijk open?  
3. Ren ik recht op de bal of sluit ik eerst die lijn?

Builder-only detail (niet op speelsterscherm): body LB, LCB, 8/6/10, RB diepte, ST stuur, last line, accel/decel — zie Doc `02`/`03`/`04`.

---

## Learning outcomes

1. Trigger herkennen (PAT-004).  
2. First priority: binnenkant dicht (PRESS-001).  
3. Gebogen press kiezen boven rechte sprint.  
4. Cue recallen: **Binnenkant dicht**.  
5. Weten: team schuift mee — geen solo.

---

## Transfer

| | |
|--|--|
| Training | Trainer roept “Binnenkant dicht”; speelster toont curve vóór contact |
| Match | Hun LB ontvangt in opbouw → eerste stap sluit binnenlijn |

---

## Scope / non-scope

**In:** één zijde · georganiseerde press · één beslissing + micro-recall · 22-logica voor realisme · mobile-first.

**Uit:** spiegel-LW · counterpress · laag blok · nieuwe Standards/Patterns · XP/scoring-systemen · photoreal 3D.

---

## Academy placement

| Check | Status |
|-------|--------|
| Player script | Doc `05` — PRODUCT READY |
| State / 22 / timeline | Docs `02`–`04` — build specs |
| Recall | Doc `06` |
| Readiness review | `reviews/phase-b/B3-Golden-Session-Product-Readiness.md` |
