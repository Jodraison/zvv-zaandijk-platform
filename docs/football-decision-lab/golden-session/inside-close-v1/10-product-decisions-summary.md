# 10 — Product Decisions Summary (OD-01 t/m OD-10)

```text
Product: Football Decision Lab
Session: Binnenkant sluiten bij druk op hun back
Document status: AUTHORING REVIEW REQUIRED
OS version: 1.0
Implementation status: NOT STARTED
```

**Doel:** Alle open Product Director-beslissingen uit `09-risks-and-open-decisions.md` in één reviewronde definitief vaststellen.

**Bron:** Uitsluitend het bestaande Golden Session-authoringpakket `inside-close-v1`. Geen nieuwe opties, geen nieuwe aanbevelingen.

---

# OD-01 — Register coach cue “Binnenkant dicht”

## Onderwerp
Of de primaire coach cue **Binnenkant dicht** officieel wordt opgenomen in het Football Language OS, of dat wordt teruggevallen op een bestaande term zoals **Passlijn dicht**.

## Waarom deze beslissing nodig is
De Club Language Gate en het Football Language OS eisen registratie vóór livegang. Zonder besluit blijft de Golden Session geblokkeerd op taalconsistentie, ook als tactiek en animatie kloppen.

## Mogelijke opties
- **(a)** Registreer **Binnenkant dicht** als officiële cue; noteer relatie/synoniem ten opzichte van **Passlijn dicht**.
- **(b)** Wijzig de cue naar bestaande **Passlijn dicht** (conflicteert met het Product Owner-mandaat voor deze Golden Session).

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Football Language OS:** nieuwe goedgekeurde cue + ondersteunende term. **Tactical State / Positioning / Animation:** geen inhoudelijke wijziging; cue-label blijft. **Decision Session OS:** script en closure blijven zoals geschreven. **Toekomstige sessions:** herbruikbare standaardcue voor binnenlijn-prioriteit. **Onderhoud:** één canonieke drie-woorden-cue. |
| **(b)** | **Football Language OS:** geen nieuwe cue; bestaande term blijft leidend. **Decision Session OS:** alle Golden-copy met “Binnenkant dicht” moet herzien. **Tactical State / Positioning / Animation:** ongewijzigd in geometrie, wel andere verbale framing. **Toekomstige sessions:** risico op vermenging “passlijn dicht” vs “binnenkant eerst”. **Onderhoud:** conflicteert met vastgelegde Product Owner-cue. |

## Aanbevolen standaard
**(a)** Registreer **Binnenkant dicht** als officiële cue voor dit gedrag; houd **Passlijn dicht** als ondersteunende term.

## Risico bij verkeerde keuze
Livegang faalt op Club Language Gate; of speelsters horen twee verschillende cues voor hetzelfde gedrag in training versus app.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-02 — How to present our shape on screen

## Onderwerp
Hoe de eigen ploegvorm visueel wordt gepresenteerd: pressingvorm **4-4-2** afgeleid van identiteit **4-2-3-1**, of 4-2-3-1-labels met 10 naast de spits, of een andere trainer-gespecificeerde weergave.

## Waarom deze beslissing nodig is
Het OS-prompt benadrukt 4-2-3-1; de bestaande repo-doctrine (`DOCTRINE_DEFEND` / PRESS V2) gebruikt pressingbezetting 4-4-2 vanuit 4-2-3-1. Zonder keuze bouwen authors tegenstrijdige formaties.

