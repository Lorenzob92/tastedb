import { MediaEntry } from "@/lib/types";
import { MediaCard } from "@/components/media-card";

interface GridViewProps {
  entries: MediaEntry[];
}

export function GridView({ entries }: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {entries.map((entry) => (
        <MediaCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
