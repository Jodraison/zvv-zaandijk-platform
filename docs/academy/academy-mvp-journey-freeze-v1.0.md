# Academy MVP Journey Freeze — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** C.0 — MVP Journey Freeze  
**Architecture:** `ACADEMY-ARCH-v1.1` (frozen)  
**Design System:** `ACADEMY-PDS-v1.0`  
**Scope:** Gebruikersreizen · geen wireframes · geen layouts · geen code

> **Regel:** Wireframes volgen deze Journey — nooit andersom.  
> **Gate:** Phase C.1 (Wireframes) start pas na Journey Freeze approval.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **FROZEN (pending approval)** | 10 scenario's · 6 journey types · UX-risico's |

---

# 0. Journey-principes (frozen)

1. **Positie = home** — app open altijd op Positie-dashboard
2. **Rolling week** — speelster ziet primair huidige week-PB, niet 34 PB's
3. **Context stacks** — wedstrijd ≠ thuis ≠ training (juiste laag)
4. **Maximale tijd** — elke kritieke flow heeft een hard tijdslimiet
5. **Amateur-realiteit** — 2× trainen · 1× wedstrijd · weinig schermtijd
6. **Geen dode schermen** — elk scherm heeft ≥1 journey-stap of is Later

---

# 1. MVP Journey (Scenario 1 — Nieuwe speelster)

**Persona:** Lisa · 19 · speelt linksback · 4e klasse · eerste keer Academy  
**Doel:** Klaar voor eerste training (dinsdag)  
**Maximale tijd tot klaar:** ≤8 minuten (onboarding + eerste 2-min)

## Stap-voor-stap

| # | Actie | Scherm | Keuze / Data | Tijd |
|---|-------|--------|--------------|------|
| 1 | App openen · inloggen (bestaand team-account) | Auth (bestaand platform) | Team VRZ1 | — |
| 2 | Onboarding start | S-10 Positie | Kiest **Linksback** (primary) | ≤30s |
| 3 | Secondary positie (optioneel) | S-10 | Skip of kiest L6 | ≤15s |
| 4 | Ervaring | S-10 (zelfde flow) | Default **4e klasse** · bevestigen | ≤10s |
| 5 | Problemen (max 2) | S-11 | Kiest: *"Ik speel te snel weg"* + *"Ik weet niet wanneer uitstappen"* | ≤30s |
| 6 | CTA "Start Academy" | S-11 → S-20 | Data opgeslagen: `pos.lb` · 2 probleem-tags | — |
| 7 | Landt op Positie-dashboard | S-20 | Ziet: Vandaag · Quick · PositieAnkers (LB) · Deze week (indien gepusht) | — |
| 8 | Geen week-PB? | S-20 empty | Empty state: "Trainer zet deze week klaar" · kan Situatie/Probleem browsen | — |
| 9 | Week-PB aanwezig (Ma push) | S-20 WeekCard | Tap → S-40 L4 (2 min) · LB-variant | ≤2m |
| 10 | Optioneel visual | S-40 L1 | 1 anker-visual week | ≤30s |
| 11 | Klaar voor training | — | Kent 3 ankers · 3 fouten/afspraken · weet oefening-link | — |

**Data die bestaat na onboarding:**

| Entiteit | Waarde |
|----------|--------|
| `user.primary_position` | `pos.lb` |
| `user.secondary_position` | null of `pos.l6` |
| `user.onboarding_problems` | `[prob.te-snel-wegspelen, prob.uitstappen-twijfel]` |
| `user.experience` | `4e-klasse` |
| Pins / leerpunten / reflecties | leeg |

**Schermen die Lisa NIET ziet in scenario 1:**  
Captain · Trainer · Admin · Speelboek · Volledig L5 (optioneel later) · Rust · Reflectie

**Einde scenario 1:** Lisa is klaar voor dinsdagtraining als ze L4 heeft gelezen of WeekCard heeft geopend.

---

# 2. Week Journey (Scenario 2 — Maandagavond)

**Actors:** Trainer · Captain · Speelster  
**Doel:** Team heeft 1 week-PB · oefening · briefing

## 2A — Trainer (≤5 min)

| # | Actie | Scherm | Output |
|---|-------|--------|--------|
| 1 | Header → Trainer | S-71 | Deze week |
| 2 | Kiest / bevestigt ACE week-PB | WeekPlanCard | bijv. `pb.27` Eerste pass |
| 3 | Zet 3 TPL observeerpunten | TPLPointEditor | Metadata |
| 4 | Koppelt oefening | ExerciseCard | "Rondje eerste pass · 4 min" |
| 5 | **Push naar team** | CTA | Notificatie → alle speelsters · `WeekPlan.pushed_at` |

