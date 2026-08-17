# Session Register Entry — FDL-GS-INSIDE-CLOSE-RB-PRESS-V1

```text
Product: Football Decision Lab
Document type: SESSION REGISTER ENTRY
Session ID: FDL-GS-INSIDE-CLOSE-RB-PRESS-V1
Register status: REVIEW
OS version: 1.0
Entry version: SRE-v1.0-DRAFT
Implementation status: NOT STARTED
```

**Doel:** Formele Decision Session-node in de registerarchitectuur.  
**Niet:** nieuw authoringdocument, geen implementatiespec, geen nieuwe voetbalinhoud, geen nieuwe IDs.

---

## 1. Register Identity

| Veld | Waarde |
|------|--------|
| **Session ID** | `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` |
| **Titel** | Binnenkant sluiten bij druk op hun back |
| **Speelstergerichte titel (bron)** | Hun back krijgt de bal — wat doe jij eerst? |
| **Type** | Golden Session / Decision Session |
| **Canonical situation ID (bron)** | `DEF-HIGH-RIGHTWING-01` |
| **Register status** | **REVIEW** (maximaal toegestaan nu; niet CERTIFIED) |
| **Entry version** | `SRE-v1.0-DRAFT` |
| **Package version (bron)** | `inside-close-v1` |
| **Eigenaar** | Product Director (register/certificering); Product Owner (voetbalmandaat); Authoring (bronpakket) |
| **Primary position (bron)** | Rechtsbuiten (RW) |
| **Coach cue (bron)** | Binnenkant dicht |

### Brondocumenten

| Pad | Rol |
|-----|-----|
| `platform/docs/football-decision-lab/golden-session/inside-close-v1/01-session-contract.md` | Session identity, beslissing, cue |
| `platform/docs/football-decision-lab/golden-session/inside-close-v1/02-tactical-state-sheet.md` | Situatie / state |
| `platform/docs/football-decision-lab/golden-session/inside-close-v1/09-risks-and-open-decisions.md` | OD-lijst (OD-01 = cue) |
| `platform/docs/football-decision-lab/golden-session/inside-close-v1/10-product-decisions-summary.md` | OD-001 betekenis |
| `platform/docs/football-decision-lab/golden-session/inside-close-v1/11-od01-canonical-pressing-standard-review.md` | Pressingstandaard-review → `PRESS-001` mapping |
| `platform/docs/football-decision-lab/governance/product-decision-register.md` | OD-001…OD-010; PRESS-001 seed |
| `platform/docs/football-decision-lab/governance/register-architecture.md` | Lagen / pins |
| `platform/docs/football-decision-lab/governance/learning-progression-register.md` | LP-002; PAT-004 als voorbeeld-placeholder |
| `platform/docs/football-decision-lab/governance/curriculum-dependency-architecture.md` | Unlock-model; Golden voorbeeldketen |

---

## 2. Session Purpose

Uitsluitend samenvatting uit bestaande Golden Session-authoring:

| Aspect | Vastgelegd in bron |
|--------|--------------------|
| **Wedstrijdmoment** | Georganiseerd hoog / middenhoog drukzetten tijdens tegenstander-opbouw; bal naar hun **linkerback**; onze **rechtsbuiten** is primaire beslisser (`01`, `02`). |
| **Cue** | **Binnenkant dicht** (`01`, Product Owner-mandaat; Language Gate via OD-001). |
| **Te leren beslissing** | Eerste prioriteit is **niet** zo snel mogelijk bij de bal komen, maar de **binnenste passlijn afsluiten** en de balbezitter **gecontroleerd naar buiten** sturen (`01`). |

Geen aanvullende tactiek in deze entry.

---

## 3. Dependency Pins

| ID | Namespace | Rol | Status | Definitief / placeholder | Bron | Opmerking |
|----|-----------|-----|--------|--------------------------|------|-----------|
| `PRESS-001` | Football Standard (PRESS) | Canonieke pressingstandaard die deze session **consumeert** | **CERTIFIED** (Product Director; B1 closed) | **Definitief** | `registers/standards/pressing/PRESS-001.md` | Session mag Standard **niet** herdefiniëren |
| `PAT-004` | Pattern (PAT) | Wedstrijdstructuur die deze session instantiëren | **CERTIFIED** (Product Director; B2 closed) | **Definitief** | `registers/patterns/PAT-004.md` | Instantie: balzijde rechts / back-receive |
| `LP-002` | Learning Progression | Recognition — enig gekoppeld LP-level | Ladder in LPR | **Definitief als LP-pin** | `learning-progression-register.md` | **Exact één** LP-pin: `LP-002` only |
| `OD-001` | Governance (OD) | Product Decision: register coach cue “Binnenkant dicht” | AWAITING_PRODUCT_DIRECTOR | **Definitief als besluit-ID (betekenis cue-registratie)** | `product-decision-register.md` §5.3; Doc `09`/`10` | **Niet** PRESS-001; blokkeert Language Gate / live |

