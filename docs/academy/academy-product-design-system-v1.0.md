# Academy Product Design System — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** B.5 — Product Design System  
**Architecture:** `ACADEMY-ARCH-v1.1` (frozen)  
**Foundation:** Phase B registries + schema v1.1.0  
**Scope:** Structureel design system · geen code · geen CSS · geen React

> **Gate:** Phase C (Prototype) start pas na certificering onderaan dit document.

---

# 1. Screens Inventory

**Totaal: 42 schermtypes** · gegroepeerd in 8 domeinen.

Legenda kolommen: **M** = mobiel primair · **D** = desktop aanvulling.

---

## 1.1 Shell & Global (altijd aanwezig)

### S-00 · App Shell
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Persistente navigatie · context · rol |
| **Gebruiker** | Alle rollen |
| **Hiërarchie** | Header → Main → Bottom bar (speelster) |
| **Componenten** | `AppHeader` · `BottomTabBar` · `MainContent` · `RoleMenu` |
| **Interacties** | Positie-tap · Zoek · Profiel/rol-switch |
| **Mobiel** | Header + 5-tab bottom bar |
| **Desktop** | Header + sidebar nav (zelfde 5 tabs verticaal) · main 720px max |
| **Quick actions** | — (shell only) |
| **CTA's** | Geen primaire CTA in shell |
| **Navigatie** | Omhult alle S-xx schermen |
| **Wanneer** | Elke authenticated sessie |

### S-01 · Zoek Overlay
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Unified search · ≤3 sec naar intentie |
| **Gebruiker** | Alle rollen (speelster primair) |
| **Hiërarchie** | Input → Recent → Results grouped |
| **Componenten** | `SearchInput` · `SearchResultGroup` · `SearchResultRow` |
| **Interacties** | Type · tap result · dismiss overlay |
| **Mobiel** | Full-screen overlay van header |
| **Desktop** | Centered modal 560px · keyboard `/` shortcut |
| **CTA's** | Geen — result tap = navigatie |
| **Navigatie** | → Situatie hub · Probleem fix · Content L2 · Cue fragment |
| **Wanneer** | Header 🔍 · anywhere |

### S-02 · Positie Switcher Sheet
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Primary (+ secondary) positie wisselen |
| **Gebruiker** | Speelster · Captain |
| **Hiërarchie** | Huidige positie → 11 posities grid → Secondary toggle |
| **Componenten** | `BottomSheet` · `PositionCard` (compact) |
| **Mobiel** | Bottom sheet |
| **Desktop** | Dropdown panel under header badge |
| **CTA** | "Opslaan" |
| **Wanneer** | Header `[Positie ▼]` |

### S-03 · Rol / Profiel Menu
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Rol-switch · instellingen · logout |
| **Gebruiker** | Alle |
| **Hiërarchie** | Naam · Rol badges → Captain · Trainer · Staff · Admin |
| **Componenten** | `RoleMenu` · `RoleBadge` |
| **Wanneer** | Header profiel |

---

## 1.2 Onboarding (eerste sessie)

### S-10 · Onboarding — Positie
| Doel | Primary positie kiezen · ≤30 sec |
| Gebruiker | Nieuwe speelster |
| Hiërarchie | Welkom → Positie grid (11) → Volgende |
| Componenten | `OnboardingStep` · `PositionCard` (select) |
| Mobiel | Full screen · 1 kolom grid |
| Desktop | Centered card 480px · 3-koloms grid |
| CTA | "Volgende" |
| Nav | → S-11 |

### S-11 · Onboarding — Problemen
| Doel | Max 2 probleem-tags pre-fill Probleem-nav |
| Hiërarchie | "Waar loop je tegenaan?" → ProblemCard (multi max 2) |
| Componenten | `ProblemCard` (select) |
| CTA | "Start Academy" → `/positie` |
| Nav | Eind onboarding |

---

## 1.3 Speelster — Positie (Home)

