-- Cloud sync: per-user dream storage with RLS isolation
-- Run this in your Supabase SQL Editor or via supabase db push

create table if not exists public.user_dreams (
  id          uuid    default gen_random_uuid() primary key,
  user_id     uuid    not null references auth.users(id) on delete cascade,
  dream_id    text    not null,
  dream_data  jsonb   not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, dream_id)
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_dreams_updated_at
  before update on public.user_dreams
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.user_dreams enable row level security;

create policy "Users can read their own dreams"
  on public.user_dreams for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dreams"
  on public.user_dreams for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own dreams"
  on public.user_dreams for update
  using (auth.uid() = user_id);

create policy "Users can delete their own dreams"
  on public.user_dreams for delete
  using (auth.uid() = user_id);

-- Index for fast user lookups
create index if not exists user_dreams_user_id_idx on public.user_dreams(user_id);
