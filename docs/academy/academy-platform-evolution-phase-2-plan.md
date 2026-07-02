# Academy Platform Evolution — Phase 2 Ontwikkelplan

**ZVV Zaandijk VRZ1 — Football Academy**  
**Status:** Definitief ontwikkelplan · Phase 2  
**Datum:** 2026  
**Scope:** PB01–PB34 als contentbasis · **geen** nieuwe voetbaltheorie · **geen** code in dit document

> **Missie:** Van encyclopedie naar het beste voetbal-leerplatform voor amateurvoetbal.  
> **Kernvraag:** Draagt elke scherm, elke flow, elke klik bij aan **zaterdag beter voetballen**?

---

## Executive Summary

PB01–PB34 vormen een **complete tactische basis**. Phase 2 bouwt daarop een **drie-momenten platform**:

| Moment | Doel | Primair scherm |
|--------|------|----------------|
| **Thuis** | Leren · begrijpen · onthouden | Positie-dashboard + 2-min laag |
| **Training** | Voorbereiden · oefenen | Trainer-flow + oefening-koppeling |
| **Wedstrijd** | Activeren · toepassen | Wedstrijddag-modus + 20-sec |

**Content-lagen (verplicht voor elke PB):**

```
20 seconden  →  activeren (niet leren)
2 minuten    →  onthouden (fouten · afspraken · gedragingen)
Volledig     →  begrijpen (bestaande PB-markdown)
```

**Navigatie:** positie · situatie · probleem · **nooit** PB-nummer als primaire ingang.

**PB35:** **Persoonlijke Academy** (hybride kompas + dashboard + seizoen) — **geen** 35e tactische les.

---

# 1. Nieuwe informatiearchitectuur

## 1.1 Topniveau (4 poorten)

```
ACADEMY
├── 🏠 HOME                    → orientatie · vandaag · 10-sec start
├── 👤 MIJN POSITIE            → dashboard per positie (11)
├── ⚽ SITUATIE                 → 6 wedstrijdmomenten + sub-situaties
├── 🔥 WEDSTRIJDDAG            → vóór · rust · na
├── ❓ MIJN PROBLEEM           → probleem → PB + 20 sec
├── 📈 MIJN SEIZOEN            → voortgang · reflecties · PB35
└── 🎓 TRAINER / CAPTAIN       → rol-specifieke modi (aparte ingang)
```

## 1.2 Content-objecten (niet PB-nummer)

| Object | Bron | Uniek ID-voorbeeld |
|--------|------|-------------------|
| **Moment** | ACE S1–S6 | `moment.bal-bezit` |
| **Situatie** | PB x.0 + sub | `situatie.opbouwen-achter` |
| **Probleem** | 8 fragmenten + audit | `probleem.te-snel-wegspelen` |
| **Positie** | 4-2-3-1 | `pos.lb` |
| **PB** | PB01–34 | `pb.27` *(secundair)* |
| **Visual** | T## specs | `visual.t294` |
| **20-sec kaart** | Nieuw template | `card.20s.pb27.lb` |
| **2-min kaart** | Nieuw template | `card.2m.pb27.lb` |
| **Oefening** | Nieuw (1 per PB) | `oef.pb27` |
| **Reflectie** | Nieuw template | `reflect.post-match` |

## 1.3 Drie content-lagen (metadata per PB)

Elke PB krijgt **retrofit** (geen herschrijving theorie):

| Laag | Woorden max | Doel | Velden |
|------|-------------|------|--------|
| **L1 — 20 sec** | ~40 | Activeren | 4 zinnen · 1 trigger · 1 roep |
| **L2 — 2 min** | ~200 | Onthouden | 3 fouten · 3 afspraken · 3 gedragingen |
| **L3 — Volledig** | Bestaand | Begrijpen | Huidige markdown PB |

**Positie-variant:** L1 en L2 zijn **per positie** (11 varianten). L3 deelt kern · positie-sectie blijft §8.

## 1.4 Wat verdwijnt uit speelster-view