## Mogelijke opties
- **(a)** Toon pressing **4-4-2** met identiteitsnotitie “from 4-2-3-1”.
- **(b)** Houd **4-2-3-1**-labels met 10 visueel naast ST.
- **(c)** Andere trainer-gespecificeerde weergave.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Tactical State / Positioning:** aansluiting op `DOCTRINE_DEFEND` en PRESS V2-bezetting. **Animation OS:** hergebruik van bestaande press-geometry makkelijker. **Football Language OS:** “uit 4-2-3-1 → pressing 4-4-2” moet helder blijven. **Decision Session OS:** oriëntatie mag kort de vorm noemen. **Toekomstige sessions / onderhoud:** één pressingpresentatie-standaard. |
| **(b)** | **Positioning / Animation:** 10-hoogte en middenveldlijn wijken af van PRESS V2-start; herpositionering nodig. **Tactical State:** spanning met bestaande defend-doctrine. **Toekomstige sessions:** inconsistente pressingbeelden. **Onderhoud:** hogere authoringkosten. |
| **(c)** | Alle OS-lagen wachten op trainer-spec; Golden kan niet worden bevroren tot die spec er is. **Onderhoud:** unieke uitzondering zonder patroon. |

## Aanbevolen standaard
**(a)** — komt overeen met `DOCTRINE_DEFEND` / PRESS V2 occupation logic.

## Risico bij verkeerde keuze
Animaties tonen een andere ploegvorm dan trainingstaal; Positioning Gate en toekomstige press-sessions divergeren.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-03 — Opponent formation lock

## Onderwerp
Welke tegenstanderformatie vastligt voor de Golden Session-opbouw, zodat alle 22 posities stabiel zijn.

## Waarom deze beslissing nodig is
De Positioning Map, Animation Timeline en contrastvarianten hangen af van wie de binnenoptie is (bijv. ball-side 8) en hoe de LB ontvangt. Zonder lock is de 22-kaart onstabiel.

## Mogelijke opties
- **(a)** BUILDUP **4-2-3-1** (PRESS V2).
- **(b)** **4-3-3** build.
- **(c)** Other.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Tactical State / Positioning / Animation:** directe aansluiting op bestaande PRESS V2 opponent model. **Decision Session OS:** gevaar = LB → opp.8 blijft zoals gespecificeerd. **Football Language:** ongewijzigd. **Toekomstige sessions / onderhoud:** canonieke opbouwtegenstander voor flankpress. |
| **(b)** | **Positioning / Animation:** midfield roles en inside-receiver wijzigen; Docs 03–05 moeten herberekend. **Tactical State:** andere numerieke/ruimtelijke laag. **Onderhoud:** geen hergebruik van PRESS V2-opponentgeometry. |
| **(c)** | Alles blijft open tot gespecificeerd; Golden authoring niet implementatieklaar. |

## Aanbevolen standaard
**(a)** BUILDUP 4-2-3-1.

## Risico bij verkeerde keuze
Verkeerde “gevaarlijke middenvelder”, onjuiste contrastgevolgen, en latere sessions die niet aansluiten op deze Golden norm.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-04 — Exact LB body angle at freeze

## Onderwerp
De exacte lichaamshoek van hun linkerback op het freeze-moment: half-closed naar de zijlijn, volledig gesloten, of licht open.

## Waarom deze beslissing nodig is
De lichaamshoek bepaalt hoe leesbaar en verleidelijk de open binnenlijn is — dus of het beslismoment eerlijk en leerbaar is (Perception / Cognitive Gate).

## Mogelijke opties
- **(a)** Half-closed to touchline.
- **(b)** Fully closed.
- **(c)** Slightly open.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Tactical State / Perception:** binnenpass verleidelijk maar niet karikaturaal. **Animation OS:** duidelijke half-closed pose op T3. **Decision Session:** keuzes A/B blijven betekenisvol. **Toekomstige sessions:** standaard “tempting inside” freeze. **Onderhoud:** herbruikbare body-band. |
| **(b)** | **Cognitive / Animation:** binnenoptie minder vanzelfsprekend; risico dat speelsters alleen “tackle de back” zien. **Decision Session:** prioriteit “binnenkant dicht” minder zichtbaar. |
| **(c)** | **Cognitive Gate-risico:** antwoord voelt te voor de hand liggend of body “geeft” de inside al weg. **Animation:** makkelijker spoiler via houding. |

## Aanbevolen standaard
**(a)** Half-closed — inside pass tempting but not cartoon-obvious.

