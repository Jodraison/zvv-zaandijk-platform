# WP-0 + WP-1 — Academy veilig publiek verbergen

**Datum:** 2026-07-29  
**Repo:** `platform/`  
**Status:** Uitgevoerd  

---

## 1. Waarom tijdelijk verborgen

Voor seizoen 2026/2027 is de Football Academy (publieke mount `/academie`, Decision Lab + leerpaden) tijdelijk uit de publieke website gehaald. Code, content, routes en tests blijven volledig behouden voor latere heractivatie. Fitheids- en adminwerk volgt hierna (WP-2+).

## 2. Centrale configuratie

| Symbool | Pad |
|---------|-----|
| `getAcademyFeatures()` | `src/lib/features/academy-public-visibility.ts` |
| `isAcademiePublicVisible()` | idem |
| `shouldBlockAcademiePublicAccess()` | idem |
| `buildSiteNavItems()` | `src/lib/navigation/public-nav.ts` |

```ts
getAcademyFeatures() → {
  academy: {
    publicVisible: boolean, // ACADEMY_PUBLIC_VISIBLE
    adminVisible: true,     // reserved; geen Academy-admin-UI vandaag
  }
}
```

## 3. Omgevingsvariabele

```text
ACADEMY_PUBLIC_VISIBLE=true|1   → publiek zichtbaar + bereikbaar
ACADEMY_PUBLIC_VISIBLE=false|0|unset|ongeldig → verborgen (fail closed)
```

Server-only (geen `NEXT_PUBLIC_*`). Gedocumenteerd in `.env.example`.

## 4. Defaultgedrag

**Fail closed:** ontbrekende of ongeldige env → `publicVisible = false`.

## 5. Publieke navigatie

- Desktop + mobiel delen `buildSiteNavItems` via `AppShell`.
- Bij `publicVisible=false` verdwijnt alleen het item `{ href: "/academie", label: "Academie" }`.
- Overige items, Beheer, en optionele MVP-link `/academy` blijven ongewijzigd.

## 6. Directe routeafscherming

1. **Middleware** (`src/middleware.ts`): `/academie` en subroutes → HTTP redirect `/` wanneer blocked.  
   **Belangrijk:** met `src/app` negeert Next.js een root-`middleware.ts` (lege `middleware-manifest`). WP-1 heeft de bestaande middleware daarom naar `src/middleware.ts` verplaatst zodat guards daadwerkelijk draaien. Dit herstelt ook `/academy`- en `/beheer`-guards.
2. **Layout-guard** (`src/app/(site)/academie/layout.tsx`): `redirect("/")` + `robots: noindex` (dual-pattern).

Querystrings en trailing slashes omzeilen de guard niet (`pathname`-gebaseerd). Redirect-target `/` is geen academie-pad → geen loop.

## 7. Adminstatus

Geen Academy-admin-CTA of -routes onder `/beheer`. `adminVisible: true` is gereserveerd en blokkeert niets. Bestaande `/beheer`-autorisatie ongewijzigd.

## 8. SEO-gedrag

- Geen sitemap/robots-bestanden in de repo (ongewijzigd).
- Bij verborgen: middleware redirect vóór normale weergave; layout zet `robots: { index: false, follow: false }` als secundaire laag.
- Pagina-metadata op child routes blijft in code (voor heractivatie); wordt niet als live product gerenderd zolang de guard actief is.

## 9. Heractivatieprocedure

1. Zet in de juiste omgeving (Railway/Vercel/`.env.local`):  
   `ACADEMY_PUBLIC_VISIBLE=true`
2. Deploy of herstart de Next.js-server opnieuw.
3. Controleer desktop- én mobiele navigatie: item **Academie** → `/academie`.
4. Open `/academie` en een subroute (bijv. `/academie/decision-lab`) — moeten laden zonder redirect naar `/`.
5. Voer uit:  
   `npm run test:academy-visibility`  
   en optioneel `npm run test:academy-foundation`.

Om opnieuw te verbergen: verwijder de var of zet `ACADEMY_PUBLIC_VISIBLE=false`, deploy opnieuw.

## 10. Verhouding tot bestaande flags

| Flag | Mount | Rol | Wijziging in WP-1 |
|------|-------|-----|-------------------|
| `ACADEMY_PUBLIC_VISIBLE` | `/academie` | Publieke nav + routes | **Nieuw** |
| `ACADEMY_ENABLED` | `/academy` | MVP mount + auth | Ongewijzigd |
| `ACADEMY_OFFLINE` | `/academy` | Offline-banner | Ongewijzigd |

Geen consolidatie van mounts — voorkomt regressie in foundation-tests (`isAcademyPath("/academie") === false`).

## 11. Code expliciet behouden

Onder meer (niet verwijderd):

- `src/app/(site)/academie/**`
- `src/components/academie/**`
- `src/lib/academie/**`
- `src/components/decision-lab/**`
- `src/lib/decision-lab/**`
- `docs/academy/**`, `docs/football-decision-lab/**`
- Alle bestaande Academy foundation-tests

## 12. WP-0 repositorybescherming

- Branch: `master`
- Bestaande dirty user files (tactical + tsconfig + build artifacts) **niet** aangeraakt
- Geen `git reset` / stash / clean / globale format
- Allowlist zie uitvoeringsrapport
- Schema-vrij; Postgres MCP ≠ ZVV DB; ZVV backup/inspect blijft verplicht vóór WP-2

## 13. Testbewijs

```bash
npm run test:academy-visibility
npm run test:academy-foundation
npm run lint
npm run typecheck
npm run build
```

## 14. Bekende beperkingen

- Interne hardlinks binnen Academy-componenten blijven in broncode; zonder publieke toegang zijn ze niet bereikbaar via UI.
- Geen aparte “preview als admin terwijl publiek uit” voor `/academie` (bewust niet gebouwd; secret URL is geen security model).
- Live browser-screenshots zijn optioneel; functionele tests + build dekken de contracten.