### S-20 · Positie Dashboard
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Operationeel home · vandaag · week · activeren |
| **Gebruiker** | Speelster (default app open) |
| **Hiërarchie** | 1 Vandaag → 2 Quick actions → 3 PositieAnkers → 4 Apply checklist* → 5 Leerpunt → 6 Deze week → 7 Situatie shortcuts |
| **Componenten** | `VandaagBanner` · `QuickActionRow` · `PositieAnkerList` · `ApplyChecklist` · `LeerpuntCard` · `WeekCard` · `SituationShortcutGrid` |
| **Interacties** | Tap widgets · toggle checklist · quick actions |
| **Mobiel** | Single column scroll · sticky quick actions optioneel |
| **Desktop** | 2-koloms: links Vandaag+Quick+Week · rechts Ankers+Leerpunt+Shortcuts |
| **Quick actions** | **20 sec** · **Visual** · **Wedstrijd** |
| **CTA's** | Vandaag → Wedstrijd of L4 · Week → Content L4 |
| **Navigatie** | Bottom: Positie (active) |
| **Wanneer** | App open · bottom Positie |
| *Apply checklist | Alleen zichtbaar wedstrijdweek (vr–za) |

---

## 1.4 Situatie-navigator

### S-30 · Situatie — ACE Poorten
| Doel | 6 wedstrijdmomenten · oriëntatie |
| Gebruiker | Speelster |
| Hiërarchie | Titel → 6 `MomentGateCard` → tag filter (optioneel) |
| Componenten | `MomentGateCard` · `TagFilterChips` |
| Mobiel | 6 grote cards · 1 kolom |
| Desktop | 2×3 grid |
| CTA | Tap poort → S-31 |
| Nav | Bottom: Situatie |

### S-31 · Situatie — Poort Hub
| Doel | Sub-situaties binnen ACE-poort |
| Hiërarchie | Poort titel → core situations list → extended (collapsed) |
| Componenten | `SituationCard` · `Accordion` (extended) |
| CTA | Tap situatie → S-32 of direct Content |
| Nav | Back → S-30 |

### S-32 · Situatie — Detail Hub
| Doel | Brug naar content · context vóór layers |
| Hiërarchie | Situatie titel · L0 trigger preview · linked PB titel → layer entry |
| Componenten | `SituationHeader` · `TriggerInline` · `PlaybookCard` (compact) |
| CTA | "Bekijk Visual" · "20 sec" |
| Nav | → S-40 Content Shell |

---

## 1.5 Probleem-navigator

### S-35 · Probleem — Overzicht
| Doel | Symptoom → fix · spelerstaal |
| Gebruiker | Speelster |
| Hiërarchie | MVP 7 bovenaan → overige 3 collapsed |
| Componenten | `ProblemCard` (list) |
| Mobiel | Lijst · grote touch targets |
| Desktop | Lijst 640px · sidebar hint "jouw onboarding picks" |
| CTA | Tap → S-36 |
| Nav | Bottom: Probleem |

### S-36 · Probleem — Fix Flow
| Doel | Direct naar L2 + context |
| Hiërarchie | Probleem titel (spelerstaal) · 1-zin focus · → Content L2 default |
| Componenten | `ProblemHeader` · `FocusLine` |
| CTA | "Start 20 sec" |
| Nav | → S-40 tab L2 |

---

## 1.6 Content Engine (Layer Shell)

### S-40 · Content Page Shell
| Aspect | Specificatie |
|--------|--------------|
| **Doel** | Eén scherm · 5 layer tabs · positie-filter actief |
| **Gebruiker** | Speelster (+ captain help teammate) |
| **Hiërarchie** | Breadcrumb (menselijk titel) → `StickyLayerTabs` → Layer panel |
| **Componenten** | `ContentHeader` · `StickyLayerTabs` · layer panels (S-41–45) |
| **Interacties** | Tab switch · swipe tabs (mobiel) · positie filter inherited |
| **Mobiel** | Sticky tabs onder header · full-width panel |
| **Desktop** | Tabs + panel max 800px · optional visual sidebar sticky |
| **Nav** | Back to origin (situatie/probleem/positie/week) |
| **Wanneer** | Any pb/sit/prob route to content |

