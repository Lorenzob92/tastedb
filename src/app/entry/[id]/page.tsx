"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore, fetchAniListDescription } from "@/lib/store";
import { getNyaaUrl } from "@/lib/nyaa";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/tier-config";
import { TierBadge } from "@/components/tier-badge";
import { Tier, Status } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  reading: "Reading",
  paused: "Paused",
  dropped: "Dropped",
  planned: "Planned",
};

const TYPE_LABELS: Record<string, string> = {
  manga: "Manga",
  anime: "Anime",
  movie: "Movie",
  game: "Game",
};

const STATUS_COLOURS: Record<string, string> = {
  completed: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  reading: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  paused: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  dropped: "bg-red-900/40 text-red-300 border border-red-700/40",
  planned: "bg-zinc-800 text-zinc-300 border border-zinc-700",
};

const TYPE_COLOURS: Record<string, string> = {
  manga: "bg-violet-900/40 text-violet-300 border border-violet-700/40",
  anime: "bg-sky-900/40 text-sky-300 border border-sky-700/40",
  movie: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  game: "bg-green-900/40 text-green-300 border border-green-700/40",
};

const ALL_STATUSES: Status[] = ["reading", "completed", "paused", "dropped", "planned"];

export default function EntryPage() {
  const params = useParams();
  const id = params.id as string;
  const { media, getEntry, updateEntry, ready } = useStore();
  const entry = getEntry(id);

  const [description, setDescription] = useState<string | null>(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  // Fetch description from AniList if not present
  useEffect(() => {
    if (!entry) return;
    if (entry.description) {
      setDescription(entry.description);
      return;
    }
    // Only fetch for manga/anime
    if (entry.type !== "manga" && entry.type !== "anime") return;
    setLoadingDesc(true);
    fetchAniListDescription(entry.title, entry.type).then((desc) => {
      if (desc) {
        setDescription(desc);
        updateEntry(entry.id, { description: desc });
      }
      setLoadingDesc(false);
    });
  }, [entry?.id, entry?.description, entry?.title, entry?.type]);

  // Sync notes
  useEffect(() => {
    if (entry) setNotesValue(entry.notes || "");
  }, [entry?.notes]);

  if (!ready) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
        <div className="max-w-3xl mx-auto flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#638dff] border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
        <div className="max-w-3xl mx-auto text-center py-24">
          <p className="text-zinc-500">Entry not found.</p>
          <Link href="/" className="text-sm text-blue-400 hover:underline mt-2 inline-block">
            Back to collection
          </Link>
        </div>
      </main>
    );
  }

  const related = media.filter(
    (e) => e.id !== entry.id && e.title === entry.title && e.type !== entry.type
  );

  const nyaaUrl = getNyaaUrl(entry.title, entry.type);
  const anilistUrl =
    entry.source === "anilist" && entry.sourceId
      ? `https://anilist.co/${entry.type === "anime" ? "anime" : "manga"}/${entry.sourceId}`
      : null;

  const tierConfig = entry.tier ? TIER_CONFIG[entry.tier] : null;

  const handleStatusChange = (status: Status) => {
    updateEntry(entry.id, { status });
  };

  const handleTierChange = (tier: Tier | null) => {
    updateEntry(entry.id, { tier: entry.tier === tier ? null : tier });
  };

  const handleNotesSave = () => {
    updateEntry(entry.id, { notes: notesValue });
    setEditingNotes(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-blue-400 transition-colors mb-6 sm:mb-8"
        >
          ← Back to collection
        </Link>

        {/* Main card */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            {entry.coverUrl ? (
              <div className="w-[200px] sm:w-48 rounded-lg overflow-hidden border border-zinc-800 shadow-xl">
                <Image
                  src={entry.coverUrl}
                  alt={`${entry.title} cover`}
                  width={192}
                  height={272}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-[200px] sm:w-48 h-[272px] rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm">
                No cover
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{entry.title}</h1>
              {entry.author && (
                <p className="mt-1 text-zinc-400 text-sm">{entry.author}</p>
              )}
            </div>

            {/* Current badges */}
            <div className="flex flex-wrap items-center gap-2">
              {entry.tier && (
                <>
                  <TierBadge tier={entry.tier} size="lg" />
                  {tierConfig && (
                    <span className="text-sm font-medium" style={{ color: tierConfig.colour }}>
                      {tierConfig.label}
                    </span>
                  )}
                </>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[entry.status] ?? "bg-zinc-800 text-zinc-300"}`}
              >
                {STATUS_LABELS[entry.status] ?? entry.status}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOURS[entry.type] ?? "bg-zinc-800 text-zinc-300"}`}
              >
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
            </div>

            {/* Status selector */}
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      entry.status === s
                        ? STATUS_COLOURS[s]
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier selector */}
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">Tier</p>
              <div className="flex flex-wrap gap-1.5">
                {TIER_ORDER.map((t) => {
                  const cfg = TIER_CONFIG[t];
                  const isActive = entry.tier === t;
                  return (
                    <button
                      key={t}
                      onClick={() => handleTierChange(t)}
                      className="w-9 h-9 rounded font-black text-sm transition-all"
                      style={{
                        backgroundColor: isActive ? cfg.bg : "rgba(39,39,42,0.5)",
                        color: isActive ? cfg.colour : "#71717a",
                        border: isActive
                          ? `1.5px solid ${cfg.colour}60`
                          : "1.5px solid rgba(63,63,70,0.5)",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genres */}
            {entry.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Year */}
            {entry.year > 0 && (
              <p className="text-sm text-zinc-500">{entry.year}</p>
            )}
          </div>
        </div>

        {/* Description / Synopsis */}
        <div className="mt-8">
          {loadingDesc ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <div className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
              Fetching synopsis from AniList...
            </div>
          ) : description ? (
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">Synopsis</h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-prose">
                {description.replace(/<[^>]*>/g, "")}
              </p>
            </div>
          ) : null}
        </div>

        {/* Notes */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Notes</h2>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {entry.notes ? "Edit" : "Add notes"}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full max-w-prose rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-blue-600 resize-y min-h-[80px]"
                placeholder="Add your thoughts..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNotesSave}
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNotesValue(entry.notes || "");
                    setEditingNotes(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : entry.notes ? (
            <div className="border border-zinc-800 rounded-lg px-4 py-3 bg-zinc-900/60 text-sm text-zinc-300 leading-relaxed max-w-prose">
              {entry.notes}
            </div>
          ) : (
            <p className="text-xs text-zinc-600">No notes yet.</p>
          )}
        </div>

        {/* Action links */}
        <div className="flex flex-wrap gap-3 mt-6">
          {nyaaUrl && (
            <a
              href={nyaaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-md border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colors"
            >
              Find on Nyaa
            </a>
          )}
          {anilistUrl && (
            <a
              href={anilistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              View on AniList
            </a>
          )}
        </div>

        {/* Related entries */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Related</h2>
            <div className="flex flex-wrap gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/entry/${rel.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-800 bg-zinc-900 hover:border-blue-700/60 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
                >
                  <span className="text-zinc-500">{TYPE_LABELS[rel.type] ?? rel.type}</span>
                  <span>{rel.title}</span>
                  {rel.tier && <TierBadge tier={rel.tier} size="sm" />}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
