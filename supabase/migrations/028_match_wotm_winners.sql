-- Meerdere Player of the Match-winnaars per wedstrijd.
-- Legacy-kolom matches.wotm_player_id blijft als spiegel van de eerste winnaar.

CREATE TABLE IF NOT EXISTS public.match_wotm_winners (
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS match_wotm_winners_match_id_idx ON public.match_wotm_winners (match_id);
CREATE INDEX IF NOT EXISTS match_wotm_winners_player_id_idx ON public.match_wotm_winners (player_id);

COMMENT ON TABLE public.match_wotm_winners IS
  'Player of the Match-winnaars. Elke rij = één volledige award. UNIQUE(match_id, player_id).';

INSERT INTO public.match_wotm_winners (match_id, player_id)
SELECT m.id, m.wotm_player_id
FROM public.matches m
WHERE m.wotm_player_id IS NOT NULL
ON CONFLICT (match_id, player_id) DO NOTHING;

ALTER TABLE public.match_wotm_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_wotm_winners_select ON public.match_wotm_winners;
DROP POLICY IF EXISTS match_wotm_winners_insert ON public.match_wotm_winners;
DROP POLICY IF EXISTS match_wotm_winners_update ON public.match_wotm_winners;
DROP POLICY IF EXISTS match_wotm_winners_delete ON public.match_wotm_winners;

CREATE POLICY match_wotm_winners_select ON public.match_wotm_winners
  FOR SELECT USING (true);

CREATE POLICY match_wotm_winners_insert ON public.match_wotm_winners
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY match_wotm_winners_update ON public.match_wotm_winners
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY match_wotm_winners_delete ON public.match_wotm_winners
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
