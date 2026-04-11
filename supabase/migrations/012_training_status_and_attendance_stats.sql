-- Training status + afgeleide attendance stats.

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_sessions_status_check'
  ) THEN
    ALTER TABLE public.training_sessions
      ADD CONSTRAINT training_sessions_status_check
      CHECK (status IN ('completed', 'cancelled'));
  END IF;
END $$;

UPDATE public.training_sessions
SET status = 'completed'
WHERE status IS NULL
   OR status NOT IN ('completed', 'cancelled');

-- Snelle joins/upserts voor attendance en stats.
CREATE INDEX IF NOT EXISTS training_attendance_player_session_idx
  ON public.training_attendance (player_id, session_id);

-- Als een sessie op cancelled staat, hoort er geen attendance bij.
DELETE FROM public.training_attendance ta
USING public.training_sessions ts
WHERE ts.id = ta.session_id
  AND ts.status = 'cancelled';

CREATE OR REPLACE VIEW public.training_attendance_stats AS
SELECT
  p.id AS player_id,
  COUNT(*) FILTER (WHERE ta.present = true)::int AS present_count,
  COUNT(*) FILTER (WHERE ta.present = false)::int AS absent_count,
  COUNT(*)::int AS total_sessions,
  ROUND(
    (COUNT(*) FILTER (WHERE ta.present = true)::numeric
      / NULLIF(COUNT(*), 0)) * 100,
    1
  ) AS attendance_percentage
FROM public.training_attendance ta
JOIN public.training_sessions ts ON ts.id = ta.session_id
JOIN public.players p ON p.id = ta.player_id
WHERE ts.status = 'completed'
GROUP BY p.id;
