"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useShareActions } from "./useShareActions";

interface Props {
  trackId: string;
  trackName: string;
  channel?: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  preferDown?: boolean;
}

// Short codes inside brackets — terminal-style shorthand
const CODE: Record<string, string> = {
  copy: "cp", whatsapp: "wa", twitter: "x", telegram: "tg", facebook: "fb", instagram: "ig",
};

// V3 — Terminal-zine: display font header, > prompts per row, brackets, mono line items.
// Width 320px, high-contrast black background, underground zine energy.
export default function ShareMenuV3TerminalZine({ trackId, trackName, channel, anchorEl, open, onClose, preferDown }: Props) {
  const { items, openNativeShare, moreLabel, titleLine } = useShareActions(trackId, trackName, channel);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- mount gate for createPortal(document.body)

  useLayoutEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuH = 340, menuW = 320;
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          style={{ top: pos.top, left: pos.left, width: 320 }}
          className="fixed z-[9999] bg-black/95 backdrop-blur-xl border border-[var(--border)]/70 rounded-lg shadow-2xl overflow-hidden"
          role="menu"
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-end justify-between">
              <p className="font-[family-name:var(--font-display)] text-4xl text-white leading-none">share</p>
              <svg className="w-4 h-4 text-white/30 mb-1" viewBox="0 0 32 32">
                <polygon points="8,4 24,4 30,13 16,29 2,13" fill="currentColor" opacity="0.6" />
                <polygon points="12,13 20,13 16,4" fill="currentColor" opacity="0.4" />
                <polygon points="12,13 20,13 16,29" fill="currentColor" opacity="0.25" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-white/40 mt-1 truncate">{">"} {titleLine}</p>
          </div>

          {/* Terminal lines */}
          <div className="py-1">
            {items.map((opt) => {
              const line = (
                <span className="font-mono text-[13px] text-white/80 group-hover/row:text-white transition-colors tabular-nums">
                  <span className="text-white/40">{">"}</span>{" "}
                  <span className="text-white/50">[</span>
                  <span className="text-white/80">{CODE[opt.key]}</span>
                  <span className="text-white/50">]</span>{" "}
                  <span className="lowercase">{opt.label}</span>
                </span>
              );
              const cls = "group/row block px-4 py-1.5 hover:bg-white/5 transition-colors cursor-pointer";
              if (opt.href) return <a key={opt.key} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>{line}</a>;
              return <button key={opt.key} onClick={() => { opt.onClick?.(); onClose(); }} className={`w-full text-left ${cls}`}>{line}</button>;
            })}
          </div>

          {/* Footer command prompt */}
          <button onClick={() => { openNativeShare(); onClose(); }} className="w-full px-4 py-2 border-t border-white/10 text-left font-mono text-[11px] text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer">
            <span className="text-white/30">$</span> {moreLabel.replace(/…$/, "...")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
