# Academy MVP Wireframe Specification — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** C.1 — Complete MVP Wireframe Specification  
**Architecture:** `ACADEMY-ARCH-v1.1` (frozen)  
**Design System:** `ACADEMY-PDS-v1.0` (certified)  
**Journey:** `ACADEMY-JOURNEY-v1.0` (frozen)  
**Scope:** Wireframe-specificaties · **geen** React · **geen** Next.js · **geen** Tailwind · **geen** HTML · **geen** CSS · **geen** implementatie

> **Regel:** Wireframes volgen Journey → PDS → Architecture. Nooit andersom.  
> **Doel:** Developer kan elk scherm bouwen zonder verdere UX-beslissingen.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **COMPLETE (pending GO)** | Alle MVP-kritieke schermen · validatie · critical path |

---

# 0. Globale shell-regels (gelden voor alle schermen)

Deze regels worden **niet** per scherm herhaald tenzij afwijkend.

## 0.1 App Shell (S-00) — altijd aanwezig

| Zone | Mobiel | Desktop |
|------|--------|---------|
| **Header** | `[Positie ▼]` · `[🔍]` · `[Profiel ▼]` | Zelfde · sidebar links |
| **Main** | Full-width · padding 16px | Max content width 720px (dashboards) / 800px (content) |
| **Bottom** | 5 tabs: Positie · Situatie · Probleem · Wedstrijd · Seizoen | Vervangen door `SidebarNav` (zelfde 5) |

**Rol-dashboards (S-70, S-71):** geen bottom-tab highlight voor “Team”; bottom blijft speelster-navigatie. Captain/Trainer bereiken eigen Positie via bottom Positie.

## 0.2 Shared system patterns

| Pattern | ID | Gedrag |
|---------|-----|--------|
| Empty | `EmptyState` C-C26 | Titel (1 zin) · uitleg (1 zin) · optionele secondary CTA |
| Loading | `LoadingSkeleton` C-C27 | Skeleton per widget-blok · geen spinner-only |
| Offline | `OfflineBanner` C-C25 | Sticky top onder header · “Offline · cached week” |
| Error | Inline + retry | Geen full-screen dead-end behalve fatale auth |

## 0.3 Swipe / scroll defaults

| Gesture | Gedrag |
|---------|--------|
| Vertical scroll | Main content · header sticky · bottom sticky |
| Horizontal swipe (tabs) | Alleen `StickyLayerTabs` (S-40) · `PhaseTabs` (S-50) · `ReflectionStep` (S-54 mobiel) |
| Pull-to-refresh | Alleen S-20, S-70, S-71 · refresh weekplan/persoonlijke data |
| Edge swipe back | iOS/Android system back · zelfde als header Back |

## 0.4 Accessibility defaults

- Touch targets ≥ 44×44 px
- Contrast tekst/achtergrond ≥ WCAG AA
- Focus order: Header → Main (top→bottom) → Bottom tabs
- Screen reader: elke CTA heeft accessible name (geen “knop 1”)
- Reduce motion: geen verplichte animaties voor content-begrip
- Geen kleur-only status (vinkjes hebben ook tekst/icoon)

## 0.5 Prestatie-defaults

| Metric | Eis |
|--------|-----|
| First paint Positie (S-20) | ≤1 s (cached shell + skeleton) |
| Tap → next screen | ≤300 ms perceived |
| Content layer tab switch | ≤100 ms (data al geladen) |
| Offline open S-51 (Should) | ≤1 s uit cache |

## 0.6 Label-regels (frozen)

- **Geen PB-nummers** in UI-labels (wel menselijke titel)
- Positie altijd zichtbaar in header badge
- Layer-tabs: Visual · 20 sec · Apply · 2 min · Volledig

---

# 1. Complete wireframe-specificaties

---

## S-20 · Positie Dashboard

### Doel
Operationeel home: vandaag activeren, week-PB openen, ankers/leerpunt/shortcuts bereiken — **geen** seizoen-historie.

### Gebruiker
Speelster (default app open). Captain/Trainer zien dit ook via bottom Positie (eigen positie-view).

### Open-conditie
- App open (authenticated, onboarding klaar) → altijd `/positie`
- Bottom tab Positie
- Deep link push notificatie weekplan → landt hier met WeekCard highlight
- Na S-55 Success “Naar Positie”

### Layout (boven → beneden)

```
[AppHeader]
[OfflineBanner?]                          ← alleen offline
1. VandaagBanner
2. QuickActionRow                         ← 3 tiles · ALLEEN hier
3. PositieAnkerList                       ← 3 taken · altijd
4. ApplyChecklist                         ← ALLEEN vr–za wedstrijdweek
5. LeerpuntCard                           ← ALLEEN als actief leerpunt
6. WeekCard | EmptyState week
7. SituationShortcutGrid                  ← 4 shortcuts
[BottomTabBar · Positie active]
```

**Desktop:** 2 kolommen  
- Links: 1 Vandaag · 2 Quick · 6 Week  
- Rechts: 3 Ankers · 4 Apply · 5 Leerpunt · 7 Shortcuts  
Geen extra widgets.

### Componenten

| Zone | Component | ID |
|------|-----------|-----|
| 1 | `VandaagBanner` | C-B19 |
| 2 | `QuickActionRow` → `QuickActionTile` ×3 | C-C02, C-C03 |
| 3 | `PositieAnkerList` | C-B18 |
| 4 | `ApplyChecklist` | C-B09 |
| 5 | `LeerpuntCard` | C-B15 |
| 6 | `WeekCard` of `EmptyState` | C-B16 / C-C26 |
| 7 | `SituationShortcutGrid` | C-C16 |

**Verboden hier:** `PinList` · `LastViewedList` · `ProgressCard` · `CaptainCard` · tweede QuickActionRow · PB-lijst.

### Informatiehiërarchie
1. Wat moet ik **nu** (Vandaag)  
2. Snel activeren (Quick)  
3. Wie ben ik op het veld (Ankers)  
4. Wedstrijd-check (Apply, contextueel)  
5. Wat fix ik (Leerpunt)  
6. Deze week leren (Week)  
7. Oriëntatie (Situatie shortcuts)

### CTA's

| CTA | Type | Bestemming |
|-----|------|------------|
| Vandaag → “Wedstrijd” / “2 min” | Primary contextual | S-51 of S-40 L4 |
| Quick **20 sec** | Primary | S-40 week-PB · tab L2 |
| Quick **Visual** | Secondary | S-40 week-PB · tab L1 |
| Quick **Wedstrijd** | Primary (matchweek) | S-51 |
| Anker-item tap | Tertiary | S-40 linked PB · default L4 |
| Apply toggle | Inline | Local state (geen nav) |
| Leerpunt tap | Secondary | S-36 of S-40 L2 |
| WeekCard tap | Primary | S-40 L4 |
| WeekCard oefening-link | Secondary | S-46 |
| Situatie shortcut | Tertiary | S-31/S-32 |

