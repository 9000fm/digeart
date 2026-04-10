"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface UndoItem {
  id: number;
  trackId: string;
  trackName: string;
  createdAt: number;
}

interface UndoToastPileProps {
  items: UndoItem[];
  onUndo: (item: UndoItem) => void;
  duration?: number;
  playerVisible?: boolean;
}

function UndoToastItem({ item, onUndo, duration }: {
  item: UndoItem;
  onUndo: (item: UndoItem) => void;
  duration: number;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - item.createdAt;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item.createdAt, duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[var(--bg-alt)]/90 backdrop-blur-xl border border-[var(--border)]/50 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] leading-tight">
            Removed
          </span>
          <span className="font-mono text-[11px] text-[var(--text)] truncate max-w-[160px] sm:max-w-[200px] leading-tight">
            {item.trackName}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onUndo(item); }}
          className="shrink-0 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text)] bg-[var(--text)]/10 hover:bg-[var(--text)]/20 rounded-md transition-colors cursor-pointer"
        >
          Undo
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text)]/5 rounded-b-lg overflow-hidden">
        <div className="h-full bg-[var(--text)]/25" style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  );
}

export default function UndoToast({ items, onUndo, duration = 5000, playerVisible = false }: UndoToastPileProps) {
  if (items.length === 0) return null;

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 z-50 min-[1152px]:left-[calc(var(--sidebar-width)/2+50%)] ${playerVisible ? "bottom-[calc(var(--player-height,0px)+12px)]" : "bottom-3"} flex flex-col-reverse gap-2`}>
      <AnimatePresence>
        {items.map((item) => (
          <UndoToastItem key={item.id} item={item} onUndo={onUndo} duration={duration} />
        ))}
      </AnimatePresence>
    </div>
  );
}
