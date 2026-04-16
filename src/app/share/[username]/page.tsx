import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicServerClient } from "@/lib/supabase-public";
import { fromDbRow } from "@/lib/seed";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import type { MediaEntry, Tier } from "@/lib/types";

type Props = {
  params: Promise<{ username: string }>;
};

async function getUserData(username: string) {
  const supabase = createPublicServerClient();
  if (!supabase) return null;

  // Look up the profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .single();

  if (profileError || !profile) return null;

  // Fetch all their media entries
  const { data: rows, error: entriesError } = await supabase
    .from("media_entries")
    .select("*")
    .eq("user_id", profile.id)
    .order("added_at", { ascending: false });

  if (entriesError) return null;

  const entries = (rows ?? []).map((row) =>
    fromDbRow(row as Record<string, unknown>)
  );

  return {
    profile: profile as {
      id: string;
      username: string;
      display_name: string | null;
    },
    entries,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getUserData(username);

  if (!data) {
    return { title: "User not found - tastedb" };
  }

  const name = data.profile.display_name || data.profile.username;
  const tiered = data.entries.filter((e) => e.tier !== null);

  return {
    title: `${name}'s Tier List - tastedb`,
    description: `Check out ${name}'s manga and anime tier list with ${tiered.length} rated titles on tastedb.`,
    openGraph: {
      title: `${name}'s Tier List - tastedb`,
      description: `Check out ${name}'s manga and anime tier list with ${tiered.length} rated titles on tastedb.`,
      type: "website",
      siteName: "tastedb",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name}'s Tier List - tastedb`,
      description: `Check out ${name}'s manga and anime tier list with ${tiered.length} rated titles on tastedb.`,
    },
  };
}

function groupByTier(
  entries: MediaEntry[]
): Record<Tier, MediaEntry[]> {
  const buckets: Record<Tier, MediaEntry[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };
  for (const entry of entries) {
    if (entry.tier && entry.tier in buckets) {
      buckets[entry.tier].push(entry);
    }
  }
  return buckets;
}

export default async function SharePage({ params }: Props) {
  const { username } = await params;
  const data = await getUserData(username);

  if (!data) {
    notFound();
  }

  const { profile, entries } = data;
  const name = profile.display_name || profile.username;
  const grouped = groupByTier(entries);
  const totalTiered = entries.filter((e) => e.tier !== null).length;
  const availableTypes = [...new Set(entries.map((e) => e.type))];
  const typeLabels: Record<string, string> = { manga: "Manga", anime: "Anime", movie: "Movie", game: "Game" };

  // Gather genre stats
  const genreCounts: Record<string, number> = {};
  for (const entry of entries) {
    for (const g of entry.genres) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // Covers for CTA collage (S and A tier)
  const collageCovers = entries
    .filter(
      (e) =>
        (e.tier === "S" || e.tier === "A") &&
        e.coverUrl &&
        e.coverUrl.length > 0
    )
    .slice(0, 16);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-zinc-200">
      {/* Header */}
      <header className="relative overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6">
        {/* Decorative manga lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)",
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#638dff]/60 font-medium mb-3">
            tastedb
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {name}&apos;s{" "}
            <span className="text-[#638dff]">Tier List</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-3">
            {totalTiered} rated {totalTiered === 1 ? "title" : "titles"} across{" "}
            {entries.length} total {entries.length === 1 ? "entry" : "entries"}
          </p>

          {/* Type tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="text-xs px-4 py-1.5 rounded-md bg-[#638dff]/12 border border-[#638dff]/35 text-[#638dff]">
              All
            </span>
            {availableTypes.map((t) => (
              <Link
                key={t}
                href={`/share/${username}/${t}`}
                className="text-xs px-4 py-1.5 rounded-md border border-white/8 text-zinc-500 hover:text-zinc-300 transition-colors capitalize"
              >
                {typeLabels[t] || t}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Tier rows */}
      <section className="px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        <div className="space-y-3">
          {TIER_ORDER.map((tier) => {
            const items = grouped[tier];
            if (!items || items.length === 0) return null;
            const config = TIER_CONFIG[tier];

            return (
              <div
                key={tier}
                className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-white/5"
              >
                {/* Tier badge */}
                <div
                  className="flex flex-col items-center justify-center w-16 sm:w-20 shrink-0"
                  style={{ backgroundColor: config.bg }}
                >
                  <span
                    className="text-3xl sm:text-4xl font-black"
                    style={{ color: config.colour }}
                  >
                    {tier}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider mt-0.5 opacity-70"
                    style={{ color: config.colour }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Covers */}
                <div className="flex items-center gap-2 py-3 px-3 flex-1 overflow-x-auto min-h-[7rem] scrollbar-thin">
                  {items.map((entry) => {
                    const hasCover =
                      entry.coverUrl && entry.coverUrl.length > 0;

                    return (
                      <div
                        key={entry.id}
                        className="relative w-[60px] h-[90px] sm:w-[80px] sm:h-[120px] rounded-lg overflow-hidden border border-white/10 shrink-0 group shadow-md hover:shadow-lg transition-shadow"
                      >
                        {hasCover ? (
                          <Image
                            src={entry.coverUrl}
                            alt={entry.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-zinc-700 to-zinc-800 flex items-center justify-center p-1">
                            <span className="text-[9px] text-zinc-400 text-center leading-tight">
                              {entry.title}
                            </span>
                          </div>
                        )}
                        {/* Hover title overlay */}
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1.5">
                          <span className="text-[10px] text-white text-center leading-tight font-medium">
                            {entry.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Count */}
                <div className="flex items-center px-2 sm:px-4">
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium tabular-nums">
                    {items.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats summary */}
      {(totalTiered > 0 || topGenres.length > 0) && (
        <section className="px-6 pb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-2xl font-black text-white">{entries.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Total entries</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-2xl font-black text-white">{totalTiered}</p>
              <p className="text-xs text-zinc-500 mt-1">Rated</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-2xl font-black text-[#e74c3c]">
                {grouped.S.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Masterpieces</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-2xl font-black text-[#e67e22]">
                {grouped.A.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Excellent</p>
            </div>
          </div>

          {topGenres.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-zinc-500 mb-2">Top genres</p>
              <div className="flex flex-wrap justify-center gap-2">
                {topGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full text-xs bg-[#638dff]/10 text-[#638dff] border border-[#638dff]/20"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CTA section */}
      <section className="relative overflow-hidden">
        {/* Manga collage background */}
        {collageCovers.length > 0 && (
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-2 h-full">
              {collageCovers.map((entry) => (
                <div
                  key={entry.id}
                  className="relative aspect-[3/4] overflow-hidden"
                >
                  <Image
                    src={entry.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="12vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-xl sm:text-3xl font-black text-white">
              Create your own tier list
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 sm:mt-3 leading-relaxed">
              Join tastedb and track, rate, and share your manga, anime, movies,
              and games collection.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#638dff] text-white font-bold text-sm hover:bg-[#4f7aff] transition-colors shadow-lg shadow-[#638dff]/20"
              >
                Sign Up Free
              </Link>
              <Link
                href="/login"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
