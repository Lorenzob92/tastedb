import { getAllMedia, filterMedia } from "@/lib/data";
import { MediaType } from "@/lib/types";
import { MediaCard } from "@/components/media-card";

const TYPE_LABELS: Record<MediaType, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movies",
  game: "Games",
};

const TYPE_ORDER: MediaType[] = ["manga", "anime", "movie", "game"];

export default function WishlistPage() {
  const all = getAllMedia();
  const planned = filterMedia(all, { status: "planned" });

  const grouped = TYPE_ORDER.reduce<Record<MediaType, typeof planned>>(
    (acc, type) => {
      acc[type] = planned.filter((e) => e.type === type);
      return acc;
    },
    { manga: [], anime: [], movie: [], game: [] }
  );

  const activeTypes = TYPE_ORDER.filter((t) => grouped[t].length > 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">
          My <span className="text-[#638dff]">Wishlist</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {planned.length} {planned.length === 1 ? "entry" : "entries"} planned
        </p>
      </div>

      {planned.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-zinc-500 text-sm">Nothing on the wishlist yet.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Mark entries as &quot;Planned&quot; in your collection to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {activeTypes.map((type) => (
            <section key={type}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                {TYPE_LABELS[type]}{" "}
                <span className="text-zinc-600 font-normal normal-case tracking-normal">
                  ({grouped[type].length})
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {grouped[type].map((entry) => (
                  <MediaCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
