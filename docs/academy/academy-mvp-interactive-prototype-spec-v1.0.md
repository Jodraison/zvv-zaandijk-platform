# Academy Interactive Prototype Specification — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** C.2 — Interactive Prototype Specification  
**Architecture:** `ACADEMY-ARCH-v1.1`  
**Schema:** `academy-content-schema` v1.1.0  
**Registries:** problems · situations · playbooks · positions · visuals · tags  
**Design System:** `ACADEMY-PDS-v1.0`  
**Journey:** `ACADEMY-JOURNEY-v1.0`  
**Wireframes:** `ACADEMY-WIRE-v1.0`  

**Scope:** Klikbaar prototype · volledige interactie · **geen** visueel design · **geen** productiecode · **geen** Next.js/React/Tailwind · **geen** backend/DB/API

> **Prototype-regel:** Alle navigatie en state worden **gesimuleerd** (mock fixtures).  
> **Doel:** VRZ1 kan alle MVP-flows doorlopen zonder verdere UX-beslissingen.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **PROTOTYPE READY (pending cert)** | 4 persona-flows · screen matrix · testscript · validatie |

---

# 0. Prototype-model (simulatie)

## 0.1 Wat het prototype IS

| Aspect | Specificatie |
|--------|--------------|
| Medium | Low-fi klikbaar prototype (Figma / ProtoPie / equivalent) — tool-keuze vrij |
| Fidelity | Wireframe-niveau · grijstinten · labels = echte NL copy |
| Data | **Mock fixtures** (geen live API) |
| Auth | Gesimuleerd: persona-picker startscherm |
| Rollen | Speelster · Captain · Trainer (Staff/Admin out of MVP prototype scope) |

## 0.2 Wat het prototype NIET is

- Visuele huisstijl / design tokens  
- Productie-routing / echte push  
- Echte offline cache-engine (wel: offline **state toggle**)  
- L5 full markdown render (wel: L5 tab + placeholder “§8 Positie”)  

## 0.3 Mock fixtures (vast voor tests)

| Fixture ID | Inhoud |
|------------|--------|
| `F.week.pushed` | WeekPlan `pb.27` “Eerste pass” · exercise “Rondje eerste pass · 4 min” · TPL×3 · `pushed_at` set |
| `F.week.empty` | Geen push · WeekCard empty state |
| `F.match.pre` | Zaterdag · 30 min vóór · opponent “WSV” |
| `F.match.ht` | Rust · stand 1-0 |
| `F.match.post` | Eind · reflectie open |
| `F.user.lisa.new` | Geen onboarding · geen leerpunt · LB primary |
| `F.user.lisa.existing` | Onboarded · LB · leerpunt actief · week pushed |
| `F.user.rb` | Primary `pos.rb` · probleem-focus uitstappen |
| `F.role.captain` | Captain + speelster bottom nav |
| `F.role.trainer` | Trainer + speelster bottom nav |
| `F.offline.on` | OfflineBanner · cached L2/L3 week |
| `F.offline.off` | Online |

## 0.4 Persona start (prototype entry)

```
[Prototype Start]
  ├── 1. Nieuwe speelster (Lisa)     → S-10
  ├── 2. Bestaande speelster (Lisa)  → S-20 + F.week.pushed
  ├── 3. Rechtsback (zoek-pad)       → S-20 + F.user.rb
  ├── 4. Captain                     → S-70 + F.week.pushed
  ├── 5. Trainer                     → S-71 + F.week.empty (draft)
  └── 6. Matchday speelster          → S-20 + F.match.pre
```

---

# 1. Prototype Flow Specification

## 1.1 Flow A — Nieuwe speelster (Lisa)

```
START persona 1
  → S-10 Onboarding Positie
      [Kies Linksback] → [Volgende]
      [Skip secondary of kies L6]
      [Bevestig 4e klasse]
  → S-11 Onboarding Problemen
      [Max 2: "Ik speel te snel weg" + "Ik weet niet wanneer uitstappen"]
      [Start Academy]
  → S-20 Positie
      state: F.week.empty OF toggle F.week.pushed
      [WeekCard] → S-40?layer=L4 (pb.27)
          [Oefening] → S-46
          [Back] → S-40 → [Back] → S-20
      OR empty: [Situatie]/] / [Probleem COP] browsen
END: Lisa ziet oefening S-46
```

**Succes:** Eerste oefening bereikt ≤8 min (Journey scenario 1).

---

## 1.2 Flow B — Bestaande speelster (weekcyclus)

```
START persona 2 → S-20 (F.week.pushed)
  → Quick [20 sec] → S-40?layer=L2 → Back → S-20
  → Quick [Visual] → S-40?layer=L1 → Back → S-20
  → WeekCard → S-40?layer=L4 → tab Volledig (L5 placeholder) → Back
  → Bottom Situatie → S-30 → S-31 → S-32 → S-40
  → Bottom Probleem → S-35 → S-36 → S-40 L2
  → Bottom Seizoen → S-60 → S-61 → Back → S-60
  → Header [Positie ▼] → S-02 → switch L6 → S-20 herlaadt ankers
END
```