### Empty states

| Conditie | Copy | Actie |
|----------|------|-------|
| Geen WeekPlan push | “Trainer zet deze week klaar” · “Je kunt Situatie of Probleem al browsen” | Links naar bottom Situatie / Probleem |
| Geen leerpunt | Zone 5 **verborgen** (geen empty card) | — |
| Geen matchweek | Zone 4 Apply **verborgen** | — |
| Blessure / geen match | Quick Wedstrijd blijft · speelster mag negeren (geen aparte modus MVP) | — |

### Loading
Skeleton: banner strip · 3 quick tiles · 3 anker rows · week card. Max 1 s; daarna cached/stale data + OfflineBanner indien nodig.

### Offline
- Toon cached: Ankers · laatste WeekCard · laatste L2-titel in Quick labels  
- Quick 20 sec / Visual: open cached S-40 indien Should S2 actief; anders Error “Geen netwerk — open vrijdag opnieuw met bereik”  
- Apply: lokale toggles blijven werken offline

### Error states
| Error | UI |
|-------|-----|
| WeekPlan fetch fail | EmptyState + Retry |
| Ankers fail | Inline error op zone 3 · rest blijft |
| Push deep-link PB missing | Toast + fallback Empty week |

### Navigatie
- Bottom: Positie active  
- Header: positie switch (S-02) · zoek (S-01) · rol  
- Back: n.v.t. (root)

### Swipe
Geen horizontale swipe. Pull-to-refresh toegestaan.

### Scroll
Single column scroll. QuickActionRow mag sticky worden onder header na scroll voorbij Vandaag (optioneel Should — niet Must).

### Mobiel
Single column · thumb-zone Quick in bovenste helft na Vandaag · grote tiles.

### Desktop
2-koloms zoals hierboven · Quick blijft 3 tiles horizontaal · geen 4e tile.

### Accessibility
VandaagBanner `role="status"` bij matchday. Quick tiles: labels “20 seconden”, “Visual”, “Wedstrijd”. Checklist: native checkbox semantics.

### Prestatie-eisen
App open → Vandaag zichtbaar ≤1 s. 20 sec bereikbaar in **1 tap** vanaf Quick (≤3 taps incl. app open = open + quick).

---

## S-35 · Probleem Overzicht

### Doel
Symptoom → fix in spelerstaal. Geen PB-browsen.

### Gebruiker
Speelster · Trainer (diagnose) · Captain (help teammate).

### Open-conditie
- Bottom tab Probleem → `/probleem`
- Zoek resultaat groep Problems → kan doorlinken naar S-36 (overslaan S-35)

### Layout (boven → beneden)

```
[AppHeader]
[PageTitle: "Waar loop je tegenaan?"]
[HintBanner?]                    ← "Jouw keuzes uit start" indien onboarding picks
1. Section "Meest relevant"      ← 7 MVP ProblemCards
2. Accordion "Meer problemen"    ← 3 Later (collapsed default)
[BottomTabBar · Probleem active]
```

**Desktop:** lijst max 640px · rechts sidebar 240px “Jouw onboarding picks” (alleen als picks bestaan).

### Componenten
- `ProblemCard` C-B03 (list variant)
- `Accordion` C-C12 (Later-sectie)
- `EmptyState` alleen als registry leeg (niet MVP-realistisch)
- `LoadingSkeleton` list rows

### Informatiehiërarchie
1. Onboarding-hint (persoonlijk)  
2. 7 MVP problemen (groot, tapbaar)  
3. 3 Later (collapsed)

**MVP 7 (volgorde frozen):**  
1 Te snel wegspelen · 2 Positie kwijt · 3 Counters tegen · 4 Uitstappen twijfel · 5 Iedereen naar bal · 6 Te weinig communicatie · 7 Paniek na tegengoal  

**Later 3:** Druk zetten · Uitgespeeld · Achter bal aan — zichtbaar maar collaps; tap opent S-36 (content mag thin zijn).

### CTA's
| CTA | Bestemming |
|-----|------------|
| ProblemCard tap | S-36 `/probleem/:slug` |

Geen primaire page-CTA. Geen “Start Academy” hier.

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Loading | 7 skeleton rows |
| Offline | Cached problem list (static registry) altijd beschikbaar |
| Error fetch | Fallback embedded static 7 + Retry |
| Empty | N/A (registry frozen) |

### Navigatie
Back: system/root. Bottom Probleem active. Geen nested back stack vereist.

### Swipe / Scroll
Vertical list only. Geen swipe-actions op cards.

### Mobiel / Desktop
Mobiel: 1 kolom · min height card 64px. Desktop: 640px list + optional picks sidebar.

### Accessibility
Cards als buttons. Onboarding picks als list met `aria-label="Jouw startkeuzes"`.

### Prestatie
Tab → lijst ≤300 ms (static). Max **1 tap** naar S-36; **2 taps** tot L2 (S-36 → Start 20 sec).

---

## S-36 · Probleem Fix Flow

### Doel
Directe brug symptoom → L2 activeren. Geen lange uitleg.

### Gebruiker
Zelfde als S-35.

### Open-conditie
- Tap ProblemCard S-35
- Zoek → Problem result
- LeerpuntCard op S-20 (als linked `prob`)

### Layout

```
[AppHeader + Back]
[ProblemHeader]           ← titel spelerstaal · geen PB#
[FocusLine]               ← 1 zin: wat fix je
[LinkedContext]           ← optioneel: 1–2 menselijke PB-titels als chips (niet nummers)
[PrimaryCTA: "Start 20 sec"]
[Secondary: "Bekijk Visual"]
```

Geen scroll nodig op mobiel (1 viewport). Desktop: centered 480px card.

### Componenten
- `ProblemHeader` (variant van C-B03 header)
- `FocusLine` (tekstblok · geen apart inventaris-ID — plain content)
- `PlaybookCard` compact C-B01 (optioneel chips → content)
- Primary/Secondary buttons

**Niet:** volledige L2 tekst hier (die zit in S-42).

### Informatiehiërarchie
1. Probleemnaam  
2. Focus (1 zin)  
3. Start actie

### CTA's
| CTA | Default layer | Route |
|-----|---------------|-------|
| **Start 20 sec** (primary) | L2 | S-40 |
| **Bekijk Visual** (secondary) | L1 | S-40 |
| Linked PB chip | L2 | S-40 |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen linked PB | CTA disabled + “Content volgt binnenkort” (Later problems) |
| Loading sidecar | Skeleton FocusLine · CTA disabled |
| Offline | CTA werkt als week/PB cached; anders error |
| Error | Retry + Back naar S-35 |

