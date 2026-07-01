-- Phase 3 — Match Substitutions (Stap 4)
-- Wissels per wedstrijd; geen afgeleide statistiekopslag.

CREATE TABLE IF NOT EXISTS public.match_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_in_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  player_out_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  minute int NOT NULL CHECK (minute >= 0 AND minute <= 130),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_substitutions_players_distinct CHECK (player_in_id <> player_out_id),
  CONSTRAINT match_substitutions_unique_slot UNIQUE (match_id, player_in_id, player_out_id, minute)
);

CREATE INDEX IF NOT EXISTS match_substitutions_match_id_idx ON public.match_substitutions (match_id);
CREATE INDEX IF NOT EXISTS match_substitutions_player_in_id_idx ON public.match_substitutions (player_in_id);
CREATE INDEX IF NOT EXISTS match_substitutions_player_out_id_idx ON public.match_substitutions (player_out_id);

COMMENT ON TABLE public.match_substitutions IS
  'Wissels per wedstrijd (in/uit + minuut); geen afgeleide statistiektabel.';

ALTER TABLE public.match_substitutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_substitutions_all" ON public.match_substitutions;

CREATE POLICY ms_select ON public.match_substitutions
  FOR SELECT USING (true);

CREATE POLICY ms_insert ON public.match_substitutions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY ms_update ON public.match_substitutions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY ms_delete ON public.match_substitutions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