---

## 1.3 Flow C — Matchday (90 sec + reflectie)

```
START persona 6 → S-20 (F.match.pre)
  → Quick [Wedstrijd] → S-51 (skip S-50)
      [Toggle checklist ×3]
      [Lees TwentySecCard]
      [Toon Visual] optional
      [Klaar] → dismiss → S-20
  → (simulate F.match.post)
  → Bottom Wedstrijd → S-50 → Phase Na → S-53
      [Reflecteer] → S-54
          V1 → V2 → V3 → [Opslaan]
      → S-55 → [Naar Positie] → S-20 (LeerpuntCard visible)
END
```

**Hot-path verboden op S-51:** L5 · Seizoen · Probleem · Zoek · L4.

---

## 1.4 Flow D — Captain

```
START persona 4 → S-70 (F.week.pushed)
  → Expand CaptainCard (60s script)
  → Scan TeamAgreementList (3)
  → CueList [Copy] ×1
  → [Help teammate] → S-02 pick RB → S-40?layer=L2
  → Bottom Positie → S-20 (eigen view)
  → (optional F.match.ht) Rust teaser → S-52 + RustNote
END ≤60s briefing-pad
```

**Empty pad:** `F.week.empty` → EmptyState “Wacht op trainer push” · exit via bottom Positie.

---

## 1.5 Flow E — Trainer push

```
START persona 5 → S-71 (F.week.empty)
  → WeekPlanCard [Kies PB: Eerste pass]
  → TPLPointEditor [3 punten invullen]
  → ExerciseCard [koppel oefening]
  → [Push naar team] → Confirm → Toast
      mock: switch fixture → F.week.pushed
  → [Fragment bespreken] → S-40?layer=L5
  → Bottom Positie (als speelster-view) OF blijf S-71
END ≤5 min
```

**Cross-persona check:** Na push → open persona 2 → WeekCard zichtbaar.

---

## 1.6 Screen Interaction Matrix

Legenda: **IN** = inkomende routes · **OUT** = uitgaande · **CLICK** = klikbaar · **DIS** = disabled · **EMP** = empty · **LOAD** = loading · **OFF** = offline · **ERR** = error · **BACK** = terug · **DEEP** = deep link

---

### S-00 · App Shell

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Altijd om elk scherm |
| **OUT** | Header → S-01, S-02, S-03; Bottom → S-20/S-30/S-35/S-50/S-60 |
| **CLICK** | Positie badge · Zoek · Profiel · 5 tabs |
| **DIS** | Bottom tabs tijdens S-54 (confirm discard) |
| **EMP/LOAD** | n.v.t. |
| **OFF** | OfflineBanner slot |
| **ERR** | Auth fail → buiten scope (bestaand platform) |
| **BACK** | System back = screen Back |
| **DEEP** | n.v.t. |

---

### S-01 · Zoek Overlay

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Header 🔍 overal |
| **OUT** | Result → S-32 / S-36 / S-40 L2 / Cue fragment; Dismiss → origin |
| **CLICK** | Input · result rows · clear · dismiss |
| **DIS** | Results tot ≥1 char (MVP) |
| **EMP** | “Geen resultaten” |
| **LOAD** | Skeleton groups |
| **OFF** | Zoek in static registry (problems/situations/cues) |
| **ERR** | Retry |
| **BACK** | Dismiss |
| **DEEP** | `/zoek?q=` |

---

### S-02 · Positie Switcher

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Header Positie ▼ · Captain Help teammate |
| **OUT** | Opslaan → origin herlaadt · Help path → S-40 L2 |
| **CLICK** | 11 PositionCards · Secondary toggle · Opslaan · Cancel |
| **DIS** | Opslaan tot primary gekozen |
| **EMP** | n.v.t. |
| **LOAD** | Instant mock |
| **OFF** | Local save queue |
| **ERR** | Toast + behoud vorige |
| **BACK** | Cancel/dismiss |
| **DEEP** | n.v.t. |

---

### S-03 · Rol / Profiel Menu

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Header Profiel |
| **OUT** | Captain → S-70 · Trainer → S-71 · Logout (sim) |
| **CLICK** | Role badges (gated) · Instellingen (placeholder) |
| **DIS** | Rollen zonder grant |
| **EMP** | — |
| **LOAD** | — |
| **OFF** | Rol-switch lokaal |
| **ERR** | “Geen toegang” |
| **BACK** | Dismiss |
| **DEEP** | `/team/captain` · `/team/trainer` |

---

### S-10 · Onboarding Positie

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Persona 1 · first-launch flag |
| **OUT** | Volgende → S-11 |
| **CLICK** | PositionCard ×11 · Secondary optional · Ervaring · Volgende |
| **DIS** | Volgende tot primary gekozen |
| **EMP** | — |
| **LOAD** | — |
| **OFF** | Mag lokaal doorgaan |
| **ERR** | — |
| **BACK** | Geblokkeerd (of exit prototype) |
| **DEEP** | `/onboarding/positie` |

