# Academy VRZ1 Pilot & Learning Validation — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** D — VRZ1 Pilot & Learning Validation  
**Architecture:** `ACADEMY-ARCH-v1.1`  
**Journey:** `ACADEMY-JOURNEY-v1.0`  
**Wireframes:** `ACADEMY-WIRE-v1.0`  
**Prototype:** `ACADEMY-PROTO-v1.0`  

**Scope:** Pilotontwerp · meting · formulieren · rapport · GO/NO-GO  
**Verboden:** nieuwe functionaliteit · redesign · extra schermen · nieuwe architectuur · productie-implementatie

> **Regel:** Alleen valideren wat al bevroren is (C.0–C.2).  
> **Doel:** Aantonen dat de Academy **bruikbaar** is én **spelersgedrag** verbetert.  
> **Gate:** Implementatiefase start pas na **VRZ1 PILOT CERTIFIED**.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **PILOT DESIGN COMPLETE** | Opzet · usability · learning · KPI's · formulieren · rapport · GO/NO-GO |

---

# 0. Pilotprincipes

1. **Prototype first** — klikbaar prototype (`ACADEMY-PROTO-v1.0`), geen productiecode  
2. **Dubbele validatie** — usability én voetbalontwikkeling  
3. **Veld > lab** — metingen gekoppeld aan training + wedstrijd  
4. **Objectief GO/NO-GO** — geen “goed gevoel”-certificering  
5. **Geen scope creep** — feedback = backlog; geen live herontwerp tijdens pilot  
6. **Privacy** — scores geanonimiseerd in rapport; geen namen in openbare samenvatting  

---

# 1. Pilot Opzet

## 1.1 Doelstellingen

| # | Doel | Succes = |
|---|------|----------|
| D1 | Speelsters vinden juiste content snel | Usability KPI's §4 |
| D2 | Speelsters begrijpen weekprincipe beter | Begrip pre/post §3 |
| D3 | Gedrag verandert op training / wedstrijd | Coach-observatie §3 |
| D4 | Captain & trainer flows werken | Scenario 4–5 pass |
| D5 | Geen kritieke UX-blockers | Severity-matrix §2 |

## 1.2 Deelnemers

**Teamcapaciteit VRZ1:** ±16 speelsters · 1 captain · 1 trainer (eventueel 1 assistent als observer).

| Testgroep | N | Selectie | Rol in pilot |
|-----------|---|----------|--------------|
| **Nieuwe speelsters** | 2–3 | ≤1 seizoen bij VRZ1 of nieuw in Academy | Onboarding + first-week learning |
| **Verdedigers** | 4–5 | LB/RB/LCV/RCV/Keeper | Positie-ankers · uitstappen · blok |
| **Middenvelders** | 3–4 | L6/R6/10 | Eerste pass · balverovering |
| **Aanvallers** | 3–4 | LW/RW/Spits | Omschakeling · druk |
| **Captain** | 1 | Huidige captain | Briefing 60s · rust |
| **Trainer** | 1 | Hoofdtrainer VRZ1 | WeekPlan push · TPL · coachscore |

**Totaal kern:** **14–16 speelsters + captain + trainer** (volledige selectie waar mogelijk).  
**Minimum viable pilot:** 10 speelsters (min. 2 per linie) + captain + trainer — anders NO-GO op steekproef.

**Lijn-dekking verplicht:** min. 2 verdedigers · 2 middenvelders · 2 aanvallers in learning-sample.

## 1.3 Duur

| Fase | Duur | Wat |
|------|------|-----|
| **D0 Voorbereiding** | 5–7 dagen | Consent · baseline · facilitator briefing · fixtures |
| **D1 Usability lab** | 1 avond (±2,5 u) | C.2 testscript scenario's 1–6 (steekproef) |
| **D2 Field week A** | 7 dagen | WeekPlan push · L4 thuis · 2 trainingen · 1 wedstrijd |
| **D3 Field week B** | 7 dagen | Tweede week-PB · retentiemeting week A · reflectie |
| **D4 Nazorg + rapport** | 5–7 dagen | Post-tests · interviews · analyse · GO/NO-GO |