- Eindcertificering · zelfreview scores
- WPE appendix
- YAML metadata
- Volledige 11-positiesectie (default hidden)
- Curriculum Context (trainer-only)
- Bold-chop weergave → genormaliseerde L2/L3

## 1.5 Wat prominent wordt

- 20-sec kaart (above the fold)
- 1 anker-visual (minimumset)
- Eigen positie
- Wedstrijddag checklist
- Post-match reflectie (3 vragen)

---

# 2. Nieuwe gebruikersflow

## 2.1 Eerste bezoek (onboarding ≤ 60 sec)

```
1. "Welke positie speel jij meestal?"     → opslaan profiel
2. "Hoeveel ervaring?"                    → 4e klas default
3. "Waar loop je tegenaan?" (max 2)      → probleem-tags
4. → Positie-dashboard
```

## 2.2 Terugkerend — thuis (leren)

```
Home → Mijn Positie → Deze week (ACE-volgorde) →
  Visual → 20 sec → [2 min] → [Volledig]
→ Oefening voor training (1 link)
```

## 2.3 Training (voorbereiden)

```
Trainer deelt "Deze week: PB27" →
Speelster opent 2-min + oefening →
Captain krijgt 60-sec briefing
```

## 2.4 Wedstrijd (toepassen)

```
Wedstrijddag-modus → Checklist (3) → 20-sec kaart →
[Optioneel: situatie snel opzoeken]
→ Na wedstrijd: reflectie (3 vragen)
```

## 2.5 10-seconden-regel (home)

**Binnen 10 sec na openen app:**

```
┌─────────────────────────────────────┐
│  Hoi [Naam] · Linksback             │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │VANDAAG  │ │MIJN     │ │SITUATIE│ │
│  │Wedstrijd│ │POSITIE  │ │        │ │
│  └─────────┘ └─────────┘ └────────┘ │
│  Deze week: Eerste pass na winst    │
└─────────────────────────────────────┘
```

Drie grote knoppen · positie zichtbaar · **geen** PB-nummer · **geen** scroll.

---

# 3. Nieuw Academy-platform (concept)

## 3.1 Platform-principes

1. **Visual-first** — beeld vóór tekst waar gedrag verandert
2. **Positie-first** — filter persistent
3. **Moment-first** — situatie vóór encyclopedie
4. **Drie lagen** — 20s → 2m → volledig
5. **Cyclus gesloten** — wedstrijd → reflectie → training → wedstrijd
6. **Mobiel-first** — 1 beslissing per scherm
7. **Geen theorie toevoegen** — alleen PB01–34 herstructureren

## 3.2 Schermtypes

| Scherm | Wanneer |
|--------|---------|
| **Kaart 20s** | Wedstrijd · bank · kleedkamer |
| **Kaart 2m** | Thuis · voor training |
| **Visual viewer** | Herkenning · timing |
| **Situatie-hub** | "Wat gebeurt er?" |
| **Probleem-fix** | "Ik verlies positie" |
| **Reflectie** | Na wedstrijd |
| **Weekplan** | Trainer |

---

# 4. Nieuwe navigatie

## 4.1 Primaire navigatie (bottom bar mobiel)

```
[ Home ] [ Positie ] [ Situatie ] [ Wedstrijd ] [ Seizoen ]
```

Trainer/Captain: toggle in profiel → extra tab **Team**.

## 4.2 Situatie-navigator (6 poorten ACE)

| Poort | Sub-navigatie | Anker-PB | Alle PB's |
|-------|---------------|----------|-----------|
| **Wij hebben bal** | Opbouwen · Tussen linies · Breed/diep · Halfspace · Dreigen · Onder druk | PB06 | PB06–13 |
| **Wij verliezen bal** | Compact · Pressing · Flank · Centrum · Achterin | PB14 | PB14–19 |
| **Tegenstander heeft bal** | Blok · Midblock · Laag · Hoog press · Tussen linies · Duels | PB20 | PB20–25 |
| **Wij winnen bal** | Moment · Eerste pass · Counter · Bezit hervatten | PB26 | PB26–29 |
| **Standaards** | Voorbereiden · Corner · Ingooi/aftrap | PB30 | PB30–32 |
| **Wedstrijd lezen** | Linies samen · 90 minuten | PB33 | PB33–34 |

