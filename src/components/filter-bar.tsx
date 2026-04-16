"use client";

import { useState, useCallback } from "react";
import { MediaType, Status, ViewMode } from "@/lib/types";
import { LayoutGrid, List, BookOpen, Layers, Share2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface FilterBarProps {
  types: MediaType[];
  activeType: MediaType | null;
  onTypeChange: (type: MediaType | null) => void;
  activeStatus: Status | null;
  onStatusChange: (status: Status | null) => void;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const TYPE_LABELS: Record<MediaType, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movies",
  game: "Games",
};

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "reading", label: "Reading" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
  { value: "planned", label: "Planned" },
];

const VIEW_OPTIONS: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "grid", icon: LayoutGrid, label: "Grid" },
  { mode: "tiers", icon: Layers, label: "Tiers" },
  { mode: "list", icon: List, label: "List" },
  { mode: "shelf", icon: BookOpen, label: "Shelf" },
];

export function FilterBar({
  types,
  activeType,
  onTypeChange,
  activeStatus,
  onStatusChange,
  activeView,
  onViewChange,
  search,
  onSearchChange,
}: FilterBarProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const username =
      (user?.user_metadata?.username as string) || "unknown";
    const url = `https://app-nu-blond-24.vercel.app/share/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [user]);

  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Row 1: type filters + search + view toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTypeChange(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeType === null
                ? "bg-[#638dff]/20 text-[#638dff] border border-[#638dff]/30"
                : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeType === type
                  ? "bg-[#638dff]/20 text-[#638dff] border border-[#638dff]/30"
                  : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="px-3 py-1.5 rounded-md text-xs bg-white/5 border border-white/5 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#638dff]/30 w-40 transition-colors"
        />

        <div className="flex items-center gap-1 ml-1">
          {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              title={label}
              className={`p-1.5 rounded-md transition-colors ${
                activeView === mode
                  ? "bg-[#638dff]/20 text-[#638dff]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {activeView === "tiers" && (
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ml-1 ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#638dff]/20 text-[#638dff] border border-[#638dff]/30 hover:bg-[#638dff]/30"
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? "Link copied!" : "Share"}
          </button>
        )}
      </div>

      {/* Row 2: status filters */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onStatusChange(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeStatus === null
              ? "bg-[#638dff]/20 text-[#638dff] border border-[#638dff]/30"
              : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
          }`}
        >
          All statuses
        </button>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStatusChange(activeStatus === value ? null : value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeStatus === value
                ? "bg-[#638dff]/20 text-[#638dff] border border-[#638dff]/30"
                : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