### Navigatie
Back → S-35 (of Zoek dismiss). Origin stack behouden.

### Swipe / Scroll
Geen swipe. Geen lange scroll.

### Mobiel / Desktop
Mobiel full-bleed. Desktop card 480px.

### Accessibility
Primary CTA is eerste focus na header. FocusLine als heading level 2.

### Prestatie
Open → Start 20 sec ≤1 tap. Totaal vanuit S-35: **2 taps** tot L2 content.

---

## S-40 · Content Shell

### Doel
Eén unieke content-container: sticky layer tabs + panel. Alle content-routes landen hier.

### Gebruiker
Speelster · Captain (help teammate) · Trainer (fragment).

### Open-conditie
Elke route `/content/:pb` vanuit: WeekCard · Quick · Situatie · Probleem · Anker · Zoek · Trainer · Captain.

**Default tab** (context-driven — frozen):

| Entry context | Default tab |
|---------------|-------------|
| Week / thuis / training / anker | **2 min** (L4) |
| Quick 20 sec / Probleem / Zoek problem/cue | **20 sec** (L2) |
| Quick Visual / eerste kennismaking | **Visual** (L1) |
| Wedstrijd (via embed elders) | n.v.t. — S-51 embedt L2 |

### Layout

```
[AppHeader]
[ContentHeader]              ← menselijke PB-titel · positie badge · Back
[StickyLayerTabs]            ← Visual | 20 sec | Apply | 2 min | Volledig
[LayerPanel = S-41…S-45]     ← één actief
[OfflineBanner?]
```

**Desktop:** tabs + panel max 800px; optioneel Visual sticky rechts wanneer L1 actief.

### Componenten
- `ContentHeader`
- `StickyLayerTabs` C-C01
- Layer panels S-41–S-45
- `OfflineBanner` C-C25
- `LoadingSkeleton` C-C27

### Informatiehiërarchie
1. Wat leer ik (titel)  
2. Welke laag (tabs)  
3. Laag-inhoud

### CTA's
Geen shell-level primary CTA. CTAs leven in layer panels. Back keert naar **origin** (niet altijd S-20).

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Loading sidecar | Skeleton panel · tabs disabled tot data |
| L3 buiten match-context | Tab zichtbaar maar **greyed** · tooltip “Alleen rond wedstrijd” · tap toont uitleg, opent niet dead-end |
| Offline | Cached L1/L2/L3 week-PB; L4/L5 mogen fail met retry |
| PB not found | Full Error + Back |

### Navigatie
Back → origin. Tabs wisselen panel zonder route-change (query `?layer=` toegestaan). Positie-filter inherited uit header.

### Swipe
Horizontaal swipe tussen tabs (mobiel). Edge-swipe = Back.

### Scroll
Tabs sticky. Panel scrollt onafhankelijk. Tab bar scrollt horizontaal als 5 labels niet passen (Apply greyed telt mee).

### Mobiel / Desktop
Mobiel: full-width. Desktop: 800px · L1 optional sidebar.

### Accessibility
Tabs = `tablist`/`tab`/`tabpanel`. Greyed Apply: `aria-disabled` + uitleg.

### Prestatie
Tab switch ≤100 ms. Initial layer paint ≤500 ms met skeleton.

---

## S-41 · Visual (L1 + L0 inline)

### Doel
Herkenning: timing/ruimte zien. Niet activeren (dat is L2).

### Gebruiker
Via S-40 Visual-tab.

### Open-conditie
S-40 tab Visual · Quick Visual · secondary vanuit S-36.

### Layout

```
[TriggerInline L0]           ← 1 zin "Wanneer zie je dit?"
[VisualViewer]               ← primary visual
[PositionHighlightLegend]    ← 11 kleuren · eigen positie bold
[SecondaryCTA: "Ga naar 20 sec"]
```

### Componenten
- `TriggerInline` C-C07  
- `VisualViewer` C-C08  
- `PositionHighlightLegend` C-C09  
- `VisualCard` C-B06 (thumb alleen indien multi — MVP 1 primary)

### Informatiehiërarchie
1. L0 trigger  
2. Beeld  
3. Legenda  
4. Door naar actie

### CTA's
| CTA | Actie |
|-----|-------|
| Ga naar 20 sec | Switch tab L2 |
| Pinch/zoom visual | Local |

Geen “Klaar”. Geen Apply hier.

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen visual assigned | EmptyState “Visual volgt” + CTA naar 20 sec |
| Loading asset | Skeleton 16:9 |
| Offline + cached image | Toon cache |
| Offline + geen cache | Empty + 20 sec CTA |

### Navigatie / Swipe / Scroll
Binnen S-40. Pinch-zoom op visual (mobiel). Legend scrollt mee onder visual.

### Mobiel / Desktop
Mobiel: full-width visual. Desktop: 16:9 max · legend rechts van visual.

### Accessibility
L0 als tekst vóór beeld. Visual: `alt` met situatie-beschrijving (niet decoratief). Legend niet alleen kleur.

### Prestatie
Visual lazy-load. L0 tekst synchronous met sidecar.

---

## S-42 · 20 Seconden (L2)

### Doel
Activeren · niet leren. ~40 woorden · 4 actieregels + cue.

### Gebruiker
Via S-40 · embed in S-51/S-52.

### Open-conditie
Default bij probleem/zoek/quick 20 sec. Tab “20 sec”.

### Layout

```
[TwentySecCard]
  - 4 actie-regels (positie-variant)
[CueCard]                    ← 1 roep
[SecondaryCTA?]              ← "Apply checklist" alleen match-context
```

Desktop: card centered 480px · large type.

### Componenten
- `TwentySecCard` C-B07  
- `CueCard` C-B14  

**Embed-regel:** zelfde component in S-51/S-52 — geen tweede “kaart-scherm”.

### Informatiehiërarchie
1. Acties (4)  
2. Roep  
3. Optioneel Apply-doorlink

### CTA's
| CTA | Conditie | Actie |
|-----|----------|-------|
| Apply checklist | Match-context | Switch tab L3 of scroll embed |
| (geen Klaar op S-42 standalone) | — | Back / tab |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen positie-variant | Fallback shared L2 + warning “Algemene versie” |
| Offline | **Must-path risico**; Should: cache huidige week L2 |
| Error | Retry |

### Navigatie / Swipe / Scroll
1 viewport op mobiel (geen scroll als copy ≤40 woorden). Geen swipe eigen.

### Mobiel / Desktop
Mobiel: large type · high contrast. Desktop: 480px centered.

### Accessibility
Acties als genummerde list. Cue met `aria-label="Roep"`.

### Prestatie
Tekst-first · geen image blocking. Paint ≤200 ms na tab select.

---

## S-43 · Apply (L3)

