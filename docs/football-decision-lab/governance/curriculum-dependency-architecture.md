# Football Decision Lab — Curriculum Dependency Architecture

```text
Product: Football Decision Lab
Document type: CURRICULUM DEPENDENCY ARCHITECTURE
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Governance base: GBR-v1.0 (APPROVED)
Companions: Register Architecture · Learning Progression Register
Architecture version: CDA-v1.0-DRAFT
Implementation status: NOT STARTED
```

**Doel:** Vastleggen **wanneer** een speelster een Decision Session mag starten — via een afhankelijkheidsmodel, niet via een trainingskalender.

**Niet in scope:** lesroosters, weekplanning, code, implementatie, wijzigingen aan bestaande documenten, nieuwe voetbalprincipes.

---

## 1. Doel van de Curriculum Dependency Architecture

### 1.1 Wat dit wél is

Een **gericht acyclisch afhankelijkheidsmodel (curriculum graph)** dat bepaalt:

- welke **voorkennis-nodes** een Decision Session vereist;
- wanneer een session **unlocked** is voor een speelster;
- welke **nieuwe sessions** een behaalde session mag openen.

### 1.2 Wat dit níet is

| Dit is geen… | Omdat… |
|--------------|--------|
| Lesplanning / seizoenskalender | Geen data’s, geen “week 3 training” |
| Football Standard | Standards zeggen *wat waar is*, niet *wat je mag openen* |
| Pattern | Patterns benoemen het wedstrijdprobleem, niet de volgorde |
| Learning Progression | LP moduleert cognitieve zwaarte binnen een PAT, niet cross-PAT unlocks alleen |
| Decision Session | Sessions trainen één beslissing; zij zijn **nodes**, geen graph-engine |

### 1.3 Waarom curriculum iets anders is

| Laag | Vraag die hij beantwoordt |
|------|---------------------------|
| Football Standards | Wat is canonieke wet? |
| Patterns (`PAT`) | Welk wedstrijdprobleem? |
| Learning Progression (`LP`) | Op welk cognitief niveau? |
| Decision Sessions (`FDL`) | Welke ene beslissing nu? |
| **Curriculum Dependency** | **Mag deze speelster deze FDL nu starten — en wat opent daarna?** |

**Wet C1 — Unlock ≠ doctrine**

> Het curriculum mag geen Football Standards, Patterns of LP-definities wijzigen. Het mag alleen **edges** (vereist / opent) tussen bestaande register-IDs leggen.

**Wet C2 — Planner consumeert graph; graph is geen planner**

> Trainers of productflows mogen een volgorde *voorstellen* binnen toegestane unlocks. Zij mogen geen verboden edge forceren.

---

## 2. Dependency Rules

### 2.1 Kernregels

| ID | Regel |
|----|--------|
| **R1** | Een Decision Session **mag** vereiste voorkennis declareren (`requires`). |
| **R2** | Een speelster mag een session pas starten wanneer **alle** hard requirements zijn behaald (status ≥ vereiste mastery/exit voor die node). |
| **R3** | Eén Pattern kan **meerdere** vervolgpaden openen (fan-out). |
| **R4** | Een hogere `LP` op PAT-A betekent **niet** automatisch unlock van PAT-B of alle andere onderwerpen. |
| **R5** | Soft recommendations (`recommends`) mogen UI-ordening sturen; zij **blokkeren** start niet. |
| **R6** | Hard requirements (`requires`) blokkeren start tot PASS/behaald. |
| **R7** | Graph moet **acyclisch** zijn voor hard edges. |
| **R8** | Elke FDL-node pinnen exact één `PAT` + exact één `LP` (uit bestaande registers). |
| **R9** | Standards worden niet “behaald” als speelster-XP; wel: session/PAT+LP mastery die die Standards citeert. |
| **R10** | Mirror/side-varianten op hetzelfde PAT+LP mogen eigen FDL-IDs hebben; unlock-policy is productkeuze (gedeeld vs apart) via OD — default: **aparte node**, zelfde `requires` tenzij anders besloten. |

### 2.2 Soorten nodes (curriculum graph)

