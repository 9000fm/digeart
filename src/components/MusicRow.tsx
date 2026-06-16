"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeartLikeButton from "./HeartLikeButton";
import ShareButton from "./ShareButton";
import TrackActionsMenu from "./TrackActionsMenu";
import Tooltip from "./Tooltip";
import { useTranslation } from "./LanguageProvider";
import { useVideoDescription } from "@/hooks/useVideoDescription";
import type { CardData } from "@/lib/types";

interface MusicRowProps {
  card: CardData;
  saved: boolean;
  isGracePeriod?: boolean;
  isPlaying: boolean;
  viewContext?: string;
  onPlay: () => void;
  onSave: () => void;
  onShare?: () => void;
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void;
  isAuthenticated?: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default memo(function MusicRow({
  card,
  saved,
  isGracePeriod = false,
  isPlaying,
  viewContext = "default",
  onPlay,
  onSave,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  isAuthenticated = true,
}: MusicRowProps) {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const { description: cardDescription, loading: loadingDesc, fetchDescription } = useVideoDescription(card.videoId, card.description);
  const infoRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  // Close info popover on outside click / Escape
  useEffect(() => {
    if (!showInfo) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (infoRef.current?.contains(target)) return;
      if (infoBtnRef.current?.contains(target)) return;
      setShowInfo(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInfo(false); };
    const tm = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 10);
    return () => { clearTimeout(tm); window.removeEventListener("mousedown", handleClick); window.removeEventListener("keydown", handleKey); };
  }, [showInfo]);

  return (
    <motion.div
      layout
      layoutId={`${viewContext}-row-${card.id}`}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      data-card-id={card.id}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isPlaying
          ? "bg-[var(--accent)]/12"
          : "hover:bg-[var(--bg-alt)]"
      } ${isGracePeriod ? "opacity-75" : ""}`}
      onClick={onPlay}
    >
      {/* Thumbnail with EQ overlay when playing */}
      <div className="relative shrink-0 w-10 h-10 rounded-md overflow-hidden bg-[var(--bg-alt)]">
        <img
          src={card.imageSmall || card.image || "/placeholder.svg"}
          alt={`${card.name} by ${card.artist}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* EQ on play / play arrow on hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isPlaying
              ? "bg-black/55 opacity-100"
              : "bg-black/55 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`eq-bar-base w-[2px] bg-white rounded-full eq-bar-${n}`}
                />
              ))}
            </div>
          ) : (
            <span className="text-white text-base leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">▶</span>
          )}
        </div>
      </div>

      {/* Title + artist */}
      <div className="min-w-0 flex-1">
        <p
          className={`font-mono text-[13px] uppercase truncate leading-tight font-bold ${
            isPlaying ? "text-[var(--accent)]" : "text-[var(--text)]"
          }`}
        >
          {card.name}
        </p>
        <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold truncate leading-tight mt-0.5">
          {card.artist}
        </p>
      </div>

      {/* Right cluster: SHARE · INFO · LIKE · duration (share+info always visible) */}
      <div
        className="relative shrink-0 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Order: Info · Share · Like · More(⋯) — overflow menu sits last (before duration) */}
        {/* Info button */}
        <Tooltip label={t("card.info")} position="top" hideOnClick>
          <button
            ref={infoBtnRef}
            onClick={(e) => { e.stopPropagation(); setShowInfo((v) => { if (!v) fetchDescription(); return !v; }); }}
            aria-label={t("card.info")}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-alt)] ${
              showInfo ? "text-[var(--text)]" : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            {loadingDesc ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <circle cx="12" cy="8" r="0.5" fill="currentColor" />
              </svg>
            )}
          </button>
        </Tooltip>

        <ShareButton
          trackId={card.id}
          trackName={card.name}
          channel={card.artist}
          youtubeUrl={card.youtubeUrl}
          size="sm"
          className="w-6 h-6 rounded-full text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
        />

        <Tooltip
          label={
            isAuthenticated
              ? saved
                ? t("card.saved")
                : t("card.save")
              : t("card.loginToSave")
          }
          position="top"
        >
          <HeartLikeButton
            isLiked={saved}
            trackId={card.id}
            onToggle={onSave}
            size="sm"
            disabled={!isAuthenticated}
            ariaLabel={
              isAuthenticated
                ? saved
                  ? t("card.unlike")
                  : t("card.save")
                : t("card.loginToSave")
            }
            lottieVariant="auto"
            className={`rounded-full hover:bg-[var(--bg-alt)] ${
              saved || isGracePeriod
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          />
        </Tooltip>

        {(onPlayNext || onAddToQueue || onAddToPlaylist) && (
          <TrackActionsMenu
            onPlayNext={onPlayNext}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
            triggerClassName="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] [&>svg]:w-4 [&>svg]:h-4 cursor-pointer"
          />
        )}

        {/* Duration — always visible, fixed-width tabular */}
        {card.duration != null && card.duration > 0 && (
          <span className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums tracking-wider w-12 text-right">
            {formatDuration(card.duration)}
          </span>
        )}

        {/* Info popover — theme-aware (row sits on --bg) */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              ref={infoRef}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="absolute bottom-full right-0 mb-2 z-30 w-[220px] bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl shadow-2xl p-3 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-mono text-[10px] text-[var(--text)] font-bold truncate">{card.album}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {card.viewCount != null && (
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">{formatViewCount(card.viewCount)} views</span>
                )}
                {card.publishedAt && (
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">{formatDate(card.publishedAt)}</span>
                )}
              </div>
              {loadingDesc && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg className="w-3 h-3 animate-spin text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">Loading...</span>
                </div>
              )}
              {!loadingDesc && cardDescription && (
                <p className="font-mono text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed line-clamp-4">{cardDescription}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
