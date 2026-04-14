"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useSession } from "next-auth/react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  onRunTutorial?: () => void;
  djMode?: boolean;
  onToggleDjMode?: () => void;
  onOpenInfo?: () => void;
}

export default function SettingsPanel({ open, onClose, anchorRect, onRunTutorial, djMode, onToggleDjMode, onOpenInfo }: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);


  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — subtle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70]"
            onClick={onClose}
          />

          {/* Floating card — anchored to gear icon */}
          <div
            className="fixed z-[80] w-[240px]"
            style={
              anchorRect
                ? anchorRect.left > window.innerWidth / 2
                  ? {
                      top: anchorRect.bottom + 8,
                      right: Math.max(16, window.innerWidth - anchorRect.right),
                    }
                  : {
                      top: anchorRect.top - 8,
                      left: anchorRect.right + 12,
                      transform: "translateY(-100%)",
                    }
                : {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-mono text-[9px] font-bold text-[var(--text)] uppercase tracking-widest">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {/* Theme toggle — always visible */}
              <div className="flex items-center justify-between cursor-pointer" onClick={toggleTheme}>
                <span className="font-mono text-[var(--text)]" style={{ fontSize: 11 }}>
                  Theme
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                  style={{ fontSize: 9 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                >
                  {theme === "dark" ? "☾ Dark" : "☀ Light"}
                </button>
              </div>

              {/* About — always visible */}
              {onOpenInfo && (
                <div className="flex items-center justify-between cursor-pointer" onClick={() => { onOpenInfo(); onClose(); }}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 11 }}>
                    About
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenInfo(); onClose(); }}
                    style={{ fontSize: 9 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                  >
                    View
                  </button>
                </div>
              )}

              {/* Speed toggle — auth only, desktop/tablet */}
              {onToggleDjMode && (
                <div className={`hidden min-[1152px]:flex items-center justify-between ${!isAuthenticated ? "opacity-40 pointer-events-none" : ""}`}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 11 }}>
                    Speed Adjust
                  </span>
                  <button
                    onClick={onToggleDjMode}
                    style={{ fontSize: 9 }}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono active:scale-95 transition-all duration-100 ${
                      djMode
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                        : "bg-[var(--bg-alt)] text-[var(--text)] border-[var(--border)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {djMode ? "On" : "Off"}
                  </button>
                </div>
              )}

              {/* Tutorial — auth only */}
              {onRunTutorial && (
                <div className={`flex items-center justify-between ${!isAuthenticated ? "opacity-40 pointer-events-none" : ""}`}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 11 }}>
                    Tutorial
                  </span>
                  <button
                    onClick={() => { onRunTutorial(); onClose(); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                    style={{ fontSize: 9 }}
                  >
                    Run
                  </button>
                </div>
              )}

              {/* Sign in CTA for non-auth */}
              {!isAuthenticated && (
                <p className="font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/30" style={{ fontSize: 9 }}>
                  Sign in to unlock
                </p>
              )}
            </div>


          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