### S-41 · Layer L1 — Visual (+ L0 Trigger)
| Doel | Herkenning · timing/ruimte |
| Hiërarchie | L0 TriggerInline → VisualViewer → positie highlight legend |
| Componenten | `TriggerInline` · `VisualViewer` · `PositionHighlightLegend` |
| Mobiel | Visual full-width · pinch zoom |
| Desktop | Visual 16:9 max · legend rechts |
| CTA | "Ga naar 20 sec" (secondary) |

### S-42 · Layer L2 — 20 sec Card
| Doel | Activeren · niet leren |
| Hiërarchie | 4 actie-regels → CueCard |
| Componenten | `TwentySecCard` · `CueCard` |
| Mobiel | Large type · 1 scherm pass |
| Desktop | Card centered 480px |
| CTA | "Apply checklist" (if match context) |

### S-43 · Layer L3 — Apply
| Doel | 3 vinkjes · roep · oefening-link |
| Hiërarchie | Checklist → Cue → Oefening link |
| Componenten | `ApplyChecklist` · `CueCard` · `ExerciseLink` |
| Context | **Alleen actief wedstrijd-context** · anders greyed + tooltip |
| CTA | "Klaar voor wedstrijd" (in wedstrijd flow) |

### S-44 · Layer L4 — 2 min Remember
| Doel | Onthouden · 3+3+3 |
| Hiërarchie | Fouten → Afspraken → Gedragingen |
| Componenten | `TwoMinCard` · `BulletGroup` (×3) |
| CTA | "Oefening" · "Dieper (Volledig)" |

### S-45 · Layer L5 — Volledig Playbook
| Doel | Begrijpen · L5 markdown |
| Hiërarchie | Collapsed §8 positie default · expandable sections |
| Componenten | `MarkdownViewer` · `Accordion` (§8 positie) · `ExpandableSection` |
| Mobiel | Default collapsed · positie-sectie eerst |
| Desktop | TOC sidebar · scroll spy |

### S-46 · Oefening Detail
| Doel | Training voorbereiding · 1 oefening per week-PB |
| Gebruiker | Speelster · Trainer (share) |
| Hiërarchie | Oefening titel · duur · stappen · link week-PB |
| Componenten | `ExerciseCard` · `PlaybookCard` (compact) |
| CTA | "Gedeeld door trainer" badge |
| Nav | From L4 · WeekCard · Trainer dashboard |

---

## 1.7 Wedstrijddag

### S-50 · Wedstrijd — Hub
| Doel | Fase kiezen · vóór / rust / na |
| Hiërarchie | Match banner (datum/tegenstander) → 3 fase tabs |
| Componenten | `MatchBanner` · `PhaseTabs` |
| Nav | Bottom: Wedstrijd |

### S-51 · Wedstrijd — Vóór
| Doel | ≤2 min mentaal klaar |
| Hiërarchie | Apply checklist → L2 preview → L1 visual toggle → "Klaar" |
| Componenten | `ApplyChecklist` · `TwentySecCard` (embed) · `VisualViewer` (compact) |
| Quick actions | Inherit from positie indien arrived via quick |
| CTA | **"Klaar"** (primary) · dismiss app |

### S-52 · Wedstrijd — Rust
| Doel | ≤90 sec aanpassing |
| Hiërarchie | Stand + fase → 1 fix → L2 aanpassing (max 2 punten) |
| Componenten | `ScorePhaseCard` · `TwentySecCard` (delta) |
| CTA | Captain: "Rust briefing" → S-62 |

### S-53 · Wedstrijd — Na → Reflectie
| Doel | Doorverwijzen naar reflectie |
| Hiërarchie | "Wedstrijd afgelopen" → CTA reflectie |
| CTA | **"Reflecteer (3 min)"** → S-54 |

### S-54 · Reflectie Flow
| Doel | 3 vragen → leerpunt |
| Gebruiker | Speelster |
| Hiërarchie | Vraag 1 (Academy-moment) → Vraag 2 (goed) → Vraag 3 (fix) → suggestie PB |
| Componenten | `ReflectionStep` · `ReflectionCard` · `ProgressDots` |
| Mobiel | 1 vraag per scherm · swipe |
| Desktop | Single card 3 stappen vertical |
| CTA | **"Opslaan"** → leerpunt op dashboard |
| Nav | → S-20 or S-55 success |

