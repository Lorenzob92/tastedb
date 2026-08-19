"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  JAPANESE_CATEGORIES,
  JAPANESE_LEVEL_ORDER,
  JAPANESE_PROGRESS_OPTIONS,
  JAPANESE_PROGRESS_STORAGE_KEY,
  isNewAddition,
  japaneseLearningTitles,
  type JapaneseCategory,
  type JapaneseLevel,
  type LearningProgress,
  type SubtitleEvidence,
} from "@/lib/japanese-learning";

const newAdditionCount = japaneseLearningTitles.filter(isNewAddition).length;

const LEVEL_STYLES: Record<JapaneseLevel, string> = {
  "N5/N4": "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  N4: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  "N4/N3": "border-violet-400/25 bg-violet-400/10 text-violet-300",
  N3: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  "N2/N1": "border-rose-400/25 bg-rose-400/10 text-rose-300",
};

type CategoryFilter = JapaneseCategory | "All";
type LevelFilter = JapaneseLevel | "All";
type ProgressFilter = LearningProgress | "All";
type SubtitleFilter = SubtitleEvidence | "All";

export function JapaneseLearningLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [level, setLevel] = useState<LevelFilter>("All");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("All");
  const [subtitleFilter, setSubtitleFilter] = useState<SubtitleFilter>("All");
  const [newOnly, setNewOnly] = useState(false);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});

  useEffect(() => {
    let storedProgress: Record<string, LearningProgress> | null = null;

    try {
      const stored = window.localStorage.getItem(JAPANESE_PROGRESS_STORAGE_KEY);
      if (stored) storedProgress = JSON.parse(stored) as Record<string, LearningProgress>;
    } catch {
      // A damaged or unavailable local store should not prevent the catalogue loading.
    }

    if (!storedProgress) return;

    const frame = window.requestAnimationFrame(() => setProgress(storedProgress));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const visibleTitles = useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase();

    return japaneseLearningTitles
      .filter((item) => {
        const itemProgress = progress[item.id] ?? "candidate";
        const matchesQuery =
          !normalisedQuery ||
          item.title.toLocaleLowerCase().includes(normalisedQuery) ||
          item.japaneseTitle.toLocaleLowerCase().includes(normalisedQuery) ||
          item.summary.toLocaleLowerCase().includes(normalisedQuery);

        return (
          matchesQuery &&
          (category === "All" || item.category === category) &&
          (level === "All" || item.level === level) &&
          (progressFilter === "All" || itemProgress === progressFilter) &&
          (subtitleFilter === "All" || item.subtitleEvidence === subtitleFilter) &&
          (!newOnly || isNewAddition(item))
        );
      })
      .sort((a, b) => a.priority - b.priority);
  }, [category, level, newOnly, progress, progressFilter, query, subtitleFilter]);

  const readyCount = Object.values(progress).filter(
    (value) => value === "ready" || value === "watching" || value === "watched",
  ).length;
  const watchedCount = Object.values(progress).filter((value) => value === "watched").length;

  return (
    <main className="w-full py-4 md:py-6">
      <header className="max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#638dff]">
          Japanese learning
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
          Watch with a purpose.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
          A curated path from approachable N4 material to demanding period drama. Filter by
          level, find dual-subtitle candidates, and track which titles you have prepared locally.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-3 border-y border-white/10 py-5 text-center sm:max-w-lg sm:text-left">
        <div>
          <p className="text-2xl font-black text-white">{japaneseLearningTitles.length}</p>
          <p className="mt-1 text-xs text-zinc-500">curated titles</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{readyCount}</p>
          <p className="mt-1 text-xs text-zinc-500">prepared</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{watchedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">watched</p>
        </div>
      </section>

      <section className="mt-10" aria-label="Catalogue filters">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search English or Japanese titles"
            className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#638dff]/60"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {newAdditionCount ? (
            <button
              type="button"
              onClick={() => setNewOnly((value) => !value)}
              aria-pressed={newOnly}
              className={`mr-1 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                newOnly
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-emerald-400/40 text-emerald-300 hover:border-emerald-400/70 hover:text-emerald-200"
              }`}
            >
              New ({newAdditionCount})
            </button>
          ) : null}

          {JAPANESE_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === item
                  ? "border-[#638dff] bg-[#638dff] text-white"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Level"
            value={level}
            onChange={(value) => setLevel(value as LevelFilter)}
            options={JAPANESE_LEVEL_ORDER.map((item) => ({ value: item, label: item }))}
          />
          <FilterSelect
            label="Preparation"
            value={progressFilter}
            onChange={(value) => setProgressFilter(value as ProgressFilter)}
            options={JAPANESE_PROGRESS_OPTIONS}
          />
          <FilterSelect
            label="Subtitles"
            value={subtitleFilter}
            onChange={(value) => setSubtitleFilter(value as SubtitleFilter)}
            options={[
              { value: "verified", label: "JA + EN verified" },
              { value: "english-only", label: "English release found" },
              { value: "unverified", label: "Needs checking" },
            ]}
          />
        </div>
      </section>

      <div className="mt-5 flex items-start justify-between gap-4 pb-5">
        <p className="text-sm text-zinc-500">
          Showing <span className="font-semibold text-zinc-300">{visibleTitles.length}</span> titles
        </p>
        <p className="max-w-md text-right text-xs leading-5 text-zinc-600">
          Preparation status is stored on this browser. Verified means official catalogue evidence
          for both languages, not every physical edition.
        </p>
      </div>

      <section aria-live="polite">
        {visibleTitles.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleTitles.map((item) => {
              const itemProgress = progress[item.id] ?? "candidate";
              const progressLabel = JAPANESE_PROGRESS_OPTIONS.find(
                (option) => option.value === itemProgress,
              )?.label;

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/japanese-learning/${item.id}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                      {item.posterUrl ? (
                        <Image
                          src={item.posterUrl}
                          alt={`${item.title} poster`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-3 text-center text-xs font-medium text-zinc-400">
                          {item.title}
                        </div>
                      )}

                      <div className="absolute right-1.5 top-1.5 rounded bg-black/70 p-1 backdrop-blur-sm">
                        <span
                          className={`block rounded border px-1.5 py-0.5 text-[11px] font-black ${LEVEL_STYLES[item.level]}`}
                        >
                          {item.level}
                        </span>
                      </div>

                      {isNewAddition(item) ? (
                        <span className="absolute left-1.5 top-1.5 rounded bg-emerald-400 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                          New
                        </span>
                      ) : null}

                      {itemProgress !== "candidate" ? (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          {progressLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <h2 className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-[#638dff]">
                        {item.title}
                      </h2>
                      <p className="truncate font-[family-name:var(--font-noto-jp)] text-xs text-zinc-500">
                        {item.japaneseTitle}
                      </p>
                      <p className="truncate text-[11px] text-zinc-600">
                        {item.category} · {item.year}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-semibold text-zinc-300">No matching titles.</p>
            <p className="mt-2 text-sm text-zinc-600">Try removing one of the filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-zinc-300 outline-none focus:border-[#638dff]/60"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