| Node type | ID-vorm | Kan `requires`? | Kan `unlocks`? |
|-----------|---------|-----------------|----------------|
| Decision Session | `FDL-…` | Ja (primair) | Ja |
| Pattern @ LP gate | `PAT-xxx@LP-yyy` (logische poort) | Optioneel | Ja |
| Foundation gate | bijv. `LP-001` globaal of per PAT | — | Alleen via policy |
| Standard | `PRESS-xxx` etc. | Nee als speelster-node | Nee direct |

**Speelster-progressie meet** primair op **FDL** (en afgeleide PAT@LP mastery). Standards zijn pins binnen FDL, geen aparte “Standard afgevinkt”-game.

### 2.3 Requirement types

| Type | Betekenis | Blokkeert start? |
|------|-----------|------------------|
| `requires_session` | Genoemde FDL behaald (exit criteria van die session/LP) | Ja |
| `requires_pat_lp` | Mastery/exit op `PAT-x` bij minstens `LP-y` | Ja |
| `requires_all` | Alle listed hard deps | Ja |
| `requires_any` | Minimaal één uit set (sparingly; OD nodig bij Golden+) | Ja (tot één gehaald) |
| `recommends` | Voorkeurspad | Nee |
| `opens` / `unlocks` | Edges die na behalen beschikbaar worden | N/A (effect) |

### 2.4 “Behaald” (architectuurdefinitie)

Zonder nieuwe voetbalinhoud — hergebruik bestaande OS/LP-taal:

| LP-context | Minimale “behaald” voor unlock-doeleinden |
|------------|-------------------------------------------|
| LP-001 | Oriëntatie-exit (LP-register) |
| LP-002 | Recognition-exit |
| LP-003 | Decision + micro-recall succes (waar session die heeft) |
| LP-004+ | Zoals LP-register exit voor dat niveau |

Exacte telemetry-mapping is implementatie later; architectuur eist alleen dat **één eenduidige exit per FDL** bestaat.

### 2.5 Hogere LP is lokaal

```text
PAT-004 @ LP-005 behaald
  ≠>  PAT-009 @ LP-002 unlocked
  ≠>  alle curriculum open
```

Tenzij een **expliciete edge** dat zegt. Cross-pattern transfer is altijd een bewuste dependency, geen implicatie van “hoger getal”.

---

## 3. Curriculum Graph

### 3.1 Keten (conceptueel)

```text
Football Standard(s)
        ↓  (cited by / composed into)
     Pattern (PAT)
        ↓  (offered at)
 Learning Progression (LP)
        ↓  (instantiated as)
 Decision Session (FDL)
        ↓  (unlocks)
 New Decision Session(s) (FDL…)
```

Standards verschijnen in de graph als **constraints op nodes**, niet als speelster-unlock-stappen:

```text
FDL-X
  pins: PRESS-a, STATE-b, LANG-c, …
  requires: FDL-Y | PAT-p@LP-q
  unlocks: FDL-Z, FDL-W
```

### 3.2 Hoe afhankelijkheden worden vastgelegd

Elke Decision Session (of een curriculum index die ernaar wijst) declareert:

```text
node: FDL-…
pat: PAT-…
lp: LP-…
pins: [STATE-…, PRESS-…, …]
requires_hard:
  - type: requires_pat_lp | requires_session | …
    ref: …
requires_soft:
  - type: recommends
    ref: …
unlocks:
  - FDL-…
  - FDL-…
```

Een aparte **Curriculum Index** (toekomstig registerbestand, niet in deze opdracht verplicht gevuld) mag alleen edges aggregeren; hij mag geen nieuwe wetten uitvinden.

### 3.3 Poorten op PAT@LP

Optionele logische poort:

```text
PAT-004@LP-002  =  “recognition mastery on pattern 004”
```

Meerdere FDL’s op hetzelfde PAT+LP (bijv. A/B skins) kunnen allen die poort voeden (`contributes_to`). Unlock van vervolgsessions kan op **poort** i.p.v. één specifieke FDL — voorkomt brosse 1:1 ketens bij content-varianten.

