-- Update rugnummer + positie + display_position voor huidige seizoen (players.full_name match).
-- Alleen public.player_season_memberships; geen wijzigingen aan public.players.
-- Twee fasen shirt_number i.v.m. UNIQUE (season_id, shirt_number).

DO $$
DECLARE
  v_season uuid;
  v_count int;
BEGIN
  SELECT id INTO v_season
  FROM public.seasons
  WHERE is_active = true
  ORDER BY starts_on DESC
  LIMIT 1;

  IF v_season IS NULL THEN
    RAISE EXCEPTION '011_player_shirts: geen actief seizoen (seasons.is_active = true).';
  END IF;

  -- Fase 1: tijdelijke unieke shirtnummers (70001+), alleen rijen die we gaan bijwerken
  WITH mapping_name AS (
    SELECT *
    FROM (
      VALUES
        ('Jelisa De Jonge'),
        ('Melissa Donkers'),
        ('Yente Oud'),
        ('Marisha Prins'),
        ('Anouk Aafjes'),
        ('Tess Luijting'),
        ('Lorelai Bakker'),
        ('Kyra De Bakker'),
        ('Renée Koopman'),
        ('Mandy Kalmeijer'),
        ('Melissa Rietveld'),
        ('Dionne van Dijk'),
        ('Emma de Mie'),
        ('Shura Nieboer'),
        ('Nienke Hoffman'),
        ('Andrada Timmer'),
        ('Danique van Heeringen'),
        ('Demi Luijting'),
        ('Mariska Oosterhuis'),
        ('Maura Hoffman'),
        ('Isa Oosterhoorn')
    ) AS t(full_name)
  ),
  to_touch AS (
    SELECT m.id
    FROM public.player_season_memberships m
    INNER JOIN public.players p ON p.id = m.player_id
    INNER JOIN mapping_name mn ON mn.full_name = p.full_name
    WHERE m.season_id = v_season
  ),
  numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM to_touch
  )
  UPDATE public.player_season_memberships m
  SET shirt_number = 70000 + numbered.rn
  FROM numbered
  WHERE m.id = numbered.id;

  -- Fase 2: definitieve waarden
  WITH src AS (
    SELECT *
    FROM (
      VALUES
        ('Jelisa De Jonge', 1, 'GK'::text, 'Keeper'),
        ('Melissa Donkers', 14, 'DEF', 'Rechtsback'),
        ('Yente Oud', 3, 'DEF', 'Centrale verdediger'),
        ('Marisha Prins', 5, 'DEF', 'Linksback'),
        ('Anouk Aafjes', 19, 'DEF', 'Centrale verdediger'),
        ('Tess Luijting', 4, 'DEF', 'Centrale verdediger'),
        ('Lorelai Bakker', 18, 'MID', 'RM / LM / Back'),
        ('Kyra De Bakker', 17, 'MID', 'RM / LM'),
        ('Renée Koopman', 8, 'MID', 'RM / LM'),
        ('Mandy Kalmeijer', 2, 'MID', 'CM / LCM / RCM'),
        ('Melissa Rietveld', 9, 'ATT', 'LM / Spits'),
        ('Dionne van Dijk', 10, 'MID', 'CM / RCM'),
        ('Emma de Mie', 20, 'ATT', 'Rechtsbuiten / Linksbuiten'),
        ('Shura Nieboer', 21, 'ATT', 'Allround / RB / Aanval'),
        ('Nienke Hoffman', 11, 'ATT', 'Spits / Rechtsbuiten'),
        ('Andrada Timmer', 12, 'ATT', 'Linksbuiten / Rechtsbuiten / Spits'),
        ('Danique van Heeringen', 7, 'ATT', 'Linksbuiten'),
        ('Demi Luijting', 22, 'ATT', 'Linksbuiten'),
        ('Mariska Oosterhuis', 16, 'DEF', 'Centrale verdediger'),
        ('Maura Hoffman', 13, 'DEF', 'Linksback / Rechtsback'),
        ('Isa Oosterhoorn', 6, 'MID', 'RCM / Rechtsback')
    ) AS t(full_name, shirt_number, pos_text, display_position)
  )
  UPDATE public.player_season_memberships m
  SET
    shirt_number = src.shirt_number,
    position = src.pos_text::public.player_position,
    display_position = src.display_position
  FROM public.players p
  INNER JOIN src ON src.full_name = p.full_name
  WHERE m.player_id = p.id
    AND m.season_id = v_season;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '011_player_shirts: bijgewerkt % membership-rijen voor seizoen %', v_count, v_season;
