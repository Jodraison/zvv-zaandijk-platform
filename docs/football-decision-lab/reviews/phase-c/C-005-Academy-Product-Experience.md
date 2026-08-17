# C-005 — Academy Product Experience

**Status:** READY FOR PRODUCT DIRECTOR VISUAL REVIEW  
**Date:** 2026-07-23  
**Routes:** `/academie`, `/academie/decision-lab`

---

## Gewijzigde bestanden

| File | Rol |
|------|-----|
| `src/components/academie/academy-home-dashboard.tsx` | Persoonlijk Academy-dashboard |
| `src/components/decision-lab/decision-lab-hub.tsx` | Decision Lab trainingsomgeving |
| `src/components/decision-lab/session-tactical-preview.tsx` | Compacte tactische preview |
| `src/lib/decision-lab/missions.ts` | Trainingsblokken (18 sessies) |
| `src/lib/decision-lab/continue.ts` | Continue / recent / status labels |
| `src/lib/academie/learning-paths.ts` | Statuscopy “Nog niet beschikbaar” |
| `scripts/c005-academy-product-evidence.mjs` | Screenshot evidence |
| `docs/.../artifacts/c-005/*` | Viewport screenshots + `evidence.json` |

Ongewijzigd (bewust behouden): session IDs, Golden Session film, lesson experience, progress key `fdl-progress-v1`, season query, alle Academy-routes.

---

## Oude problemen

- Academy voelde als catalogus / kaartenraster
- Decision Lab = grote hero + 18 identieke kaarten
- “Binnenkort” / “Nieuw” overal zonder waarde
- Geen duidelijke primaire volgende actie boven de vouw
- Leerpaden even zwaar als live Decision Lab
- Geen trainingsroute / missie-logica
- Producttaal inconsistent (Open / Mobile-first / lessons)

---

## Nieuwe productstructuur

### Academy (`/academie`)

1. **Primary continue** — dark tactical surface + preview + “Ga verder” / “Start je eerste sessie”
2. **Voortgang** — echte FDL counts, %, leerfase, mijlpaal
3. **Aanbevolen volgende stap** — één sessie, waarom + difficulty + duur
4. **Leerpaden** — Decision Lab featured; overige compact “In ontwikkeling”
5. **Recent** — alleen bij echte progress (max 3)
6. **Ontdekken** — compacte footer-links

### Decision Lab (`/academie/decision-lab`)

1. Compact header + terug naar Academy + echte voortgang
2. **Jouw volgende beslissing** — featured mission + tactical preview + CTA
3. Filters (Alles / waves / Bezig / Afgerond)
4. **Trainingsblokken** — 7 blokken over orders #1–#18
5. Session rows met status: Volgende / Referentie / Afgerond / Gevorderd (Hoog)

---

## Producttaal (in UI)

| Concept | Label |
|---------|--------|
| Path | Leerpad |
| Mission group | Trainingsblok |
| Session | Sessie |
| Continue | Ga verder / Start je eerste sessie / Hervatten vanaf beslismoment |
| Progress | Afgerond / Bezig / Nog niet gestart |
| Golden Session | Referentiesessie |
| Future paths | In ontwikkeling |
| Difficulty | Basis / Midden / Hoog |
| Correct/wrong | (in leservaring — ongewijzigd) |

Conventie: Nederlands, speelstergericht. Geen “Mission” in UI; geen “Mobile-first” / “Engine” / order-nummers als primaire labels.

---

## Academy flow

Welkom → continue CTA → (optioneel) voortgang/aanbeveling → Decision Lab → sessie.

## Decision Lab flow

Academy → Decision Lab hub → volgende beslissing → trainingsblok → sessie → voortgang terug naar hub/Academy.

---

## Desktop evidence

Artifacts: `docs/football-decision-lab/reviews/phase-c/artifacts/c-005/`

- `academy-desktop-above-fold.png` (1440×900)
- `academy-desktop-full.png`
- `academy-desktop-1280.png`
- `academy-tablet-1024.png`
- `dl-desktop-above-fold.png`
- `dl-desktop-next-decision.png`
- `dl-desktop-mission-map.png`

## Mobile evidence

- `academy-mobile-above-fold.png` (390×844)
- `academy-mobile-paths.png`
- `academy-mobile-360.png`
- `dl-mobile-above-fold.png`
- `dl-mobile-mission-route.png`

`evidence.json`: geen `overflowX`, geen console errors op capture-routes.

---

## Functionele checks

| Check | Result |
|-------|--------|
| `/academie` 200 | OK |
| `/academie/decision-lab` 200 | OK |
| Golden Session `/academie/decision-lab/binnenkant-dicht-rw` 200 | OK |
| Progress = localStorage `fdl-progress-v1` | OK |
| Geen fake streak / nepcoach | OK |
| ESLint changed files | OK |
| Console errors (Playwright) | none |
| Horizontal overflow (viewports) | none |
| `tsc --noEmit` | Pre-existing errors in unrelated tactical-film-standard validators (niet C-005) |

---

## Resterende beperkingen

- Alleen Decision Lab heeft live progress; andere leerpaden blijven “In ontwikkeling”
- Continue + aanbeveling tonen dezelfde sessie bij 0% progress (bewust: één bron van waarheid)
- Tactical preview op hub is stilstaand (seek freeze), geen autoplay — bewust rustig
- Filters verbergen blokken zonder matches; geen permanente lock op sessies
- Site-brede topnav blijft website-achtig; productgevoel zit in Academy surfaces

---

## Zelfkritische eindvraag

> Voelt dit nu als een product waar een speelster vrijwillig meerdere sessies achter elkaar in wil voltooien?

**Eerlijk:** Ja, als start van een trainingsproduct — duidelijk volgende actie, route in trainingsblokken, Golden Session als referentie. Nog niet “elite sport-app” end-to-end: andere leerpaden zijn leeg, en de globale site-chrome is nog clubwebsite. Binnen Academy ↔ Decision Lab is de samenhang sterk genoeg om door te trainen.

| Lens | Oordeel |
|------|---------|
| Speelster | Weet binnen 3s wat te doen; CTA helder |
| Hoofdtrainer | Leerroute in blokken is bruikbaar |
| UEFA-docent | Didactische volgorde klopt met bestaande content |
| Senior product designer | Hiërarchie sterk; ontdubbel continue/aanbeveling later |
| Sport-app product lead | Retention-haak = volgende beslissing; nog geen server-progress |

---

## Scores

| Dimensie | Score |
|----------|-------|
| Information Architecture | 9/10 |
| Visual Hierarchy | 9/10 |
| Academy Dashboard | 9/10 |
| Decision Lab Experience | 9/10 |
| Learning Motivation | 8.5/10 |
| Desktop Experience | 9/10 |
| Mobile Experience | 8.5/10 |
| **Overall Product Experience** | **8.9/10** |

---

C-005 ACADEMY PRODUCT EXPERIENCE:  
READY FOR PRODUCT DIRECTOR VISUAL REVIEW
