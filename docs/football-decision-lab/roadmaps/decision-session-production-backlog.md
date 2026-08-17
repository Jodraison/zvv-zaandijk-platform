# Decision Session Production Backlog — First Academy Release

```text
Product: Football Decision Lab
Document type: PRODUCTION BACKLOG
Scope: First Academy production release
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Backlog version: DSPB-v1.0
```

**Wat dit is:** productiebacklog van Decision Sessions voor de eerste Academy-release.  
**Wat dit niet is:** curriculum · roadmap · architectuur · governance · nieuwe Standards/Patterns-register.

**Selectieregels (waarde, niet willekeur):**

| Criterium | Hoe meegewogen |
|-----------|----------------|
| Wedstrijdfrequentie | Hoe vaak de situatie bij VRZ1 / vergelijkbaar niveau voorkomt |
| Prestatie-impact | Schade bij fout vs winst bij juiste first priority |
| Afhankelijkheden | Wat moet eerst staan om volgende sessies goedkoop te maken |
| Hergebruik | Maximale leverage van `PRESS-001` + `PAT-004` vóór nieuwe families |
| Cognitieve waarde | Eén observeerbare beslissing; transfer naar training/wedstrijd |
| Aansluiting fundament | Sessies die Certified Standard/Pattern direct consumeren eerst |

**Productieregel:** na elke afgeronde sessie moet de Academy meetbaar meer speelsterwaarde bieden (meer posities, meer zijden, of een aangrenzend wedstrijdmoment).

**ID-regel in deze backlog:**  
- Bestaande IDs (`PRESS-001`, `PAT-004`, `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1`) = vast.  
- Overige Session IDs = **productievoornemens** (nog niet Register-CERTIFIED).  
- Nieuwe Standard/Pattern-IDs worden **niet** hier uitgegeven. Waar hergebruik later ≥2 sessies vraagt: `issue-at-build` + werknaam. Alleen uitgeven als de sessie anders niet gebouwd kan worden.

---

## 1. Release strategy (incrementele waarde)

```text
Wave A — Pressing language live (zelfde wet, meer coverage)
Wave B — Team rond de first press (niet solo)
Wave C — Grenzen van de press (abort / herstel)
Wave D — Omschakeling (hoogste frequentie naast press)
Wave E — Opbouw & balbezit onder druk (aanvallende first decisions)
```

Elke wave levert speelbare Academy-waarde op ook als latere waves nog open staan.

---

## 2. Backlog — grouped

### Wave A — Pressing (fundament-consumers)

#### 1. `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Binnenkant sluiten bij druk op hun back |
| **Kort doel** | RW herkent trigger op hun LB en kiest binnenkant dicht → stuur buitenom i.p.v. rechte sprint. |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` (Recognition; Decision-flow per bestaande Golden-authoring) |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Basis — eerste prioriteit onderscheiden |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **1** |
| **Afhankelijkheden** | Golden authoring package; Language Gate cue; speelbare shell |
| **Waarom #1** | Enige sessie met volledige authoring; activeert hele Academy-loop; leert clubtaal van pressing. |

---

#### 2. `FDL-DS-INSIDE-CLOSE-LW-PRESS-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Binnenkant sluiten — spiegel (onze LW vs hun RB) |
| **Kort doel** | Zelfde prioriteit aan de andere kant; speelster transfer zonder nieuwe wet. |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` |
| **Duur** | 3:00–4:00 |
| **Moeilijkheid** | Basis — spiegelherkenning |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **2** |
| **Afhankelijkheden** | Sesssie 1 speelbaar; side-parameter spiegel; geen nieuwe Standard |
| **Waarom nu** | Verdubblet wedstrijddekking (beide flanken) met maximale hergebruik van assets/regels. |

---

#### 3. `FDL-DS-INSIDE-CLOSE-RW-DECISION-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Hun back krijgt de bal — wat doe jij eerst? (Decision) |
| **Kort doel** | Zelfde PAT/Standard; zwaardere nadruk op first-action keuze onder eerlijke freeze (LP-003). |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden — 3 geloofwaardige acties |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **3** |
| **Afhankelijkheden** | Sessies 1–2; contrast recht vs curve stabiel |
| **Waarom nu** | Zet Recognition om in stabiele wedstrijdkeuze; hoogste cognitieve ROI binnen dezelfde familie. |

