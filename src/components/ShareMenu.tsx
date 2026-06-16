"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/LanguageProvider";
import { useShareActions } from "@/components/share/useShareActions";
import {
  IconCopy,
  IconWhatsApp,
  IconX,
  IconTelegram,
  IconFacebook,
  IconMore,
  IconShare,
} from "@/components/share/icons";

interface Props {
  trackId: string;
  trackName: string;
  channel?: string;
  youtubeUrl?: string | null;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const ICON_BY_KEY = {
  copy: IconCopy,
  whatsapp: IconWhatsApp,
  twitter: IconX,
  telegram: IconTelegram,
  facebook: IconFacebook,
} as const;

export default function ShareMenu({ trackId, trackName, channel, youtubeUrl, anchorEl, open, onClose }: Props) {
  const { t } = useTranslation();
  const { items, openNativeShare, moreLabel } = useShareActions(trackId, trackName, channel, youtubeUrl);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Auto-dismiss: close a few seconds after the pointer is away from the menu.
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelDismiss = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }
  }, []);
  const startDismiss = useCallback(() => {
    cancelDismiss();
    dismissTimer.current = setTimeout(() => onClose(), 3500);
  }, [cancelDismiss, onClose]);
  useEffect(() => {
    if (!open) { cancelDismiss(); return; }
    startDismiss(); // also closes if opened and never hovered
    return cancelDismiss;
  }, [open, startDismiss, cancelDismiss]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- mount gate for createPortal(document.body)

  // Robust positioning:
  // - Player share button (bottom of viewport): open ABOVE, centered on button
  // - MusicCard share button (anywhere in grid, on hover): open ABOVE if room,
  //   otherwise BELOW. Never hide behind the fixed player (bottom safe area
  //   subtracts --player-height). Horizontal always clamped to 8px of any edge.
  const computePosition = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 352;
    const menuW = 200;
    const gap = 8;
    const edge = 8;

    // Subtract the fixed player height from the bottom safe area
    const playerVar = getComputedStyle(document.documentElement).getPropertyValue("--player-height");
    const playerH = parseInt(playerVar || "0", 10) || 0;
    const vpTop = edge;
    const vpBottom = window.innerHeight - Math.max(playerH, 0) - edge;

    const spaceAbove = rect.top - vpTop;
    const spaceBelow = vpBottom - rect.bottom;

    // Vertical: prefer ABOVE (standard dropdown from action-bar button).
    // Flip BELOW if above can't fit. If neither fits, clamp to whichever side has more space.
    let top: number;
    if (spaceAbove >= menuH + gap) {
      top = rect.top - menuH - gap;
    } else if (spaceBelow >= menuH + gap) {
      top = rect.bottom + gap;
    } else if (spaceAbove >= spaceBelow) {
      top = vpTop;
    } else {
      top = vpBottom - menuH;
    }

    // Horizontal: center on the anchor, then clamp to viewport with 8px edge
    let left = rect.left + rect.width / 2 - menuW / 2;
    left = Math.max(edge, Math.min(window.innerWidth - menuW - edge, left));

    setPos({ top, left });
  }, [anchorEl]);

  useLayoutEffect(() => {
    if (!open) return;
    // First pass uses the estimated height (menuRef may be null on first render).
    // Second pass after paint uses the real measured height for a pixel-accurate placement.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement needs sync setState
    computePosition();
    const raf = requestAnimationFrame(() => computePosition());
    return () => cancelAnimationFrame(raf);
  }, [open, computePosition]);

  // Reposition on resize + scroll (capture to catch nested scrollers too)
  useEffect(() => {
    if (!open) return;
    const handler = () => computePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && e.target !== anchorEl && !anchorEl?.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorEl]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6 }}
          animate={pos ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onMouseEnter={cancelDismiss}
          onMouseLeave={startDismiss}
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: 200, visibility: pos ? "visible" : "hidden" }}
          className="fixed z-[9999] bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl shadow-2xl overflow-hidden"
          role="menu"
        >
          {/* Title header — "COMPARTIR" on line 1, track name on line 2, divider below */}
          <div className="relative px-3 py-2.5 min-w-0 after:content-[''] after:absolute after:inset-x-3 after:bottom-0 after:border-b after:border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 w-3 h-3 flex items-center justify-center text-[var(--text-secondary)] [&>svg]:w-3 [&>svg]:h-3">
                {IconShare}
              </span>
              <span className="font-mono text-[11px] uppercase font-bold tracking-[0.15em] text-[var(--text-secondary)]">{t("share.action")}</span>
            </div>
            {trackName ? (
              <p className="font-mono text-[11px] uppercase font-bold text-[var(--text)] truncate min-w-0 mt-1">{trackName}</p>
            ) : null}
          </div>

          {/* Platform rows */}
          {items.map((opt, i) => {
            const Icon = ICON_BY_KEY[opt.key];
            const row = (
              <>
                <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[var(--text-secondary)]">
                  <span className="block w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{Icon}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text)] font-bold">
                  {opt.label}
                </span>
              </>
            );
            const base = `flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--text)]/8 transition-colors cursor-pointer`;
            if (opt.href) {
              return (
                <a
                  key={opt.key}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={base}
                  role="menuitem"
                >
                  {row}
                </a>
              );
            }
            return (
              <button
                key={opt.key}
                onClick={() => { opt.onClick?.(); onClose(); }}
                className={`w-full text-left ${base}`}
                role="menuitem"
              >
                {row}
              </button>
            );
          })}

          {/* More options row */}
          <button
            onClick={() => { openNativeShare(); onClose(); }}
            className="relative w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--text)]/8 transition-colors cursor-pointer text-left before:content-[''] before:absolute before:inset-x-3 before:top-0 before:border-t before:border-[var(--border)]"
            role="menuitem"
          >
            <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[var(--text-muted)]">
              <span className="block w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{IconMore}</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
              {moreLabel}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