### 3.4 Validatieregels op de graph

| Check | Fail = |
|-------|--------|
| Cycle in hard edges | BLOCKED graph |
| FDL zonder PAT of LP pin | BLOCKED node |
| `requires` naar onbekende ID | BLOCKED edge |
| Unlock naar node met zwaardere unmet Standard pins zonder path | Warning → OD |
| Soft edge als hard gebruikt | BLOCKED modeling error |

---

## 4. Voorbeeld — Golden Session keten

IDs hieronder volgen bestaande governance seeds / authoring session-ID. `PAT-004` blijft de **architectuur-placeholder** uit het Learning Progression Register (geen nieuwe football pattern-inhoud).

### 4.1 Kernketen

```text
PRESS-001                          # Football Standard (canonical pressing)
        ↓ composed into
PAT-004                            # Pattern family (placeholder ID)
        ↓ offered at
LP-002                             # Recognition
        ↓ instantiated as
FDL-GS-INSIDE-CLOSE-RB-PRESS-V1    # Golden Decision Session
```

**Interpretatie**

| Stap | Betekenis |
|------|-----------|
| `PRESS-001` | Canonieke pressingstandaard die de session pinnen mag |
| `PAT-004` | Wedstrijdpatroonfamilie waaronder flank inside-close hoort |
| `LP-002` | Cognitief niveau Recognition voor die familie |
| `FDL-GS-…` | Concrete Golden session die precies die pins gebruikt |

### 4.2 Declaratief voorbeeld (Golden node)

```text
node: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
pat: PAT-004
lp: LP-002
pins:
  - PRESS-001
  - LANG-001          # afhankelijk van OD-001 PASS in governance seed
  - POS-001 / ANIM-001 / STATE-… / SCAN-…  # zoals session contract pinlist
requires_hard: []     # Golden certification path: geen prior FDL verplicht
                      # (tenzij Product Director later OD-009 foundation verplicht)
requires_soft: []
contributes_to: PAT-004@LP-002
unlocks:
  # zie §4.3 — logische kandidaten, niet automatisch alle gebouwd
```

### 4.3 Welke toekomstige sessions hierdoor logisch beschikbaar worden

Na behalen van `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` (dus poort `PAT-004@LP-002`) worden **logisch** (niet: meteen gebouwd) de volgende klassen unlockbaar — steeds **zelfde PAT / zelfde Standards**, andere LP of side/instantie:

| Kandidaat-klasse | Voorbeeld-edge | Waarom logisch |
|------------------|----------------|----------------|
| Zelfde PAT, Decision niveau | `PAT-004@LP-002` → `FDL-…@LP-003` | Recognition vóór Decision (LP-ladder) |
| Zelfde PAT, Pressure | `PAT-004@LP-003` → `FDL-…@LP-004` | Decision stabiel vóór druk |
| Zelfde PAT, Variation | `PAT-004@LP-003|004` → `FDL-…@LP-005` | Prioriteit vast vóór noise |
| Zelfde PAT, Mastery/recall-first | later `LP-006` | Retention |
| Mirror side (zelfde PAT+LP) | parallel of na Golden | Zelfde wetten, andere side-parameter |
| Gerelateerd PAT dat **expliciet** Golden recognition eist | alleen met hard edge | Cross-pattern nooit impliciet |

```text
PRESS-001
  └─ PAT-004
        ├─ LP-002 → FDL-GS-INSIDE-CLOSE-RB-PRESS-V1  ✓ (Golden)
        │              unlocks →
        ├─ LP-003 → FDL-…-DECISION-…                 (toekomst)
        ├─ LP-004 → FDL-…-PRESSURE-…                 (toekomst)
        ├─ LP-005 → FDL-…-VARIATION-…                (toekomst)
        └─ LP-002 → FDL-…-MIRROR-LB-…                (toekomst, policy)
```

**Niet** door Golden recognition alleen geopend:

- Willekeurige andere PAT’s (blok, omschakeling, set pieces, …) zonder edge;
- LP-005 op een ander patroon;
- “Alles pressing in de club.”

---

## 5. Verboden afhankelijkheden

