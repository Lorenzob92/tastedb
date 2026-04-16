import { Tier } from "./types";

export const TIER_CONFIG: Record<Tier, { label: string; colour: string; bg: string }> = {
  S: { label: "Masterpiece", colour: "#e74c3c", bg: "rgba(231,76,60,0.12)" },
  A: { label: "Excellent", colour: "#e67e22", bg: "rgba(230,126,34,0.12)" },
  B: { label: "Good", colour: "#f39c12", bg: "rgba(243,156,18,0.10)" },
  C: { label: "Decent", colour: "#3498db", bg: "rgba(52,152,219,0.10)" },
  D: { label: "Disappointing", colour: "#9b59b6", bg: "rgba(155,89,182,0.10)" },
};

export const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];