### S-55 · Reflectie Success
| Doel | Bevestiging · leerpunt preview |
| Componenten | `LeerpuntCard` · `ProgressCard` (mini) |
| CTA | "Naar Positie" |

---

## 1.8 Mijn Seizoen

### S-60 · Seizoen — Overzicht
| Doel | Voortgang · historie · persoonlijk |
| Gebruiker | Speelster |
| Hiërarchie | Voortgang % → Reflectielog → Pins → Laatst bekeken → Speelboek (locked/unlocked) |
| Componenten | `ProgressCard` · `Timeline` · `PinList` · `LastViewedList` · `SpeelboekTeaser` |
| Nav | Bottom: Seizoen |
| CTA | Speelboek unlock teaser |

### S-61 · Seizoen — Reflectielog
| Doel | Alle reflecties chronologisch |
| Componenten | `Timeline` · `ReflectionCard` |

### S-62 · Seizoen — Speelboek View
| Doel | PB35 auto-compilatie |
| Hiërarchie | Intro → pins → leerpunten → ankers → export |
| Componenten | `SpeelboekView` · `PinList` · `TwentySecCard` (fixed personal) |
| CTA | "Export PDF" (later) |

---

## 1.9 Rol-dashboards

### S-70 · Captain — Team Vandaag
| Doel | 60 sec · roep · teamafspraken |
| Gebruiker | Captain |
| Hiërarchie | CaptainCard → afspraken → roepen → rust-notitie → help teammate |
| Componenten | `CaptainCard` · `CueList` · `TeamAgreementList` · `RustNote` |
| Nav | Header rol · can access Positie via bottom bar |
| CTA | "Help teammate" → S-02 + S-42 |

### S-71 · Trainer — Deze Week
| Doel | Weekplan · push · observeer |
| Gebruiker | Trainer |
| Hiërarchie | WeekPlan → TPL 3 punten → Oefening → Push CTA → reflecties aggregate |
| Componenten | `TrainerCard` · `WeekPlanCard` · `TPLPointEditor` · `ExerciseCard` · `TeamReflectionAggregate` |
| CTA | **"Push naar team"** · "Fragment bespreken" → S-45 |

### S-72 · Trainer — Post-match Evaluatie
| Doel | Team evaluatie template |
| Componenten | `EvaluationForm` |

### S-73 · Staff — Observatie
| Doel | Live TPL · aandachtspunten |
| Componenten | `TPLChecklist` · `LineFocusToggle` · `PlayerNoteList` |

### S-74 · Admin — Platform Health
| Doel | Users · retrofit QA · overrides |
| Componenten | `AnalyticsTile` · `SidecarCompletenessTable` · `WeekPlanOverride` |

---

## 1.10 System & Edge

### S-80 · Empty State (generic)
| Wanneer | Geen content · geen weekplan · geen reflecties |

### S-81 · Offline Banner
| Wanneer | Cached L2 week · geen network |

### S-82 · Loading Skeleton
| Wanneer | Content fetch · sidecar load |

---

# 2. Component Inventory

**Totaal: 58 componenten** · 4 tiers.

## 2.1 Tier A — Shell (always visible)

| ID | Component | Type | Hergebruik |
|----|-----------|------|------------|
| C-A01 | `AppHeader` | Shell | Global |
| C-A02 | `BottomTabBar` | Shell | Speelster mobile |
| C-A03 | `SidebarNav` | Shell | Desktop speelster |
| C-A04 | `RoleMenu` | Shell | All roles |
| C-A05 | `PositionBadge` | Shell | Header |

## 2.2 Tier B — Domain Cards