**Wat trainer NIET doet maandag:** L5 herschrijven · 34 PB browsen · sidecars bewerken

## 2B — Captain (≤3 min na push)

| # | Actie | Scherm | Output |
|---|-------|--------|--------|
| 1 | Header → Captain | S-70 | Team vandaag |
| 2 | Leest CaptainCard 60 sec script | CaptainCard | Teamafspraken (read-only uit trainer) |
| 3 | Checkt 5 roepen | CueList | Copy / memoriseren |
| 4 | Klaar voor dinsdag-briefing | — | Geen push nodig |

## 2C — Speelster (≤3 min na notificatie)

| # | Actie | Scherm | Output |
|---|-------|--------|--------|
| 1 | Opent push / app | S-20 | Vandaag + WeekCard toont PB27 |
| 2 | Tap WeekCard of Quick | S-40 L4 | 2 min LB-variant |
| 3 | Optioneel oefening | S-46 | Weet wat dinsdag komt |
| 4 | Sluit app | — | Laatst bekeken + progress update |

**Volgorde frozen:** Trainer push → Captain leest → Speelster leert.  
**Zonder trainer push:** Speelster ziet empty state — geen dode content, geen oude week-PB als "deze week".

---

# 3. Matchday Journey (Scenario 3–6)

## 3A — Scenario 3: Vrijdagavond voorbereiding (≤2 min)

**Doel:** Speelster is mentaal klaar · geen diep studeren

| # | Pad | Scherm | Tijd |
|---|-----|--------|------|
| 1 | App open | S-20 | 0s |
| 2 | Quick **[20 sec]** OF Vandaag → Wedstrijd | S-40 L2 OF S-51 | ≤5s |
| 3 | Leest L2 (LB) + Cue | TwentySecCard | ≤40s |
| 4 | Toggle Visual (optioneel) | S-40 L1 | ≤30s |
| 5 | Apply checklist (3 vinkjes) | S-43 / S-51 | ≤40s |
| 6 | Klaar · sluit | — | **Totaal ≤2 min** |

**Schermen die vrijdag NIET openen:** L5 Volledig · Seizoen · Probleem-nav · Trainer · Situatie deep-dive (tenzij zoekt)

**Regel:** Vrijdag = L2 + L3 Apply. Thuis-week = L4. Niet omwisselen.

---

## 3B — Scenario 4: Zaterdag · 30 min vóór wedstrijd (≤90 sec)

**Context:** Kleedkamer · slecht bereik · stress

| # | Actie | Scherm | Max |
|---|-------|--------|-----|
| 1 | App open | S-20 | — |
| 2 | Quick **[Wedstrijd]** of bottom Wedstrijd | S-51 Vóór | ≤2s |
| 3 | Checklist 3 · 20 sec · visual toggle | S-51 | ≤60s |
| 4 | CTA **"Klaar"** | dismiss | ≤5s |
| 5 | Telefoon weg | — | **Totaal ≤90 sec** |

**Offline (Should):** Cached L2/L3 huidige week — anders faalt journey in kleedkamer.

**Schermen VERBODEN 30 min vóór:**  
L5 · Seizoen · Situatie browsen · Probleem browsen · Zoek · Trainer · Speelboek · Reflectie

**Maximale tijd:** **90 seconden.** Hard.

---

## 3C — Scenario 5: Rust (≤30 sec)

| Rol | Scherm | Informatie | Max |
|-----|--------|------------|-----|
| **Speelster** | S-52 Rust | Stand + fase · L2 aanpassing (max **2** nieuwe punten) · L0 inline | ≤30s |
| **Captain** | S-52 + RustNote | 30 sec rust-script · 1 fix eerste helft | ≤30s |
| **Trainer** | S-52 / S-71 observe | TPL focus · geen nieuwe PB · max 1 aanpassing | ≤30s |

**Regel:** Rust = **minder** informatie dan vóór. Geen L4. Geen L5. Geen nieuwe situaties.

**Als rust-modus ontbreekt (MVP Must zonder Should S3):** Captain mondeling · app fallback = S-51 heropen met L2 — geaccepteerd risico tot Should live.

---

## 3D — Scenario 6: Na wedstrijd · Reflectie · Lus sluiten

