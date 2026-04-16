"use client";

import { useState, useMemo } from "react";
import { MediaType, Status, ViewMode } from "@/lib/types";
import { filterMedia, getMediaTypes } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CoverCollage } from "@/components/cover-collage";
import { FilterBar } from "@/components/filter-bar";
import { GridView } from "@/components/grid-view";
import { TierView } from "@/components/tier-view";
import { ListView } from "@/components/list-view";
import { ShelfView } from "@/components/shelf-view";

export default function CollectionPage() {
  const { media: allMedia, ready } = useStore();
  const [activeType, setActiveType] = useState<MediaType | null>(null);
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  const availableTypes = useMemo(() => getMediaTypes(allMedia), [allMedia]);

  const filtered = useMemo(
    () =>
      filterMedia(allMedia, {
        type: activeType ?? undefined,
        status: activeStatus ?? undefined,
        search: search || undefined,
      }),
    [allMedia, activeType, activeStatus, search]
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <CoverCollage entries={allMedia} />

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">
          My <span className="text-[#638dff]">Collection</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <FilterBar
        types={availableTypes}
        activeType={activeType}
        onTypeChange={setActiveType}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        activeView={activeView}
        onViewChange={setActiveView}
        search={search}
        onSearchChange={setSearch}
      />

      {activeView === "grid" && <GridView entries={filtered} />}
      {activeView === "tiers" && <TierView entries={filtered} />}
      {activeView === "list" && <ListView entries={filtered} />}
      {activeView === "shelf" && <ShelfView entries={filtered} />}
    </>
  );
}
