-- ZVV platform — database setup voor Supabase (PostgreSQL).
-- Eenmalig uitvoeren in: Dashboard → SQL Editor → New query → Run.
-- Lost o.a. "Could not find the 'ends_on' column of 'seasons'" op door ontbrekende kolommen toe te voegen.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums (idempotent)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.match_status AS ENUM ('scheduled', 'played');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- UI / Beheer gebruikt ook uitgesteld en geannuleerd
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'postponed';
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'cancelled';

DO $$ BEGIN
  CREATE TYPE public.player_position AS ENUM ('GK', 'DEF', 'MID', 'ATT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Verplichte kern (zoals specificatie)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_season_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players (id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.seasons (id) ON DELETE CASCADE,
  shirt_number int,
  position public.player_position
);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons (id) ON DELETE CASCADE,
  opponent text,
  kickoff_at timestamptz,
  is_home boolean,
  goals_for int,
  goals_against int,
  status public.match_status,
  wotm_player_id uuid REFERENCES public.players (id) ON DELETE SET NULL,
  integrity_state text NOT NULL DEFAULT 'verified' CHECK (integrity_state IN ('verified', 'invalid'))
);

CREATE TABLE IF NOT EXISTS public.match_player_stats (
  match_id uuid REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players (id) ON DELETE CASCADE,
  goals int DEFAULT 0,
  assists int DEFAULT 0,
  PRIMARY KEY (match_id, player_id)
);