| # | Actie | Scherm | Data |
|---|-------|--------|------|
| 1 | Na eindfluit · open app | S-53 Na | Prompt reflectie |
| 2 | Start reflectie | S-54 | 3 vragen · 1 scherm per vraag |
| 3 | V1: Academy-moment herkend? | S-54 | Optioneel `pb`/`sit` link |
| 4 | V2: Wat deed je goed? (1) | S-54 | Tekst |
| 5 | V3: Wat fix je volgende week? (1) | S-54 | → `Leerpunt` |
| 6 | Opslaan | S-55 Success | Leerpunt op S-20 · log in S-60 |
| 7 | Zondag: Trainer evalueert | S-72 | Aggregate reflecties |
| 8 | Zo/Ma: Nieuwe WeekPlan | S-71 → push | Lus herstart Scenario 2 |

**Soft mandatory:** Skip max **2× per seizoen**. Derde skip → soft nudge, geen hard block.

**Lus:** Reflectie → Leerpunt (max 3 weken actief) → zichtbaar op Positie → volgende week-PB kan erop aansluiten (trainer ziet aggregate).

---

# 4. Season Journey (Scenario 7–8)

## 4A — Scenario 7: Halverwege seizoen · nieuwe positie

**Context:** Week 17 · Lisa speelt nu vaker L6 i.p.v. LB

| # | Actie | Effect |
|---|-------|--------|
| 1 | Header Positie ▼ | S-02 Switcher |
| 2 | Primary → **L6** · Secondary → LB | Opgeslagen |
| 3 | S-20 herlaadt | PositieAnkers = L6 (3 taken) · shortcuts = L6 · week L2/L3/L4 = L6-variant |
| 4 | Leerpunten blijven | Gekoppeld aan user · niet aan oude positie |
| 5 | Pins blijven | Target pb/sit/prob — positie-filter past content-variant aan |
| 6 | Speelboek (week 20+) | Compileert op **huidige primary** + historie |

**Wat NIET verandert:** Seizoen voortgang % · reflectielog · team WeekPlan  
**Wat WEL verandert:** Alle layer-varianten L2/L3/L4 · ankers · situatie shortcuts

**Regel:** Positiewissel is **instant** · geen her-onboarding · geen content reset.

---

## 4B — Scenario 8: Geblesseerde speelster

**Doel:** Blijft leren · geen wedstrijd-activering

| Ziet wel | Ziet niet / beperkt |
|----------|---------------------|
| S-20 Positie (week L4) | S-51 "Klaar voor wedstrijd" als irrelevant |
| Situatie · Probleem · Zoek | Apply checklist (geen match-context) |
| S-60 Seizoen · reflectielog | Captains rust-live (niet speelster) |
| Content L1–L5 | Wedstrijd NA-reflectie (geen match) |

**MVP-gedrag (eenvoudig):**  
Geen apart "blessure-modus" scherm. Speelster gebruikt **thuis-stack** (L4) · skip Wedstrijd-tab of opent alleen voor team-info.  
Trainer kan speelster **niet** uit WeekPlan push halen (Later). Push blijft — speelster negeert wedstrijd-flow.

**Later (Post-MVP):** Status `injured` → hide Matchday CTA · show "Blijf leren" banner.

---

## 4C — Seizoenboog (macro)

```
Week 1     Onboarding + eerste WeekPlan
Week 2–19  Rolling week · leerpunten · reflecties
Week 20    Mijn Speelboek unlock (auto)
Week 21–33 Door · Speelboek update bij engagement
Week 34    Seizoen review in S-60
```

---

# 5. Trainer Journey (Scenario 9)

## Scenario 9: "Waarom blijft mijn rechtsback te hoog?"

**Intentie:** Symptoom → fix · niet PB-nummer zoeken

| Stap | Actie | Scherm | Tijd |
|------|-------|--------|------|
| 1 | Header Zoek 🔍 | S-01 | 0s |
| 2 | Type: *"positie"* of *"te hoog"* of *"schuif"* | Search | ≤5s |
| 3a | Resultaat Probleem: *"Ik verlies mijn positie"* | → S-36 | — |
| 3b | OF Situatie: Verdedigingsblok / Lijnen samen | → S-32 | — |
| 4 | Opent content · filter positie **RB** | S-40 L2 of L4 | ≤10s |
| 5 | Optioneel L5 fragment voor training | S-45 | — |
| 6 | Zet als TPL-punt of volgende week-PB | S-71 | — |

**Max stappen:** **4 taps** (Zoek → resultaat → content → klaar)  
**Max tijd:** **≤30 seconden** tot juiste L2/L4 voor RB

