"use client";

import { useEffect, useRef, useState } from "react";
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
}

const ICON_BY_KEY = {
  copy: IconCopy, whatsapp: IconWhatsApp, twitter: IconX, telegram: IconTelegram, facebook: IconFacebook, instagram: IconInstagram,
} as const;

const BRAND_BG: Record<string, string> = {
  copy: "rgba(255,255,255,0.08)",
  whatsapp: "rgba(37,211,102,0.12)",
  twitter: "rgba(255,255,255,0.08)",
  telegram: "rgba(34,158,217,0.14)",
  facebook: "rgba(24,119,242,0.14)",
  instagram: "rgba(225,48,108,0.14)",
};
const BRAND_FG: Record<string, string> = {
  copy: "rgba(255,255,255,0.85)",
  whatsapp: "#25D366",
  twitter: "rgba(255,255,255,0.95)",
  telegram: "#55B5E0",
  facebook: "#4A8FF0",
  instagram: "#E85D92",
};

// V4 — Glass-grid: centered modal, backdrop blur, 3x2 grid with large brand-tinted
// circular icon tiles + labels. Width 340px. Close X top-right. "Más opciones" as ghost button.
export default function ShareMenuV4GlassGrid({ trackId, trackName, channel, anchorEl: _anchorEl, open, onClose }: Props) {
  const { items, openNativeShare, moreLabel, titleLine } = useShareActions(trackId, trackName, channel);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect -- mount gate for createPortal(document.body)

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="v4-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="v4-card"
            ref={cardRef}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[340px] bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl shadow-2xl px-5 pt-4 pb-5"
            role="dialog"
            aria-modal="true"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[12px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Compartir</p>
              <button onClick={onClose} aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--text)]/50 hover:bg-[var(--text)]/10 hover:text-[var(--text)] active:scale-90 transition-all duration-75 cursor-pointer">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="font-mono text-[10px] text-[var(--text-muted)] mb-4 truncate">{titleLine}</p>

            {/* Grid 3x2 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {items.map((opt) => {
                const Icon = ICON_BY_KEY[opt.key];
                const tile = (
                  <>
                    <span
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover/tile:scale-105"
                      style={{ background: BRAND_BG[opt.key], color: BRAND_FG[opt.key] }}
                    >
                      <span className="w-6 h-6 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">{Icon}</span>
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)] mt-1.5 tracking-wider truncate max-w-full">{opt.label}</span>
                  </>
                );
                const cls = "group/tile flex flex-col items-center justify-center cursor-pointer";
                if (opt.href) return <a key={opt.key} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>{tile}</a>;
                return <button key={opt.key} onClick={() => { opt.onClick?.(); onClose(); }} className={cls}>{tile}</button>;
              })}
            </div>

            {/* More options ghost button */}
            <button onClick={() => { openNativeShare(); onClose(); }} className="w-full py-2 rounded-lg border border-[var(--border)]/40 font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]/70 hover:bg-[var(--text)]/5 transition-colors cursor-pointer">
              {moreLabel}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
