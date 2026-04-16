"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { MediaEntry, Recommendation, Tier, Status, MediaType } from "./types";
import {
  SmartRecommendation,
  generateRecommendations,
  clearRecsCache,
  ProgressCallback,
} from "./recommendations";
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
  ready: boolean;
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

  // Add new entries that aren't already in seed
  const seedIds = new Set(seed.map((e) => e.id));
  const newEntries = additions.filter((a) => !seedIds.has(a.id));

  return [...seed, ...newEntries];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, Partial<MediaEntry>>>({});
  const [additions, setAdditions] = useState<MediaEntry[]>([]);
  const [smartRecs, setSmartRecs] = useState<SmartRecommendation[]>([]);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recsProgress, setRecsProgress] = useState("");
  const [ready, setReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setOverrides(loadJSON<Record<string, Partial<MediaEntry>>>(OVERRIDES_KEY, {}));
    setAdditions(loadJSON<MediaEntry[]>(ADDITIONS_KEY, []));
    setReady(true);
  }, []);

  // Persist overrides
  useEffect(() => {
    if (ready) saveJSON(OVERRIDES_KEY, overrides);
  }, [overrides, ready]);

  // Persist additions
  useEffect(() => {
    if (ready) saveJSON(ADDITIONS_KEY, additions);
  }, [additions, ready]);

  const media = buildMedia(overrides, additions);

  const updateEntry = useCallback((id: string, updates: Partial<MediaEntry>) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...updates },
    }));
    // Also patch additions if the entry is there
    setAdditions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const addEntry = useCallback((entry: MediaEntry) => {
    setAdditions((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setAdditions((prev) => prev.filter((e) => e.id !== id));
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getEntry = useCallback(
    (id: string) => media.find((e) => e.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, additions]
  );

  const isInCollection = useCallback(
    (title: string) =>
      media.some((e) => e.title.toLowerCase() === title.toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, additions]
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
    [isGeneratingRecs, overrides, additions]
  );

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
    ready,
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
  // Check cache first
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