**Alternatief zonder zoek (Must):**  
Probleem-tab → *"Ik verlies mijn positie"* → content · of Situatie → Verdedigen → Blok.

**Trainer ziet NIET:** Speelster Apply checklist als eigen checklist · Captain 60 sec als primaire flow

---

# 6. Captain Journey (Scenario 10)

## Scenario 10: 60 seconden briefing voorbereiden

| # | Actie | Scherm | Tijd |
|---|-------|--------|------|
| 1 | Header → Captain | S-70 | 0s |
| 2 | Open CaptainCard | Expand | ≤5s |
| 3 | Lees 60 sec script (week-PB) | CaptainCard | ≤40s |
| 4 | Scan 3 teamafspraken + 5 roepen | CueList | ≤15s |
| 5 | Klaar voor kleedkamer | — | **Totaal ≤60s** |

**Data bron:** WeekPlan (trainer) + sidecar captain_points + cues  
**Zonder WeekPlan push:** Empty state — "Wacht op trainer push" · geen oude briefing tonen als actueel

**Captain mag daarna:** Help teammate → kies positie → open L2 voor die speelster (extra, niet in 60s-pad)

---

# 7. Journey Maps (samenvatting)

## 7.1 MVP Journey (first-time → klaar voor training)

```
Auth → Onboarding Positie → Onboarding Problemen
  → Positie Dashboard
  → [WeekPlan push] → L4 2 min → [Oefening]
  → KLAAR VOOR TRAINING
```

## 7.2 Week Journey

```
Zo/Ma TRAINER: WeekPlan + TPL + Oefening + PUSH
     ↓
     CAPTAIN: CaptainCard 60s + roepen
     ↓
Ma–Wo SPEELSTER: L4 (+ L5 opt)
     ↓
Di/Do TRAINING: Oefening op veld + Captain briefing
```

## 7.3 Matchday Journey

```
Vr     L2 + L3 Apply (≤2 min)
Za-30  S-51 Vóór (≤90 sec) → telefoon weg
Za HT  S-52 Rust (≤30 sec) · speelster/captain/trainer
Za END S-53 → S-54 Reflectie → Leerpunt → S-20
Zo     Trainer S-72 → nieuwe week
```

## 7.4 Season Journey

```
W1 Onboarding → W2–19 Loop → W20 Speelboek
→ Positiewissel anytime (S-02)
→ Blessure = thuis-stack · geen aparte modus (MVP)
→ W34 Seizoen review
```

## 7.5 Trainer Journey (diagnose)

```
Zoek OF Probleem/Situatie → Content (positie-filter)
→ TPL / WeekPlan (optioneel)
≤4 taps · ≤30 sec
```

## 7.6 Captain Journey (briefing)

```
S-70 → CaptainCard → CueList
≤60 sec · afhankelijk van trainer push
```

---

# 8. UX-risico's

| # | Risico | Impact | Mitigatie (Journey Freeze) |
|---|--------|--------|----------------------------|
| R1 | Geen WeekPlan push → lege maandag | Speelster haakt af | Empty state + Should push-notificatie · geen oude week als "deze week" |
| R2 | Kleedkamer offline | S-51 faalt | Should: cache L2/L3 week · Must: accept risico of pre-download vrijdag |
| R3 | Rust-modus Later | Chaos half-time | Fallback: L2 heropen · Captain mondeling · S3 Should zo snel mogelijk |
| R4 | Te veel schermen vóór wedstrijd | Stress · te lang | Hard verbod L5/Seizoen/Zoek in S-51 pad · max 90s |
| R5 | L4 vrijdag i.p.v. L2 | Cognitieve overload | Journey: Vr = L2+L3 only · default tab context-driven |
| R6 | Reflectie skip te vaak | Lus breekt | Soft mandatory · max 2 skips · leerpunt blijft zichtbaar |
| R7 | Positiewissel verwarring | Verkeerde L2 | Header badge altijd zichtbaar · instant anker-switch |
| R8 | Blessure geen status | Frictie Matchday CTA | MVP: negeer Wedstrijd · Later: injured flag |
| R9 | Zoek ontbreekt (Must zonder S6) | Trainer scenario 9 traag | Probleem + Situatie als fallback · 2–3 taps extra |
| R10 | Captain zonder push | Lege 60s | Empty state · niet improviseren met random PB |
| R11 | Dode schermen | Onderhoud · verwarring | Zie §9 — schermen met <1 journey-stap = Later of merge |
| R12 | Dubbele info Apply + L4 | Verwarring | L3 alleen match · L4 alleen thuis/training |