**Totale kalenderduur:** **±4 weken** (niet een heel seizoen — seizoensvalidatie = post-implementatie Phase E).

**Weekthema's (vast voor pilot — geen improvisatie):**

| Week | PB (menselijke titel) | Focus lijn |
|------|----------------------|------------|
| A | `pb.27` Eerste pass | Hele team · middenveld zwaar |
| B | `pb.25` 1v1 & uitstappen **of** `pb.20` Verdedigingsblok | Verdedigers zwaar · team meegenomen |

Facilitator + trainer kiezen B vóór D0; daarna **frozen**.

## 1.4 Testmomenten

| Code | Moment | Wie | Instrument |
|------|--------|-----|------------|
| T0 | Voor start (D0) | Alle speelsters | Pre-begrip · pre-vertrouwen · baseline coach |
| T1 | Usability lab (D1) | 8–12 speelsters + C + T | Observatie · taaktijd · fouten · SUS-light |
| T2 | Na training 1 week A | Speelsters + trainer | Toepassing training · coachcheck |
| T3 | Na wedstrijd week A | Speelsters | Reflectie-completion · post-match vertrouwen |
| T4 | Start week B (retentie A) | Speelsters | Retentietoets week A-principe |
| T5 | Na training 1 week B | Speelsters + trainer | Toepassing · coachscore |
| T6 | Na wedstrijd week B | Speelsters | Reflectie · wedstrijd-toepassing |
| T7 | Afsluiting (D4) | Allen | Post-begrip · post-vertrouwen · NPS · formulieren · interview C+T |

## 1.5 Voorbereiding (D0)

| # | Actie | Owner |
|---|-------|-------|
| 1 | Informed consent + foto uitleg (minderjarig: ouder) | Facilitator |
| 2 | Prototype geladen · fixtures · offline-toggle getest | Facilitator |
| 3 | Week A/B PB + oefening bevestigd met trainer | Trainer |
| 4 | TPL observeerpunten week A geschreven (3) | Trainer |
| 5 | Baseline coach-rubric per speelster (T0) | Trainer |
| 6 | Pre-tests T0 afgenomen (papier of form) | Facilitator |
| 7 | Observatieprotocol + stopwatch · 2 observers | Facilitator |
| 8 | Geen features wijzigen — change freeze tot T7 | Product owner |

## 1.6 Nazorg (D4)

| # | Actie |
|---|-------|
| 1 | Bedank alle deelnemers · deel high-level resultaat (geen individuele scores) |
| 2 | Captains/trainer 30-min debrief |
| 3 | Ruwe data opschonen · anonimiseren |
| 4 | Rapport §6 invullen |
| 5 | GO/NO-GO besluit vastleggen (§7) |
| 6 | Backlog: P0/P1/P2 uit verbeterpunten — **geen** implementatie tot CERTIFIED |
| 7 | Archiveer consent + ruwe sheets (privacy-compliant) |

---

# 2. Usability Tests

## 2.1 Scope (alleen frozen flows)

Valideer **niet** nieuwe ideeën. Valideer C.2 scenario's + field use van dezelfde schermen.

| Dimensie | Wat meten | Methode |
|----------|-----------|---------|
| **Navigatie** | Juiste route · ≤3 taps | Lab taken + field diary |
| **Snelheid** | Tijd tot content / Klaar | Stopwatch |
| **Duidelijkheid** | Begrijpt labels zonder uitleg | Think-aloud · post-task vraag |
| **Fouten** | Verkeerde taps · backtracks | Observatie count |
| **Verwarring** | Hesitatie >5 s · “waar ben ik?” | Observatie + quote |
| **Zoekgedrag** | Gebruik Zoek vs Probleem vs Situatie | Pad-logging |
| **Tevredenheid** | NPS · SUS-light · open feedback | Formulieren §5 |

## 2.2 Lab-taken (D1) — mapping C.2

