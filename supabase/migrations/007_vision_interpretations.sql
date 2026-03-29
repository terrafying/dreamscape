create table if not exists public.vision_interpretations (
  id         uuid primary key default gen_random_uuid(),
  vision_id  uuid not null references public.shared_visions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  handle     text not null,
  text       text not null check (char_length(text) > 0 and char_length(text) <= 500),
  created_at timestamptz default now()
);

alter table public.vision_interpretations enable row level security;

create policy "Anyone can read vision interpretations" on public.vision_interpretations for select using (true);
create policy "Users can interpret visions" on public.vision_interpretations for insert with check (auth.uid() = user_id);
create policy "Users can delete own vision interpretations" on public.vision_interpretations for delete using (auth.uid() = user_id);

create index if not exists vision_interpretations_vision_idx on public.vision_interpretations(vision_id);
create index if not exists vision_interpretations_created_idx on public.vision_interpretations(created_at desc);