---

### S-11 · Onboarding Problemen

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-10 |
| **OUT** | Start Academy → S-20 |
| **CLICK** | ProblemCard multi max 2 · Start Academy |
| **DIS** | Start tot ≥1 probleem (prototype: max 2 enforced) |
| **EMP** | — |
| **LOAD** | — |
| **OFF** | Lokaal |
| **ERR** | — |
| **BACK** | → S-10 |
| **DEEP** | `/onboarding/problemen` |

---

### S-20 · Positie Dashboard

| Aspect | Specificatie |
|--------|--------------|
| **IN** | App open · Bottom Positie · S-55 · Push deep link · S-11 |
| **OUT** | Quick 20s→S-40 L2 · Visual→S-40 L1 · Wedstrijd→S-51 · Week→S-40 L4 · Oefening→S-46 · Anker→S-40 · Leerpunt→S-36/S-40 · Shortcut→S-31/S-32 · Vandaag contextual |
| **CLICK** | Alle widgets behalve verborgen zones |
| **DIS** | Quick Wedstrijd nooit disabled (blessure = ignore); Apply zone hidden non-matchweek |
| **EMP** | Week empty “Trainer zet deze week klaar” + links Situatie/Probleem |
| **LOAD** | Skeleton zones 1–7 |
| **OFF** | Banner + cached week/ankers; Quick may error without cache |
| **ERR** | Per-zone Retry |
| **BACK** | Root — exit app / prototype home |
| **DEEP** | `/positie` · `/positie?highlight=week` (push) |

---

### S-30 · Situatie ACE Poorten

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Bottom Situatie |
| **OUT** | MomentGateCard → S-31 |
| **CLICK** | 6 poorten · optional TagFilterChips |
| **DIS** | — |
| **EMP** | — (6 frozen) |
| **LOAD** | Skeleton grid |
| **OFF** | Static registry |
| **ERR** | Retry |
| **BACK** | Root tab |
| **DEEP** | `/situatie` |

---

### S-31 · Situatie Poort Hub

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-30 · shortcuts |
| **OUT** | SituationCard → S-32 of direct S-40 |
| **CLICK** | Core list · Accordion extended |
| **DIS** | — |
| **EMP** | Extended collapsed OK |
| **LOAD** | Skeleton list |
| **OFF** | Static |
| **ERR** | Retry |
| **BACK** | → S-30 |
| **DEEP** | `/situatie/:poort` |

---

### S-32 · Situatie Detail

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-31 · Zoek situation |
| **OUT** | Bekijk Visual → S-40 L1 · 20 sec → S-40 L2 · Back → S-31 |
| **CLICK** | CTAs · PlaybookCard compact |
| **DIS** | CTA als geen linked PB (Later) |
| **EMP** | “Content volgt” |
| **LOAD** | Skeleton |
| **OFF** | Cached if any |
| **ERR** | Retry + Back |
| **BACK** | → S-31 |
| **DEEP** | `/situatie/:poort/:sub` |

---

### S-35 · Probleem Overzicht

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Bottom Probleem · S-20 empty links |
| **OUT** | ProblemCard → S-36 |
| **CLICK** | 7 MVP cards · Accordion Later 3 |
| **DIS** | — |
| **EMP** | n.v.t. |
| **LOAD** | Skeleton rows |
| **OFF** | Static registry |
| **ERR** | Fallback static 7 |
| **BACK** | Root tab |
| **DEEP** | `/probleem` |

---

### S-36 · Probleem Fix Flow

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-35 · Zoek · Leerpunt |
| **OUT** | Start 20 sec → S-40 L2 · Visual → S-40 L1 · chip → S-40 |
| **CLICK** | Primary · Secondary · chips |
| **DIS** | Primary als geen pb_refs (Later problems thin) |
| **EMP** | “Content komt binnenkort” |
| **LOAD** | Skeleton FocusLine |
| **OFF** | CTA if cached |
| **ERR** | Retry + Back S-35 |
| **BACK** | → S-35 (of Zoek dismiss) |
| **DEEP** | `/probleem/:slug` e.g. `uitstappen-twijfel` |

---

### S-40 · Content Shell

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Alle content entries met `?layer=` + origin stack |
| **OUT** | Tabs → S-41…S-45 panels · Back → origin · Oefening links → S-46 |
| **CLICK** | StickyLayerTabs · overflow pin menu · Back |
| **DIS** | Apply tab greyed buiten match-context (`aria-disabled`) |
| **EMP** | Panel-level |
| **LOAD** | Skeleton panel · tabs lock tot data |
| **OFF** | L1–L3 week cache; L4/L5 may fail |
| **ERR** | PB missing → Error + Back |
| **BACK** | Origin (S-20/S-32/S-36/S-71/…) |
| **DEEP** | `/content/:pb?layer=L2` — **geen PB# in UI label** |

