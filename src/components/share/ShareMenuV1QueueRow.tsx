"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useShareActions } from "./useShareActions";
import { IconCopy, IconWhatsApp, IconX, IconTelegram, IconFacebook, IconInstagram, IconMore } from "./icons";

interface Props {
  trackId: string;
  trackName: string;
  channel?: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  preferDown?: boolean;
}

const ICON_BY_KEY = {
  copy: IconCopy, whatsapp: IconWhatsApp, twitter: IconX, telegram: IconTelegram, facebook: IconFacebook, instagram: IconInstagram,
} as const;

// V1 — Queue-row: narrow vertical list matching Queue panel language.
// Width 180px, rows with mono 11px uppercase tracking-wider, subtle separators.
export default function ShareMenuV1QueueRow({ trackId, trackName, channel, anchorEl, open, onClose, preferDown }: Props) {
  const { items, openNativeShare, moreLabel } = useShareActions(trackId, trackName, channel);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- mount gate for createPortal(document.body)

  useLayoutEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuH = 312, menuW = 180;
    let top = preferDown ? rect.bottom + 10 : rect.top - menuH - 10;
    if (top < 8) top = rect.bottom + 10;
    let left = rect.left + rect.width / 2 - menuW / 2;
    left = Math.max(8, Math.min(window.innerWidth - menuW - 8, left));
    setPos({ top, left }); // eslint-disable-line react-hooks/set-state-in-effect -- layout measurement
  }, [open, anchorEl, preferDown]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && e.target !== anchorEl && !anchorEl?.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, [open, onClose, anchorEl]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ top: pos.top, left: pos.left, width: 180 }}
          className="fixed z-[9999] bg-[var(--bg-alt)]/40 backdrop-blur-md border border-[var(--border)]/50 rounded-xl shadow-2xl overflow-hidden"
          role="menu"
        >
          {items.map((opt, i) => {
            const Icon = ICON_BY_KEY[opt.key];
            const row = (
              <>
                <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[var(--text)]/70">
                  <span className="block w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{Icon}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text)]/90 font-bold">{opt.label}</span>
              </>
            );
            const base = `flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--text)]/8 transition-colors cursor-pointer ${i < items.length - 1 ? "border-b border-[var(--text)]/8" : ""}`;
            if (opt.href) {
              return <a key={opt.key} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={base} role="menuitem">{row}</a>;
            }
            return <button key={opt.key} onClick={() => { opt.onClick?.(); onClose(); }} className={`w-full text-left ${base}`} role="menuitem">{row}</button>;
          })}
          <button onClick={() => { openNativeShare(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-2 border-t border-[var(--text)]/10 hover:bg-[var(--text)]/8 transition-colors cursor-pointer text-left" role="menuitem">
            <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[var(--text-muted)]">
              <span className="block w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{IconMore}</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{moreLabel}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