### Doel
3 vinkjes · roep · oefening-link · alleen wedstrijd-context.

### Gebruiker
Speelster rond vr–za / live match entry.

### Open-conditie
- S-40 tab Apply **enabled** in match-context  
- Anders greyed (zie S-40)  
- Ook embedded checklist op S-20 en S-51 (zelfde `ApplyChecklist`)

### Layout

```
[ApplyChecklist]             ← 3 items · positie-variant
[CueCard]                    ← zelfde cue als L2 of L3-specifiek
[ExerciseLink]               ← → S-46 indien ex.{pb}
[PrimaryCTA: "Klaar voor wedstrijd"]  ← alleen in wedstrijd-flow entry
```

### Componenten
- `ApplyChecklist` C-B09  
- `CueCard` C-B14  
- `ExerciseLink` (tekstlink · mag `ExerciseCard` compact C-B17)

### Informatiehiërarchie
1. Checklist  
2. Roep  
3. Oefening  
4. Klaar

### CTA's
| CTA | Actie |
|-----|-------|
| Toggle item | Local persist per user/match |
| Oefening | S-46 |
| Klaar voor wedstrijd | Dismiss / terug S-51 of close intent |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Non-match | Tab greyed — dit panel niet openen |
| Offline | Toggles lokaal queue → sync later |
| Geen exercise | Verberg ExerciseLink |

### Navigatie / Swipe / Scroll
Binnen S-40. Korte pagina.

### Mobiel / Desktop
Grote checkboxes. Desktop: 480px card.

### Accessibility
3 checkboxes met labels. Progress “2 van 3” voor SR.

### Prestatie
Toggle instant · optimistic UI.

**Anti-dubbel:** L3 ≠ L4 copy. Max 3 vinkjes · geen 3+3+3 hier.

---

## S-44 · 2 Minuten (L4)

### Doel
Onthouden: 3 fouten · 3 afspraken · 3 gedragingen. Thuis/training default.

### Gebruiker
Speelster Ma–Wo · training voorbereiding.

### Open-conditie
WeekCard · anker · training context · tab “2 min”.

### Layout

```
[TwoMinCard]
  [BulletGroup Fouten ×3]
  [BulletGroup Afspraken ×3]
  [BulletGroup Gedragingen ×3]
[SecondaryCTA: "Oefening"]
[TertiaryCTA: "Dieper (Volledig)"]
```

### Componenten
- `TwoMinCard` C-B08  
- `BulletGroup` C-C19 ×3  

### Informatiehiërarchie
1. Fouten (wat weg)  
2. Afspraken (team)  
3. Gedragingen (jij)  
4. Doorlinks

### CTA's
| CTA | Dest |
|-----|------|
| Oefening | S-46 |
| Dieper (Volledig) | Tab L5 |

Geen “Klaar voor wedstrijd” (dat is L3/S-51).

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Loading | 3 skeleton groups |
| Offline + geen cache | Error + Retry (L4 niet Must-offline) |
| Partial positie data | Shared fallback + badge |

### Navigatie / Swipe / Scroll
Scroll toegestaan (kan >1 viewport). Geen swipe.

### Mobiel / Desktop
Mobiel single column. Desktop 640–800px.

### Accessibility
3 headings + lists. CTA’s onderaan bereikbaar zonder traps.

### Prestatie
Tekst ≤200 woorden target · render ≤300 ms.

**Contextregel:** Vrijdag default = L2+L3, **niet** L4 (Journey R5).

---

## S-45 · Volledig Playbook (L5)

### Doel
Begrijpen via bestaande PB-markdown. Optioneel diep · **niet** in matchday-pad.

### Gebruiker
Speelster (thuis) · Trainer (fragment bespreken).

### Open-conditie
Tab Volledig · Trainer “Fragment” · L4 tertiary.

### Layout

```
[Accordion §8 Positie]       ← DEFAULT open · eigen positie
[ExpandableSection …]        ← overige L5 secties collapsed
[MarkdownViewer]
```

**Desktop:** TOC sidebar + scroll spy.

### Componenten
- `MarkdownViewer` C-C14  
- `Accordion` C-C12  
- `ExpandableSection` C-C13  

### Informatiehiërarchie
1. Eigen positie-sectie (§8)  
2. Rest on demand  

### CTA's
Geen primary. Optioneel “Terug naar 2 min” secondary.

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Loading MD | Skeleton paragraphs |
| Offline | Error tenzij geprefetch |
| Parse error | Error + link naar L4 |

### Navigatie / Swipe / Scroll
Lange scroll. TOC jump desktop. **Verboden** in S-51 90s-pad (geen entry).

### Mobiel / Desktop
Mobiel: collapsed default behalve §8. Desktop: TOC.

### Accessibility
Headings hierarchy uit markdown. Skip link “Naar positie-sectie”.

### Prestatie
Lazy: laad L5 pas bij tab-open. Niet prefetch op matchday.

---

## S-46 · Oefening

### Doel
1 oefening per week-PB · training weten wat komt.

### Gebruiker
Speelster · Trainer (share source).

### Open-conditie
- WeekCard oefening-link  
- L4 CTA Oefening  
- L3 ExerciseLink  
- Trainer ExerciseCard share → speelster opent hier

### Layout

```
[AppHeader + Back]
[Badge?] "Gedeeld door trainer"
[ExerciseCard]
  - Titel
  - Duur
  - Stappen (genummerd)
[PlaybookCard compact]       ← week-PB menselijke titel → S-40 L4
```

### Componenten
- `ExerciseCard` C-B17  
- `PlaybookCard` C-B01  

### Informatiehiërarchie
1. Wat oefenen  
2. Hoe lang / stappen  
3. Koppeling week-PB

### CTA's
| CTA | Dest |
|-----|------|
| PlaybookCard | S-40 L4 |
| (geen Start training timer MVP) | — |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen exercise op week-PB | EmptyState “Geen oefening deze week” + Back |
| Offline | Cached exercise tekst indien Should; anders error |

### Navigatie / Swipe / Scroll
Back naar origin. Korte scroll.

### Mobiel / Desktop
Single column · desktop 560px.

### Accessibility
Stappen als ordered list.

### Prestatie
Statische content · ≤300 ms.

---

## S-50 · Wedstrijddag Hub

### Doel
Fase kiezen: vóór / rust / na. Context = match.

### Gebruiker
Speelster · Captain/Trainer (zelfde hub, rol-extra’s in fase).

### Open-conditie
- Bottom Wedstrijd → `/wedstrijd`  
- Quick Wedstrijd → mag **direct S-51** skip hub (1 tap sneller — toegestaan)  
- Push/matchday deep link

**Auto-fase (MVP):**  
- Voor kickoff → default **Vóór**  
- Live rust window → default **Rust**  
- Na eindfluit → default **Na**  
Geen match vandaag → hub met Empty + “Geen wedstrijd gepland”.

