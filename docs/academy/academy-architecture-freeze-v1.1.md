# Academy Architecture Freeze — v1.1

**ZVV Zaandijk VRZ1 — Football Academy**  
**Status:** 🔒 **OFFICIALLY FROZEN** · `ACADEMY-ARCH-v1.1`  
**Supersedes:** v1.0 · Phase 2 plan (detailreferentie)  
**Scope:** Productarchitectuur · geen code · geen sidecars · geen registry · geen PB-wijzigingen

> **Regel:** Na v1.1 — **geen fundamentele wijzigingen** zonder Architecture Change Request (ACR) + panel review.  
> **Doel:** Honderden uren schema, retrofit, dashboards en platform bouwen **zonder** basis herontwerp.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| v1.0 | Superseded | Eerste freeze |
| **v1.1** | **FROZEN** | Audit blockers opgelost · IA vier vlakken · nav · layers · MVP · gates |

---

## Freeze Governance

| Item | Regel |
|------|-------|
| **Versie** | `ACADEMY-ARCH-v1.1` |
| **Wijzigingen** | Alleen via ACR (motivatie · impact · migratie · rollback) |
| **L5 content** | PB01–34 markdown = **bron**, nooit UI-structuur |
| **Nieuwe theorie** | Verboden zonder ACE-amendement |
| **Retrofit** | Alleen L0–L4 metadata (sidecar) op bestaande PB |

---

# 0. Vier architectuurvlakken (scheiding)

Alle objecten vallen in **exact één** vlak. Geen overlap.

| Vlak | Wat | Voorbeelden | Opslag |
|------|-----|-------------|--------|
| **CONTENT** | Onveranderlijke leerbron | L5 markdown PB · visual specs T## · oefeningstekst | Repo / CMS read-only |
| **METADATA** | Gestructureerde lagen + links | Sidecar YAML L0–L4 · registries · link graph | `{pb-XX}-meta.yaml` |
| **NAVIGATIE** | Routes · schermen · tabs | Positie · Situatie · Wedstrijd · content tabs | Frontend routes |
| **PERSOONLIJKE DATA** | Per user · per team · per seizoen | Reflecties · leerpunten · pins · voortgang · weekplan state | Database |

**Regel:** Content ≠ metadata. Navigatie ≠ content. Persoonlijke data verwijst naar content/metadata via ID — kopieert nooit L5-tekst.

---

# 1. Definitieve Productarchitectuur

## 1.1 Audit-amendementen v1.0 → v1.1

| v1.0 probleem | v1.1 oplossing |
|---------------|----------------|
| Laagnummering inconsistent (L0–L5 vs L0–L4 vs tabs) | Canoniek **layer.*** systeem overal (§3) |
| Home + Positie dubbel | **Positie = home** voor speelsters — geen apart Home-dashboard |
| Wedstrijd uit bottom bar | **Wedstrijd terug in bottom bar** |
| Probleem niet bereikbaar | **Probleem in bottom bar** |
| Entiteiten incompleet | Team · Season · Match · Leerpunt · Cue · PositieAnker toegevoegd |
| PositieAnkers verdwenen | Terug in speelster-dashboard (3 vaste taken) |
| PB35 overlap | **Auto-compilatie**, geen authored 2000-woorden doc |
| Retrofit PB01–12 extract faalt | **Wave 0 manual path** (§7) |
| Schaalbaarheid ontbreekt | §12 schaalregels |

## 1.2 Definitieve IA (navigatie + achtergrond)

```
ACADEMY PLATFORM v1.1
│
├── 🔍 ZOEK (global overlay — header, elke pagina)
│
├── NAVIGATIE (bottom bar — speelster)
│   ├── 👤 POSITIE          → home · dashboard (§4.1)
│   ├── ⚽ SITUATIE          → 6 ACE-poorten (§5)
│   ├── ❓ PROBLEEM          → symptoom → fix (§5.3)
│   ├── 🔥 WEDSTRIJDDAG      → vóór · rust · na (§6)
│   └── 📖 MIJN SEIZOEN      → voortgang · reflecties · speelboek (§8)
│
├── ROL-NAVIGATIE (header profiel — geen bottom bar slot)
│   ├── 🧢 CAPTAIN           → team vandaag (§4.2)
│   ├── 📋 TRAINER           → deze week (§4.3)
│   ├── 🤝 STAFF             → observatie (§4.4)
│   └── ⚙️ ADMIN             → platform (§4.5)
│
├── CONTENT ENGINE (achtergrond — nooit primaire nav)
│   ├── Playbook library     → pb.{n} · L5 markdown
│   ├── Layer metadata       → L0–L4 sidecars
│   ├── Visual registry      → vis.{t###}
│   ├── Situation registry   → sit.{slug} · status core|extended
│   ├── Problem registry     → prob.{slug}
│   ├── Exercise registry    → ex.{pb} · optional
│   └── PositieAnker set     → anker.{pos} · 3 vaste taken
│
└── PERSOONLIJKE DATA (database)
    ├── User · Team · Season · Match
    ├── Reflection · Leerpunt · WeekPlan state
    ├── Pin · LastViewed · Progress
    └── Mijn Speelboek (auto-compilatie snapshot)
```

