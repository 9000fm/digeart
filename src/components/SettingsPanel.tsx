"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/components/LanguageProvider";
import { LOCALES } from "@/lib/i18n";

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
  const { t, locale, setLocale } = useTranslation();
  const isAuthenticated = !!session?.user;
  const [langOpen, setLangOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleClose = () => { setLangOpen(false); onClose(); };
  const LANG_LABELS: Record<string, string> = { es: "Español", en: "English", fr: "Français", ja: "日本語", ru: "Русский" };
  const LANG_CODES: Record<string, string> = { es: "ES", en: "EN", fr: "FR", ja: "JP", ru: "RU" };

  // Close on outside click or Escape — NO blocking overlay, so the sidebar
  // stays fully hoverable while the panel is open (matches the About panel).
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      // Ignore the triggers that open Settings (gear + auth dropdown items),
      // so clicking them doesn't close-then-reopen.
      if ((target as HTMLElement)?.closest?.("[data-settings-trigger]")) return;
      handleClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);


  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Floating card — anchored to gear icon */}
          <div
            ref={panelRef}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="relative px-3 py-2.5 flex items-center after:content-[''] after:absolute after:inset-x-3 after:bottom-0 after:border-b after:border-[var(--border)]">
              <h2 className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {t("settings.title")}
              </h2>
            </div>

            <div className="px-3 py-1 [&>*]:py-2">
              {/* Theme toggle — always visible */}
              <div className="flex items-center justify-between cursor-pointer" onClick={toggleTheme}>
                <span className="font-mono text-[var(--text)]" style={{ fontSize: 13 }}>
                  {t("settings.theme")}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                  style={{ fontSize: 12 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                >
                  {theme === "dark" ? `☾ ${t("settings.dark")}` : `☀ ${t("settings.light")}`}
                </button>
              </div>

              {/* Language picker — always visible */}
              <div>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setLangOpen((v) => !v)}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 13 }}>
                    {t("settings.language")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }}
                    style={{ fontSize: 12 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                  >
                    {LANG_CODES[locale]}
                  </button>
                </div>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1.5 bg-[var(--bg)] border border-[var(--border)]/50 rounded-lg py-1">
                        {LOCALES.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => { setLocale(loc); setLangOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-1 font-mono transition-colors ${locale === loc ? "text-[var(--text)] font-bold bg-[var(--border)]/30" : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/20"}`}
                            style={{ fontSize: 12 }}
                          >
                            <span style={{ fontFamily: "system-ui, sans-serif" }}>{LANG_LABELS[loc]}</span>
                            <span className="font-mono font-bold">{LANG_CODES[loc]}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* About — mobile/tablet only (desktop has sidebar info button) */}
              {onOpenInfo && (
                <div className="min-[1152px]:hidden flex items-center justify-between cursor-pointer" onClick={() => { onOpenInfo(); onClose(); }}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 13 }}>
                    {t("settings.about")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenInfo(); onClose(); }}
                    style={{ fontSize: 12 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                  >
                    {t("settings.view")}
                  </button>
                </div>
              )}

              {/* Speed toggle — auth only, desktop/tablet */}
              {onToggleDjMode && (
                <div className={`hidden min-[1152px]:flex items-center justify-between ${!isAuthenticated ? "opacity-40 pointer-events-none" : ""}`}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 13 }}>
                    {t("settings.speedAdjust")} <span className="text-[var(--text-muted)]">(beta)</span>
                  </span>
                  <button
                    onClick={onToggleDjMode}
                    style={{ fontSize: 12 }}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono active:scale-95 transition-all duration-100 ${
                      djMode
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                        : "bg-[var(--bg-alt)] text-[var(--text)] border-[var(--border)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {djMode ? t("settings.on") : t("settings.off")}
                  </button>
                </div>
              )}

              {/* Tutorial — auth only */}
              {onRunTutorial && (
                <div className={`flex items-center justify-between ${!isAuthenticated ? "opacity-40 pointer-events-none" : ""}`}>
                  <span className="font-mono text-[var(--text)]" style={{ fontSize: 13 }}>
                    {t("settings.tutorial")}
                  </span>
                  <button
                    onClick={() => { onRunTutorial(); onClose(); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-alt)] border border-[var(--border)] font-mono text-[var(--text)] hover:border-[var(--text-muted)] active:scale-95 transition-all duration-100"
                    style={{ fontSize: 12 }}
                  >
                    {t("settings.run")}
                  </button>
                </div>
              )}

              {/* Sign in CTA for non-auth */}
              {!isAuthenticated && (
                <p className="font-mono text-[var(--text-muted)]" style={{ fontSize: 12 }}>
                  {t("settings.signInToUnlock")}
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
