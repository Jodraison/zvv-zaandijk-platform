-- Phase 2 — Season Foundation (Stap 3)
-- Selectie 2026/27: clone van 2025/26 minus vertrekkers; nieuwe speelsters als concept.
-- Geen DELETE op players of 2025/26-data.

-- Nieuwe speelsters (concept — membership pas na bevestigde rugnummers/posities)
INSERT INTO public.players (id, full_name, photo_url, is_guest, role_label, card_note)
VALUES
  (
    'f1000002-0000-4000-8000-000000000001',
    'Evy',
    NULL,
    false,
    'Keeper',
    'Rugnummer seizoen 2026/27: nog te bepalen. Lidmaatschap volgt na bevestiging rugnummer.'
  ),
  (
    'f1000002-0000-4000-8000-000000000002',
    'Naomi',
    NULL,
    false,
    NULL,
    'Positie en rugnummer seizoen 2026/27: nog te bepalen. Lidmaatschap volgt na bevestiging.'
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_label = EXCLUDED.role_label,
  card_note = EXCLUDED.card_note;

-- Clone 2025/26 → 2026/27 (zelfde shirt + positie; geen aanvoerdersvlaggen)
INSERT INTO public.player_season_memberships (
  id,
  player_id,
  season_id,
  shirt_number,
  position,
  display_position,
  is_captain,
  is_vice_captain,
  is_guest
)
SELECT
  gen_random_uuid(),
  m.player_id,
  'c0ffee00-0002-4000-8000-000000000001'::uuid,
  m.shirt_number,
  m.position,
  m.display_position,
  false,
  false,
  false
FROM public.player_season_memberships m
INNER JOIN public.players p ON p.id = m.player_id
WHERE m.season_id = 'c0ffee00-0001-4000-8000-000000000001'::uuid
  AND m.is_guest = false
  AND p.full_name NOT IN ('Yente Oud')
  AND p.full_name NOT ILIKE '%Isabel%'
ON CONFLICT (player_id, season_id) DO UPDATE SET
  shirt_number = EXCLUDED.shirt_number,
  position = EXCLUDED.position,
  display_position = EXCLUDED.display_position,
  is_captain = false,
  is_vice_captain = false,
  is_guest = false;
