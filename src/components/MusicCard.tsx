"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Using <img> instead of next/image — YouTube serves optimized thumbnails already
import Tooltip from "./Tooltip";
import HeartLikeButton from "./HeartLikeButton";
import ShareButton from "./ShareButton";
import TrackActionsMenu from "./TrackActionsMenu";
import { useTranslation } from "./LanguageProvider";
import type { CardData } from "@/lib/types";
import { useVideoDescription } from "@/hooks/useVideoDescription";
import { TAGS, TAG_BY_ID, type TagId } from "@/lib/tags";
import { MIX_MIN_SECONDS } from "@/lib/durations";

interface MusicCardProps {
  card: CardData;
  saved: boolean;
  isGracePeriod?: boolean;
  isPlaying: boolean;
  activeTagFilters?: string[];
  viewContext?: string;
  onPlay: () => void;
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void;
  onSave: () => void;
  onShare?: () => void;
  isAuthenticated?: boolean;
  index?: number; // position in the grid → drives the staggered reveal order
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default memo(function MusicCard({
  card,
  saved,
  isGracePeriod = false,
  isPlaying,
  activeTagFilters = [],
  onPlay,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onSave,
  viewContext = "default",
  isAuthenticated = true,
  index = 0,
}: MusicCardProps) {
  const { t } = useTranslation();
  const [now] = useState(() => Date.now());
  const [imgError, setImgError] = useState(false);
  const [turnReached, setTurnReached] = useState(false); // this card's slot in the reading-order ripple has arrived
  const [showInfo, setShowInfo] = useState(false);
  const [shareOpen, setShareOpen] = useState(false); // keep the card "hovered" while its share menu is open
  const [menuOpen, setMenuOpen] = useState(false); // keep the card "hovered" while its actions menu is open
  const { description: cardDescription, loading: loadingDesc, fetchDescription } = useVideoDescription(card.videoId, card.description);
  const infoRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close info popover on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (infoRef.current?.contains(target)) return;
      // Ignore the info button itself, so a second click toggles it closed
      // (its onClick handles that) instead of close-then-reopen.
      if (infoBtnRef.current?.contains(target)) return;
      setShowInfo(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInfo(false); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 10);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", handleClick); window.removeEventListener("keydown", handleKey); };
  }, [showInfo]);

  // Reading-order ripple: each card reveals purely on its index slot (index × step,
  // wrapping every 30 so an infinite feed never waits seconds) — NOT gated on image
  // load. Gating on decode is exactly what made cards pop in randomly (images decode
  // in network order). A small reliable JPEG (below) is loaded by its slot, so the
  // 400ms fade shows the real image with no pop.
  useEffect(() => {
    const id = setTimeout(() => setTurnReached(true), (index % 30) * 22);
    return () => clearTimeout(id);
  }, [index]);
  const revealed = turnReached;

  const handlePlay = () => {
    onPlay();
  };

  // HeartLikeButton has disabled={!isAuthenticated}, so onSave only fires when auth'd
  const handleHeartClick = useCallback(() => onSave(), [onSave]);

  // Smaller JPEG thumbnail (mqdefault ~320px vs hqdefault ~480px) for fast, uniform
  // loads. ONE request per card (no webp→jpg fallback dance) so every card loads at a
  // similar speed and is ready by its reveal slot — that's what kills the random
  // pop-in. At this size webp would save only ~2KB, not worth the fallback complexity.
  const rawImg = card.image || "/placeholder.svg";
  const imgSrc = rawImg.replace(/\/hqdefault\.jpg$/, "/mqdefault.jpg");

