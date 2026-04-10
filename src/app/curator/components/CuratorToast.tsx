"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCuratorToast } from "../hooks/useCuratorToast";

export function CuratorToastPile() {
  const { toasts, dismiss } = useCuratorToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-lg border shadow-lg backdrop-blur-xl font-mono text-[11px] uppercase tracking-wider min-w-[220px] max-w-[360px] ${
              t.variant === "error"
                ? "bg-[var(--bg-alt)]/95 border-[var(--text)]/40 text-[var(--text)]"
                : t.variant === "success"
                  ? "bg-[var(--text)] border-[var(--text)] text-[var(--bg)]"
                  : "bg-[var(--bg-alt)]/95 border-[var(--border)] text-[var(--text)]"
            }`}
          >
            <span className="flex-1 truncate font-bold">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 w-4 h-4 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
