-- Doelpunt-rijen voor wedstrijd (round-trip bewerken met assists)
-- Gast-speelsters per seizoen

alter table public.player_season_memberships
  add column if not exists is_guest boolean not null default false;

create table if not exists public.match_goal_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  scorer_player_id uuid not null references public.players (id) on delete cascade,
  assist_player_id uuid references public.players (id) on delete set null,
  sort_order int not null default 0
);

create index if not exists match_goal_events_match_id_idx on public.match_goal_events (match_id);

alter table public.match_goal_events enable row level security;

drop policy if exists "match_goal_events_all" on public.match_goal_events;
create policy "match_goal_events_all" on public.match_goal_events for all using (true) with check (true);
