-- Public sharing: allow unauthenticated reads for shared tier lists
-- Run this in Supabase SQL editor after deployment.

-- Allow public read access to profiles (for username lookup)
create policy "Public can read profiles" on public.profiles
  for select using (true);

-- Allow public read access to media entries (for shared tier lists)
create policy "Public can read all entries" on public.media_entries
  for select using (true);
