import Link from "next/link";
import Image from "next/image";
import { MediaEntry, Tier } from "@/lib/types";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import { groupByTier } from "@/lib/data";

interface TierViewProps {
  entries: MediaEntry[];
}

export function TierView({ entries }: TierViewProps) {
  const grouped = groupByTier(entries);

  return (
    <div className="space-y-2">
      {TIER_ORDER.map((tier) => {
        const items = grouped[tier];
        if (!items || items.length === 0) return null;
        const config = TIER_CONFIG[tier];

        return (
          <div
            key={tier}
            className="flex items-stretch gap-3 rounded-lg overflow-hidden border border-white/5"
          >
            {/* Tier badge column */}
            <div
              className="flex flex-col items-center justify-center w-14 shrink-0"
              style={{ backgroundColor: config.bg }}
            >
              <span
                className="text-2xl font-black"
                style={{ color: config.colour }}
              >
                {tier}
              </span>
            </div>

            {/* Thumbnails row */}
            <div className="flex flex-wrap items-center gap-1.5 py-2 flex-1 min-h-[5rem]">
              {items.map((entry) => {
                const hasCover = entry.coverUrl && entry.coverUrl.length > 0;

                return (
                  <Link
                    key={entry.id}
                    href={`/entry/${entry.id}`}
                    className="relative w-14 h-20 rounded overflow-hidden border border-white/10 shrink-0 group"
                  >
                    {hasCover ? (
                      <Image
                        src={entry.coverUrl}
                        alt={entry.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-zinc-700 to-zinc-800 flex items-center justify-center p-0.5">
                        <span className="text-[8px] text-zinc-400 text-center leading-tight">
                          {entry.title}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                      <span className="text-[8px] text-white text-center leading-tight">
                        {entry.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Count */}
            <div className="flex items-center pr-4">
              <span className="text-xs text-zinc-500 font-medium">
                {items.length}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
