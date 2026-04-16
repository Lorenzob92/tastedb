import Link from "next/link";
import Image from "next/image";
import { MediaEntry } from "@/lib/types";
import { TierBadge } from "@/components/tier-badge";

interface ListViewProps {
  entries: MediaEntry[];
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  reading: "Reading",
  paused: "Paused",
  dropped: "Dropped",
  planned: "Planned",
};

export function ListView({ entries }: ListViewProps) {
  return (
    <div className="space-y-0 border border-white/5 rounded-lg overflow-hidden">
      {entries.map((entry, i) => {
        const hasCover = entry.coverUrl && entry.coverUrl.length > 0;

        return (
          <Link
            key={entry.id}
            href={`/entry/${entry.id}`}
            className={`flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] transition-colors group ${
              i > 0 ? "border-t border-white/5" : ""
            }`}
          >
            {/* Cover */}
            <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 border border-white/10">
              {hasCover ? (
                <Image
                  src={entry.coverUrl}
                  alt={entry.title}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
            </div>

            {/* Title */}
            <span className="text-sm font-semibold text-zinc-200 group-hover:text-[#638dff] transition-colors truncate min-w-0 flex-1">
              {entry.title}
            </span>

            {/* Author/type */}
            <span className="text-xs text-zinc-500 truncate hidden sm:block w-32 shrink-0">
              {entry.author || entry.type}
            </span>

            {/* Year */}
            <span className="text-xs text-zinc-600 w-10 shrink-0 hidden md:block">
              {entry.year || ""}
            </span>

            {/* Genre */}
            <span className="text-xs text-zinc-600 w-20 truncate shrink-0 hidden lg:block">
              {entry.genres[0] || ""}
            </span>

            {/* Status */}
            <span className="text-xs text-zinc-500 w-16 shrink-0 hidden sm:block">
              {STATUS_LABELS[entry.status] || entry.status}
            </span>

            {/* Tier */}
            <div className="shrink-0">
              <TierBadge tier={entry.tier} size="sm" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