**Verwijderd t.o.v. v1.0:**
- ~~Aparte Home-dashboard~~ → Positie IS home
- ~~Team in bottom bar~~ → rol-switch via header
- ~~Aparte Reflectie-nav~~ → Wedstrijddag NA + Mijn Seizoen
- ~~Aparte Favorieten-nav~~ → Pin widget in Mijn Seizoen

## 1.3 Entiteiten (frozen schema)

### Content & metadata

| Entiteit | ID-pattern | Vlak | Relaties |
|----------|------------|------|----------|
| Playbook | `pb.{n}` | CONTENT | moment · situations[] · problems[] · season_phase |
| Visual | `vis.{t###}` | CONTENT | pb · type · highlight_pos[] |
| Exercise | `ex.{pb}` | CONTENT | pb · optional |
| PositieAnker | `anker.{pos}` | METADATA | pos · 3 tasks[] · core_pb[] |
| LayerCard | `layer.{name}.{pb}.{pos?}` | METADATA | pb · pos · name ∈ trigger\|visual\|activate\|apply\|remember |
| Moment | `moment.{s1-s6}` | METADATA | ACE |
| Situation | `sit.{slug}` | METADATA | moment · pb[] · tags[] · status |
| Problem | `prob.{slug}` | METADATA | situation[] · pb[] |
| Cue | `cue.{slug}` | METADATA | pb · layer.activate · text |

### Persoonlijk & organisatie

| Entiteit | ID-pattern | Vlak | Relaties |
|----------|------------|------|----------|
| User | `user.{id}` | PERSOONLIJK | primary_pos · secondary_pos? · role · team |
| Team | `team.{id}` | PERSOONLIJK | season · users[] · formation default 4231 |
| Season | `season.{team}.{year}` | PERSOONLIJK | team · week_count · ace_map |
| Match | `match.{team}.{date}` | PERSOONLIJK | opponent · home/away · reflections[] |
| Position | `pos.{slug}` | METADATA | 11 fixed · extensible via ACR |
| Reflection | `ref.{user}.{match}` | PERSOONLIJK | match · pb? · prob? · answers[3] |
| Leerpunt | `leerpunt.{user}.{id}` | PERSOONLIJK | ref · prob? · pb? · active_until_week |
| WeekPlan | `week.{season}.{n}` | PERSOONLIJK | pb · exercise · tpl_points[3] · pushed_at |
| Pin | `pin.{user}.{target}` | PERSOONLIJK | target ∈ pb\|sit\|prob · max 5 |
| LastViewed | `lv.{user}.{target}` | PERSOONLIJK | auto · max 5 |
| SpeelboekSnapshot | `speelboek.{user}.{season}` | PERSOONLIJK | auto-generated · pins + leerpunten + ankers |
| CaptainCard | `captain.{week}.{team}` | PERSOONLIJK | weekplan · script_60s · roepen[5] · afspraken[3] |

**Schaal:** `pb.{n}` zonder bovengrens. `sit.{slug}` met `status: core|extended`. Nieuwe teams via `team.{id}` — geen hardcoded VRZ1.

## 1.4 Wat NOOIT in primaire navigatie

- PB-nummer lijst
- ACE-fase lijst (alleen Mijn Seizoen / Trainer)
- Certificering / scores / quiz
- WPE appendix · YAML raw
- Metadata sidecars · registry editor (Admin only)

---

# 2. Definitieve Navigatie

## 2.1 Navigatiemodel (mobiel-first)

**Header (persistent):**
```
[Positie ▼]  ·  [🔍 Zoek]  ·  [Profiel/Rol ▼]
```
- Positie-tap: wissel primary ( + secondary indien ingesteld)
- Zoek: global overlay
- Profiel: rol-switch Captain / Trainer / Staff / Admin

**Bottom bar (5 tabs — speelster):**
```
[ Positie ] [ Situatie ] [ Probleem ] [ Wedstrijd ] [ Seizoen ]
```