## Risico bij verkeerde keuze
Oneerlijk of te makkelijk freeze-moment; speelsters leren het verkeerde moment of missen de binnenlijn-cue.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-05 — RW start distance / height

## Onderwerp
Vanaf welke startpositie/hoogte onze rechtsbuiten begint (PRESS V2-start, high-press preset, of trainer-gemeten meters).

## Waarom deze beslissing nodig is
Startafstand bepaalt of de gebogen aanloop leerbaar is, of de druk te triviaal/onhaalbaar wordt, en of meterbanden in Positioning OS kloppen.

## Mogelijke opties
- **(a)** PRESS V2 start (~x40 y74).
- **(b)** PRESET_US_HIGH_PRESS RW (~x64 y70).
- **(c)** Trainer-measured meters.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Positioning / Animation:** continuïteit met bestaande referentiegeometry; curve/afstanden uit PRESS V2 bruikbaar als baseline. **Tactical State:** mid-high press readiness. **Decision Session / toekomst:** consistente start voor flankpress. **Onderhoud:** minder nieuwe coordinaten. |
| **(b)** | **Animation:** kortere sprint; curve en deceleratie anders getimed. **Positioning:** RW–RB / RW–8 banden herschalen. **Risico:** te dicht bij duel → minder “eerst lijn”. |
| **(c)** | **Alle OS-lagen:** wachten op veldmeting; hoogste voetbalgetrouwheid, laagste snelheid naar CERTIFIED PASS. **Onderhoud:** unieke golden lock. |

## Aanbevolen standaard
**(a)** voor continuïteit met bestaande referentiegeometry; meters op het veld valideren.

## Risico bij verkeerde keuze
Oneraalistische pressingafstand: ofwel te makkelijk “bij de bal”, ofwel onmogelijke curve — Positioning/Visual Gate fail.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-06 — Exact trigger passer / foot

## Onderwerp
Wie de triggerpass speelt en met welk type baltraject: LCB→LB ground pass, via 6 bounce dan wide, of GK→LB.

## Waarom deze beslissing nodig is
Het Ball Standard en Animation OS eisen een volledig gespecificeerd traject, voet/contactmoment en overlay-sync. Zonder dit kan T2 niet worden gebouwd zonder improvisatie.

## Mogelijke opties
- **(a)** opp.cbL right/left foot wide pass (LCB → LB ground pass).
- **(b)** opp.6 bounce then wide.
- **(c)** GK→LB (usually too long for this lesson).

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Animation / Tactical State:** korte, leesbare trigger zoals in authoring. **Decision Session:** focus blijft op LB-receive, niet op keepersbouw. **Positioning:** LCB als build partner blijft centraal. **Onderhoud:** eenvoudig te spiegelen later. |
| **(b)** | **Animation:** extra passfase; langere Live Moment. **Tactical State / Cognition:** meer scanruis vóór de kernbeslissing. **Onderhoud:** zwaardere timeline. |
| **(c)** | **Didactic / Cognitive:** te lang traject; verdunt één beslissing. **Animation:** andere balzone/timing. Authoring markeert dit als meestal te lang voor deze les. |

## Aanbevolen standaard
**(a)** LCB → LB ground pass.

## Risico bij verkeerde keuze
Trigger te complex of te lang; speelster mist het beslismoment of authors improviseren balpaden/overlays.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-07 — Decision interaction modality for v1

## Onderwerp
Hoe de speelster in v1 haar keuze maakt: drie actieknoppen, tikzones (binnenlijn vs bal vs drop), of een getekende aanloopcurve.

## Waarom deze beslissing nodig is
Het Interaction OS prefereert veldactie boven traditionele meerkeuze, maar Golden certificering vraagt ook betrouwbare touch en snelle bewijsvoering op mobiel.

