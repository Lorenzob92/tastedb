"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MediaEntry } from "@/lib/types";

interface CoverCollageProps {
  entries: MediaEntry[];
}

const ROTATIONS = [-6, 3, -2, 5, -4, 2, -5, 4, -3, 6, -1, 3];

export function CoverCollage({ entries }: CoverCollageProps) {
  const covers = entries
    .filter(
      (e) =>
        (e.tier === "S" || e.tier === "A") &&
        e.coverUrl &&
        e.coverUrl.length > 0
    )
    .slice(0, 12);

  if (covers.length === 0) return null;

  return (
    <div className="relative h-48 overflow-hidden rounded-xl mb-8">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 p-3">
        {covers.map((entry, i) => (
          <motion.div
            key={entry.id}
            className="relative aspect-[3/4] rounded-md overflow-hidden"
            style={{ rotate: ROTATIONS[i % ROTATIONS.length] }}
            whileHover={{ scale: 1.15, rotate: 0, zIndex: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={entry.coverUrl}
              alt={entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, (max-width: 1024px) 12vw, 8vw"
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #0a0a12)",
        }}
      />
    </div>
  );
}