**Geen zesde tab.** Team-rollen via header, niet bottom bar.

## 2.2 Route-map (geen dubbele of verborgen routes)

| Route | Ingang | Doel | Geen overlap met |
|-------|--------|------|------------------|
| `/positie` | Bottom · app open default | Dashboard + quick actions | ~~Home~~ |
| `/situatie` | Bottom | 6 ACE-poorten → sub → content | Probleem |
| `/situatie/:poort/:sub` | Situatie drill-down | Content page | — |
| `/probleem` | Bottom | 10 problemen lijst | Situatie |
| `/probleem/:slug` | Probleem tap · zoek | Probleem-fix → content | — |
| `/wedstrijd` | Bottom | Vóór / Rust / Na | Seizoen |
| `/wedstrijd/:fase` | Wedstrijd tabs | Fase-specifieke stack | — |
| `/seizoen` | Bottom | Voortgang · reflecties · pins · speelboek | Positie |
| `/content/:pb` | Overal | Layer tabs (§2.4) | — |
| `/team/captain` | Header rol | Captain dashboard | Positie |
| `/team/trainer` | Header rol | Trainer dashboard | Positie |
| `/team/staff` | Header rol | Staff dashboard | — |
| `/admin` | Header rol | Admin | — |
| `/zoek` | Header overlay | Unified search | — |

**App open (speelster):** altijd `/positie` — geen tussenliggende Home.

## 2.3 Five-second tests (must pass)

| Intentie | Pad | Sec |
|----------|-----|-----|
| "Ik ben linksback" | Open app → header toont LB · al op Positie | **≤1** |
| "Wanneer uitstappen" | Probleem tab → Uitstappen · of 🔍 "uitstappen" | **≤3** |
| "Counters tegen" | Probleem → Counters · of Situatie → Balverlies → Counter | **≤4** |
| "Wedstrijddag" | Wedstrijd tab (bottom) | **≤2** |
| "Alleen 20 sec" | Positie quick [20 sec] · of content tab Activate | **≤3** |
| "Alleen visual" | Positie quick [Visual] · of content tab Visual | **≤3** |

## 2.4 Content page — sticky tabs

**Canonieke tabnamen ( = layer IDs):**

```
[ Visual ] [ 20 sec ] [ Apply ] [ 2 min ] [ Volledig ]
   L1        L2         L3        L4         L5
```

- **L0 Trigger:** inline boven visual op Visual-tab — **geen aparte tab**
- **L3 Apply-tab:** zichtbaar in wedstrijd-context · verborgen/grijs thuis ( geen dead-end )

**Default tab per context:**

| Context | Default tab | Stack |
|---------|-------------|-------|
| Wedstrijd vóór | L2 Activate | L1 toggle · L2 · L3 |
| Wedstrijd rust | L2 Activate | L0 inline · L2 aanpassing |
| Wedstrijd na | — | → Reflectie flow |
| Thuis / week | L4 Remember | L1 → L4 → [L5] |
| Training | L4 Remember | L4 + oefening-link |
| Probleem-fix | L2 Activate | L0 inline · L1 · L2 |
| Zoekresultaat | L2 Activate | — |
| Eerste kennismaking | L1 Visual | L0 inline · L1 |

## 2.5 Quick actions (Positie-dashboard only)

Drie knoppen — **niet** dupliceren op andere tabs:

| Knop | Actie |
|------|-------|
| **20 sec** | Huidige week-PB · tab L2 |
| **Visual** | Huidige week-PB · tab L1 |
| **Wedstrijd** | Route `/wedstrijd/voor` |

## 2.6 Zoekfunctie

**Fase 1 (MVP):** situations · problems · cues (roepteksten)  
**Fase 2 (Production):** + PB-titels · full-text L4/L5

| Resultaat | Default layer |
|-----------|---------------|
| Situation | Situatie-hub |
| Problem | Probleem-fix → L2 |
| Cue | L2 fragment |
| Playbook | Content → L4 default |

Geen PB-nummer in titel — altijd menselijke naam.

---

# 3. Definitieve Leerlagen (L0–L5)

## 3.1 Canoniek layersysteem — DEFINITIEF

