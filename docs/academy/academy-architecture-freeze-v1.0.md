# Academy Architecture Freeze — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Status:** ⚠️ **SUPERSEDED** — zie `academy-architecture-freeze-v1.1.md`  
**Was:** 🔒 ARCHITECTUUR BEVROREN · Phase 2.1  
**Supersedes:** Phase 2 plan (ontwikkelplan blijft geldig als detail)  
**Scope:** Productarchitectuur · geen code · geen retrofit · geen nieuwe voetbaltheorie

> **Regel:** Na v1.0 freeze — **geen fundamentele wijzigingen** zonder Architecture Change Request (ACR) + panel review.  
> **Doel:** Honderden uren L1/L2/dashboard/website investeren **zonder** basis herontwerp.

---

## Freeze Governance

| Item | Regel |
|------|-------|
| **Versie** | `ACADEMY-ARCH-v1.0` |
| **Wijzigingen** | Alleen via ACR (motivatie · impact · migratie) |
| **Content** | PB01–34 L3 markdown = **bron**, niet UI-structuur |
| **Nieuwe theorie** | Verboden zonder ACE-amendement |
| **Retrofit** | Alleen L0–L4 metadata + templates op bestaande PB |

---

# 1. Definitieve Productarchitectuur

## 1.1 Kritische review Phase 2

Phase 2 was **80% correct**. Ontbrekend of onduidelijk:

| Phase 2 | Probleem | Freeze-oplossing |
|---------|----------|------------------|
| Geen zoekfunctie | 34 PB's + 20 situaties = doodlopend zonder search | **Globale zoekbalk** (altijd zichtbaar) |
| Geen favorieten | Herhaalde toegang tot week-PB / situatie | **Pin max 5** op dashboard |
| Laatst bekeken | Genoemd maar niet architecturaal | **Auto-widget** home + positie |
| Leerpad vs Seizoen | Dubbel | **Samengevoegd** in Mijn Seizoen |
| Trainer = Coach? | Onduidelijk | **5 rollen** gedefinieerd (§4) |
| Geen Apply-laag | 20s → 2m mist brug | **L-Apply** toegevoegd (§3) |
| Visual-first zonder trigger | Herkenning zwak | **L0 Trigger** toegevoegd (§3) |

**Verwijderd uit topnav (niet aparte poort):**
- ~~Aparte "Reflectie"~~ → onderdeel Wedstrijddag NA + Mijn Seizoen
- ~~Aparte "Favorieten"~~ → widget op Home + Positie
- ~~"Persoonlijk leerpad"~~ → merged in Mijn Seizoen

**Behouden en bevestigd:**
Home · Positie · Situatie · Probleem · Wedstrijddag · Mijn Seizoen · Trainer · Captain · Staff · Admin

## 1.2 Definitieve IA (Information Architecture)

```
ACADEMY PLATFORM v1.0
│
├── 🔍 ZOEK (global overlay — elke pagina)
│
├── 🏠 HOME
│   ├── Vandaag (CTA wedstrijd / week-PB)
│   ├── Positie-badge (1 tap switch)
│   ├── 3 quick actions: [20 sec] [Visual] [Wedstrijd]
│   ├── Laatst bekeken (max 5)
│   └── Gepind (max 5)
│
├── 👤 MIJN POSITIE (dashboard — §4)
│
├── ⚽ SITUATIE (6 ACE-poorten + sub — §5)
│
├── ❓ PROBLEEM (cross-cutting — §5.3)
│
├── 🔥 WEDSTRIJDDAG (vóór · rust · na — §6)
│
├── 📖 MIJN SEIZOEN (voortgang · leerpad · reflecties · PB35 — §9)
│
├── 👥 TEAM (rol-switch)
│   ├── 🧢 CAPTAIN
│   ├── 📋 TRAINER
│   ├── 🤝 STAFF (assistent)
│   └── ⚙️ ADMIN
│
└── CONTENT ENGINE (achterliggend — nooit primaire nav)
    ├── PB01–34 (L3 bron)
    ├── L0–L4 metadata per PB × positie
    ├── Visual registry (T##)
    ├── Situation registry
    ├── Problem registry
    └── Exercise registry
```

## 1.3 Entiteiten (frozen schema)

