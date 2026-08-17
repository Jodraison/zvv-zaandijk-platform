-- Football Operations final: scheduled training, lineup confirmation,
-- substitution slot metadata, position changes without substitution.

-- 1) Training status: allow scheduled (future / not yet registered)
ALTER TABLE public.training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_status_check;

ALTER TABLE public.training_sessions
  ADD CONSTRAINT training_sessions_status_check
  CHECK (status IN ('scheduled', 'completed', 'cancelled'));

ALTER TABLE public.training_sessions
  ALTER COLUMN status SET DEFAULT 'scheduled';

-- 2) Match lineup confirmation
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS lineup_status text NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_lineup_status_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_lineup_status_check
      CHECK (lineup_status IN ('draft', 'confirmed'));
  END IF;
END $$;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS lineup_confirmed_at timestamptz;

-- 3) Substitution metadata for historical reconstruction
ALTER TABLE public.match_substitutions
  ADD COLUMN IF NOT EXISTS to_slot text,
  ADD COLUMN IF NOT EXISTS stoppage_time int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_group_id uuid,
  ADD COLUMN IF NOT EXISTS notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_substitutions_stoppage_check'
  ) THEN
    ALTER TABLE public.match_substitutions
      ADD CONSTRAINT match_substitutions_stoppage_check
      CHECK (stoppage_time >= 0 AND stoppage_time <= 30);
  END IF;
END $$;

-- 4) Position changes without substitution
CREATE TABLE IF NOT EXISTS public.match_position_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE RESTRICT,
  minute int NOT NULL CHECK (minute >= 0 AND minute <= 130),
  stoppage_time int NOT NULL DEFAULT 0 CHECK (stoppage_time >= 0 AND stoppage_time <= 30),
  from_slot text NOT NULL,
  to_slot text NOT NULL,
  change_group_id uuid,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_position_changes_slots_distinct CHECK (from_slot <> to_slot)
);

CREATE INDEX IF NOT EXISTS match_position_changes_match_id_idx
  ON public.match_position_changes (match_id);
CREATE INDEX IF NOT EXISTS match_position_changes_player_id_idx
  ON public.match_position_changes (player_id);
CREATE INDEX IF NOT EXISTS match_position_changes_group_idx
  ON public.match_position_changes (change_group_id);

COMMENT ON TABLE public.match_position_changes IS
  'Tactische positiewijziging zonder wissel (oud slot → nieuw slot + minuut).';

ALTER TABLE public.match_position_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mpc_select ON public.match_position_changes;
DROP POLICY IF EXISTS mpc_insert ON public.match_position_changes;
DROP POLICY IF EXISTS mpc_update ON public.match_position_changes;
DROP POLICY IF EXISTS mpc_delete ON public.match_position_changes;

CREATE POLICY mpc_select ON public.match_position_changes
  FOR SELECT USING (true);

CREATE POLICY mpc_insert ON public.match_position_changes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mpc_update ON public.match_position_changes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY mpc_delete ON public.match_position_changes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