---

### Wave B — Pressing (team rond first press)

#### 4. `FDL-DS-SECOND-PRESS-8-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Tweede druk: binnenoptie dichthouden als 8 |
| **Kort doel** | Ball-side 8 herkent wanneer RW first press doet en sluit de volgende binnenoptie i.p.v. mee te sprinten op de back. |
| **Standards** | `PRESS-001` (supporting roles) |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden — rolwissel t.o.v. Golden |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **4** |
| **Afhankelijkheden** | Sesssie 1 (of 3); 22-reactie/second-press leesbaar |
| **Waarom nu** | Lost “solo hero”-fout op; directe prestatiewinst zodra RW-press begint te werken. |

---

#### 5. `FDL-DS-DEPTH-COVER-RB-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Rugdekking: wat doet de back achter de press? |
| **Kort doel** | RB kiest diepte/cover i.p.v. mee naar voren te gokken wanneer RW de back onder druk zet. |
| **Standards** | `PRESS-001` (depth/cover) |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` |
| **Duur** | 3:00–4:00 |
| **Moeilijkheid** | Basis–midden |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **5** |
| **Afhankelijkheden** | Sesssie 1; last-line leesbaar op freeze |
| **Waarom nu** | Voorkomt dat geslaagde first press alsnog in de rug explodeert — hoge impact, lage nieuwe-theorie. |

---

#### 6. `FDL-DS-ST-STEER-PIN-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Spits stuurt — niet solo op hun back jagen |
| **Kort doel** | ST herkent stuur-/pinrol t.o.v. opbouw zodat de balzijde-winger de PRESS-001-actie kan uitvoeren. |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` |
| **Duur** | 3:00–4:00 |
| **Moeilijkheid** | Midden |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **6** |
| **Afhankelijkheden** | Sessies 1 + 4 |
| **Waarom hier** | Complements pressingketen; iets lager dan 8/RB omdat minder spelers dit moment “missen” in trainingstaal. |

---

#### 7. `FDL-DS-FAR-SIDE-SQUEEZE-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Verre zijde knijpt mee |
| **Kort doel** | Verre flank/back kiest compact knijpen i.p.v. hoog blijven hangen tijdens balzijde-press. |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-002` |
| **Duur** | 3:00–3:30 |
| **Moeilijkheid** | Basis–midden |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **7** |
| **Afhankelijkheden** | Sesssie 1; wide camera/context op desktop |
| **Waarom hier** | Teamcompactheid; hergebruikt zelfde state; minder cognitieve nieuwheid dan omschakeling. |

---

### Wave C — Pressing (grenzen & druk)

#### 8. `FDL-DS-PRESS-ABORT-RECOVER-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Niet doordrukken — wanneer stop je de first press? |
| **Kort doel** | Speelster herkent abort/herstel i.p.v. PRESS-001 door te forceren wanneer steun of window weg is. |
| **Standards** | `PRESS-001` (§ abort/niet starten) |
| **Patterns** | `PAT-004` |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden–hoog |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **8** |
| **Afhankelijkheden** | Sessies 1 + 3; abortcues observeerbaar |
| **Waarom nu** | Voorkomt dat succesvolle press-taal omslaat in kamikaze-press — beschermt prestatiewinst van Wave A/B. |

---

#### 9. `FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Zelfde prioriteit — minder tijd |
| **Kort doel** | Same PAT/Standard onder korter scanvenster; prioriteit mag niet verschuiven naar “bal pakken”. |
| **Standards** | `PRESS-001` |
| **Patterns** | `PAT-004` |
| **LP** | `LP-004` |
| **Duur** | 2:45–3:45 |
| **Moeilijkheid** | Hoog — tijddruk |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **9** |
| **Afhankelijkheden** | Sesssie 3 stabiel; micro-recall mechaniek |
| **Waarom hier** | Wedstrijdtransfer; bouwt op bestaande film met parameter-change — efficiënte productie. |