**Default layer (prototype logic):**

| Entry | Default |
|-------|---------|
| Week / anker / training | L4 |
| Quick 20s / Probleem / Zoek problem | L2 |
| Quick Visual / Situatie Visual CTA | L1 |
| Trainer fragment | L5 |

---

### S-41 · Visual (panel)

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Tab Visual |
| **OUT** | Ga naar 20 sec → tab L2 |
| **CLICK** | VisualViewer · Legend · CTA |
| **DIS** | — |
| **EMP** | “Visual volgt” + CTA 20 sec |
| **LOAD** | 16:9 skeleton |
| **OFF** | Cached image or empty |
| **ERR** | Empty + CTA |
| **BACK** | Shell Back |
| **DEEP** | `?layer=L1` |

---

### S-42 · 20 sec (panel)

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Tab 20 sec |
| **OUT** | Apply CTA → tab L3 (match only) |
| **CLICK** | Card (read) · Apply secondary |
| **DIS** | Apply secondary hidden non-match |
| **EMP** | Shared fallback badge |
| **LOAD** | 4-line skeleton |
| **OFF** | Cached week L2 (**Should**) |
| **ERR** | Retry |
| **BACK** | Shell |
| **DEEP** | `?layer=L2` |

---

### S-43 · Apply (panel)

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Tab Apply (enabled) |
| **OUT** | ExerciseLink → S-46 · Klaar → S-51/S-20 |
| **CLICK** | 3 checkboxes · links · Klaar |
| **DIS** | Hele tab greyed non-match — panel niet openen |
| **EMP** | Hide exercise if none |
| **LOAD** | Skeleton checklist |
| **OFF** | Local toggle queue |
| **ERR** | Retry |
| **BACK** | Shell |
| **DEEP** | `?layer=L3` (ignored if non-match → toast + L2) |

---

### S-44 · 2 min (panel)

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Tab 2 min |
| **OUT** | Oefening → S-46 · Dieper → tab L5 |
| **CLICK** | CTAs · bullet groups (read) |
| **DIS** | — |
| **EMP** | Shared fallback |
| **LOAD** | 3 group skeletons |
| **OFF** | May error without cache |
| **ERR** | Retry |
| **BACK** | Shell |
| **DEEP** | `?layer=L4` |

---

### S-45 · Volledig (panel)

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Tab Volledig · Trainer fragment |
| **OUT** | Optional “Terug naar 2 min” |
| **CLICK** | Accordion §8 · ExpandableSections |
| **DIS** | — |
| **EMP** | Placeholder markdown OK in prototype |
| **LOAD** | Lazy on tab open |
| **OFF** | Error unless prefetch |
| **ERR** | Error + link L4 |
| **BACK** | Shell |
| **DEEP** | `?layer=L5` |
| **NOTE** | **Niet** bereikbaar vanuit S-51 hot path |

---

### S-46 · Oefening

| Aspect | Specificatie |
|--------|--------------|
| **IN** | WeekCard link · L4 · L3 · Trainer share |
| **OUT** | PlaybookCard → S-40 L4 · Back → origin |
| **CLICK** | Card · PB link · Back |
| **DIS** | — |
| **EMP** | “Geen oefening deze week” + Back |
| **LOAD** | Skeleton |
| **OFF** | Cached text or error |
| **ERR** | Retry + Back |
| **BACK** | Origin |
| **DEEP** | `/oefening/:ex` of `/content/:pb/oefening` |

---

### S-50 · Wedstrijd Hub

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Bottom Wedstrijd |
| **OUT** | Phase → S-51/S-52/S-53 |
| **CLICK** | PhaseTabs · MatchBanner (read) |
| **DIS** | — |
| **EMP** | Geen match → Empty + link Positie |
| **LOAD** | Skeleton banner |
| **OFF** | Banner + cached vóór |
| **ERR** | Retry |
| **BACK** | Root tab |
| **DEEP** | `/wedstrijd` · `/wedstrijd/:fase` |
| **NOTE** | Quick Wedstrijd **skipt** hub → S-51 |

---

### S-51 · Voor Wedstrijd

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-50 Vóór · Quick · Vandaag CTA · deep `/wedstrijd/voor` |
| **OUT** | Klaar → S-20 · Back → S-50 of S-20 |
| **CLICK** | Checklist · Visual toggle · Klaar |
| **DIS** | Geen Seizoen/Zoek/Probleem entries op scherm |
| **EMP** | Geen week-PB → Empty + Positie |
| **LOAD** | Skeleton |
| **OFF** | Cached L2/L3 or hard error |
| **ERR** | Retry / “cache vrijdag” |
| **BACK** | Entry-dependent |
| **DEEP** | `/wedstrijd/voor` |

---