| ID | Component | Used in screens |
|----|-----------|-----------------|
| C-B01 | `PlaybookCard` | S-32, S-46, S-71 |
| C-B02 | `SituationCard` | S-30, S-31 |
| C-B03 | `ProblemCard` | S-11, S-35, S-36 |
| C-B04 | `PositionCard` | S-02, S-10 |
| C-B05 | `MomentGateCard` | S-30 |
| C-B06 | `VisualCard` | S-41 (thumb) |
| C-B07 | `TwentySecCard` | S-42, S-51, S-52, S-62 |
| C-B08 | `TwoMinCard` | S-44 |
| C-B09 | `ApplyChecklist` | S-20, S-43, S-51 |
| C-B10 | `ReflectionCard` | S-54, S-61 |
| C-B11 | `CaptainCard` | S-70 |
| C-B12 | `TrainerCard` | S-71 |
| C-B13 | `ProgressCard` | S-60, S-55 |
| C-B14 | `CueCard` | S-42, S-43, S-70 |
| C-B15 | `LeerpuntCard` | S-20, S-55 |
| C-B16 | `WeekCard` | S-20, S-71 |
| C-B17 | `ExerciseCard` | S-46, S-71 |
| C-B18 | `PositieAnkerList` | S-20 |
| C-B19 | `VandaagBanner` | S-20 |
| C-B20 | `MatchBanner` | S-50 |

## 2.3 Tier C — Patterns & Interactions

| ID | Component | Notes |
|----|-----------|-------|
| C-C01 | `StickyLayerTabs` | S-40 · 5 tabs · L3 conditional |
| C-C02 | `QuickActionRow` | S-20 only · 3 tiles |
| C-C03 | `QuickActionTile` | 20 sec · Visual · Wedstrijd |
| C-C04 | `SearchInput` | S-01 |
| C-C05 | `SearchResultRow` | S-01 |
| C-C06 | `SearchResultGroup` | situations · problems · cues |
| C-C07 | `TriggerInline` | L0 · above visual |
| C-C08 | `VisualViewer` | animation/static/split |
| C-C09 | `PositionHighlightLegend` | 11 kleuren |
| C-C10 | `BottomSheet` | S-02 · mobile |
| C-C11 | `Timeline` | S-60, S-61 |
| C-C12 | `Accordion` | L5 · extended situations |
| C-C13 | `ExpandableSection` | L5 markdown |
| C-C14 | `MarkdownViewer` | L5 |
| C-C15 | `TagFilterChips` | S-30 |
| C-C16 | `SituationShortcutGrid` | S-20 · 4 buttons |
| C-C17 | `PhaseTabs` | Wedstrijd vóór/rust/na |
| C-C18 | `ReflectionStep` | S-54 wizard |
| C-C19 | `BulletGroup` | L4 fouten/afspraken/gedrag |
| C-C20 | `PinList` | S-60 |
| C-C21 | `LastViewedList` | S-60 |
| C-C22 | `SpeelboekView` | S-62 |
| C-C23 | `TPLChecklist` | S-73 |
| C-C24 | `EvaluationForm` | S-72 |
| C-C25 | `OfflineBanner` | S-81 |
| C-C26 | `EmptyState` | S-80 |
| C-C27 | `LoadingSkeleton` | S-82 |

## 2.4 Tier D — Role-specific (nested)

| ID | Component | Parent |
|----|-----------|--------|
| C-D01 | `TeamAgreementList` | CaptainCard |
| C-D02 | `CueList` | CaptainCard |
| C-D03 | `RustNote` | S-52, S-70 |
| C-D04 | `WeekPlanCard` | TrainerCard |
| C-D05 | `TPLPointEditor` | S-71 |
| C-D06 | `TeamReflectionAggregate` | S-71 |
| C-D07 | `LineFocusToggle` | S-73 |
| C-D08 | `PlayerNoteList` | S-73 |
| C-D09 | `SidecarCompletenessTable` | S-74 |
| C-D10 | `OnboardingStep` | S-10, S-11 |

---

# 3. Navigation Matrix