**Flow per poort:**

```
Poort → Sub-situatie → [Positie filter actief] →
  Visual → 20s → 2m → Volledig PB
```

## 4.3 Probleem-navigator (4e-klas taal)

| Probleem | Situatie | PB-koppeling | 20-sec focus |
|----------|----------|--------------|--------------|
| Ik speel te snel weg | Wij hebben bal / winnen bal | PB27, PB05 | "Scan · eerste pass · niet blind" |
| Ik verlies mijn positie | Zij hebben bal | PB20–21, PB33 | "Schuif mee · niet alleen" |
| Ik weet niet wanneer uitstappen | Duels / verdedigen | PB25, PB24 | "Vertragen · buiten sturen" |
| Ik word uitgespeeld | Tussen linies | PB24, PB08 | "Dicht · passlijn · rug" |
| Iedereen rent naar bal | Standaard / ingooi | PB32, PB33 | "Gespreid · max 2 bij bal" |
| Ik twijfel aan de bal | Beslissen / druk | PB05, PB13 | "3 sec · terug is oké" |
| Ik heb moeite met druk zetten | Pressing | PB23, PB16 | "Trigger · samen · niet solo" |
| Counters tegen | Balverlies / counter | PB18, PB28, PB19 | "Rest · compact · 5 sec" |
| Ik praat te weinig | Algemeen | PB30, PB33 | "Roep · bevestig · ketting" |
| Na tegengoal paniek | Wedstrijd lezen | PB34 | "Fase · reset · geduld" |

**Ingang:** Home → "Waar loop je tegenaan?" → probleem-tag → kaart + PB.

## 4.4 Positie als filter (overal actief)

Header toont altijd: **`LB · Linksback`** (tap = wisselen).  
Alle content gefilterd op positie-variant L1/L2.

---

# 5. Positie-dashboard (11× identieke structuur)

## 5.1 Dashboard-layout (mobiel, 1 scherm scroll)

```
┌─ MIJN POSITIE: LINKSBACK ─────────────────┐
│ ■ Vandaag belangrijk          [Wedstrijd →]│
│   □ Breed blijven vóór trap                │
│   □ Schuif met lijn · niet solo            │
│   □ Roep: "Schuif!" / "Terug!"             │
│   [20 sec kaart]  [Visual overlap]         │
├─ Mijn taken (altijd) ─────────────────────│
│   1. Schuif vroeg met team                 │
│   2. Help L6 · niet crowd ingooi           │
│   3. Overlap na balwinst                     │
├─ Mijn leerpunten (uit reflectie) ──────────│
│   ⚠ Te snel vooruit min 70 (PB34)          │
│   → Deze week: fase lezen                   │
├─ Deze week Academy ────────────────────────│
│   PB27 · Eerste pass · [2 min] [Volledig]  │
│   Oefening: rondje eerste pass (trainer)    │
├─ Snel naar situatie ───────────────────────│
│   [Bezit] [Verlies] [Verdedigen] [Winst]   │
├─ Laatst bekeken ───────────────────────────│
│   PB33 Linies · PB32 Ingooi                │
├─ Academy voortgang ────────────────────────│
│   S4 ████████░░ 80% · S5 ░░░░░ 0%          │
│   22/34 PB's · 12 reflecties               │
└────────────────────────────────────────────┘
```

## 5.2 Per positie — vaste “Mijn taken” (anker, uit PB01–34)

