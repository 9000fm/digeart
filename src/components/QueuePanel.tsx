"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import HeartLikeButton from "./HeartLikeButton";
import TrackActionsMenu from "./TrackActionsMenu";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "./LanguageProvider";
import { getPlayHistory, type PlayHistoryEntry } from "@/lib/playHistory";
import type { CardData } from "@/lib/types";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: string[];
  currentIndex: number;
  cardRegistry: Map<string, CardData>;
  onPlayIndex: (index: number) => void;
  onPlayTrack?: (card: CardData) => void;
  onRemove?: (index: number) => void;
  onReorderUpcoming?: (ids: string[]) => void;
  likedIds: Set<string>;
  onToggleLike: (id: string) => void;
  onPlayNext?: (id: string) => void;
  onAddToQueue?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void;
}

function QueueRow({ card, isCurrent, dimmed, onClick, onRemove, isLiked, onToggleLike, isMobile = false, hoverBg = true, onPlayNext, onAddToQueue, onAddToPlaylist }: {
  card: CardData;
  isCurrent: boolean;
  dimmed: boolean;
  onClick: () => void;
  onRemove?: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  isMobile?: boolean;
  hoverBg?: boolean;
  onPlayNext?: (id: string) => void;
  onAddToQueue?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`group/qrow w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-75 cursor-pointer ${
        isCurrent
          ? "bg-[var(--text)]/90 text-[var(--bg)]"
          : (hoverBg ? "hover:bg-[var(--bg-alt)]/60" : "")
      }`}
    >
      <img
        src={card.imageSmall || card.image}
        alt=""
        className={`w-9 h-9 rounded-md object-cover shrink-0 ${dimmed ? "opacity-50" : ""}`}
      />
      <div className={`min-w-0 text-left ${dimmed ? "opacity-50" : ""} ${isCurrent && isMobile ? "" : "flex-1"}`}>
        <p className={`font-mono text-[13px] uppercase truncate leading-tight font-bold ${
          isCurrent ? "text-[var(--bg)]" : "text-[var(--text)]"
        }`}>
          {card.name}
        </p>
        <p className={`font-mono text-[10px] uppercase truncate leading-tight font-bold tracking-widest ${
          isCurrent ? "text-[var(--bg)]/60" : "text-[var(--text)]/60"
        }`}>
          {card.artist}
        </p>
      </div>
      {isCurrent && (
        <div className={`shrink-0 flex flex-col items-center ${isMobile ? "ml-4" : ""}`}>
          <div className="flex items-end gap-[2px] h-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`eq-bar-base w-[1.5px] bg-[var(--bg)] rounded-full eq-bar-${n}`} />
            ))}
          </div>
          <div className="flex items-start gap-[2px] h-1.5 opacity-25 overflow-hidden">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`eq-bar-base w-[1.5px] bg-[var(--bg)] rounded-full eq-bar-${n}`} style={{ transformOrigin: "top" }} />
            ))}
          </div>
        </div>
      )}
      <div className="ml-auto shrink-0 flex items-center gap-0.5">
        <QueueHeart isLiked={isLiked} trackId={card.id} onToggleLike={onToggleLike} isCurrent={isCurrent} />
        {(onPlayNext || onAddToQueue || onAddToPlaylist || onRemove) && (
          <span onClick={(e) => e.stopPropagation()}>
            <TrackActionsMenu
              onPlayNext={onPlayNext ? () => onPlayNext(card.id) : undefined}
              onAddToQueue={onAddToQueue ? () => onAddToQueue(card.id) : undefined}
              onAddToPlaylist={onAddToPlaylist ? () => onAddToPlaylist(card.id) : undefined}
              onRemove={onRemove}
              removeLabel={t("queue.remove")}
              triggerIcon="dots"
              triggerClassName={`shrink-0 w-6 h-6 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 cursor-pointer transition-colors duration-75 ${
                isCurrent ? "text-[var(--bg)]/50 hover:text-[var(--bg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            />
          </span>
        )}
      </div>
    </div>
  );
}

/** Queue heart wrapper — computes lottieVariant from theme + row state */
function QueueHeart({ isLiked, trackId, onToggleLike, isCurrent }: { isLiked: boolean; trackId: string; onToggleLike: () => void; isCurrent: boolean }) {
  const { theme } = useTheme();
  // Current row has inverted bg (dark in light, light in dark) → burst matches the bg-contrast heart
  // Non-current rows follow the normal theme (dark burst in light, light burst in dark)
  const variant: "light" | "dark" = isCurrent
    ? (theme === "dark" ? "dark" : "light")
    : (theme === "dark" ? "light" : "dark");
  return (
    <HeartLikeButton
      isLiked={isLiked}
      trackId={trackId}
      onToggle={onToggleLike}
      size="sm"
      className={isCurrent ? "text-[var(--bg)]/60 hover:text-[var(--bg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}
      lottieVariant={variant}
    />
  );
}

/** Up-next row — draggable via a grip handle (handle-only drag so the panel can still scroll). */
function UpNextRow({ id, card, onPlay, onRemove, isLiked, onToggleLike, onPlayNext, onAddToQueue, onAddToPlaylist }: {
  id: string;
  card: CardData;
  onPlay: () => void;
  onRemove?: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onPlayNext?: (id: string) => void;
  onAddToQueue?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ zIndex: 1 }}
      className="list-none flex items-center rounded-lg hover:bg-[var(--bg-alt)]/60 transition-colors duration-75"
    >
      <button
        aria-label="Reorder"
        onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        className="shrink-0 h-9 flex items-center justify-center pl-3 pr-2 cursor-grab active:cursor-grabbing text-[var(--text)]/60 touch-none"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <QueueRow
          card={card}
          isCurrent={false}
          dimmed={false}
          onClick={onPlay}
          onRemove={onRemove}
          isLiked={isLiked}
          onToggleLike={onToggleLike}
          hoverBg={false}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
        />
      </div>
    </Reorder.Item>
  );
}

export default function QueuePanel({
  isOpen,
  onClose,
  queue,
  currentIndex,
  cardRegistry,
  onPlayIndex,
  onPlayTrack,
  onRemove,
  onReorderUpcoming,
  likedIds,
  onToggleLike,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
}: QueuePanelProps) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  // Defer mounting the (potentially long) row list by one frame after open, so the
  // panel's enter animation runs on its own frame instead of sharing it with a big
  // synchronous commit (which would starve the top marquee's rAF → visible stutter).
  const [rowsReady, setRowsReady] = useState(false);
  const currentRowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentId = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  useEffect(() => {
    // Phone only (<500). Tablet (500-1152) uses the docked panel so it never covers the player.
    const check = () => setIsMobile(window.innerWidth < 500);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Read persistent listening history when the History tab is shown — and refresh it
  // whenever the playing track changes, so a new play shows up live.
  useEffect(() => {
    // Reads play history from localStorage when the History tab opens; a correct effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen && tab === "history") setHistory(getPlayHistory());
  }, [isOpen, tab, currentId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Mount rows one frame after open; reset on close via cleanup (keeps both
  // setState calls inside callbacks, never synchronous in the effect body).
  useEffect(() => {
    if (!isOpen) return;
    const r = requestAnimationFrame(() => setRowsReady(true));
    return () => { cancelAnimationFrame(r); setRowsReady(false); };
  }, [isOpen]);

  // On open / tab switch / new track: Queue → keep the current track in view;
  // History → jump to the top (the just-played track is now first).
  // Waits for rowsReady so the target row actually exists before scrolling.
  useEffect(() => {
    if (!isOpen || !rowsReady) return;
    requestAnimationFrame(() => {
      if (tab === "history") {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      } else {
        currentRowRef.current?.scrollIntoView({ block: "center" });
      }
    });
  }, [isOpen, tab, currentId, rowsReady]);

  // Lock body scroll when mobile sheet is open (iOS Safari-safe)
  useEffect(() => {
    if (isOpen && isMobile) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, isMobile]);

  // Full queue — every track, scrollable (previously-played dimmed, then current, then up next)
  const queueRows = queue
    .map((id, index) => ({ id, index, card: cardRegistry.get(id) }))
    .filter((r): r is { id: string; index: number; card: CardData } => !!r.card);

  const headRows = queueRows.filter((r) => r.index <= currentIndex);   // previously-played + current (static)
  const upcomingRows = queueRows.filter((r) => r.index > currentIndex); // up next (draggable)
  const upcomingIds = upcomingRows.map((r) => r.id);
  const headerClass = "font-mono text-[10px] uppercase tracking-wider text-[var(--text)]/70 font-bold px-3 pt-1.5 pb-1";

  const queueContent = (
    <div className="px-2 py-2">
      {/* Previously played + current — fixed (not reorderable) */}
      {headRows.map((row) => {
        const isPrev = row.index < currentIndex;
        const isCurrent = row.index === currentIndex;
        return (
          <div key={row.id} ref={isCurrent ? currentRowRef : undefined}>
            {isPrev && row.index === 0 && <p className={`${headerClass} pt-0`}>{t("queue.previouslyPlayed")}</p>}
            {isCurrent && <p className={headerClass}>{t("queue.nowPlaying")}</p>}
            <QueueRow
              card={row.card}
              isCurrent={isCurrent}
              dimmed={isPrev}
              onClick={isCurrent ? () => {} : () => onPlayIndex(row.index)}
              onRemove={onRemove && !isCurrent ? () => onRemove(row.index) : undefined}
              isLiked={likedIds.has(row.id)}
              onToggleLike={() => onToggleLike(row.id)}
              isMobile={isCurrent ? isMobile : false}
              onPlayNext={onPlayNext}
              onAddToQueue={onAddToQueue}
              onAddToPlaylist={onAddToPlaylist}
            />
          </div>
        );
      })}

      {/* Up next — drag to reorder (handle only) */}
      {upcomingRows.length > 0 && (
        <>
          <p className={headerClass}>{t("queue.upNext")}</p>
          {onReorderUpcoming ? (
            <Reorder.Group axis="y" values={upcomingIds} onReorder={onReorderUpcoming} className="list-none m-0 p-0">
              {upcomingRows.map((row) => (
                <UpNextRow
                  key={row.id}
                  id={row.id}
                  card={row.card}
                  onPlay={() => onPlayIndex(row.index)}
                  onRemove={onRemove ? () => onRemove(row.index) : undefined}
                  isLiked={likedIds.has(row.id)}
                  onToggleLike={() => onToggleLike(row.id)}
                  onPlayNext={onPlayNext}
                  onAddToQueue={onAddToQueue}
                  onAddToPlaylist={onAddToPlaylist}
                />
              ))}
            </Reorder.Group>
          ) : (
            upcomingRows.map((row) => (
              <QueueRow
                key={row.id}
                card={row.card}
                isCurrent={false}
                dimmed={false}
                onClick={() => onPlayIndex(row.index)}
                onRemove={onRemove ? () => onRemove(row.index) : undefined}
                isLiked={likedIds.has(row.id)}
                onToggleLike={() => onToggleLike(row.id)}
                onPlayNext={onPlayNext}
                onAddToQueue={onAddToQueue}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))
          )}
        </>
      )}

      {queueRows.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t("queue.empty")}</p>
        </div>
      )}
    </div>
  );

  const historyContent = (
    <div className="px-2 py-2">
      {history.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t("queue.empty")}</p>
        </div>
      ) : (
        history.map((entry, i) => (
          <QueueRow
            key={`${entry.playedAt}-${entry.card.id}-${i}`}
            card={entry.card}
            isCurrent={entry.card.id === currentId}
            dimmed={entry.card.id !== currentId}
            onClick={() => onPlayTrack?.(entry.card)}
            isLiked={likedIds.has(entry.card.id)}
            onToggleLike={() => onToggleLike(entry.card.id)}
            onPlayNext={onPlayNext}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
          />
        ))
      )}
    </div>
  );

  const tabToggle = (
    <div className="flex items-center gap-1">
      {([
        { id: "queue" as const, label: t("queue.title") },
        { id: "history" as const, label: t("queue.history") },
      ]).map((tb) => (
        <button
          key={tb.id}
          onClick={() => setTab(tb.id)}
          className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            tab === tb.id
              ? "bg-[var(--text)]/10 text-[var(--text)] font-bold"
              : "text-[var(--text)]/45 hover:text-[var(--text)]"
          }`}
        >
          {tb.label}
        </button>
      ))}
    </div>
  );

  // null until rowsReady → the open animation gets a clean frame; rows pop in next frame.
  const content = !rowsReady ? null : tab === "queue" ? queueContent : historyContent;

  // Phone (<500px): bottom sheet
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
              style={{ touchAction: "none" }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            />
            <motion.div
              ref={scrollRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-alt)] border-t border-[var(--border)]/50 rounded-t-2xl shadow-2xl overflow-y-auto overscroll-contain"
              style={{ maxHeight: "65vh", touchAction: "pan-y" }}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Sticky header: drag handle + tabs, with a subtle fade into the scrolling list below */}
              <div className="sticky top-0 z-10 bg-[var(--bg-alt)]">
                <div className="flex justify-center pt-2.5 pb-1 cursor-pointer" onClick={onClose}>
                  <div className="w-8 h-1 rounded-full bg-[var(--text-muted)]/30" />
                </div>
                <div className="px-3 py-2">{tabToggle}</div>
                <div className="absolute left-0 right-0 top-full h-5 bg-gradient-to-b from-[var(--bg-alt)] to-transparent pointer-events-none" />
              </div>
              <div className="px-1 pb-2">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Tablet + desktop (≥500px): tall right-docked panel — sits between the top nav and the player
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed w-[400px] z-[60] flex flex-col bg-[var(--bg-alt)]/97 rounded-xl shadow-2xl overflow-hidden"
          style={{
            top: "calc(var(--banner-height) + var(--header-height) + 8px)",
            bottom: "calc(var(--player-height) + 8px)",
            right: "16px",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
            {tabToggle}
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[var(--text)]/50 hover:text-[var(--text)] cursor-pointer" aria-label={t("queue.close")}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
            {content}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