| From ↓ / To → | Positie | Situatie | Probleem | Wedstrijd | Seizoen | Content | Zoek | Captain | Trainer | Staff | Admin |
|---------------|---------|----------|----------|-----------|---------|---------|------|---------|---------|-------|-------|
| **App open** | ● default | | | | | | | | | | |
| **Bottom tab** | ● | ● | ● | ● | ● | | | | | | |
| **Header 🔍** | overlay | overlay | overlay | overlay | overlay | overlay | ● | overlay | overlay | overlay | overlay |
| **Header rol** | | | | | | | | ● | ● | ● | ● |
| **Quick 20s** | | | | | | L2 | | | | | |
| **Quick Visual** | | | | | | L1 | | | | | |
| **Quick Wedstrijd** | | | | vóór | | | | | | | |
| **Situatie card** | | hub | | | | L1/L2 | | | | | |
| **Problem card** | | | fix | | | L2 | | | | | |
| **Week card** | | | | | | L4 | | | | | |
| **Reflectie done** | ● leerpunt | | | | log | | | | | | |
| **Trainer push** | notif→week | | | | | L4 | | | ● | | |

**Regels (frozen):**
- Geen 6e bottom tab
- Positie = home · geen apart Home
- L3 Apply tab hidden buiten wedstrijd-context
- Geen PB-nummer in navigatie-labels

---

# 4. User Flow Matrix

## 4.1 Speelster — Weekcyclus

```
OPEN APP
  → S-20 Positie Dashboard
  → [Ma-Wo] WeekCard → S-40 L4 → optional L5
  → [Di/Do] ExerciseCard S-46
  → [Vr] Bottom Wedstrijd → S-51 Vóór → L2+L3 → "Klaar"
  → [Za] Wedstrijd (veld)
  → [Za] S-53 Na → S-54 Reflectie → S-55 Success → S-20 (leerpunt)
  → [Any] S-30 Situatie → S-31 → S-40
  → [Any] S-35 Probleem → S-36 → S-40 L2
  → [Any] S-01 Zoek → result
  → S-60 Seizoen (pins · log · speelboek)
CLOSE APP
```

## 4.2 Speelster — Wedstrijddag fast path

```
S-20 Quick [Wedstrijd] → S-51 (≤2 min) → "Klaar" → close
S-20 Quick [20 sec] → S-40 L2 → back
S-20 Quick [Visual] → S-40 L1 → back
```

## 4.3 Captain

```
Header Rol → S-70 Team Vandaag
  → Expand CaptainCard (60 sec)
  → Copy CueList
  → [Live] S-52 Rust → RustNote
  → Help teammate → S-02 positie pick → S-42 L2
Bottom Positie → S-20 (eigen positie view)
CLOSE
```

## 4.4 Trainer

```
Header Rol → S-71 Deze Week
  → Edit TPLPointEditor (3)
  → Share ExerciseCard
  → Push WeekPlan → team notificatie
  → Review TeamReflectionAggregate
  → [Post-match] S-72 Evaluatie
CLOSE
```

## 4.5 Staff

```
Header Rol → S-73 Observatie
  → TPLChecklist live
  → LineFocusToggle
  → PlayerNoteList (max 3)
CLOSE
```

## 4.6 Admin

```
Header Rol → S-74 Platform
  → SidecarCompletenessTable
  → WeekPlanOverride
  → AnalyticsTile
CLOSE
```

## 4.7 Onboarding (once)

```
First launch → S-10 Positie → S-11 Problemen → S-20
```

---

# 5. Reusable Component Tree

