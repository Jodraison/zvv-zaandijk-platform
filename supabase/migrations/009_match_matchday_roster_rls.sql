-- Sluit match_matchday_roster aan bij migratie 003 (publiek lezen, alleen admin schrijven).
-- Vervangt de te ruime policy uit 007_players_guest_and_match_roster.sql.

ALTER TABLE public.match_matchday_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_matchday_roster_all" ON public.match_matchday_roster;

CREATE POLICY mmr_select ON public.match_matchday_roster
  FOR SELECT USING (true);

CREATE POLICY mmr_insert ON public.match_matchday_roster
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mmr_update ON public.match_matchday_roster
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mmr_delete ON public.match_matchday_roster
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

COMMENT ON TABLE public.match_matchday_roster IS
  'Wedstrijd-selectie (incl. gasten). RLS: iedereen SELECT; INSERT/UPDATE/DELETE alleen admin (JWT). Service role bypass.';
