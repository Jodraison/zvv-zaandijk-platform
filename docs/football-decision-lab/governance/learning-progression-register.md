# Football Decision Lab — Learning Progression Register

```text
Product: Football Decision Lab
Document type: LEARNING PROGRESSION REGISTER
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Governance base: GBR-v1.0 (APPROVED)
Register Architecture: RAR (companion)
Register version: LPR-v1.0-DRAFT
Implementation status: NOT STARTED
Namespace: LP-xxx
```

**Doel:** Eén Football Pattern op meerdere cognitieve niveaus aanbieden **zonder** nieuwe Patterns, **zonder** nieuwe Football Standards, en **zonder** nieuwe voetbalprincipes.

**Niet in scope:** code, implementatie, wijzigingen aan bestaande documenten, tactische inhoudelijke wijzigingen.

**Plaats in de keten (uitbreiding op Register Architecture):**

```text
Governance (OD)
  → Football Standards (PRESS, LANG, POS, …)
    → Patterns (PAT)
      → Learning Progression (LP)     ← dit register
        → Decision Sessions (FDL)
          → Academy Product
```

---

## 1. Doel van het register

### 1.1 Probleem dat LP oplost

Zonder Learning Progression ontstaan drie schaalbrekers:

| Foute reflex | Gevolg |
|--------------|--------|
| Nieuw `PAT-xxx` per moeilijkheidsgraad | Patroonexplosie;zelfde voetbal, andere IDs |
| Standard `@vN` “zwaarder maken” | Doctrine-drift; oude sessions breken of liegen |
| Alles in één session mengen | Wet “één beslissing” + Cognitive Gate falen |

### 1.2 Waarom leerprogressie los staat van Football Standards

| Football Standards | Learning Progression |
|--------------------|----------------------|
| *Wat* altijd waar is in een toestand (tot nieuwe versie) | *Hoe zwaar* de speelster datzelfde mag/moet verwerken |
| Wijzigen = OD + nieuwe `@vN` | Niveau wisselen = andere `LP-xxx`, **zelfde** Standard-pins |
| Bevatten cues, press laws, state layers | Bevatten cognitieve eisen, load, exit-criteria |

**Wet LP1:** Een hoger LP-niveau mag Football Standards **citeren**, nooit herschrijven.

### 1.3 Waarom leerprogressie los staat van Patterns

| Patterns (`PAT-xxx`) | Learning Progression (`LP-xxx`) |
|----------------------|----------------------------------|
| *Welk* wedstrijdprobleem / patroonfamilie | *Op welk cognitief niveau* dat patroon wordt getraind |
| Bundelt Standards | Moduleert presentation & demand |
| Één primary PAT per session | Exact één LP per session |

**Wet LP2:** Moeilijker ≠ nieuw patroon. Moeilijker = zelfde `PAT` + hoger `LP`.

### 1.4 Waarom leerprogressie los staat van Decision Sessions

| Decision Sessions (`FDL-xxx`) | Learning Progression |
|-------------------------------|----------------------|
| Concrete leereenheid: één beslissing, copy, evidence | Herbruikbaar niveau-profiel over alle Patterns |
| Instantieert PAT + LP + Standard-pins | Definieert geen session-flow zelf |
| Unieke session-ID per build | Stabiele `LP-001`…`LP-006` clubbreed |

**Wet LP3:** Sessions **pinnen** een LP; zij **definiëren** geen ad-hoc “niveau 3b” buiten het register.

---

## 2. Definieer de niveaus

De onderstaande zes niveaus zijn **vaste registerentries**. Nummers zijn immutable (zelfde immutability-wetten als OD/Standards).

Cognitieve belasting wordt beschreven relatief (laag → hoog), niet als psychometrische scores.

---

### LP-001 — Foundation

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Oriëntatie op het patroon: wie ben ik, welke richting, waar is de bal, wat is het wedstrijdmoment — zonder scored primary decision onder druk. |
| **Cognitieve belasting** | Laag. Weinig keuzes; hoge scaffolding; korte blootstelling. |
| **Wat de speler moet herkennen** | Eigen team vs tegenstander; eigen positie in het patroon; balzone op hoofdlijnen; dat “dit soort moment” bij dit PAT hoort. |
| **Wat verandert t.o.v. vorig niveau** | Geen — instapniveau. |
| **Klaar voor volgende wanneer** | Speelster kan zonder trainer aanwijzen: “dit is ons moment-type” en haar rol benoemen in één zin; oriëntatie-fouten in Hook/Scan zijn zeldzaam. |

