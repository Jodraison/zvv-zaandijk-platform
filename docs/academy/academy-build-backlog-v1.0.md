# Academy Build Backlog — v1.0 (Execution Ready)

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** E.1 — Build Backlog  
**Parent:** `ACADEMY-IMP-v1.0` (Implementation Master Plan)  
**Status:** ✅ **BUILD READY**

**Scope:** Uitvoerbare taken · sprints · risico's · testmomenten  
**Verboden:** nieuw ontwerp · nieuwe architectuur · nieuwe schermen · nieuwe componenten · nieuwe registries · UX-discussies

> Vanaf certificering: **alleen** implementatie · testen · certificeren.  
> Geen nieuwe ontwerpdocumenten.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **BUILD READY** | Alle WP's → taken · 5 sprints · readiness score |

---

# 0. Conventies

| Veld | Regel |
|------|-------|
| **Task ID** | `T-{WP}-{nn}` bv. `T-01-01` · content `T-C-01` |
| **Complexiteit** | S / M / L / XL (zelfde schaal als E.0) |
| **Duur** | Persondagen (pd) |
| **Parallel** | Ja = mag naast andere open taken op andere track |
| **Prio** | Must · Should · Later(blocked tot G-CERT) |

**Globale DoD (iedere taak):**  
TypeScript · geen nieuwe S-xx/C-ID · geen PB# in UI · tests groen · empty/loading/error waar Wire voorschrijft · PR checklist E.0 §8.

---

# 1. Complete Build Backlog (per WP)

---

## WP01 — Academy Shell

### T-01-01 · Academy mount & feature flag
| | |
|--|--|
| **Doel** | Mount Academy onder bestaande auth (`/academy` of flag) zonder platform-nav te breken |
| **Deps** | — |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (vs WP03) |
| **DoD** | Feature flag aan/uit · authenticated only · geen regressie bestaande routes |
| **Acceptatie** | Login → Academy bereikbaar · flag off = hidden |

### T-01-02 · AppHeader (C-A01 + PositionBadge + Zoek + Rol)
| | |
|--|--|
| **Doel** | Persistent header zones volgens Wire/PDS |
| **Deps** | T-01-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee (na mount) |
| **DoD** | Positie badge · 🔍 slot · Profiel/Rol · a11y names |
| **Acceptatie** | 3 zones zichtbaar op alle Academy-pages |

### T-01-03 · BottomTabBar + SidebarNav (5 tabs)
| | |
|--|--|
| **Doel** | Exact 5 tabs: Positie · Situatie · Probleem · Wedstrijd · Seizoen |
| **Deps** | T-01-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (vs T-01-02) |
| **DoD** | Mobile bottom · desktop sidebar · active state · geen 6e tab |
| **Acceptatie** | ARCH M4 · tab switch werkt (ook stub pages) |

### T-01-04 · RoleMenu gated (Captain/Trainer)
| | |
|--|--|
| **Doel** | Rol-switch UI · disable zonder grant |
| **Deps** | T-01-02 · bestaande roles |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Gated badges · logout/settings stub ok |
| **Acceptatie** | Non-captain ziet Captain disabled + uitleg |

### T-01-05 · OfflineBanner + LoadingSkeleton slots
| | |
|--|--|
| **Doel** | System patterns C-C25/C-C27 in shell |
| **Deps** | T-01-01 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | Banner toggleable · skeleton export |
| **Acceptatie** | Offline flag toont banner onder header |

---

## WP02 — Routing

