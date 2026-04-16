import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./supabase";

/**
 * Create a Supabase client for public (unauthenticated) server-side reads.
 * Does not require cookies or an active session.
 * Returns null if Supabase is not configured.
 */
export function createPublicServerClient() {
  if (!isSupabaseConfigured()) return null;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op: public client does not manage sessions
        },
      },
    }
  );
}
