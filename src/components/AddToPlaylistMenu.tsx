"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFloating, autoUpdate, offset, flip, shift, size, type ReferenceType } from "@floating-ui/react";
import { useTranslation } from "./LanguageProvider";
import PlaylistCover from "./PlaylistCover";
import type { CardData, Playlist } from "@/lib/types";

// Centered modal: pick an existing playlist or create one, to add `card` to.
// Mounted once in page.tsx; opened by setting the card (null = closed).
export default function AddToPlaylistMenu({
  card,
  anchor,
  playlists,
  onAdd,
  onCreate,
  onClose,
}: {
  card: CardData | null;
  anchor?: { x: number; y: number; el: HTMLElement | null } | null;
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

  // Reset the create-form when the menu closes (card cleared) — in cleanup so the
  // setState isn't synchronous in the effect body.
  useEffect(() => {
    if (!card) return;
    return () => { setCreating(false); setName(""); setBusy(false); };
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

  const MENU_W = 300;

  // Reference = the trigger element (so the popup follows it on resize/scroll), or a
  // virtual element at the click point if the trigger is gone (opened from the ⋮ menu,
  // which closes itself). Floating UI handles flip (open up near the bottom edge),
  // shift (stay in viewport) and size (cap height) — no hand-rolled positioning.
  const reference = useMemo<ReferenceType | null>(() => {
    if (!anchor) return null;
    if (anchor.el && typeof document !== "undefined" && document.contains(anchor.el)) return anchor.el;
    const { x, y } = anchor;
    return { getBoundingClientRect: () => ({ width: 0, height: 0, x, y, top: y, left: x, right: x, bottom: y }) as DOMRect };
  }, [anchor]);

  const { refs, floatingStyles } = useFloating<ReferenceType>({
    open: !!card,
    strategy: "fixed",
    // top/left positioning (not transform) so framer-motion's scale animation on the
    // same element doesn't overwrite Floating UI's translate and drop it to 0,0.
    transform: false,
    placement: "bottom-start",
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(availableHeight, Math.round(window.innerHeight * 0.7))}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // setReference (not setPositionReference) so whileElementsMounted=autoUpdate fires
  // and the popup actually positions. With <ReferenceType> it accepts a real element
  // OR the virtual click-point element (fallback when opened from the ⋮ menu).
  useEffect(() => { refs.setReference(reference); }, [reference, refs]);
  // Floating UI's refs are stable setter callbacks, not React refs — the rule misfires.
   
  const { setFloating } = refs;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
        >
          <motion.div
            ref={setFloating}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ ...floatingStyles, width: MENU_W }}
            className="flex flex-col rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl overflow-hidden"
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
                  <span className="w-10 h-10 rounded-md bg-[var(--bg)] border border-[var(--border)]/60 flex items-center justify-center shrink-0">
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
