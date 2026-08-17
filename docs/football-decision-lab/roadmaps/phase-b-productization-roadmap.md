# Phase B — Productization Roadmap

```text
Product: Football Decision Lab
Document type: PRODUCTIZATION ROADMAP
Phase: B — Productization
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Roadmap version: PB-v1.0-DRAFT
Implementation status: NOT STARTED
Deadline context (bestaand): bruikbare productieversie vóór seizoensstart / OS MVP-kader 17 augustus 2026
```

**Doel:** Bestaande architectuur vertalen naar een uitvoerbaar productieplan.  
**Niet:** nieuwe governance, registers, abstracties, voetbalinhoud, of code in dit document.

---

## 1. Uitgangspunt — afgeronde architectuur (vaste basis)

Phase B behandelt de onderstaande laag als **bevroren input**. Werk = vullen, beslissen, bouwen, certificeren — niet herontwerpen.

| Laag | Bestaande bron | Status voor Phase B |
|------|----------------|---------------------|
| Operating System V1.0 | Product Foundation (CONDITIONAL PASS → pad naar CERTIFIED PASS via Golden) | Vast |
| Governance / OD-immutability | `governance/product-decision-register.md` | Goedgekeurd / leidend |
| Register Architecture | `governance/register-architecture.md` | Afgerond als model |
| Learning Progression | `governance/learning-progression-register.md` (`LP-001`…`LP-006`) | Afgerond als model |
| Curriculum Dependency | `governance/curriculum-dependency-architecture.md` | Afgerond als model |
| Golden Session authoring | `golden-session/inside-close-v1/` (Docs 00–11) | Authoring REVIEW; Implementation NOT STARTED |
| Session Register Entry | `registers/sessions/FDL-GS-INSIDE-CLOSE-RB-PRESS-V1.md` | Status **REVIEW** |
| MVP-kader (bestaand OS §24) | OS + flow + **8–12** gecertificeerde Decision Sessions; geen 100+ verplicht | Vast productiedoel |

**Architectuurketen die Phase B uitvoert (niet wijzigt):**

```text
OD → Standards → PAT → LP → FDL → Curriculum unlocks → Academy Product
```

---

## 2. Productiefasen

Werkvolgorde volgt bestaande blockers en dependency-richting (Standards vóór Pattern-definitie vóór Session CERTIFIED vóór parallelle productie vóór UI-integratie vóór eindvalidatie).

### Fase B0 — Decision Lock (Governance-uitvoering)

| Doel | Open ODs uit bestaand register sluiten die Golden/productie blokkeren |
| Werk | Product Director/Owner: OD-001…OD-010 beslissen (PASS/BLOCKED + gekozen optie) |
| Kritiek eerst | OD-001 (cue); OD-009 (`requires_hard`); OD-002…OD-006 (shape/state/animation locks); OD-007 (interactie); OD-008 (PRESS V2 assets); OD-010 (IA-scope) |
| Exit | Blocking ODs voor Golden hebben registerstatus PASS of expliciet niet-blocking |

*Geen nieuw governance-document — alleen besluiten in het bestaande registerproces.*

---

### Fase B1 — Certificeren van PRESS-001

| Doel | Canonieke Pressingstandaard inhoudelijk PASS (bestaande Doc `11` + Standard seed) |
| Werk | Product Director review van gereconstrueerde standaard; UEFA Pro-vragen uit OS/authoring gates; status `PRESS-001` → CERTIFIED `@v1` |
| Hangt af van | B0 waar state/shape-opties de standaard raken (OD-002…OD-006) |
| Exit | `PRESS-001` inhoudelijk CERTIFIED; niet langer alleen “ID uitgegeven” |
| Blokkeert | Session CERTIFIED (BLK-01) |

---

### Fase B2 — Formele uitgifte Pattern Register (PAT-004)

| Doel | Placeholder `PAT-004` omzetten naar formele Pattern-entry binnen **bestaande** Pattern Register-regels |
| Werk | PAT-004 definiëren: requires/cites (`PRESS-001` e.a. zoals architectuur voorschrijft); geen nieuwe namespace |
| Hangt af van | B1 (PRESS-001 CERTIFIED of minstens stabiel genoeg om te pinnen — Product Director mag parallel alleen als risico geaccepteerd) |
| Exit | `PAT-004` niet langer PLACEHOLDER; Session Entry mag pin als definitief markeren |
| Blokkeert | Session CERTIFIED (BLK-02) |

