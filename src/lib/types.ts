export type MediaType = "manga" | "anime" | "movie" | "game";
export type Tier = "S" | "A" | "B" | "C" | "D";
export type Status = "completed" | "reading" | "paused" | "dropped" | "planned";

export interface MediaEntry {
  id: string;
  title: string;
  type: MediaType;
  tier: Tier | null;
  status: Status;
  notes: string;
  coverUrl: string;
  author: string;
  genres: string[];
  year: number;
  source: string;
  sourceId: string;
  nyaaCategory: string;
  addedAt: string;
}

export interface Recommendation {
  title: string;
  type: MediaType;
  reason: string;
  matchScore: number;
  coverUrl: string;
  generatedAt: string;
}

export type ViewMode = "grid" | "tiers" | "list" | "shelf";