### Layout

```
[AppHeader]
[MatchBanner]                ← datum · tegenstander · thuis/uit
[PhaseTabs]                  ← Vóór | Rust | Na
[PhasePanel = S-51|S-52|S-53]
[BottomTabBar · Wedstrijd active]
```

### Componenten
- `MatchBanner` C-B20  
- `PhaseTabs` C-C17  
- Fase-panels  

### Informatiehiërarchie
1. Welke wedstrijd  
2. Welke fase  
3. Fase-inhoud

### CTA's
Geen hub-CTA buiten fase-tabs. Quick-entry mag hub skippen.

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen match | EmptyState + link Positie week |
| Loading match | Skeleton banner |
| Offline | Banner + cached vóór-content (Should) |

### Navigatie / Swipe / Scroll
Swipe tussen PhaseTabs. Bottom Wedstrijd active.

### Mobiel / Desktop
Mobiel full. Desktop 720px.

### Accessibility
PhaseTabs = tablist. MatchBanner `role="status"`.

### Prestatie
Hub → Vóór ≤2 taps vanaf bottom (1 tab + default). Quick: **1 tap**.

---

## S-51 · Voor Wedstrijd

### Doel
≤90 sec (30 min vóór) / ≤2 min (vrijdag): mentaal klaar. Telefoon weg.

### Gebruiker
Speelster. Captain mag meelezen (geen aparte UI).

### Open-conditie
- Phase Vóór  
- Quick Wedstrijd  
- VandaagBanner CTA

### Layout

```
[MatchBanner compact?]
[ApplyChecklist]             ← 3 vinkjes
[TwentySecCard embed]        ← L2 positie
[Toggle: "Toon Visual"]      ← collapsed VisualViewer
[PrimaryCTA: "Klaar"]
```

**Hard verboden op dit scherm:** L5 · Seizoen-links · Probleem-browse · Zoek entry points · L4 TwoMinCard · Speelboek.

### Componenten
- `ApplyChecklist` C-B09  
- `TwentySecCard` C-B07  
- `VisualViewer` C-C08 (compact, toggle)  
- Primary button “Klaar”

### Informatiehiërarchie
1. Checklist  
2. 20 sec  
3. Visual optioneel  
4. Klaar → telefoon weg

### CTA's
| CTA | Actie |
|-----|-------|
| **Klaar** (primary) | Dismiss flow · bij voorkeur app background / terug S-20 |
| Toon Visual | Expand inline — **geen** navigatie naar S-40 verplicht |
| Checklist toggles | Local |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen WeekPlan | Empty “Geen week-PB — vraag trainer” · toch Cue fallback? Nee — empty + Positie |
| Offline + cache | Toon cached L2/L3 (**Should S2**) |
| Offline zonder cache | Error “Open vrijdag met bereik om te cachen” |
| Loading | Skeleton checklist + 4 lines |

### Navigatie
Back → S-50 of S-20 (afhankelijk entry). Geen doorlink Seizoen.

### Swipe / Scroll
Minimale scroll — target 1–1.5 viewports. Geen fase-swipe hier als al in panel (parent S-50 handelt tabs).

### Mobiel / Desktop
Mobiel primary. Desktop: centered 480px — **geen** extra kolommen/widgets.

### Accessibility
Klaar = grote primary. Timer/status optioneel `aria-live` niet verplicht MVP.

### Prestatie
Open ≤2 s. Total interaction budget **90 s** hard (Journey). Freekick path ≤2 min.

---

## S-52 · Rust

### Doel
≤**30 seconden** (Journey Freeze — wint van PDS “≤90”). Minder info dan vóór. Max **2** nieuwe L2-punten.

### Gebruiker
Speelster · Captain (+ RustNote) · Trainer (observe focus — read-only tips).

### Open-conditie
- Phase Rust  
- Alleen tijdens rust-window; anders Empty “Rust nog niet / al voorbij”

### Layout

```
[ScorePhaseCard]             ← stand + fase
[TwentySecCard delta]        ← max 2 nieuwe punten · L0 inline 1 zin
[RustNote]                   ← ALLEEN Captain (rol-gate)
[TrainerFocus?]              ← ALLEEN Trainer: 1 TPL regel (read-only)
```

**Verboden:** L4 · L5 · nieuwe situaties · volledige Apply checklist · Speelboek (PDS-fout “→ S-62” **verworpen**).

### Componenten
- `ScorePhaseCard` (nieuw pattern — score/fase; mag compact MatchBanner-variant)  
- `TwentySecCard` C-B07 (delta mode)  
- `TriggerInline` C-C07 (1 zin)  
- `RustNote` C-D03  

### Informatiehiërarchie
1. Stand/fase  
2. Max 2 aanpassingen  
3. Rol-extra (captain/trainer)

### CTA's
| Rol | CTA |
|-----|-----|
| Speelster | Geen primary — lezen · sluiten |
| Captain | Expand RustNote (30s script) |
| Trainer | Geen edit — observe only |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen rust-data | Fallback: heropen L2 van S-51 (Journey R3) |
| Offline | Cached delta indien aanwezig |
| Should S3 niet live | Hele S-52 mag thin Empty + “Vraag captain” |

### Navigatie / Swipe / Scroll
Geen diepe nav. 1 viewport target.

### Mobiel / Desktop
Mobiel first. Desktop zelfde content, geen extra panels.

### Accessibility
Score als tekst “Stand 1-0 · Rust”. Delta list max 2 items.

### Prestatie
Open ≤1 s. Leesbudget **30 s**.

---

## S-53 · Na Wedstrijd

### Doel
Één duidelijke entry naar reflectie. Geen wizard hier.

### Gebruiker
Speelster (soft mandatory). Captain/Trainer zien aggregate elders.

### Open-conditie
Phase Na · na eindfluit · of handmatig als match “gesloten”.

### Layout

```
[MatchBanner]
[Status: "Wedstrijd afgelopen"]
[PrimaryCTA: "Reflecteer (3 min)"]
[Secondary: "Later"]           ← skip (telt mee soft mandatory)
[SkipCounter hint?]            ← na 2 skips: soft nudge
```

### Componenten
- `MatchBanner` C-B20  
- CTA buttons  
- Soft nudge banner (geen apart component ID)

### Informatiehiërarchie
1. Wedstrijd klaar  
2. Reflecteer  
3. Skip

### CTA's
| CTA | Actie |
|-----|-------|
| **Reflecteer (3 min)** | → S-54 |
| Later | Dismiss · increment skip count · → S-20 |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Reflectie al gedaan | Success teaser + “Naar Positie” · verberg Reflecteer |
| Offline | Reflecteer disabled of queue — bij offline: toon “Bewaar netwerk voor opslaan” maar sta start toe met lokale draft |

