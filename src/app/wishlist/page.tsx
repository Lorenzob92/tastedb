"use client";

import { useMemo } from "react";
import { MediaType } from "@/lib/types";
import { useStore } from "@/lib/store";
import { MediaCard } from "@/components/media-card";

const TYPE_LABELS: Record<MediaType, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movies",
  game: "Games",
};

const TYPE_ORDER: MediaType[] = ["manga", "anime", "movie", "game"];

export default function WishlistPage() {
  const { media, updateEntry, removeEntry, ready } = useStore();

  const planned = useMemo(() => media.filter((e) => e.status === "planned"), [media]);

  const grouped = useMemo(() => {
    return TYPE_ORDER.reduce<Record<MediaType, typeof planned>>(
      (acc, type) => {
        acc[type] = planned.filter((e) => e.type === type);
        return acc;
      },
      { manga: [], anime: [], movie: [], game: [] }
    );
  }, [planned]);

  const activeTypes = TYPE_ORDER.filter((t) => grouped[t].length > 0);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            Mark entries as &quot;Planned&quot; in your collection or add from recommendations.
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
                  <div key={entry.id} className="group relative">
                    <MediaCard entry={entry} />
                    {/* Action overlay */}
                    <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/90 to-transparent pt-8 pb-2 px-2 rounded-b-lg flex gap-1.5 justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateEntry(entry.id, { status: "reading" });
                        }}
                        className="px-2 py-1 text-[10px] font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        Start
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeEntry(entry.id);
                        }}
                        className="px-2 py-1 text-[10px] font-medium rounded bg-zinc-800 text-zinc-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
