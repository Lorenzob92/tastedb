"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import {
  JAPANESE_PROGRESS_OPTIONS,
  JAPANESE_PROGRESS_STORAGE_KEY,
  isNewAddition,
  type JapaneseLearningTitle,
  type LearningProgress,
} from "@/lib/japanese-learning";

const LEVEL_STYLES: Record<JapaneseLearningTitle["level"], string> = {
  "N5/N4": "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  N4: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  "N4/N3": "border-violet-400/25 bg-violet-400/10 text-violet-300",
  N3: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  "N2/N1": "border-rose-400/25 bg-rose-400/10 text-rose-300",
};

const SUBTITLE_LABELS = {
  verified: "Japanese and English subtitles verified",
  "english-only": "English-subtitled release found",
  unverified: "Subtitle availability still needs checking",
};

function isAnimeLike(item: JapaneseLearningTitle): boolean {
  return (
    /anime|animation|animated|stop-motion|children|preschool/i.test(item.format) ||
    ["whisper-of-the-heart", "secret-world-of-arrietty", "stand-by-me-doraemon"].includes(
      item.id,
    )
  );
}

function getNyaaSearchUrl(item: JapaneseLearningTitle): string {
  const category = isAnimeLike(item) ? "1_0" : "4_0";
  return `https://nyaa.si/?f=0&c=${category}&q=${encodeURIComponent(item.japaneseTitle || item.title)}`;
}

export function JapaneseLearningDetail({ item }: { item: JapaneseLearningTitle }) {
  const [progress, setProgress] = useState<LearningProgress>("candidate");

  useEffect(() => {
    let storedProgress: LearningProgress = "candidate";
    try {
      const stored = window.localStorage.getItem(JAPANESE_PROGRESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, LearningProgress>;
        storedProgress = parsed[item.id] ?? "candidate";
      }
    } catch {
      // Keep the default if browser storage is unavailable or damaged.
    }

    const frame = window.requestAnimationFrame(() => setProgress(storedProgress));
    return () => window.cancelAnimationFrame(frame);
  }, [item.id]);

  function updateProgress(value: LearningProgress) {
    setProgress(value);
    try {
      const stored = window.localStorage.getItem(JAPANESE_PROGRESS_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, LearningProgress>) : {};
      window.localStorage.setItem(
        JAPANESE_PROGRESS_STORAGE_KEY,
        JSON.stringify({ ...parsed, [item.id]: value }),
      );
    } catch {
      // The selection still works for this session if storage is unavailable.
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/japanese-learning"
        className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-[#638dff]"
      >
        ← Back to Japanese Learning
      </Link>

      <div className="mt-8 grid gap-8 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[260px] sm:mx-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={`${item.title} poster`}
                fill
                priority
                sizes="(max-width: 640px) 260px, 220px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-5 text-center text-sm text-zinc-600">
                Artwork unavailable
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-700">
            Artwork metadata from {item.anilistUrl ? "AniList" : "TMDB"}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-xs font-bold ${LEVEL_STYLES[item.level]}`}
            >
              {item.level}
            </span>
            <span className="rounded border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
              {item.category}
            </span>
            {isNewAddition(item) ? (
              <span className="rounded bg-emerald-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black">
                New
              </span>
            ) : null}
            <span className="text-xs text-zinc-600">Learning order #{item.priority}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
            {item.title}
          </h1>
          <p className="mt-2 font-[family-name:var(--font-noto-jp)] text-xl text-zinc-400">
            {item.japaneseTitle}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            {item.format} · {item.year}
          </p>

          <label className="mt-7 block max-w-xs">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Your status
            </span>
            <select
              value={progress}
              onChange={(event) => updateProgress(event.target.value as LearningProgress)}
              className="h-11 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-zinc-200 outline-none focus:border-[#638dff]/60"
            >
              {JAPANESE_PROGRESS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <section className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Language fit
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">{item.summary}</p>
          </section>
        </div>
      </div>

      <section className="mt-10 border-t border-white/10 pt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Synopsis</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
          {item.synopsis ?? item.summary}
        </p>
      </section>

      <section className="mt-10 border-t border-white/10 pt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Subtitles and sources
        </h2>
        <p className="mt-3 text-sm text-zinc-400">{SUBTITLE_LABELS[item.subtitleEvidence]}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#638dff] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#4f7aff]"
            >
              Check official source <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
          <a
            href={getNyaaSearchUrl(item)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-[#638dff]/60 hover:text-white"
          >
            <Search aria-hidden="true" className="h-4 w-4" /> Search Nyaa
          </a>
          {item.tmdbUrl || item.anilistUrl ? (
            <a
              href={item.anilistUrl ?? item.tmdbUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-2 py-2.5 text-sm text-zinc-500 transition-colors hover:text-white"
            >
              View on {item.anilistUrl ? "AniList" : "TMDB"}
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-5 text-zinc-600">
          Nyaa results are not guaranteed, especially for children&apos;s programmes and older
          live-action titles. Confirm that your edition and subtitle files match before preparing
          the language pack.
        </p>
      </section>
    </main>
  );
}
