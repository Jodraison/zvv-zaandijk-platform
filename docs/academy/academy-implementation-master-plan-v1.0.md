# Academy Implementation Master Plan — v1.0

**ZVV Zaandijk VRZ1 — Football Academy**  
**Phase:** E.0 — Implementation Master Plan  
**Status:** 🔒 **SINGLE SOURCE OF TRUTH** voor de implementatiefase  

**Architecture:** `ACADEMY-ARCH-v1.1`  
**Schema:** `academy-content-schema` v1.1.0  
**Registries:** problems · situations · playbooks · positions · visuals · tags  
**Design System:** `ACADEMY-PDS-v1.0`  
**Journey:** `ACADEMY-JOURNEY-v1.0`  
**Wireframes:** `ACADEMY-WIRE-v1.0`  
**Prototype:** `ACADEMY-PROTO-v1.0`  
**Pilot design:** `ACADEMY-PILOT-v1.0`

**Scope:** Bouwplanning · work packages · afhankelijkheden · testplan · DoD  
**Verboden:** nieuwe architectuur · nieuwe schermen · nieuwe componenten · UX-herontwerp

> **Regel:** Bouw alleen wat bevroren is. Feedback uit pilot = backlog P0–P2 binnen bestaande S-xx / C-IDs.  
> **Stack (bestaand platform):** Next.js App Router · React · TypeScript · Tailwind · Supabase — geen nieuw framework kiezen.

---

## Documenthistorie

| Versie | Status | Wijziging |
|--------|--------|-----------|
| **v1.0** | **MASTER PLAN FROZEN** | 15 WP's · kritieke keten · parallel · MVP eindplanning |

---

# 0. Governance & fase-afbakening

## 0.1 Naamgeving (voorkom verwarring)

| Label | Betekenis |
|-------|-----------|
| **E.0 (dit document)** | Implementatie-masterplan · productcode MVP |
| **ARCH Phase E** | Content-retrofit · 34 sidecars · **ná** pilot-validatie |
| **ARCH Phase F** | SHOULD + LATER features |

## 0.2 Gates

| Gate | Voorwaarde | Mag starten |
|------|------------|-------------|
| **G-IMP** | Ontwerpdocs C.0–C.2 + E.0 goedgekeurd | WP01–WP05 scaffold |
| **G-PILOT-LIVE** | MVP Must slice (kritieke keten) deploybaar | Live field-pilot (§ D) |
| **G-CERT** | `VRZ1 PILOT CERTIFIED` | Volledige polish · ARCH E retrofit · Phase F |
| **G-PROD** | ARCH E sidecars QA + security | Multi-team / offline-all / admin |

**Harde regel ARCH:** geen full retrofit (34 PB) parallel met onzekere pilot-scope. Pilot-content = **Wave pilot-set** (pb.27 + week-B PB + minimale L0–L4 sidecars).

## 0.3 Omvang-eenheden

| Label | Betekenis |
|-------|-----------|
| **S** | 1–3 persondagen |
| **M** | 4–8 persondagen |
| **L** | 9–15 persondagen |
| **XL** | 16–25 persondagen |

Schattingen = 1 full-stack engineer equivalent. Parallel = 2 engineers tenzij anders.

---

# 1. Complete bouwplanning

## 1.1 Doel van implementatie

Lever een **MVP Must** Academy in het bestaande `platform/` die:

1. ARCH §9.1 M1–M12 afdekt  
2. Journey-flows (speelster · captain · trainer) ondersteunt  
3. Pilot KPI-meting mogelijk maakt (hooks, geen nieuwe schermen)  
4. Geen PB-nummers in UI · Positie = home · 5 tabs · 5 layer tabs  

## 1.2 Leveranciersdocumenten (input only)

| Doc | Gebruik bij bouw |
|-----|------------------|
| ARCH v1.1 | Routes · entities · layers · Must/Should/Later |
| Schema + registries | Types · loaders · IDs |
| PDS v1.0 | Screen list · component IDs C-A/B/C/D |
| Journey v1.0 | Defaults · timeboxes · empty rules |
| Wire v1.0 | Layout · states · CTA's |
| Proto v1.0 | Interaction · deep links · fixtures → seed |
| Pilot v1.0 | KPI hooks · niet features |