### Navigatie
→ S-54 of S-20. Niet mergen met S-54 (Journey §9.2).

### Swipe / Scroll
Geen. 1 viewport.

### Mobiel / Desktop
Centered CTAs. Desktop 480px.

### Accessibility
Primary duidelijk. Skip niet visueel sterker dan primary.

### Prestatie
Instant.

---

## S-54 · Reflectie

### Doel
3 vragen → 1 Leerpunt. Soft mandatory.

### Gebruiker
Speelster.

### Open-conditie
S-53 primary · deep link post-match.

### Layout — Mobiel (1 vraag per scherm)

```
[ProgressDots 1·2·3]
[ReflectionStep]
  [Vraag]
  [Input]
[Nav: Terug | Volgende / Opslaan]
```

**Vragen (frozen):**  
1. Academy-moment herkend? (ja/nee + optioneel pb/sit chip)  
2. Wat deed je goed? (1 kort antwoord)  
3. Wat fix je volgende week? (1 antwoord → Leerpunt)

### Layout — Desktop
Één card · 3 stappen verticaal zichtbaar · dezelfde validatie · CTA Opslaan onderaan.

### Componenten
- `ReflectionStep` C-C18  
- `ReflectionCard` C-B10  
- `ProgressDots`  

### Informatiehiërarchie
Per stap alleen die vraag. Geen week-PB browser op stap 1 behalve chips.

### CTA's
| CTA | Actie |
|-----|-------|
| Volgende | Validatie · stap+1 |
| Terug | stap-1 |
| **Opslaan** (stap 3) | Persist Reflection + Leerpunt → S-55 |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Validatie fail | Inline “Vul 1 punt in” |
| Offline Opslaan | Queue local · S-55 “Wordt gesynchroniseerd” |
| Server error | Retry behoudt antwoorden |

### Navigatie
Geen bottom-tab switch mid-flow (tabs disabled of confirm discard). Na success → S-55.

### Swipe
Mobiel: swipe left/right tussen stappen (met validatie). Desktop: geen swipe.

### Scroll
Per stap minimale scroll. Desktop mag page scroll.

### Mobiel / Desktop
Zie layouts hierboven.

### Accessibility
Progress “Stap 2 van 3”. Inputs gelabeld. Focus verplaatst naar vraag bij stap-wissel.

### Prestatie
Stap-wissel ≤100 ms. Target completion ≤3 min.

---

## S-55 · Success

### Doel
Bevestiging · leerpunt preview · terug naar Positie.

### Gebruiker
Speelster.

### Open-conditie
Alleen na succesvolle S-54 Opslaan.

### Layout

```
[Success title: "Opgeslagen"]
[LeerpuntCard preview]
[ProgressCard mini]          ← optioneel seizoen %
[PrimaryCTA: "Naar Positie"]
```

### Componenten
- `LeerpuntCard` C-B15  
- `ProgressCard` C-B13 (mini)  

### Informatiehiërarchie
1. Succes  
2. Leerpunt  
3. Door naar home

### CTA's
| CTA | Dest |
|-----|------|
| **Naar Positie** | S-20 (leerpunt zone zichtbaar) |

Geen “Deel” MVP.

### Empty / Loading / Offline / Error
N/A als entry — data komt uit net opgeslagen state. Sync-pending badge indien offline queue.

### Navigatie
Replace stack → S-20 (geen Back naar lege wizard).

### Swipe / Scroll
Geen.

### Mobiel / Desktop
Centered 480px.

### Accessibility
`role="status"` success message.

### Prestatie
Instant uit lokale state.

---

## S-60 · Mijn Seizoen

### Doel
Historie & voortgang — **niet** operationeel vandaag (dat is S-20).

### Gebruiker
Speelster.

### Open-conditie
Bottom Seizoen → `/seizoen`.

### Layout

```
[AppHeader]
[ProgressCard]               ← % voortgang
[Section Reflectielog]       ← laatste 3 + "Alles" → S-61
[PinList]                    ← max 5
[LastViewedList]             ← max 5
[SpeelboekTeaser]            ← locked of unlocked → S-62
[BottomTabBar · Seizoen active]
```

**Desktop:** 2 kolommen — links Progress+Reflectie · rechts Pins+LastViewed+Speelboek.

### Componenten
- `ProgressCard` C-B13  
- `Timeline` C-C11 (preview)  
- `ReflectionCard` C-B10 (compact)  
- `PinList` C-C20  
- `LastViewedList` C-C21  
- `SpeelboekTeaser` (deel van SpeelboekView / Empty lock)

### Informatiehiërarchie
1. Voortgang  
2. Reflecties  
3. Pins  
4. Recent  
5. Speelboek

### CTA's
| CTA | Dest |
|-----|------|
| Alles reflecties | S-61 |
| Pin item | S-40 / S-32 / S-36 |
| Last viewed item | Origin content |
| Speelboek teaser | S-62 of lock modal |

### Empty states
| Conditie | Copy |
|----------|------|
| Geen reflecties | “Nog geen reflecties — na je eerste wedstrijd” |
| Geen pins | “Pin content vanuit Visual of 20 sec (Later pin UX: long-press — MVP: pin via content overflow menu)” |
| Speelboek locked | “Unlockt week 20 / 70% / trainer” |

### Loading / Offline / Error
Skeleton blocks. Offline: cached progress + log. Error per sectie isoleren.

### Navigatie / Swipe / Scroll
Vertical scroll. Geen swipe tabs.

### Mobiel / Desktop
Zie layout. Geen extra desktop-only features.

### Accessibility
Sections met headings. Progress als tekst + meter.

### Prestatie
Tab open ≤500 ms. Niet blokkeren op Speelboek compile.

---

## S-61 · Reflectielog

### Doel
Alle reflecties chronologisch.

### Gebruiker
Speelster.

### Open-conditie
S-60 “Alles” · directe route `/seizoen/reflecties`.

### Layout

```
[AppHeader + Back]
[Title: Reflectielog]
[Timeline]
  └── ReflectionCard × N
```

### Componenten
- `Timeline` C-C11  
- `ReflectionCard` C-B10  

### Informatiehiërarchie
Nieuwste eerst. Per card: datum · match · 3 antwoorden collapsed → expand.

### CTA's
| CTA | Actie |
|-----|-------|
| Expand card | Toon antwoorden |
| Linked pb/prob | → content/probleem |
| Back | S-60 |

### Empty / Loading / Offline / Error
Empty: “Nog geen reflecties”. Offline cached list. Error + Retry.

### Navigatie / Swipe / Scroll
Vertical infinite/list. Geen swipe delete MVP.

### Mobiel / Desktop
List 640px desktop.

### Accessibility
Cards expandable buttons. Datum als tijd-element.

