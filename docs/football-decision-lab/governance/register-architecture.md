# Football Decision Lab — Register Architecture

```text
Product: Football Decision Lab
Document type: REGISTER ARCHITECTURE
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Governance base: GBR-v1.0 (Product Decision Register — APPROVED)
Architecture version: RAR-v1.0-DRAFT
Implementation status: NOT STARTED
```

**Doel:** Definitief vastleggen hoe alle registers binnen het Football Decision Lab samenwerken — schaalbaar van Golden Session tot honderden Decision Sessions.

**Niet in scope:** code, implementatie, wijzigingen aan bestaande authoringdocumenten, nieuwe of gewijzigde voetbalinhoud.

**Afhankelijkheid:** Dit document bouwt op het goedgekeurde [Product Decision Register](./product-decision-register.md) (immutable IDs, namespaces, migratie). Bij conflict tussen operationele details wint het goedgekeurde Governance Register voor OD-regels; dit document wint voor **lagenarchitectuur en toegestane relaties**.

---

## 0. Architectuur in één zin

> Product Decisions keuren regels goed; Football Standards leggen herbruikbare regels vast; Patterns bundelen standaarden tot leerbare wedstrijdpatronen; Decision Sessions trainen één beslissing binnen die patronen; het Academy Product levert sessies aan speelsters zonder lokale ID-wetgeving.

---

## 1. Governance Register

### 1.1 Rol in de architectuur

Het Governance Register is de **enige laag die bestuurlijke keuzes** (`OD-xxx`) mag vastleggen, goedkeuren of blokkeren.

Het definieert geen voetbalgedrag. Het **autoriseert** Standards, Patterns en Sessions om live of implementeerbaar te worden.

### 1.2 Product Decisions (`OD-xxx`)

| Eigenschap | Regel |
|------------|--------|
| Doel | Open product-/clubkeuze met opties; PASS of BLOCKED |
| Eigenaar | Product Director (besluit); Product Owner (aanvraag/clubmandaat) |
| Formaat | `OD-001`, `OD-002`, … (zero-padded, monotoon) |
| Inhoud | Vraag, opties, recommended (uit authoring), affects, blocking_for, resolved |
| Mag niet | Voetbalregels herschrijven; Standard-inhoud bevatten behalve verwijzing |

### 1.3 Immutable IDs

Overgenomen als architectuurwet uit het goedgekeurde Governance Register:

- Een uitgegeven ID verandert nooit van betekenis.
- Hernummeren is verboden.
- Hergebruik van een ID voor een ander onderwerp is verboden.
- Correctie = nieuwe ID + `SUPERSEDED` / erratum — nooit stilzwijgende herdefinitie.

**Wet A1:** Documentsectiekoppen zijn geen register. Alleen registerrijen zijn gezaghebbend.

### 1.4 Besluitvorming

```text
PROPOSED
  → ID uitgegeven
  → AWAITING_PRODUCT_DIRECTOR
  → PASS | BLOCKED
  → (optioneel later) SUPERSEDED via nieuwe OD
```

Blocking ODs moeten PASS zijn voordat:

- een Standard `@v1` als **CERTIFIED** mag gelden voor implementatie;
- een Decision Session-implementatieprompt mag starten;
- livegang van die session mag plaatsvinden.

### 1.5 Versiebeheer (Governance-laag)

| Object | Versie |
|--------|--------|
| Governance Register document | `GBR-vMAJOR.MINOR` |
| Register Architecture (dit doc) | `RAR-vMAJOR.MINOR` |
| Individuele OD | Geen content-versie; status + audit trail |
| Errata | Gedateerde pointerbestanden; wijzigen geen OD-betekenis |

---

## 2. Football Standards Register

Football Standards zijn **herbruikbare, goedgekeurde regels**. Zij zijn de enige plek waar canonieke leer- en uitvoeringsregels wonen.

Elke Standard:

- heeft een immutable ID + optionele `@vN` content-versie;
- wordt **geopend** of **gewijzigd** alleen via een gerelateerde `OD-xxx` (behalve puur redactionele errata zonder betekeniswijziging);
- mag door meerdere Patterns en Sessions worden geciteerd.