---

### Wave D — Omschakeling

#### 10. `FDL-DS-COUNTERPRESS-FIRST-ACTION-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Balverlies — wat is je eerste actie? |
| **Kort doel** | Direct na bezitverlies: dichtste speelster kiest directe druk/compact i.p.v. terugkijken of stoppen. |
| **Standards** | `issue-at-build` — first action after loss *(alleen uitgeven als sessie anders niet lockbaar is)* |
| **Patterns** | `issue-at-build` — loss → immediate pressure window |
| **LP** | `LP-002` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **10** |
| **Afhankelijkheden** | Pressing Waves A–C niet strikt hard, wel aanbevolen voor taalconsistentie; eigen state (geen PAT-004 activatie) |
| **Waarom #10** | Extreem hoge wedstrijdfrequentie + impact; eerste sessie buiten press-familie met maximale speelsterwaarde. |

---

#### 11. `FDL-DS-REST-DEFENCE-AFTER-BEATEN-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Geslagen in de press — wat doet de restverdediging? |
| **Kort doel** | Na verloren duel/bypass: last line + MV kiezen herstelcompactheid i.p.v. individueel najagen. |
| **Standards** | `issue-at-build` — rest defence first priority |
| **Patterns** | `issue-at-build` — press broken → recover shape |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden–hoog |
| **Prioriteit** | **P1** |
| **Releasevolgorde** | **11** |
| **Afhankelijkheden** | Sesssie 8 (abort) helpt cognitief; sessie 10 optioneel soft |
| **Waarom nu** | Hoogste schade-scenario na press-fout; koppelt pressing-release aan overleven. |

---

#### 12. `FDL-DS-FIRST-PASS-AFTER-WIN-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Bal terug — eerste pass vooruit of veilig? |
| **Kort doel** | Na balverovering: kiezen tussen progressive first pass vs beveiligen wanneer ruimte/nummers het niet toelaten. |
| **Standards** | `issue-at-build` — first pass after win |
| **Patterns** | `issue-at-build` — win → first progression decision |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **12** |
| **Afhankelijkheden** | Sesssie 10 (context balverovering) |
| **Waarom hier** | Maakt omschakeling compleet (verdedigen → aanvallen); hoge trainingswaarde. |

---

### Wave E — Opbouw · Balbezit · Aanvallen

#### 13. `FDL-DS-BUILD-UNDER-PRESS-SAFE-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Opbouw onder druk — welke optie eerst? |
| **Kort doel** | CV/6 herkent gesloten lijn en kiest veilige/circulatie-optie i.p.v. forceer door het press. |
| **Standards** | `issue-at-build` — build under pressure priority |
| **Patterns** | `issue-at-build` — organised opponent press on our buildup |
| **LP** | `LP-002` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **13** |
| **Afhankelijkheden** | Speelster kent press-taal (Wave A) als *tegenstander*-model — soft reuse |
| **Waarom hier** | Spiegel van pressing: zelfde cognitieve “lijn dicht/open”, andere rol; sterk hergebruik van scan-cues. |

---

#### 14. `FDL-DS-BUILD-BREAK-LINE-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Lijn open — speel je door of behoud je? |
| **Kort doel** | Herken wanneer een progressieve lijn wél speelbaar is na sturen/verschuiven van hun press. |
| **Standards** | zelfde family als sessie 13 (`issue-at-build` indien uitgegeven) |
| **Patterns** | zelfde family als sessie 13 |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden–hoog |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **14** |
| **Afhankelijkheden** | Sesssie 13 |
| **Waarom hier** | Voorkomt dat “veilig” de enige les wordt; balancertopbouw. |

---