### Pin-regels toegepast

- `OD-001` = cue-registratie alleen (nog OPEN).  
- **Geen** `LANG-001` geclaimd.  
- `PAT-004` = **CERTIFIED** Pattern (niet langer placeholder).  
- `PRESS-001` = **CERTIFIED** Standard — alleen consumeren.  
- `LP-002` = enige LP.

---

## 4. Prerequisites

### 4.1 `requires_hard`

| Veld | Waarde |
|------|--------|
| **Status** | **OPEN** |
| **Actieve hard deps** | Geen formeel vastgelegd in een goedgekeurde curriculum-index |

**Twee bestaande opties (geen keuze gemaakt in deze entry):**

| Optie | Broncontext | Betekenis |
|-------|-------------|-----------|
| **A — Lege Golden-entry** | `curriculum-dependency-architecture.md` §4.2 voorbeeld: `requires_hard: []` | Session mag starten zonder prior FDL |
| **B — Foundation-prerequisite** | `09` / `10` **OD-009** (Prerequisite session before Golden); CDA verwijst naar OD-009 | Foundation/oriëntatie verplicht vóór Golden — **geen nieuw prerequisite-ID verzonnen**; besluit via bestaande OD-009 |

Deze entry lost OD-009 niet op.

### 4.2 `requires_soft`

| Veld | Waarde |
|------|--------|
| **Status** | **OPEN / leeg** |
| **Actieve soft deps** | Geen formeel vastgelegd |

---

## 5. Curriculum Unlocks

### 5.1 Placeholder-IDs (niet actief)

| ID | Status | Regel |
|----|--------|--------|
| `FDL-00X` | **NOT ISSUED** — was uitsluitend placeholder in eerdere chat/notatie | **Niet** opnemen als actieve unlock-edge |
| `FDL-00Y` | **NOT ISSUED** — idem | **Niet** opnemen als actieve unlock-edge |

### 5.2 Actieve unlocks

| Veld | Waarde |
|------|--------|
| **Actieve unlock-lijst** | **Geen** |
| **Status** | **OPEN / NOT ISSUED** |

### 5.3 Bestaande richting (geen nieuwe session-IDs)

Uit `curriculum-dependency-architecture.md` §4.3 — alleen richting, **geen** uitgegeven FDL-IDs:

- Vervolg naar **LP-003 Decision** op dezelfde patroonfamilie (wanneer PAT + session-ID formeel bestaan).  
- Mogelijke **mirror-sessie** (andere zijde; policy/OD; eigen toekomstige FDL-ID later).

Geen nieuwe Decision Session-ID uitgegeven door dit document.

---

## 6. Governance References

| Vraag | Antwoord |
|-------|----------|
| **Waarom OD-001 wordt geciteerd** | De session gebruikt de coach cue **Binnenkant dicht**; Club Language Gate / Football Language OS eisen registratie vóór live (`09`, `10`, governance register). |
| **Wat OD-001 wél bestuurt** | Of **Binnenkant dicht** officieel wordt geregistreerd (optie a) versus terugval op bestaande term **Passlijn dicht** (optie b, conflicteert met Product Owner-mandaat). |
| **Wat OD-001 níet certificeert** | Niet `PRESS-001` / Canonieke Pressingstandaard; niet Positioning/Animation; niet curriculum-unlocks; niet CERTIFIED PASS van OS of deze session. |
| **Nog open governance (bestaande OD-lijst)** | OD-001…OD-010 zoals in `product-decision-register.md` / Doc `10` (o.a. shape OD-002, opponent OD-003, LB body OD-004, RW start OD-005, trigger OD-006, interaction OD-007, PRESS V2 assets OD-008, prerequisite OD-009, IA supersession OD-010). |

---

## 7. Certification Blockers