## 1.3 MVP Must vs Should vs Later (bouwfilter)

| Prioriteit | Bouwen in E.0→MVP | Voorbeelden |
|------------|-------------------|-------------|
| **MUST** | Ja — kritieke keten | Shell · Positie · Content L1–L4 · Probleem 7 · Matchday vóór/na · Reflectie · Trainer push · Captain · registries loader · pilot sidecars |
| **SHOULD** | Na Must slice / parallel indien capaciteit | Push notif · offline L2 cache · Rust S-52 · Zoek · Seizoen basic · secondary positie |
| **LATER** | Pas na G-CERT / Phase F | Speelboek PDF · Staff/Admin · full L0–L4 alle 34 · quiz · multi-team UI |

---

# 2. Work Package-overzicht

| WP | Naam | Omvang | Must? | Sprint-band |
|----|------|--------|-------|-------------|
| WP01 | Academy Shell | M | Must | Sprint 1 |
| WP02 | Routing | S–M | Must | Sprint 1 |
| WP03 | Registry Loader | M | Must | Sprint 1 |
| WP04 | Dashboard Engine (Positie) | L | Must | Sprint 2 |
| WP05 | Content Engine | XL | Must | Sprint 2–3 |
| WP06 | Situation Engine | M | Must | Sprint 3 |
| WP07 | Problem Engine | M | Must | Sprint 3 |
| WP08 | Matchday Engine | L | Must | Sprint 3–4 |
| WP09 | Season Engine | M | Should→Must-light | Sprint 4 |
| WP10 | Captain Module | M | Must | Sprint 4 |
| WP11 | Trainer Module | L | Must | Sprint 4 |
| WP12 | Search Engine | M | Should | Sprint 5 / post-pilot-ok |
| WP13 | Reflection Engine | M | Must | Sprint 4 |
| WP14 | Visual Engine | M | Must (1 visual/week) | Sprint 3 |
| WP15 | Analytics Hooks | S–M | Must-light | Sprint 5 |

**Pilot-content track (geen apart WP-nummer — parallel content):**  
`WP-C` Sidecar Pilot Pack — L0–L4 voor pb.27 + week-B PB · 1 visual · exercise · captain cues · **M** · Must voor live pilot.

**Post-cert content (ARCH Phase E):**  
`WP-E` Full Retrofit 34 sidecars — **ná G-CERT** — XL+.

---

# 3. Work Packages — detail

---

## WP01 — Academy Shell

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-00 App Shell: `AppHeader` · `BottomTabBar` / `SidebarNav` · `RoleMenu` · `PositionBadge` · OfflineBanner slot |
| **Afhankelijkheden** | Bestaande auth/team in platform · geen Academy-deps |
| **Omvang** | **M** |
| **Risico** | Medium — conflict met bestaande navigatie platform |
| **Testcriteria** | 5 tabs zichtbaar · header 3 zones · rol-menu gated · desktop sidebar parity |
| **DoD** | Shell rendert op `/academy/*` (of gekozen mount) · tabs navigeren · geen nieuwe tab · mobile+desktop · a11y basic (focus order) |

**Tests:** unit (tab config) · integratie (layout smoke) · UX (proto shell parity) · acceptatie: ARCH nav frozen.

---

## WP02 — Routing

| Veld | Specificatie |
|------|--------------|
| **Doel** | Route-map ARCH §2.2: `/positie` default · situatie · probleem · content · wedstrijd · seizoen · team/captain · team/trainer · zoek overlay · onboarding |
| **Afhankelijkheden** | WP01 |
| **Omvang** | **S–M** |
| **Risico** | Low–medium — deep links + origin stack |
| **Testcriteria** | App open → `/positie` · geen `/home` · deep link matrix Proto §3.5 · Back origin op content |
| **DoD** | Alle Must-routes resolven · 404 Academy-safe · middleware respecteert team-auth · query `?layer=` |

**Tests:** integratie (route table) · e2e smoke open paths · acceptatie: geen dubbele routes.

---

## WP03 — Registry Loader

