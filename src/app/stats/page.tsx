import { getAllMedia } from "@/lib/data";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import { MediaType } from "@/lib/types";

const TYPE_LABELS: Record<MediaType, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movie",
  game: "Game",
};

export default function StatsPage() {
  const entries = getAllMedia();
  const total = entries.length;

  // Count per type
  const typeCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  // Tier distribution
  const tierCounts = TIER_ORDER.reduce<Record<string, number>>((acc, tier) => {
    acc[tier] = entries.filter((e) => e.tier === tier).length;
    return acc;
  }, {});
  const unratedCount = entries.filter((e) => e.tier === null).length;
  const maxTierCount = Math.max(...Object.values(tierCounts), unratedCount, 1);

  // Genre frequency, top 10
  const genreMap: Record<string, number> = {};
  for (const e of entries) {
    for (const g of e.genres) {
      if (g) genreMap[g] = (genreMap[g] ?? 0) + 1;
    }
  }
  const topGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Top 8 authors by entry count
  const INVALID_AUTHORS = new Set(["film", "anime", "manga", "netflix", ""]);
  const authorMap: Record<string, number> = {};
  for (const e of entries) {
    const author = (e.author ?? "").trim();
    if (author.length >= 3 && !INVALID_AUTHORS.has(author.toLowerCase())) {
      authorMap[e.author] = (authorMap[e.author] ?? 0) + 1;
    }
  }
  const topAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const presentTypes = Object.entries(typeCounts) as [MediaType, number][];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Stats
        </h1>
        <p className="text-sm text-zinc-500">
          A snapshot of your library at a glance.
        </p>
      </div>

      {/* Summary cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total */}
          <div className="sketchy-border p-4 rounded-xl space-y-1 bg-zinc-900/60">
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-xs text-zinc-500">Total entries</p>
          </div>

          {/* Per type */}
          {presentTypes.map(([type, count]) => (
            <div
              key={type}
              className="sketchy-border p-4 rounded-xl space-y-1 bg-zinc-900/60"
            >
              <p className="text-3xl font-bold text-white">{count}</p>
              <p className="text-xs text-zinc-500">{TYPE_LABELS[type] ?? type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier distribution */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Tier distribution
        </h2>
        <div className="space-y-2">
          {TIER_ORDER.map((tier) => {
            const count = tierCounts[tier] ?? 0;
            const pct = Math.round((count / maxTierCount) * 100);
            const cfg = TIER_CONFIG[tier];
            return (
              <div key={tier} className="flex items-center gap-3">
                {/* Tier badge */}
                <span
                  className="w-8 h-7 flex items-center justify-center rounded text-xs font-bold flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.colour }}
                >
                  {tier}
                </span>
                {/* Bar */}
                <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: cfg.colour,
                      opacity: 0.7,
                    }}
                  />
                </div>
                {/* Count */}
                <span className="text-xs text-zinc-500 w-6 text-right">
                  {count}
                </span>
              </div>
            );
          })}
          {/* Unrated row */}
          {unratedCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="w-8 h-7 flex items-center justify-center rounded text-xs font-bold flex-shrink-0 bg-zinc-800 text-zinc-500">
                ?
              </span>
              <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((unratedCount / maxTierCount) * 100)}%`,
                    background: "#52525b",
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500 w-6 text-right">
                {unratedCount}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Top genres */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Top genres
        </h2>
        {topGenres.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No genre data yet. Add genres to your entries to see this section.
          </p>
        ) : (
          <div className="sketchy-border p-4 rounded-xl bg-zinc-900/60">
            <div className="flex flex-wrap gap-2">
              {topGenres.map(([genre, count]) => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(99,141,255,0.1)",
                    border: "1px solid rgba(99,141,255,0.2)",
                    color: "#8aabff",
                  }}
                >
                  {genre}
                  <span className="text-zinc-500">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Favourite authors */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Favourite authors
        </h2>
        {topAuthors.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No author data yet. Add authors to your entries to see this section.
          </p>
        ) : (
          <div className="space-y-1">
            {topAuthors.map(([author, count], i) => (
              <div
                key={author}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-700 w-4 text-right">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-300">{author}</span>
                </div>
                <span className="text-xs text-zinc-600">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
