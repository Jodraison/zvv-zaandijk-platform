-- Leesbare positie per seizoen-lidmaatschap (naast enum `position`).

ALTER TABLE public.player_season_memberships
  ADD COLUMN IF NOT EXISTS display_position text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.player_season_memberships.display_position IS
  'NL positie-tekst voor UI; `position` blijft GK/DEF/MID/ATT voor filters en logica.';

-- Rugnummer uniek per seizoen (voorkomt dubbele nummers in de database).
CREATE UNIQUE INDEX IF NOT EXISTS player_season_memberships_season_shirt_unique
  ON public.player_season_memberships (season_id, shirt_number);