| # | Taak | Groep | Pass |
|---|------|-------|------|
| U1 | Nieuwe speelster → eerste oefening | Nieuw | S-46 ≤8 min |
| U2 | RB/uitstappen → L2 | Verdedigers | ≤3 taps · ≤60 s |
| U3 | Wedstrijdprep ≤90 s | Mix | Klaar · geen forbidden screens |
| U4 | Captain briefing | Captain | ≤60 s script+cues |
| U5 | Trainer push | Trainer | Push ≤5 min · speelster ziet WeekCard |
| U6 | Reflectie → leerpunt | Mix | Leerpunt op S-20 |

Steekproef lab: bij voorkeur **alle** speelsters U3+U6 light; U1/U2 gericht; U4/U5 verplicht.

## 2.3 Field usability (D2–D3)

| Check | Wanneer | Pass-signaal |
|-------|---------|--------------|
| WeekCard gevonden na push | Ma week A/B | ≥80% opent L4 of oefening vóór training 1 |
| Matchday open vóór wedstrijd | Za | ≥60% opent S-51 (ARCH §9.4) |
| Reflectie completion | Na wedstrijd | ≥50% voltooit S-54 (ARCH §9.4) |
| Positie → L2 | Anytime | Mediaan <10 s (ARCH §9.4) |

## 2.4 Severity-classificatie (usability)

| Severity | Definitie | Impact GO/NO-GO |
|----------|-----------|-----------------|
| **S0 Kritiek** | Blokkeert taak · dataverlies · geen exit · verkeerde positie-content systematisch | **NO-GO** als ≥1 unresolved |
| **S1 Major** | Taak lukt alleen met hulp · tijd >2× budget | Max 2 open; anders NO-GO |
| **S2 Minor** | Irritatie · 1 extra tap · copy onduidelijk | Mag door · backlog P1 |
| **S3 Cosmetisch** | Visueel/low-fi klacht | Negeren in pilot (geen redesign) |

---

# 3. Learning Validation

Meting **vóór (T0)** en **ná (T7)** + tussentijdse veldmetingen.  
Focus: **gedragsverandering**, niet “app leuk”.

## 3.1 Begrip (comprehension)

**Vraag:** Begrijpt de speelster de voetbalprincipes van het weekthema?

| Instrument | Format |
|------------|--------|
| Pre/Post quiz | 5 items · week A + 5 items week B · spelerstaal · geen PB-nummers |
| Score | 0–5 correct · % verbetering T0→T7 (zelfde items of parallelvorm) |

**Voorbeelditems week A (Eerste pass):**  
1. Wat bepaalt de eerste pass na balwinst? (meerkeuze)  
2. Wanneer speel je bewust tempo eruit? (meerkeuze)  
3. Eigen positie: noem 1 actie die jij doet na win (open, 1 zin)

**Pass learning (begrip):** ≥80% van speelsters scoort **hoger** post dan pre **of** post ≥4/5.

## 3.2 Toepassing (transfer)

**Vraag:** Voert zij het tijdens training / wedstrijd uit?

| Moment | Instrument | Score |
|--------|------------|-------|
| Training | Trainer TPL-checklist (3 punten) per speelster | 0–3 zichtbaar |
| Wedstrijd | Coach micro-observatie (max 3 speelsters diep per match) + captain input | Rubric 1–5 |

**Toepassingsrubric (1–5):**  
1 = niet zichtbaar · 2 = zeldzaam · 3 = soms / na coaching · 4 = vaak zelfstandig · 5 = consistent + coacht anderen

**Pass:** Mediaan coachscore training ≥3,5 na week B **én** ≥70% speelsters +1 t.o.v. T0 baseline.

## 3.3 Vertrouwen (self-efficacy)

**Vraag:** Voelt zij zich zekerder?

| Item (1–5 Likert) | T0 | T7 |
|-------------------|----|----|
| “Ik weet wat ik moet doen bij [weekprincipe]” | ✓ | ✓ |
| “Ik durf dit in de wedstrijd toe te passen” | ✓ | ✓ |
| “De Academy helpt mij concreet” | — | ✓ |

**Pass:** Gemiddelde self-efficacy +≥0,5 punt T0→T7 **of** ≥70% individueel gestegen.

## 3.4 Retentie

**Vraag:** Weet zij het een week later nog?

