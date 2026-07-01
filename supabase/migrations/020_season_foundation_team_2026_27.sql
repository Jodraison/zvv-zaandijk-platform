-- Phase 2 — Season Foundation (Stap 4)
-- Werkt seizoensgebonden teammetadata bij voor 2026/27.
-- Staf heeft geen opslag in dit schema; geen wijzigingen aan 2025/26 of is_active.

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
-- is_active wordt niet aangeraakt (beheer via Stap 1 / season:foundation).
