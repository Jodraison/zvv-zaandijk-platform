# 11 — OD-01 Review: Canonieke Pressingstandaard

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

**Doel:** Product Director in staat stellen een definitieve **PASS** of **BLOCKED** te geven op de canonieke pressingstandaard zoals die uit het Golden Session-authoringpakket `inside-close-v1` is te reconstrueren.

**Bronnen (alleen bestaand):** `01-session-contract.md`, `02-tactical-state-sheet.md`, `03-positioning-map-22.md`, `04-animation-timeline-t0-t7.md`, `05-decision-feedback-contrast-script.md`, `06-micro-recall-variant.md`, `09-risks-and-open-decisions.md`, `10-product-decisions-summary.md`, `00-sources-and-investigation.md`.

**Geen nieuwe voetbalfilosofie. Geen nieuwe pressingregels. Geen implementatie.**

---

## 1. Executive Summary

De Golden Session definieert één canonieke pressingactie voor deze toestand:

> Wanneer hun **linkerback** de bal ontvangt, is de eerste prioriteit van onze **rechtsbuiten** niet zo snel mogelijk bij de bal komen, maar de **binnenste passlijn afsluiten** en de balbezitter **gecontroleerd naar buiten** sturen.

| Element | Reconstructie uit authoring |
|---------|-----------------------------|
| Situatie-ID | `DEF-HIGH-RIGHTWING-01` |
| Fase | Georganiseerd hoog / middenhoog drukzetten tijdens tegenstander-opbouw |
| Trigger | Pass naar / aanname door hun LB |
| Primary actor | Rechtsbuiten (`us.RW`) — FIRST_PRESS |
| Juiste actie | Gebogen aanloop: binnenkant dicht → stuur buitenom |
| Coach cue | **Binnenkant dicht** |
| Force direction | Outside / touchline; centrum beschermen |
| Verboden beeld | Blind recht naar de bal sprinten; RW solo terwijl team stilstaat |
| State-claim | Prioriteit geldt **in deze toestand**, niet als universele voetbalwet |

**Naming note (voor Product Director):** In `09` / `10` heet **OD-01** “Register coach cue Binnenkant dicht”. Dit reviewdocument gebruikt de opdrachtformulering **OD-01 — Canonieke Pressingstandaard** en reconstrueert de **volledige pressingstandaard** (inclusief die cue). Zie §13 en §14.

---

## 2. Exacte pressingtrigger

Uit `01` + `02` + `04`:

| Item | Spec uit authoring |
|------|--------------------|
| Wedstrijdfase | Georganiseerd hoog of middenhoog drukzetten; **niet** omschakeling na ons balverlies; **niet** laag blok |
| Opbouw start | Tegenstander bouwt van achteruit; GK/LCB short circulation → pass into LB |
| Trigger event | Ground pass **LCB → LB** (aanbevolen lock OD-06: LCB→LB; contract noemt ook “or build partner”) |
| Passkarakter | Controlled medium; leesbaar; geen teleport |
| Balzone | Hun linkeropbouwzone / flankzone (our right) |
| Ontvanger | Hun linkerback (`opp.lb`) |
| Cognitie op trigger | “Trigger: back receives” |
| Pre-trigger | Team al in pressingafstanden; RW press-ready — **niet** al max sprint |
| Post-trigger | RW commit; 8 naar inside option; 6 screens centre; RB depth; line ball-side; far side knijpt |

---

## 3. Beslismoment

Uit `02` + `04` + `05`:

| Item | Spec uit authoring |
|------|--------------------|
| Freeze (T3) | Bal op LB receiving foot / first controlled touch complete |
| RW | Nog vóór het besluitpunt; curve vs recht verandert nog de volgende pass |
| Inside lane | Nog zichtbaar open richting `opp.8` |
| Team | Begint te spannen/schuiven — geen standbeelden, maar lost het nog niet voor haar op |
| Overlay | Passlijn-overlay **uit** bij freeze |
| Te vroeg | Bal nog bij LCB met te veel gelijke opties |
| Te laat | RW al voorbij inside lane of LB speelt al naar binnen |
| Scan prompt | “Welke lijn is het gevaarlijkst open?” / gevaar herkennen |
| Primaire keuze | Eerste actie als rechtsbuiten: A recht sprint / B binnenkant sluiten buitenom sturen / C terugzakken |

---

## 4. Canonieke gebogen aanloop

Uit `01` + `04` + `05` (correct branch B):

| Item | Spec uit authoring |
|------|--------------------|
| Pad | Curved arc: eerste vector snijdt de inside lane; daarna nadering van LB inside-out |
| Doel van de bocht | Binnenlijn dichtdoen vóór contact; niet “mooie bocht” |
| Contrast-fout | Rechte lijn naar bal / LB-tenen |
| Pressing angle (goed) | Sluit LB→opp.8; laat touchline-kanaal |
| Lichaam RW (pre) | Angled voor curve-intent; geen square sprint-houding |
| Cue | **Binnenkant dicht** |
| Uitlegkern | “Eerst de lijn, dan het duel.” |