*Toepassing:* optionele onboarding vóór Recognition; mag worden overgeslagen als OD/productpolicy dat toestaat (zie open productkeuzes elders — dit register dwingt geen prerequisite af).

---

### LP-002 — Recognition

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Het patroon en de kritieke cue(s) herkennen vóór diepe beheersing van uitvoering. |
| **Cognitieve belasting** | Laag–middel. Eén scanfocus; beperkte tijddruk; duidelijke freeze. |
| **Wat de speler moet herkennen** | Trigger van het PAT; primaire observatiecue(s) uit gepinde `SCAN`/`STATE`; welke lijn/ruimte/gevaar relevant is — **nog niet** onder volle wedstrijddruk automatiseren. |
| **Wat verandert t.o.v. LP-001** | Van oriëntatie naar **patroon- en cueherkenning**; scored of semi-scored herkenningsactie toegestaan. |
| **Klaar voor volgende wanneer** | In een nieuw maar pin-conform frame herkent zij trigger + kerncue binnen het scanvenster van de session; Foundation-oriëntatiefouten zijn weg. |

---

### LP-003 — Decision

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Eén primaire beslissing kiezen die het PAT in de gepinde toestand vereist (keuze vóór uitleg). |
| **Cognitieve belasting** | Middel. Twee of drie geloofwaardige acties; eerlijk freeze; gevolg zichtbaar. |
| **Wat de speler moet herkennen** | Zelfde cues als Recognition, plus welke **eerste prioriteit** volgt; voorspelling van gevolg bij verkeerde vs juiste keuze. |
| **Wat verandert t.o.v. LP-002** | Van “wat zie ik?” naar “**wat doe ik eerst?**”; Decision Session-blauwdruk (Hook→…→Cue→Recall-light) is normaal. |
| **Klaar voor volgende wanneer** | Correcte first action stabiel op standaardvariant; kan cue benoemen; contrast begrepen; micro-recall opzelfde prioriteit slaagt zonder volledige heruitleg. |

---

### LP-004 — Pressure

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Dezelfde beslissing onder verhoogde tijd-/wedstrijddruk, zonder wijziging van Standard-prioriteit. |
| **Cognitieve belasting** | Middel–hoog. Kortere scan; snellere bal; smaller beslissingsvenster. |
| **Wat de speler moet herkennen** | Zelfde trigger en inside/priority cues; nu met minder tijd om te redeneren. |
| **Wat verandert t.o.v. LP-003** | **Demand** (snelheid, timing window), niet de football law. Parameters binnen bestaande Standard/ANIM/STATE-grenzen. |
| **Klaar voor volgende wanneer** | Correct onder druk met acceptabele reactietijd t.o.v. LP-003; fouten verschuiven niet naar “andere prioriteit verzinnen”. |

*Voorbeeldmechanisme (architectuur, geen nieuwe tactiek):* snellere pass / strakker freeze — zoals recall-variantklassen al toestaan — als **LP-instantie**, niet als nieuwe PRESS.

---

### LP-005 — Variation

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Hetzelfde PAT herkennen wanneer oppervlaktekenmerken wisselen, terwijl de canonieke prioriteit gelijk blijft. |
| **Cognitieve belasting** | Hoog. Noise: spiegel, startpositieband, body-angle band, opponent spacing — binnen gepinde Standards. |
| **Wat de speler moet herkennen** | Invariante cues van het PAT ondanks cosmetische/positionele noise; niet in de val van een nieuw “antwoord” trappen. |
| **Wat verandert t.o.v. LP-004** | Van druk op **dezelfde** beelden naar **gecontroleerde variatie**; nog steeds één primary decision. |
| **Klaar voor volgende wanneer** | Correct over ≥N goedgekeurde varianten (N productbeleid); mastery-telemetry toont “correct onder variatie” (Recall OS-statusnamen mogen worden hergebruikt). |