---

# 9. Journey Audit — Controle

## 9.1 Dode of zelden bezochte schermen

| Scherm | Journey-frequentie | Besluit |
|--------|-------------------|---------|
| S-45 L5 Volledig | Laag (optioneel diep) | **Behouden** · collapsed · niet in matchday |
| S-62 Speelboek | Week 20+ · zeldzaam | **Behouden** · locked tot unlock |
| S-74 Admin | Zelden | **Behouden** · rol-gated |
| S-32 Situatie detail | Medium | **Behouden** · kan thin blijven (doorlink naar S-40) |
| S-46 Oefening | 1×/week | **Behouden** |
| S-80–82 System | Edge | **Behouden** |

**Geen scherm verwijderen vóór pilot** — wel: geen wireframe-detail investeren in S-62/S-74 tot Phase D metrics.

## 9.2 Samenvoegen?

| Kandidaat | Besluit |
|-----------|---------|
| S-53 Na + S-54 Reflectie | **Niet mergen** — S-53 = 1 CTA entry · S-54 = wizard |
| S-51 Vóór + S-42 L2 | **Embed** — S-51 bevat TwentySecCard · geen apart openen nodig |
| S-20 + Seizoen pins | **Niet mergen** — Positie = vandaag · Seizoen = historie (v1.1) |

## 9.3 Ontbrekende stappen?

| Gap | Oplossing in Journey |
|-----|----------------------|
| Auth/team invite | Bestaand platform · buiten Academy wireframes |
| Notificatie tap → deep link WeekCard | Should S1 · Journey documenteert pad |
| Secondary positie in onboarding | Optioneel in S-10 · Scenario 7 dekt wissel |
| Blessure-modus | Expliciet MVP = geen apart scherm |

## 9.4 Dubbele informatie?

| Paar | Regel |
|------|-------|
| L0 ↔ L2 | Trigger ≠ actie |
| L3 ↔ L4 | Match vs thuis |
| WeekCard ↔ CaptainCard | Speelster leert · Captain brieft — verschillende tekst |
| Leerpunt ↔ Reflectielog | 1 actief op S-20 · historie in S-60 |

## 9.5 Volgorde logisch voor amateur?

| Check | Oordeel |
|-------|---------|
| 2× trainen · 1× wedstrijd | ✅ Week + Matchday journeys matchen |
| Weinig schermtijd | ✅ Hard timeboxes 90s / 2m / 30s |
| Geen encyclopedie | ✅ Rolling week · L5 niet default |
| Spelerstaal problemen | ✅ Onboarding + Probleem-nav |

---

# 10. Journey Freeze Rules

Vanaf goedkeuring — **NOOIT zonder ACR wijzigen:**

1. App open → altijd Positie (S-20)
2. Matchday 30-min pad → max **90 seconden** · geen L5/Seizoen/Zoek
3. Rust → max **30 seconden** · max 2 nieuwe L2-punten
4. Vrijdag → L2 + L3 · niet L4 als default
5. Ma–Wo → L4 als default
6. Reflectie → 3 vragen → 1 Leerpunt · soft mandatory
7. WeekPlan push vereist vóór "deze week" content
8. Captain 60s pad → alleen S-70 · afhankelijk van push
9. Positiewissel → instant · geen her-onboarding
10. Wireframes mogen Journey **niet omkeren**

---

# 11. Journey Freeze Certificering

```
ACADEMY-JOURNEY-v1.0
Phase: C.0 — MVP Journey Freeze
Architecture: ACADEMY-ARCH-v1.1
Design System: ACADEMY-PDS-v1.0

Scenarios covered:     10/10
Journey types:         6 (MVP · Week · Matchday · Season · Trainer · Captain)
UX risks documented:   12
Dead screens:          none blocking
Missing steps:         none for MVP Must
Amateur-fit:           validated

STATUS: 🔒 FROZEN pending user approval

Next: Phase C.1 — Wireframes (alleen schermen in kritieke journeys)
  Priority wireframe order:
  1. S-20 Positie
  2. S-40 Content (L1–L4)
  3. S-51 Wedstrijd vóór
  4. S-54 Reflectie
  5. S-35 Probleem
  6. S-71 Trainer · S-70 Captain
```

---

*Document: `academy-mvp-journey-freeze-v1.0.md`*  
*Prev: Phase B.5 Product Design System · Next: Phase C.1 Wireframes (na approval)*
