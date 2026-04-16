import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.resolve(__dirname, "../data/media.json");

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string };
  description: string | null;
  staff?: { edges: Array<{ node: { name: { full: string } }; role: string }> };
  genres: string[];
  startDate: { year: number | null };
}

async function searchAniList(title: string, type: "MANGA" | "ANIME"): Promise<AniListMedia | null> {
  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        id
        title { romaji english }
        coverImage { large }
        description(asHtml: false)
        staff(perPage: 5) { edges { node { name { full } } role } }
        genres
        startDate { year }
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
    return json?.data?.Media ?? null;
  }

  return null;
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const entries = JSON.parse(raw);
  let enriched = 0;
  let skipped = 0;
  let notFound = 0;

  for (const entry of entries) {
    // Skip manually fixed entries
    if (entry.manualFix) {
      skipped++;
      continue;
    }
    // Only enrich manga and anime (AniList doesn't have movies/games)
    if (entry.type !== "manga" && entry.type !== "anime") {
      skipped++;
      continue;
    }

    const aniType = entry.type === "manga" ? "MANGA" : "ANIME";

    try {
      const result = await searchAniList(entry.title, aniType);
      if (!result) {
        console.log(`  NOT FOUND: ${entry.title} (${entry.type})`);
        notFound++;
        continue;
      }

      entry.coverUrl = result.coverImage.large;
      entry.source = "anilist";
      entry.sourceId = String(result.id);

      // Strip any residual HTML tags and set description
      const rawDesc = result.description ?? "";
      entry.description = rawDesc.replace(/<[^>]*>/g, "").trim();

      if (result.genres.length > 0 && entry.genres.length === 0) {
        entry.genres = result.genres.map((g: string) => g.toLowerCase());
      }
      if (result.startDate?.year && entry.year === 0) {
        entry.year = result.startDate.year;
      }
      if (!entry.author && result.staff?.edges) {
        const creator = result.staff.edges.find(
          (e: any) => e.role === "Story & Art" || e.role === "Story" || e.role === "Original Creator"
        );
        if (creator) entry.author = creator.node.name.full;
      }

      enriched++;
      console.log(`  OK: ${entry.title} (${entry.type})`);

      // AniList rate limit: 90 req/min, 700ms between requests
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.error(`  ERROR: ${entry.title}:`, err);
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2));
  console.log(`\nDone. Enriched ${enriched}, skipped ${skipped} (non-manga/anime), not found ${notFound}.`);
}

main();
