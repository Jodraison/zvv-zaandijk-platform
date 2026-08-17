-- Geboortedatum op persoonsniveau (niet seizoenslidmaatschap).
-- Volledige datum alleen in beheer zichtbaar; publiek alleen maand/dag voor verjaardag.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS birth_date date NULL;

COMMENT ON COLUMN public.players.birth_date IS
  'Geboortedatum (YYYY-MM-DD). Persoonsniveau. Niet publiek tonen (geen jaar/leeftijd).';

ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_birth_date_not_future;

ALTER TABLE public.players
  ADD CONSTRAINT players_birth_date_not_future
  CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE);

ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_birth_date_realistic;

ALTER TABLE public.players
  ADD CONSTRAINT players_birth_date_realistic
  CHECK (birth_date IS NULL OR birth_date >= DATE '1950-01-01');
