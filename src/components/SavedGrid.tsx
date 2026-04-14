"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MusicCard from "./MusicCard";
import MaintenanceScreen from "./MaintenanceScreen";
import { useTranslation } from "./LanguageProvider";
import type { CardData } from "@/lib/types";

type SavedFilterType = "all" | "tracks" | "samples" | "mixes" | "deleted";

function inferTrackType(card: CardData): "tracks" | "samples" | "mixes" {
  if (card.duration && card.duration >= 2400) return "mixes";
  if (card.duration && card.duration <= 240) return "samples";
  return "tracks";
}

interface SavedGridProps {
  cards: CardData[];
  loading: boolean;
  likedIds: Set<string>;
  softDeletedIds?: Set<string>;
  playingId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onToggleLike: (id: string) => void;
  activeTagFilters?: string[];
  isAuthenticated?: boolean;
  onCardsLoaded?: (cards: CardData[]) => void;
  recentlyRemoved?: (CardData & { deletedAt: string })[];
  onRestoreRemoved?: (id: string) => void;
  onHardDelete?: (id: string) => void;
  onClearAllRemoved?: () => void;
  onFilterChange?: (filter: SavedFilterType) => void;
}

function daysLeft(deletedAt: string): string {
  const expiry = new Date(deletedAt).getTime() + 7 * 86400000;
  const remaining = Math.max(0, expiry - Date.now());
  const days = Math.ceil(remaining / 86400000);
  if (days <= 0) return "<1d";
  return `${days}d`;
}

