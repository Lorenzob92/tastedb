"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SmartRecommendation } from "@/lib/recommendations";
import InteractiveRecCard from "@/components/rec-card";
import SmartRecCard from "@/components/smart-rec-card";

export default function RecommendationsPage() {
  const {
    recommendations: staticRecs,
    smartRecs,
    isGeneratingRecs,
    recsProgress,
    refreshRecommendations,
    ready,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"smart" | "static">("smart");

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group smart recs by source
  const communityRecs = smartRecs.filter((r) => r.source === "community");
  const genreRecs = smartRecs.filter((r) => r.source === "genre");
  const authorRecs = smartRecs.filter((r) => r.source === "author");

  return (
    <div className="max-w-2xl mx-auto px-0 sm:px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          <span style={{ color: "#638dff" }}>Smart</span> Recommendations
        </h1>
        <p className="text-sm text-zinc-500">
          Powered by AniList community data and your taste profile.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => refreshRecommendations(false)}
          disabled={isGeneratingRecs}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: "rgba(99,141,255,0.15)",
            border: "1px solid rgba(99,141,255,0.35)",
            color: "#8aabff",
          }}
        >
          {isGeneratingRecs ? "Generating..." : smartRecs.length > 0 ? "Generate Recommendations" : "Generate Recommendations"}
        </button>
        {smartRecs.length > 0 && (
          <button
            onClick={() => refreshRecommendations(true)}
            disabled={isGeneratingRecs}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
          >
            Refresh (clear cache)
          </button>
        )}
      </div>

      {/* Progress indicator */}
      {isGeneratingRecs && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: "rgba(99,141,255,0.05)",
            border: "1px solid rgba(99,141,255,0.15)",
          }}
        >
          <div className="w-4 h-4 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-zinc-400">{recsProgress}</p>
        </div>
      )}

      {/* Tabs */}
      {smartRecs.length > 0 && (
        <div className="flex gap-1 p-1 rounded-lg bg-zinc-900 w-fit">
          <button
            onClick={() => setActiveTab("smart")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "smart"
                ? "bg-[#638dff]/20 text-[#8aabff]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Smart ({smartRecs.length})
          </button>
          <button
            onClick={() => setActiveTab("static")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "static"
                ? "bg-[#638dff]/20 text-[#8aabff]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Curated ({staticRecs.length})
          </button>
        </div>
      )}

      {/* Smart recommendations, grouped */}
      {activeTab === "smart" && smartRecs.length > 0 && (
        <div className="space-y-8">
          {communityRecs.length > 0 && (
            <RecSection
              title="Community Picks"
              subtitle="Recommended by AniList users who love the same titles"
              recs={communityRecs}
            />
          )}
          {authorRecs.length > 0 && (
            <RecSection
              title="From Favourite Authors"
              subtitle="More work by creators you rated S or A tier"
              recs={authorRecs}
            />
          )}
          {genreRecs.length > 0 && (
            <RecSection
              title="Genre Matches"
              subtitle="Highly rated titles matching your top genres"
              recs={genreRecs}
            />
          )}
        </div>
      )}

      {/* Static/curated tab */}
      {activeTab === "static" && (
        <div className="space-y-3">
          {staticRecs.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center space-y-3"
              style={{
                background: "rgba(99,141,255,0.05)",
                border: "1px solid rgba(99,141,255,0.15)",
              }}
            >
              <p className="text-zinc-400 text-sm font-medium">
                No curated recommendations available.
              </p>
            </div>
          ) : (
            staticRecs.map((rec, i) => (
              <InteractiveRecCard key={`${rec.title}-${i}`} rec={rec} />
            ))
          )}
        </div>
      )}

      {/* Empty state when no smart recs and on smart tab */}
      {activeTab === "smart" && smartRecs.length === 0 && !isGeneratingRecs && (
        <div
          className="rounded-xl p-8 text-center space-y-3"
          style={{
            background: "rgba(99,141,255,0.05)",
            border: "1px solid rgba(99,141,255,0.15)",
          }}
        >
          <p className="text-zinc-400 text-sm font-medium">
            No smart recommendations yet.
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed">
            Click "Generate Recommendations" to analyse your collection and
            discover new titles based on your taste profile.
          </p>
        </div>
      )}
    </div>
  );
}

function RecSection({
  title,
  subtitle,
  recs,
}: {
  title: string;
  subtitle: string;
  recs: SmartRecommendation[];
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {recs.map((rec) => (
          <SmartRecCard key={rec.id} rec={rec} />
        ))}
      </div>
    </div>
  );
}