-- -----------------------------------------------------------------------------
-- Reparatie: ontbrekende kolommen op bestaande tabellen (oude / handmatige schema’s)
-- -----------------------------------------------------------------------------
ALTER TABLE public.seasons ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.seasons ADD COLUMN IF NOT EXISTS starts_on date;
ALTER TABLE public.seasons ADD COLUMN IF NOT EXISTS ends_on date;
ALTER TABLE public.seasons ADD COLUMN IF NOT EXISTS is_active boolean;
ALTER TABLE public.seasons ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS initials text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS preferred_foot text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS strengths text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS role_label text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS card_note text;

ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS player_id uuid REFERENCES public.players (id) ON DELETE CASCADE;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons (id) ON DELETE CASCADE;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS shirt_number int;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS position public.player_position;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS is_captain boolean NOT NULL DEFAULT false;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS is_vice_captain boolean NOT NULL DEFAULT false;
ALTER TABLE public.player_season_memberships ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.match_goal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  scorer_player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  assist_player_id uuid REFERENCES public.players (id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS match_goal_events_match_id_idx ON public.match_goal_events (match_id);

DROP TRIGGER IF EXISTS match_goal_events_validate_before_write ON public.match_goal_events;
DROP TRIGGER IF EXISTS match_goal_events_rebuild_stats_after_write ON public.match_goal_events;
DROP TRIGGER IF EXISTS match_goal_events_rebuild_stats_after_insert_stmt ON public.match_goal_events;
DROP TRIGGER IF EXISTS match_goal_events_rebuild_stats_after_update_stmt ON public.match_goal_events;
DROP TRIGGER IF EXISTS match_goal_events_rebuild_stats_after_delete_stmt ON public.match_goal_events;
DROP FUNCTION IF EXISTS public.validate_match_goal_event_fields();
DROP FUNCTION IF EXISTS public.rebuild_match_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.rebuild_match_stats_from_goal_event() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_match_goal_event_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.scorer_player_id IS NULL THEN
    RAISE EXCEPTION 'scorer_player_id is required';
  END IF;
  IF NEW.assist_player_id IS NOT NULL AND NEW.assist_player_id = NEW.scorer_player_id THEN
    RAISE EXCEPTION 'assist_player_id cannot equal scorer_player_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rebuild_match_stats(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.match_player_stats WHERE match_id = p_match_id;
  INSERT INTO public.match_player_stats (match_id, player_id, goals, assists)
  SELECT
    p_match_id AS match_id,
    u.player_id,
    COALESCE(SUM(CASE WHEN e.scorer_player_id = u.player_id THEN 1 ELSE 0 END), 0) AS goals,
    COALESCE(SUM(CASE WHEN e.assist_player_id = u.player_id THEN 1 ELSE 0 END), 0) AS assists
  FROM (
    SELECT scorer_player_id AS player_id FROM public.match_goal_events WHERE match_id = p_match_id
    UNION
    SELECT assist_player_id AS player_id FROM public.match_goal_events WHERE match_id = p_match_id AND assist_player_id IS NOT NULL
  ) u
  LEFT JOIN public.match_goal_events e ON e.match_id = p_match_id
  GROUP BY u.player_id;

  UPDATE public.matches
  SET goals_for = (SELECT COUNT(*) FROM public.match_goal_events e WHERE e.match_id = p_match_id)
  WHERE id = p_match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rebuild_match_stats_from_goal_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_match_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR target_match_id IN
      SELECT DISTINCT n.match_id FROM new_rows n WHERE n.match_id IS NOT NULL
    LOOP
      PERFORM public.rebuild_match_stats(target_match_id);
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    FOR target_match_id IN
      SELECT DISTINCT o.match_id FROM old_rows o WHERE o.match_id IS NOT NULL
    LOOP
      PERFORM public.rebuild_match_stats(target_match_id);
    END LOOP;
  ELSE
    FOR target_match_id IN
      SELECT DISTINCT q.match_id
      FROM (
        SELECT match_id FROM new_rows
        UNION
        SELECT match_id FROM old_rows
      ) q
      WHERE q.match_id IS NOT NULL
    LOOP
      PERFORM public.rebuild_match_stats(target_match_id);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER match_goal_events_validate_before_write
BEFORE INSERT OR UPDATE ON public.match_goal_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_match_goal_event_fields();

CREATE TRIGGER match_goal_events_rebuild_stats_after_insert_stmt
AFTER INSERT ON public.match_goal_events
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();

CREATE TRIGGER match_goal_events_rebuild_stats_after_update_stmt
AFTER UPDATE ON public.match_goal_events
REFERENCING NEW TABLE AS new_rows OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();

CREATE TRIGGER match_goal_events_rebuild_stats_after_delete_stmt
AFTER DELETE ON public.match_goal_events
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons (id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS opponent text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS kickoff_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_home boolean;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS goals_for int;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS goals_against int;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS wotm_player_id uuid REFERENCES public.players (id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS status public.match_status;

ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches (id) ON DELETE CASCADE;
ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS player_id uuid REFERENCES public.players (id) ON DELETE CASCADE;
ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS goals int DEFAULT 0;
ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS assists int DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS player_season_memberships_player_season_uid
  ON public.player_season_memberships (player_id, season_id);

-- -----------------------------------------------------------------------------
-- Overige tabellen die de Next.js-app verwacht (club, training, fitheid)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_profile (
  id text PRIMARY KEY DEFAULT 'default',
  team_photo_url text
);

INSERT INTO public.club_profile (id, team_photo_url)
VALUES ('default', NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  title text,
  session_at timestamptz NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.training_attendance (
  session_id uuid NOT NULL REFERENCES public.training_sessions (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  present boolean NOT NULL,
  note text,
  PRIMARY KEY (session_id, player_id)
);

CREATE INDEX IF NOT EXISTS training_attendance_player_session_idx
  ON public.training_attendance (player_id, session_id);

CREATE TABLE IF NOT EXISTS public.fitness_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  test_type text NOT NULL CHECK (test_type IN ('sprint_20m', 'sprint_30m', 'custom')),
  time_seconds numeric NOT NULL,
  recorded_at timestamptz NOT NULL,
  note text
);

-- -----------------------------------------------------------------------------
-- RLS (anon/service zoals bestaande migratie — strak afdichten in productie)
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

DROP POLICY IF EXISTS "club_profile_all" ON public.club_profile;
CREATE POLICY "club_profile_all" ON public.club_profile FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "seasons_all" ON public.seasons;
CREATE POLICY "seasons_all" ON public.seasons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "players_all" ON public.players;
CREATE POLICY "players_all" ON public.players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "memberships_all" ON public.player_season_memberships;
CREATE POLICY "memberships_all" ON public.player_season_memberships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "matches_all" ON public.matches;
CREATE POLICY "matches_all" ON public.matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "match_stats_all" ON public.match_player_stats;
CREATE POLICY "match_stats_all" ON public.match_player_stats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "training_sessions_all" ON public.training_sessions;
CREATE POLICY "training_sessions_all" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "training_attendance_all" ON public.training_attendance;
CREATE POLICY "training_attendance_all" ON public.training_attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "fitness_tests_all" ON public.fitness_tests;
CREATE POLICY "fitness_tests_all" ON public.fitness_tests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.match_goal_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "match_goal_events_all" ON public.match_goal_events;
CREATE POLICY "match_goal_events_all" ON public.match_goal_events FOR ALL USING (true) WITH CHECK (true);