| Veld | Specificatie |
|------|--------------|
| **Doel** | Laad/valideer YAML registries + schema · typed accessors (`prob.*` · `sit.*` · `pb.*` · `pos.*` · ankers) · geen runtime PB-lijst UI |
| **Afhankelijkheden** | Schema + registry files (Phase B — klaar) |
| **Omvang** | **M** |
| **Risico** | Medium — build-time vs runtime load · Zod validatie |
| **Testcriteria** | 7 MVP problems load · 6 moments · 11 positions · invalid YAML fails CI |
| **DoD** | `getProblem(slug)` · `getPlaybook(id)` · `getAnkers(pos)` · CI validate script · types gegenereerd of Zod-inferred |

**Tests:** unit (parsers) · integratie (fixture registries) · acceptatie: IDs match ARCH §1.3.

**Parallel:** kan starten **direct** naast WP01.

---

## WP04 — Dashboard Engine (Positie)

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-20 widgets in vaste volgorde: Vandaag · QuickActionRow · PositieAnkers · Apply(cond) · Leerpunt · WeekCard · SituationShortcutGrid |
| **Afhankelijkheden** | WP01 · WP02 · WP03 · WeekPlan data (min stub) · user primary_pos |
| **Omvang** | **L** |
| **Risico** | Medium — conditional Apply · empty week · quick → content |
| **Testcriteria** | Journey empty week copy · Quick 20s/Visual/Wedstrijd · ≤1s skeleton · ankers = 3 |
| **DoD** | S-20 wire-parity · QuickActionRow **alleen hier** · pins/progress **niet** hier · pull-to-refresh optioneel |

**Tests:** unit (widget visibility rules) · integratie (fixtures F.week.*) · UX (U1/U3 entry) · acceptatie: ARCH §4.1.

---

## WP05 — Content Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-40 shell + panels S-41–S-45: StickyLayerTabs · L0 inline · L2 TwentySecCard · L3 Apply gate · L4 TwoMinCard · L5 MarkdownViewer · default tab per context |
| **Afhankelijkheden** | WP02 · WP03 · WP-C sidecars · WP14 (L1) |
| **Omvang** | **XL** |
| **Risico** | **High** — kernproduct · positie-varianten · match-gate L3 |
| **Testcriteria** | Default tabs Journey · L3 greyed non-match · geen PB# in header · tab switch ≤100ms perceived · Back origin |
| **DoD** | Alle 5 tabs · context defaults · positie-filter header · S-46 link from L4 · overflow pin menu (MVP) |

**Tests:** unit (defaultLayer(context)) · integratie (pb.27 all layers) · e2e (Probleem→L2) · UX (U2) · acceptatie: ARCH §2.4–3.4.

---

## WP06 — Situation Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-30 → S-31 → S-32 → content entry (L1/L2 CTA's) |
| **Afhankelijkheden** | WP02 · WP03 · WP05 (entry) |
| **Omvang** | **M** |
| **Risico** | Low–medium |
| **Testcriteria** | 6 poorten · core vs extended accordion · shortcuts vanaf S-20 |
| **DoD** | Routes situaties · menselijke titels · doorlink S-40 |

**Tests:** unit (poort filter) · integratie (drill-down) · acceptatie: ARCH §5.2.

**Parallel:** met WP07 na WP03+WP05 skeleton.

---

## WP07 — Problem Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-35 (7 MVP + 3 Later collapsed) · S-36 Fix Flow · Start 20 sec → L2 |
| **Afhankelijkheden** | WP03 · WP05 |
| **Omvang** | **M** |
| **Risico** | Low |
| **Testcriteria** | uitstappen-twijfel ≤3 taps tot L2 · onboarding picks hint |
| **DoD** | Registry-driven list · FocusLine · disabled Later zonder content |

**Tests:** unit · e2e U2 · acceptatie: ARCH §5.3 / M8.

---

