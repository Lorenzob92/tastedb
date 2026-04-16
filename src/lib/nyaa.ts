import { MediaType } from "./types";

const NYAA_CATEGORIES: Partial<Record<MediaType, string>> = {
  manga: "3_0",
  anime: "1_0",
};

export function getNyaaUrl(title: string, type: MediaType): string | null {
  const category = NYAA_CATEGORIES[type];
  if (!category) return null;
  return `https://nyaa.si/?f=0&c=${category}&q=${encodeURIComponent(title)}`;
}
