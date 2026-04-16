"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { MediaEntry, Recommendation, MediaType } from "./types";
import {
  SmartRecommendation,
  generateRecommendations,
} from "./recommendations";
import { createClient, isSupabaseConfigured } from "./supabase";
import { fromDbRow, seedCollection } from "./seed";
import { useAuth } from "./auth-context";
import seedMedia from "../../data/media.json";
import seedRecs from "../../data/recommendations.json";

interface StoreContextType {
  media: MediaEntry[];
  recommendations: Recommendation[];
  smartRecs: SmartRecommendation[];
  isGeneratingRecs: boolean;
  recsProgress: string;
  refreshRecommendations: (forceRefresh?: boolean) => Promise<void>;
  updateEntry: (id: string, updates: Partial<MediaEntry>) => void;
  addEntry: (entry: MediaEntry) => void;
  removeEntry: (id: string) => void;
  getEntry: (id: string) => MediaEntry | undefined;
  addToWishlist: (rec: Recommendation) => void;
  addSmartToWishlist: (rec: SmartRecommendation) => void;
  startReading: (id: string) => void;
  isInCollection: (title: string) => boolean;
  importSeedData: () => Promise<number>;
  ready: boolean;
  isCloud: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

const OVERRIDES_KEY = "tastedb-overrides";
const ADDITIONS_KEY = "tastedb-additions";
const DESC_CACHE_KEY = "tastedb-descriptions";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

function buildMedia(
  overrides: Record<string, Partial<MediaEntry>>,
  additions: MediaEntry[]
): MediaEntry[] {
  const seed = (seedMedia as MediaEntry[]).map((entry) => {
    const patch = overrides[entry.id];
    return patch ? { ...entry, ...patch } : entry;
  });

  const seedIds = new Set(seed.map((e) => e.id));
  const newEntries = additions.filter((a) => !seedIds.has(a.id));

  return [...seed, ...newEntries];
}

/**
 * Convert a MediaEntry to a Supabase row for upsert.
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
    updated_at: new Date().toISOString(),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const isCloud = isConfigured && !!user;

  // Local state (used for both guest mode and as cache for cloud mode)
  const [overrides, setOverrides] = useState<Record<string, Partial<MediaEntry>>>({});
  const [additions, setAdditions] = useState<MediaEntry[]>([]);
  const [cloudMedia, setCloudMedia] = useState<MediaEntry[]>([]);
  const [smartRecs, setSmartRecs] = useState<SmartRecommendation[]>([]);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recsProgress, setRecsProgress] = useState("");
  const [ready, setReady] = useState(false);

  // Track if we've loaded cloud data
  const cloudLoaded = useRef(false);

  // Load from localStorage (guest mode) or Supabase (cloud mode)
  useEffect(() => {
    if (authLoading) return;

    if (isCloud) {
      // Cloud mode: load from Supabase
      const supabase = createClient();
      if (!supabase || !user) return;

      supabase
        .from("media_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            const entries = data.map((row) => fromDbRow(row as Record<string, unknown>));
            setCloudMedia(entries);
          }
          cloudLoaded.current = true;
          setReady(true);
        });
    } else {
      // Guest mode: load from localStorage
      setOverrides(loadJSON<Record<string, Partial<MediaEntry>>>(OVERRIDES_KEY, {}));
      setAdditions(loadJSON<MediaEntry[]>(ADDITIONS_KEY, []));
      setReady(true);
    }
  }, [authLoading, isCloud, user]);

  // Persist overrides (guest mode only)
  useEffect(() => {
    if (ready && !isCloud) saveJSON(OVERRIDES_KEY, overrides);
  }, [overrides, ready, isCloud]);

  // Persist additions (guest mode only)
  useEffect(() => {
    if (ready && !isCloud) saveJSON(ADDITIONS_KEY, additions);
  }, [additions, ready, isCloud]);

  // Build the media list based on mode
  const media = isCloud ? cloudMedia : buildMedia(overrides, additions);

  const updateEntry = useCallback(
    (id: string, updates: Partial<MediaEntry>) => {
      if (isCloud) {
        // Cloud mode: update in Supabase, then update local cache
        const supabase = createClient();
        if (!supabase || !user) return;

        // Build partial DB row from updates
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
        if (updates.author !== undefined) dbUpdates.author = updates.author;
        if (updates.genres !== undefined) dbUpdates.genres = updates.genres;
        if (updates.year !== undefined) dbUpdates.year = updates.year;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.alsoAnime !== undefined) dbUpdates.also_anime = updates.alsoAnime;
        if (updates.animeTier !== undefined) dbUpdates.anime_tier = updates.animeTier;
        if (updates.mangaTier !== undefined) dbUpdates.manga_tier = updates.mangaTier;

        supabase
          .from("media_entries")
          .update(dbUpdates)
          .eq("user_id", user.id)
          .eq("slug", id)
          .then(() => {
            // Update local cache
            setCloudMedia((prev) =>
              prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
            );
          });
      } else {
        // Guest mode: same as before
        setOverrides((prev) => ({
          ...prev,
          [id]: { ...(prev[id] ?? {}), ...updates },
        }));
        setAdditions((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
        );
      }
    },
    [isCloud, user]
  );

  const addEntry = useCallback(
    (entry: MediaEntry) => {
      if (isCloud) {
        const supabase = createClient();
        if (!supabase || !user) return;

        const row = toDbRow(entry, user.id);
        supabase
          .from("media_entries")
          .upsert(row, { onConflict: "user_id,slug" })
          .then(() => {
            setCloudMedia((prev) => {
              if (prev.some((e) => e.id === entry.id)) return prev;
              return [entry, ...prev];
            });
          });
      } else {
        setAdditions((prev) => {
          if (prev.some((e) => e.id === entry.id)) return prev;
          return [...prev, entry];
        });
      }
    },
    [isCloud, user]
  );

  const removeEntry = useCallback(
    (id: string) => {
      if (isCloud) {
        const supabase = createClient();
        if (!supabase || !user) return;

        supabase
          .from("media_entries")
          .delete()
          .eq("user_id", user.id)
          .eq("slug", id)
          .then(() => {
            setCloudMedia((prev) => prev.filter((e) => e.id !== id));
          });
      } else {
        setAdditions((prev) => prev.filter((e) => e.id !== id));
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [isCloud, user]
  );

  const getEntry = useCallback(
    (id: string) => media.find((e) => e.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCloud, cloudMedia, overrides, additions]
  );

  const isInCollection = useCallback(
    (title: string) =>
      media.some((e) => e.title.toLowerCase() === title.toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCloud, cloudMedia, overrides, additions]
  );

  const addToWishlist = useCallback(
    (rec: Recommendation) => {
      const slug = rec.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const id = `${slug}-${rec.type}`;
      const entry: MediaEntry = {
        id,
        title: rec.title,
        type: rec.type,
        tier: null,
        status: "planned",
        notes: "",
        coverUrl: rec.coverUrl ?? "",
        author: "",
        genres: [],
        year: 0,
        source: "",
        sourceId: "",
        nyaaCategory: rec.type === "manga" ? "3_0" : rec.type === "anime" ? "1_0" : "",
        addedAt: new Date().toISOString(),
        description: "",
      };
      addEntry(entry);
    },
    [addEntry]
  );

  const startReading = useCallback(
    (id: string) => {
      updateEntry(id, { status: "reading" });
    },
    [updateEntry]
  );

  const addSmartToWishlist = useCallback(
    (rec: SmartRecommendation) => {
      const slug = rec.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const id = `${slug}-${rec.type}`;
      const entry: MediaEntry = {
        id,
        title: rec.titleEnglish ?? rec.title,
        type: rec.type,
        tier: null,
        status: "planned",
        notes: rec.reasons.join("; "),
        coverUrl: rec.coverUrl ?? "",
        author: rec.author ?? "",
        genres: rec.genres ?? [],
        year: rec.year ?? 0,
        source: "anilist",
        sourceId: String(rec.id),
        nyaaCategory: rec.type === "manga" ? "3_0" : rec.type === "anime" ? "1_0" : "",
        addedAt: new Date().toISOString(),
        description: rec.description ?? "",
      };
      addEntry(entry);
    },
    [addEntry]
  );

  const refreshRecommendations = useCallback(
    async (forceRefresh = false) => {
      if (isGeneratingRecs) return;
      setIsGeneratingRecs(true);
      setRecsProgress("Starting...");
      try {
        const results = await generateRecommendations(
          media,
          50,
          (msg) => setRecsProgress(msg),
          forceRefresh
        );
        setSmartRecs(results);
      } catch {
        setRecsProgress("Something went wrong. Try again later.");
      } finally {
        setIsGeneratingRecs(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isGeneratingRecs, isCloud, cloudMedia, overrides, additions]
  );

  const importSeedData = useCallback(async () => {
    if (!isCloud || !user) return 0;
    try {
      const count = await seedCollection(user.id);
      // Reload from Supabase after import
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from("media_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });
        if (data) {
          setCloudMedia(data.map((row) => fromDbRow(row as Record<string, unknown>)));
        }
      }
      return count;
    } catch {
      return 0;
    }
  }, [isCloud, user]);

  const value: StoreContextType = {
    media,
    recommendations: seedRecs as Recommendation[],
    smartRecs,
    isGeneratingRecs,
    recsProgress,
    refreshRecommendations,
    updateEntry,
    addEntry,
    removeEntry,
    getEntry,
    addToWishlist,
    addSmartToWishlist,
    startReading,
    isInCollection,
    importSeedData,
    ready,
    isCloud,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}

// Helper to fetch and cache AniList descriptions
export async function fetchAniListDescription(
  title: string,
  type: MediaType
): Promise<string | null> {
  const cache = loadJSON<Record<string, string>>(DESC_CACHE_KEY, {});
  const cacheKey = `${title}-${type}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const query = `
      query ($search: String, $type: MediaType) {
        Media(search: $search, type: $type) {
          description(asHtml: false)
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          search: title,
          type: type === "manga" ? "MANGA" : "ANIME",
        },
      }),
    });
    const data = await res.json();
    const desc = data?.data?.Media?.description;
    if (desc) {
      cache[cacheKey] = desc;
      saveJSON(DESC_CACHE_KEY, cache);
      return desc;
    }
    return null;
  } catch {
    return null;
  }
}

// AniList search helper
export interface AniListSearchResult {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string };
  genres: string[];
  startDate: { year: number | null };
  description: string | null;
  staff: {
    edges: Array<{ node: { name: { full: string } }; role: string }>;
  };
}

export async function searchAniList(
  search: string,
  type: "MANGA" | "ANIME"
): Promise<AniListSearchResult[]> {
  const query = `
    query ($search: String, $type: MediaType) {
      Page(perPage: 10) {
        media(search: $search, type: $type) {
          id
          title { romaji english }
          coverImage { large }
          genres
          startDate { year }
          description(asHtml: false)
          staff(perPage: 3) { edges { node { name { full } } role } }
        }
      }
    }
  `;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search, type } }),
    });
    const data = await res.json();
    return data?.data?.Page?.media ?? [];
  } catch {
    return [];
  }
}
