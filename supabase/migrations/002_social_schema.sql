-- Social features: profiles, shared dreams, follows, reactions, interpretations

-- User profiles (separate from auth.users)
create table if not exists public.user_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  handle        text not null unique,
  avatar_seed   text,
  sun_sign      text,
  moon_sign     text,
  rising_sign   text,
  created_at    timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Anyone can read profiles" on public.user_profiles for select using (true);
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = user_id);

create index if not exists user_profiles_handle_idx on public.user_profiles(handle);
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, handle, avatar_seed)
  values (
    new.id,
    coalesce(
      split_part(new.email, '@', 1),
      'dreamer_' || substr(new.id::text, 1, 6)
    ),
    gen_random_uuid()::text
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared dreams
create table if not exists public.shared_dreams (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  dream_id      text not null,
  dream_data    jsonb not null,
  symbols       text[] not null default '{}',
  themes        text[] not null default '{}',
  emotions      text[] not null default '{}',
  share_handle  text not null,
  created_at    timestamptz default now(),
  unique (user_id, dream_id)
);

alter table public.shared_dreams enable row level security;

create policy "Anyone can read shared dreams" on public.shared_dreams for select using (true);
create policy "Users can insert own shared dreams" on public.shared_dreams for insert with check (auth.uid() = user_id);
create policy "Users can delete own shared dreams" on public.shared_dreams for delete using (auth.uid() = user_id);

create index if not exists shared_dreams_symbols_idx on public.shared_dreams using gin(symbols);
create index if not exists shared_dreams_themes_idx on public.shared_dreams using gin(themes);
create index if not exists shared_dreams_user_id_idx on public.shared_dreams(user_id);
create index if not exists shared_dreams_created_at_idx on public.shared_dreams(created_at desc);

-- Follows
create table if not exists public.follows (
  follower_id   uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Anyone can read follows" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

-- Dream reactions
create table if not exists public.dream_reactions (
  id            uuid primary key default gen_random_uuid(),
  dream_id      uuid not null references shared_dreams(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  emoji         text not null check (emoji in ('💭', '🔮', '💜')),
  created_at    timestamptz default now(),
  unique (dream_id, user_id, emoji)
);

alter table public.dream_reactions enable row level security;

create policy "Anyone can read reactions" on public.dream_reactions for select using (true);
create policy "Users can react" on public.dream_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove own reactions" on public.dream_reactions for delete using (auth.uid() = user_id);

create index if not exists dream_reactions_dream_idx on public.dream_reactions(dream_id);
create index if not exists dream_reactions_user_idx on public.dream_reactions(user_id);

-- Dream interpretations (text comments)
create table if not exists public.dream_interpretations (
  id            uuid primary key default gen_random_uuid(),
  dream_id      uuid not null references shared_dreams(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  handle        text not null,
  text          text not null check (char_length(text) <= 500),
  created_at    timestamptz default now()
);

alter table public.dream_interpretations enable row level security;

create policy "Anyone can read interpretations" on public.dream_interpretations for select using (true);
create policy "Users can interpret" on public.dream_interpretations for insert with check (auth.uid() = user_id);
create policy "Users can delete own interpretations" on public.dream_interpretations for delete using (auth.uid() = user_id);

create index if not exists dream_interpretations_dream_idx on public.dream_interpretations(dream_id);
create index if not exists dream_interpretations_created_idx on public.dream_interpretations(created_at);