---

## 5. Binnenste passlijn (wat moet dicht)

Uit `02` Layer 7 + `03` + `04` + `05`:

| Item | Spec uit authoring |
|------|--------------------|
| Definitie | Halfspace / channel **LB → CM/8** (`opp.8` als progressive inside option) |
| Waarom kritiek | Bij rechte sprint blijft dit het hoogste-waarde ontsnappingspad |
| Wie sluit primair (hoek) | RW met gebogen aanloop (FIRST_PRESS) |
| Wie ontkent de ontvanger | **8** (SECOND_PRESS) stapt naar deny `opp.8` |
| Wie screens dieper centrum | **6** (INSIDE_COVER) — “niet op de bal” |
| Gevolg als open | LB speelt naar middenvelder; press valt centraal weg (`PRESS_V2_BAD_BALL_RESULT` geometry als referentie) |
| Gevolg als dicht | LB gedwongen terug / wide / long / duel; centrum beschermd |

---

## 6. Buitenste passlijn (wat mag open blijven)

Uit `02` + `03` + `04` + game-model citations in authoring:

| Item | Spec uit authoring |
|------|--------------------|
| Toegestaan kanaal | Touchline / buitenom (“Allowed outside: Touchline channel”) |
| Force direction | `pressingDirection: outside` / “stuur naar flank, bescherm centrum” |
| Opp LW | Outside option / combinatie met LB — mag open als **bedoelde** stuurkant |
| Niet het leerdoel | De buitenlijn “winnen” als eerste prioriteit; eerste prioriteit is binnen dicht |
| Gewenst tactisch gevolg | Opties van LB naar touchline / terug; trap ball-side mogelijk |

---

## 7. Sprint-, rem- en duelmoment

Uit `04` Pressing standard (RW) + `01` follow-up + `05`:

| Moment | Spec uit authoring |
|--------|--------------------|
| Startafstand T0 | Press-ready; **niet** al in tackle-range (exacte meters: OD-05) |
| Eerste versnelling | On/after trigger recognition (T2→T4) |
| Remmen | Vóór duel — **schaduwdruk**, geen wild tackle |
| Duelafstand | Controlled; still boardable |
| Follow-up na eerste prioriteit | Rem vóór duel; second press van 8; ball recovery of force back/long; rest defence holds |
| Verboden | Blind recht naar de bal sprinten; overrun zonder lijn |

---

## 8. Reactie van iedere relevante speler

Reconstructie uit `03` (relationele regels + per-speler) en `02` post-trigger.

### Spits (ST)

| | |
|--|--|
| Rol | Steer / pin LCB–centre; first line |
| Op trigger | Past aan om centrale recycle LCB/keeper te snijden |
| Mag niet | Solo jagen op hun LB |
| Waarom | “SP stuurt drukrichting” (`DOCTRINE_PRESSING_CHAIN` in authoring) |

### 10

| | |
|--|--|
| Rol | First-line partner; screens opp 6–centre |
| Op trigger | Holds/screens; lichte ball-side adjust |
| Waarom | Voorkomt easy bounce inside; steunt SP |

### 6 (`us.L6`)

| | |
|--|--|
| Rol | INSIDE_COVER / centrum screen |
| Op trigger | Stapt richting ball-side centre |
| Mag niet | Op de bal staan i.p.v. centrum sluiten |
| Band | 8–6 ~7–12 m (PRESS V2 meter target) |

### 8 (`us.R6`)

| | |
|--|--|
| Rol | SECOND_PRESS; sluit volgende inside option (`opp.8`) |
| Op trigger | Advances to deny LB→opp.8 |
| Waarom | Zonder 8 is RW-curve incompleet |
| Band | RW–8 ~7–11 m |

### Rechtsback (RB)

| | |
|--|--|
| Rol | DEPTH_COVER achter RW |
| Op trigger | Steps up/in achter RW |
| Tijdens press | Ruimte achter RW doden; niet alleen ball-watching |
| Band | RW–RB ~8–13 m |

### Rechter centrale verdediger (RCB)

| | |
|--|--|
| Rol | DEPTH_COVER_2 / as + diepte ball-side |
| Op trigger | Steps and shifts ball-side; verbindt met RB |
| Waarom | Geen gat tussen RB en RCB |
| Band | RB–RCB ~8–12 m |

### Linker centrale verdediger (LCB)

| | |
|--|--|
| Rol | As + diepte verre/half |
| Op trigger | Shifts toward ball; houdt partnerafstand |
| Waarom | Compacte laatste lijn; niet hangen |

