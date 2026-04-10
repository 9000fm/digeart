"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RejectModalProps {
  open: boolean;
  channelName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RejectModal({ open, channelName, onCancel, onConfirm }: RejectModalProps) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl p-6 font-mono"
          >
            {/* Close X */}
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              aria-label="Cancel"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
              Confirm reject
            </h2>
            <p className="text-base text-[var(--text)] mb-1 break-words">
              Reject <span className="font-bold">&quot;{channelName}&quot;</span>?
            </p>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-6">
              Moves it from approved to rejected. You can rescue it later.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)] rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:scale-[0.97] rounded-lg transition-all"
                autoFocus
              >
                × Reject
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