| Positie | Altijd zichtbaar (3 taken) | Kern-PB's |
|---------|---------------------------|-----------|
| **Keeper** | Organiseer · roep · rest/terug | PB07, PB19, PB30, PB33 |
| **LCV** | Schuif · diepte · open/terug | PB07, PB20, PB33 |
| **RCV** | Anker · rest · schuif | PB19, PB20, PB33 |
| **LB** | Schuif · overlap · help L6 | PB07, PB17, PB32, PB33 |
| **RB** | Spiegel LB · breed/compact | PB17, PB33 |
| **L6** | Lijm · omschakeling · tempo | PB08, PB26, PB33 |
| **R6** | Balance · dek 10 · schuif | PB08, PB33 |
| **10** | Hub · risico/rust · verbind | PB08, PB27, PB34 |
| **LW** | Compact terug · diepte | PB09, PB28, PB33 |
| **RW** | Spiegel LW · momentum | PB09, PB33, PB34 |
| **Spits** | Diepte · druk/spaar · compact | PB11, PB25, PB34 |

## 5.3 “Vandaag belangrijk” — logica

| Trigger | Bron |
|---------|------|
| Trainer weekfocus | Trainer dashboard |
| Laatste reflectie | Post-match |
| Aankomende wedstrijd | Calendar |
| ACE weekplan | Automatisch 1 PB/week |

---

# 6. Wedstrijddag-flow

## 6.1 Vóór wedstrijd (speelster · ≤2 min)

```
WEDSTRIJDDAG — VÓÓR
├── Checklist (3 vinkjes, positie-specifiek)
├── 20-sec kaart (4 zinnen + 1 roep)
├── 1 visual (anker voor deze week)
├── [Optioneel] 2-min refresh
└── "Klaar" → sluit app · mentaal klaar
```

**Captain extra tab:**
- 60-sec team briefing (uit huidige week-PB)
- 3 teamafspraken
- Wie roept wat (comm-ketting verkort)

**Trainer extra tab:**
- Team focus vandaag (3 punten)
- Observeer: TPL-punten 1–3 deze week
- Wissel-instructie indien van toepassing

## 6.2 Rust (≤90 sec)

```
WEDSTRIJDDAG — RUST
├── Stand + fase (PB34): "Waar zit de wedstrijd?"
├── 1 fix eerste helft (uit reflectie captain)
├── 20-sec aanpassing (max 2 nieuwe punten)
└── Captain: rust-briefing (30 sec script)
```

## 6.3 Na wedstrijd (≤3 min)

```
WEDSTRIJDDAG — NA
├── Reflectie (3 vragen):
│   1. Welk moment herken je uit de Academy?
│   2. Wat deed je goed? (1 ding)
│   3. Wat fix je volgende week? (1 ding)
├── Auto-suggestie PB (op basis antwoord 1+3)
├── Opslaan → leerpunten op dashboard
└── Trainer: team-evaluatie (5 min template)
```

---

# 7. 20-seconden standaard (L1 template)

**Doel:** activeren · niet leren. **Max ~40 woorden.**

```markdown
## [PB-titel] · [Positie] · 20 sec

**Vandaag:** [1 zin situatie-trigger]

1. [Werkwoord + wat · observeerbaar]
2. [Werkwoord + wat]
3. [Werkwoord + wat]

**Roep:** "[1 woord/zin]"

**Niet:** [1 fout in 3 woorden]
```

**Voorbeeld PB27 · LB:**

> **Vandaag:** Na balwinst — eerste pass snel.  
> 1. Open · scan vóór touch.  
> 2. Speel 10 or diepte · niet blind.  
> 3. Rest in hoofd · overlap als 10 speelt.  
> **Roep:** "Uit!"  
> **Niet:** direct lang zonder kijken.

**Regels:**
- Geen "waarom"-ketens
- Geen jargon zonder uitleg in 2-min laag
- 1 trigger-woord (fluit / balwinst / corner / etc.)

---

# 8. 2-minuten standaard (L2 template)

**Doel:** onthouden vóór training. **Max ~200 woorden.**

```markdown
## [PB-titel] · [Positie] · 2 min

### 3 fouten (zaterdag)
1. …
2. …
3. …

### 3 afspraken (team)
1. …
2. …
3. …

### 3 gedragingen (jij)
1. …
2. …
3. …

**Oefening op training:** [1 zin · link trainer]
**Volledige uitleg →** [knop]
```

**Geen uitleg.** Alleen bullets. Genormaliseerde taal (geen bold-chop).