### 2.1 Namespace-overzicht

| Prefix | Domein |
|--------|--------|
| `PRESS-xxx` | Pressinggedrag en pressingketens |
| `LANG-xxx` | Officiële taal, cues, verboden synoniemen |
| `POS-xxx` | Positionering, relaties, afstandsbanden |
| `ANIM-xxx` | Motion, timeline, bal, camera |
| `SCAN-xxx` | Observatiecues, scanvensters, aandacht zonder spoiler |
| `STATE-xxx` | Tactical state-lagen en situatie-identiteiten |
| `RECALL-xxx` | Recallvarianten, mastery-logica |
| `GATE-xxx` | Quality-gate schema’s en fail-regels |

---

### 2.2 `PRESS-xxx` — Pressing Standards

| | |
|--|--|
| **Doel** | Canonieke pressingprincipes en -acties (rollenketen, force direction in een toestand, approach laws) |
| **Eigenaar** | Product Owner (voetbal); Product Director (certificering); Authoring levert draft |
| **Nieuwe standaard ontstaat wanneer** | Een pressinggedrag herbruikbaar moet zijn over ≥2 sessions of als Golden/clubnorm wordt bevroren |
| **Hergebruik wanneer** | Zelfde primaire pressingprioriteit en rollenlogica; alleen side/variant verschilt → zelfde `PRESS-xxx@vN` of mirror-parameter, geen dubbele standaard |

---

### 2.3 `LANG-xxx` — Language Standards

| | |
|--|--|
| **Doel** | Eén term = één gedrag; officiële cues (≤3 woorden); verboden vage taal |
| **Eigenaar** | Product Owner + Club Language Gate |
| **Nieuwe standaard ontstaat wanneer** | Nieuwe officiële term/cue nodig is die nog niet geregistreerd is (via OD) |
| **Hergebruik wanneer** | Exact hetzelfde observeerbare gedrag; geen synoniem-standaard voor dezelfde betekenis |

---

### 2.4 `POS-xxx` — Positioning Standards

| | |
|--|--|
| **Doel** | Relationele bezetting (22 of subset), rollen, afstandsbanden, teamreacties |
| **Eigenaar** | Product Owner (tactiek); Positioning Gate bij lock |
| **Nieuwe standaard ontstaat wanneer** | Een situatie-familie een stabiele map nodig heeft die sessions niet lokaal mogen herdefiniëren |
| **Hergebruik wanneer** | Zelfde formatie-/pressingbezettingslogica en relationele regels; coordinatenvarianten blijven binnen `@vN` of situation parameters |

---

### 2.5 `ANIM-xxx` — Animation Standards

| | |
|--|--|
| **Doel** | T0–T7 / Set→Consequence wetten, balstandaard, pressing motion, camera, overlay-sync |
| **Eigenaar** | Animation / Visual Gate + Product Director voor Golden locks |
| **Nieuwe standaard ontstaat wanneer** | Motion-regels herbruikbaar moeten zijn of een referentielijn (Golden) bevriezen |
| **Hergebruik wanneer** | Zelfde motion laws; alleen timing/side/skin verschilt |

---

### 2.6 `SCAN-xxx` — Perception / Scan Standards

| | |
|--|--|
| **Doel** | Wat de speelster moet waarnemen vóór de keuze; scanvensters; toegestane aandachtshulp zonder antwoord spoiler |
| **Eigenaar** | Learning / Perception (Product Owner didactiek); Cognitive Gate |
| **Nieuwe standaard ontstaat wanneer** | Een cue-set of scanvenster herbruikbaar is over sessions in dezelfde patroonfamilie |
| **Hergebruik wanneer** | Dezelfde observatiecategorieën en “geen spoiler”-regels; session mag subset *citeren*, niet herschrijven |

---

### 2.7 `STATE-xxx` — Tactical State Standards

