import { Tier } from "@/lib/types";
import { TIER_CONFIG } from "@/lib/tier-config";

interface TierBadgeProps {
  tier: Tier | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-5 h-5 text-[10px]",
  md: "w-7 h-7 text-xs",
  lg: "w-10 h-10 text-base",
};

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  if (!tier) return null;

  const config = TIER_CONFIG[tier];

  return (
    <span
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded font-black`}
      style={{
        backgroundColor: config.bg,
        color: config.colour,
        border: `1.5px solid ${config.colour}40`,
      }}
    >
      {tier}
    </span>
  );
}