---

# 9. Drie lagen — toepasbaarheid PB01–34

| PB-range | L1 20s | L2 2m | L3 volledig | Opmerking |
|----------|--------|-------|-------------|-----------|
| PB01–05 | ✅ meta-triggers | ✅ scan/principes | ✅ bestaand | Meta = seizoen-start |
| PB06–12 | ✅ per positie | ✅ | ✅ | Retrofit lite |
| PB13–34 | ✅ per positie | ✅ | ✅ | Prioriteit retrofit |

**Niet elke PB elke week.** ACE-volgorde = 1 PB/week = ~34 weken ≈ 1 seizoen.

**Uitzondering:** PB33–34 = **seizoens-eind** + herhalingsweken · geen 11-weken dump.

---

# 10. Visual-first ontwerp

## 10.1 Nieuwe volgorde per content-blok

```
VISUAL (anker)
    ↓
20 sec (activeren)
    ↓
Korte uitleg (2–3 zinnen Praatje)
    ↓
Wedstrijdvoorbeeld (fragment uit masterfilm)
    ↓
Toepassen (checklist + roep)
    ↓
[2 min] → [Volledig]
```

## 10.2 Render-prioriteit (12 anker-visuals — geen 437)

| # | Visual-type | PB | Waarom |
|---|-------------|-----|--------|
| 1 | 4-2-3-1 adem | PB02 | Fundament |
| 2 | Blok schuiven | PB20 | Verdedigen basis |
| 3 | Omschakeling min 52 | PB26 | S4 anker |
| 4 | Eerste pass ketting | PB27 | Meest toegepast |
| 5 | Counter timer | PB28 | Timing |
| 6 | Corner organisatie | PB30 | Standaard |
| 7 | Corner loops | PB31 | Waarom bewegen |
| 8 | Ingooi gespreid | PB32 | Amateurfout #1 |
| 9 | Elastiek 3 linies | PB33 | Integratie |
| 10 | Momentum 90 min | PB34 | Wedstrijd lezen |
| 11 | Goed vs fout (template) | PB20 | Patroonherkenning |
| 12 | Positie-highlight veld | Platform | 11 kleuren |

## 10.3 Visual-weergave regels

- Animatie waar **tijd** telt (0–10 sec)
- Statisch waar **positie** telt (4-2-3-1)
- Split-screen waar **contrast** telt (goed/fout)
- **Altijd** positie-gehighlight (eigen kleur)

---

# 11. Wedstrijdsituaties-ingang (apart van PB-lijst)

**Menu: SITUATIES** (20+ herkenbare momenten)

| Situatie | Poort | PB | Visual |
|----------|-------|-----|--------|
| Keeper bouwt op | Bezit | PB07 | T opbouw |
| Wij verliezen bal | Verlies | PB14 | T compact |
| Corner voor ons | Standaard | PB31 | T corner |
| Corner tegen | Verdedigen | PB22 | T laag blok |
| Counter | Winst | PB28 | T counter |
| Hoog druk zetten | Verdedigen | PB23 | T press |
| Bal tussen linies | Verdedigen | PB24 | T tussen |
| 1-tegen-1 | Duels | PB25 | T duel |
| Tweede bal | Standaard/duel | PB30 | T tweede |
| Ingooi | Standaard | PB32 | T ingooi |
| Aftrap | Standaard | PB32 | T aftrap |
| Wedstrijd uitspelen | Lezen | PB34 | T fase |
| Achterstand | Lezen | PB34 | T rust |
| Voorsprong beschermen | Lezen | PB34 | T bezit |
| … | … | … | … |

**Flow:** Situatie → Visual → 20s → Positie-filter → [dieper]

---

# 12. Trainer-flow

## 12.1 Trainer dashboard

