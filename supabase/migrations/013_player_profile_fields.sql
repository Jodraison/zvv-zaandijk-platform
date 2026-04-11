-- Richer player profile/card fields for Squad Control Center.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS initials text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS preferred_foot text,
  ADD COLUMN IF NOT EXISTS strengths text,
  ADD COLUMN IF NOT EXISTS role_label text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS card_note text;

COMMENT ON COLUMN public.players.initials IS 'Optionele initialen voor cards/fallback.';
COMMENT ON COLUMN public.players.bio IS 'Korte spelersbio.';
COMMENT ON COLUMN public.players.preferred_foot IS 'Bijv. Links/Rechts/Tweebenig.';
COMMENT ON COLUMN public.players.strengths IS 'Korte strengths-lijst/tekst.';
COMMENT ON COLUMN public.players.role_label IS 'Korte rolnaam voor profielkaart.';
COMMENT ON COLUMN public.players.tagline IS 'Club-style tagline onder naam.';
COMMENT ON COLUMN public.players.card_note IS 'Extra kaartnotitie voor selectie/profiel.';
