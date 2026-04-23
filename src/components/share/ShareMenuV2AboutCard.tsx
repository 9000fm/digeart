"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useShareActions } from "./useShareActions";
import { IconCopy, IconWhatsApp, IconX, IconTelegram, IconFacebook, IconInstagram } from "./icons";

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

const BRAND_DOT: Record<string, string> = {
  copy: "rgba(255,255,255,0.7)",
  whatsapp: "#25D366",
  twitter: "rgba(255,255,255,0.95)",
  telegram: "#229ED9",
  facebook: "#1877F2",
  instagram: "#E1306C",
};

// V2 — About-card: matches About panel visual language. 280px, section header with
// gem divider, pills grid 2x3, tracking-widest uppercase, body 11px mono.
export default function ShareMenuV2AboutCard({ trackId, trackName, channel, anchorEl, open, onClose, preferDown }: Props) {
  const { items, openNativeShare, moreLabel } = useShareActions(trackId, trackName, channel);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- mount gate for createPortal(document.body)

  useLayoutEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuH = 260, menuW = 280;
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
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{ top: pos.top, left: pos.left, width: 280 }}
          className="fixed z-[9999] px-3 py-2.5 bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl shadow-2xl"
          role="menu"
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-[var(--text-secondary)]" viewBox="0 0 32 32">
              <polygon points="8,4 24,4 30,13 16,29 2,13" fill="currentColor" opacity="0.5" />
              <polygon points="12,13 20,13 16,4" fill="currentColor" opacity="0.4" />
              <polygon points="12,13 20,13 16,29" fill="currentColor" opacity="0.25" />
            </svg>
            <p className="font-mono text-[13px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Compartir</p>
          </div>

          {/* Pills grid 2 cols × 3 rows — matches About panel's grid-cols-[auto_1fr] density */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[var(--border)]/30">
            {items.map((opt) => {
              const Icon = ICON_BY_KEY[opt.key];
              const content = (
                <>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1 h-1 rounded-full" style={{ background: BRAND_DOT[opt.key] }} />
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-[var(--text-muted)] [&>svg]:w-3.5 [&>svg]:h-3.5">{Icon}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)] font-bold tracking-wider truncate">{opt.label}</span>
                </>
              );
              const cls = "flex items-center gap-2 px-2.5 py-1.5 rounded bg-[var(--text)]/5 hover:bg-[var(--text)]/10 border border-[var(--border)]/30 transition-colors cursor-pointer";
              if (opt.href) return <a key={opt.key} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>{content}</a>;
              return <button key={opt.key} onClick={() => { opt.onClick?.(); onClose(); }} className={`${cls} text-left`}>{content}</button>;
            })}
          </div>

          {/* Footer link */}
          <div className="mt-2 pt-1.5 border-t border-[var(--border)]/30">
            <button onClick={() => { openNativeShare(); onClose(); }} className="w-full font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] tracking-wider transition-colors cursor-pointer text-center">
              {moreLabel}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
