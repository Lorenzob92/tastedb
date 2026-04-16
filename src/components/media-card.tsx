"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MediaEntry } from "@/lib/types";
import { TierBadge } from "@/components/tier-badge";

interface MediaCardProps {
  entry: MediaEntry;
}

export function MediaCard({ entry }: MediaCardProps) {
  const hasCover = entry.coverUrl && entry.coverUrl.length > 0;
  const tierGlow = entry.tier ? `tier-glow-${entry.tier}` : "";

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/entry/${entry.id}`} className="block group">
        <div
          className={`relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-zinc-900 ${tierGlow}`}
        >
          {hasCover ? (
            <Image
              src={entry.coverUrl}
              alt={entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-3 bg-gradient-to-b from-zinc-800 to-zinc-900">
              <span className="text-xs text-zinc-400 text-center leading-tight font-medium">
                {entry.title}
              </span>
            </div>
          )}

          {entry.tier && (
            <div className="absolute top-1.5 right-1.5">
              <TierBadge tier={entry.tier} size="sm" />
            </div>
          )}
        </div>

        <div className="mt-2 space-y-0.5">
          <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-[#638dff] transition-colors">
            {entry.title}
          </h3>
          <p className="text-xs text-zinc-500 truncate">
            {entry.author || entry.type} {entry.year ? `· ${entry.year}` : ""}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
