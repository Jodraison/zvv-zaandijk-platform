# Football Decision Lab — Product Decision Register (Governance)

```text
Product: Football Decision Lab
Document type: GOVERNANCE REGISTER
Document status: READY FOR PRODUCT DIRECTOR REVIEW
OS version: 1.0
Implementation status: NOT STARTED
Register version: GBR-v1.0-DRAFT
```

**Scope:** Bestuurlijke identificatie, registratie en verwijzing voor Product Decisions en gerelateerde Standards — voor Golden Session én honderden toekomstige Decision Sessions.

**Niet in scope:** voetbalinhoud, authoringwijzigingen, code, UI, implementatie.

---

## 0. Incident dat deze governance afdwingt

| Feit | Gevolg |
|------|--------|
| Authoring Docs `09` / `10` gebruiken **OD-01** voor cue-registratie (“Binnenkant dicht”) | Bestaande Product Decision-ID |
| Review Doc `11` gebruikt **OD-01** voor Canonieke Pressingstandaard | Zelfde ID, andere betekenis |
| Bestuurlijke status | **Onacceptabel** — één ID mag nooit twee besluiten betekenen |

Dit register voorkomt herhaling en herstelt consistentie **zonder** bestaande authoringdocumenten inhoudelijk te herschrijven.

---

## 1. Waarom OD-nummers nooit mogen veranderen

1. **Traceerbaarheid** — Reviews, gates, implementatieprompts en trainersbesluiten verwijzen naar vaste IDs. Hernummeren breekt de keten.
2. **Auditbaarheid** — “Wat is besloten?” moet jaren later nog vindbaar zijn onder dezelfde code.
3. **Schaal** — Bij honderden sessions ontstaan cross-references. Muteerbare nummers maken het register onbruikbaar.
4. **Conflictpreventie** — Hernummering creëert precies het OD-01-incident opnieuw.
5. **Impliciete belofte** — Een gepubliceerde `OD-xxx` is een permanente sleutel, geen volgnummer in een documentsectie.

**Wet G1 — Immutable IDs**

> Een eenmaal uitgegeven identificatie wordt nooit hergebruikt voor een ander onderwerp en nooit hernummerd. Correctie = nieuwe ID + deprecation van de oude, of erratum-notitie zonder ID-wijziging.

**Wet G2 — Documentsecties ≠ Register-IDs**

