"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MediaEntry, Tier } from "@/lib/types";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import { TierBadge } from "@/components/tier-badge";
import { groupByTier } from "@/lib/data";

interface ShelfViewProps {
  entries: MediaEntry[];
}

const SPINE_GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f0f23, #1a1a3e)",
  "linear-gradient(135deg, #1c1c2e, #2a1a3e)",
  "linear-gradient(135deg, #0e1a2e, #1a2a3e)",
  "linear-gradient(135deg, #1a1e2e, #2e1a2e)",
  "linear-gradient(135deg, #121228, #1e1e38)",
  "linear-gradient(135deg, #181830, #0e1e30)",
  "linear-gradient(135deg, #201620, #181838)",
];

export function ShelfView({ entries }: ShelfViewProps) {
  const grouped = groupByTier(entries);

  return (
    <div className="space-y-6">
      {TIER_ORDER.map((tier) => {
        const items = grouped[tier];
        if (!items || items.length === 0) return null;
        const config = TIER_CONFIG[tier];

        return (
          <div key={tier}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <TierBadge tier={tier} size="md" />
              <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                {config.label}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-600">({items.length})</span>
            </div>

            {/* Shelf */}
            <div className="relative">
              {/* Books row */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {items.map((entry, i) => {
                  const hasCover =
                    entry.coverUrl && entry.coverUrl.length > 0;
                  const gradient =
                    SPINE_GRADIENTS[i % SPINE_GRADIENTS.length];

                  return (
                    <motion.div
                      key={entry.id}
                      whileHover={{ y: -16, scale: 1.05, zIndex: 10 }}
                      transition={{ duration: 0.2 }}
                      className="relative shrink-0"
                    >
                      <Link
                        href={`/entry/${entry.id}`}
                        className="block relative rounded overflow-hidden group w-[40px] h-[130px] sm:w-[52px] sm:h-[160px]"
                      >
                        {hasCover ? (
                          <Image
                            src={entry.coverUrl}
                            alt={entry.title}
                            fill
                            className="object-cover"
                            sizes="52px"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: gradient }}
                          >
                            <span
                              className="text-[9px] text-zinc-300/80 font-medium text-center px-0.5"
                              style={{
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                              }}
                            >
                              {entry.title.length > 20
                                ? entry.title.slice(0, 20) + "..."
                                : entry.title}
                            </span>
                          </div>
                        )}

                        {/* Left edge shadow for 3D effect */}
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

                        {/* Hover title overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                          <span className="text-[8px] text-white text-center leading-tight">
                            {entry.title}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Shelf surface */}
              <div
                className="h-3 rounded-b"
                style={{
                  background:
                    "linear-gradient(180deg, #1a1a24, #12121c)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
