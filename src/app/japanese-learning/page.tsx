import type { Metadata } from "next";
import { JapaneseLearningLibrary } from "@/components/japanese-learning-library";

export const metadata: Metadata = {
  title: "Japanese Learning | TasteDB",
  description: "A levelled Japanese film and television learning watchlist.",
};

export default function JapaneseLearningPage() {
  return <JapaneseLearningLibrary />;
}