### S-52 · Rust

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-50 Rust · Captain teaser · deep |
| **OUT** | Back · Captain RustNote expand (inline) · Fallback → S-51 L2 |
| **CLICK** | Delta card · RustNote (captain) |
| **DIS** | Speelster: geen primary CTA |
| **EMP** | Buiten rust-window · of Should-off thin empty |
| **LOAD** | Skeleton |
| **OFF** | Cached delta |
| **ERR** | Fallback S-51 |
| **BACK** | S-50 |
| **DEEP** | `/wedstrijd/rust` |

---

### S-53 · Na Wedstrijd

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-50 Na · F.match.post |
| **OUT** | Reflecteer → S-54 · Later → S-20 |
| **CLICK** | Primary · Secondary |
| **DIS** | Reflecteer hidden if already done → “Naar Positie” |
| **EMP** | — |
| **LOAD** | Instant |
| **OFF** | Start allowed · draft |
| **ERR** | — |
| **BACK** | S-50 |
| **DEEP** | `/wedstrijd/na` |

---

### S-54 · Reflectie

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-53 · deep post-match |
| **OUT** | Opslaan → S-55 · (geen exit zonder confirm) |
| **CLICK** | Inputs · Volgende · Terug · Opslaan · chips V1 |
| **DIS** | Volgende tot valid · Bottom tabs locked |
| **EMP** | — |
| **LOAD** | Saving spinner on Opslaan |
| **OFF** | Queue · S-55 sync badge |
| **ERR** | Retry behoudt answers |
| **BACK** | Stap-1; stap1 confirm discard → S-53 |
| **DEEP** | `/reflectie/:match` |

---

### S-55 · Success

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-54 Opslaan only |
| **OUT** | Naar Positie → S-20 (stack replace) |
| **CLICK** | Primary only |
| **DIS** | — |
| **EMP** | — |
| **LOAD** | — |
| **OFF** | Sync-pending badge |
| **ERR** | — |
| **BACK** | Disabled (replace stack) |
| **DEEP** | n.v.t. |

---

### S-60 · Mijn Seizoen

| Aspect | Specificatie |
|--------|--------------|
| **IN** | Bottom Seizoen |
| **OUT** | Alles → S-61 · Pins/LastViewed → content · Speelboek → S-62/lock |
| **CLICK** | All sections |
| **DIS** | Export n.v.t. hier |
| **EMP** | Reflecties/pins empty copy |
| **LOAD** | Per-section skeleton |
| **OFF** | Cached |
| **ERR** | Isolated Retry |
| **BACK** | Root tab |
| **DEEP** | `/seizoen` |

---

### S-61 · Reflectielog

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-60 |
| **OUT** | Linked → S-40/S-36 · Back → S-60 |
| **CLICK** | Expand cards · links |
| **DIS** | — |
| **EMP** | “Nog geen reflecties” |
| **LOAD** | Skeleton list |
| **OFF** | Cached |
| **ERR** | Retry |
| **BACK** | S-60 |
| **DEEP** | `/seizoen/reflecties` |

---

### S-62 · Speelboek

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-60 teaser |
| **OUT** | Fragment → S-40 · Back → S-60 |
| **CLICK** | Fragments · Export (disabled) |
| **DIS** | Export PDF Later · Locked screen if not unlocked |
| **EMP** | Locked criteria |
| **LOAD** | Compiling skeleton |
| **OFF** | Snapshot cache |
| **ERR** | Retry |
| **BACK** | S-60 |
| **DEEP** | `/seizoen/speelboek` |

---

### S-70 · Captain

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-03 · deep `/team/captain` |
| **OUT** | Help → S-02→S-40 · Rust → S-52 · Bottom → S-20 |
| **CLICK** | Expand · Copy · Help · Rust teaser |
| **DIS** | Rol-gate empty voor non-captain |
| **EMP** | Geen push → “Wacht op trainer” |
| **LOAD** | Skeleton |
| **OFF** | Last pushed cache only |
| **ERR** | Retry |
| **BACK** | Close rol → previous |
| **DEEP** | `/team/captain` |

---

### S-71 · Trainer

| Aspect | Specificatie |
|--------|--------------|
| **IN** | S-03 · deep `/team/trainer` |
| **OUT** | Push → toast + fixture flip · Fragment → S-40 L5 · S-72 link (stub) |
| **CLICK** | PB picker · TPL×3 · Exercise · Push confirm · Aggregate |
| **DIS** | Push tot PB + 3 TPL valid |
| **EMP** | “Kies week-PB” |
| **LOAD** | Skeleton |
| **OFF** | Push queues |
| **ERR** | Validatie / Retry |
| **BACK** | Close rol |
| **DEEP** | `/team/trainer` |

---

## 1.7 Global interaction rules (prototype)

| Regel | Gedrag |
|-------|--------|
| Origin stack | Elke S-40 onthoudt `origin` voor Back |
| Match-context flag | `matchContext=true` vr–za / F.match.* → Apply enabled |
| Week gate | WeekCard content alleen als `pushed_at` |
| Soft skip reflectie | Max 2; 3e = nudge banner op S-53 |
| No PB numbers | Labels altijd menselijk (“Eerste pass”) |
| Prototype offline toggle | Dev control: Online / Offline / Offline+no-cache |