```
TRAINER
├── Deze week
│   ├── PB van de week (ACE-auto)
│   ├── 3 TPL observeerpunten
│   ├── Oefening (1 · uit template)
│   └── Push naar team: "Deze week focus"
├── Deze training
│   ├── Warm-up koppeling (optioneel)
│   ├── Hoofdoefening ↔ PB
│   └── Partij focus (1 zin)
├── Aandachtspunten
│   ├── Per linie (ver/mid/aan)
│   └── Per speler (optioneel · max 3)
├── Observaties (live/training)
│   ├── TPL checklist vinkjes
│   └── Notities
├── Evaluatie
│   ├── Na wedstrijd team (5 min)
│   ├── Koppel reflecties spelers
│   └── Volgende week aanpassing
└── Academy koppeling
    ├── Welke PB's dit seizoen
    ├── Welke fragmenten besproken
    └── Voortgang team %
```

## 12.2 Trainer weekritme

| Dag | Actie |
|-----|-------|
| Maandag | PB 2-min bespreken · oefening |
| Woensdag | Herhaling · fragment uit wedstrijd |
| Vrijdag | Wedstrijddag briefing · 3 teampunten |
| Zaterdag | Observeer TPL · notities |
| Zondag | Evaluatie · reflecties lezen · weekplan |

**Trainer vertaalt niet meer** — platform levert weekplan + oefening + observeerpunten.

---

# 13. Captain-flow

## 13.1 Captain modus

```
CAPTAIN
├── Teamafspraken (3 · deze week)
├── 60 sec briefing (script · uit week-PB)
├── Coachingwoorden (roep-lijst)
├── Rustpunten (template PB34 fase)
├── Herinneringen (veld · max 5)
└── Help teammate → link 20s kaart positie
```

## 13.2 Captain Weekly Card (print/QR)

```
Week [N] · PB[XX]: [Titel]
─────────────────────────
TEAM (3):
1. …
2. …
3. …

ROEP (3):
"…" · "…" · "…"

60 SEC:
"[script]"

RUST:
"[1 fix indien nodig]"
```

---

# 14. Leerlus (gesloten)

```
┌─────────────┐
│  THUIS      │  2-min + visual · begrijpen
│  (L2 + L3)  │
└──────┬──────┘
       ↓
┌─────────────┐
│  TRAINING   │  Oefening · captain briefing
└──────┬──────┘
       ↓
┌─────────────┐
│  WEDSTRIJD  │  20-sec · checklist · toepassen
│  (L1)       │
└──────┬──────┘
       ↓
┌─────────────┐
│  REFLECTIE  │  3 vragen · leerpunt → dashboard
└──────┬──────┘
       ↓
┌─────────────┐
│  TRAINER    │  Evaluatie · volgende week PB
│  EVALUATIE  │
└──────┬──────┘
       ↓
     (herhaal)
```

**Systeemregels:**
- Reflectie **verplicht** na wedstrijd (soft gate · skip na 1× reminder)
- Leerpunt verschijnt op dashboard
- Trainer ziet aggregate (anoniem per speler optioneel)
- ACE volgende PB **pas na** week evaluatie (trainer unlock)

---

# 15. PB35 — Definitief advies

## 15.1 Opties beoordeeld

| Optie | Score | Reden |
|-------|-------|-------|
| Persoonlijk wedstrijdkompas | 9/10 | Afsluiting · persoonlijk |
| Mijn Positie | 8/10 | Dagelijks nut · geen afsluiting |
| Mijn Dashboard | 8/10 | = Mijn Positie in platform |
| Mijn wedstrijddag | 9/10 | Product-modus · geen PB |
| Mijn seizoen | 8/10 | Voortgang · motivatie |
| Persoonlijke Academy | **10/10** | **Combineert alles** |
| Traditioneel PB35 | 1/10 | Overload · afgewezen |

## 15.2 Gekozen oplossing: **Persoonlijle Academy**

PB35 wordt **één kort document (~2.000 wo)** + **platform-scherm "Mijn Seizoen"**:

**Inhoud PB35 markdown:**
1. Jouw positie in het 4-2-3-1 (1 visual)
2. Jouw 8–12 essentiële PB's (tabel positie → PB)
3. Jouw seizoen in 4 fases (O · S1–S5 · S6)
4. Jouw cyclus (diagram leerlus)
5. Jouw 20 sec voor altijd (4 zinnen positie)
6. Waar je hulp vindt (navigator · probleem · wedstrijd)

