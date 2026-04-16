import { MediaEntry, MediaType, Tier } from "./types";

export interface SmartRecommendation {
  id: number;
  title: string;
  titleEnglish: string | null;
  type: "manga" | "anime";
  coverUrl: string;
  genres: string[];
  year: number;
  description: string;
  author: string;
  averageScore: number;
  popularity: number;
  // Recommendation metadata
  matchScore: number;
  reasons: string[];
  source: "community" | "genre" | "author";
  sourceTitle?: string;
}

// --- AniList helpers ---

const ANILIST_URL = "https://graphql.anilist.co";
const RATE_LIMIT_DELAY = 700; // ms between requests
const CACHE_KEY = "tastedb-recs-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const TIER_WEIGHT: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function anilistQuery(query: string, variables: Record<string, unknown>) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    // Rate limited, wait and retry once
    await sleep(2000);
    const retry = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return retry.json();
  }
  return res.json();
}

// --- Queries ---

const COMMUNITY_RECS_QUERY = `
query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type) {
    recommendations(perPage: 10, sort: RATING_DESC) {
      nodes {
        rating
        mediaRecommendation {
          id
          title { romaji english }
          coverImage { large }
          genres
          startDate { year }
          description(asHtml: false)
          averageScore
          popularity
          staff(perPage: 3) { edges { node { name { full } } role } }
        }
      }
    }
  }
}
`;

const GENRE_SEARCH_QUERY = `
query ($genre: String, $type: MediaType) {
  Page(perPage: 20) {
    media(genre: $genre, type: $type, sort: SCORE_DESC, averageScore_greater: 75) {
      id
      title { romaji english }
      coverImage { large }
      genres
      startDate { year }
      description(asHtml: false)
      averageScore
      popularity
      staff(perPage: 3) { edges { node { name { full } } role } }
    }
  }
}
`;

// --- Taste profile ---

interface TasteProfile {
  genreScores: Record<string, number>;
  topGenres: string[];
  topAuthors: string[];
  preferredDecades: number[];
}

function buildTasteProfile(collection: MediaEntry[]): TasteProfile {
  const genreScores: Record<string, number> = {};
  const authorCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};

  for (const entry of collection) {
    if (!entry.tier) continue;
    const weight = TIER_WEIGHT[entry.tier];

    for (const genre of entry.genres) {
      genreScores[genre] = (genreScores[genre] ?? 0) + weight;
    }

    if (entry.author) {
      authorCounts[entry.author] = (authorCounts[entry.author] ?? 0) + weight;
    }

    if (entry.year) {
      const decade = Math.floor(entry.year / 10) * 10;
      decadeCounts[String(decade)] = (decadeCounts[String(decade)] ?? 0) + weight;
    }
  }

  const topGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([g]) => g);

  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([a]) => a);

  const preferredDecades = Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => Number(d));

  return { genreScores, topGenres, topAuthors, preferredDecades };
}

// --- Helpers ---

function extractAuthor(
  staff: { edges: Array<{ node: { name: { full: string } }; role: string }> } | undefined
): string {
  if (!staff?.edges?.length) return "";
  // Prefer "Story" or "Original Creator" roles
  const creator = staff.edges.find(
    (e) =>
      e.role.toLowerCase().includes("story") ||
      e.role.toLowerCase().includes("original creator") ||
      e.role.toLowerCase().includes("original")
  );
  return creator?.node.name.full ?? staff.edges[0]?.node.name.full ?? "";
}

function cleanDescription(desc: string | null): string {
  if (!desc) return "";
  return desc.replace(/<[^>]*>/g, "").replace(/\n{2,}/g, "\n").trim();
}

function toMediaType(type: MediaType): "MANGA" | "ANIME" {
  return type === "manga" ? "MANGA" : "ANIME";
}

// --- Cache ---

interface CachedRecs {
  timestamp: number;
  recs: SmartRecommendation[];
}

function loadCache(suffix = ""): CachedRecs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY + suffix);
    if (!raw) return null;
    return JSON.parse(raw) as CachedRecs;
  } catch {
    return null;
  }
}

