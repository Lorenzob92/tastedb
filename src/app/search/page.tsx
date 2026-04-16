"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useStore, searchAniList, AniListSearchResult } from "@/lib/store";
import { MediaEntry, MediaType, Tier, Status } from "@/lib/types";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import { getNyaaUrl } from "@/lib/nyaa";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "planned", label: "Planned" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
];

export default function SearchPage() {
  const { addEntry, isInCollection, ready } = useStore();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"MANGA" | "ANIME">("MANGA");
  const [results, setResults] = useState<AniListSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status>("planned");
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const data = await searchAniList(q, searchType);
      setResults(data);
      setLoading(false);
      setExpandedId(null);
    },
    [searchType]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleAdd = (result: AniListSearchResult) => {
    const title = result.title.english || result.title.romaji;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const type: MediaType = searchType === "MANGA" ? "manga" : "anime";
    const id = `${slug}-${type}`;

    const author =
      result.staff?.edges?.find((e) =>
        e.role.toLowerCase().includes("story") || e.role.toLowerCase().includes("original")
      )?.node.name.full ??
      result.staff?.edges?.[0]?.node.name.full ??
      "";

    const entry: MediaEntry = {
      id,
      title,
      type,
      tier: selectedTier,
      status: selectedStatus,
      notes: "",
      coverUrl: result.coverImage?.large ?? "",
      author,
      genres: (result.genres ?? []).map((g) => g.toLowerCase()),
      year: result.startDate?.year ?? 0,
      source: "anilist",
      sourceId: String(result.id),
      nyaaCategory: type === "manga" ? "3_0" : "1_0",
      addedAt: new Date().toISOString(),
      description: result.description ?? "",
    };

    addEntry(entry);
    setJustAdded((prev) => new Set(prev).add(result.id));
    setAddingId(null);
    setSelectedTier(null);
    setSelectedStatus("planned");
  };

  const handleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    // Reset adding state when collapsing
    if (expandedId === id) {
      setAddingId(null);
      setSelectedTier(null);
      setSelectedStatus("planned");
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white tracking-tight">
          <span className="text-[#638dff]">Search</span> AniList
        </h1>
        <p className="text-sm text-zinc-500">
          Find manga and anime to add to your collection.
        </p>
      </div>

      {/* Search controls */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
          autoFocus
        />
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setSearchType("MANGA")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              searchType === "MANGA"
                ? "bg-violet-900/40 text-violet-300"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Manga
          </button>
          <button
            onClick={() => setSearchType("ANIME")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              searchType === "ANIME"
                ? "bg-sky-900/40 text-sky-300"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Anime
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => {
            const title = result.title.english || result.title.romaji;
            const tracked = isInCollection(title) || justAdded.has(result.id);
            const isExpanded = expandedId === result.id;
            const isAdding = addingId === result.id;
            const mediaType: MediaType = searchType === "MANGA" ? "manga" : "anime";
            const nyaaUrl = getNyaaUrl(title, mediaType);
            const authorName =
              result.staff?.edges?.find((e) =>
                e.role.toLowerCase().includes("story") || e.role.toLowerCase().includes("original")
              )?.node.name.full ??
              result.staff?.edges?.[0]?.node.name.full ??
              "";

            return (
              <div
                key={result.id}
                className="flex flex-col rounded-xl transition-colors"
                style={{
                  background: isExpanded
                    ? "rgba(99,141,255,0.06)"
                    : "rgba(24,24,27,0.6)",
                  border: isExpanded
                    ? "1px solid rgba(99,141,255,0.2)"
                    : "1px solid rgba(39,39,42,1)",
                }}
              >
                {/* Collapsed row (always visible, clickable to expand) */}
                <button
                  onClick={() => handleExpand(result.id)}
                  className="flex flex-row items-start gap-4 p-4 w-full text-left"
                >
                  {/* Cover */}
                  {result.coverImage?.large ? (
                    <div className="w-12 h-[68px] flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={result.coverImage.large}
                        alt={title}
                        width={48}
                        height={68}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-[68px] flex-shrink-0 rounded flex items-center justify-center"
                      style={{
                        background: "rgba(99,141,255,0.12)",
                        border: "1px solid rgba(99,141,255,0.2)",
                      }}
                    >
                      <span className="text-xs text-zinc-600">?</span>
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {title}
                    </p>
                    {result.title.romaji !== title && (
                      <p className="text-xs text-zinc-500 truncate">
                        {result.title.romaji}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {result.startDate?.year && (
                        <span className="text-xs text-zinc-500">
                          {result.startDate.year}
                        </span>
                      )}
                      {result.genres?.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status badge or chevron */}
                  <div className="flex-shrink-0 self-center">
                    {tracked ? (
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/40">
                        Tracked
                      </span>
                    ) : (
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                    {/* Synopsis */}
                    {result.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed pt-3 line-clamp-4">
                        {result.description.replace(/<[^>]*>/g, "")}
                      </p>
                    )}

                    {/* Author */}
                    {authorName && (
                      <p className="text-xs text-zinc-500">
                        By{" "}
                        <span className="text-zinc-400">{authorName}</span>
                      </p>
                    )}

                    {/* Adding controls (tier + status selector) */}
                    {isAdding && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Tier */}
                        <div className="flex gap-1">
                          {TIER_ORDER.map((t) => {
                            const cfg = TIER_CONFIG[t];
                            return (
                              <button
                                key={t}
                                onClick={() =>
                                  setSelectedTier(selectedTier === t ? null : t)
                                }
                                className="w-6 h-6 rounded text-[10px] font-black transition-all"
                                style={{
                                  backgroundColor:
                                    selectedTier === t
                                      ? cfg.bg
                                      : "rgba(39,39,42,0.5)",
                                  color:
                                    selectedTier === t ? cfg.colour : "#52525b",
                                  border:
                                    selectedTier === t
                                      ? `1px solid ${cfg.colour}60`
                                      : "1px solid rgba(63,63,70,0.5)",
                                }}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                        {/* Status */}
                        <select
                          value={selectedStatus}
                          onChange={(e) =>
                            setSelectedStatus(e.target.value as Status)
                          }
                          className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {/* Confirm / Cancel */}
                        <button
                          onClick={() => handleAdd(result)}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setAddingId(null);
                            setSelectedTier(null);
                            setSelectedStatus("planned");
                          }}
                          className="px-2.5 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tracked ? (
                        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/40">
                          Already tracked
                        </span>
                      ) : !isAdding ? (
                        <button
                          onClick={() => setAddingId(result.id)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/40 hover:bg-blue-900/50 transition-colors"
                        >
                          Add to Collection
                        </button>
                      ) : null}
                      {nyaaUrl && (
                        <a
                          href={nyaaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                          Find on Nyaa
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-sm">
            No results found for &quot;{query}&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