### Prestatie
Virtualiseer indien >50 (Later); MVP volledige list OK tot ~34.

---

## S-62 · Mijn Speelboek

### Doel
Auto-compilatie persoonlijk speelboek (PB35-achtig). Geen authored doc.

### Gebruiker
Speelster (na unlock).

### Open-conditie
- Unlock: week ≥20 **OF** voortgang ≥70% **OF** trainer manual  
- Anders: lock modal vanaf S-60 teaser

> **Journey note:** Geen zware wireframe-investering tot Phase D metrics — structuur hier is **build-ready light**, geen pixel-polish scope.

### Layout (unlocked)

```
[AppHeader + Back]
[SpeelboekView]
  - Intro (1 zin seizoen)
  - PinList fragment
  - Leerpunten (actief + afgerond)
  - PositieAnkers snapshot
  - Top reflectie-momenten (max 3)
  - Fixed personal TwentySecCard (compiled)
[CTA: "Export PDF"]          ← Later disabled + tooltip
```

### Componenten
- `SpeelboekView` C-C22  
- `PinList` C-C20  
- `TwentySecCard` C-B07  
- `LeerpuntCard` list  

### Informatiehiërarchie
Persoonlijk → pins → leerpunten → ankers → 20 sec.

### CTA's
| CTA | Status |
|-----|--------|
| Export PDF | **Later** — disabled |
| Fragment tap | S-40 |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Locked | Lock screen + criteria |
| Compiling | LoadingSkeleton |
| Offline | Laatste snapshot cache |

### Navigatie / Swipe / Scroll
Lange scroll OK. Back S-60.

### Mobiel / Desktop
Desktop mag 2-koloms compile view — **geen** nieuwe content types.

### Accessibility
Export disabled uitgelegd. Landmarks per sectie.

### Prestatie
Compile async · toon stale snapshot eerst.

---

## S-70 · Captain Dashboard

### Doel
≤60 sec briefing: script · afspraken · roepen.

### Gebruiker
Captain (rol-gate). Speelster zonder rol → 403/empty “Alleen captain”.

### Open-conditie
Header Rol → Captain → `/team/captain`.

### Layout

```
[AppHeader · rol Captain]
[CaptainCard expandable]
  - 60 sec script (week-PB)
[TeamAgreementList]          ← 3 · read-only uit trainer
[CueList]                    ← 5 roepen · copy
[RustNote teaser]            ← → S-52 indien live rust
[CTA: "Help teammate"]       ← S-02 positie pick → S-40 L2
```

**Geen:** Positie QuickActionRow · speelster Apply · WeekPlan edit.

### Componenten
- `CaptainCard` C-B11  
- `TeamAgreementList` C-D01  
- `CueList` C-D02  
- `RustNote` C-D03  
- `CueCard` C-B14 (rows)

### Informatiehiërarchie
1. 60s script  
2. Afspraken  
3. Roepen  
4. Rust / help

### CTA's
| CTA | Actie |
|-----|-------|
| Expand CaptainCard | Toon script |
| Copy cue | Clipboard |
| Rust teaser | S-52 |
| Help teammate | S-02 → S-42/S-40 L2 |

### Empty states
| Conditie | Copy |
|----------|------|
| Geen WeekPlan push | “Wacht op trainer push” — **geen** oude briefing als actueel |
| Geen cues | “Nog geen roepen deze week” |

### Loading / Offline / Error
Skeleton card. Offline: cached last **pushed** week only (niet draft). Error + Retry.

### Navigatie
Header rol. Bottom Positie beschikbaar voor eigen view. Geen bottom “Captain” tab.

### Swipe / Scroll
Vertical. Pull-to-refresh.

### Mobiel / Desktop
Mobiel primary. Desktop: bredere CueList · geen extra widgets.

### Accessibility
Copy buttons gelabeld. Script als artikel.

### Prestatie
Open → script zichtbaar ≤1 s. Total path ≤60 s.

---

## S-71 · Trainer Dashboard

### Doel
Weekplan · TPL · oefening · **Push naar team**.

### Gebruiker
Trainer (rol-gate).

### Open-conditie
Header Rol → Trainer → `/team/trainer`.

### Layout

```
[AppHeader · rol Trainer]
[TrainerCard / WeekPlanCard]
  - Week PB selector (menselijke titel)
[TPLPointEditor]             ← exact 3 punten
[ExerciseCard]               ← koppel / bewerk short
[PrimaryCTA: "Push naar team"]
[TeamReflectionAggregate]
[Secondary: "Fragment bespreken"] → S-45
[Link: Post-match evaluatie] → S-72 (buiten deze C.1 scope detail)
```

**Trainer doet maandag NIET:** L5 herschrijven · 34 PB browsen · sidecars editen.

### Componenten
- `TrainerCard` C-B12  
- `WeekPlanCard` C-D04  
- `TPLPointEditor` C-D05  
- `ExerciseCard` C-B17  
- `TeamReflectionAggregate` C-D06  
- `WeekCard` C-B16 **niet** hier — speelster-variant; trainer gebruikt WeekPlanCard

### Informatiehiërarchie
1. Welk PB deze week  
2. TPL 3  
3. Oefening  
4. Push  
5. Reflectie-aggregaat

### CTA's
| CTA | Actie |
|-----|-------|
| **Push naar team** | Zet `pushed_at` · notificatie Should · speelsters zien WeekCard |
| Fragment bespreken | S-40/S-45 |
| Edit TPL | Inline save |
| Select PB | Picker (menselijke titels · gegroepeerd ACE — geen raw nummers in label) |

### Empty / Loading / Offline / Error
| State | Gedrag |
|-------|--------|
| Geen draft | Empty “Kies week-PB” |
| Push zonder PB/TPL | Validatie block |
| Offline push | Queue + “Push wanneer online” |
| Push success | Toast “Team geïnformeerd” |

### Navigatie
Header rol. Geen speelster Quick actions.

### Swipe / Scroll
Vertical form scroll. Pull-to-refresh aggregate.

### Mobiel / Desktop
Mobiel: stacked form. Desktop: TPL editor inline wider · aggregate table.

### Accessibility
Push = destructive-ish confirm? MVP: confirm dialog “Push naar alle speelsters?”. TPL fields gelabeld 1–3.

### Prestatie
Push ≤5 min total journey (Journey 2A). Screen interactions snappy ≤300 ms.

---

# 2. UX-validatie

## 2.1 Geen dubbele componenten

| Check | Resultaat |
|-------|-----------|
| `TwentySecCard` | Één component · S-42 / S-51 / S-52 / S-62 |
| `ApplyChecklist` | Één component · S-20 / S-43 / S-51 · context props |
| `QuickActionRow` | **Alleen S-20** |
| `WeekCard` vs `WeekPlanCard` | Speelster vs Trainer — bewust gescheiden |
| `CaptainCard` | Alleen S-70 |
| Pins / LastViewed / Progress | Alleen Seizoen — niet op S-20 |