### Linksback (LB)

| | |
|--|--|
| Rol | Far-side compactness |
| Op trigger | Knijpt; blijft verbonden; let op opp RW |
| Waarom | FAR_SIDE — switch protection |

### Linksbuiten (LW)

| | |
|--|--|
| Rol | Far-side knijpen |
| Op trigger | Tucks; klaar voor switch |
| Mag niet | Ball-watching tourist |
| Waarom | FAR_SIDE_COMPACTNESS |

### Laatste lijn

| | |
|--|--|
| Gedrag | Schuift als geheel; gaps houden; stepped up but organised |
| Verboden | Solo step met 15m+ gat |
| GK | Depth organiser; ready for long/over RW |

**Verbod uit authoring:** RW drukt terwijl overige teammates op startcoördinaten blijven staan.

---

## 9. Teamcompactheid tijdens de pressingactie

Uit `02` + `03`:

| Aspect | Spec uit authoring |
|--------|--------------------|
| Ball-side | Compact; smaller effective field |
| Far side | Connected narrower; knijpt |
| Horizontaal/verticaal | Afstandsbanden RW–8–6–RB–RCB zoals tabel §8 |
| Druktoestand na trigger | Directe druk RW op LB; second pressure preparing on inside option |
| Niet | Double press al voltooid vóór freeze |
| Niet | Iedereen naar de bal (Academy pressing rule in bronnen: “druk zetten ≠ iedereen naar de bal”) |

---

## 10. Restverdediging

Uit `02` + `03` + `04` T7:

| Item | Spec uit authoring |
|------|--------------------|
| Tijdens press | Last line stepped up but organised; GK supports depth |
| Als RW geslagen | RB/RCB first recovery structure; RW recovers goal-side with RB |
| Na correcte actie (T7) | Brief rest-defence / second action: rem, second press, or organised recovery |
| Depth space | Achter first press moet gedekt blijven (RB/RCB) — niet verlaten |

---

## 11. Uitzonderingen op de standaard

Uitdrukkelijk uit `02` — **niet** als Golden-les tonen; juiste eerste actie kan verschuiven:

| Gewijzigde voorwaarde | Authoring-gevolg |
|----------------------|------------------|
| Inside midfielder al strak gedekt; outside man free voor 2v1 up the line | May delay press / show different cover |
| LB fully open + tijd; RW starts too high | Risk of being played around — delay or curve earlier |
| Bal al naar binnen gespeeld vóór RW kan sluiten | Recover / second ball — **andere session** |
| Press broken; numbers behind | Drop and reorganise block — **niet deze session** |
| Primary actor is CB stepping, niet RW | Andere primary actor |

Authoring verbiedt de boodschap dat voetbal altijd één universele oplossing heeft. Claim is: **in deze toestand** is inside-close eerste prioriteit voor RW.

---

## 12. Welke onderdelen universeel moeten gelden voor alle toekomstige pressinglessen

Alleen wat het authoringpakket zelf als herbruikbare doctrine/taal/rollen markeert (niet: de flank-specifieke Golden details).

| Onderdeel | Universeel volgens authoring-bronnen in package |
|-----------|--------------------------------------------------|
| Eén primaire beslissing per session | Wet 1 / Decision Session OS |
| Keuze vóór uitleg | Wet 2 |
| Geen beweging zonder voetbalreden; volledige 22-logica | Wet 3–4 |
| Contrast verplicht | Wet 6 |
| Vaste coachtaal; geregistreerde cues | Wet 7 / Language OS |
| Pressingrollen-keten | FIRST_PRESS, SECOND_PRESS, INSIDE_COVER, DEPTH_COVER, FAR_SIDE_COMPACTNESS (`00` / film standard refs) |
| “Druk zetten ≠ iedereen naar de bal” | ACADEMY_PRESSING_RULES in bronnen |
| Force principle (deze club-doctrine in package) | Stuur naar flank / bescherm centrum wanneer dat de pressingDirection is |
| Schaduwdruk: versnellen → remmen vóór duel | Pressing standard RW |
| State-afhankelijkheid | Juiste actie kan wijzigen als voorwaarden wijzigen (`02`) |
| Cue-formaat | ≤3 woorden; training-bruikbaar |

**Niet automatisch universeel zonder Product Director-lock:** exacte flank (LB/RW), exacte opponent formatie, exacte startmeters, exacte contrastdelta “recht vs curve” vs legacy “solo vs team” (OD-02/03/05/08).

---

## 13. Mogelijke risico’s of tegenstrijdigheden in de huidige authoringdocumenten