---

# 2. Navigation Validation

## 2.1 Route uniqueness

| Route | Scherm | Uniek |
|-------|--------|-------|
| `/positie` | S-20 | ✅ |
| `/situatie` | S-30 | ✅ |
| `/situatie/:poort` | S-31 | ✅ |
| `/situatie/:poort/:sub` | S-32 | ✅ |
| `/probleem` | S-35 | ✅ |
| `/probleem/:slug` | S-36 | ✅ |
| `/content/:pb` | S-40 | ✅ |
| `/oefening/:ex` | S-46 | ✅ |
| `/wedstrijd` | S-50 | ✅ |
| `/wedstrijd/voor\|rust\|na` | S-51–53 | ✅ |
| `/reflectie/:match` | S-54 | ✅ |
| `/seizoen` | S-60 | ✅ |
| `/seizoen/reflecties` | S-61 | ✅ |
| `/seizoen/speelboek` | S-62 | ✅ |
| `/team/captain` | S-70 | ✅ |
| `/team/trainer` | S-71 | ✅ |
| `/onboarding/*` | S-10/11 | ✅ |
| `/zoek` | S-01 | ✅ |

**Geen dubbele routes.** Geen `/home`. Geen PB-list route.

## 2.2 Bottom tab mapping

| Tab | Route | Altijd exit? |
|-----|-------|--------------|
| Positie | `/positie` | ✅ root |
| Situatie | `/situatie` | ✅ root |
| Probleem | `/probleem` | ✅ root |
| Wedstrijd | `/wedstrijd` | ✅ root |
| Seizoen | `/seizoen` | ✅ root |

## 2.3 Cross-role navigation

| Van | Naar | Pad |
|-----|------|-----|
| Captain S-70 | Eigen Positie | Bottom Positie |
| Trainer S-71 | Content L5 | Fragment |
| Speelster | Captain/Trainer | Alleen met rol-grant |

**Pass:** geen verborgen rol-entry buiten header.

---

# 3. Interaction Validation

## 3.1 Alle primary CTA's bereikbaar

| CTA | Scherm | Bereikbaar zonder hidden gesture |
|-----|--------|----------------------------------|
| Start Academy | S-11 | ✅ |
| Quick 20s/Visual/Wedstrijd | S-20 | ✅ |
| WeekCard / Oefening | S-20 | ✅ |
| Start 20 sec | S-36 | ✅ |
| Layer tabs | S-40 | ✅ |
| Klaar | S-51 | ✅ |
| Reflecteer / Opslaan | S-53/54 | ✅ |
| Naar Positie | S-55 | ✅ |
| Push naar team | S-71 | ✅ |
| Expand CaptainCard | S-70 | ✅ |

## 3.2 Disabled states hebben uitleg

| Disabled | Uitleg |
|----------|--------|
| Apply tab non-match | Tooltip “Alleen rond wedstrijd” |
| Push incompleet | Inline validatie |
| Export PDF | “Binnenkort” |
| L3 deep link non-match | Toast → L2 |
| Volgende reflectie | “Vul 1 punt in” |

## 3.3 Loading / Empty / Offline / Error coverage

Alle schermen in §1.6 hebben de vier states gespecificeerd of expliciet n.v.t.  
**Pass.**

## 3.4 Terug-navigatie

| Type | Regel |
|------|-------|
| Stack screens | Header Back = origin |
| Tab roots | Geen Back — tab switch |
| Overlays S-01/S-02/S-03 | Dismiss |
| S-55 | Stack replace — geen Back naar wizard |
| S-54 | Confirm discard |

**Pass:** geen scherm zonder exit.

## 3.5 Deep links

| Deep link | Landt | Highlight |
|-----------|-------|-----------|
| Push week | S-20 | WeekCard |
| `/wedstrijd/voor` | S-51 | — |
| `/probleem/uitstappen-twijfel` | S-36 | — |
| `/content/pb.27?layer=L2` | S-40 L2 | — |
| `/team/trainer` | S-71 | — |
| `/reflectie/:match` | S-54 | — |

**Pass.**

---

# 4. Dead-end Analyse

## 4.1 Checklist

| Risico | Status | Mitigatie |
|--------|--------|-----------|
| Dead ends | **Geen** | Elke screen: Back of tab root of Klaar/Opslaan |
| Oneindige loops | **Geen** | S-54 max 3 stappen; tabs geen history-push storm (replace layer query) |
| Dubbele routes | **Geen** | §2.1 |
| Scherm zonder exit | **Geen** | §3.4 |
| Verborgen functionaliteit | **Geen Must** | Pin via overflow (gedocumenteerd) · geen long-press-only Must |
| CTA onbereikbaar | **Geen** | §3.1 |
| Empty week trap | **Mitigated** | EmptyState + Situatie/Probleem links |
| Captain zonder push trap | **Mitigated** | Empty + bottom Positie |
| Apply non-match trap | **Mitigated** | Greyed + tooltip · geen dead panel |
| Reflectie trap | **Mitigated** | Later skip · confirm discard |
| L5 matchday trap | **Blocked** | Geen entry vanuit S-51 |
| Offline kleedkamer trap | **Accepted risk** | Should cache · error + vrijdag pre-cache copy |
| S-62 locked trap | **Mitigated** | Lock criteria + Back S-60 |
| S-72 stub | **Accept** | Link “binnenkort” of hide in prototype MVP |