### T-02-01 · Route table Must paths
| | |
|--|--|
| **Doel** | Alle Must-routes ARCH §2.2 als App Router pages/stubs |
| **Deps** | T-01-03 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | `/positie` default · situatie/probleem/content/wedstrijd/seizoen/team/* · onboarding |
| **Acceptatie** | Geen `/home` · 404 Academy-safe |

### T-02-02 · Deep links + `?layer=` + origin stack
| | |
|--|--|
| **Doel** | Proto deep-link matrix · Back origin op content |
| **Deps** | T-02-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | Origin context provider · layer query · replace vs push policy |
| **Acceptatie** | Push `?highlight=week` · `/wedstrijd/voor` · `/probleem/uitstappen-twijfel` |

### T-02-03 · Onboarding routes S-10 → S-11 → S-20
| | |
|--|--|
| **Doel** | First-launch gate + route flow (UI kan light zijn tot T-04-*) |
| **Deps** | T-02-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Flag `onboarding_complete` · redirect rules |
| **Acceptatie** | Nieuwe user kan S-10 niet skippen naar Positie |

---

## WP03 — Registry Loader

### T-03-01 · Zod schemas from academy-content-schema
| | |
|--|--|
| **Doel** | Runtime/build validatie voor registries + sidecar shape |
| **Deps** | Phase B files (frozen) |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Zod modules · type exports · fail-fast errors |
| **Acceptatie** | Invalid fixture faalt unit test |

### T-03-02 · Loaders: problems · situations · playbooks · positions · tags · visuals
| | |
|--|--|
| **Doel** | Typed getters `getProblem` · `getAnkers` · etc. |
| **Deps** | T-03-01 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Nee |
| **DoD** | Alle Phase B YAML laden · MVP7 problems · 11 pos · 6 moments |
| **Acceptatie** | CI script `academy:validate-registries` groen |

### T-03-03 · PositieAnker accessor (3 tasks/pos)
| | |
|--|--|
| **Doel** | Anker data voor S-20 |
| **Deps** | T-03-02 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | `getAnkers(pos)` returns exactly 3 |
| **Acceptatie** | LB/RB/L6 samples non-empty |

---

## WP-C — Sidecar Pilot Pack

### T-C-01 · Sidecar pb.27 (L0–L4 · 11 pos waar required)
| | |
|--|--|
| **Doel** | Pilot week A content |
| **Deps** | T-03-01 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja |
| **DoD** | Schema-valid · menselijke titel · exercise string · cues |
| **Acceptatie** | Trainer review sign-off checklist |

### T-C-02 · Sidecar week-B PB (L0–L4)
| | |
|--|--|
| **Doel** | Pilot week B (pb.25 of pb.20 — frozen keuze) |
| **Deps** | T-03-01 · product owner keuze vastgelegd |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja (vs T-C-01) |
| **DoD** | Zelfde kwaliteit als pb.27 |
| **Acceptatie** | Schema + trainer sign-off |

### T-C-03 · Visual asset + registry bind (1×)
| | |
|--|--|
| **Doel** | M9 primary visual voor pilot week |
| **Deps** | T-03-02 visuals |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Asset in repo/CDN · `visual_primary` set |
| **Acceptatie** | L1 toont beeld of documented placeholder |

### T-C-04 · Captain cues + 3 afspraken seed voor pb.27
| | |
|--|--|
| **Doel** | Data voor S-70 na push |
| **Deps** | T-C-01 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | 5 cues · 3 agreements in seed/sidecar |
| **Acceptatie** | Captain empty verdwijnt na push fixture |

---

## WP05 — Content Engine *(kritiek — vroeg starten)*

### T-05-01 · ContentPageShell + StickyLayerTabs
| | |
|--|--|
| **Doel** | S-40 shell · 5 tabs · sticky |
| **Deps** | T-02-02 · T-03-02 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja (vs WP14 later) |
| **DoD** | Tabs Visual/20sec/Apply/2min/Volledig · swipe mobiel |
| **Acceptatie** | M12 tab bar aanwezig |

### T-05-02 · defaultLayer(context) + match-gate Apply
| | |
|--|--|
| **Doel** | Journey/ARCH default tab + L3 greyed |
| **Deps** | T-05-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | Unit tests alle contexts · tooltip non-match |
| **Acceptatie** | Week→L4 · Probleem→L2 · Apply disabled thuis |

### T-05-03 · TwentySecCard panel (L2)
| | |
|--|--|
| **Doel** | S-42 uit sidecar positie-variant |
| **Deps** | T-05-01 · T-C-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (vs T-05-04) |
| **DoD** | 4 acties + CueCard · fallback shared |
| **Acceptatie** | RB vs LB tekst verschilt op pb.27 |

### T-05-04 · TwoMinCard panel (L4)
| | |
|--|--|
| **Doel** | S-44 3× BulletGroup |
| **Deps** | T-05-01 · T-C-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Fouten/Afspraken/Gedragingen · CTA Oefening/Dieper |
| **Acceptatie** | ≤200 woorden target · links werken |

### T-05-05 · ApplyChecklist panel (L3)
| | |
|--|--|
| **Doel** | S-43 match-only |
| **Deps** | T-05-02 · T-C-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | 3 toggles persist · ExerciseLink |
| **Acceptatie** | Non-match tab greyed · match enabled |

### T-05-06 · L5 MarkdownViewer + §8 accordion
| | |
|--|--|
| **Doel** | S-45 placeholder→real MD voor pilot PB |
| **Deps** | T-05-01 · playbook MD files |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Lazy load · §8 positie default open · geen matchday entry |
| **Acceptatie** | Tab Volledig rendert zonder crash |

### T-05-07 · S-46 Oefening page
| | |
|--|--|
| **Doel** | Exercise detail + back to L4 |
| **Deps** | T-05-04 · T-C-01 exercise |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Empty state · PlaybookCard compact |
| **Acceptatie** | Week oefening titel zichtbaar |

### T-05-08 · Content header (menselijke titel · geen PB#)
| | |
|--|--|
| **Doel** | Label rules frozen |
| **Deps** | T-05-01 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | Lint/test verbiedt `/pb\.\d+/` in visible header |
| **Acceptatie** | UI toont “Eerste pass” niet “PB27” |

---

## WP14 — Visual Engine

### T-14-01 · VisualViewer + TriggerInline (L0)
| | |
|--|--|
| **Doel** | S-41 panel core |
| **Deps** | T-05-01 · T-C-03 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (met WP05 panels) |
| **DoD** | L0 boven beeld · empty state · loading skeleton |
| **Acceptatie** | M9 path werkt |

### T-14-02 · PositionHighlightLegend
| | |
|--|--|
| **Doel** | Legend 11 kleuren · eigen positie bold |
| **Deps** | T-14-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Nee |
| **DoD** | Niet kleur-only (labels) |
| **Acceptatie** | a11y labels aanwezig |

---

## WP07 — Problem Engine

### T-07-01 · S-35 Problem list (MVP7 + Later accordion)
| | |
|--|--|
| **Doel** | Registry-driven overzicht |
| **Deps** | T-03-02 · T-02-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (na Content skeleton) |
| **DoD** | Sort_order · onboarding hint optional |
| **Acceptatie** | M8 · 7 zichtbaar · 3 collapsed |

### T-07-02 · S-36 Fix Flow + Start 20 sec
| | |
|--|--|
| **Doel** | Bridge → S-40 L2 |
| **Deps** | T-07-01 · T-05-03 |
| **Cx / Duur** | M · 2 pd |
| **Parallel** | Nee |
| **DoD** | FocusLine · CTA's · disabled zonder pb_refs |
| **Acceptatie** | U2: uitstappen ≤3 taps tot L2 |

---

## WP04 — Dashboard Engine + Onboarding UI

### T-04-01 · S-10/S-11 onboarding UI
| | |
|--|--|
| **Doel** | Positie + max 2 problemen · Start Academy |
| **Deps** | T-02-03 · T-03-02 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja |
| **DoD** | Persist primary_pos · problems · M1 |
| **Acceptatie** | Journey scenario 1 tot S-20 |

### T-04-02 · VandaagBanner + QuickActionRow
| | |
|--|--|
| **Doel** | Zones 1–2 S-20 · Quick alleen hier |
| **Deps** | T-02-01 · T-05-03/14/08 routes |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | 20s→L2 · Visual→L1 · Wedstrijd→S-51 |
| **Acceptatie** | Quick nergens anders gerenderd |

### T-04-03 · PositieAnkerList
| | |
|--|--|
| **Doel** | 3 ankers → content |
| **Deps** | T-03-03 · T-05-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | M3 · tap → S-40 L4 default |
| **Acceptatie** | Wissel positie herlaadt ankers |

### T-04-04 · WeekCard + empty state
| | |
|--|--|
| **Doel** | Alleen bij `pushed_at` · anders empty copy |
| **Deps** | WeekPlan read API (T-11-*) · T-05-04 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee (wacht stub ok) |
| **DoD** | Empty “Trainer zet klaar” · links Situatie/Probleem · highlight deep link |
| **Acceptatie** | F.week.empty vs pushed fixtures |

### T-04-05 · ApplyChecklist op S-20 (matchweek) + LeerpuntCard
| | |
|--|--|
| **Doel** | Conditional zones 4–5 |
| **Deps** | T-05-05 · T-13-* read |
| **Cx / Duur** | M · 2 pd |
| **Parallel** | Ja |
| **DoD** | Hidden non-matchweek · leerpunt hidden if none |
| **Acceptatie** | Wire visibility rules |

### T-04-06 · SituationShortcutGrid
| | |
|--|--|
| **Doel** | 4 shortcuts |
| **Deps** | T-06-01 of stub links |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | 4 buttons · naar situatie |
| **Acceptatie** | ARCH §4.1 widget 7 |

### T-04-07 · S-02 Positie Switcher
| | |
|--|--|
| **Doel** | Primary (+ secondary Should) switch |
| **Deps** | T-01-02 · T-03-02 |
| **Cx / Duur** | M · 2 pd |
| **Parallel** | Ja |
| **DoD** | Bottom sheet mobiel · instant reload S-20 |
| **Acceptatie** | Journey scenario 7 behavior |

---

## WP11 — Trainer Module

### T-11-01 · WeekPlan data model + Supabase tables/RLS
| | |
|--|--|
| **Doel** | Persoonlijke data: WeekPlan · TPL · pushed_at |
| **Deps** | Auth team · schema entities |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja (vroeg) |
| **DoD** | Migration · RLS team-scoped · geen secrets in repo |
| **Acceptatie** | Trainer write · speelster read pushed only |

### T-11-02 · S-71 WeekPlanCard + PB picker (menselijke titels)
| | |
|--|--|
| **Doel** | Kies week-PB |
| **Deps** | T-11-01 · T-03-02 · T-01-04 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | Geen PB# labels · ACE grouping ok |
| **Acceptatie** | Select pb.27 als “Eerste pass” |

### T-11-03 · TPLPointEditor ×3 + ExerciseCard bind
| | |
|--|--|
| **Doel** | Exact 3 TPL · oefening koppelen |
| **Deps** | T-11-02 · T-C-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Validatie 3 filled |
| **Acceptatie** | Push blocked indien incompleet |

### T-11-04 · Push naar team + confirm + toast
| | |
|--|--|
| **Doel** | M10 · zet pushed_at · speelster WeekCard |
| **Deps** | T-11-03 · T-04-04 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | Confirm dialog · idempotent push · Should notif hook stub |
| **Acceptatie** | U5 ≤5 min · cross-user WeekCard visible |

### T-11-05 · TeamReflectionAggregate (read)
| | |
|--|--|
| **Doel** | Basic aggregate na reflecties |
| **Deps** | T-13-03 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja (laat) |
| **DoD** | Counts/list stub ok |
| **Acceptatie** | Na U6 data verschijnt |

### T-11-06 · Fragment bespreken → L5
| | |
|--|--|
| **Doel** | Link naar S-40 L5 |
| **Deps** | T-05-06 · T-11-02 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | Opens current week PB L5 |
| **Acceptatie** | CTA werkt |

---

## WP06 — Situation Engine

### T-06-01 · S-30 MomentGateCard ×6
| | |
|--|--|
| **Doel** | ACE poorten |
| **Deps** | T-03-02 · T-02-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | 6 poorten · M7 start |
| **Acceptatie** | Tap → S-31 |

### T-06-02 · S-31 Poort hub + extended accordion
| | |
|--|--|
| **Doel** | Core/extended situations |
| **Deps** | T-06-01 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee |
| **DoD** | SituationCard list |
| **Acceptatie** | Extended collapsed default |

### T-06-03 · S-32 Detail + CTA Visual/20 sec
| | |
|--|--|
| **Doel** | Bridge naar content |
| **Deps** | T-06-02 · T-05-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Nee |
| **DoD** | Trigger preview · PlaybookCard compact |
| **Acceptatie** | CTA's openen juiste layer |

---

## WP08 — Matchday Engine

### T-08-01 · Match entity + phase resolver
| | |
|--|--|
| **Doel** | MatchBanner data · auto-fase pre/ht/post |
| **Deps** | T-11-01 patterns · team schedule stub/seed |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Fixtures F.match.* · empty “geen wedstrijd” |
| **Acceptatie** | Phase defaults correct |

### T-08-02 · S-50 Hub + PhaseTabs
| | |
|--|--|
| **Doel** | Vóór/Rust/Na container |
| **Deps** | T-08-01 · T-02-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Nee |
| **DoD** | Swipe tabs · bottom Wedstrijd active |
| **Acceptatie** | Hub reachable |

### T-08-03 · S-51 Vóór (checklist + L2 embed + visual toggle + Klaar)
| | |
|--|--|
| **Doel** | ≤90s path · verboden entries |
| **Deps** | T-08-02 · T-05-03 · T-05-05 · T-14-01 |
| **Cx / Duur** | L · 5 pd |
| **Parallel** | Nee |
| **DoD** | Quick skip hub · geen Seizoen/Zoek/L5/L4 links · Klaar |
| **Acceptatie** | U3 pass |

### T-08-04 · S-53 Na entry CTAs
| | |
|--|--|
| **Doel** | Reflecteer / Later skip |
| **Deps** | T-08-02 · T-13-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Soft skip counter hook · already-done state |
| **Acceptatie** | CTA → S-54 |

### T-08-05 · S-52 Rust (Should)
| | |
|--|--|
| **Doel** | ≤30s delta · rol extras |
| **Deps** | T-08-02 · T-05-03 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja (na Must S-51) |
| **DoD** | Max 2 L2 points · fallback knop · captain RustNote slot |
| **Acceptatie** | Should S3 · niet blocking G-PILOT-LIVE |

---

## WP13 — Reflection Engine

### T-13-01 · Reflection + Leerpunt DB + RLS
| | |
|--|--|
| **Doel** | Persist 3 answers · leerpunt · skip count |
| **Deps** | Auth · Match |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Ja |
| **DoD** | Migration · soft mandatory max 2 skips |
| **Acceptatie** | Unit skip rules |

### T-13-02 · S-54 wizard (3 steps)
| | |
|--|--|
| **Doel** | ReflectionStep flow |
| **Deps** | T-13-01 · T-08-04 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Nee |
| **DoD** | Tab lock · validatie · swipe mobiel · Opslaan |
| **Acceptatie** | U6 tot Opslaan |

### T-13-03 · S-55 Success + stack replace → S-20
| | |
|--|--|
| **Doel** | Leerpunt preview · Naar Positie |
| **Deps** | T-13-02 · T-04-05 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Nee |
| **DoD** | No back to empty wizard · leerpunt visible S-20 |
| **Acceptatie** | U6 complete |

---

## WP10 — Captain Module

### T-10-01 · S-70 CaptainCard + agreements + CueList
| | |
|--|--|
| **Doel** | 60s briefing UI |
| **Deps** | T-11-04 · T-C-04 · T-01-04 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Nee (na push) |
| **DoD** | Empty without push · expand script · copy cues |
| **Acceptatie** | U4 ≤60s · M11 |

### T-10-02 · Help teammate → S-02 → L2
| | |
|--|--|
| **Doel** | Captain help path |
| **Deps** | T-10-01 · T-04-07 · T-05-03 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Positie pick → content L2 |
| **Acceptatie** | Flow compleet |

### T-10-03 · RustNote teaser → S-52
| | |
|--|--|
| **Doel** | Live rust entry |
| **Deps** | T-10-01 · T-08-05 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | Hidden buiten rust-window |
| **Acceptatie** | Deep link works |

---

## WP09 — Season Engine (Must-light)

### T-09-01 · S-60 Progress + reflectie preview + pins/lastViewed shells
| | |
|--|--|
| **Doel** | Seizoen hub basic |
| **Deps** | T-13-03 · pin/lastViewed storage light |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja (na reflectie) |
| **DoD** | Geen S-20 widget overlap · empty copies |
| **Acceptatie** | Bottom Seizoen usable |

### T-09-02 · S-61 Reflectielog
| | |
|--|--|
| **Doel** | Chronologische list |
| **Deps** | T-09-01 · T-13-01 |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Expand cards · back S-60 |
| **Acceptatie** | Post-U6 entries visible |

### T-09-03 · S-62 lock teaser only
| | |
|--|--|
| **Doel** | Locked criteria UI · geen compile |
| **Deps** | T-09-01 |
| **Cx / Duur** | S · 1 pd |
| **Parallel** | Ja |
| **DoD** | Export disabled · unlock rules copy |
| **Acceptatie** | Later scope respected |

---

## WP15 — Analytics Hooks

### T-15-01 · Event schema + scrub + emitter
| | |
|--|--|
| **Doel** | Pilot KPI events zonder PII |
| **Deps** | — (instrument later) |
| **Cx / Duur** | S · 2 pd |
| **Parallel** | Ja |
| **DoD** | Typed events · scrubFields |
| **Acceptatie** | Unit schema tests |

### T-15-02 · Instrument critical path + CSV/export helper
| | |
|--|--|
| **Doel** | U-01/U-04/U-05/L hooks meetbaar |
| **Deps** | T-15-01 · WP04/08/11/13 |
| **Cx / Duur** | M · 3 pd |
| **Parallel** | Nee (laat) |
| **DoD** | Staging fire · export for rapport |
| **Acceptatie** | Pilot §4 mapping |

---

## WP12 — Search Engine (Should)

### T-12-01 · S-01 overlay index problems/situations/cues
| | |
|--|--|
| **Doel** | MVP search |
| **Deps** | T-03-02 · T-01-02 |
| **Cx / Duur** | M · 4 pd |
| **Parallel** | Ja |
| **DoD** | Result groups · default layers · dismiss |
| **Acceptatie** | “uitstappen” ≤3s · ARCH §2.6 |

### T-12-02 · Desktop `/` shortcut
| | |
|--|--|
| **Doel** | PDS desktop |
| **Deps** | T-12-01 |
| **Cx / Duur** | S · 0.5 pd |
| **Parallel** | Ja |
| **DoD** | Shortcut opens overlay |
| **Acceptatie** | Works when focused in app |

---

## Should gaps (Sprint 5 optioneel)

### T-S-01 · Offline L2/L3 cache week
| Cx S–M · 3 pd · Parallel Ja · na T-05-03/T-08-03 |

### T-S-02 · Push notification WeekPlan
| Cx M · 3 pd · Parallel Ja · na T-11-04 |

### T-S-03 · Secondary positie fully wired
| Cx S · 2 pd · Parallel Ja · extends T-04-07 |

---

## Post G-CERT (niet in Sprint 1–5 Must)

| ID | Titel | Note |
|----|-------|------|
| T-E-* | WP-E Full retrofit 34 sidecars | ARCH Phase E |
| T-F-* | Speelboek compile · Admin · Staff · full offline | Phase F |

---

# 2. Sprintindeling

**Aanname:** 2 engineers · 2-week sprints (S5 = 1 week harden).  
**Track A / Track B** parallel waar “Parallel=Ja”.

---

## Sprint 1 — Foundation (Weken 1–2)

**Doel:** Shell · Routing · Registries · Sidecar start · DB WeekPlan start

| Track A | Track B |
|---------|---------|
| T-01-01 → T-01-02 → T-01-03 → T-01-04 → T-01-05 | T-03-01 → T-03-02 → T-03-03 |
| T-02-01 → T-02-02 → T-02-03 | T-C-01 · T-C-02 (start) · T-C-03 |
| | T-11-01 (WeekPlan schema) |

**Exit Sprint 1:** Tabs navigeren · registries CI groen · pb.27 sidecar draft · `/positie` stub.

### Risico's Sprint 1
| | |
|--|--|
| **Grootste risico** | Platform nav/auth conflict (I2) |
| **Fallback** | Feature-flag off · Academy-only mount |
| **Blocker** | Geen team-auth → stop |
| **Mitigatie** | Hergebruik bestaande Supabase session · early spike T-01-01 dag 1 |

### Testmomenten Sprint 1
| Type | Wat |
|------|-----|
| Technisch | CI registries · typecheck · route smoke |
| Functioneel | Tab switch · header zones |
| Acceptatie | M4 partial · geen `/home` |
| **Demo** | “Open Academy → 5 tabs + header” |

---

## Sprint 2 — Content Core (Weken 3–4)

**Doel:** Content Engine + Visual + Problem → L2 · Onboarding UI start

| Track A | Track B |
|---------|---------|
| T-05-01 → T-05-02 → T-05-03 → T-05-04 → T-05-05 → T-05-08 | T-14-01 → T-14-02 |
| T-05-06 · T-05-07 | T-07-01 → T-07-02 |
| | T-04-01 · T-C-01/02 finish · T-C-04 |

**Exit Sprint 2:** pb.27 L1–L5 · Probleem→L2 · onboarding tot S-20 (dashboard thin ok).

### Risico's Sprint 2
| | |
|--|--|
| **Grootste risico** | WP05 ontspoort (I1) |
| **Fallback** | Ship L2+L4 only · L5 placeholder · L1 empty ok |
| **Blocker** | Sidecar invalid → Content blocked |
| **Mitigatie** | T-C-01 done-definition vóór T-05-03 · skeleton-first |

### Testmomenten Sprint 2
| Type | Wat |
|------|-----|
| Technisch | defaultLayer unit · sidecar validate |
| Functioneel | U2 pad · layer tabs |
| Acceptatie | M8 · M12 · M9 path |
| **Demo** | “Probleem Uitstappen → 20 sec RB” |

---

## Sprint 3 — Positie + Trainer + Situatie (Weken 5–6)

**Doel:** S-20 vol · Trainer push · Situatie drill-down

| Track A | Track B |
|---------|---------|
| T-04-02 → T-04-03 → T-04-04 → T-04-05 → T-04-06 → T-04-07 | T-11-02 → T-11-03 → T-11-04 → T-11-06 |
| | T-06-01 → T-06-02 → T-06-03 |

**Exit Sprint 3:** Push → WeekCard → L4/oefening · Situatie→content · Quick actions live.

### Risico's Sprint 3
| | |
|--|--|
| **Grootste risico** | Push/RLS speelster ziet draft (data leak) |
| **Fallback** | Read only `pushed_at IS NOT NULL` enforced in query |
| **Blocker** | T-11-01 incompleet |
| **Mitigatie** | RLS tests verplicht · fixture cross-user |

### Testmomenten Sprint 3
| Type | Wat |
|------|-----|
| Technisch | RLS tests · WeekPlan integratie |
| Functioneel | U5 · U1 oefening |
| Acceptatie | M1–M3 · M6 · M7 · M10 |
| **Demo** | “Trainer push → speelster WeekCard → oefening” |

---

## Sprint 4 — Matchday + Reflectie + Captain + Seizoen (Weken 7–8)

**Doel:** Kritieke matchday-lus + captain + seizoen light

| Track A | Track B |
|---------|---------|
| T-08-01 → T-08-02 → T-08-03 → T-08-04 | T-13-01 → T-13-02 → T-13-03 |
| T-08-05 (Should) | T-10-01 → T-10-02 → T-10-03 |
| | T-09-01 → T-09-02 → T-09-03 |
| | T-11-05 |

**Exit Sprint 4:** U3–U6 + U4 op staging · Seizoen basic.

### Risico's Sprint 4
| | |
|--|--|
| **Grootste risico** | S-51 scope creep / forbidden links |
| **Fallback** | Hard-code allowlist components only on S-51 |
| **Blocker** | Reflectie DB |
| **Mitigatie** | Checklist review vs Journey verbodenlijst in PR |

### Testmomenten Sprint 4
| Type | Wat |
|------|-----|
| Technisch | Reflection skip unit · match phase |
| Functioneel | U3 · U4 · U6 |
| Acceptatie | M5 · M11 |
| **Demo** | “90s Klaar → Na → Reflectie → Leerpunt op Positie” + Captain 60s |

---

## Sprint 5 — Harden + Hooks + Should (Week 9)

**Doel:** G-PILOT-LIVE · analytics · optionele Should

| Must | Should (capaciteit) |
|------|---------------------|
| T-15-01 → T-15-02 | T-12-01 · T-12-02 |
| Bugfix P0 uit U1–U6 | T-S-01 · T-S-02 · T-S-03 |
| Staging full regression | T-08-05 polish |

**Exit Sprint 5:** **G-PILOT-LIVE** — U1–U6 pass · M1–M12 · ready field pilot.

### Risico's Sprint 5
| | |
|--|--|
| **Grootste risico** | Te veel Should → Must delay |
| **Fallback** | Cut WP12/T-S-* · Probleem/Situatie fallback |
| **Blocker** | Open S0 bugs |
| **Mitigatie** | Freeze Should dag 1 Sprint 5 indien P0 open |

### Testmomenten Sprint 5
| Type | Wat |
|------|-----|
| Technisch | Full CI · event export |
| Functioneel | U1–U6 formal |
| Acceptatie | ARCH M1–M12 checklist signed |
| **Demo** | “Pilot-ready build walkthrough” → GO field pilot |

---

# 3. Task-overzicht (compact)

| Sprint | Task IDs | Σ pd (indicatief) |
|--------|----------|-------------------|
| S1 | T-01-* · T-02-* · T-03-* · T-C-01..03 · T-11-01 | ~28–32 |
| S2 | T-05-* · T-14-* · T-07-* · T-04-01 · T-C finish | ~35–40 |
| S3 | T-04-02..07 · T-11-02..04,06 · T-06-* | ~30–35 |
| S4 | T-08-* · T-13-* · T-10-* · T-09-* · T-11-05 | ~35–40 |
| S5 | T-15-* · P0 · optional T-12/T-S | ~12–20 |
| **Totaal Must-focused** | | **~140–165 pd** (~7–8 wkn × 2 eng) |

---

# 4. Afhankelijkheden (kritiek)

```
T-01-01 ─┬─► T-01-02/03/04/05 ─► T-02-* ─► alle screens
T-03-* ──┴─► T-05/06/07/14 · T-C-*
T-C-01 ────► T-05-03/04/05 · T-11 · T-10
T-05-01 ───► alle panels · WP06/07/08/14
T-11-01 ───► T-11-02..04 ─► T-04-04 · T-10-01
T-08-03 ───► U3
T-13-* ────► T-04-05 · T-09 · T-11-05
T-15-02 ───► na instrumentatie points (laatste)
```

**Critical path tasks:**  
`T-03-02 → T-05-01 → T-05-03 → T-11-04 → T-04-04 → T-08-03 → T-13-02 → T-13-03 → T-10-01 → T-15-02`

---

# 5. Risicoanalyse (samenvatting)

| Sprint | Top risico | Fallback | Blocker | Mitigatie |
|--------|------------|----------|---------|-----------|
| 1 | Auth/nav conflict | Flag off | Geen auth | Early spike |
| 2 | Content XL slip | L2/L4 only | Bad sidecar | Validate-first |
| 3 | RLS leak drafts | Query filter | DB incomplete | RLS tests |
| 4 | S-51 pollution | Allowlist UI | Reflectie DB | PR Journey check |
| 5 | Should distracts | Cut search/offline | S0 bugs | Should freeze |

**Portfolio-risico's (E.0):** I1–I6 blijven van kracht.

---

# 6. Definition of Done

## 6.1 Per taak
Zie taakvelden + globale DoD §0.

## 6.2 Per sprint
- [ ] Alle Must-taken sprint Done of expliciet doorgeschoven met ICR  
- [ ] Demo gehouden  
- [ ] Geen open S0  
- [ ] CI groen  

## 6.3 Build / G-PILOT-LIVE
- [ ] ARCH M1–M12 afgevinkt  
- [ ] U1–U6 staging pass  
- [ ] WP-C trainer sign-off  
- [ ] Geen nieuwe ontwerpdocs tijdens build  

---

# 7. Build Readiness Score

| Criterium | Score | Max |
|-----------|-------|-----|
| Alle WP's gesplitst in taken | 10 | 10 |
| Task IDs uniek + deps | 10 | 10 |
| Sprints gedekt Must-keten | 10 | 10 |
| Parallel tracks gedefinieerd | 8 | 10 |
| Risico+fallback per sprint | 10 | 10 |
| Testmomenten per sprint | 10 | 10 |
| DoD/acceptatie per taak | 9 | 10 |
| Post-cert scope afgebakend | 10 | 10 |
| Traceability naar E.0 / ARCH M* | 10 | 10 |
| Geen ontwerp-scope creep | 10 | 10 |
| **Totaal** | **97** | **100** |

**Drempel BUILD READY:** ≥90 → **PASS**

---

# 8. BUILD READY Certification

```
ACADEMY-BACKLOG-v1.0
Phase: E.1 — Academy Build Backlog (Execution Ready)

Tasks:              70+ executable (T-01 … T-15 · T-C · T-S)
Sprints:            5 (+ post-cert T-E/T-F blocked)
Critical path:      Defined §4
Risks:              Per-sprint §2 + portfolio
DoD:                §6
Readiness score:    97/100

STATUS: ✅ BUILD READY

Vanaf dit moment:
  • GEEN nieuwe ontwerpdocumenten
  • Werkzaamheden = implementatie · testen · certificeren
  • Scope-wijziging alleen via ICR (+ ACR indien arch/UX)

Next action: Start Sprint 1 → T-01-01 + T-03-01
```

---

*Document: `academy-build-backlog-v1.0.md`*  
*Prev: E.0 Implementation Master Plan · Next: Sprint 1 implementation*
