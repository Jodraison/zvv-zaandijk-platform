DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'valid_score'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT valid_score
      CHECK (goals_for >= 0 AND goals_against >= 0);
  END IF;
END $$;
