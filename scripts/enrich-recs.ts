import * as fs from "fs";
import * as path from "path";

const RECS_PATH = path.resolve(__dirname, "../data/recommendations.json");

interface Rec {
  title: string;
  type: "manga" | "anime";
  reason: string;
  matchScore: number;
  coverUrl: string;
  generatedAt: string;
}

async function searchAniList(
  title: string,
  type: "MANGA" | "ANIME"
): Promise<string | null> {
  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        coverImage { large }
      }
    }
  `;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search: title, type } }),
    });

    if (res.status === 429) {
      const wait = (attempt + 1) * 10000;
      console.log(`  RATE LIMITED on "${title}", waiting ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    const json = await res.json();
    return json?.data?.Media?.coverImage?.large ?? null;
  }

  return null;
}

async function main() {
  const recs: Rec[] = JSON.parse(fs.readFileSync(RECS_PATH, "utf-8"));
  let enriched = 0;
  let notFound = 0;

  for (const rec of recs) {
    if (rec.coverUrl) {
      continue;
    }

    const aniType = rec.type === "manga" ? "MANGA" : "ANIME";
    // Clean title for search (remove parenthetical notes)
    const searchTitle = rec.title.replace(/\s*\(.*?\)\s*/g, "").trim();

    try {
      const coverUrl = await searchAniList(searchTitle, aniType);
      if (coverUrl) {
        rec.coverUrl = coverUrl;
        enriched++;
        console.log(`  OK: ${rec.title}`);
      } else {
        console.log(`  NOT FOUND: ${rec.title}`);
        notFound++;
      }

      // AniList rate limit: 90 req/min
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.error(`  ERROR: ${rec.title}:`, err);
    }
  }

  fs.writeFileSync(RECS_PATH, JSON.stringify(recs, null, 2));
  console.log(
    `\nDone. Enriched ${enriched}, not found ${notFound}, total ${recs.length}.`
  );
}

main();
