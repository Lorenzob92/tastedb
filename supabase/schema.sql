-- tastedb: Multi-user media tracker schema
-- Run this in your Supabase SQL editor after creating the project.

-- User profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  created_at timestamptz default now()
);

-- Media entries (per user)
create table public.media_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  slug text not null,
  title text not null,
  type text not null check (type in ('manga', 'anime', 'movie', 'game')),
  tier text check (tier in ('S', 'A', 'B', 'C', 'D')),
  status text not null default 'planned' check (status in ('completed', 'reading', 'paused', 'dropped', 'planned')),
  notes text default '',
  cover_url text default '',
  author text default '',
  genres text[] default '{}',
  year integer default 0,
  description text default '',
  source text default 'manual',
  source_id text default '',
  nyaa_category text default '',
  also_anime boolean default false,
  anime_tier text,
  manga_tier text,
  manual_fix boolean default false,
  added_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, slug)
);

-- Row Level Security
alter table public.media_entries enable row level security;
alter table public.profiles enable row level security;

-- Policies: users can only access their own data
create policy "Users can read own entries" on public.media_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on public.media_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on public.media_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on public.media_entries
  for delete using (auth.uid() = user_id);

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
