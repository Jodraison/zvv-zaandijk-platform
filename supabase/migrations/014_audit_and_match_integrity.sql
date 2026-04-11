ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS before_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS after_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS verification jsonb;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS integrity_state text NOT NULL DEFAULT 'verified';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matches_integrity_state_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_integrity_state_check
      CHECK (integrity_state IN ('verified', 'invalid'));
  END IF;
END $$;