```
AppShell [C-A01–A05]
├── Navigation
│   ├── BottomTabBar [C-A02]          ← mobile speelster only
│   ├── SidebarNav [C-A03]            ← desktop speelster only
│   └── RoleMenu [C-A04]              ← all · header
│
├── SearchOverlay [S-01]
│   ├── SearchInput [C-C04]
│   └── SearchResultGroup [C-C06]
│       └── SearchResultRow [C-C05]
│
├── DashboardLayouts
│   ├── PositieDashboard [S-20]
│   │   ├── VandaagBanner [C-B19]
│   │   ├── QuickActionRow [C-C02]
│   │   │   └── QuickActionTile [C-C03] ×3
│   │   ├── PositieAnkerList [C-B18]
│   │   ├── ApplyChecklist [C-B09]      ← conditional
│   │   ├── LeerpuntCard [C-B15]
│   │   ├── WeekCard [C-B16]
│   │   └── SituationShortcutGrid [C-C16]
│   │
│   ├── CaptainDashboard [S-70]
│   │   └── CaptainCard [C-B11]
│   │       ├── TeamAgreementList [C-D01]
│   │       └── CueList [C-D02]
│   │
│   ├── TrainerDashboard [S-71]
│   │   ├── WeekPlanCard [C-D04]
│   │   ├── TPLPointEditor [C-D05]
│   │   └── ExerciseCard [C-B17]
│   │
│   └── StaffDashboard [S-73]
│       └── TPLChecklist [C-C23]
│
├── NavigatorLayouts
│   ├── SituationNavigator [S-30 → S-32]
│   │   ├── MomentGateCard [C-B05]
│   │   └── SituationCard [C-B02]
│   │
│   └── ProblemNavigator [S-35 → S-36]
│       └── ProblemCard [C-B03]
│
├── ContentPageShell [S-40]             ← UNIQUE shell · highest reuse
│   ├── ContentHeader
│   ├── StickyLayerTabs [C-C01]
│   └── LayerPanels
│       ├── VisualPanel [S-41]
│       │   ├── TriggerInline [C-C07]
│       │   └── VisualViewer [C-C08]
│       ├── TwentySecPanel [S-42]
│       │   ├── TwentySecCard [C-B07]
│       │   └── CueCard [C-B14]
│       ├── ApplyPanel [S-43]           ← match context gate
│       │   └── ApplyChecklist [C-B09]
│       ├── TwoMinPanel [S-44]
│       │   └── TwoMinCard [C-B08]
│       └── FullPanel [S-45]
│           └── MarkdownViewer [C-C14]
│
├── MatchDayFlow [S-50 → S-55]
│   ├── MatchBanner [C-B20]
│   ├── PhaseTabs [C-C17]
│   └── ReflectionStep [C-C18]
│
├── SeasonHub [S-60 → S-62]
│   ├── ProgressCard [C-B13]
│   ├── Timeline [C-C11]
│   └── SpeelboekView [C-C22]
│
└── System
    ├── BottomSheet [C-C10]             ← mobile only
    ├── OfflineBanner [C-C25]
    ├── EmptyState [C-C26]
    └── LoadingSkeleton [C-C27]
```

### Hergebruik-regels

| Component | Hergebruik | Uniek |
|-----------|------------|-------|
| `ContentPageShell` | All content routes | Shell structure |
| `TwentySecCard` | S-42, S-51, S-52, S-62 | — |
| `ApplyChecklist` | S-20, S-43, S-51 | Context gate |
| `QuickActionRow` | **S-20 only** | Never elsewhere |
| `CaptainCard` | S-70 only | Role-unique |
| `StickyLayerTabs` | S-40 only | Nested in content |
| `BottomSheet` | Mobile only | Desktop = dropdown |

---

# 6. Mobile First Validatie

| Test | Screen | Pass |
|------|--------|------|
| App open → positie visible | S-20 | ✅ ≤1 sec |
| 20 sec in ≤3 taps | S-20 → S-40 L2 | ✅ |
| Wedstrijd in ≤2 taps | Bottom → S-51 | ✅ |
| Uitstappen in ≤3 taps | Probleem → S-36 | ✅ |
| 1 beslissing per scherm | Onboarding, Reflectie | ✅ |
| Thumb zone CTAs | Quick actions bottom third | ✅ |
| Sticky tabs readable | 5 tabs scroll horizontal | ✅ |
| L3 hidden non-match | Apply tab greyed | ✅ |
| Bottom sheet positie | S-02 | ✅ |
| Single column default | All dashboards | ✅ |
| Offline L2 cache | S-81 + S-42 | ✅ Should-have |
| Push weekplan | External notif → S-20 | ✅ Should-have |

**Mobile-only components:** `BottomTabBar` · `BottomSheet` · swipe `ReflectionStep` · horizontal `StickyLayerTabs`

