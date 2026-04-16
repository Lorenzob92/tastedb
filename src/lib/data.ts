import { MediaEntry, Recommendation, MediaType, Tier, Status } from "./types";
import mediaData from "../../data/media.json";
import recommendationsData from "../../data/recommendations.json";

export function getAllMedia(): MediaEntry[] {
  return mediaData as MediaEntry[];
}

export function getRecommendations(): Recommendation[] {
  return recommendationsData as Recommendation[];
}

export function getMediaById(id: string): MediaEntry | undefined {
  return getAllMedia().find((entry) => entry.id === id);
}

export interface FilterOptions {
  type?: MediaType;
  tier?: Tier | null;
  status?: Status;
  genre?: string;
  search?: string;
}

export function filterMedia(
  entries: MediaEntry[],
  filters: FilterOptions
): MediaEntry[] {
  return entries.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false;

    if (filters.tier !== undefined) {
      if (entry.tier !== filters.tier) return false;
    }

    if (filters.status && entry.status !== filters.status) return false;

    if (filters.genre && !entry.genres.includes(filters.genre)) return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inTitle = entry.title.toLowerCase().includes(q);
      const inAuthor = entry.author.toLowerCase().includes(q);
      const inNotes = entry.notes.toLowerCase().includes(q);
      if (!inTitle && !inAuthor && !inNotes) return false;
    }

    return true;
  });
}

export function getUniqueGenres(entries: MediaEntry[]): string[] {
  const set = new Set<string>();
  for (const entry of entries) {
    for (const g of entry.genres) {
      set.add(g);
    }
  }
  return Array.from(set).sort();
}

export function getMediaTypes(entries: MediaEntry[]): MediaType[] {
  const set = new Set<MediaType>();
  for (const entry of entries) {
    set.add(entry.type);
  }
  return Array.from(set);
}

const TIER_ORDER: Array<Tier | "unrated"> = ["S", "A", "B", "C", "D", "unrated"];

export function groupByTier(
  entries: MediaEntry[]
): Record<Tier | "unrated", MediaEntry[]> {
  const buckets: Record<Tier | "unrated", MediaEntry[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    unrated: [],
  };

  for (const entry of entries) {
    const key = entry.tier ?? "unrated";
    buckets[key].push(entry);
  }

  return buckets;
}

export { TIER_ORDER };