| ID | Tegenstrijdigheid / risico (uit package) | Status voor PD |
|----|------------------------------------------|----------------|
| N1 | In `09`/`10` is **OD-01** = cue-registratie; deze review noemt OD-01 = canonieke pressingstandaard | QUESTION |
| N2 | Us identity 4-2-3-1 vs pressing shape 4-4-2 (`DOCTRINE_DEFEND` / PRESS V2) — OD-02 open | QUESTION |
| N3 | PRESS V2 contrast = alone vs connected; Golden contrast = straight vs curve (AR-02 / OD-08) | RISK |
| N4 | Cue **Binnenkant dicht** nog niet geregistreerd; “Passlijn dicht” bestaat al (OD-01 in Doc 10 / AR-03) | RISK |
| N5 | PB23-bronmateriaal noemt soms force inside/long; Golden lockt outside/touchline (AR-07) | RISK |
| N6 | Trigger: contract “LCB or build partner” vs timeline-aanbeveling strikt LCB→LB (OD-06) | QUESTION |
| N7 | RW start: PRESS V2 ~x40 y74 vs high-press preset ~x64 y70 (OD-05) | QUESTION |
| N8 | LB body: half-closed recommended maar OD-04 open | QUESTION |
| N9 | Verwarring “sturen” vs “lijn sluiten” (AR-04) — mitigated in script, blijft reviewpunt | RISK |
| N10 | State-dependent priority vs toekomstige “universele” pressinglessen — §11/§12 moeten bewust gescheiden blijven | RISK |

---

## 14. Product Director Decision Support

### Wat u nu kunt PASS/BLOCKED-en

| Besluitvraag | PASS betekent | BLOCKED betekent |
|--------------|---------------|------------------|
| Is de gereconstrueerde pressingstandaard (§2–§11) de canonieke standaard voor Golden Session `DEF-HIGH-RIGHTWING-01`? | Authoring mag hierop voortbouwen; implementatieprompt later alleen binnen deze standaard | Authoring moet worden herzien voordat certificering verdergaat |
| Mogen §12-onderdelen als club-brede pressinglessen-regels gelden, met §11 als uitzonderingskader? | Toekomstige pressing Decision Sessions erven deze universele laag | Universele claim te breed / te vroeg — beperk tot Golden only |

### Afhankelijkheden (niet stilzwijgend invullen)

Zelfs bij PASS op deze standaard blijven de volgende locks uit het package nodig voor bouw: OD-02 (shape), OD-03 (opponent), OD-04 (LB body), OD-05 (RW start), OD-06 (trigger passer), OD-08 (PRESS V2 assets). Cue-registratie staat in Doc 10 als OD-01 — zie N1.

### Product Director Decision

| Veld | Invullen door Product Director |
|------|--------------------------------|
| Canonical pressing standard for Golden | |
| Scope of §12 universality | |
| Resolution of naming OD-01 (cue vs full standard) | |
| Overall | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

## Compacte statusabel

| Onderdeel | Status | Opmerking |
|-----------|--------|-----------|
| Executive reconstruction | PASS | Eén primaire RW-beslissing; cue Binnenkant dicht; force outside |
| Exacte pressingtrigger | QUESTION | LCB→LB aanbevolen; contract laat “build partner” toe (OD-06) |
| Beslismoment / freeze | PASS | T3 fair moment gespecificeerd; te vroeg/te laat gedefinieerd |
| Canonieke gebogen aanloop | PASS | Inside-out curve vs rechte sprint als contrast |
| Binnenste passlijn | PASS | LB→opp.8/halfspace; RW + 8 + 6 rollen |
| Buitenste passlijn | PASS | Touchline mag open als stuurkant |
| Sprint / rem / duel | QUESTION | Volgorde gespecificeerd; startmeters hangen aan OD-05 |
| Spelerreacties 22-logica | PASS | Per rol + relationele tabel in Doc 03 |
| Teamcompactheid | PASS | Ball-side compact; far side knijpt; meterbanden genoteerd |
| Restverdediging | PASS | RB/RCB recovery; T7 brief rest-defence |
| Uitzonderingen | PASS | State-dependent; geen universele-oplossing-claim |
| Universeel voor toekomstige press-lessen | QUESTION | §12 = herbruikbare OS-laag; flankdetails niet automatisch universeel |
| Naming OD-01 (cue vs pressingstandaard) | QUESTION | Conflict tussen Doc 10 en deze review-opdracht |
| PRESS V2 vs Golden contrast | RISK | Verkeerde contrast-delta bij hergebruik assets |
| Cue-registratie vs bestaande “Passlijn dicht” | RISK | Club Language Gate / AR-03 |
| Force-direction vs PB23 bronmateriaal | RISK | Golden lockt outside; PB23 soms andere stuurtaal |
| Shape 4231 vs pressing 442 | QUESTION | OD-02 open |

---

```text
OD-01 REVIEW PACKAGE:
READY FOR PRODUCT DIRECTOR DECISION
```
