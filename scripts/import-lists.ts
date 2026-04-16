import * as fs from "fs";
import * as path from "path";

// ---- types (inline to avoid tsconfig issues in scripts context) ----
type MediaType = "manga" | "anime" | "movie" | "game";
type Tier = "S" | "A" | "B" | "C" | "D";
type Status = "completed" | "reading" | "paused" | "dropped" | "planned";

interface MediaEntry {
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

// ---- helpers ----

function slugify(title: string, type: MediaType): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") +
    "-" +
    type
  );
}

function nyaaCategory(type: MediaType): string {
  if (type === "manga") return "3_0";
  if (type === "anime") return "1_0";
  return "";
}

const ADDED_AT = new Date().toISOString();

// Extract author from parenthetical like "(Naoki Urasawa)" or after em-dash/dash
function extractAuthorAndNotes(raw: string): { title: string; author: string; notes: string } {
  let title = raw;
  let author = "";
  let notes = "";

  // Extract notes that are in parentheses (status flags, caveats)
  // e.g. "(NOT FINISHED, S tier so far)", "(Junji Ito)"
  const parenMatches = [...raw.matchAll(/\(([^)]+)\)/g)];

  for (const m of parenMatches) {
    const content = m[1].trim();
    // If it looks like an author name (no ALL_CAPS keywords, no numbers, short)
    const isAuthor =
      !content.match(/NOT FINISHED|PAUSED|STILL PUBLISHING|tier|vol|season|S1|S2|averaged/i) &&
      content.split(" ").length <= 4;

    if (isAuthor && !author) {
      author = content;
    } else {
      notes += (notes ? "; " : "") + content;
    }
    title = title.replace(m[0], "").trim();
  }

  // Extract trailing notes after " — " or " - " (excluding compound words / flags)
  const dashMatch = title.match(/^(.+?)\s+[—–-]{1,2}\s+(.+)$/);
  if (dashMatch) {
    title = dashMatch[1].trim();
    const trailing = dashMatch[2].trim();
    // Treat as notes if it has lowercase words (description), else ignore
    if (trailing.match(/[a-z]/)) {
      notes += (notes ? "; " : "") + trailing;
    }
  }

  title = title.trim();
  return { title, author, notes };
}

function makeEntry(
  rawTitle: string,
  type: MediaType,
  tier: Tier | null,
  status: Status
): MediaEntry {
  const { title, author, notes } = extractAuthorAndNotes(rawTitle);
  const id = slugify(title, type);

  return {
    id,
    title,
    type,
    tier,
    status,
    notes,
    coverUrl: "",
    author,
    genres: [],
    year: 0,
    source: "",
    sourceId: "",
    nyaaCategory: nyaaCategory(type),
    addedAt: ADDED_AT,
  };
}

// ---- manga parser (read.md) ----

function parseMangaFile(content: string): MediaEntry[] {
  const entries: MediaEntry[] = [];

  // Section header -> (tier | null, status)
  type SectionMeta = { tier: Tier | null; status: Status; skip: boolean };
  const SECTION_MAP: Record<string, SectionMeta> = {
    "S Tier": { tier: "S", status: "completed", skip: false },
    "A Tier": { tier: "A", status: "completed", skip: false },
    "B Tier": { tier: "B", status: "completed", skip: false },
    "C Tier": { tier: "C", status: "completed", skip: false },
    "D Tier": { tier: "D", status: "completed", skip: false },
    "Unrated (read long ago, can't score)": { tier: null, status: "completed", skip: false },
    "In Progress (reading now)": { tier: null, status: "reading", skip: false },
    "Paused / Stalled": { tier: null, status: "paused", skip: false },
    "Skipped / Not Read": { tier: null, status: "planned", skip: true },
    Dropped: { tier: null, status: "dropped", skip: false },
  };

  let currentMeta: SectionMeta | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Match ## headers
    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      const key = h2[1].trim();
      currentMeta = SECTION_MAP[key] ?? null;
      continue;
    }

    if (!currentMeta || currentMeta.skip) continue;
    if (!trimmed.startsWith("- ")) continue;

    const raw = trimmed.slice(2).trim();
    if (!raw || raw === "") continue;

    // Determine overriding status from inline flags
    let status = currentMeta.status;
    if (/NOT FINISHED/i.test(raw) || /STILL PUBLISHING/i.test(raw)) {
      // Keep the tier but note it; status stays as-is (completed for tier sections)
    }
    if (/paused/i.test(raw)) {
      status = "paused";
    }

    entries.push(makeEntry(raw, "manga", currentMeta.tier, status));
  }

  return entries;
}

// ---- anime parser (anime.md) ----

