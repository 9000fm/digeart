"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "./LanguageProvider";
import PlaylistCover from "./PlaylistCover";
import type { CardData, Playlist } from "@/lib/types";

// Centered modal: pick an existing playlist or create one, to add `card` to.
// Mounted once in page.tsx; opened by setting the card (null = closed).
export default function AddToPlaylistMenu({
  card,
  playlists,
  onAdd,
  onCreate,
  onClose,
}: {
  card: CardData | null;
  playlists: Playlist[];
  onAdd: (playlistId: string, card: CardData) => Promise<boolean> | void;
  onCreate: (name: string) => Promise<Playlist | null>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!card) { setCreating(false); setName(""); setBusy(false); }
  }, [card]);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  const pick = async (playlistId: string) => {
    if (!card || busy) return;
    setBusy(true);
    await onAdd(playlistId, card);
    onClose();
  };

  const submitNew = async () => {
    const clean = name.trim();
    if (!clean || !card || busy) return;
    setBusy(true);
    const pl = await onCreate(clean);
    if (pl) await onAdd(pl.id, card);
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-[340px] max-h-[70vh] flex flex-col rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-[var(--border)]/40">
              <img src={card.imageSmall || card.image} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] leading-tight">{t("playlist.choose")}</p>
                <p className="font-mono text-[12px] uppercase font-bold text-[var(--text)] truncate leading-tight">{card.name}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain py-1">
              {/* New playlist row */}
              {creating ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
                    placeholder={t("playlist.namePlaceholder")}
                    maxLength={80}
                    className="flex-1 min-w-0 bg-[var(--bg)] border border-[var(--border)]/60 rounded-lg px-3 py-2 font-mono text-[12px] text-[var(--text)] outline-none focus:border-[var(--accent)]/60"
                  />
                  <button
                    onClick={submitNew}
                    disabled={!name.trim() || busy}
                    className="shrink-0 px-3 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider bg-[var(--text)] text-[var(--bg)] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    {t("playlist.create")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--accent)]/12 transition-colors cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-md bg-[var(--bg)] border border-dashed border-[var(--border)] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-wider text-[var(--text)] font-bold">{t("playlist.new")}</span>
                </button>
              )}

              {/* Existing playlists */}
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  disabled={busy}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--accent)]/12 transition-colors cursor-pointer text-left"
                >
                  <PlaylistCover cards={p.coverCards} className="w-10 h-10 rounded-md shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] uppercase truncate text-[var(--text)] leading-tight">{p.name}</p>
                    <p className="font-mono text-[10px] uppercase text-[var(--text-muted)] leading-tight">{p.trackCount} {t("playlist.tracksLabel")}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
