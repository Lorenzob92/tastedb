import { createClient } from "./supabase";
import type { MediaEntry } from "./types";
import seedMedia from "../../data/media.json";

/**
 * Convert a MediaEntry from the local format to the Supabase row format.
 */
function toDbRow(entry: MediaEntry, userId: string) {
  return {
    user_id: userId,
    slug: entry.id,
    title: entry.title,
    type: entry.type,
    tier: entry.tier ?? null,
    status: entry.status,
    notes: entry.notes || "",
    cover_url: entry.coverUrl || "",
    author: entry.author || "",
    genres: entry.genres || [],
    year: entry.year || 0,
    description: entry.description || "",
    source: entry.source || "manual",
    source_id: entry.sourceId || "",
    nyaa_category: entry.nyaaCategory || "",
    also_anime: entry.alsoAnime ?? false,
    anime_tier: entry.animeTier ?? null,
    manga_tier: entry.mangaTier ?? null,
    manual_fix: false,
    added_at: entry.addedAt || new Date().toISOString(),
  };
}

/**
 * Import the demo seed data into a user's Supabase collection.
 * Skips entries that already exist (based on unique user_id + slug).
 * Returns the number of entries imported.
 */
export async function seedCollection(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;

  const entries = (seedMedia as MediaEntry[]).map((e) => toDbRow(e, userId));

  // Insert in batches of 50 to avoid payload limits
  let imported = 0;
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    const { data, error } = await supabase
      .from("media_entries")
      .upsert(batch, { onConflict: "user_id,slug", ignoreDuplicates: true })
      .select("id");

    if (!error && data) {
      imported += data.length;
    }
  }

  return imported;
}

/**
 * Convert a Supabase row back to a local MediaEntry.
 */
export function fromDbRow(row: Record<string, unknown>): MediaEntry {
  return {
    id: row.slug as string,
    title: row.title as string,
    type: row.type as MediaEntry["type"],
    tier: (row.tier as MediaEntry["tier"]) ?? null,
    status: (row.status as MediaEntry["status"]) || "planned",
    notes: (row.notes as string) || "",
    coverUrl: (row.cover_url as string) || "",
    author: (row.author as string) || "",
    genres: (row.genres as string[]) || [],
    year: (row.year as number) || 0,
    description: (row.description as string) || "",
    source: (row.source as string) || "manual",
    sourceId: (row.source_id as string) || "",
    nyaaCategory: (row.nyaa_category as string) || "",
    addedAt: (row.added_at as string) || new Date().toISOString(),
    alsoAnime: (row.also_anime as boolean) ?? false,
    animeTier: (row.anime_tier as MediaEntry["tier"]) ?? null,
    mangaTier: (row.manga_tier as MediaEntry["tier"]) ?? null,
  };
}