> Hoofdstukvolgorde in een Markdown-bestand (“# OD-01”) is geen registratiehandeling. Alleen een regel in het Product Decision Register is gezaghebbend.

---

## 2. Hoe Product Decisions worden geregistreerd

### 2.1 Definitie

Een **Product Decision (OD)** is een bestuurlijke keuze die Product Owner / Product Director moet nemen voordat content of implementatie verder mag. Het is geen voetbalstandaard zelf; het kan wél een standaard **goedkeuren**, **blokkeren** of **wijzigen**.

### 2.2 Verplichte velden (elke OD)

| Veld | Eis |
|------|-----|
| `id` | `OD-###` (zero-padded, immutable) |
| `title` | Korte unieke titel |
| `status` | `PROPOSED` \| `AWAITING_PRODUCT_DIRECTOR` \| `PASS` \| `BLOCKED` \| `SUPERSEDED` |
| `opened` | Datum + document/pad waar de vraag ontstond |
| `owner` | Product Director of Product Owner |
| `decision_question` | Exacte ja/nee of optiekeuze |
| `options` | Lijst a/b/c zoals in authoring (geen stilzwijgende nieuwe opties in register) |
| `recommended` | Alleen overgenomen uit authoring (indien aanwezig) |
| `affects` | Lijst van Standard-IDs en/of Session-IDs |
| `blocking_for` | Wat mag niet starten tot PASS (bijv. implementatieprompt, livegang) |
| `resolved` | Datum + gekozen optie (leeg tot besluit) |
| `supersedes` / `superseded_by` | Optionele ID-links |

### 2.3 Registratieproces

```text
1. Authoring of review ontdekt open keuze
2. Nieuw OD-### aangevraagd bij Register Custodian (Product Director of gedelegeerd)
3. ID uitgegeven VOORDAT documenten die ID als gezaghebbend gebruiken
4. Decision Summary / Review mag alleen verwijzen naar uitgegeven IDs
5. Product Director vult status PASS of BLOCKED
6. Registerrij is source of truth; documenten citeren, herschrijven de beslissing niet
```

### 2.4 Wie mag IDs uitgeven

| Rol | Mag |
|-----|-----|
| Product Director | OD uitgeven, PASS/BLOCKED zetten, depreceren |
| Product Owner | OD aanvragen; mede-eigenaar op clubbesluiten |
| Authoring / Cursor | Mag **geen** nieuwe OD-nummers verzinnen in reviews; moet `PROPOSED` zonder nummer of “pending ID” markeren tot uitgifte — zie migratie §10 voor bestaande incident |

---

## 3. Hoe Review Documents naar Product Decisions verwijzen

### 3.1 Verplichte citation form

In elk review- of decision-support document:

```text
Register ref: OD-001
Title: <exact register title>
Status: <status from register>
```

Nooit:

- een nieuw onderwerp onder een bestaand OD-nummer plaatsen;
- “OD-01” als lokale sectiekop gebruiken voor een ander besluit;
- een review betitelen als “OD-01 Review” tenzij het register dat ID aan dat onderwerp koppelt.

### 3.2 Reviews van Standards (niet van ODs)

Een review van een **Standard** verwijst naar de Standard-ID:

```text
Standard under review: PRESS-001
Related Product Decisions: OD-001, OD-002, …
```

De review mag de Standard reconstrueren en PASS/BLOCKED **voorstellen**; alleen Product Director zet de bijbehorende OD of Standard-status formeel.

### 3.3 Conflictregel

Als een documenttitel en het register niet overeenkomen:

> **Register wint.** Het document krijgt een erratum-pointer (zie §10) zonder inhoudelijke herschrijving van authoring.

---

## 4. Verschil tussen Decision-types en Standard-types

| Type | Wat het is | Wie beslist | Voorbeeld (Golden context — alleen ter illustratie van type, geen nieuwe inhoud) |
|------|------------|-------------|----------------------------------------------------------------------------------|
| **Product Decision (OD)** | Bestuurlijke open keuze / goedkeuring | Product Director / Owner | Of cue wordt geregistreerd; of shape-presentatie optie (a) |
| **Football Standard (PRESS / pattern families)** | Canonieke voetbalgedragsstandaard voor hergebruik | Goedgekeurd via OD; daarna immutable tot nieuwe versie | Canonieke pressingactie voor flank-back receive |
| **Language Standard (LANG)** | Officiële term, definitie, cue, verboden synoniem | Language Gate + OD bij nieuwe term | Cue “Binnenkant dicht” |
| **Positioning Standard (POS)** | Relationele bezetting, rollen, afstandsbanden | Positioning Gate + OD bij lock | 22-player map lock voor situatie-ID |
| **Animation Standard (ANIM)** | T0–T7, bal/press motion rules, camera | Visual/Animation Gates + OD | Freeze rules; ball path = overlay |
| **Gate Standard (GATE)** | Pass/fail criteria sets | OS Quality Assurance; wijziging via OD | Tactical Gate checklist schema |
| **Recall Standard (RECALL)** | Variantregels en mastery-statuslogica | Recall OS + OD bij nieuwe varianttypes | Micro-recall change types |

**Kernregel:** Standards bevatten *wat altijd zo is (tot nieuwe versie)*. Product Decisions bevatten *of we dit goedkeuren / welke optie we kiezen*. Reviews onderzoeken Standards of bereiden ODs voor — ze zijn zelf geen registerentries tenzij apart genummerd als `REV-xxx` (optioneel; niet verplicht in v1).

---

## 5. Voorstel vaste identificaties

### 5.1 Namespaces

| Prefix | Domein | Patroon | Opmerkingen |
|--------|--------|---------|-------------|
| `OD-###` | Product Decision | `OD-001` … | Bestuur; immutable |
| `PRESS-###` | Football / pressing standards | `PRESS-001` | Canonieke press patterns |
| `LANG-###` | Language standards | `LANG-001` | Terms & cues |
| `POS-###` | Positioning standards | `POS-001` | Situatie- of patroongebonden maps |
| `ANIM-###` | Animation standards | `ANIM-001` | Timelines & motion laws |
| `GATE-###` | Gate standards | `GATE-001` | Gate definitions / check schemas |
| `RECALL-###` | Recall standards | `RECALL-001` | Variant & mastery rules |
| `SESS-…` | Session identity (bestaand authoring) | bijv. `FDL-GS-INSIDE-CLOSE-RB-PRESS-V1` | Geen OD; session contract ID |
| `SIT-…` | Canonical situation | bijv. `DEF-HIGH-RIGHTWING-01` | Situatie-identiteit |

### 5.2 Uitgiftevolgorde

- Nummers binnen een prefix zijn **monotoon oplopend**.
- Geen hergebruik van vrijgekomen nummers.
- Gaps toegestaan (geannuleerde uitgifte vóór publicatie wordt `VOID` met reden, nummer blijft bezet).

### 5.3 Initieel Golden-migratievoorstel (IDs reserveren — geen inhoudswijziging)

| Nieuw register-ID | Onderwerp (zoals al in authoring; geen nieuwe filosofie) | Was foutief / lokaal gelabeld als |
|-------------------|----------------------------------------------------------|-----------------------------------|
| `OD-001` | Register coach cue “Binnenkant dicht” | Doc 09/10 “OD-01” — **behouden betekenis** |
| `OD-002` | How to present our shape on screen | Doc 09/10 “OD-02” |
| `OD-003` | Opponent formation lock | Doc 09/10 “OD-03” |
| `OD-004` | Exact LB body angle at freeze | Doc 09/10 “OD-04” |
| `OD-005` | RW start distance / height | Doc 09/10 “OD-05” |
| `OD-006` | Exact trigger passer / foot | Doc 09/10 “OD-06” |
| `OD-007` | Decision interaction modality for v1 | Doc 09/10 “OD-07” |
| `OD-008` | Relationship to existing PRESS V2 code assets | Doc 09/10 “OD-08” |
| `OD-009` | Prerequisite session before Golden | Doc 09/10 “OD-09” |
| `OD-010` | Formal supersession Academy Architecture Freeze IA (Decision Lab scope) | Doc 09/10 “OD-10” |
| `PRESS-001` | Canonieke pressingstandaard gereconstrueerd in Doc 11 | Foutief “OD-01” in Doc 11 titel |
| `LANG-001` | Cue “Binnenkant dicht” (afhankelijk van OD-001 PASS) | Gekoppeld aan OD-001 |
| `POS-001` | Positioning map lock voor `DEF-HIGH-RIGHTWING-01` | Doc 03 (na OD-002/003/005 locks) |
| `ANIM-001` | Timeline T0–T7 + ball/press standard voor Golden | Doc 04 |
| `RECALL-001` | Micro recall R1 snellere pass | Doc 06 |
| `GATE-001` … | Gate schemas (later te vullen uit OS / Doc 07) | Geen hernummering van OD |

**Belangrijk:** `OD-001` houdt de **oorspronkelijke** betekenis (cue-registratie). De pressingstandaard krijgt **`PRESS-001`**, niet een hergebruikt OD-nummer.

---

## 6. Naamgevingsregels

1. **IDs:** alleen `PREFIX-###` in ASCII; drie digits minimum; geen spaties.
2. **Titles:** Engels of Nederlands toegestaan; uniek binnen prefix; max ~80 tekens.
3. **Bestandsnamen:** kebab-case; reviews noemen Standard- of OD-ID in de bestandsnaam wanneer nieuw aangemaakt, bijv. `11-press-001-canonical-pressing-standard-review.md` (toekomstige bestanden; bestaande namen blijven — zie §10).
4. **Sectiekoppen in docs:** vermijd kale `OD-01` als kop tenzij gevolgd door registertitel: `OD-001 — Register coach cue “Binnenkant dicht”`.
5. **Session IDs** blijven `FDL-…` / `DEF-…` en worden niet tot OD hernummerd.
6. **Geen synonieme IDs** voor hetzelfde besluit (“OD-1” ≠ “OD-01” ≠ “OD-001” — canoniek is altijd `OD-001`).

---

## 7. Versiebeheer

| Object | Versie-regel |
|--------|--------------|
| Dit Governance Register | `GBR-vMAJOR.MINOR`; MAJOR bij breaking namespace-regels |
| Product Decision | Geen versie van de ID; status + `resolved` audit trail |
| Standard (`PRESS-001` etc.) | `PRESS-001@v1`, `@v2` bij inhoudelijke wijziging; oude versie `SUPERSEDED` |
| Session package | `inside-close-v1` blijft package-versie; koppelt aan Standard@versie |
| Review document | Mag `REV` datumstempel; wijzigt Standard-ID niet |

**Wet G3 — Version the content, not the identity**

> `PRESS-001@v2` vervangt inhoud; ID `PRESS-001` blijft de familie. Sessions pinnen expliciet `@v1` of `@v2`.

---

## 8. Deprecation-regels

| Actie | Toegestaan? | Hoe |
|-------|-------------|-----|
| ID hergebruiken voor ander onderwerp | **Nee** | — |
| ID hard delete uit geschiedenis | **Nee** | Rij blijft met status `SUPERSEDED` of `VOID` |
| Standard intrekken | Ja | Status `SUPERSEDED`; `superseded_by` verplicht |
| Decision heropenen | Ja | Nieuwe `OD-###`; oude blijft met link `reopened_as` |
| Typo in titel | Ja | Erratum; ID ongewijzigd |
| Verkeerde ID in documenttitel (incident Doc 11) | Ja | Alias/erratum pointer; **geen** inhoudelijke authoring-rewrite verplicht |

**Deprecation notice template:**

```text
DEPRECATED REF: "OD-01" as used in <path> for <wrong topic>
CANONICAL REF: PRESS-001
REASON: ID collision / governance incident
EFFECTIVE: <date Product Director signs>
```

---

## 9. Hoe toekomstige Golden Sessions deze registers gebruiken

```text
Patroonselectie
  → claim of create PRESS-### / POS-### / LANG-### (of hergebruik)
  → open OD-### voor elke nog niet goedgekeurde lock
  → Session Contract citeert Standard-IDs + open OD-IDs
  → Reviews citeren Standard-IDs (niet “OD-01 betekent X in dit bestand”)
  → Product Director PASS op blocking ODs
  → Implementation prompt mag starten
  → Gates valideren tegen gepinde Standard@versie
```

**Schaalregels**

- Elke nieuwe Decision Session **moet** minstens één `SESS`/`SIT` ID en nul-of-meer Standard-IDs citeren.
- Geen session mag een lokale “OD-01” introduceren zonder registeruitgifte.
- Spiegelvarianten (bijv. linkerflank) hergebruiken Idealiter dezelfde `PRESS-###` met side-parameter of `PRESS-###@v1-mirror` — te beslissen via nieuwe OD, niet via hernummering.
- Honderden sessions = groei in Standards + ODs; niet groei in conflicterende lokale nummers.

---

## 10. Migratieplan (bestaande documenten consistent zonder inhoudelijke wijziging)

**Doel:** conflict oplossen **zonder** teksten in `01`–`10` of voetbalinhoud in `11` te herschrijven.

### Stap A — Register bevriezen (dit document na PASS)

Product Director keurt `GBR-v1.0` goed en bevestigt de ID-tabel in §5.3.

### Stap B — Erratum-pointerbestand (nieuw, minimaal)

Maak later (na PASS op dit governance-doc) één nieuw pointerbestand, bijvoorbeeld:

`platform/docs/football-decision-lab/governance/errata/id-collision-od01-2026-07.md`

Inhoud alleen:

- Doc 09/10 `OD-01` … `OD-10` → canoniek `OD-001` … `OD-010` (zelfde onderwerpen);
- Doc 11 titel/gebruik “OD-01 Canonieke Pressingstandaard” → canoniek **`PRESS-001`**;
- Review-uitkomst voor pressingstandaard hangt aan `PRESS-001` + eventuele blocking ODs (`OD-001`…`OD-010` waar relevant).

**Geen** verplicht herschrijven van Doc 09/10/11 bodies.

### Stap C — Citation discipline voortaan

- Nieuwe documenten gebruiken alleen `OD-001`-stijl en Standard-prefixes.
- Bestaande “OD-01” strings in oude docs blijven historisch; erratum is leidend bij conflict.

### Stap D — Optionele cosmetische rename (niet verplicht, geen inhoud)

Alleen bestandsnaam/alias van Doc 11 mag later wijzen naar `PRESS-001` indien Product Director dat wil; **inhoud blijft**; dit is geen authoring-wijziging van football.

### Stap E — Checklist migratie done

| Check | Done when |
|-------|-----------|
| Register PASS | Product Director signed |
| OD-001 = cue decision | Bevestigd |
| PRESS-001 = canonical pressing standard | Bevestigd |
| Doc 11 niet meer gelezen als herdefinitie van OD-01 | Erratum live |
| Geen document wijzigt football/authoring body | Bevestigd |

---

## 11. Minimale register-skeleton (leeg voor invulling na PASS)

### 11.1 Product Decisions (seed)

| ID | Title | Status |
|----|-------|--------|
| OD-001 | Register coach cue “Binnenkant dicht” | AWAITING_PRODUCT_DIRECTOR |
| OD-002 | How to present our shape on screen | AWAITING_PRODUCT_DIRECTOR |
| OD-003 | Opponent formation lock | AWAITING_PRODUCT_DIRECTOR |
| OD-004 | Exact LB body angle at freeze | AWAITING_PRODUCT_DIRECTOR |
| OD-005 | RW start distance / height | AWAITING_PRODUCT_DIRECTOR |
| OD-006 | Exact trigger passer / foot | AWAITING_PRODUCT_DIRECTOR |
| OD-007 | Decision interaction modality for v1 | AWAITING_PRODUCT_DIRECTOR |
| OD-008 | Relationship to existing PRESS V2 code assets | AWAITING_PRODUCT_DIRECTOR |
| OD-009 | Prerequisite session before Golden | AWAITING_PRODUCT_DIRECTOR |
| OD-010 | Formal supersession Academy Architecture Freeze IA (Decision Lab scope) | AWAITING_PRODUCT_DIRECTOR |

### 11.2 Standards (seed)

| ID | Title | Status | Related ODs |
|----|-------|--------|-------------|
| PRESS-001 | Canonical pressing standard (Golden flank-back receive / inside-close) | AWAITING_PRODUCT_DIRECTOR (via Doc 11 review) | OD-002…OD-006, OD-008; LANG via OD-001 |
| LANG-001 | Cue “Binnenkant dicht” | AWAITING OD-001 | OD-001 |
| POS-001 | Positioning lock `DEF-HIGH-RIGHTWING-01` | DRAFT pending OD locks | OD-002, OD-003, OD-005 |
| ANIM-001 | Golden T0–T7 + ball/press motion | DRAFT | OD-004, OD-005, OD-006 |
| RECALL-001 | Micro recall R1 faster pass | DRAFT | — |

---

## 12. Product Director Decision (op dit governance-document)

| Veld | |
|------|--|
| Approve GBR-v1.0 namespace & immutability laws? | |
| Approve §5.3 ID migration mapping? | |
| Authorize erratum pointer (Stap B) after PASS? | |

Status:
AWAITING PRODUCT DIRECTOR DECISION

---

```text
GOVERNANCE REGISTER:
READY FOR PRODUCT DIRECTOR REVIEW
```
