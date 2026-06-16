"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "./LanguageProvider";

interface TrackActionsMenuProps {
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void; // undefined → row shown disabled ("soon")
  /** Extra classes for the trigger button (controls hover/opacity per surface). */
  triggerClassName?: string;
}

// Single "track actions" trigger → small menu: Play Next / Add to Queue /
// Add to Playlist. Reused on cards, player and queue. Labels disambiguate the
// rows so the leading glyphs can stay in the same family.
export default function TrackActionsMenu({ onPlayNext, onAddToQueue, onAddToPlaylist, triggerClassName = "" }: TrackActionsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_W = 216;

  const openMenu = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Open above the button, right-aligned to it; clamp into the viewport.
    const left = Math.min(Math.max(8, rect.right - MENU_W), window.innerWidth - MENU_W - 8);
    const top = rect.top - 8; // menu's bottom sits here (translateY -100%)
    setPos({ left, top });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const run = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    fn?.();
  };

  const rowClass = "w-full flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-left whitespace-nowrap transition-colors";

  const menu = open && pos && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[95] rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl overflow-hidden py-1"
          style={{ left: pos.left, top: pos.top, width: MENU_W, transform: "translateY(-100%)" }}
        >
          <button onClick={run(onPlayNext)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="14" y2="7" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="17" x2="11" y2="17" /><polygon points="17 8 17 18 23 13" fill="currentColor" stroke="none" />
            </svg>
            {t("card.playNext")}
          </button>
          <button onClick={run(onAddToQueue)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="16" y2="7" /><line x1="4" y1="12" x2="16" y2="12" /><line x1="4" y1="17" x2="11" y2="17" /><line x1="18" y1="14" x2="18" y2="20" /><line x1="15" y1="17" x2="21" y2="17" />
            </svg>
            {t("card.addToQueue")}
          </button>
          {onAddToPlaylist ? (
            <button onClick={run(onAddToPlaylist)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="16" y2="7" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="17" x2="12" y2="17" /><line x1="18" y1="10" x2="18" y2="20" /><line x1="13" y1="15" x2="23" y2="15" />
              </svg>
              {t("card.addToPlaylist")}
            </button>
          ) : (
            <div className={`${rowClass} text-[var(--text-muted)] cursor-default justify-between`}>
              <span className="flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="7" x2="16" y2="7" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="17" x2="12" y2="17" /><line x1="18" y1="10" x2="18" y2="20" /><line x1="13" y1="15" x2="23" y2="15" />
                </svg>
                {t("card.addToPlaylist")}
              </span>
              <span className="text-[8px] tracking-widest opacity-70">{t("card.soon")}</span>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        aria-label={t("card.moreActions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); if (open) setOpen(false); else openMenu(); }}
        className={triggerClassName}
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="7" x2="15" y2="7" /><line x1="4" y1="12" x2="15" y2="12" /><line x1="4" y1="17" x2="11" y2="17" /><line x1="18" y1="13" x2="18" y2="21" /><line x1="14" y1="17" x2="22" y2="17" />
        </svg>
      </button>
      {menu}
    </>
  );
}