| ID | Naam (UI) | Doel | Woorden max | Positie-variant |
|----|-----------|------|-------------|-----------------|
| **L0** | *(inline op Visual)* | Trigger · "Wanneer zie je dit?" | 1 zin | Optioneel 1 regel |
| **L1** | Visual | Herkenning · timing/ruimte | — (beeld) | Highlight in visual |
| **L2** | 20 sec | Activeren · niet leren | ~40 | **Ja · 11×** |
| **L3** | Apply | Toepassen · checklist · roep | ~30 + 3 items | **Ja · 11×** |
| **L4** | 2 min | Onthouden · fouten/afspraken/gedrag | ~200 | **Ja · 11×** |
| **L5** | Volledig | Begrijpen · bestaande PB markdown | Bestaand | §8 positie-sectie |

**Sidecar-velden:** `layers.L0` … `layers.L4` · L5 = `{pb-XX}-content.md` (geen sidecar).

**Phase 2 mapping (referentie only):**

| Phase 2 | v1.1 |
|---------|------|
| L1 20 sec | L2 Activate |
| L2 2 min | L4 Remember |
| L3 Volledig | L5 Full |

## 3.2 Is dit definitief?

**Ja.** Zes lagen · vijf tabs (L0 inline). Geen L6.

## 3.3 Kan iets eenvoudiger?

| Laag | Beslissing |
|------|------------|
| L0 | **Niet verwijderen** — maar **niet als tab** (audit M2 opgelost) |
| L3 Apply | **Niet verwijderen** — maar **alleen wedstrijd-context** (voorkomt L3/L4 dubbel thuis) |
| L1 + L2 | **Blijven gescheiden** — visual ≠ tekst (WVLP) |

**Dubbel-risico mitigatie:**

| Paar | Regel |
|------|-------|
| L0 ↔ L2 | L0 = herkenningszin · L2 = actie — nooit dezelfde tekst |
| L3 ↔ L4 | L3 = 3 vinkjes vandaag · L4 = 3+3+3 onthouden — L3 korter · geen copy-paste |

## 3.4 Context stacks (definitief)

| Context | Zichtbare lagen |
|---------|-----------------|
| Wedstrijd vóór | L1 (L0 inline) · L2 · L3 |
| Wedstrijd rust | L0 inline · L2 (max 2 nieuwe punten) |
| Thuis | L1 · L4 · [L5] |
| Training | L4 + ex.{pb} |
| Probleem-fix | L0 inline · L1 · L2 |

---

# 4. Definitieve Dashboardstructuur

**Principe:** één primair scherm per rol · geen dubbele widgets tussen schermen.

## 4.1 Speelster — Positie (= home)

| # | Widget | Uniek hier | CTA |
|---|--------|------------|-----|
| 1 | **Vandaag** (wedstrijd ja/nee · week-PB) | ✅ | → Wedstrijd / L4 |
| 2 | **Quick actions** (20 sec · Visual · Wedstrijd) | ✅ | direct |
| 3 | **PositieAnkers** (3 vaste taken · altijd) | ✅ | → linked PB |
| 4 | **Apply checklist** (3 vinkjes · alleen wedstrijdweek) | ✅ | toggle |
| 5 | **Leerpunt** (1 actief · uit reflectie) | ✅ | → probleem/content |
| 6 | **Deze week** (ACE PB · 1 oefening-link) | ✅ | → content L4 |
| 7 | **Situatie shortcuts** (4 meest relevant) | ✅ | → situatie |

**Verplaatst naar Mijn Seizoen (geen overlap):** Gepind · Laatst bekeken · Voortgang % · Reflectielog · Speelboek

## 4.2 Captain — Team vandaag (header rol)

| Widget | CTA |
|--------|-----|
| CaptainCard: 60 sec script | Expand |
| 3 teamafspraken (trainer-sync) | Read-only |
| Roep-lijst (5 cues) | Copy |
| Rust-notitie (live match) | → Wedstrijd rust |
| Help teammate → L2 van positie | → content |

**Geen duplicaat** van Positie-widgets. Captain opent standaard op Team; kan naar Positie via bottom bar.

## 4.3 Trainer — Deze week (header rol)

| Widget | CTA |
|--------|-----|
| WeekPlan: PB + push team | Push |
| 3 TPL observeerpunten | Edit |
| Oefening (ex.{pb}) | Share |
| Team reflecties aggregate | Review |
| Fragment voor bespreking (L5) | → content |
| Post-match evaluatie form | Submit |

## 4.4 Staff — Observatie (header rol)

| Widget | CTA |
|--------|-----|
| TPL checklist live | Vink |
| Linie-focus (ver/mid/aan) | Toggle |
| Aandachtspunten (max 3 spelers) | Note |
| Week PB link | Read L4 |

## 4.5 Administrator (header rol)