## WP08 — Matchday Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-50 hub · S-51 vóór (≤90s stack) · S-52 rust (Should) · S-53 na entry · MatchBanner · PhaseTabs · embed TwentySec + Apply |
| **Afhankelijkheden** | WP04 · WP05 · Match entity · WP13 entry |
| **Omvang** | **L** |
| **Risico** | Medium–high — offline Should · verboden entries op S-51 |
| **Testcriteria** | Quick→S-51 skip hub · geen L5/Seizoen/Zoek op S-51 · Klaar dismiss · rust ≤30s content |
| **DoD** | Must: S-50/51/53 · Should: S-52 · deep links `/wedstrijd/*` |

**Tests:** e2e U3 · offline toggle test · acceptatie: Journey matchday rules.

---

## WP09 — Season Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-60 basic: ProgressCard · reflectielog preview · PinList · LastViewed · SpeelboekTeaser (locked) · S-61 log |
| **Afhankelijkheden** | WP13 · Pin/LastViewed personal data |
| **Omvang** | **M** |
| **Risico** | Low — S-62 light/locked only |
| **Testcriteria** | Geen overlap widgets met S-20 · unlock rules documented not forced |
| **DoD** | Must-light: S-60 + S-61 · S-62 lock screen · Export disabled |

**Tests:** integratie · acceptatie: ARCH §8.  
**Timing:** May start after WP13; **full Speelboek compile = Later**.

---

## WP10 — Captain Module

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-70: CaptainCard 60s · TeamAgreementList · CueList · RustNote teaser · Help teammate → S-02 → L2 |
| **Afhankelijkheden** | WP11 WeekPlan push data · WP01 RoleMenu · WP05 |
| **Omvang** | **M** |
| **Risico** | Low–medium — empty without push |
| **Testcriteria** | Empty “Wacht op trainer” · briefing ≤60s path · copy cue |
| **DoD** | Rol-gate · geen speelster Quick op S-70 · M11 |

**Tests:** e2e U4 · acceptatie: Journey scenario 10.

---

## WP11 — Trainer Module

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-71: WeekPlanCard · TPLPointEditor×3 · ExerciseCard · Push · TeamReflectionAggregate · fragment → L5 |
| **Afhankelijkheden** | WP03 · personal WeekPlan DB · WP13 aggregate · WP05 |
| **Omvang** | **L** |
| **Risico** | **High** — bron van week-content voor heel team |
| **Testcriteria** | Push validatie · speelster ziet WeekCard · ≤5 min path · geen sidecar edit UI |
| **DoD** | Push zet `pushed_at` · notif Should hook · M10 |

**Tests:** e2e U5 · integratie WeekPlan · acceptatie: Journey 2A.

---

## WP12 — Search Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-01 overlay: situations · problems · cues (MVP) · result → juiste default layer |
| **Afhankelijkheden** | WP03 · WP01 header |
| **Omvang** | **M** |
| **Risico** | Low |
| **Testcriteria** | “uitstappen” → problem · ≤3s · geen PB# in results |
| **DoD** | Should S6 · `/` desktop shortcut · dismiss |

**Tests:** unit ranking · e2e search · acceptatie: ARCH §2.6.  
**Timing:** **Mag na pilot** indien capaciteit krap — Probleem/Situatie zijn Must-fallback.

---

## WP13 — Reflection Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | S-54 wizard 3 vragen · S-55 success · Leerpunt persist · soft skip max 2 · write to S-20 + S-60/61 |
| **Afhankelijkheden** | WP08 S-53 · DB Reflection/Leerpunt · WP04 leespunt widget |
| **Omvang** | **M** |
| **Risico** | Medium — soft mandatory · offline queue |
| **Testcriteria** | Opslaan → leerpunt op S-20 · stack replace S-55 · tab lock mid-flow |
| **DoD** | M5 reflectie-lus · skip counter |

**Tests:** e2e U6 · unit skip rules · acceptatie: Journey 3D.

---

## WP14 — Visual Engine

| Veld | Specificatie |
|------|--------------|
| **Doel** | VisualViewer · TriggerInline L0 · PositionHighlightLegend · 1 primary visual/week (M9) |
| **Afhankelijkheden** | WP03 visuals registry · assets · WP05 tab L1 |
| **Omvang** | **M** |
| **Risico** | Medium — asset pipeline · empty state |
| **Testcriteria** | L0 boven visual · pinch/zoom mobiel · empty “Visual volgt” |
| **DoD** | M9 · geen aparte Visual-tab buiten S-40 |