| Moment | Test |
|--------|------|
| T4 (start week B) | 3-item retentietoets over week A **zonder** app openen eerst |
| Optioneel T7 | Spontane recall: “Noem jouw 3 acties van vorige week” |

**Pass:** ≥70% ≥2/3 correct op T4.

## 3.5 Coach-observatie

**Vraag:** Ziet de trainer daadwerkelijk gedragsverandering?

| Instrument | Details |
|------------|---------|
| Baseline T0 | Rubric per speelster op doelgedrag week A/B |
| T2 / T5 | Post-training score |
| T3 / T6 | Post-match score (sample) |
| T7 | Globale stelling: “Gedrag verbeterd door Academy” (1–5) |

**Pass (ARCH-aligned):** Trainer **agree ≥70%** (score ≥4 op T7 globaal) **én** ≥60% speelsters +≥1 op individuele rubric.

## 3.6 Learning design — weekcyclus in pilot

```
Ma  Trainer push (U5) → Speelsters L4 + oefening
Di  Training 1 — TPL observe (toepassing)
Do  Training 2 — herhaling ankers
Vr  L2 + L3 (match prep)
Za  Wedstrijd — S-51 ≤90s · na: reflectie
Zo  Retentie / coach notities
```

Geen parallelle nieuwe PB's. Geen L5 als default.

---

# 4. Meetbare KPI's

## 4.1 Usability KPI's

| KPI ID | KPI | Definitie | Target (GO) | Stretch |
|--------|-----|-----------|-------------|---------|
| U-01 | Time-to-content | Mediaan sec Positie → juiste L2/L4 | <10 s | <7 s |
| U-02 | Task success | % taken U1–U6 zonder major assist | ≥90% | ≥95% |
| U-03 | Wrong taps | Mediaan verkeerde taps per taak | ≤2 | ≤1 |
| U-04 | Completion reflectie | % speelsters voltooit S-54 na wedstrijd | ≥50% | ≥70% |
| U-05 | Matchday open | % opent S-51 vóór kickoff | ≥60% | ≥75% |
| U-06 | Week engagement | % opent WeekCard/L4 vóór training 1 | ≥80% | ≥90% |
| U-07 | NPS speelster | “Aanbevelen aan teammate” 0–10 → NPS | >40 | >50 |
| U-08 | SUS-light | 4 items / 0–100 genormaliseerd | ≥70 | ≥80 |
| U-09 | Critical bugs | Aantal S0 open einde pilot | **0** | 0 |
| U-10 | Major bugs | Aantal S1 open | ≤2 | 0 |

## 4.2 Learning KPI's

| KPI ID | KPI | Definitie | Target (GO) | Stretch |
|--------|-----|-----------|-------------|---------|
| L-01 | Begrip Δ | % speelsters post > pre of post ≥4/5 | ≥80% | ≥90% |
| L-02 | Retentie | % ≥2/3 op T4 | ≥70% | ≥85% |
| L-03 | Self-efficacy Δ | % gestegen of mean +≥0,5 | ≥70% | ≥85% |
| L-04 | Training transfer | Mediaan TPL zichtbaar 0–3 @ T5 | ≥2/3 | ≥2,5/3 |
| L-05 | Coach rubric Δ | % speelsters +≥1 T0→T7 | ≥60% | ≥75% |
| L-06 | Coach agree | Trainer T7 “gedrag verbeterd” ≥4 | ≥70% agree* | ≥85% |
| L-07 | Match transfer | Sample mediaan rubric wedstrijd ≥3,5 | ≥3,5 | ≥4,0 |

\*Bij 1 trainer: score ≥4 = pass op L-06; bij assistent-observer: ≥70% van coach-ratings ≥4.

## 4.3 Rol-KPI's

| KPI ID | Rol | Target |
|--------|-----|--------|
| R-01 | Captain briefing ≤60 s success | Pass U4 |
| R-02 | Trainer push ≤5 min + team ziet week | Pass U5 |
| R-03 | Captain: “bruikbaar in kleedkamer” ≥4/5 | ≥4 |