## Mogelijke opties
- **(a)** Three action buttons (fastest to certify).
- **(b)** Tap inside-lane vs ball vs drop-zone.
- **(c)** Draw approach curve.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Decision Session OS:** snelst certificeerbaar; copy A/B/C blijft. **Interaction OS:** minder “veldachtig”. **Animation:** branches ongewijzigd. **Toekomstige sessions:** knoppenpatroon makkelijk te kopiëren. **Onderhoud:** laag risico. |
| **(b)** | **Interaction OS:** dichter bij veldactie; koppelt keuze aan ruimte. **Mobile Gate:** touchreliability kritiek. **Decision Session:** zelfde drie betekenissen, andere UI. **Onderhoud:** zone-hitboxen per resolutie. |
| **(c)** | **Interaction / Animation:** rijkst, hoogste bouw- en QA-last. **Cognitive:** scoring van “juiste curve” moet gedefinieerd — niet volledig uitgewerkt in authoring. **Onderhoud:** hoogst. |

## Aanbevolen standaard
**(b)** if touch reliability OK; else **(a)** with Product Director sign-off noted in limitations.

## Risico bij verkeerde keuze
Ofwel te schools (alleen knoppen zonder veldkoppeling), ofwel onbetrouwbare touch/draw die Mobile Gate en eerlijke scoring breekt.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-08 — Relationship to existing PRESS V2 code assets

## Onderwerp
Of de Golden Session nieuwe FDL-assets krijgt terwijl PRESS V2 legacy blijft, of dat PRESS V2 wordt gerefactord naar de Golden-standaard.

## Waarom deze beslissing nodig is
PRESS V2 leert vooral “solo vs team verbindt”; Golden leert “recht vs gebogen binnenkant dicht”. Accidenteel hergebruik leert het verkeerde contrast.

## Mogelijke opties
- **(a)** New FDL session assets only; PRESS V2 remains legacy teaching film.
- **(b)** Refactor PRESS V2 to match Golden (out of scope unless ordered).

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Animation / Decision Session:** Golden bouwt eigen contrastpad; PRESS V2 blijft bron voor geometry, niet voor lesdelta. **Onderhoud:** twee films naast elkaar tot latere cleanup. **Toekomstige sessions:** FDL-pad is leidend. **Football Language / Tactical State:** ongewijzigd door deze keuze. |
| **(b)** | **Animation OS / onderhoud:** herwerkt bestaande Academy press-films; bredere regressie. **Decision Session:** één visuele waarheid, maar buiten Golden-scope tenzij expliciet bevolen. **Risico:** vertraagt CERTIFIED PASS. |

## Aanbevolen standaard
**(a)** for Golden path.

## Risico bij verkeerde keuze
Speelsters (of builders) gebruiken PRESS V2-contrast als Golden-norm → verkeerde leerdelta; of grote refactor blokkeert de deadline.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-09 — Prerequisite session before Golden

## Onderwerp
Of speelsters eerst een korte scan-foundation session moeten doen, of dat oriëntatie in de Match Hook voldoende is.

## Waarom deze beslissing nodig is
OS/wetten eisen begrijpelijkheid zonder trainer; speelsters zonder voorkennis mogen niet vastlopen. Tegelijk mag certificering niet onnodig op een tweede sessie wachten.

## Mogelijke opties
- **(a)** None — orientation inside Hook enough.
- **(b)** Require short scan foundation session first.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Decision Session OS:** Golden blijft zelfstandige referentie voor CERTIFIED PASS. **Recall / Navigation:** geen gate vóór start. **Toekomstige sessions:** foundation kan later op data. **Onderhoud:** minimale keten. |
| **(b)** | **Decision Session / Navigation OS:** extra session + routing/prereq. **Didactic:** veiliger voor novices. **CERTIFIED PASS-pad:** hangt af van tweede stuk content. **Onderhoud:** langere productieketen vóór Golden-proof. |

## Aanbevolen standaard
**(a)** for Golden certification speed; add foundation later if pilot data shows confusion.

## Risico bij verkeerde keuze
Ofwel novices snappen oriëntatie niet; ofwel Golden-certificering en 17-augustus-keten worden onnodig geblokkeerd door een extra verplichte sessie.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

# OD-10 — Formal retirement note for Academy Architecture Freeze IA

