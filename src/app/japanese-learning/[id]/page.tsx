import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JapaneseLearningDetail } from "@/components/japanese-learning-detail";
import { japaneseLearningTitles } from "@/lib/japanese-learning";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return japaneseLearningTitles.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = japaneseLearningTitles.find((candidate) => candidate.id === id);

  if (!item) return { title: "Japanese title not found | TasteDB" };

  return {
    title: `${item.title} | Japanese Learning | TasteDB`,
    description: item.synopsis ?? item.summary,
    openGraph: item.posterUrl ? { images: [item.posterUrl] } : undefined,
  };
}

export default async function JapaneseLearningTitlePage({ params }: Props) {
  const { id } = await params;
  const item = japaneseLearningTitles.find((candidate) => candidate.id === id);

  if (!item) notFound();

  return <JapaneseLearningDetail item={item} />;
}
