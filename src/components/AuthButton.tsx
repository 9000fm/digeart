"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "@/components/LanguageProvider";
import { LOCALES } from "@/lib/i18n";

interface AuthButtonProps {
  onGoToSaved?: () => void;
  onOpenSettings?: () => void;
  onOpenInfo?: () => void;
}

export default function AuthButton({ onGoToSaved, onOpenSettings, onOpenInfo }: AuthButtonProps) {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1152;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 10);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (status === "loading") return null;

  const themeRow = (
    <div className="w-full flex items-center justify-between px-4 py-2 font-mono text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
      <span className="flex items-center gap-2.5">
        {theme === "dark" ? (
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
        {t("auth.theme")}
      </span>
      <div className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${theme === "dark" ? "bg-[var(--text)]" : "bg-[var(--text-secondary)]"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${theme === "dark" ? "left-3.5 bg-[var(--bg)]" : "left-0.5 bg-[var(--bg)]"}`} />
      </div>
    </div>
  );

  const langRow = (
    <div className="w-full flex items-center justify-between px-4 py-2 font-mono text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setLocale(LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]); }}>
      <span className="flex items-center gap-2.5">
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        {t("settings.language")}
      </span>
      <span className="font-mono font-bold text-[var(--text)]" style={{ fontSize: 10 }}>
        {locale.toUpperCase()}
      </span>
    </div>
  );

  // ─── Logged-in state ───
  if (session?.user) {
    const avatar = session.user.image ? (
      <img
        src={session.user.image}
        alt=""
        className="w-10 h-10 rounded-full shrink-0"
        referrerPolicy="no-referrer"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-[var(--bg-alt)] shrink-0 flex items-center justify-center text-base font-bold text-[var(--text)]">
        {session.user.name?.[0]?.toUpperCase() || "?"}
      </div>
    );

    const firstName = session.user.name?.split(" ")[0] || "Profile";

    return (
      <div ref={ref} className="relative flex items-center gap-1">
        <div className="relative group/avatar flex items-center">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`shrink-0 flex items-center gap-0.5 h-12 px-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[var(--bg-alt)] ${open ? "bg-[var(--bg-alt)]" : ""}`}
          >
            {avatar}
            <svg className="w-3.5 h-3.5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] rounded-md font-mono text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover/avatar:opacity-100 transition-opacity duration-150 z-50 hidden lg:block">
            {firstName}
          </div>
        </div>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl z-[70] py-2 overflow-hidden">
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-11 h-11 rounded-full shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[var(--bg-alt)] shrink-0 flex items-center justify-center text-base font-bold text-[var(--text)]">
                  {session.user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-mono text-sm text-[var(--text)] font-medium truncate">{session.user.name}</p>
                <p className="font-mono text-[11px] text-[var(--text-muted)] truncate">{session.user.email}</p>
              </div>
            </div>

            {/* Menu items — adaptive: full on tablet/mobile, minimal on desktop */}
            {!isDesktop && (
              <div className="py-1">
                {themeRow}
                {langRow}
                {onOpenInfo && (
                  <button
                    onClick={() => { onOpenInfo(); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 font-mono text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                    style={{ fontSize: 11 }}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
                    </svg>
                    {t("auth.about")}
                  </button>
                )}
              </div>
            )}

            {/* Saved tracks */}
            {onGoToSaved && (
              <div className="border-t border-[var(--border)] pt-1">
                <button
                  onClick={() => { onGoToSaved(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 font-mono text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                  style={{ fontSize: 11 }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  {t("auth.savedTracks")}
                </button>
              </div>
            )}

            {/* Sign out */}
            <div className="border-t border-[var(--border)] pt-1">
              <button
                onClick={() => { signOut(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 font-mono text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                style={{ fontSize: 11 }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t("auth.signOut")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Logged-out state ───
  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <div className="relative group/avatar flex items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`shrink-0 flex items-center gap-0.5 h-12 px-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer transition-all duration-200 hover:bg-[var(--bg-alt)] ${open ? "bg-[var(--bg-alt)]" : ""}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] rounded-md font-mono text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover/avatar:opacity-100 transition-opacity duration-150 z-50 hidden lg:block">
          {t("auth.signIn")}
        </div>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl z-[70] py-2 overflow-hidden">
          {/* Non-auth: full on tablet/mobile, minimal on desktop */}
          {!isDesktop && (
            <div className="py-1">
              {themeRow}
              {langRow}
              {onOpenInfo && (
                <button
                  onClick={() => { onOpenInfo(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 font-mono text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                  style={{ fontSize: 11 }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <circle cx="12" cy="8" r="0.5" fill="currentColor" />
                  </svg>
                  {t("auth.about")}
                </button>
              )}
            </div>
          )}

          {/* Sign in */}
          <div className="border-t border-[var(--border)] pt-2 px-4 pb-1">
            <button
              onClick={() => { signIn("google"); setOpen(false); }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[var(--border)]/50 hover:bg-[var(--border)] text-[var(--text)] rounded-lg font-mono font-medium transition-colors"
              style={{ fontSize: 11 }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("auth.signInWithGoogle")}
            </button>
            <p className="font-mono text-[var(--text-muted)] text-center mt-2" style={{ fontSize: 9 }}>
              {t("auth.saveTracksSync")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