| Widget | CTA |
|--------|-----|
| Active users / reflectie % | Analytics |
| Sidecar completeness per wave | Retrofit QA queue |
| WeekPlan override | Manual ACE |
| Team · rol assignment | User admin |
| ACR log | Governance |

Coach = Trainer (NL amateur). Staff = assistent · geen weekplan-push.

---

# 5. Definitieve Situatiestructuur

## 5.1 Drie ingangen (logisch · niet overlappend)

```
         ┌─────────────┐
         │   POSITIE   │ ← filter overal actief (header)
         └──────┬──────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
SITUATIE    PROBLEEM      ZOEK
(wanneer)   (symptoom)   (weet label)
    │           │           │
    └───────────┴───────────┘
                ▼
          CONTENT PAGE
          (L1–L5 tabs)
```

## 5.2 ACE-poorten (6 — frozen)

| Poort | ACE | Anker PB | PB-range |
|-------|-----|----------|----------|
| Wij hebben bal | S1 | PB06 | PB06–13 |
| Wij verliezen bal | S2 | PB14 | PB14–19 |
| Tegenstander heeft bal | S3 | PB20 | PB20–25 |
| Wij winnen bal | S4 | PB26 | PB26–29 |
| Standaards | S5 | PB30 | PB30–32 |
| Wedstrijd lezen | S6 | PB33 | PB33–34 |

## 5.3 Tags (filter — geen top-nav)

`balbezit` · `verdedigen` · `omschakelen` · `standaards` · `wedstrijdmanagement` · `mentaal` · `communicatie` · `coachen`

## 5.4 Probleem-navigator (10 frozen · MVP 7)

| # | Probleem | MVP | Koppeling |
|---|----------|-----|-----------|
| 1 | Te snel wegspelen | ✅ | PB27 · PB05 |
| 2 | Positie kwijt | ✅ | PB20–21 · PB33 |
| 3 | Counters tegen | ✅ | PB18 · PB28 |
| 4 | Uitstappen twijfel | ✅ | PB25 · PB24 |
| 5 | Iedereen naar bal | ✅ | PB32 · PB33 |
| 6 | Te weinig communicatie | ✅ | PB30 · PB33 |
| 7 | Paniek na tegengoal | ✅ | PB34 |
| 8 | Druk zetten | Later | PB23 · PB16 |
| 9 | Uitgespeeld | Later | PB24 · PB08 |
| 10 | Achter bal aan | Later | PB14 · PB33 |

## 5.5 Situation registry

**22 core** situaties (`status: core`) — frozen lijst in Phase B registry.  
**Extended** situaties (`status: extended`) — toevoegen bij PB35+ zonder ACR op structuur.

Schaal: 50+ PB's → nieuwe situaties als extended · nooit nieuwe top-level poort zonder ACR.

---

# 6. Definitieve Leerflow

## 6.1 Onboarding (1× · ≤90 sec)

```
1. Primary positie (+ optional secondary)
2. Ervaring (default: 4e klasse)
3. Max 2 problemen (pre-fill Probleem-nav)
4. → /positie
```

## 6.2 Weekcyclus (herhaalt ~34 weken)

```
Zo/Ma  TRAINER
       └── WeekPlan push (pb + oefening + TPL) → notificatie team

Ma–Wo  THUIS
       └── L4 Remember (+ L5 optioneel) · huidige week-PB only

Di/Do  TRAINING
       └── Oefening op veld · Captain 60 sec briefing

Vr     WEDSTRIJD — VÓÓR
       └── L2 Activate + L3 Apply (+ L1 visual toggle)

Za     WEDSTRIJD
       └── Toepassen op veld

Za     WEDSTRIJD — NA
       └── Reflectie 3 vragen → Leerpunt → dashboard

Za     RUST (indien van toepassing)
       └── L0 inline + L2 aanpassing · captain rust-notitie

Zo     TRAINER
       └── Team evaluatie → volgende WeekPlan
```

## 6.3 Seizoenboog

```
Week 1–19   Rolling week-PB · leerpunten accumuleren
Week 20+    Mijn Speelboek unlock (auto-compilatie)
Week 34     Seizoen review in Mijn Seizoen
```

## 6.4 Leerflow-checklist

| Element | Aanwezig | Mechanisme |
|---------|----------|------------|
| Motivatie | ✅ | Voortgang % · leerpunt zichtbaar · geen gamification (bewust) |
| Feedback | ✅ | Reflectie → leerpunt · trainer evaluatie · captain roep |
| Herhaling | ✅ | PositieAnkers altijd · leerpunt blijft tot opgelost (max 3 weken) |
| Transfer | ✅ | L3 Apply checklist · reflectie vraag 1 "herken je Academy-moment?" |
| Personalisatie | ✅ | Problemen onboarding · leerpunt · pins · speelboek |