| | |
|--|--|
| **Doel** | Acht toestandslagen, canonieke situatie-identiteiten, wat een state ongeldig maakt, state-afhankelijkheid van prioriteiten |
| **Eigenaar** | Product Owner (tactische waarheid); Tactical Gate |
| **Nieuwe standaard ontstaat wanneer** | Een wedstrijdtoestand stabiel genoeg is om tegenstrijdige sessions te voorkomen |
| **Hergebruik wanneer** | Zelfde fase/balzone/druklogica; sessions pinnen `STATE-xxx` + eventuele situation ID |

---

### 2.8 `RECALL-xxx` — Recall Standards

| | |
|--|--|
| **Doel** | Toegestane varianttypes, succescriteria, mastery-statusovergangen, spaced-herhalingskoppeling |
| **Eigenaar** | Recall & Adaptation OS (product); Product Director bij Golden recall-norm |
| **Nieuwe standaard ontstaat wanneer** | Een recallmechanisme of variantklasse herbruikbaar moet zijn |
| **Hergebruik wanneer** | Zelfde variantregel (bijv. “snellere pass, zelfde prioriteit”); session levert alleen instantie-parameters |

---

### 2.9 `GATE-xxx` — Gate Standards

| | |
|--|--|
| **Doel** | Formele PASS/BLOCKED-criteria per gate (Tactical, Positioning, Didactic, …); automatische structurele checks |
| **Eigenaar** | Quality Assurance OS; Product Director voor schemawijzigingen |
| **Nieuwe standaard ontstaat wanneer** | Een gate-definitie of checklistschema stabiel genoeg is voor alle sessions |
| **Hergebruik wanneer** | Altijd — sessions vullen evidence in; zij wijzigen gate-regels niet |

---

## 3. Pattern Register (`PAT-xxx`)

### 3.1 Doel

Een **Pattern** is een herkenbaar wedstrijdpatroon op leer-niveau: een bundel van Football Standards die samen “dit soort moment” beschrijven, zonder zelf een Decision Session te zijn.

Patterns beantwoorden: *Welk wedstrijdprobleem trainen we als familie?*  
Sessions beantwoorden: *Welke ene beslissing traint deze speelster nu?*

### 3.2 Wat een patroon is

| Is wel | Is niet |
|--------|---------|
| Stabiele patroonfamilie (bijv. flankpress op back-receive) | Een losse animatie |
| Verwijzingenset naar `PRESS` / `STATE` / `POS` / `LANG` / … | Een Product Decision |
| Basis voor meerdere sessions (sides, difficulty, recall) | Een UI-pagina of hoofdstuk |

### 3.3 Wanneer een nieuw patroon ontstaat

Een nieuwe `PAT-xxx` ontstaat wanneer:

1. het wedstrijdprobleem **niet** al door een bestaande PAT wordt gedekt; en
2. minstens de kern-Standards bestaan of gelijktijdig worden voorgesteld; en
3. Product Director (via OD indien needed) bevestigt dat dit een **familie** is, geen eenmalige session-uitzondering.

### 3.4 Meerdere Decision Sessions op hetzelfde patroon

Toegestaan en gewenst:

| Session-variatie | Zelfde PAT? |
|------------------|-------------|
| Spiegel links/rechts | Ja |
| Difficulty 1→5 | Ja |
| Andere primary position binnen zelfde patroonlogica | Alleen als PAT dat toelaat; anders nieuwe PAT |
| Recall-instanties | Ja (via `RECALL-xxx` + session) |
| Andere primaire beslissing | Nee → nieuwe PAT of child-PAT met expliciete link |

### 3.5 Hoe Patterns naar Football Standards verwijzen

```text
PAT-xxx
  requires: STATE-a, PRESS-b, POS-c, LANG-d, SCAN-e, …
  optional: ANIM-f, RECALL-g
  certified_when: all required Standards PASS @ pinned version
                 + blocking ODs PASS
```

Patterns **overnemen geen** Standard-tekst. Zij **citeren** IDs + versies.

---

## 4. Decision Session Register (`FDL-xxx` / Session IDs)

### 4.1 Rol

Een Decision Session is een **concrete leereenheid**: één primaire beslissing, vaste flow, gekoppeld aan Pattern + Standards.