| Entiteit | ID-pattern | Relaties |
|----------|------------|----------|
| User | `user.{id}` | positie · rol · team |
| Position | `pos.{keeper\|lcv\|…}` | 11 fixed |
| Playbook | `pb.{01-34}` | moment · situaties · problemen |
| ContentCard | `card.{L0-L4}.{pb}.{pos?}` | pb · visual |
| Moment | `moment.{s1-s6}` | ACE |
| Situation | `sit.{slug}` | moment · pb[] · tags[] |
| Problem | `prob.{slug}` | situation[] · pb[] |
| Visual | `vis.{t###}` | pb · type |
| Exercise | `ex.{pb}` | pb |
| Reflection | `ref.{user}.{match}` | pb? · prob? |
| WeekPlan | `week.{n}` | pb · team |

## 1.4 Wat NOOIT in primaire navigatie

- PB-nummer lijst
- ACE-fase lijst (alleen in Mijn Seizoen / Trainer)
- Certificering / scores
- WPE appendix
- YAML / metadata raw

---

# 2. Definitieve Navigatie

## 2.1 Navigatiemodel (mobiel)

**Persistent:**
- Header: `[Positie ▼]` · `[🔍]` · `[Wedstrijd 🔥]` (context-aware)
- Bottom bar (5): **Home · Positie · Situatie · Seizoen · Team**

**Wedstrijddag 🔥:** altijd bereikbaar vóór match-day (calendar-trigger) · anders in menu.

## 2.2 Five-second tests (must pass)

| Intentie | Pad | Sec |
|----------|-----|-----|
| "Ik ben linksback" | Open app → positie in header (onboarding) · tap Positie | **≤2** |
| "Wanneer uitstappen" | 🔍 "uitstappen" OF Probleem → "duel/uitstappen" → L1 | **≤5** |
| "Counters tegen" | Situatie → Wij verliezen bal → Counter OF Probleem → counters | **≤4** |
| "Wedstrijddag" | Tap 🔥 header OF bottom shortcut | **≤2** |
| "Alleen 20 sec" | Home quick [20 sec] OF content page toggle [L1] | **≤3** |
| "Alleen visual" | Home quick [Visual] OF content page [Visual only] | **≤3** |

## 2.3 Content page navigatie (binnen elke situatie/PB)

```
[Visual] [20 sec] [Apply] [2 min] [Volledig]  ← segmented control (sticky)
```

Default tab per context:
| Context | Default tab |
|---------|-------------|
| Wedstrijddag | L1 (20 sec) |
| Thuis / week | L2 (2 min) |
| Diep studeren | L3 (volledig) |
| Eerste kennismaking | Visual |

## 2.4 Zoekfunctie (frozen spec)

**Scope:** situaties · problemen · roepteksten · PB-titels (secundair) · geen full-text L3 initieel.

**Resultaat-types:**
1. Situatie → situatie-hub
2. Probleem → probleem-fix
3. PB → content page (L2 default)
4. Roep → L1 fragment

**Geen** PB-nummer in resultaat-titel — altijd menselijke titel.

---

# 3. Definitieve Contentstructuur

## 3.1 Kritische review Phase 2 stack

Phase 2: `Visual → 20s → 2m → Volledig`

**Probleem:** mist **herkenning** (wanneer?) en **toepassing** (checklist). 20s → 2m is te groot sprong op wedstrijddag.

## 3.2 Frozen stack: L0–L4 + Apply

```
L0  TRIGGER      "Wanneer zie je dit?"     · 1 zin · optioneel collapse
↓
L1  VISUAL       Herkenning                · 1 anker-beeld/animatie
↓
L2  ACTIVATE     20 seconden               · activeren · niet leren
↓
L3  APPLY        Toepassen                 · checklist 3 · roep · oefening-link
↓
L4  REMEMBER     2 minuten                 · 3+3+3 bullets
↓
L5  UNDERSTAND   Volledig (L3 markdown)    · bestaande PB · default collapsed mobile
```

**Hernoemen intern:** Phase 2 "L1/L2/L3" → freeze **L2/L4/L5** (Apply = L3). Retrofit docs gebruiken **L0–L5** consistent.

## 3.3 Onderbouwing per laag