*Geen nieuw registertype — uitvoeren van bestaande PAT-laag.*

---

### Fase B3 — Golden Session volledig certificeren

| Doel | `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` van REVIEW → pad naar CERTIFIED (OS Golden + Session Register) |
| Substappen | |
| B3a | `requires_hard` vastzetten (lege entry vs OD-009 foundation) — BLK-03 |
| B3b | Authoring gates Doc `07` + acceptatie Doc `08` als build-checklist gebruiken |
| B3c | Implementatie van **één** referentiesessie volgens bestaand Session Contract / Timeline / Script (geen architectuurwijziging) |
| B3d | Evidence pack: mobiel/desktop, keuzes, contrast, recall, 22-reactie, lint/typecheck/build/tests zoals Doc `08` |
| B3e | Alle quality gates + UEFA Pro Review PASS |
| B3f | Session Register status CERTIFIED; OS CONDITIONAL PASS → CERTIFIED PASS |
| Hangt af van | B0, B1, B2; OD-001 PASS voor taal/live |
| Exit | Golden = norm voor alle volgende sessions |

---

### Fase B4 — Productie overige Decision Sessions (MVP 8–12)

| Doel | Bestaand OS-MVP: 8–12 gecertificeerde sessions (openingsbibliotheek / aanbevolen patroonset uit OS §24.2) |
| Werk | Per session: bestaande authoring-keten (Contract → State → Positioning → Timeline → Script → Recall → Gates) + pins PAT/LP/Standards; curriculum edges alleen met **uitgegeven** FDL-IDs |
| LP-pad | Primair hergebruik `LP-002` / `LP-003` (en desgewenst hoger) op bestaande PAT’s — **geen** nieuwe LP-niveaus |
| Unlocks | Vervangt placeholders `FDL-00X/Y`: echte IDs uitgeven bij session-registratie; edges volgens CDA |
| Hangt af van | B3 (Golden-norm) |
| Exit | 8–12 sessions gate-PASS; curriculum graph acyclisch; geen placeholder-edges |

**Prioriteit binnen B4 (bestaande OS-aanbeveling, geen nieuwe filosofie):** eerst sessions die aansluiten op Golden-familie (LP-003 / pressure / mirror-richting), daarna overige teamproblemen uit de bestaande aanbevolen twaalf — volgorde finetunen door Product Owner tegen trainingsplan (bestaande open slot in OS).

---

### Fase B5 — Integratie in de Academy UI

| Doel | Bestaande Navigation/Product Flow OS: startomgeving, sessie starten/hervatten/afronden, herhaling, mobiel+desktop |
| Werk | Decision Session shell + Tactical Pitch / layers volgens bestaande componentintentie in OS §23 — **productiseren**, geen nieuwe productlaag |
| Hangt af van | Minimaal B3c–B3e (referentiesessie speelbaar); B4 kan parallel na eerste shell-stabiel |
| Exit | Speelster kan Golden (+ MVP-set) doorlopen zonder trainer; soft/hard deps gerespecteerd |

---

### Fase B6 — Eindvalidatie

| Doel | Seizoensklare productieversie |
| Werk | Regressie bestaande Academie (Doc `08`); volledige gate-matrix steekproef + Golden full pack; curriculum unlock-smoke; mobiel primair; geen geluidsplicht |
| Exit | Phase B Definition of Done (§4) volledig groen |

---

## 3. Prioriteiten (afhankelijkheid × impact)

| Prio | Werkpakket | Waarom eerst |
|------|------------|--------------|
| **P0** | B0 — OD-locks (esp. OD-001, OD-009, OD-002…006) | Zonder dit blijft alles REVIEW/OPEN |
| **P1** | B1 — PRESS-001 CERTIFIED | Blokkeert eerlijke Standard-pin |
| **P1** | B2 — PAT-004 formeel | Blokkeert Session CERTIFIED |
| **P2** | B3 — Golden build + evidence + CERTIFIED | OS CERTIFIED PASS; norm voor schaal |
| **P3** | B5 (shell) parallel zodra Golden speelbaar | Unblocks speelsterpad; parallel met vroege B4 |
| **P3** | B4 — overige 8–12 sessions | MVP-volume |
| **P4** | B6 — eindvalidatie | Seizoensrelease |

**Impactregel:** Geen parallelle “100 sessions” vóór Golden CERTIFIED. Geen UI-polish vóór speelbare referentiesessie.

---

## 4. Definition of Done — Phase B

Phase B is **voltooid** wanneer **alle** punten waar zijn:

| # | Criterium |
|---|-----------|
| 1 | Blocking ODs voor Golden/MVP hebben een formele registeruitkomst (PASS/BLOCKED + optie) |
| 2 | `PRESS-001` inhoudelijk CERTIFIED `@v1` |
| 3 | `PAT-004` formeel uitgegeven (geen placeholder) |
| 4 | `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` Session Register status **CERTIFIED** |
| 5 | OS-status **CERTIFIED PASS** (Golden bewijst systemen gezamenlijk) |
| 6 | `requires_hard` / unlock-policy besloten; geen actieve `FDL-00X/Y` edges |
| 7 | Minimaal **8** (streef **8–12**) Decision Sessions gate-PASS naast/inclusief Golden |
| 8 | Productflow: start → speel → hervat → rond af → herhaling op mobiel én desktop |
| 9 | Acceptatie-evidence voor Golden compleet volgens bestaande Doc `08` |
| 10 | Regressie bestaande Academy-routes: geen kritieke break |
| 11 | Geen nieuwe architectuurlaag toegevoegd tijdens Phase B (tenzij §6-exception getekend) |

---

## 5. Risico's (uitsluitend uitvoering)

| ID | Uitvoeringsrisico | Mitigatie |
|----|-------------------|-----------|
| XR-01 | OD-besluiten blijven open → Golden blijft REVIEW | Timebox B0; wekelijkse PD-beslisronde |
| XR-02 | PRESS-001 / PAT-004 te laat → B4 start te vroeg en moet herwerkt | Harde poort: geen batch-authoring vóór B1+B2 PASS |
| XR-03 | Implementatie improviseert voetbal buiten contract | Cursor/eng: alleen Session Contract + pins; Wet “geen zelfstandige voetbalinhoud” |
| XR-04 | Hergebruik PRESS V2-films met verkeerde contrast-delta | Volg OD-008 uitkomst; Golden contrast = recht vs curve |
| XR-05 | Scope creep naar 100+ sessions vóór seizoen | Hard cap OS MVP 8–12 |
| XR-06 | UI-integratie trekt oude Academy-hoofdstukflow terug | Bestaande FDL Navigation OS + OD-010 uitkomst respecteren |
| XR-07 | Evidence pack incompleet → valse “klaar”-claim | Doc `08` checklist als release gate |
| XR-08 | Parallelle authors zonder Golden-norm → inconsistente kwaliteit | B3 vóór brede B4 |
| XR-09 | Mobiele touch/keuze onbetrouwbaar (OD-007) | Besluit B0; test op target devices in B3/B5 |
| XR-10 | Kalenderdruk richting 17 aug / seizoensstart | P0–P2 niet inleveren; liever 8 stevige sessions dan 12 zwakke |

---

## 6. Scopebewaking

Tijdens Phase B geldt:

1. **Geen** nieuwe governance-documenten.  
2. **Geen** nieuwe registers of namespaces.  
3. **Geen** nieuwe abstractielagen (geen parallel “Phase B OS”).  
4. **Geen** nieuwe voetbalprincipes buiten bestaande authoring + PD-besluiten op open ODs.  
5. Wijzigingen = vullen van bestaande IDs/statussen, Golden-implementatie, session-productie, UI-integratie, validatie.

**Enige uitzondering**

> Een nieuwe architectuurartefact mag alleen worden voorgesteld wanneer een **aantoonbare blokkade** bestaat die met bestaande lagen (OD / Standard / PAT / LP / FDL / CDA / gates) **niet** oplosbaar is. Voorstel vereist expliciete Product Director-goedkeuring en wordt behandeld als uitzondering — niet als standaard Phase B-werk.

---

## 7. Compacte fasekalender (uitvoering)

```text
B0 OD locks
  → B1 PRESS-001 CERTIFIED
  → B2 PAT-004 issued
  → B3 Golden CERTIFIED (+ OS CERTIFIED PASS)
  → B4 MVP sessions 8–12  ∥  B5 UI shell (vanaf speelbare Golden)
  → B6 Eindvalidatie / seizoensklaar
```

---

## 8. Product Director Decision

| Veld | |
|------|--|
| Approve Phase B roadmap PB-v1.0? | |
| Confirm hard gate: no B4 batch before Golden CERTIFIED? | |
| Confirm MVP cap 8–12 for seizoensstart? | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

```text
PHASE B PRODUCTIZATION ROADMAP:
READY FOR PRODUCT DIRECTOR REVIEW
```