function saveCache(recs: SmartRecommendation[], suffix = "") {
  try {
    localStorage.setItem(
      CACHE_KEY + suffix,
      JSON.stringify({ timestamp: Date.now(), recs } as CachedRecs)
    );
  } catch {
    // localStorage full
  }
}

export function clearRecsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // noop
  }
}

// --- Main engine ---

export type ProgressCallback = (message: string) => void;

export async function generateRecommendations(
  collection: MediaEntry[],
  maxResults = 50,
  onProgress?: ProgressCallback,
  forceRefresh = false,
  mediaTypeFilter?: "manga" | "anime"
): Promise<SmartRecommendation[]> {
  // Check cache (keyed by type filter)
  const cacheKeySuffix = mediaTypeFilter ? `-${mediaTypeFilter}` : "";
  if (!forceRefresh) {
    const cached = loadCache(cacheKeySuffix);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      onProgress?.("Loaded from cache");
      return cached.recs;
    }
  }

  const collectionTitles = new Set(
    collection.map((e) => e.title.toLowerCase())
  );
  const collectionIds = new Set(
    collection.filter((e) => e.sourceId).map((e) => Number(e.sourceId))
  );

  const allRecs = new Map<number, SmartRecommendation>();

  // Filter collection by type if specified
  const filteredCollection = mediaTypeFilter
    ? collection.filter((e) => e.type === mediaTypeFilter)
    : collection;

  // Build taste profile from filtered collection
  onProgress?.(`Building your ${mediaTypeFilter || "full"} taste profile...`);
  const profile = buildTasteProfile(filteredCollection);

  // 1. Community recommendations from S, A, and B tier entries with sourceId
  const topEntries = filteredCollection
    .filter(
      (e) =>
        (e.tier === "S" || e.tier === "A" || e.tier === "B") &&
        e.sourceId &&
        (e.type === "manga" || e.type === "anime")
    )
    .sort((a, b) => {
      const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
      return (tierOrder[a.tier!] ?? 99) - (tierOrder[b.tier!] ?? 99);
    });

  onProgress?.(`Fetching community recs for ${topEntries.length} top-tier titles...`);

  for (let i = 0; i < topEntries.length; i++) {
    const entry = topEntries[i];
    onProgress?.(
      `Analysing ${entry.title} (${i + 1}/${topEntries.length})...`
    );

    try {
      const data = await anilistQuery(COMMUNITY_RECS_QUERY, {
        id: Number(entry.sourceId),
        type: toMediaType(entry.type),
      });

      const nodes = data?.data?.Media?.recommendations?.nodes ?? [];

      for (const node of nodes) {
        const rec = node.mediaRecommendation;
        if (!rec) continue;

        const title = rec.title.english ?? rec.title.romaji;
        if (collectionTitles.has(title.toLowerCase())) continue;
        if (collectionIds.has(rec.id)) continue;
        if (allRecs.has(rec.id)) {
          // Already seen, add extra reason
          const existing = allRecs.get(rec.id)!;
          const reason = `Recommended from ${entry.title} (${entry.tier} tier)`;
          if (!existing.reasons.includes(reason)) {
            existing.reasons.push(reason);
            existing.matchScore += 5; // bonus for multiple sources
          }
          continue;
        }

        const author = extractAuthor(rec.staff);

        allRecs.set(rec.id, {
          id: rec.id,
          title: rec.title.romaji,
          titleEnglish: rec.title.english,
          type: entry.type as "manga" | "anime",
          coverUrl: rec.coverImage?.large ?? "",
          genres: rec.genres ?? [],
          year: rec.startDate?.year ?? 0,
          description: cleanDescription(rec.description),
          author,
          averageScore: rec.averageScore ?? 0,
          popularity: rec.popularity ?? 0,
          matchScore: 0,
          reasons: [
            `Recommended from ${entry.title} (${entry.tier} tier)`,
          ],
          source: "community",
          sourceTitle: entry.title,
        });
      }
    } catch {
      // Skip failed requests
    }

    await sleep(RATE_LIMIT_DELAY);
  }

  // 2. Genre-based recommendations
  onProgress?.("Searching for genre matches...");

  // Pick top 3 genres for each type present in collection
  const typesInCollection = new Set(
    collection
      .filter((e) => e.type === "manga" || e.type === "anime")
      .map((e) => e.type)
  );

  for (const type of typesInCollection) {
    const genresToSearch = profile.topGenres.slice(0, 3);

    for (const genre of genresToSearch) {
      onProgress?.(`Searching ${genre} ${type}...`);

      try {
        const data = await anilistQuery(GENRE_SEARCH_QUERY, {
          genre,
          type: toMediaType(type as MediaType),
        });

        const media = data?.data?.Page?.media ?? [];

        for (const item of media) {
          const title = item.title.english ?? item.title.romaji;
          if (collectionTitles.has(title.toLowerCase())) continue;
          if (collectionIds.has(item.id)) continue;

          if (allRecs.has(item.id)) {
            // Already from community recs, add genre match info
            const existing = allRecs.get(item.id)!;
            const genreOverlap = item.genres.filter((g: string) =>
              profile.topGenres.includes(g)
            );
            if (genreOverlap.length > 0) {
              const reason = `Matches your love of ${genreOverlap.join(", ")}`;
              if (!existing.reasons.includes(reason)) {
                existing.reasons.push(reason);
                existing.matchScore += genreOverlap.length * 3;
              }
            }
            continue;
          }

          const author = extractAuthor(item.staff);
          const genreOverlap = item.genres.filter((g: string) =>
            profile.topGenres.includes(g)
          );

          allRecs.set(item.id, {
            id: item.id,
            title: item.title.romaji,
            titleEnglish: item.title.english,
            type: type as "manga" | "anime",
            coverUrl: item.coverImage?.large ?? "",
            genres: item.genres ?? [],
            year: item.startDate?.year ?? 0,
            description: cleanDescription(item.description),
            author,
            averageScore: item.averageScore ?? 0,
            popularity: item.popularity ?? 0,
            matchScore: 0,
            reasons:
              genreOverlap.length > 0
                ? [`Matches your love of ${genreOverlap.join(", ")}`]
                : [`Top-rated ${genre} ${type}`],
            source: "genre",
          });
        }
      } catch {
        // Skip failed requests
      }

      await sleep(RATE_LIMIT_DELAY);
    }
  }

  // 3. Score and rank everything
  onProgress?.("Ranking recommendations...");

  // Find max popularity for normalisation
  const maxPop = Math.max(
    ...Array.from(allRecs.values()).map((r) => r.popularity),
    1
  );

  for (const rec of allRecs.values()) {
    let score = 0;

    // Community rating bonus (number of reasons from community = more users recommended it)
    const communityReasons = rec.reasons.filter((r) =>
      r.startsWith("Recommended from")
    ).length;
    score += communityReasons * 15;

    // Genre overlap bonus
    const genreOverlap = rec.genres.filter((g) =>
      profile.topGenres.includes(g)
    ).length;
    score += genreOverlap * 8;

    // Author bonus
    if (rec.author && profile.topAuthors.includes(rec.author)) {
      score += 20;
      rec.source = "author";
      rec.reasons.push(`By ${rec.author}, one of your favourite creators`);
    }

    // AniList score bonus (0-10 range contribution)
    score += Math.round((rec.averageScore / 100) * 10);

    // Popularity bonus (normalised 0-5)
    score += Math.round((rec.popularity / maxPop) * 5);

    rec.matchScore = Math.min(99, Math.max(1, score));
  }

  // Sort by score descending
  const sorted = Array.from(allRecs.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);

  // Normalise scores to 50-99 range for display
  if (sorted.length > 0) {
    const maxScore = sorted[0].matchScore;
    const minScore = sorted[sorted.length - 1].matchScore;
    const range = maxScore - minScore || 1;
    for (const rec of sorted) {
      rec.matchScore = Math.round(
        50 + ((rec.matchScore - minScore) / range) * 49
      );
    }
  }

  saveCache(sorted, cacheKeySuffix);
  onProgress?.("Done!");
  return sorted;
}
