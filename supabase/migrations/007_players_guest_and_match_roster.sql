-- Gast-speelsters op player-niveau; wedstrijd-roster koppelt gasten aan één wedstrijd (zonder seizoenslidmaatschap).

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.players.is_guest IS
  'Gast: alleen wedstrijd-context via match_matchday_roster; geen vaste selectie of ranking.';

-- Legacy: lidmaatschap-vlag éénmalig naar player overzetten
UPDATE public.players p
SET is_guest = true
FROM public.player_season_memberships m
WHERE m.player_id = p.id
  AND m.is_guest = true
  AND p.is_guest = false;

-- Wie mag opstelling/doelpunten voor deze wedstrijd (club uit memberships + rijen hier voor gasten)
CREATE TABLE IF NOT EXISTS public.match_matchday_roster (
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  match_shirt_number int NULL,
  position_label text NULL,
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS match_matchday_roster_match_id_idx ON public.match_matchday_roster (match_id);
CREATE INDEX IF NOT EXISTS match_matchday_roster_player_id_idx ON public.match_matchday_roster (player_id);

COMMENT ON TABLE public.match_matchday_roster IS
  'Gasten en hun wedstrijd-specifieke weergave; vaste selectie komt uit player_season_memberships.';

ALTER TABLE public.match_matchday_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_matchday_roster_all" ON public.match_matchday_roster;
CREATE POLICY "match_matchday_roster_all" ON public.match_matchday_roster FOR ALL USING (true) WITH CHECK (true);