| Laag | Blijft? | Waarom |
|------|---------|--------|
| **L0 Trigger** | ✅ NEW | WPE "herken" · zonder trigger geen context |
| **L1 Visual** | ✅ | WVLP · timing/ruimte ≠ tekst |
| **L2 20 sec** | ✅ | Wedstrijddag core |
| **L3 Apply** | ✅ NEW | Brug activeren → onthouden · checklist = gedrag |
| **L4 2 min** | ✅ | Training/thuis · onthouden zonder uitleg |
| **L5 Volledig** | ✅ | Begrijpen · **niet default mobile** |

**Verwijderd:** niets. **Toegevoegd:** L0 + L3 Apply.

## 3.4 Context-specifieke stacks (niet alles altijd tonen)

| Context | Stack |
|---------|-------|
| **Wedstrijddag vóór** | L2 + L3 Apply (+ L1 visual toggle) |
| **Wedstrijd rust** | L0 + L2 aanpassing |
| **Thuis week** | L1 → L4 → [L5] |
| **Training** | L4 + oefening |
| **Probleem-fix** | L0 → L1 → L2 |
| **Search result** | L2 default |

## 3.5 Positie-varianten

| Laag | Per positie? |
|------|--------------|
| L0 | Nee (situatie) · Ja (optioneel 1 regel positie) |
| L1 | Nee (visual dekt 22-speler highlight) |
| L2 | **Ja** (11 varianten) |
| L3 Apply | **Ja** (11 checklists) |
| L4 | **Ja** (11 varianten) |
| L5 | Gedeeld + §8 positie-sectie (bestaand) |

---

# 4. Definitieve Dashboardstructuur

## 4.1 Speelster (default)

**Eerste scherm = Positie-dashboard**

| # | Widget | Prioriteit | CTA |
|---|--------|------------|-----|
| 1 | **Vandaag** (wedstrijd ja/nee · week-PB) | P0 | → Wedstrijddag / L4 |
| 2 | **Quick: 20 sec · Visual · Wedstrijd** | P0 | direct |
| 3 | **L3 Apply checklist** (3 vinkjes vandaag) | P0 | toggle |
| 4 | **Mijn leerpunt** (uit laatste reflectie) | P1 | → probleem/PB |
| 5 | **Deze week** (ACE PB + voortgang) | P1 | → content |
| 6 | **Situatie shortcuts** (4 knoppen) | P1 | → situatie |
| 7 | **Gepind** (max 5) | P2 | → content |
| 8 | **Laatst bekeken** (max 5) | P2 | → content |
| 9 | **Voortgang** (fase %) | P2 | → Mijn Seizoen |

## 4.2 Captain (+ alles speelster)

**Eerste scherm = Team vandaag**

| Widget | CTA |
|--------|-----|
| 60 sec briefing (week-PB script) | Expand |
| 3 teamafspraken (trainer-sync) | Edit read-only |
| Roep-lijst (5) | Copy |
| Rust-notitie (indien live) | → Wedstrijd rust |
| Help teammate → positie 20 sec | → L2 |

## 4.3 Trainer (+ captain view read-only optioneel)

**Eerste scherm = Deze week**

