# Maintenance mode — operationele handleiding

Korte handleiding voor Phase 1 (Development Freeze). Geen codewijziging nodig om maintenance aan of uit te zetten.

---

## Doel

Publieke bezoekers tijdelijk afschermen terwijl administrators kunnen inloggen en `/beheer` blijven gebruiken. Bedoeld voor voorbereiding op seizoen 2026/2027.

Implementatie: `platform/middleware.ts` + env-flags in `platform/src/lib/maintenance.ts`.

---

## Environment variables

| Variabele | Waarde | Server-only |
|-----------|--------|-------------|
| `MAINTENANCE_MODE` | `true` of `1` = actief; `false` / unset = uit | **Ja** — nooit `NEXT_PUBLIC_` gebruiken |
| `MAINTENANCE_ADMIN_BYPASS` | `true` = ingelogde admin mag publieke routes previewen | **Ja** |

**Benodigd voor login/beheer tijdens maintenance** (normale app-config):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (uploads in beheer)

**Verkeerde configuratie:**

| Fout | Gevolg |
|------|--------|
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Niet gelezen; flag werkt niet zoals bedoeld |
| `MAINTENANCE_MODE=yes` | Niet actief (alleen `true` / `1`) |
| Supabase-keys ontbreken | `/login` en `/beheer` falen; maintenance-pagina zelf werkt wel |
| `MAINTENANCE_ADMIN_BYPASS=true` zonder Supabase | Bypass werkt niet; admin kan alleen `/beheer` via exempt routes |

---

## Maintenance inschakelen

1. Zet op de **hostingomgeving** (niet in git):
   ```env
   MAINTENANCE_MODE=true
   ```
2. Optioneel preview voor admin:
   ```env
   MAINTENANCE_ADMIN_BYPASS=true
   ```
3. **Redeploy** of herstart de app (afhankelijk van host — middleware leest env bij runtime, maar veel hosts vereisen redeploy na env-wijziging).
4. **CDN-cache legen** indien van toepassing (zie aandachtspunten).

Geen codewijziging of migratie nodig.

---

## Maintenance uitschakelen

1. Zet `MAINTENANCE_MODE=false` of verwijder de variabele.
2. Zet `MAINTENANCE_ADMIN_BYPASS=false` of verwijder.
3. Redeploy / herstart.
4. CDN-cache legen.
5. Voer validatiestappen hieronder uit.

---

## Admin bypass

Alleen relevant als **beide** `MAINTENANCE_MODE=true` en `MAINTENANCE_ADMIN_BYPASS=true`.

- **Ingelogde admin** (e-mail volgens `src/lib/auth/is-admin.ts`): publieke routes (`/`, `/selectie`, …) blijven bereikbaar.
- **Uitgelogde bezoekers**: redirect naar `/maintenance`.
- **Niet-admin**: geen `/beheer`; publiek geblokkeerd.

Zonder bypass: admin bereikt alleen exempt routes (`/login`, `/auth/*`, `/beheer/*`, `/maintenance`).

---

## Validatiestappen na activeren

**Incognito (publiek):**

- [ ] `/` → `/maintenance`
- [ ] `/selectie`, `/wedstrijden` → `/maintenance`
- [ ] `/maintenance` toont onderhoudsmelding + link naar `/login`

**Admin:**

- [ ] `/login` bereikbaar
- [ ] Inloggen → `/beheer` werkt
- [ ] Minstens één beheerpagina laadt (bijv. `/beheer/spelers`)

**Na uitschakelen:**

- [ ] `/` toont normale homepage
- [ ] `npm run lint && npm run typecheck && npm run build` (lokaal/CI)

---

## Routes tijdens maintenance

| Bereikbaar | Geblokkeerd (→ `/maintenance`) |
|------------|--------------------------------|
| `/_next/*`, statische assets, `/favicon.ico` | `/`, `/selectie`, `/wedstrijden`, … |
| `/maintenance`, `/login`, `/auth/*` | |
| `/beheer/*` (met admin-auth) | |
| `/api/admin/*` (met admin-auth) | |

---

## Bekende aandachtspunten

1. **CDN / edge-cache** — Gecachte HTML van `/` kan kort de oude homepage tonen; cache purgen na toggle.
2. **Geen `vercel.json` in repo** — env en redeploy via hosting-dashboard; documenteer waar productie draait.
3. **Legacy `frontend/`** — aparte Vite-app; valt buiten deze maintenance-middleware.
4. **CLI-scripts** (`npm run import:*`) — bypassen de website; alleen voor operators met service key.
5. **Recovery bij lockout** — zet `MAINTENANCE_MODE=false` in hosting-env en redeploy; admin-login vereist nog steeds Supabase-config.

---

## Lokaal testen

```bash
# .env.local
MAINTENANCE_MODE=true
MAINTENANCE_ADMIN_BYPASS=false
```

```bash
npm run dev
```

Bezoek `http://localhost:3000/` → verwacht redirect naar `/maintenance`.