| Verboden structuur | Reden |
|--------------------|-------|
| Cycle: A requires B requires A | Deadlock; Wet R7 |
| FDL requires een Standard als speelster-achievement zonder session | Standards zijn geen player nodes |
| Unlock van PAT-B enkel omdat LP-nummer op PAT-A hoger is | Wet R4 |
| Hard require op `recommends` edge | Soft ≠ hard |
| Session die `requires` verzint naar niet-geregistreerde IDs | Governance breach |
| Meerdere LP’s als gelijktijdige hard require binnen één FDL start | Eén LP-pin per FDL; progression path is graph, niet session-mix |
| Curriculum edge die Standard `@vN` “zwaarder” maakt | Doctrine hoort in Standards + OD |
| Nieuw PAT alleen om volgorde te forceren | Gebruik edges + LP |
| Verborgen prerequisites alleen in UI-copy | Alle hard deps in graph |
| Trainer override die hard deps permanent omzeilt zonder OD | Governance bypass (tijdelijke coach-preview mag buiten player-path) |
| Fan-in die alle 500 sessions unlocked na één Golden | Explosieve unlock zonder pedagogische edge |

**Wet C3 — Explicit or absent**

> Geen impliciete curriculum-unlocks. Geen edge = niet vereist en niet geopend.

---

## 6. Schaalbaarheid

### 6.1 10 sessies (MVP)

| Aanpak | Effect |
|--------|--------|
| Korte ketens; Golden vaak `requires_hard: []` | Snelle certificering |
| 1–3 PAT’s; LP-002→003 primair | Overzichtelijk |
| Handmatige curriculum index | Voldoende |

### 6.2 50 sessies

| Aanpak | Effect |
|--------|--------|
| PAT@LP poorten i.p.v. alleen FDL→FDL | Minder brosse ketens |
| Fan-out per PAT gecontroleerd | Speelster ziet 2–4 next, niet 40 |
| Soft recommends voor trainer weekplan | Planner ≠ graph |

### 6.3 200 sessies

| Aanpak | Effect |
|--------|--------|
| Strikte cycle checks + ID validation | Voorkomt governance-incidenten |
| Cross-PAT edges zeldzaam en OD-reviewed | Voorkomt willekeurige locks |
| Mastery op poorten aggregeert varianten | Schaal zonder duplicate requires |

### 6.4 500 sessies

| Aanpak | Effect |
|--------|--------|
| Graph diepte begrensd (policy, bijv. max hard-depth) | Speelbaarheid |
| Sessions ≈ PAT × LP × variants; edges ≪ sessions | Edge-groei onder controle |
| Nieuwe content = nieuwe node + few edges | Geen herschrijven van Standards |
| Query: “unlockable now” = eval hard deps | Product runtime later; architectuur nu stabiel |

### 6.5 Schaalformule

```text
Nodes     ≈ number of FDL sessions (+ optional PAT@LP gates)
Hard edges ≈ O(nodes) in well-factored graphs (local PAT ladders)
NOT       ≈ O(nodes²) cross-links
Standards remain O(rules); curriculum does not multiply them
```

---

## 7. Relatie tot andere registers (samenvatting)

| Register | Curriculum Dependency doet… |
|----------|------------------------------|
| OD / Governance | Mag blocking policy wijzigen (bijv. foundation verplicht) |
| Football Standards | Alleen pins; geen unlock-valuta |
| PAT | Families waarlangs ladders lopen |
| LP | Niveau van node; lokale ladder, geen globale vrijbrief |
| FDL | Nodes die requires/unlocks dragen |
| Academy Product | Evalueert graph voor startknop; maakt geen edges |

---

## 8. Product Director Decision

| Veld | |
|------|--|
| Approve CDA-v1.0 and Wet C1–C3? | |
| Default Golden `requires_hard: []` until OD-009 says otherwise? | |
| Default: PAT@LP gates for unlock fan-out? | |
| Max hard-depth policy (later getal)? | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

```text
CURRICULUM DEPENDENCY ARCHITECTURE:
READY FOR PRODUCT DIRECTOR REVIEW
```
