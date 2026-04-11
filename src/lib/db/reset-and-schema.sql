-- =============================================================================
-- ZVV platform — RESET + schone schema (Supabase / PostgreSQL)
-- =============================================================================
-- Waarschuwing: vernietigt alle rijen in de hieronder genoemde tabellen.
-- Voer uit in: Supabase Dashboard → SQL Editor → één keer Run.
--
-- Na reset: draai je seed-script opnieuw om clubdata te vullen.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabellen verwijderen (kind-tabellen eerst; CASCADE breekt overige afhankelijkheden)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS
  public.training_attendance,
  public.match_player_stats,
  public.fitness_tests,
  public.training_sessions,
  public.matches,
  public.player_season_memberships,
  public.players,
  public.seasons,
  public.club_profile
CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Custom types verwijderen (na tabellen, zodat enum-kolommen weg zijn)
-- -----------------------------------------------------------------------------
DROP TYPE IF EXISTS public.match_status CASCADE;
DROP TYPE IF EXISTS public.player_position CASCADE;

-- -----------------------------------------------------------------------------
-- 3. Extensie voor gen_random_uuid()
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 4. Enum types (in lijn met src/types — MatchStatus & PlayerPosition)
-- -----------------------------------------------------------------------------
CREATE TYPE public.match_status AS ENUM (
  'scheduled',
  'played',
  'postponed',
  'cancelled'
);

CREATE TYPE public.player_position AS ENUM (
  'GK',
  'DEF',
  'MID',
  'ATT'
);

COMMENT ON TYPE public.match_status IS 'Wedstrijdstatus; komt overeen met MatchStatus in de app.';
COMMENT ON TYPE public.player_position IS 'Veldpositie per seizoen-lidmaatschap; komt overeen met PlayerPosition in de app.';

-- -----------------------------------------------------------------------------
-- 5. Kern: seizoenen
-- -----------------------------------------------------------------------------
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  is_active boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE public.seasons IS 'Competitie-/ploegseizoenen met begin- en einddatum.';
COMMENT ON COLUMN public.seasons.is_active IS 'Slechts één seizoen zou actief moeten zijn (app-conventie).';

-- -----------------------------------------------------------------------------
-- 6. Spelers
-- -----------------------------------------------------------------------------
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  photo_url text,
  initials text,
  bio text,
  preferred_foot text,
  strengths text,
  role_label text,
  tagline text,
  card_note text
);

COMMENT ON TABLE public.players IS 'Spelers buiten seizoencontext; foto-URL optioneel.';
COMMENT ON COLUMN public.players.photo_url IS 'Publiceerbare afbeelding-URL (homepage/ranking/selectie).';

-- -----------------------------------------------------------------------------
-- 7. Clubprofiel (teamfoto homepage — gebruikt door loadClubDatabaseFromSupabase)
-- -----------------------------------------------------------------------------
CREATE TABLE public.club_profile (
  id text PRIMARY KEY DEFAULT 'default',
  team_photo_url text
);

COMMENT ON TABLE public.club_profile IS 'Singleton-rij voor clubbrede instellingen (teamfoto).';

INSERT INTO public.club_profile (id, team_photo_url)
VALUES ('default', NULL);

-- -----------------------------------------------------------------------------
-- 8. Lidmaatschappen speler ↔ seizoen
-- -----------------------------------------------------------------------------
CREATE TABLE public.player_season_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  shirt_number int NOT NULL,
  position public.player_position NOT NULL,
  is_captain boolean NOT NULL DEFAULT false,
  is_vice_captain boolean NOT NULL DEFAULT false,
  CONSTRAINT player_season_memberships_player_season_unique UNIQUE (player_id, season_id)
);

COMMENT ON TABLE public.player_season_memberships IS 'Rugnummer en positie per speler per seizoen; aanvoerdersvlaggen.';
COMMENT ON COLUMN public.player_season_memberships.is_captain IS 'Aanvoerder voor dit seizoen.';
COMMENT ON COLUMN public.player_season_memberships.is_vice_captain IS 'Assistent-aanvoerder voor dit seizoen.';

