/**
 * PRODUCTION TEST MATRIX — ZVV platform (handmatig of geautomatiseerd)
 *
 * AUTH & TOEGANG
 * - [ ] Niet ingelogd: GET /beheer → redirect /login?next=…
 * - [ ] Niet ingelogd: GET /api/admin/* → redirect login
 * - [ ] Ingelogd, role ≠ admin: GET /beheer → redirect /
 * - [ ] Ingelogd, role ≠ admin: geen “Beheer”-link in header
 * - [ ] Admin: volledige /beheer + /api/admin/health JSON ok
 * - [ ] Anon key in browser: INSERT/UPDATE/DELETE op club-tabellen geweigerd door RLS (Supabase SQL of client test)
 *
 * SPELERS
 * - [ ] Player create (met/zonder aanvoerder) → selectie + ranking data
 * - [ ] Player update (naam, foto, rugnummer) → selectie / detail
 * - [ ] Player delete uit seizoen → membership weg; clubrecord blijft als ander seizoen
 * - [ ] Gast-toggle zichtbaar in beheer/selectie
 * - [ ] Aanvoerder wijzigen → precies één captain per seizoen in UI
 * - [ ] Assistent-captain wijzigen → precies één vice per seizoen in UI
 *
 * WEDSTRIJDEN
 * - [ ] Match create → wedstrijdenlijst + home “volgende” indien van toepassing
 * - [ ] Match edit (datum) → countdown / hero op home
 * - [ ] Goals / assists / MVP → ranking + speler-detailstatistieken
 * - [ ] Match delete (met confirm) → stats/events weg, ranking herberekend na refresh
 *
 * TRAINING
 * - [ ] Sessie aanmaken → trainingpagina
 * - [ ] Aanwezigheid wijzigen → training + speler aggregates
 *
 * FITHEID
 * - [ ] Test toevoegen (lid moet in seizoen) → fitheid + spelerreeks
 *
 * SEIZOENEN
 * - [ ] Nieuw seizoen + actief zetten → beheer + publieke seizoenenpagina
 * - [ ] Seizoen-switch (cookie/URL) → alle pagina’s tonen juiste dataset
 *
 * FOUTEN
 * - [ ] Ongeldig formulier → duidelijke fout (geen stille return)
 * - [ ] Concurrent save → Nederlandse melding optimistic lock
 * - [ ] Auditlog-insert faalt → mutatie faalt zichtbaar
 * - [ ] Gebroken DB/read → “Data niet beschikbaar” (geen lege fake dataset)
 *
 * Dit bestand bevat geen runtime-logica — alleen documentatie voor QA.
 */
export {};
