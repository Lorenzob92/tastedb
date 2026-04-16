"use client";

import { useStore } from "@/lib/store";
import InteractiveRecCard from "@/components/rec-card";

export default function RecommendationsPage() {
  const { recommendations: recs, ready } = useStore();

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          <span style={{ color: "#638dff" }}>AI</span> Recommendations
        </h1>
        <p className="text-sm text-zinc-500">
          Titles matched to your taste profile based on your tier ratings and
          genre preferences.
        </p>
      </div>

      {/* Content */}
      {recs.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center space-y-3"
          style={{
            background: "rgba(99,141,255,0.05)",
            border: "1px solid rgba(99,141,255,0.15)",
          }}
        >
          <p className="text-zinc-400 text-sm font-medium">
            No recommendations yet.
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed">
            Run the recommend script to generate personalised suggestions based
            on your taste profile.
          </p>
          <code className="block text-xs text-zinc-500 bg-zinc-900 rounded px-3 py-2 mx-auto w-fit">
            npm run recommend
          </code>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec, i) => (
            <InteractiveRecCard key={`${rec.title}-${i}`} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
