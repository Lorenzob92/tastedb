"use client";

import Image from "next/image";
import seedMedia from "../../data/media.json";

const ROTATIONS = [-6, 3, -2, 5, -4, 2, -5, 4, -3, 6, -1, 3, -7, 1, -3, 5];

/**
 * Full-screen manga cover collage used as the background on auth pages.
 * Pulls covers from seed data, dimmed and slightly blurred.
 */
export function AuthCollageBg() {
  const covers = (seedMedia as Array<{ coverUrl?: string; title: string }>)
    .filter((e) => e.coverUrl && e.coverUrl.length > 0)
    .slice(0, 60);

  if (covers.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.15, filter: "blur(1px)" }}
    >
      <div
        className="grid gap-1 p-1 h-full w-full"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gridAutoRows: "180px",
        }}
      >
        {covers.map((entry, i) => (
          <div
            key={`${entry.title}-${i}`}
            className="relative overflow-hidden rounded-sm"
            style={{
              transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg) scale(1.1)`,
            }}
          >
            <Image
              src={entry.coverUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
              priority={i < 12}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
