import { createBrowserClient } from "@supabase/ssr";

/**
 * Whether Supabase is configured with real credentials.
 * When false, the app falls back to localStorage (guest mode).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !!url &&
    !!key &&
    !url.includes("your-project") &&
    !key.includes("your-anon-key")
  );
}

/**
 * Create a Supabase client for browser (client component) usage.
 * Returns null if Supabase is not configured.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
