import learningData from "../../data/japanese-learning.json";

export type JapaneseLevel = "N5/N4" | "N4" | "N4/N3" | "N3" | "N2/N1";
export type JapaneseCategory = "Foundations" | "Everyday" | "Crime" | "Prestige" | "Period";
export type SubtitleEvidence = "verified" | "english-only" | "unverified";
export type LearningProgress = "candidate" | "ready" | "watching" | "watched";

export interface JapaneseLearningTitle {
  id: string;
  title: string;
  japaneseTitle: string;
  format: string;
  year: string;
  level: JapaneseLevel;
  category: JapaneseCategory;
  summary: string;
  subtitleEvidence: SubtitleEvidence;
  sourceUrl?: string;
  priority: number;
}

export const japaneseLearningTitles = learningData as JapaneseLearningTitle[];

export const JAPANESE_LEVEL_ORDER: JapaneseLevel[] = [
  "N5/N4",
  "N4",
  "N4/N3",
  "N3",
  "N2/N1",
];

export const JAPANESE_CATEGORIES: Array<JapaneseCategory | "All"> = [
  "All",
  "Foundations",
  "Everyday",
  "Crime",
  "Prestige",
  "Period",
];
