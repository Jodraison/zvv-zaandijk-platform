/**
 * POST-LOCKDOWN SURFACE AUDIT (codebase — bij elke grote auth/data-wijziging herlezen)
 *
 * MIDDLEWARE (platform/middleware.ts)
 * - Beschermt: /beheer, /api/admin, /actions
 * - Publiek: /login, /auth/*
 * - Regel: geen sessie → /login (pagina) of 401 (API); sessie zonder admin-e-mail → / (pagina) of 403 (API)
 *
 * SERVER ACTIONS (src/actions/*) — schrijven uitsluitend via mutateDb → assertAdminServerAction + row-diff + audit
 * - players.ts: create/update/delete/addToSeason
 * - Wedstrijden: match-admin.ts (MatchAdminForm) — geen legacy matches.ts meer.
 * - match-admin.ts: save/delete (wrapt mutateDb)
 * - match-guest.ts: gast toevoegen/verwijderen per wedstrijd (wrapt mutateDb)
 * - match-entry.ts: delegeert naar match-admin
 * - training.ts: sessie + attendance
 * - fitness.ts: tests
 * - seasons-admin.ts: seizoenen
 * - club-settings.ts: teamfoto
 * - season.ts: alleen cookie zvv_season_id (geen DB-write) — bewust publiek
 *
 * API ROUTES
 * - app/api/admin/health/route.ts: dubbele admin-check na middleware
 *
 * PUBLIEKE PAGINA’S
 * - Onder app/(site): readDb voor render; geen admin forms zonder auth
 *
 * SUPABASE
 * - Server client = anon + user JWT; writes afhankelijk van RLS (admin policies in migratie 003)
 */
export {};
