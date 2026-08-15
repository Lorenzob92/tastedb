import * as fs from "node:fs";
import * as path from "node:path";

const DATA_PATH = path.resolve(process.cwd(), "data/japanese-learning.json");
const SHOULD_WRITE = process.argv.includes("--write");

interface LearningTitle {
  id: string;
  title: string;
  japaneseTitle: string;
  format: string;
  year: string;
  posterUrl?: string;
  synopsis?: string;
  tmdbUrl?: string;
  anilistUrl?: string;
  [key: string]: unknown;
}

interface TmdbCandidate {
  title: string;
  heading: string;
  year: string;
  mediaType: "tv" | "movie";
  path: string;
  posterUrl: string | undefined;
  synopsis: string | undefined;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalise(value: string): string {
  return decodeHtml(value)
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/japanese dub/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function parseCandidates(html: string): TmdbCandidate[] {
  return html
    .split('class="comp:media-card')
    .slice(1)
    .map((block) => {
      const href = block.match(/href="\/(tv|movie)\/(\d+)[^"]*"/);
      if (!href) return null;

      const title = decodeHtml(block.match(/<img alt="([^"]+)"/)?.[1] ?? "");
      const heading = decodeHtml(block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? title);
      const releaseDate = decodeHtml(
        block.match(/class="release_date[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "",
      );
      const posterSource =
        block.match(/srcset="[^"]*https:\/\/media\.themoviedb\.org\/t\/p\/[^/]+\/([^\s"]+)/)?.[1] ??
        block.match(/src="https:\/\/media\.themoviedb\.org\/t\/p\/[^/]+\/([^"]+)"/)?.[1];
      const synopsis = decodeHtml(block.match(/<div class="mt-4[^>]*>\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "");

      return {
        title,
        heading,
        year: releaseDate.match(/\b(19|20)\d{2}\b/)?.[0] ?? "",
        mediaType: href[1] as "tv" | "movie",
        path: `/${href[1]}/${href[2]}`,
        posterUrl: posterSource
          ? `https://image.tmdb.org/t/p/w500/${posterSource}`
          : undefined,
        synopsis: synopsis || undefined,
      };
    })
    .filter((candidate): candidate is TmdbCandidate => candidate !== null);
}

function preferredMediaType(item: LearningTitle): "tv" | "movie" {
  return /film|movie/i.test(item.format) ? "movie" : "tv";
}

function isAnime(item: LearningTitle): boolean {
  return (
    /anime|animation/i.test(item.format) ||
    ["whisper-of-the-heart", "secret-world-of-arrietty", "stand-by-me-doraemon"].includes(item.id)
  );
}

async function fetchAniListMatch(item: LearningTitle) {
  if (!isAnime(item)) return null;

  const query = `
    query ($search: String!) {
      Media(search: $search, type: ANIME) {
        id
        siteUrl
        title { romaji english native }
        coverImage { extraLarge large }
        description(asHtml: false)
        startDate { year }
      }
    }
  `;
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { search: item.title } }),
  });
  if (!response.ok) return null;

  const media = (await response.json())?.data?.Media;
  if (!media) return null;

  const targets = [normalise(item.title), normalise(item.japaneseTitle)];
  const returnedTitles = [media.title?.english, media.title?.romaji, media.title?.native]
    .filter(Boolean)
    .map((title: string) => normalise(title));
  const targetYear = item.year.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
  let score = returnedTitles.some((title: string) => targets.includes(title)) ? 100 : 0;
  if (targetYear && String(media.startDate?.year ?? "") === targetYear) score += 30;

  if (score < 100) return null;

  return {
    posterUrl: media.coverImage?.extraLarge ?? media.coverImage?.large,
    synopsis: decodeHtml(media.description ?? ""),
    anilistUrl: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
  };
}

function scoreCandidate(item: LearningTitle, candidate: TmdbCandidate): number {
  const english = normalise(item.title);
  const japanese = normalise(item.japaneseTitle);
  const candidateTitle = normalise(candidate.title);
  const heading = normalise(candidate.heading);
  const targetYear = item.year.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
  let score = 0;

  if (candidateTitle === english) score += 100;
  else if (heading.includes(english) || english.includes(candidateTitle)) score += 55;
  if (japanese && heading.includes(japanese)) score += 80;
  if (targetYear && candidate.year === targetYear) score += 30;
  else if (targetYear && candidate.year) score -= 10;
  if (candidate.mediaType === preferredMediaType(item)) score += 15;
  if (candidate.posterUrl) score += 5;

  return score;
}

async function fetchCandidates(item: LearningTitle): Promise<TmdbCandidate[]> {
  const targetYear = item.year.match(/\b(19|20)\d{2}\b/)?.[0];
  const searches = [
    `${item.title}${targetYear ? ` y:${targetYear}` : ""}`,
    item.title,
    item.japaneseTitle,
  ];

  const candidatesByPath = new Map<string, TmdbCandidate>();

  for (const search of searches) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(
        `https://www.themoviedb.org/search?query=${encodeURIComponent(search)}`,
        { headers: { "User-Agent": "TasteDB personal catalogue enrichment" } },
      );
      if (!response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      for (const candidate of parseCandidates(await response.text())) {
        candidatesByPath.set(candidate.path, candidate);
      }
      break;
    }
    if (
      Math.max(
        0,
        ...[...candidatesByPath.values()].map((candidate) => scoreCandidate(item, candidate)),
      ) >= 150
    ) {
      break;
    }
  }

  return [...candidatesByPath.values()];
}

async function main() {
  const items = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as LearningTitle[];
  let matched = 0;
  let unmatched = 0;

  for (const item of items) {
    if (item.posterUrl && item.synopsis && item.tmdbUrl) {
      matched++;
      continue;
    }

    try {
      const aniListMatch = await fetchAniListMatch(item);
      if (aniListMatch) {
        item.posterUrl = aniListMatch.posterUrl;
        item.synopsis = aniListMatch.synopsis;
        item.anilistUrl = aniListMatch.anilistUrl;
        console.log(`OK    ${item.title} -> AniList`);
        matched++;
        await new Promise((resolve) => setTimeout(resolve, 700));
        continue;
      }

      const candidates = await fetchCandidates(item);
      const ranked = candidates
        .map((candidate) => ({ candidate, score: scoreCandidate(item, candidate) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];

      if (!best || best.score < 75) {
        console.log(`MISS  ${item.title}`);
        unmatched++;
        continue;
      }

      item.posterUrl = best.candidate.posterUrl;
      item.synopsis = best.candidate.synopsis;
      item.tmdbUrl = `https://www.themoviedb.org${best.candidate.path}`;
      console.log(
        `OK    ${item.title} -> ${best.candidate.title} (${best.candidate.year || "no year"}, ${best.score})`,
      );
      matched++;
    } catch (error) {
      console.log(`ERROR ${item.title}: ${error instanceof Error ? error.message : String(error)}`);
      unmatched++;
    }
  }

  if (SHOULD_WRITE) {
    fs.writeFileSync(DATA_PATH, `${JSON.stringify(items, null, 2)}\n`);
  }

  console.log(`\nMatched ${matched}, unmatched ${unmatched}${SHOULD_WRITE ? ". Data updated." : ". Dry run."}`);
}

main();