## 6.5 Reflectie (soft mandatory)

3 vragen · skip max **2× per seizoen** · levert `Leerpunt` + optioneel `prob`/`pb` link.

---

# 7. Definitieve Retrofitstrategie

## 7.1 Principe

Metadata-first · extract where possible · **Wave 0 voor PB01–12** · L5 nooit herschrijven.

## 7.2 PB-extracteerbaarheid (audit bevestigd)

| PB-range | Zaterdag-structuur | Extract-pad |
|----------|-------------------|-------------|
| **PB13–34** (22 PB) | `## Zaterdag — wat jij anders doet` | **Auto-extract** L2/L4 |
| **PB06–12** (7 PB) | Zaterdagfragment / losse zinnen | **Semi-auto** + handmatig |
| **PB01–05** (5 PB) | Geen Zaterdag-sectie | **Wave 0 manual** |

## 7.3 Pipeline (frozen order)

```
STAP 0 — Schema (Phase B)
  └── academy-content-schema.yaml · layer.L0–L4 · entity IDs

STAP 1 — Registry (Phase B)
  └── 22 core situations · 10 problems · 6 moments · 11 PositieAnkers

WAVE 0 — PB01–12 manual path (Phase E start)
  └── Handmatig L0–L4 sidecars · template-based · geen L5 touch

STAP 2 — Extract PB13–34 (automated assist)
  ├── L2 FROM "Zaterdag — wat jij anders doet"
  ├── L4 FROM §8 Fout/Beter patterns
  ├── L0 FROM §1 Herkenningspunt / STOP
  └── L3 FROM trainer-verwachting / checklist patterns

STAP 3 — Human review (9 waves)
  Wave 1–3: PB26–34 (S4–S6)
  Wave 4–5: PB20–25 (S3)
  Wave 6–7: PB14–19 (S2)
  Wave 8:   PB13 (S1 transition)
  Wave 0:   PB01–12 (manual)

STAP 4 — Link graph (automated)
STAP 5 — Visual assign (12 ankers + refs)
STAP 6 — QA (2 posities × 1 PB per wave)
STAP 7 — Publish sidecars only
```

## 7.4 Sidecar pattern (frozen format)

```yaml
pb: 27
slug: eerste-pass-na-winst
moment: [moment.s4]
situations: [sit.eerste-pass]
problems: [prob.te-snel-wegspelen]
visual_primary: vis.t294
exercise: "Rondje eerste pass · 4 min"  # optional
layers:
  L0: { shared: "Bal gewonnen — waar is NU het voordeel?" }
  L2: { keeper: [...], lb: [...], ... }      # 11 posities
  L3: { keeper: { checklist: [...], cue: "..." }, ... }
  L4: { keeper: { fouten: [], afspraken: [], gedragingen: [] }, ... }
```

L5 = `{pb-XX}-content.md` — ongewijzigd.

## 7.5 Effort (realistisch post-audit)

| Stap | Uren |
|------|------|
| 0–1 Schema + registry | 24 |
| Wave 0 PB01–12 manual | 60 |
| Extract PB13–34 | 40 |
| Review 9 waves | 96 |
| Link + visual brief | 56 |
| **Totaal** | **~276 uur** |

**Verwachting:** ~15–20% sidecars vereisen alsnog handmatige L2/L4 edit (bold-fragmentatie PB20–34).

---

# 8. PB35 / Mijn Speelboek (definitief)

## 8.1 Beslissing v1.1

| Artifact | Naam | Vorm |
|----------|------|------|
| Platform hub | **Mijn Seizoen** | Voortgang · reflecties · timeline · pins |
| Persoonlijk compilatie | **Mijn Speelboek** | **Auto-generated snapshot** — geen authored doc |

## 8.2 Mijn Speelboek = auto-compilatie

**Input (persoonlijke data):**
- Pins (max 5)
- Actieve + afgeronde leerpunten
- PositieAnkers (3)
- Top-3 reflectie-momenten
- Week-PB's met hoogste engagement

**Output:** PDF/view · ~8–12 PB-fragmenten (L2+L4) · vaste persoonlijke 20 sec · **geen nieuwe theorie**

**Unlock:** week 20 · trainer manual · of seizoen 70% voortgang.

**Geen overlap:** Positie = operationeel vandaag · Seizoen = historie · Speelboek = export/synthese.

---

# 9. Definitieve MVP (VRZ1 · 16 speelsters · 1 seizoen)