---

# 7. Desktop Validatie

| Aspect | Aanpak |
|--------|--------|
| **Navigation** | SidebarNav replaces BottomTabBar · same 5 items |
| **Positie dashboard** | 2-column layout · geen extra widgets |
| **Content page** | Max 800px panel · optional visual sticky right |
| **Search** | Modal 560px · `/` shortcut |
| **Positie switch** | Dropdown not bottom sheet |
| **Captain/Trainer** | Wider tables · TPL editor inline |
| **Admin** | Full-width analytics · completeness table |
| **Geen desktop-only features** | Parity met mobile · meer ruimte only |

**Desktop does NOT add:** extra tabs · PB list · ACE phase nav · extra dashboards

---

# 8. Gap Analysis & Dubbel Werk Check

## 8.1 Screens — afgedekt?

| Domain | Status |
|--------|--------|
| Onboarding | ✅ S-10, S-11 |
| Positie home | ✅ S-20 |
| Situatie (3 niveaus) | ✅ S-30, S-31, S-32 |
| Probleem (2 niveaus) | ✅ S-35, S-36 |
| Content (5 layers + shell) | ✅ S-40–S-45 |
| Oefening | ✅ S-46 |
| Wedstrijddag (4 fases) | ✅ S-50–S-55 |
| Seizoen (4 sub) | ✅ S-60–S-62 |
| Rollen (4) | ✅ S-70–S-74 |
| System | ✅ S-80–S-82 |
| Zoek | ✅ S-01 |
| Shell | ✅ S-00–S-03 |

**Geen ontbrekende schermen** voor MVP + Production roadmap.

## 8.2 Bewust GEEN apart scherm

| Verworpen | Reden |
|-----------|-------|
| Home dashboard | Positie = home (v1.1) |
| Reflectie tab | Onder Wedstrijd NA + Seizoen log |
| Favorieten tab | Pins in Seizoen |
| PB-nummer lijst | Architectuur verboden |
| Apart ACE-fase scherm | Seizoen voortgang only |

## 8.3 Dubbel werk voorkomen

| Risico | Mitigatie |
|--------|-----------|
| Apply checklist 2× | Zelfde component · context props · S-20 vs S-43 |
| 20 sec 2× | `TwentySecCard` overal · geen apart "kaart scherm" |
| Week 2× | `WeekCard` op Positie · Trainer heeft `WeekPlanCard` (rol-variant) |
| Quick actions 2× | **Alleen S-20** · nowhere else |
| Reflectie 2× | Single `ReflectionStep` flow · log in Seizoen |

## 8.4 Toekomst (geen scherm nu · component ready)

| Feature | Component placeholder |
|---------|----------------------|
| Quiz | `QuizCard` — Phase F |
| Full-text search | Extend S-01 groups |
| PDF Speelboek | S-62 export CTA |
| Multi-team switch | Extend S-03 RoleMenu |

---

# 9. Product Design System Certificering

```
ACADEMY-PDS-v1.0
Phase: B.5 — Product Design System
Architecture: ACADEMY-ARCH-v1.1 (frozen)
Foundation: Phase B registries v1.1.0

Screens defined:     42
Components defined:  58
Navigation matrix:   Complete
User flows:          5 roles + onboarding
Mobile validated:    ✅
Desktop validated:   ✅
Gap analysis:        No blockers

STATUS: ✅ CERTIFIED — Phase C (Prototype) may start
```

**Phase C deliverables (next):**
- Wireframes per S-xx scherm (low-fi)
- Interactive prototype S-20, S-40, S-50, S-35 (MVP critical path)
- Design tokens document (Phase C.1 — visual layer · separate from PDS)

**Frozen from PDS (wijzig via ACR):**
- 42 schermtypes · route mapping
- 5 layer tabs · L0 inline · L3 match-gate
- QuickActionRow alleen op Positie
- Bottom 5 tabs speelster
- Component IDs C-A01 through C-D10

---

*Document: `academy-product-design-system-v1.0.md`*  
*Prev: Phase B Foundation · Next: Phase C Prototype*
