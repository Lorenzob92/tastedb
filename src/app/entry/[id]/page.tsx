import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMedia, getMediaById } from "@/lib/data";
import { getNyaaUrl } from "@/lib/nyaa";
import { TIER_CONFIG } from "@/lib/tier-config";
import { TierBadge } from "@/components/tier-badge";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllMedia().map((entry) => ({ id: entry.id }));
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  reading: "Reading",
  paused: "Paused",
  dropped: "Dropped",
  planned: "Planned",
};

const TYPE_LABELS: Record<string, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movie",
  game: "Game",
};

const STATUS_COLOURS: Record<string, string> = {
  completed: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  reading: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  paused: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  dropped: "bg-red-900/40 text-red-300 border border-red-700/40",
  planned: "bg-zinc-800 text-zinc-300 border border-zinc-700",
};

const TYPE_COLOURS: Record<string, string> = {
  manga: "bg-violet-900/40 text-violet-300 border border-violet-700/40",
  anime: "bg-sky-900/40 text-sky-300 border border-sky-700/40",
  movie: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  game: "bg-green-900/40 text-green-300 border border-green-700/40",
};

export default async function EntryPage({ params }: Props) {
  const { id } = await params;
  const entry = getMediaById(id);

  if (!entry) notFound();

  const allMedia = getAllMedia();
  const related = allMedia.filter(
    (e) => e.id !== entry.id && e.title === entry.title && e.type !== entry.type
  );

  const nyaaUrl = getNyaaUrl(entry.title, entry.type);

  const anilistUrl =
    entry.source === "anilist" && entry.sourceId
      ? `https://anilist.co/${entry.type === "anime" ? "anime" : "manga"}/${entry.sourceId}`
      : null;

  const tierConfig = entry.tier ? TIER_CONFIG[entry.tier] : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-blue-400 transition-colours mb-8"
        >
          ← Back to collection
        </Link>

        {/* Main card */}
        <div className="flex gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            {entry.coverUrl ? (
              <div className="w-48 rounded-lg overflow-hidden border border-zinc-800 shadow-xl">
                <Image
                  src={entry.coverUrl}
                  alt={`${entry.title} cover`}
                  width={192}
                  height={272}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-48 h-[272px] rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm">
                No cover
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">{entry.title}</h1>
              {entry.author && (
                <p className="mt-1 text-zinc-400 text-sm">{entry.author}</p>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {entry.tier && (
                <>
                  <TierBadge tier={entry.tier} size="lg" />
                  {tierConfig && (
                    <span className="text-sm font-medium" style={{ color: tierConfig.colour }}>
                      {tierConfig.label}
                    </span>
                  )}
                </>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[entry.status] ?? "bg-zinc-800 text-zinc-300"}`}
              >
                {STATUS_LABELS[entry.status] ?? entry.status}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOURS[entry.type] ?? "bg-zinc-800 text-zinc-300"}`}
              >
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
            </div>

            {/* Genres */}
            {entry.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Year */}
            {entry.year > 0 && (
              <p className="text-sm text-zinc-500">{entry.year}</p>
            )}

            {/* Synopsis */}
            {entry.description && (
              <p className="text-sm text-zinc-400 leading-relaxed max-w-prose">
                {entry.description}
              </p>
            )}

            {/* Notes */}
            {entry.notes && (
              <div className="border border-zinc-800 rounded-lg px-4 py-3 bg-zinc-900/60 text-sm text-zinc-300 leading-relaxed">
                {entry.notes}
              </div>
            )}

            {/* Action links */}
            <div className="flex flex-wrap gap-3 pt-1">
              {nyaaUrl && (
                <a
                  href={nyaaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm rounded-md border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colours"
                >
                  Find on Nyaa
                </a>
              )}
              {anilistUrl && (
                <a
                  href={anilistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colours"
                >
                  View on AniList
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Related entries */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Related</h2>
            <div className="flex flex-wrap gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/entry/${rel.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-800 bg-zinc-900 hover:border-blue-700/60 hover:bg-zinc-800 transition-colours text-sm text-zinc-300"
                >
                  <span className="text-zinc-500">{TYPE_LABELS[rel.type] ?? rel.type}</span>
                  <span>{rel.title}</span>
                  {rel.tier && <TierBadge tier={rel.tier} size="sm" />}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
