"use client";

import { useState, useEffect } from "react";
import { Recommendation } from "@/lib/types";
import { useStore, fetchAniListDescription } from "@/lib/store";
import { getNyaaUrl } from "@/lib/nyaa";

interface RecCardProps {
  rec: Recommendation;
}

export default function InteractiveRecCard({ rec }: RecCardProps) {
  const { addToWishlist, isInCollection, addEntry, media } = useStore();
  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [justAdded, setJustAdded] = useState<"wishlist" | "reading" | null>(null);

  const inCollection = isInCollection(rec.title);
  const nyaaUrl = getNyaaUrl(rec.title, rec.type);

  // Fetch synopsis on expand
  useEffect(() => {
    if (!expanded || synopsis) return;
    if (rec.type !== "manga" && rec.type !== "anime") return;
    setLoadingSynopsis(true);
    fetchAniListDescription(rec.title, rec.type).then((desc) => {
      if (desc) setSynopsis(desc);
      setLoadingSynopsis(false);
    });
  }, [expanded, rec.title, rec.type, synopsis]);

  const handleAddToWishlist = () => {
    addToWishlist(rec);
    setJustAdded("wishlist");
  };

  const handleStartReading = () => {
    const slug = rec.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = `${slug}-${rec.type}`;
    addEntry({
      id,
      title: rec.title,
      type: rec.type,
      tier: null,
      status: "reading",
      notes: "",
      coverUrl: rec.coverUrl ?? "",
      author: "",
      genres: [],
      year: 0,
      source: "",
      sourceId: "",
      nyaaCategory: rec.type === "manga" ? "3_0" : rec.type === "anime" ? "1_0" : "",
      addedAt: new Date().toISOString(),
      description: "",
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
        {/* Cover image or placeholder */}
        {rec.coverUrl ? (
          <img
            src={rec.coverUrl}
            alt={rec.title}
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
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{rec.title}</p>
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
            {rec.reason}
          </p>
          <span className="text-xs text-zinc-400 capitalize mt-0.5">
            {rec.type}
          </span>
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
          {rec.matchScore}% match
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
          {/* Synopsis */}
          {loadingSynopsis ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-3">
              <div className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
              Loading synopsis...
            </div>
          ) : synopsis ? (
            <p className="text-xs text-zinc-400 leading-relaxed pt-3 line-clamp-4">
              {synopsis.replace(/<[^>]*>/g, "")}
            </p>
          ) : null}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {inCollection || justAdded ? (
              <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/40">
                {justAdded === "reading"
                  ? "Started reading ✓"
                  : justAdded === "wishlist"
                  ? "In wishlist ✓"
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