## Onderwerp
Of Product Director een korte, scoped supersession (ACR) uitgeeft zodat Decision Lab-navigatie leidend is, of dat Academy Architecture Freeze IA parallel blijft tot na Golden.

## Waarom deze beslissing nodig is
Builders kunnen anders de bevroren Academy-nav (Positie/Situatie/Probleem) volgen in plaats van het FDL Navigation OS (train next session).

## Mogelijke opties
- **(a)** Product Director issues short supersession ACR for Decision Lab scope.
- **(b)** Leave parallel until post-Golden.

## Gevolgen per optie
| Optie | Impact |
|-------|--------|
| **(a)** | **Decision Session / productflow:** FDL Navigation OS is ondubbelzinnig leidend binnen Decision Lab-scope. **Onderhoud:** minder verkeerde shells. **Football/Tactical/Animation OS:** geen inhoudelijke wijziging. **Toekomstige sessions:** duidelijk authoringpad. |
| **(b)** | **Onderhoud / Navigation:** twee IA-waarheden blijven bestaan; risico op chapter-page builds. **Golden authoring:** inhoudelijk bruikbaar, maar implementatiekans op verkeerde shell hoger. |

## Aanbevolen standaard
**(a)** scoped supersession (Decision Lab only).

## Risico bij verkeerde keuze
Implementatie bouwt een Academy-hoofdstukflow i.p.v. Decision Session OS — product voelt weer als website/lessen, niet als Decision Lab.

## Product Director Decision

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

## Overzichtstabel

| OD | Onderwerp | Impact | Aanbevolen | Status |
|----|-----------|--------|------------|--------|
| OD-01 | Register coach cue “Binnenkant dicht” | Football Language OS; Club Language Gate; session copy | (a) Registreer **Binnenkant dicht**; “Passlijn dicht” supporting | AWAITING PRODUCT DIRECTOR DECISION |
| OD-02 | Presentatie eigen shape (4231 vs pressing 442) | Tactical State; Positioning; Animation; toekomstige press-sessions | (a) Pressing 4-4-2 met note “from 4-2-3-1” | AWAITING PRODUCT DIRECTOR DECISION |
| OD-03 | Opponent formation lock | Positioning Map; Animation; contrastgevolg | (a) BUILDUP 4-2-3-1 | AWAITING PRODUCT DIRECTOR DECISION |
| OD-04 | LB body angle at freeze | Perception; Cognitive Gate; Animation T3 | (a) Half-closed to touchline | AWAITING PRODUCT DIRECTOR DECISION |
| OD-05 | RW start distance / height | Positioning bands; Animation curve; leerbaarheid | (a) PRESS V2 start (~x40 y74); meters valideren | AWAITING PRODUCT DIRECTOR DECISION |
| OD-06 | Trigger passer / foot | Ball Standard; Animation T2; didactic focus | (a) LCB → LB ground pass | AWAITING PRODUCT DIRECTOR DECISION |
| OD-07 | Decision interaction modality v1 | Interaction OS; Mobile Gate; certificeersnelheid | (b) tap zones; else (a) buttons + sign-off | AWAITING PRODUCT DIRECTOR DECISION |
| OD-08 | Relatie tot PRESS V2 code assets | Animation ownership; verkeerde contrast-delta; regressie | (a) Nieuwe FDL assets; PRESS V2 legacy | AWAITING PRODUCT DIRECTOR DECISION |
| OD-09 | Prerequisite vóór Golden | Navigation; Didactic access; CERTIFIED PASS-keten | (a) Geen prerequisite; Hook-oriëntatie | AWAITING PRODUCT DIRECTOR DECISION |
| OD-10 | Supersession Academy Architecture Freeze IA | Navigation OS; implementatieshell; onderhoud | (a) Scoped supersession Decision Lab only | AWAITING PRODUCT DIRECTOR DECISION |

---

```text
PRODUCT DECISION PACKAGE:
READY FOR PRODUCT DIRECTOR REVIEW
```
