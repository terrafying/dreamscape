create table if not exists public.shared_visions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  vision_id        text not null,
  vision_data      jsonb not null,
  title            text not null,
  distilled_intention text not null,
  symbols          text[] not null default '{}',
  themes           text[] not null default '{}',
  share_handle     text not null,
  board_image_url  text,
  created_at       timestamptz default now(),
  unique (user_id, vision_id)
);

alter table public.shared_visions enable row level security;

create policy "Anyone can read shared visions" on public.shared_visions for select using (true);
create policy "Users can insert own shared visions" on public.shared_visions for insert with check (auth.uid() = user_id);
create policy "Users can update own shared visions" on public.shared_visions for update using (auth.uid() = user_id);
create policy "Users can delete own shared visions" on public.shared_visions for delete using (auth.uid() = user_id);

create index if not exists shared_visions_symbols_idx on public.shared_visions using gin(symbols);
create index if not exists shared_visions_themes_idx on public.shared_visions using gin(themes);
create index if not exists shared_visions_user_id_idx on public.shared_visions(user_id);
create index if not exists shared_visions_created_at_idx on public.shared_visions(created_at desc);

create table if not exists public.vision_reactions (
  id            uuid primary key default gen_random_uuid(),
  vision_id     uuid not null references shared_visions(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  emoji         text not null check (emoji in ('🜂', '✨', '🜁')),
  created_at    timestamptz default now(),
  unique (vision_id, user_id, emoji)
);

alter table public.vision_reactions enable row level security;

create policy "Anyone can read vision reactions" on public.vision_reactions for select using (true);
create policy "Users can react to visions" on public.vision_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove own vision reactions" on public.vision_reactions for delete using (auth.uid() = user_id);

create index if not exists vision_reactions_vision_idx on public.vision_reactions(vision_id);
create index if not exists vision_reactions_user_idx on public.vision_reactions(user_id);
