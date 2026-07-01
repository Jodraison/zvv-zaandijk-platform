-- Phase 3 — Match Management Foundation (Stap 1)
-- Wedstrijdtype + optionele metadata (locatie, scheidsrechter, notities).
-- Bestaande wedstrijden: match_type default 'competition'.

DO $$ BEGIN
  CREATE TYPE public.match_type AS ENUM ('competition', 'cup', 'friendly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_type public.match_type NOT NULL DEFAULT 'competition';

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS referee text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.matches.match_type IS 'Wedstrijdtype: competition, cup, friendly.';
COMMENT ON COLUMN public.matches.location IS 'Speellocatie (optioneel).';
COMMENT ON COLUMN public.matches.referee IS 'Scheidsrechter (optioneel).';
COMMENT ON COLUMN public.matches.notes IS 'Interne/admin notities (optioneel).';