-- -----------------------------------------------------------------------------
-- 9. Wedstrijden
-- -----------------------------------------------------------------------------
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  opponent text NOT NULL,
  kickoff_at timestamptz NOT NULL,
  is_home boolean NOT NULL,
  goals_for int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  wotm_player_id uuid REFERENCES public.players (id) ON DELETE SET NULL,
  integrity_state text NOT NULL DEFAULT 'verified' CHECK (integrity_state IN ('verified', 'invalid'))
);

COMMENT ON TABLE public.matches IS 'Competitiewedstrijden gekoppeld aan een seizoen.';
COMMENT ON COLUMN public.matches.wotm_player_id IS 'Woman of the match; ON DELETE SET NULL als speler verwijderd wordt.';
COMMENT ON COLUMN public.matches.status IS 'Enum match_status; default scheduled voor countdown / geplande wedstrijden.';

-- -----------------------------------------------------------------------------
-- 10. Statistieken per wedstrijd en speler
-- -----------------------------------------------------------------------------
CREATE TABLE public.match_player_stats (
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  PRIMARY KEY (match_id, player_id)
);

COMMENT ON TABLE public.match_player_stats IS 'Doelpunten en assists per speler per wedstrijd (composite PK voor PostgREST upsert).';

-- -----------------------------------------------------------------------------
-- 11. Training (sessies + aanwezigheid)
-- -----------------------------------------------------------------------------
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  title text,
  session_at timestamptz NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled'))
);

COMMENT ON TABLE public.training_sessions IS 'Trainingen gekoppeld aan een seizoen.';

CREATE TABLE public.training_attendance (
  session_id uuid NOT NULL REFERENCES public.training_sessions (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  present boolean NOT NULL,
  note text,
  PRIMARY KEY (session_id, player_id)
);

CREATE INDEX training_attendance_player_session_idx
  ON public.training_attendance (player_id, session_id);

COMMENT ON TABLE public.training_attendance IS 'Aanwezigheid per trainingssessie en speler.';

-- -----------------------------------------------------------------------------
-- 12. Fitheidstests
-- -----------------------------------------------------------------------------
CREATE TABLE public.fitness_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  test_type text NOT NULL CHECK (test_type IN ('sprint_20m', 'sprint_30m', 'custom')),
  time_seconds numeric NOT NULL,
  recorded_at timestamptz NOT NULL,
  note text
);

COMMENT ON TABLE public.fitness_tests IS 'Fysieke testresultaten (tijd in seconden) per speler per seizoen.';

-- -----------------------------------------------------------------------------
-- 13. Indexen ( veelgebruikte filters en joins )
-- -----------------------------------------------------------------------------
CREATE INDEX idx_seasons_is_active ON public.seasons (is_active) WHERE is_active = true;

CREATE INDEX idx_player_season_memberships_season_id ON public.player_season_memberships (season_id);
CREATE INDEX idx_player_season_memberships_player_id ON public.player_season_memberships (player_id);

CREATE INDEX idx_matches_season_id ON public.matches (season_id);
CREATE INDEX idx_matches_season_kickoff ON public.matches (season_id, kickoff_at DESC);
CREATE INDEX idx_matches_status ON public.matches (status);

CREATE INDEX idx_match_player_stats_player_id ON public.match_player_stats (player_id);

CREATE INDEX idx_training_sessions_season_session_at ON public.training_sessions (season_id, session_at DESC);

CREATE INDEX idx_fitness_tests_season_player ON public.fitness_tests (season_id, player_id);
CREATE INDEX idx_fitness_tests_recorded_at ON public.fitness_tests (recorded_at DESC);

-- -----------------------------------------------------------------------------
-- 14. Row Level Security (open policies — strak afdichten in productie met auth)
-- -----------------------------------------------------------------------------
ALTER TABLE public.club_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_season_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_profile_all" ON public.club_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "seasons_all" ON public.seasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "players_all" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "memberships_all" ON public.player_season_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "matches_all" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "match_stats_all" ON public.match_player_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_sessions_all" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_attendance_all" ON public.training_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fitness_tests_all" ON public.fitness_tests FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Einde reset + schema
-- =============================================================================