**Wet LP4:** Variation mag geen nieuwe correcte first action introduceren. Doet de toestand dat wél (zie state-exceptions in Standards), dan is dat een **ander** PAT of een Standard-exception-session — niet LP-005 op het oude PAT.

---

### LP-006 — Mastery

| Veld | Definitie |
|------|-----------|
| **Leerdoel** | Stabiele beheersing: snelle herkenning + juiste prioriteit over tijd, inclusief geplande herhaling en wedstrijdtransfer-signalen. |
| **Cognitieve belasting** | Hoog maar “schoon”: minder scaffolding; minder uitleg; recall-first. |
| **Wat de speler moet herkennen** | Patroon vroeg; cue automatisch; coach cue paraat voor veldgebruik. |
| **Wat verandert t.o.v. LP-005** | Van variatiebewijs naar **duurzame stabiliteit** + spaced re-entry; minder teaching chrome. |
| **Klaar voor volgende wanneer** | Geen hoger LP in dit register; exit = “stabiel beheerst” / herhaling-nodig cyclus volgens Recall OS — niet een LP-007 tenzij later via OD toegevoegd. |

---

### 2.1 Niveaukaart (samenvatting)

| ID | Naam | Kernverschuiving |
|----|------|------------------|
| LP-001 | Foundation | Oriëntatie |
| LP-002 | Recognition | Cue / patroon zien |
| LP-003 | Decision | Eerste actie kiezen |
| LP-004 | Pressure | Zelfde beslissing, meer druk |
| LP-005 | Variation | Zelfde beslissing, meer noise |
| LP-006 | Mastery | Stabiliteit + retention |

---

## 3. Relatie met Patterns

### 3.1 Regel

> Eén `PAT-xxx` × meerdere `LP-xxx` = meerdere Decision Sessions (of session-varianten), **één** voetbalwaarheid.

```text
PAT-xxx
  ├── FDL-… @ LP-001
  ├── FDL-… @ LP-002
  ├── FDL-… @ LP-003
  ├── FDL-… @ LP-004
  ├── FDL-… @ LP-005
  └── FDL-… @ LP-006
```

Alle takken pinnen **dezelfde** required Football Standards `@vN` (tenzij een OD een Standard-upgrade voor de hele PAT-familie doorvoert).

### 3.2 Voorbeelden (illustratief — geen nieuwe PAT-inhoud)

| Combinatie | Betekenis |
|------------|-----------|
| `PAT-004` + `LP-002` | Speelster leert het patroon **herkennen** (trigger + kerncues); nog geen volle druk/variatie. |
| `PAT-004` + `LP-005` | Zelfde patroon en dezelfde Standard-prioriteit; session varieert oppervlakte binnen pins; één beslissing blijft. |

*Note:* `PAT-004` is na Phase B2 **CERTIFIED** als Pattern Register-entry (`registers/patterns/PAT-004.md`). Dit LPR-document blijft architectuur; het creëert geen football pattern.

### 3.3 Wat Patterns wél/niet doen met LP

| Patterns doen | Patterns doen niet |
|---------------|-------------------|
| Declares welke LP-niveaus voor deze familie zijn toegestaan | LP-regels herdefiniëren |
| Optioneel recommended path (002→003→004…) | Standards zwaarder maken per niveau |
| Blijft stabiel terwijl sessions LP wisselen | Splitsen per difficulty |

---

## 4. Relatie met Decision Sessions

### 4.1 Verplichte pins

Elke Decision Session contract bevat minimaal:

```text
Session ID:     FDL-…
Pattern:        PAT-…
Progression:    LP-…          # exact één
Standards:      STATE/PRESS/POS/LANG/SCAN/ANIM/RECALL/GATE @vN
Open ODs:       …
```

### 4.2 Hoe FDL naar PAT én LP verwijst

| Verwijzing | Beantwoordt |
|------------|-------------|
| `PAT-xxx` | Welk wedstrijdpatroon? |
| `LP-xxx` | Op welk cognitief niveau? |
| Standards | Welke canonieke wetten? |
| Session body | Hoe deze ene beslissing in 2,5–6 min wordt getraind |

### 4.3 Mapping op session-bouw (architectuur)

