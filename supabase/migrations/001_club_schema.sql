-- ZVV platform — run in Supabase SQL editor or via CLI.
-- Pas RLS aan voor productie (nu: open voor anon om server actions te laten werken).

create table if not exists public.club_profile (
  id text primary key default 'default',
  team_photo_url text
);

insert into public.club_profile (id, team_photo_url)
values ('default', null)
on conflict (id) do nothing;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text
);

create table if not exists public.player_season_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  shirt_number int not null,
  position text not null check (position in ('GK', 'DEF', 'MID', 'ATT')),
  is_captain boolean not null default false,
  is_vice_captain boolean not null default false,
  unique (player_id, season_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  opponent text not null,
  kickoff_at timestamptz not null,
  is_home boolean not null,
  goals_for int not null default 0,
  goals_against int not null default 0,
  status text not null check (status in ('scheduled', 'played', 'postponed', 'cancelled')),
  wotm_player_id uuid references public.players (id) on delete set null
);

create table if not exists public.match_player_stats (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  goals int not null default 0,
  assists int not null default 0,
  primary key (match_id, player_id)
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  title text,
  session_at timestamptz not null,
  location text
);

create table if not exists public.training_attendance (
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  present boolean not null,
  note text,
  primary key (session_id, player_id)
);

create table if not exists public.fitness_tests (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  test_type text not null check (test_type in ('sprint_20m', 'sprint_30m', 'custom')),
  time_seconds numeric not null,
  recorded_at timestamptz not null,
  note text
);

-- RLS: tijdelijk volledig open voor anon (strak afdichten met auth + policies in productie).
alter table public.club_profile enable row level security;
alter table public.seasons enable row level security;
alter table public.players enable row level security;
alter table public.player_season_memberships enable row level security;
alter table public.matches enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_attendance enable row level security;
alter table public.fitness_tests enable row level security;

create policy "club_profile_all" on public.club_profile for all using (true) with check (true);
create policy "seasons_all" on public.seasons for all using (true) with check (true);
create policy "players_all" on public.players for all using (true) with check (true);
create policy "memberships_all" on public.player_season_memberships for all using (true) with check (true);
create policy "matches_all" on public.matches for all using (true) with check (true);
create policy "match_stats_all" on public.match_player_stats for all using (true) with check (true);
create policy "training_sessions_all" on public.training_sessions for all using (true) with check (true);
create policy "training_attendance_all" on public.training_attendance for all using (true) with check (true);
create policy "fitness_tests_all" on public.fitness_tests for all using (true) with check (true);
