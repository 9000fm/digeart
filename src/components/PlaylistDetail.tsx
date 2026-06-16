"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import MusicCard from "./MusicCard";
import PlaylistCover from "./PlaylistCover";
import { useTranslation } from "./LanguageProvider";
import { fetchPlaylist, reorderPlaylist } from "@/lib/playlistsClient";
import type { CardData, Playlist, PlaylistTrack } from "@/lib/types";

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
  playingId: string | null;
  isPlaying: boolean;
  likedIds: Set<string>;
  onPlayPlaylist: (tracks: CardData[], startId: string) => void;
  onToggleLike: (id: string) => void;
  onShare: (card: CardData) => void;
  onRemoveTrack: (playlistId: string, videoId: string) => Promise<boolean> | void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isAuthenticated?: boolean;
}

// One draggable list row (handle-only drag so the page can still scroll).
function TrackRow({ track, isCurrent, isLiked, onPlay, onRemove, onToggleLike }: {
  track: PlaylistTrack; isCurrent: boolean; isLiked: boolean;
  onPlay: () => void; onRemove: () => void; onToggleLike: () => void;
}) {
  const { t } = useTranslation();
  const controls = useDragControls();
  const c = track.card;
  return (
    <Reorder.Item
      value={track.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ zIndex: 1 }}
      className="group/prow list-none flex items-center rounded-lg hover:bg-[var(--bg-alt)]/60 transition-colors duration-75"
    >
      <button
        aria-label={t("playlist.back")}
        onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        className="shrink-0 h-12 flex items-center justify-center pl-3 pr-2 cursor-grab active:cursor-grabbing text-[var(--text)]/40 touch-none"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      <button onClick={onPlay} className="flex-1 min-w-0 flex items-center gap-3 py-2 pr-2 text-left cursor-pointer">
        <img src={c.imageSmall || c.image} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
        <div className="min-w-0">
          <p className={`font-mono text-[13px] uppercase truncate leading-tight font-bold ${isCurrent ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>{c.name}</p>
          <p className="font-mono text-[10px] uppercase truncate leading-tight font-bold tracking-widest text-[var(--text)]/60">{c.artist}</p>
        </div>
      </button>
      <button
        onClick={onToggleLike}
        aria-label="like"
        className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isLiked ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
      </button>
      <button
        onClick={onRemove}
        aria-label={t("queue.remove")}
        className="shrink-0 w-8 h-8 mr-2 flex items-center justify-center rounded-full opacity-0 group-hover/prow:opacity-100 transition-all text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--text)]/10 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </Reorder.Item>
  );
}

export default function PlaylistDetail({
  playlistId, onBack, playingId, isPlaying, likedIds,
  onPlayPlaylist, onToggleLike, onShare, onRemoveTrack, onRename, onDelete, isAuthenticated = true,
}: PlaylistDetailProps) {
  const { t } = useTranslation();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list"); // list default for variety
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPlaylist(playlistId)
      .then(({ playlist, tracks }) => { if (alive) { setPlaylist(playlist); setTracks(tracks); } })
      .catch(() => { /* ignore */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [playlistId]);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);

  const orderedIds = tracks.map((tk) => tk.id);
  const cards = tracks.map((tk) => tk.card);

  const handleReorder = (newIds: string[]) => {
    const byId = new Map(tracks.map((tk) => [tk.id, tk]));
    const next = newIds.map((id) => byId.get(id)!).filter(Boolean);
    setTracks(next);
    reorderPlaylist(playlistId, next.map((tk) => tk.card.id));
  };

  const handleRemove = async (videoId: string) => {
    setTracks((prev) => prev.filter((tk) => tk.card.id !== videoId));
    await onRemoveTrack(playlistId, videoId);
  };

  const submitRename = () => {
    const clean = draftName.trim();
    if (clean && playlist) { onRename(playlist.id, clean); setPlaylist({ ...playlist, name: clean }); }
    setRenaming(false);
  };

  const playAll = () => { if (cards.length > 0) onPlayPlaylist(cards, cards[0].id); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end gap-4 px-3 sm:px-[11px] pt-3 pb-4">
        <button onClick={onBack} aria-label={t("playlist.back")} className="shrink-0 w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-[var(--bg-alt)] text-[var(--text)] cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <PlaylistCover cards={playlist?.coverCards ?? cards} className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shrink-0 shadow-lg" />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={renameRef} value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenaming(false); }}
              onBlur={submitRename} maxLength={80}
              className="w-full bg-transparent border-b border-[var(--border)] font-mono text-xl sm:text-2xl uppercase font-bold text-[var(--text)] outline-none"
            />
          ) : (
            <div className="flex items-center gap-2 group/name">
              <h2 className="font-mono text-xl sm:text-2xl uppercase font-bold text-[var(--text)] truncate">{playlist?.name ?? t("playlist.untitled")}</h2>
              <button
                onClick={() => { setDraftName(playlist?.name ?? ""); setRenaming(true); }}
                aria-label={t("playlist.rename")} title={t("playlist.rename")}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] opacity-0 group-hover/name:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
              </button>
            </div>
          )}
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-1">{tracks.length} {t("playlist.tracksLabel")}</p>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={playAll} disabled={cards.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--text)] text-[var(--bg)] font-mono text-[11px] uppercase tracking-wider font-bold disabled:opacity-40 cursor-pointer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              {t("playlist.play")}
            </button>
            {/* overflow menu */}
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} aria-label={t("card.moreActions")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                      className="absolute left-0 top-11 z-[90] w-44 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl overflow-hidden py-1"
                    >
                      <button onClick={() => { setMenuOpen(false); setDraftName(playlist?.name ?? ""); setRenaming(true); }} className="w-full text-left px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer">{t("playlist.rename")}</button>
                      <button
                        onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                        className="w-full text-left px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >{t("playlist.delete")}</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            {/* view toggle */}
            <div className="ml-auto flex items-center gap-1">
              {(["grid", "list"] as const).map((m) => (
                <button
                  key={m} onClick={() => setViewMode(m)}
                  aria-label={m === "grid" ? t("saved.viewGrid") : t("saved.viewList")}
                  className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${viewMode === m ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"}`}
                >
                  {m === "grid" ? (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="vinyl-spinner" /></div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
          <p className="font-mono text-sm text-[var(--text-muted)] uppercase">{t("playlist.empty")}</p>
          <p className="font-mono text-[11px] text-[var(--text-muted)]/70 mt-2">{t("playlist.emptyHint")}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="dot-grid grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-[11px] p-2 sm:p-[11px]">
          {cards.map((card) => (
            <MusicCard
              key={card.id}
              card={card}
              saved={likedIds.has(card.id)}
              isPlaying={playingId === card.id && isPlaying}
              viewContext="saved"
              onPlay={() => onPlayPlaylist(cards, card.id)}
              onSave={() => onToggleLike(card.id)}
              onShare={() => onShare(card)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <Reorder.Group axis="y" values={orderedIds} onReorder={handleReorder} className="list-none m-0 px-1 sm:px-[7px] pb-4">
          {tracks.map((tk) => (
            <TrackRow
              key={tk.id}
              track={tk}
              isCurrent={playingId === tk.card.id}
              isLiked={likedIds.has(tk.card.id)}
              onPlay={() => onPlayPlaylist(cards, tk.card.id)}
              onRemove={() => handleRemove(tk.card.id)}
              onToggleLike={() => onToggleLike(tk.card.id)}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Delete confirm — styled modal (replaces native confirm) */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={() => setConfirmDelete(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="relative w-full max-w-[320px] rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl p-5"
            >
              <p className="font-mono text-[13px] uppercase tracking-wider text-[var(--text)] text-center mb-1 font-bold truncate">{playlist?.name}</p>
              <p className="font-mono text-[12px] text-[var(--text-muted)] text-center mb-5">{t("playlist.deleteConfirm")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-wider text-[var(--text)] bg-[var(--bg)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                >{t("playlist.cancel")}</button>
                <button
                  onClick={() => { if (playlist) { onDelete(playlist.id); onBack(); } }}
                  className="flex-1 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-wider text-white bg-red-500/90 hover:bg-red-500 transition-colors cursor-pointer font-bold"
                >{t("playlist.delete")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