## 4.4 KPI-dashboard (rapport)

Eén tabel: KPI · Target · Gemeten · Pass/Fail · Evidence (sheet/timestamp).

---

# 5. Feedbackformulieren

Scores: Likert **1 = helemaal oneens → 5 = helemaal eens**, tenzij anders.  
Open: max 2–3 zinnen.  
Invullen: na lab (deels) + T7 volledig.

---

## 5.1 Formulier Speelster

**ID:** `FORM-SP-v1` · **Anonimiteit:** code i.p.v. naam (bijv. SP-07)

### A. Gebruik

| # | Vraag | Type |
|---|-------|------|
| S1 | Ik vond snel wat ik zocht | 1–5 |
| S2 | Ik begreep de knoppen/labels zonder uitleg | 1–5 |
| S3 | 20 sec / 2 min was duidelijk genoeg | 1–5 |
| S4 | Wedstrijd-voorbereiding was te doen in weinig tijd | 1–5 |
| S5 | Ik zou de Academy aanbevelen (0–10) | NPS |
| S6 | Hoe vaak heb je de app deze week geopend? | 0 / 1–2 / 3–5 / 6+ |

### B. Leren & vertrouwen

| # | Vraag | Type |
|---|-------|------|
| S7 | Ik begrijp het weekprincipe beter dan ervoor | 1–5 |
| S8 | Ik weet wat **ik** op mijn positie moet doen | 1–5 |
| S9 | Ik voel me zekerder om het toe te passen | 1–5 |
| S10 | Ik heb het op training geprobeerd | Ja / Nee / Deels |
| S11 | Ik heb het in de wedstrijd herkend/toegepast | Ja / Nee / Deels / N.v.t. |

### C. Open

| # | Vraag |
|---|-------|
| S12 | Wat hielp je het meest? |
| S13 | Waar liep je vast of raakte je in de war? |
| S14 | Wat miste je (zonder nieuwe features te eisen — wat frustreerde)? |

---

## 5.2 Formulier Captain

**ID:** `FORM-CA-v1`

### A. Briefing

| # | Vraag | Type |
|---|-------|------|
| C1 | Ik kon de 60s briefing snel openen | 1–5 |
| C2 | Script + roepen waren bruikbaar in de kleedkamer | 1–5 |
| C3 | Zonder trainer-push was duidelijk dat ik moest wachten | 1–5 |
| C4 | Help teammate (andere positie L2) was nuttig | 1–5 / N.v.t. |
| C5 | Tijd om briefing klaar te hebben (schatting) | <30s / 30–60 / >60 |

### B. Team & leren

| # | Vraag | Type |
|---|-------|------|
| C6 | Speelsters praatten over het weekthema | 1–5 |
| C7 | Ik zag verschil in gedrag t.o.v. vorige weken | 1–5 |
| C8 | Rust-info was bruikbaar (indien gebruikt) | 1–5 / N.v.t. |

### C. Open

| # | Vraag |
|---|-------|
| C9 | Wat werkte in de kleedkamer? |
| C10 | Wat frustreerde jou of het team? |
| C11 | Eén verbetering die wél binnen huidige schermen past |

---

## 5.3 Formulier Trainer

**ID:** `FORM-TR-v1`

### A. Workflow

| # | Vraag | Type |
|---|-------|------|
| T1 | WeekPlan kiezen + TPL + push was snel genoeg | 1–5 |
| T2 | Ik hoefde geen PB-nummers te jagen | 1–5 |
| T3 | Oefening koppelen paste bij training | 1–5 |
| T4 | Tijd voor maandag-push (schatting) | <3 / 3–5 / >5 min |
| T5 | Reflectie-aggregaat was bruikbaar (indien) | 1–5 / N.v.t. |

### B. Gedragsverandering (kern)

| # | Vraag | Type |
|---|-------|------|
| T6 | Speelsters kwamen beter voorbereid naar training | 1–5 |
| T7 | Ik zag het weekprincipe terug in training | 1–5 |
| T8 | Ik zag het terug in de wedstrijd | 1–5 |
| T9 | Gedrag is verbeterd door de Academy (globaal) | 1–5 **(L-06)** |
| T10 | % speelsters met zichtbare vooruitgang (schatting) | <40 / 40–60 / 60–80 / >80% |