#### 15. `FDL-DS-WIDE-1V1-FORCE-OUTSIDE-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | 1v1 op de flank — stuur buiten of laat binnen open? |
| **Kort doel** | Verdedigende flankspeler forceert naar touchline/buiten i.p.v. binnenkant prijs te geven. |
| **Standards** | `PRESS-001` waar first-press-logica overlapt; anders `issue-at-build` wide 1v1 force |
| **Patterns** | `issue-at-build` — isolated wide duel |
| **LP** | `LP-003` |
| **Duur** | 3:00–4:00 |
| **Moeilijkheid** | Midden |
| **Prioriteit** | **P2** |
| **Releasevolgorde** | **15** |
| **Afhankelijkheden** | Wave A taal “binnen dicht / buiten sturen” |
| **Waarom hier** | Hoge frequentie in vrouwenvoetbal 1v1-flank; hergebruikt force-outside cognitie. |

---

#### 16. `FDL-DS-HALFSPACE-RECEIVE-NEXT-ACTION-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Bal in de halfspace — wat is je volgende actie? |
| **Kort doel** | 10/8 ontvangt tussen linies en kiest schieten/combineren/terug i.p.v. stilzetten of forceren. |
| **Standards** | `issue-at-build` — halfspace next action |
| **Patterns** | `issue-at-build` — receive between lines |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Midden–hoog |
| **Prioriteit** | **P3** |
| **Releasevolgorde** | **16** |
| **Afhankelijkheden** | Sessies 13–14 helpen scan; niet hard blokkerend |
| **Waarom later** | Hoge aantrekkelijkheid, iets lagere “iedere wedstrijd overleven”-urgentie dan press/omschakeling. |

---

#### 17. `FDL-DS-SWITCH-PLAY-WHEN-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Omschakelen van flank — nu of nog niet? |
| **Kort doel** | Balbezitter/6 herkent wanneer switch speelbaar is vs wanneer balzijde eerst behouden moet. |
| **Standards** | `issue-at-build` — switch timing |
| **Patterns** | `issue-at-build` — switch under mid-block / press shift |
| **LP** | `LP-003` |
| **Duur** | 3:30–4:30 |
| **Moeilijkheid** | Hoog |
| **Prioriteit** | **P3** |
| **Releasevolgorde** | **17** |
| **Afhankelijkheden** | Sessies 13–14 |
| **Waarom later** | Sterke balbezitwaarde; complexere scan — na stevige press/omschakeling-core. |

---

#### 18. `FDL-DS-BOX-RUN-NEAR-POST-V1`

| Veld | Waarde |
|------|--------|
| **Titel** | Voorzet komt — welke loop eerst? |
| **Kort doel** | Aanvallende speler kiest near-post/penalty-spot prioriteit i.p.v. toekijken of verkeerde zone. |
| **Standards** | `issue-at-build` — box arrival priority |
| **Patterns** | `issue-at-build` — cross arrival |
| **LP** | `LP-002` |
| **Duur** | 3:00–4:00 |
| **Moeilijkheid** | Basis–midden |
| **Prioriteit** | **P3** |
| **Releasevolgorde** | **18** |
| **Afhankelijkheden** | Weinig soft deps; eigen aanvalsfamilie |
| **Waarom #18** | Hoge scoringsimpact, lagere structurele hergebruik-ROI voor first release dan press-core. |

---

## 3. Priority board (first release cut)

### Must ship for first release value (P1)

| Order | Session ID | Group |
|------:|------------|-------|
| 1 | `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` | Pressing |
| 2 | `FDL-DS-INSIDE-CLOSE-LW-PRESS-V1` | Pressing |
| 3 | `FDL-DS-INSIDE-CLOSE-RW-DECISION-V1` | Pressing |
| 4 | `FDL-DS-SECOND-PRESS-8-V1` | Pressing |
| 5 | `FDL-DS-DEPTH-COVER-RB-V1` | Pressing / Verdedigen |
| 8 | `FDL-DS-PRESS-ABORT-RECOVER-V1` | Pressing |
| 10 | `FDL-DS-COUNTERPRESS-FIRST-ACTION-V1` | Omschakeling |
| 11 | `FDL-DS-REST-DEFENCE-AFTER-BEATEN-V1` | Verdedigen / Omschakeling |

