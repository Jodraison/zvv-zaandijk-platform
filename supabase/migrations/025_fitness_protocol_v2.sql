-- Fitness Control Center 2.0 — vierdelig protocol (additief).
-- Legacy fitness_tests (sprint 20/40/60) blijft onaangeroerd.
-- GEEN DROP / TRUNCATE / DELETE / UPDATE op fitness_tests.

CREATE TABLE IF NOT EXISTS public.fitness_score_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  version int NOT NULL DEFAULT 1 CHECK (version >= 1),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.fitness_score_configs (id, code, label, version, config)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'four_part_v1',
  'Vier onderdelen v1',
  1,
  '{"components":["flying_sprint_30m","agility_10_20_10","plank","six_minute_run"],"weights":{"flying_sprint_30m":0.25,"agility_10_20_10":0.25,"plank":0.25,"six_minute_run":0.25},"directions":{"flying_sprint_30m":"lower_better","agility_10_20_10":"lower_better","plank":"higher_better","six_minute_run":"higher_better"}}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.fitness_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  test_on date NOT NULL,
  protocol_code text NOT NULL DEFAULT 'four_part_v1'
    CHECK (protocol_code IN ('four_part_v1')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  note text NULL,
  score_config_id uuid NULL REFERENCES public.fitness_score_configs (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NULL,
  created_by uuid NULL,
  published_by uuid NULL,
  CONSTRAINT fitness_test_sessions_unique_day UNIQUE (season_id, test_on, protocol_code)
);

CREATE INDEX IF NOT EXISTS fitness_test_sessions_season_id_idx
  ON public.fitness_test_sessions (season_id);
CREATE INDEX IF NOT EXISTS fitness_test_sessions_test_on_idx
  ON public.fitness_test_sessions (test_on DESC);
CREATE INDEX IF NOT EXISTS fitness_test_sessions_status_idx
  ON public.fitness_test_sessions (status);

CREATE TABLE IF NOT EXISTS public.fitness_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.fitness_test_sessions (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  flying_sprint_30m_seconds numeric(6,2) NULL
    CHECK (flying_sprint_30m_seconds IS NULL OR flying_sprint_30m_seconds > 0),
  agility_10_20_10_seconds numeric(6,2) NULL
    CHECK (agility_10_20_10_seconds IS NULL OR agility_10_20_10_seconds > 0),
  plank_seconds int NULL
    CHECK (plank_seconds IS NULL OR plank_seconds > 0),
  six_minute_run_meters int NULL
    CHECK (six_minute_run_meters IS NULL OR six_minute_run_meters > 0),
  participation_status text NOT NULL DEFAULT 'pending'
    CHECK (participation_status IN (
      'pending', 'partial', 'complete', 'absent', 'injured', 'not_tested', 'stopped', 'other'
    )),
  participation_reason text NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fitness_test_results_unique_player UNIQUE (session_id, player_id)
);

CREATE INDEX IF NOT EXISTS fitness_test_results_session_id_idx
  ON public.fitness_test_results (session_id);
CREATE INDEX IF NOT EXISTS fitness_test_results_player_id_idx
  ON public.fitness_test_results (player_id);

COMMENT ON TABLE public.fitness_test_sessions IS
  'Fitheidstestmomenten voor protocol four_part_v1 (concept/definitief). Los van legacy fitness_tests.';
COMMENT ON TABLE public.fitness_test_results IS
  'Vier losse meetwaarden per speelster; geen total_time. NULL = niet afgenomen.';

ALTER TABLE public.fitness_score_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fsc_select ON public.fitness_score_configs;
DROP POLICY IF EXISTS fsc_admin_write ON public.fitness_score_configs;
CREATE POLICY fsc_select ON public.fitness_score_configs FOR SELECT USING (true);
CREATE POLICY fsc_admin_write ON public.fitness_score_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS fts_select ON public.fitness_test_sessions;
DROP POLICY IF EXISTS fts_insert ON public.fitness_test_sessions;
DROP POLICY IF EXISTS fts_update ON public.fitness_test_sessions;
DROP POLICY IF EXISTS fts_delete ON public.fitness_test_sessions;
CREATE POLICY fts_select ON public.fitness_test_sessions FOR SELECT USING (true);
CREATE POLICY fts_insert ON public.fitness_test_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY fts_update ON public.fitness_test_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY fts_delete ON public.fitness_test_sessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ftr_select ON public.fitness_test_results;
DROP POLICY IF EXISTS ftr_insert ON public.fitness_test_results;
DROP POLICY IF EXISTS ftr_update ON public.fitness_test_results;
DROP POLICY IF EXISTS ftr_delete ON public.fitness_test_results;
CREATE POLICY ftr_select ON public.fitness_test_results FOR SELECT USING (true);
CREATE POLICY ftr_insert ON public.fitness_test_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY ftr_update ON public.fitness_test_results FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY ftr_delete ON public.fitness_test_results FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