### C. Observatie (per speelster — bijlage)

Gebruik aparte sheet: `SP-code | Positie | Rubric T0 | T2 | T5 | T7 | Notitie`  
Rubric 1–5 volgens §3.2.

### D. Open

| # | Vraag |
|---|-------|
| T11 | Sterkste bewijs van leerwinst (concreet moment) |
| T12 | Grootste usability- of contentprobleem |
| T13 | Zou je dit een heel seizoen willen draaien? Waarom wel/niet? |

---

# 6. Pilot Rapport (template)

**Document:** `VRZ1-Pilot-Report-YYYY-MM.md`  
**Invullen na T7 · max 8–10 pagina's equivalent**

## 6.1 Structuur

```
1. Executive summary (½ p)
   - GO / NO-GO
   - 3 kerncijfers usability
   - 3 kerncijfers learning
2. Methode
   - N per groep · duur · week A/B · dropouts
3. Usability-resultaten
   - KPI-tabel U-01…U-10
   - Scenario U1–U6 pass/fail
   - Severity-log S0–S3
   - Quotes (geanonimiseerd)
4. Leerresultaten
   - KPI-tabel L-01…L-07
   - Begrip pre/post
   - Retentie T4
   - Vertrouwen Δ
   - Coach-observatie + T9
5. Observaties (kwalitatief)
   - Linie-verschillen (VER/MID/AAN)
   - Captain / Trainer
   - Matchday / offline
6. Verbeterpunten (alleen frozen-scope)
   - P0 / P1 / P2 backlog
   - Expliciet: wat NIET gedaan wordt (nieuwe schermen/features)
7. Prioriteiten voor implementatiefase
   - Alleen bij GO
8. Bijlagen
   - KPI raw · formulier-aggregates · consent log
```

## 6.2 Verbeterpunten — prioritering

| Prio | Regel |
|------|-------|
| **P0** | Blokkeert GO of S0 — fix vóór implementatie-start (copy/flow binnen bestaande schermen) |
| **P1** | Major UX of learning friction — meenemen in eerste implementatie-sprint |
| **P2** | Nice-to-have · Later / Phase E |
| **Out of scope** | Nieuwe schermen · architectuurwijziging · visuele redesign als “oplossing” |

## 6.3 Observatie-richtlijnen in rapport

- Scheid **usability-falen** vs **content/leer-falen**  
- Scheid **app niet gebruikt** vs **app gebruikt maar geen transfer**  
- Geen individuele naming  

---

# 7. GO / NO-GO Criteria

## 7.1 Harde eisen (alle verplicht voor CERTIFIED)

| # | Criterium | Bron-KPI |
|---|-----------|----------|
| G1 | ≥90% lab-taken succesvol (U1–U6 gewogen / uitgevoerde taken) | U-02 |
| G2 | 0 open S0 kritieke usabilityproblemen | U-09 |
| G3 | ≤2 open S1 majors | U-10 |
| G4 | Mediaan Positie → L2 <10 s | U-01 |
| G5 | ≥80% speelsters begrip verbeterd / post ≥4/5 | L-01 |
| G6 | Trainer ziet gedragsverbetering (T9 ≥4) | L-06 |
| G7 | ≥60% speelsters +≥1 op coach-rubric T0→T7 | L-05 |
| G8 | Reflectie completion ≥50% (field) | U-04 |
| G9 | Matchday open ≥60% (field) | U-05 |
| G10 | NPS speelsters >40 | U-07 |

## 7.2 Zachte eisen (min. 3 van 5 voor CERTIFIED)

| # | Criterium | KPI |
|---|-----------|-----|
| S1 | Retentie T4 ≥70% | L-02 |
| S2 | Self-efficacy Δ pass | L-03 |
| S3 | Week engagement ≥80% | U-06 |
| S4 | SUS-light ≥70 | U-08 |
| S5 | Captain briefing bruikbaar ≥4 | R-03 |

## 7.3 Automatisch NO-GO

