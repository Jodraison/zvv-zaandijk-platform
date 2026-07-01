-- Phase 3 — Match Lineup Management (Stap 2)
-- Opstelling per wedstrijd: basis, bank, afwezig.

DO $$ BEGIN
  CREATE TYPE public.match_lineup_role AS ENUM ('starter', 'bench', 'absent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.match_lineup_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  role public.match_lineup_role NOT NULL,
  position text,
  absence_reason text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_lineup_entries_match_player_uid UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS match_lineup_entries_match_id_idx ON public.match_lineup_entries (match_id);
CREATE INDEX IF NOT EXISTS match_lineup_entries_player_id_idx ON public.match_lineup_entries (player_id);
CREATE INDEX IF NOT EXISTS match_lineup_entries_match_role_idx ON public.match_lineup_entries (match_id, role);

COMMENT ON TABLE public.match_lineup_entries IS
  'Wedstrijdopstelling: basis (max 11), bank en afwezigen — alleen seizoensselectie.';

ALTER TABLE public.match_lineup_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_lineup_entries_all" ON public.match_lineup_entries;

CREATE POLICY mle_select ON public.match_lineup_entries
  FOR SELECT USING (true);

CREATE POLICY mle_insert ON public.match_lineup_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mle_update ON public.match_lineup_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mle_delete ON public.match_lineup_entries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