## 4.2 Loop audit (kritiek)

```
S-20 ⇄ S-40 ⇄ S-46     OK (Back origin)
S-35 → S-36 → S-40 → Back S-36 → Back S-35  OK
S-53 → S-54 → S-55 → S-20 (replace)  OK — geen terug naar S-54
S-50 ⇄ S-51/52/53       OK
S-70 → S-02 → S-40 → Back chain → S-70  OK
S-71 Push → fixture → S-20 WeekCard   OK (cross-persona)
```

**Geen oneindige loops.**

## 4.3 Residual risks (niet blocking)

| ID | Risico | Prototype-aanpak |
|----|--------|------------------|
| R-P1 | Offline zonder cache op S-51 | State toggle “no-cache” voor test · documenteer fail |
| R-P2 | Pin overflow discovery | Toon overflow ⋮ op S-40 in prototype |
| R-P3 | S-52 Should off | Empty + fallback knop “Open 20 sec” → S-51 |

**Dead-end analyse: PASS — 0 blockers.**

---

# 5. VRZ1 Testscript

**Team:** ZVV Zaandijk VRZ1 · 16 speelsters · 1 captain · 1 trainer  
**Prototype facilitator:** 1 · **Observer:** 1  
**Duur sessie:** ±45 min  
**Device:** Mobiel primary (prototype frame 390×844)

### Voorbereiding

1. Laad prototype met persona start  
2. Fixtures: `F.week.empty`, `F.week.pushed`, `F.match.pre`, `F.match.post`  
3. Geen visuele score — alleen taakcompletie + tijd + fouten  
4. Think-aloud toegestaan

---

## Scenario 1 — Nieuwe speelster vindt haar eerste oefening

| Veld | Inhoud |
|------|--------|
| **Persona** | Lisa · nieuw · Linksback |
| **Start** | Persona 1 |
| **Doel** | Onboarding afronden en oefening van de week openen |
| **Setup** | Na onboarding facilitator togglet `F.week.pushed` (simuleert trainer push) **of** Lisa wacht tot trainer-scenario 5 eerst |
| **Verwachte tijd** | ≤8 min |
| **Succescriteria** | (1) Primary LB opgeslagen (2) ≤2 problemen (3) Landt S-20 (4) Opent S-46 oefening “Rondje eerste pass” |
| **Mogelijke fouten** | Skip alle problemen · zoekt PB-nummer · blijft in empty week zonder Situatie/Probleem · opent L5 i.p.v. oefening |

**Facilitator prompts (alleen bij stuck >60s):**  
“Waar zou je kijken wat je deze week moet doen?” → WeekCard / empty state.

---

## Scenario 2 — Rechtsback zoekt hulp bij uitstappen

| Veld | Inhoud |
|------|--------|
| **Persona** | Bestaande speelster · `pos.rb` |
| **Start** | Persona 3 |
| **Doel** | Via Probleem (of Zoek) L2 voor uitstappen bereiken |
| **Verwachte tijd** | ≤30–60 s · max 3 taps tot L2 |
| **Succescriteria** | Opent `prob.uitstappen-twijfel` → Start 20 sec → S-40 L2 met **RB**-variant zichtbaar (header badge RB) |
| **Mogelijke fouten** | Gaat Situatie S3 diep zonder CTA · zoekt “PB25” · blijft op S-36 zonder Start · verkeerde positie in header |

**Alternatief pad:** Header Zoek → “uitstappen” → zelfde S-36.

---

## Scenario 3 — Speelster bereidt zich in 90 seconden voor

| Veld | Inhoud |
|------|--------|
| **Persona** | Lisa existing · matchday |
| **Start** | Persona 6 (`F.match.pre`) |
| **Doel** | Klaar voor wedstrijd · telefoon weg |
| **Verwachte tijd** | ≤90 s hard |
| **Succescriteria** | Quick Wedstrijd of bottom → S-51 · ≥1 checklist-vink · leest 20 sec · tikt **Klaar** · **geen** bezoek L5/Seizoen/Probleem tijdens pad |
| **Mogelijke fouten** | Opent L4 “2 min” · browsed Seizoen · blijft Visual te lang · mist Klaar · offline no-cache paniek |

**Observer meet:** stopwatch start bij eerste tap na S-20.

---

## Scenario 4 — Captain opent briefing