Canoniek session-ID-formaat blijft in lijn met bestaande authoring (bijv. `FDL-GS-…`). Het Decision Session Register houdt de index; het **definieert geen** nieuwe football laws.

### 4.2 Hoe een sessie naar Standards verwijst

Elke session contract **moet** bevatten:

```text
Session ID: FDL-…
Pattern: PAT-…
Pins:
  STATE-…@vN
  PRESS-…@vN
  POS-…@vN
  LANG-…@vN
  SCAN-…@vN
  ANIM-…@vN
  RECALL-…@vN (indien van toepassing)
  GATE-…@vN (evidence against)
Open ODs: OD-… (blocking list)
```

### 4.3 Hoe een sessie naar Patterns verwijst

- Exact één primary `PAT-xxx` per session.
- Optioneel `related_patterns` voor transfer — geen tweede primary decision.
- Session mag patroon **instantieren** (side, difficulty, freeze parameters binnen Standard-grenzen).

### 4.4 Waarom sessies zelf geen standaarden mogen definiëren

1. **Schaal** — 500 sessions × lokale regels = onbeheersbare tegenstrijdigheden.
2. **Wet “één systeem, honderd toepassingen”** (OS) — sessions zijn toepassingen.
3. **Certificering** — Gates toetsen tegen Standards, niet tegen session-proza.
4. **Governance-incidentpreventie** — lokale “OD-01 in dit bestand” ontstaat precies wanneer sessions wetten maken.
5. **Hergebruik** — Patterns en toekomstige mirrors breken als de waarheid in de session zit.

**Wet A2:** Session documents mogen alleen **parameters, copy binnen text diet, en evidence** bevatten. Nieuwe canonieke regels → nieuwe of bijgewerkte Standard + OD.

---

## 5. Relatiemodel

```text
┌─────────────────────────────────────┐
│         GOVERNANCE REGISTER         │
│   OD-xxx  (PASS / BLOCKED / …)      │
│   Immutable IDs · Audit · Errata    │
└─────────────────┬───────────────────┘
                  │ authorizes / blocks
                  ▼
┌─────────────────────────────────────┐
│     FOOTBALL STANDARDS REGISTER     │
│  PRESS · LANG · POS · ANIM          │
│  SCAN · STATE · RECALL · GATE       │
│  (versioned @vN)                    │
└─────────────────┬───────────────────┘
                  │ composed into
                  ▼
┌─────────────────────────────────────┐
│         PATTERN REGISTER            │
│            PAT-xxx                  │
│  cites Standards @ pinned versions  │
└─────────────────┬───────────────────┘
                  │ instantiated by
                  ▼
┌─────────────────────────────────────┐
│    DECISION SESSION REGISTER        │
│            FDL-xxx                  │
│  one decision · pins PAT + Standards│
└─────────────────┬───────────────────┘
                  │ delivered by
                  ▼
┌─────────────────────────────────────┐
│         ACADEMY PRODUCT             │
│  UI / runtime / telemetry / recall  │
│  no local law-making                │
└─────────────────────────────────────┘
```

### 5.1 Toegestane afhankelijkheidsrichting

| Van | Naar | Toegestaan |
|-----|------|------------|
| OD | Standard / Pattern / Session | Ja — authorize, block, require |
| Standard | andere Standard | Ja — soft dependency (cite) |
| Pattern | Standards | Ja — requires |
| Session | Pattern + Standards + ODs | Ja — pins |
| Academy Product | Session IDs | Ja — deliver / measure |
| Session | nieuwe Standard-definitie | **Nee** |
| Pattern | OD overschrijven | **Nee** |
| Product UI | eigen IDs / lokale wetten | **Nee** |

---

## 6. Niet toegestaan

Expliciet verboden afhankelijkheden en praktijken:

| Verbod | Waarom |
|--------|--------|
| Sessions die Standards definiëren | Breekt hergebruik en gates |
| Patterns die Product Decisions overschrijven | Governance-laag verliest autoriteit |
| Standards die ODs negeren die hen blocken | Livegang zonder besluit |
| Lokale documenten die eigen `OD-01`-achtige IDs introduceren zonder registeruitgifte | ID-collision (bekend incident) |
| Dubbele Standards voor hetzelfde observeerbare gedrag | Taal- en tactiekconflicten |
| Hernummeren of hergebruiken van IDs | Trace break |
| Session→Session als enige “waarheid” zonder Standard-pin | Verborgen doctrine |
| Academy Product-lagen die cue/taal verzinnen buiten `LANG-xxx` | Club Language Gate fail |
| Gate-evidence die gate-regels herschrijft | `GATE-xxx` is schema, geen session-proza |
| Bidirectionele “Session wijzigt PRESS omdat het zo beter animeert” zonder OD + `@vN` | Stille doctrine-drift |

**Wet A3 — Acyclic authority**

> Gezag stroomt alleen omlaag in het schema van §5. Lagere lagen mogen omhoog **verzoeken** (nieuwe OD / Standard draft), nooit omhoog **wetten stellen**.

---

## 7. Schaalbaarheid

### 7.1 Bij 10 sessies (MVP / Golden + openingsbibliotheek)

| Druk | Architectuurantwoord |
|------|----------------------|
| Weinig Patterns | 1–3 `PAT-xxx`; strakke Golden pins |
| Weinig ODs | Blocking list kort; register nog overzichtelijk |
| Risico | Mensen shortcutten “alles in één markdown” |
| Mitigatie | Wet A2 vanaf sessie 1; Golden bewijst keten |

### 7.2 Bij 100 sessies

| Druk | Architectuurantwoord |
|------|----------------------|
| Veel mirrors/difficulties | Zelfde `PAT` + parameters; geen 100 PRESS-kopieën |
| Taalgroei | `LANG-xxx` voorkomt synoniemexplosie |
| State-conflicten | `STATE-xxx` voorkomt tegenstrijdige pressinglogica |
| Review-last | Gates toetsen Standards; sessions leveren evidence templates |

### 7.3 Bij 500 sessies

| Druk | Architectuurantwoord |
|------|----------------------|
| Governance volume | ODs alleen bij echte keuzes; hergebruik Standards verlaagt OD-tempo |
| Zoekbaarheid | Immutable IDs + namespaces; geen hernummerchaos |
| Drift | Version pins (`@vN`) isoleren oude sessions van Standard-upgrades |
| Teams parallel | Eigenaarschap per namespace; Sessions raken geen Standard-bodies |
| Incidenttype “twee betekenissen voor OD-01” | Structureel onmogelijk als Wet A1 + uitgifteproces worden gevolgd |

### 7.4 Schaalformule

```text
Sessions ≈ O(n)
Patterns ≈ O(n / variants_per_pattern)   // veel lager dan n
Standards ≈ O(stable club rules)         // groeit langzaam
ODs ≈ O(new locks + standard changes)    // niet O(n)
```

Zonder deze architectuur groeien wetten met `O(n)` (per session). Met deze architectuur groeien wetten met `O(rules)`, sessions met `O(n)`.

---

## 8. Verantwoordelijkheden (RACI-samenvatting)

| Laag | Responsible | Accountable | Consulted |
|------|-------------|-------------|-----------|
| OD | Authoring vraagt | Product Director | Product Owner |
| Standards | Authoring draft | Product Owner (football/language) + PD certify | Gate owners |
| Patterns | Curriculum / authoring | Product Owner | PD |
| Sessions | Authoring | PD voor Golden/live | Gates |
| Academy Product | Engineering | PD (scope) | — |

---

## 9. Product Director Decision (op deze architectuur)

| Veld | |
|------|--|
| Approve RAR-v1.0 layer model (§5)? | |
| Approve namespaces SCAN-xxx + STATE-xxx naast bestaande? | |
| Approve Wet A1–A3? | |
| Approve Pattern Register PAT-xxx als verplichte tussenlaag? | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

```text
REGISTER ARCHITECTURE:
READY FOR PRODUCT DIRECTOR REVIEW
```
