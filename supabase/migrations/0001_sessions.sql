create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 60),
  category text not null check (char_length(category) <= 40),
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;
create policy "sessions_select_own" on public.sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions for insert with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions for delete using (auth.uid() = user_id);

create or replace function public.global_still_seconds()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(duration_seconds), 0)::bigint from public.sessions;
$$;

revoke all on function public.global_still_seconds() from public;
grant execute on function public.global_still_seconds() to anon, authenticated;