  return (
    <motion.div layout layoutId={`${viewContext}-${card.id}`} transition={{ type: "spring", stiffness: 300, damping: 28 }} data-card-id={card.id} className={`group relative aspect-square cursor-pointer bg-[var(--bg-alt)] rounded-2xl transition-[opacity,box-shadow] duration-100 hover:z-10 hover:ring-1 hover:ring-[var(--text-muted)]/20 ${shareOpen || menuOpen ? "share-active z-10" : ""} ${isGracePeriod ? "opacity-75" : ""}`}
      onMouseLeave={() => {
        if (showInfo) {
          infoTimerRef.current = setTimeout(() => setShowInfo(false), 400);
        }
      }}
      onMouseEnter={() => {
        if (infoTimerRef.current) { clearTimeout(infoTimerRef.current); infoTimerRef.current = null; }
      }}
    >
      {/* Clip layer for cover image */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {imgError ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-alt)]"
            onClick={handlePlay}
            title="YouTube"
          >
            <svg className="w-10 h-10 text-[var(--text-muted)] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="6.5" strokeDasharray="2 3" />
            </svg>
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">DIGEART</span>
          </div>
        ) : (
          <>
            {/* Static placeholder sits BEHIND the image, always rendered — so a
                not-yet-painted thumb never flashes the card bg. STATIC (no animation)
                so 30+ cards mounting at once don't repaint every frame. Theme-aware:
                darker in light, lighter in dark (text-muted flips with the theme). */}
            <div
              className="absolute inset-0"
              style={{ background: "color-mix(in srgb, var(--text-muted) 16%, var(--bg-alt))" }}
            />
            <img
              src={imgSrc}
              alt={`${card.name} by ${card.artist}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[400ms] ease-out ${revealed ? "opacity-100" : "opacity-0"}`}
              loading={index < 15 ? "eager" : "lazy"}
              decoding="async"
              onClick={handlePlay}
              onLoad={(e) => {
                // YouTube serves a tiny (~120px) grey placeholder for videos with no
                // real thumb → show the branded DIGEART mark instead.
                if (e.currentTarget.naturalWidth <= 120) setImgError(true);
              }}
              onError={() => setImgError(true)}
              title="YouTube"
            />
          </>
        )}
      </div>

      {/* Duration pill — MOBILE ONLY here (top-left). On sm+ it renders inside the
           top-right stack ABOVE the tags (see below) so it never clashes with the
           bottom-left share button. */}
      {card.duration && card.duration >= MIX_MIN_SECONDS && (
        <span className="sm:hidden absolute top-2 left-2 z-10 px-2.5 py-1 bg-[var(--bg)]/95 text-[var(--text)] border border-[var(--border)]/60 font-mono font-bold text-[10px] rounded-full backdrop-blur-sm shadow-sm">
          {formatDuration(card.duration)}
        </span>
      )}

      {/* Status tags — top right */}
      {(() => {
        const isNew = card.publishedAt ? (now - new Date(card.publishedAt).getTime()) / 86400000 <= 60 : false;
        const isHot = !!card.isHot; // top 10% by views (stamped server-side)
        const isGem = !!card.isGem; // editorial: curator-liked track
        const matches: Record<TagId, boolean> = { hot: isHot, gem: isGem, new: isNew };

        // Which tags qualify — filter-driven when a filter is active, else from card data
        let ids: TagId[];
        if (activeTagFilters.length > 0) {
          ids = TAGS.filter((t) => activeTagFilters.includes(t.id)).map((t) => t.id);
          if (ids.length === 0) ids = TAGS.filter((t) => matches[t.id]).map((t) => t.id);
        } else {
          ids = TAGS.filter((t) => matches[t.id]).map((t) => t.id);
        }

        // Cap to 2 status tags — keep the highest-priority (Gem = human pick > Hot >
        // New), rendered in the usual TAGS order. The duration pill is separate (always
        // shown for long mixes), so this only limits the colored status tags.
        const PRIORITY: TagId[] = ["gem", "hot", "new"];
        const keep = new Set(PRIORITY.filter((id) => ids.includes(id)).slice(0, 2));
        const tags = TAGS.filter((t) => keep.has(t.id)).map((t) => TAG_BY_ID[t.id]);

        // On sm+ the always-on duration pill lives at the TOP of this top-right stack,
        // above any status tags. (Mobile shows it top-left instead — see above.)
        const hasDuration = !!(card.duration && card.duration >= MIX_MIN_SECONDS);
        if (tags.length === 0 && !hasDuration) return null;
        return (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end transition-opacity duration-100">
            {card.duration && card.duration >= MIX_MIN_SECONDS && (
              <span className="hidden sm:block px-2.5 py-1 bg-[var(--bg)]/95 text-[var(--text)] border border-[var(--border)]/60 font-mono font-bold text-[10px] rounded-full backdrop-blur-sm shadow-sm">
                {formatDuration(card.duration)}
              </span>
            )}
            {tags.map((tag) => (
              <span key={tag.label} className={`px-2.5 py-1 ${tag.color} text-white font-mono text-[10px] font-bold tracking-wider rounded-full shadow-sm`}>
                {tag.label}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Center EQ — wind-down animation on stop */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-100 ${isPlaying ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: isPlaying ? "0ms" : "350ms" }}>
        <div className="flex flex-col items-center bg-black/60 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-end gap-[3px] h-10">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`eq-bar-base w-[3px] bg-white rounded-full transition-[transform] duration-300 ease-out ${isPlaying ? `eq-bar-${n}` : "eq-bar-idle"}`} style={{ transitionDelay: isPlaying ? "0ms" : `${(n - 1) * 60}ms` }} />
            ))}
          </div>
          <div className="flex items-start gap-[3px] h-4 opacity-20 overflow-hidden">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`eq-bar-base w-[3px] bg-white rounded-full transition-[transform] duration-300 ease-out ${isPlaying ? `eq-bar-${n}` : "eq-bar-idle"}`} style={{ transitionDelay: isPlaying ? "0ms" : `${(n - 1) * 60}ms`, transformOrigin: "top" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 transition-opacity duration-100 pointer-events-none rounded-2xl" />

      {/* Bottom scrim — guarantees contrast for the action buttons on any cover (TRIAL) */}
      <div className="absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 transition-opacity duration-100 pointer-events-none rounded-b-2xl" />

      {/* Play/Stop button — center, on hover */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 transition-opacity duration-100"
        onClick={handlePlay}
      >
        <span
          className={`font-mono text-5xl sm:text-6xl min-[1152px]:text-8xl leading-none transition-colors drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
            isPlaying ? "text-white" : "text-white hover:text-zinc-300"
          }`}
        >
          {isPlaying ? "❚❚" : "▶"}
        </span>
      </div>

      {/* Share — bottom-left corner (tablet + desktop), separated from the info/like cluster */}
      <div className="absolute bottom-2 left-2 z-20 hidden sm:flex">
        <ShareButton
          trackId={card.id}
          trackName={card.name}
          channel={card.artist}
          youtubeUrl={card.youtubeUrl}
          size="md"
          showTooltip={false}
          onOpenChange={setShareOpen}
          className="w-8 h-8 rounded-full text-white/80 hover:text-white opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* Action buttons — bottom right: INFO · PLAY-NEXT · LIKE */}
      <div className="absolute bottom-2 right-2 z-20 hidden sm:flex items-center gap-1.5">
        {/* Info button — available to all users (no tooltip) */}
        <button
            ref={infoBtnRef}
            onClick={(e) => { e.stopPropagation(); setShowInfo((v) => { if (!v) fetchDescription(); return !v; }); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-100 text-white/80 hover:text-white active:scale-95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
              showInfo ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100"
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

        {/* Track actions (Play Next / Add to Queue / Add to Playlist) — tablet + desktop */}
        {(onPlayNext || onAddToQueue || onAddToPlaylist) && (
          <TrackActionsMenu
            onPlayNext={onPlayNext}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
            onOpenChange={setMenuOpen}
            triggerClassName="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all duration-100 text-white/80 hover:text-white active:scale-95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 cursor-pointer"
          />
        )}

        {/* Like button */}
        <Tooltip label={isAuthenticated ? "" : t("card.loginToSave")} position="top">
          <HeartLikeButton
            isLiked={saved}
            trackId={card.id}
            onToggle={handleHeartClick}
            size="md"
            disabled={!isAuthenticated}
            ariaLabel={isAuthenticated ? (saved ? t("card.unlike") : t("card.save")) : t("card.loginToSave")}
            lottieVariant="light"
            className={`rounded-full active:scale-95 transition-all duration-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
              saved ? "text-white" : "text-white/80 hover:text-white"
            } ${
              saved
                ? "opacity-100"
                : isGracePeriod
                  ? "opacity-100"
                  : isAuthenticated
                    ? "opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100"
                    : "opacity-0 group-hover:opacity-50 cursor-default"
            }`}
          />
        </Tooltip>
      </div>

      {/* Info popover */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            ref={infoRef}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute bottom-12 right-2 z-30 w-[200px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[10px] text-white/90 font-bold truncate">{card.album}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {card.viewCount != null && (
                <span className="font-mono text-[10px] text-white/50">{formatViewCount(card.viewCount)} views</span>
              )}
              {card.publishedAt && (
                <span className="font-mono text-[10px] text-white/50">{formatDate(card.publishedAt)}</span>
              )}
            </div>
            {loadingDesc && (
              <div className="flex items-center gap-1.5 mt-2">
                <svg className="w-3 h-3 animate-spin text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                <span className="font-mono text-[9px] text-white/30">Loading...</span>
              </div>
            )}
            {!loadingDesc && cardDescription && (
              <p className="font-mono text-[10px] text-white/40 mt-2 leading-relaxed line-clamp-4">{cardDescription}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track info — top-left (desktop hover) */}
      <div className="absolute top-0 left-0 right-[72px] z-10 px-2.5 py-2 opacity-0 group-hover:opacity-100 group-[.share-active]:opacity-100 transition-opacity duration-100 hidden sm:block">
          <p className="font-mono text-xs text-white uppercase truncate leading-tight font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {card.name}
          </p>
          <p className="font-mono text-[9px] text-zinc-300 uppercase tracking-wider truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {card.artist}
          </p>
        </div>

      {/* Track info — bottom (mobile) */}
      <div className="absolute bottom-0 left-0 right-0 sm:hidden bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-4 pb-2">
        <p className="font-mono text-xs text-white uppercase truncate leading-tight font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {card.name}
        </p>
        <p className="font-mono text-[10px] text-zinc-300 uppercase tracking-wider truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {card.artist}
        </p>
      </div>
    </motion.div>
  );
}, (prev, next) =>
  // Re-render ONLY when data changes. The callback props (onPlay/onSave/onPlayNext/
  // onShare) are fresh closures on every grid render but behaviorally stable — they
  // wrap useCallback'd parent handlers + a fixed card.id (onShare is unused here).
  // Ignoring them stops every mounted card re-rendering on each scroll-load.
  prev.card === next.card &&
  prev.saved === next.saved &&
  prev.isGracePeriod === next.isGracePeriod &&
  prev.isPlaying === next.isPlaying &&
  prev.isAuthenticated === next.isAuthenticated &&
  prev.viewContext === next.viewContext &&
  prev.index === next.index &&
  (prev.activeTagFilters || []).join() === (next.activeTagFilters || []).join()
)
