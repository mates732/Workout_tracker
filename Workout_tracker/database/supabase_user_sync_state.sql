create table if not exists public.user_sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings_json jsonb,
  tracker_json jsonb,
  user_data_json jsonb,
  workouts_json jsonb,
  sets_json jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_sync_state enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_sync_state'
      and policyname = 'user_sync_state_select_own'
  ) then
    create policy user_sync_state_select_own
      on public.user_sync_state
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_sync_state'
      and policyname = 'user_sync_state_insert_own'
  ) then
    create policy user_sync_state_insert_own
      on public.user_sync_state
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_sync_state'
      and policyname = 'user_sync_state_update_own'
  ) then
    create policy user_sync_state_update_own
      on public.user_sync_state
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