| Widget | CTA |
|--------|-----|
| **Week PB** (ACE auto) | Push team |
| **3 TPL observeerpunten** | Edit |
| **Oefening** (1 regel + detail) | Share |
| **Team reflecties** (aggregate) | Review |
| **Voortgang team** (% PB's) | → Mijn Seizoen team |
| **Fragment bespreken** (uit 8) | → content L5 |
| **Wedstrijd evaluatie** (post) | Form |

## 4.4 Staff / Assistent-coach

**Eerste scherm = Observatie**

| Widget | CTA |
|--------|-----|
| TPL checklist (vink) | Live |
| Linie-focus (ver/mid/aan) | Toggle |
| Aandachtspunten spelers (max 3) | Note |
| Week PB link | Read |

## 4.5 Administrator

**Eerste scherm = Platform health**

| Widget | CTA |
|--------|-----|
| Actieve users / reflectie % | Analytics |
| Content completeness (L0–L5 per PB) | Retrofit status |
| Week plan override | ACE manual |
| Rol-toewijzing | User admin |
| ACR log | Governance |

**Coach = Trainer** in NL amateur context. Staff = assistent zonder weekplan-push.

---

# 5. Definitieve Situatiestructuur

## 5.1 Beslissing: hybride model (frozen)

**Primair: 6 ACE-momenten** (wedstrijdfase-logica · frozen)

**Secundair: tags** (cross-cutting · filter, geen aparte boom)

**Probleem-navigator: derde as** (symptoom → fix)

### Primair — 6 poorten (unchanged)

| Poort | ACE | Anker PB |
|-------|-----|----------|
| Wij hebben bal | S1 | PB06 |
| Wij verliezen bal | S2 | PB14 |
| Tegenstander heeft bal | S3 | PB20 |
| Wij winnen bal | S4 | PB26 |
| Standaards | S5 | PB30 |
| Wedstrijd lezen | S6 | PB33 |

### Tags (filter binnen situaties — niet top-nav)

`balbezit` · `verdedigen` · `omschakelen` · `standaards` · `wedstrijdmanagement` · `mentaal` · `communicatie` · `coachen`

### Waarom NIET alternatief als primair?

| Alternatief | Probleem |
|-------------|----------|
| Balbezit / Verdedigen / … | Overlap ACE · dubbele ingangen |
| Mentale situaties top-level | Te weinig content · beter als tag + PB34 |
| Communicatie top-level | Cross-cutting · geen eigen PB-reeks |

**Mentaal + communicatie:** tag + probleem-nav + PB34/PB30/PB33.

## 5.2 Situation Registry (frozen count)

**22 kern-situaties** (uit Phase 2 + audit) — elk mapped: moment + tags + pb + visual.

Geen uitbreiding zonder ACR.

## 5.3 Probleem-navigator (10 frozen)

Te snel wegspelen · Positie kwijt · Counters · Uitstappen twijfel · Iedereen naar bal · Te weinig comm · Paniek na goal · Druk zetten · Uitgespeeld · Achter bal aan.

---

# 6. Definitieve Leerflow

## 6.1 Frozen macro-flow

```
ONBOARDING (1×)
    ↓
┌───────────────────────────────────────────────────┐
│  WEEK CYclus (herhaalt 34× ≈ seizoen)              │
│                                                    │
│  Zondag/Ma: TRAINER → weekplan (PB + oefening)     │
│       ↓                                            │
│  Ma-Wo: THUIS → L4 (2 min) + L5 optioneel         │
│       ↓                                            │
│  Di/Do: TRAINING → oefening + captain 60 sec       │
│       ↓                                            │
│  Vr-Za: WEDSTRIJDVoor → L2 + L3 Apply             │
│       ↓                                            │
│  Za:    WEDSTRIJD (toepassen)                      │
│       ↓                                            │
│  Za:    REFLECTIE (3 vragen) → leerpunt             │
│       ↓                                            │
│  Zo:    TRAINER evaluatie → volgende week          │
└───────────────────────────────────────────────────┘
    ↓
MIJN SEIZOEN (voortgang · PB35 Mijn Speelboek unlock week 20+)
```

## 6.2 Toegevoegd t.o.v. Phase 2

- **Trainer weekplan push** (zondag/maandag) — start cyclus
- **Onboarding** — positie · problemen · rol

## 6.3 Verwijderd

- Lineair PB01→34 verplicht lezen
- Reflectie optioneel → **soft mandatory** (skip max 2×/seizoen)

## 6.4 Mist niets meer

| Check | Status |
|-------|--------|
| Thuis | ✅ |
| Training | ✅ |
| Wedstrijd | ✅ |
| Reflectie | ✅ |
| Nieuwe week | ✅ |
| Seizoen arc | ✅ Mijn Seizoen |
| Personalisatie | ✅ leerpunten |

---

# 7. Definitieve Retrofitstrategie

**Principe:** metadata-first · batch per laag · extract before write · nooit 34× handmatig volledig.

## 7.1 Pipeline (frozen order)

```
STAP 0 — Schema (1×)
  └── academy-content-schema.yaml (L0–L5 velden · IDs · relations)

STAP 1 — Registry (1×)
  ├── 22 situations
  ├── 10 problems
  ├── 6 moments
  └── 12 priority visuals mapped

STAP 2 — Extract (automated assist · 34 PB)
  ├── L2/L4 FROM existing "Zaterdag — wat jij anders doet" (max 3 → L2)
  ├── L4 bullets FROM §8 position "Fout/Beter" patterns
  ├── L0 FROM §1 "Herkenningspunt" / STOP triggers
  └── L3 Apply FROM "Als trainer verwacht ik zaterdag…"

STAP 3 — Human review wave (8 waves × ~4 PB)
  Wave 1: PB26–29 (S4)
  Wave 2: PB30–32 (S5)
  Wave 3: PB33–34 (S6)
  Wave 4: PB20–22 (S3 anker)
  Wave 5: PB14–16 (S2)
  Wave 6: PB06–08 (S1 anker)
  Wave 7: PB01–05 + PB23–25
  Wave 8: PB09–13 + PB17–19

STAP 4 — Link graph (automated)
  └── pb → moment · situation · problem · visual

STAP 5 — L1 Visual assign (12 ankers + per-PB minimumset ref)

STAP 6 — QA sample (2 posities × 1 PB per wave)

STAP 7 — Publish metadata (NOT rewrite L5 markdown)
```

## 7.2 Wat NIET per PB handmatig

- L5 rewrite
- 11 posities volledig herschrijven
- Nieuwe theorie
- Visual tekenen (batch design system)

## 7.3 Effort estimate (content only)

| Stap | Uren | Output |
|------|------|--------|
| 0–1 | 20 | Schema + registry |
| 2 Extract | 40 | 34 YAML sidecars |
| 3 Review 8 waves | 80 | L0–L4 approved |
| 4 Link | 16 | Graph |
| 5 Visual brief | 40 | Design handoff |
| **Totaal content retrofit** | **~196 uur** | vs ~800+ handmatig |

## 7.4 Sidecar pattern (frozen)

Elke PB krijgt **geen markdown rewrite** — `{pb-XX}-meta.yaml`:

```yaml
pb: 27
moment: [s4-winnen-bal]
situations: [eerste-pass-na-winst]
problems: [te-snel-wegspelen]
visual_primary: vis.t294
layers:
  L0: { shared: "..." }
  L2: { keeper: [...], lb: [...], ... }
  L3: { keeper: {checklist: [...]}, ... }
  L4: { keeper: {fouten: [], afspraken: [], gedragingen: []}, ... }
exercise: "Rondje eerste pass · 4 min"
```

L5 = bestaande `.md` ongewijzigd.

---

# 8. Definitief Advies PB35

## 8.1 Opties herbeoordeeld

| Naam | Score | Pro | Con |
|------|-------|-----|-----|
| **Mijn Speelboek** | **9.5** | Persoonlijk · onderscheidt van PB-library · memorabel | Risico PB-confusie (mitigeer: "Speelboek ≠ Playbook") |
| Persoonlijke Academy | 8 | Breed | Vaag · generiek |
| Mijn Dashboard | 6 | = Positie dashboard | Geen afsluiting |
| Mijn Seizoen | 8.5 | Progress · tijd | Geen persoonlijke synthese |
| Mijn Positie | 5 | Al platform-module | Duplicaat |
| Interactieve wedstrijddag | 8 | Product | Geen markdown artifact |

## 8.2 Frozen beslissing (split)

| Artifact | Naam | Vorm |
|----------|------|------|
| **Platform hub** | **Mijn Seizoen** | App module · voortgang · reflecties · timeline |
| **PB35 markdown** | **Mijn Speelboek** | ~2.000 wo · persoonlijke synthese · 8–12 PB's · cyclus · vaste 20 sec |
| **Geen** | 35e tactische les | Afgewezen |

**Tagline PB35:** *"Dit is jouw boek — gebouwd uit 34 playbooks, geschreven voor jouw positie."*

**Unlock:** week 20 seizoen OF trainer manual unlock.

---

# 9. Definitieve MVP

**Doel:** 16 speelsters · 1 volledig seizoen · valideren gedragsverandering.

## 9.1 MVP MUST (Fase C test VRZ1)

| # | Feature |
|---|---------|
| 1 | Onboarding (positie + 2 problemen) |
| 2 | Home + Positie-dashboard (widgets 1–6) |
| 3 | Wedstrijddag vóór + na (L2 + L3 + reflectie) |
| 4 | **Rolling L2/L4** — alleen huidige week-PB (niet alle 34) |
| 5 | 6 situatie-poorten → link L5 markdown web |
| 6 | 1 visual/week (12 anker rotation) |
| 7 | Trainer weekplan push (1 PB + oefening) |
| 8 | Captain 60 sec card |
| 9 | Zoek (situations + problems only) |
| 10 | Mijn Seizoen basic (voortgang % + reflectie log) |

## 9.2 MVP CAN WAIT (post-validatie)

| Feature | Fase |
|---------|------|
| Volledige L0–L4 alle 34 PB | D |
| Favorieten pin | D |
| Staff dashboard | E |
| Admin analytics | E |
| Quiz / patroonherkenning | E |
| Offline mode | E |
| PB35 Mijn Speelboek unlock | D (week 20) |
| Rust-modus live | D |
| Probleem-nav volledig 10 | D (start met 5) |

## 9.3 MVP success criteria (seizoen)

| Metric | Target |
|--------|--------|
| Wedstrijddag open rate vóór match | >60% |
| Reflectie completion | >50% |
| Trainer: "Team gedrag verbeterd" | >70% agree |
| Tijd naar L2 | <10 sec |
| Speelster NPS | >40 |

---

# 10. Definitieve Roadmap (product-first)

```
FASE A — ARCHITECTUUR FREEZE          ← NU (dit document)
  └── ACADEMY-ARCH-v1.0 locked

FASE B — CONTENT SCHEMA + REGISTRY
  └── Schema · 22 sit · 10 prob · sidecar template · 0 PB rewrite

FASE C — MVP PROTOTYPE (design + content wave 1)
  └── PB26–29 + PB33 L0–L4 · 12 visuals brief · UX prototype

FASE D — VRZ1 TEST SEIZOEN (soft launch)
  └── MVP MUST · rolling week content · feedback loop

FASE E — RETROFIT COMPLETE
  └── 8 waves · all 34 sidecars · visual library phase 1

FASE F — PLATFORM HARDENING
  └── Favorieten · full search · admin · offline · quiz

FASE G — LIVE + PB35
  └── Mijn Speelboek · Mijn Seizoen full · scale

FASE H — OPTIMIZE (year 2)
  └── Analytics · A/B · content trim based on data
```

**Geen parallel:** B must finish before C. C before D. D validates before E full retrofit.

---

# 11. Eindconclusie

## Is de Academy architectisch bevroren?

### ✅ JA — met `ACADEMY-ARCH-v1.0`

**Bevroren fundamenten:**

1. **IA:** Home · Positie · Situatie · Probleem · Wedstrijd · Seizoen · Team-rollen · Global search
2. **Content:** L0 Trigger → L1 Visual → L2 20s → L3 Apply → L4 2m → L5 Volledig
3. **Navigatie:** positie/situatie/probleem · nooit PB-first · 5-sec tests passed by design
4. **Situaties:** 6 ACE poorten + tags + 22 registry + 10 problemen
5. **Dashboards:** 5 rollen · widget sets defined
6. **Leerflow:** week cyclus met trainer push + reflectie mandatory-soft
7. **Retrofit:** sidecar YAML · extract-first · 8 waves · ~196u not 800u
8. **PB35:** Mijn Speelboek (doc) + Mijn Seizoen (platform)
9. **MVP:** 10 must-features · rolling week content
10. **Governance:** ACR for any fundamental change

**Investeer nu veilig in:**
- L0–L4 sidecars (retrofit pipeline)
- PB35 Mijn Speelboek
- MVP prototype (Fase C)
- 12 anker-visuals design

**Investeer NOG NIET in:**
- 34× volledige handmatige L1 rewrite
- 437 visuals
- Full platform Fase F features
- L5 markdown wijzigingen

**Fundamentele wijziging na freeze:** alleen via ACR + panel (PO · UX · trainer · leerpsycholoog).

---

*Document: `academy-architecture-freeze-v1.0.md`*  
*Volgende actie: Fase B — Content Schema + Registry (geen PB-touch)*