## 9.1 MUST HAVE (Phase D pilot — zonder dit geen test)

| # | Feature |
|---|---------|
| M1 | Onboarding: primary positie + 2 problemen |
| M2 | Positie-dashboard (widgets §4.1 · 1–7) |
| M3 | PositieAnkers (3 vaste taken per positie) |
| M4 | Bottom nav: Positie · Situatie · Probleem · Wedstrijd · Seizoen |
| M5 | Wedstrijddag vóór + na (L2 · L3 · reflectie → leerpunt) |
| M6 | Rolling L2/L4 — huidige week-PB only |
| M7 | 6 ACE-poorten → content (L5 render) |
| M8 | Probleem-nav **7 MVP-problemen** |
| M9 | 1 visual/week (12 anker rotation) |
| M10 | Trainer WeekPlan push (pb + oefening) |
| M11 | Captain CaptainCard (60 sec + roepen) |
| M12 | Layer tabs op content page (L1–L5) |

## 9.2 SHOULD HAVE (Phase D — sterk aanbevolen)

| # | Feature | Waarom |
|---|---------|--------|
| S1 | Push notificatie weekplan | Zonder push opent niemand maandag |
| S2 | Offline cache huidige week L2 | Kleedkamer / geen bereik |
| S3 | Wedstrijd rust-modus (basic) | Elke wedstrijd heeft rust |
| S4 | Secondary positie switch | Amateurs wisselen positie |
| S5 | Mijn Seizoen basic (reflectielog + voortgang %) | Sluit leerloop |
| S6 | Zoek (situations + problems + cues) | Fallback navigatie |

## 9.3 LATER (Phase E/F — na pilot-validatie)

Favorieten pin · volledige L0–L4 alle 34 PB · Staff/Admin dashboards · quiz · full-text search · offline all · PB35 speelboek · analytics · multi-team UI · jeugd-formations

## 9.4 MVP success criteria

| Metric | Target |
|--------|--------|
| Wedstrijddag open vóór match | >60% |
| Reflectie completion | >50% |
| Trainer: gedrag verbeterd | >70% agree |
| Tijd Positie → L2 | <10 sec |
| Speelster NPS | >40 |

---

# 10. Schaalbaarheid (3-jaar validatie)

| Dimensie | v1.1 antwoord | Breekt niet omdat |
|----------|---------------|-------------------|
| **50+ PB's** | `pb.{n}` · extended situations | ACE-poorten blijven 6 · PB's binnen poorten |
| **500+ visuals** | `vis.{t###}` registry · primary + refs per PB | Content page toont 1 primary · rest linked in L5 |
| **Meerdere teams** | `team.{id}` · scoped WeekPlan/Match | Admin per team · geen hardcoded VRZ1 |
| **Meerdere seizoenen** | `season.{team}.{year}` | Progress reset per season · speelboek per season |
| **Jeugd / senioren** | `team.category` · formation via ACR | PositieAnkers per team override · 11 pos default |
| **Keepers** | `pos.keeper` volwaardig | Eigen L2/L3/L4 varianten · geen apart platform |
| **Trainers** | Rol-scoped dashboard | WeekPlan per team |
| **Analytics** | Admin + aggregate (geen PII in content) | Persoonlijke data vlak gescheiden |

**Schalen zonder herontwerp:** registries extensible · navigation frozen · layers frozen · sidecar format frozen.

**Wél ACR nodig (later):** jeugd-formations ≠ 4231 · aparte ACE-curriculum · B2B multi-club admin.

---

# 11. Architecture Freeze Rules

Vanaf **2026-07-02** (`ACADEMY-ARCH-v1.1`) — **NOOIT wijzigen zonder ACR:**

## 11.1 Frozen — navigatie

- Bottom bar 5 tabs: **Positie · Situatie · Probleem · Wedstrijd · Seizoen**
- Positie = home (geen apart Home-dashboard)
- Navigatie-as: **positie · situatie · probleem** — nooit PB-first
- Global zoek in header
- Rol-switch via header (Captain · Trainer · Staff · Admin)
- Content page 5 tabs: **Visual · 20 sec · Apply · 2 min · Volledig**
- L0 inline op Visual-tab

## 11.2 Frozen — leerlagen

- L0 Trigger · L1 Visual · L2 Activate · L3 Apply · L4 Remember · L5 Full
- L3 Apply alleen wedstrijd-context
- L5 = bestaande markdown · nooit herstructureerd voor UI
- Positie-varianten L2 · L3 · L4 (11×)