**Tests:** integratie asset load · acceptatie: WVLP L1≠L2.

---

## WP15 — Analytics Hooks

| Veld | Specificatie |
|------|--------------|
| **Doel** | Event hooks voor pilot KPI's (geen nieuwe UI): `content_opened` · `layer_view` · `matchday_open` · `reflection_complete` · `weekplan_push` · `time_to_l2` |
| **Afhankelijkheden** | WP04–13 instrumentation points |
| **Omvang** | **S–M** |
| **Risico** | Low — privacy (geen PII in events) |
| **Testcriteria** | Events fire in staging · scrub fields · export CSV voor rapport |
| **DoD** | Pilot KPI U-01/U-04/U-05 meetbaar · obsLog-compatible patterns |

**Tests:** unit event schema · integratie smoke · acceptatie: Pilot §4 mapping.

**Geen:** nieuwe dashboards (Admin Later).

---

## WP-C — Sidecar Pilot Pack (content)

| Veld | Specificatie |
|------|--------------|
| **Doel** | Sidecars L0–L4 voor pilot PB's (min pb.27 + week-B) · 11 positie-varianten waar required · exercise · captain cues · 1 visual |
| **Afhankelijkheden** | Schema · sidecar template · **geen** UI WP behalve WP05 consume |
| **Omvang** | **M** |
| **Risico** | Medium — content kwaliteit = learning KPI |
| **Testcriteria** | Schema validate · LB/RB/L6 samples review door trainer |
| **DoD** | CI green · trainer signed-off copy |

**Timing:** parallel vanaf Sprint 1 met WP03.

---

# 4. Afhankelijkheden

## 4.1 Dependency graph

```
WP03 Registry ──────────────────────────────┐
WP-C Sidecars ─────────────────────────────┤
WP01 Shell ──► WP02 Routing ──┬─────────────┤
                              ▼             ▼
                         WP04 Positie ◄── WeekPlan (WP11 data)
                              │
                              ▼
                    WP05 Content ◄── WP14 Visual
                      │    │    │
          ┌───────────┤    │    └───────────┐
          ▼           ▼    ▼               ▼
       WP06 Sit    WP07 Prob           WP08 Matchday
                                          │
                                          ▼
                                       WP13 Reflectie
                                          │
                                          ▼
                                       WP09 Season
WP11 Trainer ──push──► WP04 WeekCard
WP11 ────────────────► WP10 Captain
WP15 hooks ── instrumenteert WP04–13
WP12 Search ──► WP03 + shell (optioneel laat)
```

## 4.2 Dependency matrix (Must)

| WP | Blokkeert |
|----|-----------|
| WP01 | WP02, WP04, WP10, WP11, WP12 |
| WP02 | WP04–13 |
| WP03 | WP04–07, WP11, WP12, WP14 |
| WP04 | Pilot speelster home |
| WP05 | WP06–08, WP10 help, WP14 panel |
| WP11 | WP04 week filled · WP10 |
| WP13 | WP09 · pilot learning lus |
| WP08 | WP13 entry |

---

# 5. Kritieke keten

**Critical path (MVP Live Pilot):**

```
WP03 + WP-C
    → WP01 → WP02
        → WP05 (core)
            → WP04
            → WP07
            → WP11 (push)
            → WP08 (S-51/S-53)
            → WP13
            → WP10
        → WP14 (parallel met WP05 mid)
→ WP15 (late bind)
→ G-PILOT-LIVE
```

**Padlengte (1 engineer):** ± **9–12 weken** calendar  
**Padlengte (2 engineers):** ± **6–8 weken** calendar  

**Single points of failure:** WP05 Content Engine · WP11 Trainer Push · WP-C content quality.

---

# 6. Parallelle bouwmogelijkheden

## 6.1 Vanaf dag 1 (Sprint 1)

| Track A | Track B |
|---------|---------|
| WP01 Shell → WP02 Routing | WP03 Registry Loader + WP-C Sidecars |

## 6.2 Sprint 2–3

| Track A | Track B |
|---------|---------|
| WP05 Content Engine | WP14 Visual Engine |
| daarna WP04 Positie | WP07 Problem (na Content skeleton) |