**Pass.**

## 2.2 Geen verborgen functies

| Functie | Zichtbare entry |
|---------|-----------------|
| 20 sec | Quick + tab + probleem CTA |
| Visual | Quick + tab |
| Apply | Match-context tab + S-20/S-51 |
| Reflectie | S-53 CTA |
| Captain/Trainer | Header rol |
| Speelboek | S-60 teaser (locked state zichtbaar) |

Geen long-press-only Must features. Pin MVP via overflow menu — gedocumenteerd in S-60 empty (niet verborgen zero-entry).

**Pass** met pin-entry als enige “light” edge (Later polish).

## 2.3 Geen overbodige stappen

| Flow | Stappen |
|------|---------|
| Open → 20 sec | 1 (Quick) |
| Probleem → L2 | 2 (S-35→S-36→CTA) of 3 incl. tab |
| Wedstrijd klaar | 1 (Quick) of 2 (bottom→Vóór) |
| Reflectie | S-53 → S-54 (3) → S-55 — nodig voor soft mandatory |

S-50 hub skip via Quick = bewust.

**Pass.**

## 2.4 Max 3 taps naar belangrijke content

| Intentie | Taps | Pass |
|----------|------|------|
| 20 sec | 1 | ✅ |
| Visual | 1 | ✅ |
| Wedstrijd vóór | 1–2 | ✅ |
| Probleem-fix L2 | 2–3 | ✅ |
| Week L4 | 1 (WeekCard) | ✅ |
| Captain 60s | 1 (rol) + expand | ✅ |
| Trainer push UI | 1 (rol) | ✅ |

**Pass.**

## 2.5 Consistentie Journey Freeze

| Regel | Wireframe |
|-------|-----------|
| App open → S-20 | ✅ |
| Matchday 90s · geen L5/Seizoen/Zoek | ✅ S-51 verbodenlijst |
| Rust ≤30s · max 2 L2 | ✅ S-52 (PDS 90s overruled) |
| Vr = L2+L3 | ✅ defaults |
| Ma–Wo = L4 | ✅ |
| Reflectie 3 → Leerpunt | ✅ |
| WeekPlan push vereist | ✅ empty states |
| Positiewissel instant | ✅ header S-02 |

**Pass.**

## 2.6 Consistentie Product Design System

| Item | Status |
|------|--------|
| Component IDs hergebruikt | ✅ |
| 5 bottom tabs | ✅ |
| Layer tabs 5 · L0 inline | ✅ |
| Quick alleen Positie | ✅ |

**Pass** met 2 PDS-correcties vastgelegd in §4.

## 2.7 Consistentie Architecture Freeze

| Item | Status |
|------|--------|
| Geen PB-first nav | ✅ |
| Context stacks | ✅ |
| L3 match-gate | ✅ |
| Positie = home | ✅ |
| MVP 7 problemen | ✅ |

**Pass.**

---

# 3. MVP Critical Path

Prototype / Phase D Must bouwen in deze volgorde:

```
P0  S-00 Shell + S-20 Positie
P1  S-40 Shell + S-42 L2 + S-44 L4 + S-41 L1
P2  S-43 L3 (match-gate) + S-51 Vóór
P3  S-53 → S-54 → S-55 Reflectie-lus
P4  S-35 → S-36 Probleem
P5  S-71 Trainer Push + S-70 Captain
P6  S-50 Hub + S-46 Oefening
P7  S-60 Seizoen basic + S-61 log
P8  S-52 Rust (Should S3) · S-45 L5 · S-62 Speelboek (Later/light)
```

**Demo-script (pilot):**  
Onboarding (bestaand) → S-20 → Trainer push (S-71) → Speelster L4 → Vrijdag S-51 → Na S-54 → Leerpunt op S-20 → Captain S-70.

**Critical path schermen (Must):**  
S-20 · S-35 · S-36 · S-40 · S-41 · S-42 · S-43 · S-44 · S-46 · S-50 · S-51 · S-53 · S-54 · S-55 · S-60 · S-70 · S-71  

**Should op path:** S-52 · offline cache  
**Light/Later op path:** S-45 (tab aanwezig) · S-61 · S-62

---

# 4. Laatste inconsistenties

| # | Bronnen | Conflict | Besluit C.1 (bindend voor prototype) |
|---|---------|----------|--------------------------------------|
| I1 | PDS S-52 “≤90 sec” vs Journey “≤30 sec” | Tijdslimiet rust | **≤30 sec** (Journey) |
| I2 | PDS S-52 CTA “→ S-62” | Speelboek ≠ rust | **Verworpen** · RustNote inline / S-52 only |
| I3 | Journey “weinig detail S-62” vs C.1 vraag S-62 | Scope | **Light spec** opgenomen · Export Later |
| I4 | ScorePhaseCard niet in PDS inventory | Nieuw pattern | Toegestaan als MatchBanner-variant · geen nieuwe tier-B card tenzij ACR |
| I5 | Pin entry MVP dun | Long-press vs menu | Overflow menu op content — documenteer in implementatie; geen 6e tab |
| I6 | S-52 Should vs Must | Rust kan ontbreken | Fallback L2 heropen S-51 — wireframe behoudt S-52 voor Should |

**Geen blockers** voor prototype GO.

---

# 5. Definitieve GO voor prototype

```
ACADEMY-WIRE-v1.0
Phase: C.1 — Complete MVP Wireframe Specification

Screens specified:     21 (S-20, S-35–36, S-40–46, S-50–55, S-60–62, S-70–71)
Aligned to:            ARCH-v1.1 · PDS-v1.0 · JOURNEY-v1.0
Duplicate components:  None blocking
Hidden features:       None Must
Tap budgets:           Pass (≤3)
Critical path:         Defined P0–P8
Inconsistencies:       6 resolved · 0 blockers

STATUS: ✅ READY FOR PROTOTYPE GO

Na gebruikersgoedkeuring:
  → UX-fase Academy = AFGEROND
  → Phase C.2 / D: interactive prototype + design tokens (visueel)
  → Geen verdere wireframe-scope zonder ACR
```

### GO-checklist (user)

- [ ] Journey Freeze v1.0 approved  
- [ ] Wireframe Spec v1.0 approved (dit document)  
- [ ] Critical path P0–P5 akkoord voor eerste prototype  
- [ ] I1–I6 besluiten geaccepteerd  

**Prototype mag starten na jouw expliciete GO.**

---

*Document: `academy-mvp-wireframe-spec-v1.0.md`*  
*Prev: Phase C.0 Journey Freeze · Next: Prototype (na GO) · Design tokens visueel (apart)*
