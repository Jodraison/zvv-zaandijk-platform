-- Phase 3 — Match Events (Stap 3)
-- Doelpunten: minuut op bestaande match_goal_events.
-- Kaarten: nieuwe match_card_events (geen dubbele statistiekopslag).

ALTER TABLE public.match_goal_events
  ADD COLUMN IF NOT EXISTS minute int NOT NULL DEFAULT 0;

ALTER TABLE public.match_goal_events
  DROP CONSTRAINT IF EXISTS match_goal_events_minute_range;

ALTER TABLE public.match_goal_events
  ADD CONSTRAINT match_goal_events_minute_range CHECK (minute >= 0 AND minute <= 130);

COMMENT ON COLUMN public.match_goal_events.minute IS 'Wedstrijdminuut van het doelpunt (0–130).';

DO $$ BEGIN
  CREATE TYPE public.match_card_type AS ENUM ('yellow', 'red');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.match_card_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  card_type public.match_card_type NOT NULL,
  minute int NOT NULL CHECK (minute >= 0 AND minute <= 130),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_card_events_unique_slot UNIQUE (match_id, player_id, card_type, minute)
);

CREATE INDEX IF NOT EXISTS match_card_events_match_id_idx ON public.match_card_events (match_id);
CREATE INDEX IF NOT EXISTS match_card_events_player_id_idx ON public.match_card_events (player_id);

COMMENT ON TABLE public.match_card_events IS
  'Gele en rode kaarten per wedstrijd; geen afgeleide statistiektabel.';

ALTER TABLE public.match_card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_card_events_all" ON public.match_card_events;

CREATE POLICY mce_select ON public.match_card_events
  FOR SELECT USING (true);

CREATE POLICY mce_insert ON public.match_card_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mce_update ON public.match_card_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mce_delete ON public.match_card_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