## 6.3 Sprint 3–4

| Track A | Track B |
|---------|---------|
| WP08 Matchday → WP13 Reflectie | WP11 Trainer → WP10 Captain |
| WP06 Situation | WP09 Season (na Reflectie start) |

## 6.4 Sprint 5 / post-pilot-ok

| Mag parallel / later |
|----------------------|
| WP12 Search (Should) |
| WP15 polish + KPI export |
| S-52 Rust harden (Should S3) |
| Offline L2 cache (Should S2) |
| Push notifications (Should S1) |

## 6.5 Pas na G-CERT (niet eerder)

| Verboden vóór cert |
|--------------------|
| WP-E Full 34 sidecar retrofit (ARCH E) |
| S-62 Speelboek compile + PDF |
| Staff/Admin S-73/S-74 |
| Full-text L5 search |
| Multi-team UI |
| Nieuwe schermen/componenten |

---

# 7. Testplan (per WP-samenvatting)

| WP | Unit | Integratie | UX-validatie | Acceptatie |
|----|------|------------|--------------|------------|
| WP01 | tab config | layout smoke | shell parity proto | 5 tabs · geen 6e |
| WP02 | — | route table · deep links | back stack | ARCH §2.2 |
| WP03 | YAML/Zod | CI validate | — | IDs §1.3 |
| WP04 | visibility rules | F.week fixtures | U1 entry | ARCH §4.1 |
| WP05 | defaultLayer | pb.27 layers | U2 | ARCH layers |
| WP06 | poort map | drill-down | — | 6 poorten |
| WP07 | MVP7 list | → L2 | U2 | M8 |
| WP08 | matchContext | S-51 path | U3 ≤90s | Journey match |
| WP09 | unlock flags | log list | — | geen S-20 overlap |
| WP10 | rol-gate | empty push | U4 ≤60s | M11 |
| WP11 | push validatie | WeekCard sync | U5 ≤5m | M10 |
| WP12 | search index | query→route | ≤3s | ARCH §2.6 |
| WP13 | skip counter | leerpunt write | U6 | soft mandatory |
| WP14 | legend | asset 404 | L1 empty | M9 |
| WP15 | event schema | staging fire | — | Pilot KPI map |
| WP-C | schema | trainer review | learning | pilot PB signed |

**Release test (G-PILOT-LIVE):** runt Proto scenario's U1–U6 op **staging build** (niet alleen Figma).  
**Pilot field:** Pilot v1.0 KPI's via WP15.

---

# 8. Definition of Done — globaal + per pakket

## 8.1 Globale DoD (elk WP)

1. Code in `platform/` · TypeScript strict  
2. Geen nieuwe S-xx of C-ID buiten PDS  
3. Geen PB-nummer in user-visible strings  
4. Unit/integratie tests groen in CI  
5. Wireframe states: empty · loading · offline · error (waar gespecificeerd)  
6. Review tegen ARCH + Journey rules checklist  
7. Geen secrets in repo  

## 8.2 DoD-checklist per WP

Zie §3 kolom **DoD** — verplicht afvinken in PR-template:

```
WP: ____
[ ] DoD §3 items
[ ] Tests §7
[ ] Geen scope creep
[ ] Docs: geen nieuwe ontwerpbeslissing (alleen build notes)
```

---

# 9. Eindplanning richting MVP

## 9.1 Milestone plan

| Milestone | Inhoud | Exit |
|-----------|--------|------|
| **M0** | E.0 goedgekeurd · repo branch `academy/mvp` | G-IMP |
| **M1** | WP01–03 + WP-C start | Shell + registries live |
| **M2** | WP05 skeleton + WP14 + WP07 | Content + Probleem → L2 |
| **M3** | WP04 + WP11 | Positie + Trainer push |
| **M4** | WP08 + WP13 + WP10 | Matchday + Reflectie + Captain |
| **M5** | WP06 + WP09 light + WP15 | Situatie + Seizoen + hooks |
| **M6** | Staging U1–U6 pass · bugfix P0 | **G-PILOT-LIVE** |
| **M7** | Field pilot D0–D4 (Pilot v1.0) | Rapport |
| **M8** | CERTIFIED of CONDITIONAL/NO-GO | Gate |
| **M9** | P0/P1 uit pilot binnen frozen scope | Stabilisatie |
| **M10** | ARCH Phase E retrofit (WP-E) | 34 sidecars |
| **M11** | Phase F Should remainder | Production |