**Platform "Mijn Seizoen":**
- Voortgang %
- Reflectie-historie
- Leerpunten timeline
- "Jij bent klaar voor zaterdag" badge

**Geen:** eindtoets · geen 11 posities · geen nieuwe tactiek.

---

# 16. Roadmap — Van boek naar wereldklasse platform

## Fase 0 — Stop & standaardiseren (week 1–2)

| # | Deliverable | Owner |
|---|-------------|-------|
| 0.1 | L1/L2 templates goedgekeurd | Didacticus |
| 0.2 | IA + navigatie definitief (dit document) | IA/UX |
| 0.3 | 12-visual renderlijst | Visual |
| 0.4 | Probleem-navigator mapping (§4.3) | Content |

## Fase 1 — Content retrofit (week 3–8)

| # | Deliverable | Scope |
|---|-------------|-------|
| 1.1 | L1 20s × 11 pos × prioriteit PB26–34, PB20, PB30 | 8 PB's eerst |
| 1.2 | L2 2m × 11 pos · zelfde prioriteit | Parallel |
| 1.3 | 1 oefening-regel per PB (trainer) | PB06–34 |
| 1.4 | Bold-normaliseer L3 weergave | PB20–34 |
| 1.5 | PB35 Persoonlijke Academy markdown | 1 doc |

**Niet:** volledige 34×11 L1 in week 1 — **golf per ACE-fase**.

## Fase 2 — Platform MVP (week 6–14) *[implementatie later]*

| # | Feature |
|---|---------|
| 2.1 | Home 10-sec · positie onboarding |
| 2.2 | Positie-dashboard |
| 2.3 | Situatie-navigator 6 poorten |
| 2.4 | Wedstrijddag-modus vóór/na |
| 2.5 | L1/L2/L3 weergave |
| 2.6 | 12 anker-visuals |
| 2.7 | Reflectie 3 vragen |

## Fase 3 — Team (week 12–18)

| # | Feature |
|---|---------|
| 3.1 | Trainer dashboard |
| 3.2 | Captain modus + weekly card |
| 3.3 | Probleem-navigator |
| 3.4 | Situaties-ingang 20+ |

## Fase 4 — Seizoen (week 16–24)

| # | Feature |
|---|---------|
| 4.1 | Mijn Seizoen (PB35 platform) |
| 4.2 | Voortgang · badges |
| 4.3 | Volledige L1/L2 retrofit PB01–34 |
| 4.4 | Quiz/patroonherkenning (8 fragmenten) |

## Fase 5 — Optimaliseren (post-live)

- Analytics · A/B 20s formuleringen
- Uitbreiding visual library
- PB06–12 L3 lite-cards

---

## Livegang-criteria VRZ1

| Criterium | Fase |
|-----------|------|
| Positie-dashboard + L1 voor week-PB | Fase 2 |
| Wedstrijddag vóór/na + reflectie | Fase 2 |
| 12 visuals rendered | Fase 2 |
| Trainer weekplan | Fase 3 |
| Situatie-navigator 6 poorten | Fase 2 |
| PB35 + Mijn Seizoen | Fase 4 |

**Soft launch:** einde Fase 2 · **Volledig seizoen:** Fase 4.

---

## Succesmeting (seizoen)

| Metric | Target |
|--------|--------|
| % speelsters opent wedstrijddag vóór match | >70% |
| Reflecties na wedstrijd | >60% |
| Trainer TPL punten verbetering (4 weken) | 7/10 zichtbaar |
| Tijd tot 20-sec kaart | <10 sec |
| Speelster: "Ik weet wat ik vandaag moet doen" | >80% agree |

---

**Einddoel Phase 2:**  
De speelster zegt niet *"Ik heb PB27 gelezen"* maar *"Ik wist vandaag wat ik moest doen — en na de wedstrijd weet ik wat ik fix."*

Dat is wereldklasse amateurvoetbal leren.