function parseAnimeFile(content: string): MediaEntry[] {
  const entries: MediaEntry[] = [];

  type SectionMeta = { tier: Tier | null; status: Status; skip: boolean };

  // Top-level tier sections (## headers)
  const TOP_SECTION_MAP: Record<string, SectionMeta> = {
    "S Tier": { tier: "S", status: "completed", skip: false },
    "A Tier": { tier: "A", status: "completed", skip: false },
    "B Tier": { tier: "B", status: "completed", skip: false },
    "C Tier": { tier: "C", status: "completed", skip: false },
    "D Tier": { tier: "D", status: "completed", skip: false },
    "Unrated / Can't Recall": { tier: null, status: "completed", skip: false },
    "Live Action": { tier: null, status: "completed", skip: false },
    "Ghibli / Studio Ghibli films": { tier: null, status: "completed", skip: false },
    "Mediaset era (watched as kid, did NOT read manga)": { tier: null, status: "completed", skip: true },
  };

  // Sub-tier sections within Ghibli (### headers)
  const GHIBLI_SUB_MAP: Record<string, Tier | null> = {
    "S Tier": "S",
    "A Tier": "A",
    "B Tier": "B",
    "Not Watched": null,
  };

  // Sections to skip entirely
  const SKIP_SECTIONS = new Set([
    "Italian TV era — watched as kid, too old to remember well",
    "Not Watched",
    "D Tier", // empty in anime.md
  ]);

  let currentMeta: SectionMeta | null = null;
  let inGhibli = false;
  let ghibliTier: Tier | null = null;
  let skipGhibliSub = false;
  // Track Live Action tier inline (e.g. "Erased (live action film) — A tier")
  let liveActionTier: Tier | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // ## header
    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      const key = h2[1].trim();
      inGhibli = key === "Ghibli / Studio Ghibli films";
      ghibliTier = null;
      skipGhibliSub = false;
      liveActionTier = null;
      currentMeta = TOP_SECTION_MAP[key] ?? null;
      if (SKIP_SECTIONS.has(key)) currentMeta = null;
      continue;
    }

    // ### header (only meaningful inside Ghibli)
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      const key = h3[1].trim();
      if (inGhibli) {
        ghibliTier = GHIBLI_SUB_MAP[key] ?? null;
        skipGhibliSub = key === "Not Watched";
      } else {
        // Italian TV era subsection
        if (SKIP_SECTIONS.has(key)) currentMeta = null;
      }
      continue;
    }

    if (!currentMeta) continue;
    if (!trimmed.startsWith("- ")) continue;

    const raw = trimmed.slice(2).trim();
    if (!raw || raw === "") continue;

    // Skip "skip" sections
    if (currentMeta.skip) continue;

    // Ghibli: use sub-tier; skip "Not Watched"
    if (inGhibli) {
      if (skipGhibliSub) continue;
      entries.push(makeEntry(raw, "anime", ghibliTier, "completed"));
      continue;
    }

    // Live Action: parse inline tier from notes
    if (currentMeta === TOP_SECTION_MAP["Live Action"]) {
      // e.g. "Erased (live action film) — A tier"
      const tierMatch = raw.match(/([SABCD])\s*tier/i);
      liveActionTier = tierMatch ? (tierMatch[1].toUpperCase() as Tier) : null;
      entries.push(makeEntry(raw, "anime", liveActionTier, "completed"));
      continue;
    }

    // Skip entries that are clearly informational only (cross-references from manga)
    // e.g. "Pluto (Netflix 2023) — manga already S, informational only"
    // Keep them but mark with a note; the makeEntry function handles notes.

    // Determine status from inline flags
    let status: Status = currentMeta.status;
    if (/NOT FINISHED/i.test(raw) || /not finished/i.test(raw)) {
      status = "reading";
    }

    entries.push(makeEntry(raw, "anime", currentMeta.tier, status));
  }

  return entries;
}

// ---- main ----

const LISTS_DIR = path.resolve(
  "/Users/lorenzobonari/Desktop/Claude Projects/Friends & Family/Personal/Manga/lists"
);
const DATA_DIR = path.resolve(
  "/Users/lorenzobonari/Desktop/Claude Projects/Friends & Family/Personal/Manga/app/data"
);

function run() {
  const readMd = fs.readFileSync(path.join(LISTS_DIR, "read.md"), "utf-8");
  const animeMd = fs.readFileSync(path.join(LISTS_DIR, "anime.md"), "utf-8");

  const mangaEntries = parseMangaFile(readMd);
  const animeEntries = parseAnimeFile(animeMd);

  const all = [...mangaEntries, ...animeEntries];

  // Deduplicate by ID (first occurrence wins)
  const seen = new Set<string>();
  const deduped: MediaEntry[] = [];
  for (const entry of all) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      deduped.push(entry);
    }
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, "media.json"),
    JSON.stringify(deduped, null, 2)
  );

  console.log(`Wrote ${deduped.length} entries to data/media.json`);
  console.log(`  Manga: ${mangaEntries.length} raw -> ${mangaEntries.filter(e => !seen.has(e.id) || deduped.some(d => d.id === e.id && d.type === "manga")).length} kept`);
  console.log(`  Anime: ${animeEntries.length} raw`);
  console.log("\nFirst 5 entries:");
  for (const e of deduped.slice(0, 5)) {
    console.log(`  [${e.type}] ${e.title} | tier:${e.tier ?? "null"} status:${e.status}`);
  }
}

run();