| LP | Typische session-nadruk (binnen bestaande Decision Session OS) |
|----|------------------------------------------------------------------|
| LP-001 | Hook + oriëntatie; minimale of geen scored decision |
| LP-002 | Scan / herkenning zwaar; decision licht of cue-select |
| LP-003 | Volle Decision Session-blauwdruk |
| LP-004 | Zelfde blauwdruk; pressure parameters |
| LP-005 | Zelfde blauwdruk; variation parameters + recall |
| LP-006 | Recall-first / sparse explanation; mastery evidence |

Geen van deze rijen introduceert nieuwe football laws.

---

## 5. Niet toegestaan

| Verbod | Waarom |
|--------|--------|
| Nieuw `PAT-xxx` alleen omdat moeilijkheid stijgt | LP bestaat precies hiervoor |
| Football Standards aanpassen om “hoger niveau” te simuleren | Doctrine-drift; O(n) wetten |
| Meerdere `LP-xxx` in één Decision Session mengen | Eén cognitief contract per session; Cognitive Gate |
| LP dat een **andere** correcte first action introduceert | Dat is state/PAT-change, geen progressie |
| Lokale “niveau 2,5” buiten register | Immutable LP-IDs; zelfde class incident als OD-collision |
| Session die LP-exit criteria herschrijft | Exit-criteria wonen in dit register (+ Recall OS statusnamen) |
| Pattern dat LP overslaat door Standard te verzwakken | Authority flow: Standards ≠ difficulty knobs |
| Academy Product dat difficulty labels toont zonder `LP-xxx` pin | Geen schaduwprogressie |

**Wet LP5 — Single progression pin**

> Exact één `LP-xxx` per `FDL-xxx`. Progression paths leven in curricula/planner, niet binnen één session-body.

---

## 6. Schaalbaarheid

### 6.1 Beginners

| Behoefte | LP-antwoord |
|----------|-------------|
| Lage overload | LP-001 → LP-002 vóór Decision |
| Geen schaamte-toets | Recognition zonder volle pressure |
| Zelfde clubtaal vroeg | Zelfde `LANG` pins vanaf eerste PAT-exposure |

### 6.2 Ervaren spelers

| Behoefte | LP-antwoord |
|----------|-------------|
| Geen saaie herhaling van Foundation | Entry op LP-003+ op basis van mastery/telemetry policy |
| Transfer onder druk | LP-004 / LP-005 op bekende PAT |
| Retention | LP-006 + Recall spacing |

### 6.3 Toekomstige Academy-uitbreidingen

| Uitbreiding | Zonder LP-register | Met LP-register |
|-------------|--------------------|-----------------|
| Nieuwe sides/mirrors | Nieuwe PAT of Standard-kopieën | Zelfde PAT + LP path |
| Meer difficulties | 6× PAT-explosie | 6 LP × bestaande PAT |
| Multi-team / leeftijd | Parallelle doctrine | Zelfde Standards; LP-entry verschilt |
| 500 sessions | O(n) wetten | O(patterns × 6 levels) sessions, O(rules) Standards |

### 6.4 Schaalformule

```text
Sessions ≈ Patterns × (allowed LP levels) × (side/skin variants)
Standards ≈ stable   (unchanged by LP)
Patterns  ≈ problem families
LP levels = 6 fixed (until OD adds LP-007+)
```

---

## 7. Register entries (seed)

| ID | Title | Status |
|----|-------|--------|
| LP-001 | Foundation | DRAFT — awaiting Product Director |
| LP-002 | Recognition | DRAFT — awaiting Product Director |
| LP-003 | Decision | DRAFT — awaiting Product Director |
| LP-004 | Pressure | DRAFT — awaiting Product Director |
| LP-005 | Variation | DRAFT — awaiting Product Director |
| LP-006 | Mastery | DRAFT — awaiting Product Director |

Wijzigingen aan definities na PASS = nieuwe content-versie `LP-00X@v2` of nieuwe ID via OD — **geen** hernummering.

---

## 8. Product Director Decision

| Veld | |
|------|--|
| Approve LPR-v1.0 and Wet LP1–LP5? | |
| Approve fixed ladder LP-001…LP-006? | |
| Allow skipping LP-001 by policy? | |
| Require exactly one LP pin on every FDL session? | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

```text
LEARNING PROGRESSION REGISTER:
READY FOR PRODUCT DIRECTOR REVIEW
```
