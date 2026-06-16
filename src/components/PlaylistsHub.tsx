"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "./LanguageProvider";
import PlaylistCover from "./PlaylistCover";
import type { CardData, Playlist } from "@/lib/types";

interface PlaylistsHubProps {
  likedCount: number;
  likedCovers: Pick<CardData, "id" | "image" | "imageSmall">[];
  playlists: Playlist[];
  onOpenLiked: () => void;
  onOpenPlaylist: (id: string) => void;
  onCreate: (name: string) => Promise<Playlist | null>;
}

// Saved landing: a grid of playlist cards (same dimensions as music cards).
// "Liked" is pinned first (heart cover); a "New" card sits at the end.
export default function PlaylistsHub({
  likedCount, likedCovers, playlists, onOpenLiked, onOpenPlaylist, onCreate,
}: PlaylistsHubProps) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creating) inputRef.current?.focus(); }, [creating]);

  const submit = async () => {
    const clean = name.trim();
    setCreating(false); setName("");
    if (clean) { const pl = await onCreate(clean); if (pl) onOpenPlaylist(pl.id); }
  };

  // Tiles are <div role="button">, NOT <button> — native button styling sizes the
  // aspect-square cover wrong (see CLAUDE.md: arbitrary values on <button> misbehave).
  const tile = "block w-full text-left cursor-pointer group/pl";
  const coverCls = "w-full aspect-square rounded-md overflow-hidden";
  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

  return (
    <div className="dot-grid grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-[11px] p-2 sm:p-[11px]">
      {/* Liked — pinned */}
      <div role="button" tabIndex={0} onClick={onOpenLiked} onKeyDown={onKey(onOpenLiked)} className={tile}>
        <div className={`${coverCls} flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/30 to-[var(--bg-alt)]`}>
          <svg className="w-1/3 h-1/3 text-[var(--text)]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        </div>
        <p className="font-mono text-[12px] uppercase font-bold text-[var(--text)] truncate mt-1.5">{t("playlist.liked")}</p>
        <p className="font-mono text-[10px] uppercase text-[var(--text-muted)] leading-tight">{likedCount} {t("playlist.tracksLabel")}</p>
      </div>

      {/* User playlists */}
      {playlists.map((p) => (
        <div key={p.id} role="button" tabIndex={0} onClick={() => onOpenPlaylist(p.id)} onKeyDown={onKey(() => onOpenPlaylist(p.id))} className={tile}>
          <PlaylistCover cards={p.coverCards} className={coverCls} />
          <p className="font-mono text-[12px] uppercase font-bold text-[var(--text)] truncate mt-1.5">{p.name}</p>
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)] leading-tight">{p.trackCount} {t("playlist.tracksLabel")}</p>
        </div>
      ))}

      {/* New playlist */}
      {creating ? (
        <div>
          <div className={`${coverCls} flex items-center justify-center bg-[var(--bg-alt)]`}>
            <svg className="w-1/4 h-1/4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </div>
          <input
            ref={inputRef} value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setCreating(false); setName(""); } }}
            onBlur={submit} placeholder={t("playlist.namePlaceholder")} maxLength={80}
            className="w-full mt-1.5 bg-transparent border-b border-[var(--border)] font-mono text-[12px] uppercase text-[var(--text)] outline-none"
          />
        </div>
      ) : (
        <div role="button" tabIndex={0} onClick={() => setCreating(true)} onKeyDown={onKey(() => setCreating(true))} className={tile}>
          <div className={`${coverCls} flex items-center justify-center bg-[var(--bg-alt)] group-hover/pl:bg-[var(--bg-card)] transition-colors`}>
            <svg className="w-1/4 h-1/4 text-[var(--text-muted)] group-hover/pl:text-[var(--text)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </div>
          <p className="font-mono text-[12px] uppercase font-bold text-[var(--text-muted)] truncate mt-1.5">{t("playlist.new")}</p>
        </div>
      )}
    </div>
  );
}