**P1-count = 8** — minimale first-release speelsterkern.

### Should ship in same release window (P2)

| Order | Session ID | Group |
|------:|------------|-------|
| 6 | `FDL-DS-ST-STEER-PIN-V1` | Pressing |
| 7 | `FDL-DS-FAR-SIDE-SQUEEZE-V1` | Pressing / Verdedigen |
| 9 | `FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1` | Pressing |
| 12 | `FDL-DS-FIRST-PASS-AFTER-WIN-V1` | Omschakeling / Aanvallen |
| 13 | `FDL-DS-BUILD-UNDER-PRESS-SAFE-V1` | Opbouw |
| 14 | `FDL-DS-BUILD-BREAK-LINE-V1` | Opbouw / Balbezit |
| 15 | `FDL-DS-WIDE-1V1-FORCE-OUTSIDE-V1` | Verdedigen |

**P1+P2 = 15** — sterke first-release bibliotheek.

### Stretch in first release / early next (P3)

| Order | Session ID | Group |
|------:|------------|-------|
| 16 | `FDL-DS-HALFSPACE-RECEIVE-NEXT-ACTION-V1` | Balbezit / Aanvallen |
| 17 | `FDL-DS-SWITCH-PLAY-WHEN-V1` | Balbezit |
| 18 | `FDL-DS-BOX-RUN-NEAR-POST-V1` | Aanvallen |

---

## 4. Value after each completion

| Na afronden tot order… | Speelsterwaarde die meteen beschikbaar is |
|------------------------|-------------------------------------------|
| **1** | Pressingtaal + RW-beslissing speelbaar |
| **2** | Beide flanken covered |
| **3** | Stabiele wedstrijdkeuze (Decision) |
| **4–5** | Teampress: 8 + RB begrijpen hun job |
| **6–7** | Volledige press-ketenrollen (ST + verre zijde) |
| **8–9** | Veilige press + onder druk |
| **10–12** | Omschakeling win/loss/rest defence |
| **13–15** | Opbouw onder druk + flankduel |
| **16–18** | Balbezit/aanval verdieping |

---

## 5. Group index

| Group | Session orders |
|-------|----------------|
| **Pressing** | 1, 2, 3, 4, 6, 7, 8, 9 |
| **Verdedigen** | 5, 11, 15 *(+ rest defence overlap)* |
| **Omschakeling** | 10, 11, 12 |
| **Opbouw** | 13, 14 |
| **Balbezit** | 14, 16, 17 |
| **Aanvallen** | 12, 16, 18 |

---

## 6. Production notes (geen architectuur)

1. **Bouwvolgorde = releasevolgorde** tenzij Product Owner een trainingsweek forceert — dan alleen P1 herschikken binnen Wave A/B.  
2. **Geen nieuwe Standard/Pattern** starten vóór Wave D, behalve als sessie 10/11 aantoonbaar niet lockbaar is zonder.  
3. **Maximaal hergebruik:** sessies 1–9 delen `PRESS-001` + `PAT-004` state-familie.  
4. **First release cut-line:** ship wanneer P1 groen is; P2 parallel trekken; P3 niet laten blokkeren.  
5. **Geen curriculum-edges** in dit document — alleen productiewachtrij.

---

## 7. Totals

| Metric | Waarde |
|--------|--------|
| Sessions in backlog | **18** |
| P1 | 8 |
| P2 | 7 |
| P3 | 3 |
| Direct op `PRESS-001` + `PAT-004` | 9 (orders 1–9) |
| Nieuwe families (issue-at-build indien nodig) | 9 (orders 10–18) |

---

DECISION SESSION PRODUCTION BACKLOG:
READY FOR PRODUCT DIRECTOR REVIEW