| Veld | Inhoud |
|------|--------|
| **Persona** | Captain |
| **Start** | Persona 4 (`F.week.pushed`) |
| **Doel** | 60s script + roepen paraat |
| **Verwachte tijd** | ≤60 s |
| **Succescriteria** | Header → Captain · expand CaptainCard · ziet 3 afspraken · ziet ≥1 cue · (optioneel Copy) |
| **Mogelijke fouten** | Probeert WeekPlan te editen · opent lege state zonder push · zoekt briefing op Positie Quick |

**Negatief pad (apart):** `F.week.empty` → moet Empty begrijpen · exit via Positie.

---

## Scenario 5 — Trainer pusht een weekthema

| Veld | Inhoud |
|------|--------|
| **Persona** | Trainer |
| **Start** | Persona 5 (`F.week.empty`) |
| **Doel** | Week-PB + TPL + oefening pushen |
| **Verwachte tijd** | ≤5 min |
| **Succescriteria** | Kiest “Eerste pass” · 3 TPL · oefening gekoppeld · Push + confirm · toast · (cross-check) speelster S-20 toont WeekCard |
| **Mogelijke fouten** | Push zonder TPL · browsed alle 34 PB’s · opent L5 als eerste actie · vergeet confirm |

---

## Scenario 6 — Speelster vult reflectie in

| Veld | Inhoud |
|------|--------|
| **Persona** | Lisa · post-match |
| **Start** | S-20 → set `F.match.post` → Wedstrijd Na |
| **Doel** | 3 vragen · leerpunt op Positie |
| **Verwachte tijd** | ≤3 min |
| **Succescriteria** | S-53 → S-54 V1–V3 → Opslaan → S-55 → S-20 toont LeerpuntCard |
| **Mogelijke fouten** | Skip Later zonder begrip · verlaat mid-flow via tab (confirm) · lege V3 · Back vanaf S-55 verwacht (mag niet) |

---

## Testscript — scoring

| Scenario | Pass als |
|----------|----------|
| 1 | Oefening S-46 bereikt |
| 2 | L2 uitstappen + RB context |
| 3 | Klaar ≤90 s · geen forbidden screens |
| 4 | Script + cues ≤60 s |
| 5 | Push + speelster WeekCard |
| 6 | Leerpunt op S-20 |

**Prototype certification threshold:** **6/6 scenario's pass** met ≤2 minor assists (facilitator prompt).  
Major assist of task fail = scenario fail.

---

# 6. Prototype Certification

```
ACADEMY-PROTO-v1.0
Phase: C.2 — Interactive Prototype Specification

Sources aligned:
  ✅ ACADEMY-ARCH-v1.1
  ✅ Schema Foundation v1.1.0
  ✅ Registry Foundation (problems/situations/playbooks/…)
  ✅ ACADEMY-PDS-v1.0
  ✅ ACADEMY-JOURNEY-v1.0
  ✅ ACADEMY-WIRE-v1.0

Flows specified:          5 (New · Existing · Matchday · Captain · Trainer)
Screens in interaction matrix:  S-00–03 · S-10–11 · S-20 · S-30–32 · S-35–36
                                S-40–46 · S-50–55 · S-60–62 · S-70–71
Navigation validation:    PASS — unique routes · no /home · tab exits
Interaction validation:   PASS — CTAs · disabled explain · back · deep links
Dead-end analysis:        PASS — 0 blockers · residual risks documented
VRZ1 testscript:          6 scenarios · pass criteria defined

STATUS: ✅ PHASE C.2 — PROTOTYPE READY

Gate to Phase D (VRZ1 Pilot):
  1. Build klikbaar prototype volgens dit document (tool vrij)
  2. Run VRZ1 Testscript §5 — 6/6 pass
  3. User GO op certification
  → Daarna Phase D — VRZ1 Pilot (productie-scope, niet dit document)
```

### Certification checklist (user)

- [ ] Flow specs §1 goedgekeurd  
- [ ] Navigation + Interaction + Dead-end PASS geaccepteerd  
- [ ] VRZ1 Testscript bruikbaar voor facilitators  
- [ ] Residual risks R-P1–P3 geaccepteerd  
- [ ] Expliciete GO: **Phase C.2 PROTOTYPE READY**

---

## Bijlage A — Verboden in prototype-build

- Visuele brand polish als blocker  
- Echte Supabase/Railway koppeling  
- Staff/Admin flows (S-73/S-74)  
- Full-text L5 search  
- PDF export werkend  

## Bijlage B — Minimale klikbare set (build order)

```
1. Persona start + fixtures toggle
2. S-10 → S-11 → S-20
3. S-40 tabs L1–L5 (L5 placeholder)
4. S-35 → S-36 → S-40
5. S-30 → S-31 → S-32 → S-40
6. S-51 + S-53 → S-54 → S-55
7. S-71 Push ↔ S-20 WeekCard
8. S-70 CaptainCard
9. S-46 · S-60/S-61 · S-50/S-52 (Should)
```

---

*Document: `academy-interactive-prototype-spec-v1.0.md`*  
*Prev: Phase C.1 Wireframes · Next: Phase D VRZ1 Pilot (na 6/6 testscript + GO)*
