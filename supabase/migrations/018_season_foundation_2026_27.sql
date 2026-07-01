-- Phase 2 — Season Foundation (Stap 1)
-- Maakt seizoen 2026/27 aan (of werkt bij), archiveert 2025/26 via is_active=false,
-- en stelt 2026/27 in als enige actieve seizoen.
-- Geen wijzigingen aan spelers, memberships, wedstrijden of andere seizoengebonden data.

INSERT INTO public.seasons (id, name, starts_on, ends_on, is_active)
VALUES (
  'c0ffee00-0002-4000-8000-000000000001',
  '2026/27 Competitie',
  '2026-08-01',
  '2027-06-30',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  starts_on = EXCLUDED.starts_on,
  ends_on = EXCLUDED.ends_on;

-- Archiveer alle seizoenen (inclusief 2025/26).
UPDATE public.seasons
SET is_active = false
WHERE id <> 'c0ffee00-0002-4000-8000-000000000001';

-- Activeer 2026/27.
UPDATE public.seasons
SET is_active = true
WHERE id = 'c0ffee00-0002-4000-8000-000000000001';
