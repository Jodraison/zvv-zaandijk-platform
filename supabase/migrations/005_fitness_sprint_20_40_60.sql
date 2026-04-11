-- Fitheid: sprint 20m / 40m / 60m (test_type = sprint_20_40_60).
-- Bestaande fitness_tests-rijen worden verwijderd — export eerst indien nodig.

DELETE FROM public.fitness_tests;

ALTER TABLE public.fitness_tests DROP COLUMN IF EXISTS time_seconds;
ALTER TABLE public.fitness_tests DROP CONSTRAINT IF EXISTS fitness_tests_test_type_check;

ALTER TABLE public.fitness_tests
  ADD COLUMN test_on date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN sprint_20m numeric(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN sprint_40m numeric(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN sprint_60m numeric(6,2) NOT NULL DEFAULT 0;

ALTER TABLE public.fitness_tests ALTER COLUMN test_on DROP DEFAULT;
ALTER TABLE public.fitness_tests ALTER COLUMN sprint_20m DROP DEFAULT;
ALTER TABLE public.fitness_tests ALTER COLUMN sprint_40m DROP DEFAULT;
ALTER TABLE public.fitness_tests ALTER COLUMN sprint_60m DROP DEFAULT;

ALTER TABLE public.fitness_tests
  ADD CONSTRAINT fitness_tests_test_type_check CHECK (test_type = 'sprint_20_40_60');

ALTER TABLE public.fitness_tests ALTER COLUMN test_type SET DEFAULT 'sprint_20_40_60';

CREATE UNIQUE INDEX IF NOT EXISTS fitness_tests_player_season_test_day
  ON public.fitness_tests (player_id, season_id, test_on);
