-- HARD RESET: canonical match event integrity
-- Canonical truth:
--   match_goal_events.scorer_player_id
--   match_goal_events.assist_player_id

DROP FUNCTION IF EXISTS public.rebuild_match_stats CASCADE;
DROP FUNCTION IF EXISTS public.rebuild_match_stats(uuid) CASCADE;

ALTER TABLE public.match_goal_events
  DROP COLUMN IF EXISTS scorer_id,
  DROP COLUMN IF EXISTS assist_id;

ALTER TABLE public.match_goal_events
  ADD COLUMN IF NOT EXISTS scorer_player_id uuid,
  ADD COLUMN IF NOT EXISTS assist_player_id uuid;

DELETE FROM public.match_goal_events
WHERE scorer_player_id IS NULL;

ALTER TABLE public.match_goal_events
  ALTER COLUMN scorer_player_id SET NOT NULL;

UPDATE public.matches
SET integrity_state = 'invalid';

CREATE OR REPLACE FUNCTION public.rebuild_match_stats(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  event_goals int;
  event_assists int;
BEGIN
  SELECT COUNT(*) INTO event_goals
  FROM public.match_goal_events
  WHERE match_id = p_match_id;

  SELECT COUNT(*) INTO event_assists
  FROM public.match_goal_events
  WHERE match_id = p_match_id AND assist_player_id IS NOT NULL;

  DELETE FROM public.match_player_stats WHERE match_id = p_match_id;

  INSERT INTO public.match_player_stats (match_id, player_id, goals, assists)
  SELECT match_id, scorer_player_id, COUNT(*)::int AS goals, 0
  FROM public.match_goal_events
  WHERE match_id = p_match_id
  GROUP BY match_id, scorer_player_id;

  INSERT INTO public.match_player_stats (match_id, player_id, goals, assists)
  SELECT match_id, assist_player_id, 0, COUNT(*)::int AS assists
  FROM public.match_goal_events
  WHERE match_id = p_match_id AND assist_player_id IS NOT NULL
  GROUP BY match_id, assist_player_id
  ON CONFLICT (match_id, player_id)
  DO UPDATE SET assists = EXCLUDED.assists;

  UPDATE public.matches
  SET goals_for = event_goals
  WHERE id = p_match_id;

  UPDATE public.matches
  SET integrity_state = 'verified'
  WHERE id = p_match_id AND goals_for = event_goals;
END;
$$;

DO $$
DECLARE
  m record;
  ev int;
BEGIN
  FOR m IN
    SELECT id, goals_for, status
    FROM public.matches
  LOOP
    PERFORM public.rebuild_match_stats(m.id);
    SELECT COUNT(*) INTO ev FROM public.match_goal_events WHERE match_id = m.id;
    IF m.status = 'played' AND m.goals_for > 0 AND ev = 0 THEN
      UPDATE public.matches
      SET goals_for = 0,
          wotm_player_id = NULL,
          integrity_state = 'verified'
      WHERE id = m.id;
    END IF;
  END LOOP;
END;
$$;
