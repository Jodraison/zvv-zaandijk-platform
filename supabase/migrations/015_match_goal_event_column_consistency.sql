-- Hard migration: enforce canonical event columns only.
-- Source of truth columns:
--   match_goal_events.scorer_player_id
--   match_goal_events.assist_player_id

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
  DELETE FROM public.match_player_stats
  WHERE match_id = p_match_id;

  INSERT INTO public.match_player_stats (match_id, player_id, goals, assists)
  SELECT
    p_match_id AS match_id,
    u.player_id,
    COALESCE(SUM(CASE WHEN e.scorer_player_id = u.player_id THEN 1 ELSE 0 END), 0) AS goals,
    COALESCE(SUM(CASE WHEN e.assist_player_id = u.player_id THEN 1 ELSE 0 END), 0) AS assists
  FROM (
    SELECT scorer_player_id AS player_id
    FROM public.match_goal_events
    WHERE match_id = p_match_id
    UNION
    SELECT assist_player_id AS player_id
    FROM public.match_goal_events
    WHERE match_id = p_match_id
      AND assist_player_id IS NOT NULL
  ) u
  LEFT JOIN public.match_goal_events e
    ON e.match_id = p_match_id
  GROUP BY u.player_id;

  UPDATE public.matches m
  SET goals_for = (
    SELECT COUNT(*)
    FROM public.match_goal_events e
    WHERE e.match_id = p_match_id
  )
  WHERE m.id = p_match_id;
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
BEFORE INSERT OR UPDATE
ON public.match_goal_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_match_goal_event_fields();

CREATE TRIGGER match_goal_events_rebuild_stats_after_insert_stmt
AFTER INSERT
ON public.match_goal_events
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();

CREATE TRIGGER match_goal_events_rebuild_stats_after_update_stmt
AFTER UPDATE
ON public.match_goal_events
REFERENCING NEW TABLE AS new_rows OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();

CREATE TRIGGER match_goal_events_rebuild_stats_after_delete_stmt
AFTER DELETE
ON public.match_goal_events
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.rebuild_match_stats_from_goal_event();