## 9.2 Sprint-band (2 engineers, indicatief)

| Sprint | Week | Focus |
|--------|------|-------|
| S1 | 1–2 | WP01 · WP02 · WP03 · WP-C |
| S2 | 3–4 | WP05 · WP14 · WP07 |
| S3 | 5–6 | WP04 · WP11 · WP06 |
| S4 | 7–8 | WP08 · WP13 · WP10 · WP09 |
| S5 | 9 | WP15 · Should gaps · U1–U6 harden |
| — | 10–13 | Live pilot + rapport |
| — | 14+ | Post-cert · WP-E · Phase F |

*1 engineer: roughly ×1.5–1.7 op S1–S5.*

## 9.3 MVP Must exit checklist (ARCH §9.1)

| # | Feature | WP |
|---|---------|-----|
| M1 | Onboarding positie + 2 problemen | WP02 + onboarding screens in WP04 track |
| M2 | Positie-dashboard widgets | WP04 |
| M3 | PositieAnkers | WP03+WP04 |
| M4 | Bottom 5 tabs | WP01+WP02 |
| M5 | Wedstrijd vóór + na + reflectie | WP08+WP13 |
| M6 | Rolling L2/L4 week-PB | WP05+WP11 |
| M7 | 6 ACE-poorten → content | WP06+WP05 |
| M8 | Probleem-nav 7 | WP07 |
| M9 | 1 visual/week | WP14+WP-C |
| M10 | Trainer WeekPlan push | WP11 |
| M11 | CaptainCard | WP10 |
| M12 | Layer tabs L1–L5 | WP05 |

**Onboarding S-10/S-11:** implementeren binnen WP02/WP04 track (geen apart WP) — DoD: Journey scenario 1.

## 9.4 Explicit non-goals tot G-CERT

- Redesign / design tokens als blocker  
- Nieuwe componenten buiten PDS C-IDs  
- Full offline-all · Admin · Staff · PDF Speelboek  
- 34 PB sidecar retrofit  

---

# 10. Risicoregister (implementatie)

| ID | Risico | Impact | Mitigatie |
|----|--------|--------|-----------|
| I1 | WP05 ontspoort | Schema delay | Skeleton tabs eerst · pb.27 only |
| I2 | Platform nav conflict | Shell regressie | Mount under `/academy` of feature flag |
| I3 | Content niet klaar | Learning fail | WP-C parallel · trainer sign-off gate M6 |
| I4 | Scope creep pilot feedback | Delay | Alleen P0 copy/flow · E.0 verbod nieuwe schermen |
| I5 | Auth/team edge cases | Block | Hergebruik bestaande Supabase auth |
| I6 | Zoek uitgesteld | Trainer diagnose trager | Probleem+Situatie Must fallback |

---

# 11. Master Plan Certification

```
ACADEMY-IMP-v1.0
Phase: E.0 — Academy Implementation Master Plan

Work packages:     WP01–WP15 + WP-C (+ WP-E post-cert)
Critical path:     WP03/WP-C → WP01/02 → WP05 → WP04/11/08/13/10
Parallel tracks:   Defined §6
DoD:               Global §8 + per-WP §3
Testplan:          §7 mapped
MVP exit:          ARCH M1–M12 checklist §9.3
Gates:             G-IMP · G-PILOT-LIVE · G-CERT · G-PROD

STATUS: 🔒 SINGLE SOURCE OF TRUTH — Implementation follows this document only

Wijzigingen: alleen via Implementation Change Request (ICR)
  · geen stille scope · geen nieuwe S-xx zonder ACR+PDS update
```

---

*Document: `academy-implementation-master-plan-v1.0.md`*  
*Prev: Phase D Pilot Design · Next: Execute WP01–WP15 under G-IMP → G-PILOT-LIVE*
