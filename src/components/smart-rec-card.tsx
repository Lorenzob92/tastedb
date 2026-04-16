"use client";

import { useState } from "react";
import { SmartRecommendation } from "@/lib/recommendations";
import { useStore } from "@/lib/store";
import { getNyaaUrl } from "@/lib/nyaa";

interface SmartRecCardProps {
  rec: SmartRecommendation;
}

const SOURCE_LABELS: Record<SmartRecommendation["source"], string> = {
  community: "Community",
  genre: "Genre",
  author: "Author",
};

const SOURCE_COLOURS: Record<SmartRecommendation["source"], string> = {
  community: "#638dff",
  genre: "#6ee7b7",
  author: "#fbbf24",
};

export default function SmartRecCard({ rec }: SmartRecCardProps) {
  const { addSmartToWishlist, isInCollection, addEntry } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [justAdded, setJustAdded] = useState<"wishlist" | "reading" | null>(
    null
  );

  const displayTitle = rec.titleEnglish ?? rec.title;
  const inCollection = isInCollection(displayTitle) || isInCollection(rec.title);
  const nyaaUrl = getNyaaUrl(displayTitle, rec.type);
  const sourceColour = SOURCE_COLOURS[rec.source];

  const handleAddToWishlist = () => {
    addSmartToWishlist(rec);
    setJustAdded("wishlist");
  };

  const handleStartReading = () => {
    const slug = displayTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = `${slug}-${rec.type}`;
    addEntry({
      id,
      title: displayTitle,
      type: rec.type,
      tier: null,
      status: "reading",
      notes: rec.reasons.join("; "),
      coverUrl: rec.coverUrl ?? "",
      author: rec.author ?? "",
      genres: rec.genres ?? [],
      year: rec.year ?? 0,
      source: "anilist",
      sourceId: String(rec.id),
      nyaaCategory:
        rec.type === "manga" ? "3_0" : rec.type === "anime" ? "1_0" : "",
      addedAt: new Date().toISOString(),
      description: rec.description ?? "",
    });
    setJustAdded("reading");
  };

  return (
    <div
      className="flex flex-col rounded-xl transition-colors"
      style={{
        background: "rgba(99,141,255,0.06)",
        border: "1px solid rgba(99,141,255,0.2)",
      }}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex flex-row items-start gap-4 p-4 w-full text-left"
      >
        {/* Cover */}
        {rec.coverUrl ? (
          <img
            src={rec.coverUrl}
            alt={displayTitle}
            width={48}
            height={68}
            className="rounded object-cover flex-shrink-0"
            style={{ width: 48, height: 68 }}
          />
        ) : (
          <div
            className="flex-shrink-0 rounded flex items-center justify-center"
            style={{
              width: 48,
              height: 68,
              background: "rgba(99,141,255,0.12)",
              border: "1px solid rgba(99,141,255,0.2)",
            }}
          >
            <span className="text-xs text-zinc-600 select-none">?</span>
          </div>
        )}

        {/* Text content */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">
              {displayTitle}
            </p>
            {/* Source label */}
            <span
              className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: `${sourceColour}20`,
                color: sourceColour,
                border: `1px solid ${sourceColour}40`,
              }}
            >
              {SOURCE_LABELS[rec.source]}
            </span>
          </div>

          {/* Reason tags */}
          <div className="flex flex-wrap gap-1">
            {rec.reasons.slice(0, 2).map((reason, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700/50 truncate max-w-[200px]"
              >
                {reason}
              </span>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="capitalize">{rec.type}</span>
            {rec.year > 0 && (
              <>
                <span className="text-zinc-700">|</span>
                <span>{rec.year}</span>
              </>
            )}
            {rec.averageScore > 0 && (
              <>
                <span className="text-zinc-700">|</span>
                <span style={{ color: "#638dff" }}>
                  {rec.averageScore}% on AniList
                </span>
              </>
            )}
          </div>
        </div>

        {/* Match score badge */}
        <div
          className="flex-shrink-0 self-center px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(99,141,255,0.15)",
            border: "1px solid rgba(99,141,255,0.35)",
            color: "#8aabff",
          }}
        >
          {rec.matchScore}%
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
          {/* Genres */}
          {rec.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-3">
              {rec.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 bg-zinc-800/80 border border-zinc-700/40"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {rec.description && (
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">
              {rec.description}
            </p>
          )}

          {/* All reasons */}
          {rec.reasons.length > 2 && (
            <div className="flex flex-wrap gap-1">
              {rec.reasons.slice(2).map((reason, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700/50"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Author */}
          {rec.author && (
            <p className="text-[11px] text-zinc-500">
              By <span className="text-zinc-400">{rec.author}</span>
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {inCollection || justAdded ? (
              <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/40">
                {justAdded === "reading"
                  ? `Started ${rec.type === "anime" ? "watching" : "reading"}`
                  : justAdded === "wishlist"
                  ? "In wishlist"
                  : "Already tracked"}
              </span>
            ) : (
              <>
                <button
                  onClick={handleAddToWishlist}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-blue-600 hover:text-blue-400 transition-colors"
                >
                  Add to Wishlist
                </button>
                <button
                  onClick={handleStartReading}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/40 hover:bg-blue-900/50 transition-colors"
                >
                  Start {rec.type === "anime" ? "Watching" : "Reading"}
                </button>
              </>
            )}
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
}
