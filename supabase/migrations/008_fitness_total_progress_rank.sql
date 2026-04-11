-- Totaaltijd (20+40+60), progressie t.o.v. vorige meting, top-3 per testdag.

ALTER TABLE public.fitness_tests
  ADD COLUMN IF NOT EXISTS total_time numeric(8,2),
  ADD COLUMN IF NOT EXISTS progress_status text,
  ADD COLUMN IF NOT EXISTS progress_delta numeric(8,2),
  ADD COLUMN IF NOT EXISTS session_rank int;

UPDATE public.fitness_tests
SET total_time = sprint_20m + sprint_40m + sprint_60m
WHERE total_time IS NULL;

ALTER TABLE public.fitness_tests
  ALTER COLUMN total_time SET NOT NULL,
  ALTER COLUMN total_time SET DEFAULT 0;

ALTER TABLE public.fitness_tests DROP CONSTRAINT IF EXISTS fitness_tests_progress_status_check;
ALTER TABLE public.fitness_tests
  ADD CONSTRAINT fitness_tests_progress_status_check
  CHECK (
    progress_status IS NULL
    OR progress_status IN ('improved', 'declined', 'equal', 'no_previous')
  );

ALTER TABLE public.fitness_tests DROP CONSTRAINT IF EXISTS fitness_tests_session_rank_check;
ALTER TABLE public.fitness_tests
  ADD CONSTRAINT fitness_tests_session_rank_check
  CHECK (session_rank IS NULL OR (session_rank >= 1 AND session_rank <= 3));

COMMENT ON COLUMN public.fitness_tests.total_time IS
  'Totaal seconden (20+40+60); bij import één gemeten tijd, anders som van de drie sprints.';
COMMENT ON COLUMN public.fitness_tests.progress_status IS
  'Verschil t.o.v. vorige metingzelfde speelster (sneller = improved).';
COMMENT ON COLUMN public.fitness_tests.progress_delta IS
  'Vorige total_time minus huidige (positief = sneller geworden).';
COMMENT ON COLUMN public.fitness_tests.session_rank IS
  '1–3 op deze test_on binnen het seizoen (snelste totaal); overige NULL.';