| Blocker-ID | Omschrijving | Eigenaar | Vereist bewijs | Huidige status |
|------------|--------------|----------|----------------|----------------|
| **BLK-01** | `PRESS-001` certificering | Product Director | Standard CERTIFIED | **RESOLVED** (B1 closed) |
| **BLK-02** | `PAT-004` formele uitgifte | Product Director | Pattern CERTIFIED | **RESOLVED** (B2 closed) |
| **BLK-03** | Besluit over `requires_hard` (lege entry vs foundation via OD-009) | Product Director | OD-009 resolved of expliciete CDA-policy PASS op `[]` | **OPEN** |
| **BLK-04** | Uitgifte van echte unlock-session-IDs | Product Director / Session Register | Nieuwe FDL-IDs uitgegeven; edges in curriculum index | **OPEN** (`FDL-00X/Y` verboden als edges) — blokkeert curriculum-edges, niet per se session-inhoud |
| **BLK-05** | Formele status van `OD-001` (cue-registratie) | Product Director | OD-001 = PASS of BLOCKED in Governance Register | **OPEN** (AWAITING) — Language Gate / live |
| **BLK-06** | Overige Golden locks uit authoring die implementatie blokkeren | Product Director | OD-002…OD-008 waar build-critical | **OPEN** |
| **BLK-07** | Werkende referentiesessie + quality gates evidence pack | Product Director | Doc `07` gates PASS + Doc `08` evidence | **OPEN** (Implementation status: **NOT STARTED**) |

---

## 8. Register Status Decision

| Status | Toegestaan nu? |
|--------|----------------|
| **REVIEW** | **Ja** — maximale status van deze entry |
| **CERTIFIED** | **Nee** |

**Waarom niet CERTIFIED**

1. BLK-01/02 **resolved** (PRESS-001 + PAT-004 CERTIFIED).  
2. BLK-03 `requires_hard` nog **OPEN**.  
3. BLK-05 `OD-001` nog **OPEN** (cue/Language Gate).  
4. BLK-06 build-critical ODs nog **OPEN**.  
5. BLK-07 implementatie + gates evidence **OPEN** (`NOT STARTED`).  
6. BLK-04 unlock-IDs **OPEN** (curriculum; geen actieve false edges).  

Deze entry **registreert** de node; Session CERTIFIED vereist B3-audit PASS + PD-resolutie na opheffen blockers.

---

## 9. Forbidden Claims

Dit document mag **niet** claimen dat:

1. `LANG-001` bestaat/gecertificeerd is zonder formele registratie en OD-001 PASS;  
2. `FDL-00X` / `FDL-00Y` echte curriculum-edges zijn;  
3. de **sessie** volledig gecertificeerd is zolang BLK-03/05/06/07 openstaan;  
4. `OD-001` PASS is;  
5. nieuwe Football Standards, Patterns, LP-levels, ODs of FDL-sessions door deze entry zijn uitgegeven.

*(PRESS-001 en PAT-004 zijn Product Director CERTIFIED — pins hierboven bijgewerkt.)*

---

## 10. Product Director Decision Support

| Onderdeel | Status |
|-----------|--------|
| Session ID `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` bestaat in authoring | **PASS** (identity) |
| Titel / purpose traceerbaar naar Doc `01` | **PASS** |
| Exact één LP-pin = `LP-002` | **PASS** |
| `OD-001` correct als cue-governance (niet PRESS) | **PASS** (citation correctness) |
| Register entry status = REVIEW only | **PASS** |
| `PRESS-001` pin | **PASS** (CERTIFIED) |
| `PAT-004` pin | **PASS** (CERTIFIED) |
| `requires_hard` | **OPEN** (BLK-03) |
| `requires_soft` | **OPEN** |
| Actieve curriculum unlocks | **OPEN** / **NOT ISSUED** (BLK-04) |
| `FDL-00X` / `FDL-00Y` | **PLACEHOLDER** (inactive; not edges) |
| `OD-001` besluit PASS/BLOCKED | **OPEN** + **BLOCKER** (BLK-05) |
| `LANG-001` als session pin | **Forbidden claim** — niet geclaimd |
| OD-002…OD-008 / implementatie evidence | **BLOCKER** (BLK-06, BLK-07) |
| CERTIFIED session status | **BLOCKER** — niet toegestaan tot B3 blockers cleared |

---

```text
SESSION REGISTER ENTRY:
REVIEW — B3 AUDIT BLOCKED
See: reviews/phase-b/B3-Golden-Session-Certification.md
```
