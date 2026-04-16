import { Recommendation } from "@/lib/types";

interface RecCardProps {
  rec: Recommendation;
}

export default function RecCard({ rec }: RecCardProps) {
  return (
    <div
      className="flex flex-row items-start gap-4 p-4 rounded-xl"
      style={{
        background: "rgba(99,141,255,0.06)",
        border: "1px solid rgba(99,141,255,0.2)",
      }}
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
    </div>
  );
}