export default function SavedGrid({
  cards,
  loading,
  likedIds,
  softDeletedIds,
  playingId,
  isPlaying,
  onPlay,
  onToggleLike,
  activeTagFilters = [],
  isAuthenticated = true,
  onCardsLoaded,
  recentlyRemoved = [],
  onRestoreRemoved,
  onHardDelete,
  onClearAllRemoved,
  onFilterChange,
}: SavedGridProps) {
  const { t } = useTranslation();
  const [removedOpen, setRemovedOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SavedFilterType>("all");

  const tracks = cards.filter((c) => inferTrackType(c) === "tracks");
  const samples = cards.filter((c) => inferTrackType(c) === "samples");
  const mixes = cards.filter((c) => inferTrackType(c) === "mixes");

  const handleFilterChange = (filter: SavedFilterType) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
    if (filter === "deleted") setRemovedOpen(true);
  };

  const filteredCards = activeFilter === "all" ? cards
    : activeFilter === "tracks" ? tracks
    : activeFilter === "samples" ? samples
    : activeFilter === "mixes" ? mixes
    : [];  // "deleted" → empty (trash tab shows recentlyRemoved list, not cards)

  useEffect(() => {
    const allCards = [...cards, ...recentlyRemoved.map(({ deletedAt: _, ...c }) => c)];
    if (allCards.length > 0 && onCardsLoaded) onCardsLoaded(allCards);
  }, [cards, recentlyRemoved, onCardsLoaded]);

  const shareCard = async (card: CardData) => {
    const url = card.youtubeUrl || "";
    if (navigator.share) {
      await navigator.share({ title: `${card.name} — ${card.artist}`, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="dot-grid grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-[11px] p-2 sm:p-[11px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-square skeleton-shimmer rounded-md" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg className="w-12 h-12 text-[var(--text-muted)] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <p className="font-mono text-sm text-[var(--text-muted)]">{t("saved.signInToSave")}</p>
      </div>
    );
  }

  const hasNoContent = cards.length === 0 && recentlyRemoved.length === 0;

  if (hasNoContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg className="w-12 h-12 text-[var(--text-muted)] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <p className="font-mono text-sm text-[var(--text-muted)] uppercase">{t("saved.noSavedYet")}</p>
      </div>
    );
  }

  const renderGrid = (items: CardData[]) => (
    <div className="dot-grid grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-[11px] p-2 sm:p-[11px]">
      <AnimatePresence>
        {items.map((card) => (
          <motion.div
            key={card.id}
            layout
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <MusicCard
              card={card}
              saved={likedIds.has(card.id)}
              isGracePeriod={softDeletedIds?.has(card.id)}
              isPlaying={playingId === card.id && isPlaying}
              activeTagFilters={activeTagFilters}
              viewContext="saved"
              onPlay={() => onPlay(card.id)}
              onSave={() => onToggleLike(card.id)}
              onShare={() => shareCard(card)}
              isAuthenticated={isAuthenticated}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const filterTabs: { key: SavedFilterType; label: string; count: number }[] = [
    { key: "all", label: t("saved.all"), count: cards.length },
    { key: "tracks", label: t("saved.tracks"), count: tracks.length },
    { key: "mixes", label: t("saved.mixes"), count: mixes.length },
    { key: "samples", label: t("saved.samples"), count: samples.length },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      {cards.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 sm:px-[11px] pt-2 pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-[var(--text)] text-[var(--bg)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          {recentlyRemoved.length > 0 && (
            <button
              onClick={() => handleFilterChange("deleted")}
              className={`ml-auto px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === "deleted"
                  ? "bg-[var(--text)] text-[var(--bg)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
              }`}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" /><path d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
              </svg>
              ({recentlyRemoved.length})
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {cards.length > 0 && activeFilter === "all" ? (
        <>
          {tracks.length > 0 && renderGrid(tracks)}
          {mixes.length > 0 && renderGrid(mixes)}
          {samples.length > 0 && renderGrid(samples)}
        </>
      ) : cards.length > 0 && filteredCards.length > 0 ? (
        renderGrid(filteredCards)
      ) : activeFilter !== "all" && activeFilter !== "deleted" && filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          {activeFilter === "tracks" && (
            <svg className="w-12 h-12 text-[var(--text-muted)]/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          )}
          {activeFilter === "samples" && (
            <svg className="w-12 h-12 text-[var(--text-muted)]/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="6.5" strokeDasharray="2 3" />
            </svg>
          )}
          {activeFilter === "mixes" && (
            <svg className="w-12 h-12 text-[var(--text-muted)]/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="4" height="12" rx="1" /><rect x="10" y="3" width="4" height="18" rx="1" /><rect x="18" y="8" width="4" height="8" rx="1" />
            </svg>
          )}
          <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
            {t("saved.noSavedFilter", { filter: activeFilter })}
          </p>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-2">
            {t("saved.discoverMore", { tab: activeFilter === "tracks" ? t("nav.forYou") : activeFilter === "samples" ? t("saved.samples") : t("saved.mixes") })}
          </p>
        </div>
      ) : null}

      {/* Recently removed section — only on "deleted" tab */}
      {recentlyRemoved.length > 0 && activeFilter === "deleted" && (
        <div className="mt-2 mx-2 sm:mx-[11px] mb-2">
          {/* Collapsible header */}
          <button
            onClick={() => setRemovedOpen((v) => !v)}
            className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg bg-[var(--bg-alt)]/50 hover:bg-[var(--bg-alt)]/70 transition-colors cursor-pointer"
          >
            <svg
              className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${removedOpen ? "rotate-0" : "-rotate-90"}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              {t("saved.recentlyRemoved")} ({recentlyRemoved.length})
            </span>
          </button>

          {/* Expanded list */}
          <AnimatePresence>
            {removedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="overflow-hidden"
              >
                <div className="py-1">
                  {recentlyRemoved.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)]/40 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <img
                        src={card.imageSmall || card.image}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover shrink-0 opacity-60"
                      />
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[12px] text-[var(--text)] uppercase truncate leading-tight">
                          {card.name}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase truncate leading-tight">
                          {card.artist}
                        </p>
                      </div>
                      {/* Countdown badge */}
                      <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                        {daysLeft(card.deletedAt)}
                      </span>
                      {/* Actions — visible on hover, always on mobile */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 max-sm:opacity-100 transition-opacity">
                        {/* Play */}
                        <button
                          onClick={() => onPlay(card.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--text)]/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          title={t("saved.play")}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </button>
                        {/* Restore */}
                        <button
                          onClick={() => onRestoreRemoved?.(card.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--text)]/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          title={t("saved.restore")}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                        </button>
                        {/* Hard delete */}
                        <button
                          onClick={() => onHardDelete?.(card.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          title={t("saved.deletePermanently")}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Clear all */}
                  <div className="flex justify-center pt-2 pb-1">
                    <button
                      onClick={onClearAllRemoved}
                      className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                    >
                      {t("saved.clearAll")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