END $$;

-- Meerdere players met dezelfde full_name (zou dubbele shirts kunnen geven)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.full_name, COUNT(*)::int AS n
    FROM public.players p
    WHERE p.full_name IN (
      'Jelisa De Jonge', 'Melissa Donkers', 'Yente Oud', 'Marisha Prins', 'Anouk Aafjes',
      'Tess Luijting', 'Lorelai Bakker', 'Kyra De Bakker', 'Renée Koopman', 'Mandy Kalmeijer',
      'Melissa Rietveld', 'Dionne van Dijk', 'Emma de Mie', 'Shura Nieboer', 'Nienke Hoffman',
      'Andrada Timmer', 'Danique van Heeringen', 'Demi Luijting', 'Mariska Oosterhuis',
      'Maura Hoffman', 'Isa Oosterhoorn'
    )
    GROUP BY p.full_name
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE '011_player_shirts MISMATCH: dubbele full_name „%” (n=%)', r.full_name, r.n;
  END LOOP;
END $$;

-- Ontbrekende spelers (naam in mapping, geen player-rij)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('Jelisa De Jonge'),
        ('Melissa Donkers'),
        ('Yente Oud'),
        ('Marisha Prins'),
        ('Anouk Aafjes'),
        ('Tess Luijting'),
        ('Lorelai Bakker'),
        ('Kyra De Bakker'),
        ('Renée Koopman'),
        ('Mandy Kalmeijer'),
        ('Melissa Rietveld'),
        ('Dionne van Dijk'),
        ('Emma de Mie'),
        ('Shura Nieboer'),
        ('Nienke Hoffman'),
        ('Andrada Timmer'),
        ('Danique van Heeringen'),
        ('Demi Luijting'),
        ('Mariska Oosterhuis'),
        ('Maura Hoffman'),
        ('Isa Oosterhoorn')
    ) AS expected(full_name)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.players p WHERE p.full_name = expected.full_name
    )
  LOOP
    RAISE NOTICE '011_player_shirts MISMATCH: geen player voor naam „%”', r.full_name;
  END LOOP;
END $$;

-- Speler wel in DB, geen membership voor actief seizoen
DO $$
DECLARE
  v_season uuid;
  r record;
BEGIN
  SELECT id INTO v_season
  FROM public.seasons
  WHERE is_active = true
  ORDER BY starts_on DESC
  LIMIT 1;

  FOR r IN
    SELECT p.full_name
    FROM public.players p
    WHERE p.full_name IN (
      'Jelisa De Jonge', 'Melissa Donkers', 'Yente Oud', 'Marisha Prins', 'Anouk Aafjes',
      'Tess Luijting', 'Lorelai Bakker', 'Kyra De Bakker', 'Renée Koopman', 'Mandy Kalmeijer',
      'Melissa Rietveld', 'Dionne van Dijk', 'Emma de Mie', 'Shura Nieboer', 'Nienke Hoffman',
      'Andrada Timmer', 'Danique van Heeringen', 'Demi Luijting', 'Mariska Oosterhuis',
      'Maura Hoffman', 'Isa Oosterhoorn'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM public.player_season_memberships m
        WHERE m.player_id = p.id
          AND m.season_id = v_season
      )
  LOOP
    RAISE NOTICE '011_player_shirts MISMATCH: geen player_season_membership voor „%” (seizoen %)', r.full_name, v_season;
  END LOOP;
END $$;

-- Overzicht na update (client/migratie-log)
SELECT
  p.full_name,
  m.shirt_number,
  m.position::text AS position,
  m.display_position
FROM public.player_season_memberships m
INNER JOIN public.players p ON p.id = m.player_id
WHERE m.season_id = (
  SELECT id
  FROM public.seasons
  WHERE is_active = true
  ORDER BY starts_on DESC
  LIMIT 1
)
  AND p.full_name IN (
    'Jelisa De Jonge', 'Melissa Donkers', 'Yente Oud', 'Marisha Prins', 'Anouk Aafjes',
    'Tess Luijting', 'Lorelai Bakker', 'Kyra De Bakker', 'Renée Koopman', 'Mandy Kalmeijer',
    'Melissa Rietveld', 'Dionne van Dijk', 'Emma de Mie', 'Shura Nieboer', 'Nienke Hoffman',
    'Andrada Timmer', 'Danique van Heeringen', 'Demi Luijting', 'Mariska Oosterhuis',
    'Maura Hoffman', 'Isa Oosterhoorn'
  )
ORDER BY m.shirt_number;