## 11.3 Frozen — ACE-structuur

- 6 poorten (S1–S6)
- 10 problemen (uitbreidbaar via registry · niet via top-nav)
- Tags als filter · geen alternatieve top-level boom
- 22 core situations

## 11.4 Frozen — dashboards

- 5 rollen · 1 primair scherm per rol
- PositieAnkers (3 vaste taken) op speelster-dashboard
- Geen widget-duplicatie Positie ↔ Seizoen

## 11.5 Frozen — registry & sidecar

- Sidecar `{pb-XX}-meta.yaml` format (§7.4)
- Vier vlakken: Content · Metadata · Navigatie · Persoonlijk
- Entity ID patterns (§1.3)
- Link graph: pb ↔ moment ↔ situation ↔ problem ↔ visual

## 11.6 Frozen — positiearchitectuur

- 11 posities default (4-2-3-1)
- Primary + optional secondary per user
- Positie-filter persistent in header

## 11.7 ACR-procedure

1. Motivatie + data/evidence  
2. Impact analyse (content · nav · retrofit · MVP)  
3. Migratieplan bestaande sidecars  
4. Panel: PO · UX · trainer · leerpsycholoog · software architect  
5. Versie bump (`v1.2`) alleen na goedkeuring  

---

# 12. Phase Gates

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE A — ARCHITECTURE FREEZE                              │
│  Deliverable: ACADEMY-ARCH-v1.1                             │
│  Gate: panel audit passed                                   │
│  Status: ✅ COMPLETE                                         │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE B — SCHEMA + REGISTRY                                │
│  Deliverable: academy-content-schema.yaml                   │
│               situation/problem/moment/anker registries     │
│               sidecar template (empty)                    │
│  Gate: schema validates · IDs match §1.3 · 0 PB touched     │
│  Start: ✅ GO (na v1.1)                                      │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE C — PROTOTYPE                                        │
│  Deliverable: UX prototype · PB26–29+33 sidecars (pilot)    │
│               12 visual briefs                              │
│  Gate: B complete · 5-sec tests pass in prototype             │
│  Start: after B gate                                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE D — VRZ1 PILOT                                       │
│  Deliverable: MVP MUST (§9.1) live · 16 speelsters · 1 seizoen│
│  Gate: C complete · MUST checklist · SHOULD S1–S3 strongly  │
│        recommended                                        │
│  Start: after C gate · success criteria §9.4                │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE E — RETROFIT                                         │
│  Deliverable: 34 sidecars · Wave 0–8 · link graph           │
│  Gate: D validated (metrics hit) · pilot feedback integrated│
│  Start: after D gate — NOT parallel with D                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE F — PRODUCTION                                       │
│  Deliverable: SHOULD + LATER features · multi-team ready    │
│               offline · full search · admin · PB35 speelboek│
│  Gate: E complete · QA all sidecars · security review       │
│  Start: after E gate                                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE G — OPTIMIZE (year 2+)                               │
│  Analytics · A/B · content trim · extended situations       │
└─────────────────────────────────────────────────────────────┘
```

**Harde regel:** geen fase overslaan · geen parallel B+C · geen retrofit (E) vóór pilot (D) validatie.

---

# 13. Eindconclusie

## Is de Academy architectisch bevroren?

### ✅ JA — `ACADEMY-ARCH-v1.1` OFFICIALLY FROZEN

Alle audit-blockers opgelost:

| Blocker | Status |
|---------|--------|
| A1 Laagnummering | ✅ Canoniek L0–L5 + layer.* IDs |
| A2 Retrofit PB01–12 | ✅ Wave 0 manual path |
| A3 Wedstrijd nav | ✅ Bottom bar tab |
| A4 Home vs Positie | ✅ Positie = home |
| A5 Entiteiten | ✅ Team · Match · Leerpunt · Cue · Anker |
| A6 PositieAnkers | ✅ Dashboard widget |
| A7 PB35 overlap | ✅ Auto-compilatie |
| A8 MVP helderheid | ✅ Must / Should / Later |

**Investeer nu veilig in Phase B:**
- `academy-content-schema.yaml`
- Registries (22 sit · 10 prob · 6 moment · 11 anker)
- Sidecar template (leeg)

**Investeer NOG NIET in:**
- Sidecar invulling (Phase E)
- Platform code (Phase C)
- L5 markdown wijzigingen
- PB35 content schrijven (Phase F)

---

*Document: `academy-architecture-freeze-v1.1.md`*  
*v1.0 superseded — bewaar voor historie*  
*Volgende actie: **Phase B — Schema + Registry***