- Steekproef < minimum (10 speelsters + C + T)  
- Trainer niet deelgenomen aan push + T7  
- Scope creep: schermen/architectuur gewijzigd tijdens pilot  
- ≥1 S0 onopgelost  
- Trainer T9 ≤2 (“geen / negatief effect”)  

## 7.4 Besluitmatrix

| Uitkomst | Conditie | Volgende stap |
|----------|----------|---------------|
| **VRZ1 PILOT CERTIFIED** | Alle G1–G10 + ≥3 soft | → Implementatiefase (Phase E product build) |
| **CONDITIONAL** | G's bijna · max 1 G fail niet-S0 · plan P0 ≤2 weken retest | Retest alleen failed KPI's · geen feature build |
| **NO-GO** | S0 · of ≥2 G fails · of auto NO-GO | Terug naar C.x fix (copy/flow) · **geen** implementatie |

```
╔══════════════════════════════════════════╗
║  Bij CERTIFIED:                          ║
║  ✅ VRZ1 PILOT CERTIFIED                 ║
║  Implementatiefase MAG starten           ║
║  Architectuur/Journey/Wireframes blijven ║
║  frozen tenzij ACR                       ║
╚══════════════════════════════════════════╝
```

---

# 8. Rollen & verantwoordelijkheden

| Rol | Verantwoordelijkheid |
|-----|----------------------|
| **Product owner** | Change freeze · GO/NO-GO voorzitter |
| **Facilitator** | Lab · formulieren · tijdsmeting |
| **Observer** | Fouten · quotes · severity |
| **Trainer** | Push · TPL · rubric · FORM-TR |
| **Captain** | Briefing · FORM-CA |
| **Speelsters** | Taken · field use · FORM-SP |
| **Analyst** | KPI-tabel · rapportconcept |

---

# 9. Ethiek & privacy

- Deelname vrijwillig · geen selectie-impact  
- Data: codes SP-xx · geen publieke individuele leer-scores  
- Minderjarigen: ouder/voogd consent  
- Opnames (optioneel): aparte toestemming · wissen na analyse  

---

# 10. Phase D Certification Block

```
ACADEMY-PILOT-v1.0
Phase: D — VRZ1 Pilot & Learning Validation

Pilot design:     COMPLETE
Groups:           Nieuw · VER · MID · AAN · Captain · Trainer
Duration:         ±4 weken (D0–D4)
Usability:         Lab U1–U6 + field U-01…U-10
Learning:         Begrip · Toepassing · Vertrouwen · Retentie · Coach
Forms:            FORM-SP · FORM-CA · FORM-TR
Report template:  §6
GO/NO-GO:         G1–G10 hard · soft S1–S5 · auto NO-GO rules

STATUS (design):  ✅ READY TO RUN PILOT

STATUS (outcome): ⏳ PENDING — invullen na T7:
  [ ] VRZ1 PILOT CERTIFIED
  [ ] CONDITIONAL (retest)
  [ ] NO-GO

Implementatiefase: BLOKKEERD tot CERTIFIED.
```

---

## Bijlage A — Pre/Post begrip sheet (template)

`SP-code | Week | Item1-5 pre | Item1-5 post | Δ | Pass Y/N`

## Bijlage B — Coach rubric sheet (template)

`SP-code | Positie | Linie | T0 | T2 | T5 | T7 | Δ | Notitie gedrag`

## Bijlage C — Severity log (template)

`ID | Scherm | Severity | Beschrijving | Repro | Status | Prio`

## Bijlage D — Koppeling Architecture §9.4

| ARCH metric | Pilot KPI |
|-------------|-----------|
| Wedstrijddag open >60% | U-05 / G9 |
| Reflectie >50% | U-04 / G8 |
| Trainer gedrag >70% | L-06 / G6 |
| Positie → L2 <10s | U-01 / G4 |
| NPS >40 | U-07 / G10 |

---

*Document: `academy-vrz1-pilot-learning-validation-v1.0.md`*  
*Prev: Phase C.2 Prototype Ready · Next: Run pilot → CERTIFIED → Implementatiefase*
